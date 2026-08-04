import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const getToolStatus = (status, results) => {
  if (status === 'failed' || status === 'error') return 'failed';
  if (results) {
    const str = typeof results === 'string' ? results : JSON.stringify(results);
    if (/error|failed/i.test(str)) return 'failed';
    if (typeof results === 'object' && results.success === false) return 'failed';
  }
  if (['completed', 'success'].includes(status)) return 'success';
  return 'pending';
};

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = getToolStatus(toolCall.status, toolCall.results);
  const proj = toolCall.display_projection || {};
  const hideDetails = proj.hide_details && proj.details_redacted;

  const label =
    status === 'success'
      ? (proj.label || toolCall.name || 'Done')
      : status === 'failed'
      ? (proj.error_label || `${toolCall.name || 'Action'} failed`)
      : (proj.active_label || 'Working...');

  const Icon = status === 'success' ? CheckCircle2 : status === 'failed' ? XCircle : Loader2;
  const iconColor =
    status === 'success' ? 'text-green-500' : status === 'failed' ? 'text-red-500' : 'text-amber-500';

  let resultsStr = '';
  if (toolCall.results) {
    resultsStr = typeof toolCall.results === 'string' ? toolCall.results : JSON.stringify(toolCall.results, null, 2);
  }

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className="flex items-center gap-1.5 hover:opacity-80"
      >
        {!hideDetails &&
          (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
        <Icon className={`w-3.5 h-3.5 ${iconColor} ${status === 'pending' ? 'animate-spin' : ''}`} />
        <span className="font-medium text-gray-600">{label}</span>
      </button>
      {expanded && !hideDetails && (
        <div className="mt-1.5 space-y-1 pl-5">
          {toolCall.arguments_string && (
            <div>
              <span className="text-gray-400">Parameters:</span>
              <pre className="mt-0.5 bg-gray-50 p-1.5 rounded text-[10px] overflow-x-auto max-h-32">
                {toolCall.arguments_string}
              </pre>
            </div>
          )}
          {resultsStr && (
            <div>
              <span className="text-gray-400">Result:</span>
              <pre className="mt-0.5 bg-gray-50 p-1.5 rounded text-[10px] overflow-x-auto max-h-32">
                {resultsStr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-[#004d40] text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
        }`}
      >
        {message.content &&
          (isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
              {message.content}
            </ReactMarkdown>
          ))}
        {message.tool_calls?.map((tc, i) => (
          <ToolCallDisplay key={i} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}