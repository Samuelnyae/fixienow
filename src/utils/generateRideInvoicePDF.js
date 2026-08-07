import jsPDF from 'jspdf';

/**
 * Generates a PDF receipt for a completed Fixie ride.
 * @param {Object} ride - Ride entity record
 * @param {Object} user - Current user (customer)
 */
export function generateRideInvoicePDF({ ride, user }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const primaryColor = [15, 118, 110];   // teal-700
  const darkColor    = [15, 23, 42];
  const mutedColor   = [100, 116, 139];
  const lightBg      = [248, 250, 252];

  const amount    = ride.final_fare || ride.estimated_fare || 0;
  const receiptNo = `RCP-${ride.id?.slice(-8).toUpperCase()}`;
  const issuedAt  = new Date(ride.updated_date || ride.created_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const rideType  = (ride.ride_type || 'ride').replace(/\b\w/g, l => l.toUpperCase());

  // Header band
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, W, 80, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('FIXIE', 40, 48);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ride-Hailing Receipt', 40, 64);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', W - 40, 50, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptNo, W - 40, 66, { align: 'right' });

  // Meta
  let y = 110;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('DATE', 40, y);
  doc.text('RIDE TYPE', 200, y);
  doc.text('STATUS', 380, y);
  y += 14;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(issuedAt, 40, y);
  doc.text(rideType, 200, y);
  doc.setTextColor(...primaryColor);
  doc.text('PAID', 380, y);
  doc.setTextColor(...darkColor);

  // Divider
  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, y, W - 40, y);

  // Passenger / Driver
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('PASSENGER', 40, y);
  doc.text('DRIVER', 300, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(user?.full_name || 'Customer', 40, y);
  doc.text(ride.driver_name || 'Fixie Driver', 300, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  if (user?.email) doc.text(user.email, 40, y);
  if (ride.driver_phone) doc.text(ride.driver_phone, 300, y);

  // Trip table
  y += 36;
  doc.setFillColor(...lightBg);
  doc.roundedRect(40, y, W - 80, 28, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  y += 18;
  doc.text('TRIP DETAIL', 56, y);
  doc.text('ROUTE', 240, y);
  doc.text('AMOUNT (KES)', W - 56, y, { align: 'right' });

  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(rideType, 56, y);
  const route = `${ride.pickup?.address || '—'} → ${ride.destination?.address || '—'}`;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  const routeLines = doc.splitTextToSize(route, 180);
  doc.text(routeLines.slice(0, 2), 240, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(`${(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, W - 56, y, { align: 'right' });

  // Trip metrics
  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  if (ride.distance_km) doc.text(`Distance: ${ride.distance_km} km`, 56, y);
  if (ride.duration_min) doc.text(`Duration: ${ride.duration_min} min`, 240, y);

  // Totals
  y += 28;
  doc.setDrawColor(226, 232, 240);
  doc.line(40, y, W - 40, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal', W - 180, y);
  doc.setTextColor(...darkColor);
  doc.text(`KES ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, W - 56, y, { align: 'right' });
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
  doc.text(`KES ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, W - 56, y + 8, { align: 'right' });

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageH - 32, W, 32, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Fixie | Ride-Hailing | www.fixie.co.ke', W / 2, pageH - 12, { align: 'center' });

  doc.save(`Fixie_Ride_${receiptNo}.pdf`);
}