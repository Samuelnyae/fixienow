import { jsPDF } from 'jspdf';

// Fixie brand palette
const BRAND = { r: 0, g: 77, b: 64 };       // #004d40
const BRAND_LIGHT = { r: 0, g: 109, b: 91 };  // #006d5b
const ACCENT = { r: 245, g: 158, b: 11 };    // amber
const INK = { r: 17, g: 24, b: 39 };
const MUTED = { r: 107, g: 114, b: 128 };
const BG = { r: 249, g: 250, b: 251 };
const WHITE = { r: 255, g: 255, b: 255 };

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;

// Content slides (also used by the on-screen preview)
export const PITCH_SLIDES = [
  {
    eyebrow: 'The Problem',
    title: 'Finding a trusted repair pro is broken',
    body: 'Millions of Kenyan households and SMEs rely on informal fundis. Trust is absent, pricing is opaque, and cash-only payments create friction on every job.',
    points: [
      'No reliable way to verify a technician\u2019s identity or qualifications',
      'Cash-only economy locks out digital trust, records and repeat business',
      'No accountability when a job is done poorly \u2014 the customer has no recourse',
      'Transport and tools are a separate, painful scavenger hunt'
    ]
  },
  {
    eyebrow: 'The Solution',
    title: 'Fixie \u2014 a verified, end-to-end service marketplace',
    body: 'One app to book certified technicians, move people and goods, pay safely, and get the job guaranteed.',
    points: [
      'Vetted technicians: ID and certificate verification before they can take a job',
      'Multi-channel booking: in-app, WhatsApp, and USSD for feature-phone users',
      'Fixie Wallet: pay after completion, hold funds in escrow, tip and cashback',
      'The Fixie Guarantee: free rework or refund if a job isn\u2019t done right'
    ]
  },
  {
    eyebrow: 'Market Opportunity',
    title: 'A large, underserved informal services economy',
    body: 'Kenya\u2019s repair, home-services and last-mile transport market is worth billions of shillings and runs almost entirely offline.',
    stats: [
      { value: '40M+', label: 'Kenyans reliant on informal repair & services' },
      { value: 'KES 2T', label: 'Estimated annual informal services & transport spend' },
      { value: '90%', label: 'Of fundis operate with no digital footprint today' }
    ]
  },
  {
    eyebrow: 'Product',
    title: 'A complete operating system for local services',
    body: 'Fixie combines a technician marketplace, on-demand transport, a gig job board, and a digital wallet into one trusted platform.',
    points: [
      'Service booking with AI dispatch that matches the best-fit technician',
      'Rides: cabs, boda bodas and trucks with live tracking and Safe Ride mode',
      'Reverse Job Board: customers post same-day gigs, fundis apply to win them',
      'Fixie Wallet, loyalty tiers, promo codes, tips and KYC-verified payouts'
    ]
  },
  {
    eyebrow: 'How It Works',
    title: 'From request to completed job in minutes',
    body: 'A simple, repeatable loop that builds trust and data with every transaction.',
    points: [
      '1. Customer books a service or ride \u2014 via app, WhatsApp or USSD',
      '2. Fixie dispatches the best verified, available technician nearby',
      '3. Live tracking keeps the customer informed until arrival',
      '4. Customer pays into Fixie Wallet only after the job is done right',
      '5. Ratings, reviews and loyalty rewards close the trust loop'
    ]
  },
  {
    eyebrow: 'Trust & Safety',
    title: 'The Fixie Guarantee is our moat',
    body: 'Trust is the single biggest blocker in this market. Fixie builds it into every layer of the product.',
    points: [
      'Technician KYC: national ID, certificates and selfie verification',
      'Escrow-style payments \u2014 funds release only on customer approval',
      'Disputes, refunds and rework handled in-app with evidence upload',
      'Transparent ratings, reviews and a public Fixie Verified badge'
    ]
  },
  {
    eyebrow: 'Business Model',
    title: 'Multiple revenue streams from day one',
    body: 'A marketplace commission core, layered with wallet and service fees that scale with usage.',
    stats: [
      { value: '12\u201318%', label: 'Commission on completed service bookings & rides' },
      { value: 'KES 50', label: 'Flat gig-board posting & match fee per posted job' },
      { value: 'Float', label: 'Wallet balances & merchant float earn platform margin' }
    ]
  },
  {
    eyebrow: 'Competitive Edge',
    title: 'Why Fixie wins in Kenya',
    body: 'Global gig apps don\u2019t reach informal repair or feature-phone users. Fixie is built for how Kenya actually works.',
    points: [
      'USSD and WhatsApp channels reach the 70%+ without smartphones or data',
      'Repair + transport + wallet in one app increases retention and LTV',
      'Deep verification and the Fixie Guarantee build trust competitors can\u2019t fake',
      'Local service-area intelligence tuned to Nairobi and Kenyan cities'
    ]
  },
  {
    eyebrow: 'Go-to-Market',
    title: 'Nairobi wedge, then nationwide',
    body: 'We start where density and demand are highest, then expand city by city.',
    points: [
      'Phase 1: Launch in Nairobi \u2014 Westlands, Kilimani, Kasarani \u2014 with 200 vetted fundis',
      'Phase 2: Expand to Mombasa, Kisumu, Nakuru and Eldoret',
      'Phase 3: National rollout + cross-border East Africa (Uganda, Tanzania)',
      'Acquisition via referral rewards, loyalty tiers and radio/community marketing'
    ]
  },
  {
    eyebrow: 'The Ask',
    title: 'Raising USD 500,000 in pre-seed',
    body: 'To scale the team, deepen verification, and capture the Nairobi market.',
    stats: [
      { value: '40%', label: 'Product & engineering \u2014 wallet, dispatch, mobile build' },
      { value: '35%', label: 'Technician acquisition & verification operations' },
      { value: '25%', label: 'Marketing, customer acquisition & runway (18 months)' }
    ]
  }
];

function slideBase(doc) {
  doc.setFillColor(BG.r, BG.g, BG.b);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, PAGE_W, 6, 'F');
}

function footer(doc, page, total) {
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont('helvetica', 'normal');
  doc.text('Fixie  \u2022  Investor Pitch', MARGIN, PAGE_H - 22);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 22, { align: 'right' });
}

function eyebrow(doc, text, y) {
  doc.setFontSize(10);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), MARGIN, y);
}

function title(doc, text, y) {
  doc.setFontSize(26);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 30;
}

function body(doc, text, y) {
  doc.setFontSize(12);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
  doc.text(lines, MARGIN, y, { lineHeightFactor: 1.5 });
  return y + lines.length * 18 + 8;
}

function bullets(doc, points, y) {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(INK.r, INK.g, INK.b);
  points.forEach((p) => {
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.circle(MARGIN + 6, y - 3, 2.2, 'F');
    const lines = doc.splitTextToSize(p, PAGE_W - MARGIN * 2 - 24);
    doc.text(lines, MARGIN + 20, y, { lineHeightFactor: 1.45 });
    y += lines.length * 17 + 10;
  });
  return y;
}

function stats(doc, statsArr, y) {
  const gap = 14;
  const w = (PAGE_W - MARGIN * 2 - gap * 2) / 3;
  statsArr.forEach((s, i) => {
    const x = MARGIN + i * (w + gap);
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.roundedRect(x, y, w, 130, 8, 8, 'F');
    doc.setFontSize(22);
    doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, x + 14, y + 50, { maxWidth: w - 28 });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 240, 235);
    const lbl = doc.splitTextToSize(s.label, w - 28);
    doc.text(lbl, x + 14, y + 78, { lineHeightFactor: 1.4 });
  });
}

function coverSlide(doc) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  // accent stripe
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(MARGIN, 150, 46, 4, 'F');
  // logo wordmark
  doc.setFontSize(52);
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setFont('helvetica', 'bold');
  doc.text('Fixie', MARGIN, 240);
  // tagline
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 224);
  doc.text('Certified local technicians, on demand.', MARGIN, 280);
  doc.text('Booked in seconds \u2014 guaranteed.', MARGIN, 304);
  // deck label
  doc.setFontSize(11);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTOR PITCH DECK \u2022 2026', MARGIN, PAGE_H - 120);
  doc.setFontSize(9);
  doc.setTextColor(180, 210, 205);
  doc.setFont('helvetica', 'normal');
  doc.text('Kenya \u2022 Confidential \u2014 for discussion only', MARGIN, PAGE_H - 100);
}

function closingSlide(doc) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setFontSize(34);
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setFont('helvetica', 'bold');
  doc.text('Let\u2019s build the trusted', MARGIN, 320);
  doc.text('operating system for', MARGIN, 360);
  doc.text('local services.', MARGIN, 400);
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(MARGIN, 440, 46, 4, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 224);
  doc.text('Get in touch to schedule a deep dive.', MARGIN, 480);
  doc.setFontSize(11);
  doc.setTextColor(180, 210, 205);
  doc.text('hello@fixie.co.ke', MARGIN, 510);
  doc.text('fixie.co.ke', MARGIN, 528);
}

export function generatePitchDeckPDF() {
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H] });

  const total = 1 + PITCH_SLIDES.length + 1; // cover + content + closing
  let page = 1;

  // Cover
  coverSlide(doc);
  footer(doc, page, total);
  doc.addPage();

  // Content slides
  PITCH_SLIDES.forEach((slide) => {
    page += 1;
    slideBase(doc);
    let y = 60;
    eyebrow(doc, slide.eyebrow, y);
    y += 28;
    y = title(doc, slide.title, y) + 8;
    y = body(doc, slide.body, y) + 6;
    if (slide.stats) {
      y += 6;
      stats(doc, slide.stats, y);
    } else {
      y = bullets(doc, slide.points, y);
    }
    footer(doc, page, total);
    doc.addPage();
  });

  // Closing
  page += 1;
  closingSlide(doc);
  footer(doc, page, total);

  doc.save('Fixie_Investor_Pitch_Deck.pdf');
  return true;
}