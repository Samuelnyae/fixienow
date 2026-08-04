import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle, Phone, Info, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AgentMessageBubble from '@/components/booking/AgentMessageBubble';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const AGENT_NAME = 'fixie_booking_agent';

export default function BookingAssistant() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [authed, setAuthed] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setAuthed);
  }, []);

  useEffect(() => {
    if (!authed) {
      setLoading(false);
      return;
    }
    loadOrCreateConversation();
  }, [authed]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadOrCreateConversation = async () => {
    try {
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      if (convs && convs.length > 0) {
        setConversation(convs[0]);
        setMessages(convs[0].messages || []);
      } else {
        const newConv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: 'New Booking' },
        });
        setConversation(newConv);
      }
    } catch (e) {
      console.error('Conversation error:', e);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !conversation) return;
    const msg = input.trim();
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: msg });
    } catch (e) {
      console.error('Send error:', e);
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading assistant..." />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Book a Technician</h1>
        <p className="text-sm text-gray-500">
          Chat with our AI assistant — it finds a certified technician near you and notifies them instantly.
        </p>
      </div>

      {/* Booking channel cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <a
          href={base44.agents.getWhatsAppConnectURL(AGENT_NAME)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-2xl px-3 py-3 transition-all hover:scale-[1.02]"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">WhatsApp</p>
            <p className="text-xs opacity-90">Chat & book</p>
          </div>
        </a>
        <a
          href={base44.agents.getTelegramConnectURL(AGENT_NAME)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#0088cc] hover:bg-[#006699] text-white rounded-2xl px-3 py-3 transition-all hover:scale-[1.02]"
        >
          <Send className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Telegram</p>
            <p className="text-xs opacity-90">Chat & book</p>
          </div>
        </a>
        <Link
          to="/USSDBooking"
          className="flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-3 py-3 transition-all hover:scale-[1.02]"
        >
          <Grid3x3 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">USSD Menu</p>
            <p className="text-xs opacity-90">No internet</p>
          </div>
        </Link>
      </div>

      {/* SMS note */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">SMS booking</span> is coming soon — it requires an external SMS gateway
          (Africa's Talking) which needs a Builder+ plan upgrade. For now, WhatsApp and Telegram work on any phone with
          internet, and the in-app chat works below.
        </p>
      </div>

      {/* In-app chat */}
      {authed ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-[55vh] shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-8">
                Send a message to start booking a technician...
              </div>
            )}
            {messages.map((m, i) => (
              <AgentMessageBubble key={i} message={m} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="bg-[#004d40] hover:bg-[#003d33] px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <Phone className="w-8 h-8 text-[#004d40] mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-4">
            Sign in to chat with our AI assistant directly in the app, or book via WhatsApp / Telegram above — no account
            needed.
          </p>
          <Button asChild className="bg-[#004d40] hover:bg-[#003d33]">
            <a href="/login">Sign In to Chat</a>
          </Button>
        </div>
      )}
    </div>
  );
}