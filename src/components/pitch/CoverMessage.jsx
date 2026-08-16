import React, { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUBJECT = 'Fixie — Investor Pitch Deck';
const BODY = `Hi,

I hope this finds you well.

I'm reaching out to share Fixie — the trusted operating system for local repair services and transport in Kenya. We connect households and SMEs with verified technicians and drivers through a single app, with ID and certificate verification, multi-channel booking (in-app, WhatsApp, and USSD), and the Fixie Guarantee backing every job.

The opportunity: Kenya's informal services and transport economy is massive, fragmented, and built on cash. Fixie is building the trust and payments layer on top of it.

Highlights:
- Vetted technicians with verified identity and qualifications
- Multi-channel booking for smartphone and feature-phone users alike
- Internal wallet, loyalty, and dispute resolution for safe payments
- A reverse job board (Gig Board) that matches same-day jobs to nearby pros

I've attached our investor pitch deck with the full problem, solution, market, model, and the ask. I'd welcome a short call to walk through it.

Thank you for your time and consideration.

Best regards,
Samuel Nyae
samuelnyae18@gmail.com
https://fixie.base44.app`;

export default function CoverMessage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${SUBJECT}\n\n${BODY}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // clipboard not available
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 text-[#004d40] text-sm font-semibold">
          <Mail className="w-4 h-4" />
          Cover Message to Send with the Deck
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-[#004d40] text-[#004d40] hover:bg-[#004d40]/5"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy message
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-gray-400 mb-1">Subject</div>
      <div className="text-sm font-medium text-gray-800 mb-4">{SUBJECT}</div>

      <div className="text-xs text-gray-400 mb-1">Message</div>
      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
{BODY}
      </pre>
    </div>
  );
}