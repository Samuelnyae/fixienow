import jsPDF from 'jspdf';

/**
 * Generates a clean PDF invoice after a confirmed payment.
 * @param {Object} booking - Booking entity record
 * @param {Object} technician - Technician entity record
 * @param {Object} user - Current user (customer)
 * @param {string} paymentMethod - e.g. "M-Pesa (254700000000)"
 */
export function generateInvoicePDF({ booking, technician, user, paymentMethod = 'M-Pesa' }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const W = doc.internal.pageSize.getWidth();
  const primaryColor = [15, 118, 110];   // teal-700
  const darkColor    = [15, 23, 42];     // slate-900
  const mutedColor   = [100, 116, 139];  // slate-500
  const lightBg      = [248, 250, 252];  // slate-50

  const amount     = booking.final_price || booking.estimated_price || 0;
  const invoiceNo  = `INV-${booking.id?.slice(-8).toUpperCase()}`;
  const issuedAt   = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const serviceName = (booking.category || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Service';

  // ── Header band ──────────────────────────────────────────────────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, W, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('FIXIE', 40, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Trusted Home Services Platform', 40, 64);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', W - 40, 50, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNo, W - 40, 66, { align: 'right' });

  // ── Invoice meta ─────────────────────────────────────────────────
  let y = 110;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('DATE ISSUED', 40, y);
  doc.text('PAYMENT METHOD', 200, y);
  doc.text('STATUS', 380, y);

  y += 14;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(issuedAt, 40, y);
  doc.text(paymentMethod, 200, y);

  doc.setTextColor(...primaryColor);
  doc.text('PAID', 380, y);
  doc.setTextColor(...darkColor);

  // ── Divider ──────────────────────────────────────────────────────
  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, y, W - 40, y);

  // ── Bill To / Service Info ────────────────────────────────────────
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('BILLED TO', 40, y);
  doc.text('SERVICE PROVIDER', 300, y);

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(user?.full_name || 'Customer', 40, y);
  doc.text(technician?.name || 'Technician', 300, y);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  if (user?.email) doc.text(user.email, 40, y);
  if (technician?.phone) doc.text(technician.phone, 300, y);
  if (technician?.email) {
    y += 12;
    doc.text(technician.email, 300, y);
  }

  // ── Line items table ──────────────────────────────────────────────
  y += 36;
  doc.setFillColor(...lightBg);
  doc.roundedRect(40, y, W - 80, 28, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  y += 18;
  doc.text('DESCRIPTION', 56, y);
  doc.text('DATE', 310, y);
  doc.text('AMOUNT (KES)', W - 56, y, { align: 'right' });

  // Row 1 – service
  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(serviceName, 56, y);

  const serviceDate = booking.scheduled_date
    ? new Date(booking.scheduled_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date(booking.created_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(serviceDate, 310, y);
  doc.text(amount.toLocaleString('en-KE', { minimumFractionDigits: 2 }), W - 56, y, { align: 'right' });

  // Description sub-line
  if (booking.description) {
    y += 14;
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    const desc = booking.description.length > 80 ? booking.description.slice(0, 80) + '...' : booking.description;
    doc.text(desc, 56, y);
  }

  // Location sub-line
  if (booking.location?.address) {
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(`📍 ${booking.location.address}`, 56, y);
  }

  // ── Totals ────────────────────────────────────────────────────────
  y += 28;
  doc.setDrawColor(226, 232, 240);
  doc.line(40, y, W - 40, y);

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal', W - 180, y);
  doc.setTextColor(...darkColor);
  doc.text(`KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, W - 56, y, { align: 'right' });

  y += 18;
  doc.setTextColor(...mutedColor);
  doc.text('Tax (0%)', W - 180, y);
  doc.setTextColor(...darkColor);
  doc.text('KES 0.00', W - 56, y, { align: 'right' });

  // Total band
  y += 28;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(40, y - 16, W - 80, 36, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PAID', 60, y + 8);
  doc.text(`KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, W - 56, y + 8, { align: 'right' });

  // ── Notes ─────────────────────────────────────────────────────────
  y += 60;
  doc.setFillColor(240, 253, 250); // teal-50
  doc.roundedRect(40, y, W - 80, 50, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('Thank you for choosing Fixie!', 56, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('This is a digitally generated invoice. For queries, contact support@fixie.co.ke', 56, y + 32);

  // ── Footer ────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageH - 32, W, 32, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Fixie | Home Services Platform | www.fixie.co.ke', W / 2, pageH - 12, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────
  doc.save(`Fixie_Invoice_${invoiceNo}.pdf`);
}