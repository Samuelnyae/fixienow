import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessageBubble({ message, isCurrentUser, senderPhoto }) {
  return (
    <div className={cn("flex gap-3 mb-4", isCurrentUser && "flex-row-reverse")}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={senderPhoto} />
        <AvatarFallback className={cn(
          "text-sm",
          isCurrentUser ? "bg-teal-600 text-white" : "bg-gray-300 text-gray-700"
        )}>
          {message.sender_name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col max-w-[70%]", isCurrentUser && "items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-2",
          isCurrentUser 
            ? "bg-teal-600 text-white rounded-tr-sm" 
            : "bg-gray-100 text-gray-900 rounded-tl-sm"
        )}>
          {!isCurrentUser && (
            <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name}</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
          
          {message.attachment_url && (
            <a 
              href={message.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 mt-2 text-xs underline",
                isCurrentUser ? "text-white" : "text-teal-600"
              )}
            >
              <Paperclip className="w-3 h-3" />
              Attachment
            </a>
          )}
        </div>
        <p className={cn(
          "text-xs text-gray-400 mt-1",
          isCurrentUser && "text-right"
        )}>
          {formatDistanceToNow(new Date(message.created_date), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}