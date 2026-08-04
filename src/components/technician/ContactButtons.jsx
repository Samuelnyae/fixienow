import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.73-.86-2-.95-.27-.1-.46-.15-.65.15-.19.3-.75.95-.92 1.14-.17.19-.34.21-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.29.3-.49.1-.19.05-.36-.02-.51-.07-.15-.65-1.58-.9-2.16-.24-.56-.48-.48-.65-.49h-.56c-.19 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.81 1.2 3 .15.19 2.06 3.15 5 4.42.7.3 1.25.48 1.67.61.7.22 1.34.19 1.85.12.56-.08 1.73-.71 1.98-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.19-.56-.34z"/>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.13c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.12.82.83-3.04-.2-.31c-.83-1.32-1.27-2.85-1.27-4.42 0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42 1.55 1.56 2.41 3.63 2.41 5.83 0 4.54-3.7 8.27-8.24 8.27z"/>
  </svg>
);

const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
  </svg>
);

function normalizePhone(raw) {
  if (!raw) return null;
  let p = String(raw).trim().replace(/[^0-9+]/g, '').replace(/^\+/, '');
  if (!p) return null;
  if (p.startsWith('0')) p = '254' + p.slice(1);
  else if (!p.startsWith('254')) p = '254' + p;
  return p;
}

export default function ContactButtons({ job }) {
  const localPhone = (job.user_phone || '').trim().replace(/[^0-9+]/g, '').replace(/^\+/, '');
  const intlPhone = normalizePhone(job.user_phone);
  const jobRef = job.id?.slice(-6).toUpperCase();
  const message = `Hello ${job.user_name || 'there'}, this is your Fixie technician regarding your ${job.category?.replace('_', ' ')} booking #${jobRef}. How can I help?`;
  const whatsappUrl = intlPhone
    ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`
    : null;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('https://fixie.app')}&text=${encodeURIComponent(message)}`;
  const chatLink = `${createPageUrl('BookingDetail')}?id=${job.id}&tab=chat`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {/* Call */}
      {localPhone ? (
        <Button variant="outline" asChild className="h-10">
          <a href={`tel:${localPhone}`}>
            <Phone className="w-4 h-4 mr-1.5" />
            Call
          </a>
        </Button>
      ) : (
        <Button variant="outline" disabled className="h-10">
          <Phone className="w-4 h-4 mr-1.5" />
          Call
        </Button>
      )}

      {/* WhatsApp */}
      {whatsappUrl ? (
        <Button asChild className="h-10 bg-[#25D366] hover:bg-[#1da851] text-white border-0">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="w-4 h-4 mr-1.5" />
            WhatsApp
          </a>
        </Button>
      ) : (
        <Button disabled className="h-10 bg-[#25D366]/60 text-white border-0">
          <WhatsAppIcon className="w-4 h-4 mr-1.5" />
          WhatsApp
        </Button>
      )}

      {/* Telegram */}
      <Button asChild className="h-10 bg-[#229ED9] hover:bg-[#1a8bc4] text-white border-0">
        <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
          <TelegramIcon className="w-4 h-4 mr-1.5" />
          Telegram
        </a>
      </Button>

      {/* Chat (in-app) */}
      <Button variant="outline" asChild className="h-10">
        <Link to={chatLink}>
          <MessageCircle className="w-4 h-4 mr-1.5" />
          Chat
        </Link>
      </Button>
    </div>
  );
}