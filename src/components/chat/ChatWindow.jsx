import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ChatWindow({ 
  bookingId, 
  currentUserId, 
  currentUserName,
  currentUserType,
  otherUserName,
  otherUserPhoto 
}) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', bookingId],
    queryFn: () => base44.entities.ChatMessage.filter(
      { booking_id: bookingId },
      'created_date',
      500
    ),
    enabled: !!bookingId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      let attachmentUrl = null;
      
      if (attachment) {
        setUploading(true);
        const result = await base44.integrations.Core.UploadFile({ file: attachment });
        attachmentUrl = result.file_url;
        setUploading(false);
      }

      return base44.entities.ChatMessage.create({
        ...data,
        attachment_url: attachmentUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', bookingId]);
      setMessage('');
      setAttachment(null);
    },
  });

  const handleSend = () => {
    if (!message.trim() && !attachment) return;

    sendMessageMutation.mutate({
      booking_id: bookingId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_type: currentUserType,
      message: message.trim() || '📎 Sent an attachment',
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <LoadingSpinner text="Loading chat..." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.sender_id === currentUserId}
              senderPhoto={msg.sender_id === currentUserId ? null : otherUserPhoto}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 bg-gray-100 rounded-lg p-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm flex-1 truncate">{attachment.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setAttachment(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <label className="flex-shrink-0">
            <Button variant="outline" size="icon" className="h-10 w-10" type="button">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </Button>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setAttachment(e.target.files[0])}
              accept="image/*,.pdf,.doc,.docx"
            />
          </label>
          
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !attachment) || sendMessageMutation.isPending || uploading}
            className="h-10 w-10 p-0 bg-teal-600 hover:bg-teal-700 flex-shrink-0"
          >
            {sendMessageMutation.isPending || uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}