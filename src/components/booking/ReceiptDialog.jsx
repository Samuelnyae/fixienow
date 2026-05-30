import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReceiptDialog({ open, onOpenChange, booking, technician, paymentMethod = 'M-Pesa' }) {
  if (!booking) return null;

  const amount = booking.final_price || booking.estimated_price || 0;
  const receiptId = `RCP-${booking.id?.slice(-8).toUpperCase()}`;
  const paidAt = format(new Date(), 'MMM d, yyyy · h:mm a');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Icon */}
          <div className="flex flex-col items-center py-4 bg-green-50 rounded-xl">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
            <p className="font-semibold text-green-800">Payment Confirmed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">KES {amount.toLocaleString()}</p>
          </div>

          {/* Receipt Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No.</span>
              <span className="font-mono font-medium">{receiptId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Time</span>
              <span>{paidAt}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="capitalize font-medium">{booking.category?.replace('_', ' ')} Service</span>
            </div>
            {technician && (
              <div className="flex justify-between">
                <span className="text-gray-500">Technician</span>
                <span>{technician.name}</span>
              </div>
            )}
            {booking.location?.address && (
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="text-right max-w-[160px] truncate">{booking.location.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span>{paymentMethod}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total Paid</span>
              <span className="text-teal-600">KES {amount.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            A receipt has been sent to your email address.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}