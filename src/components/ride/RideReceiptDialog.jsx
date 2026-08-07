import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Download, Receipt, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateRideInvoicePDF } from '@/utils/generateRideInvoicePDF';

export default function RideReceiptDialog({ open, onOpenChange, ride, user }) {
  if (!ride) return null;

  const amount = ride.final_fare || ride.estimated_fare || 0;
  const receiptId = `RCP-${ride.id?.slice(-8).toUpperCase()}`;
  const date = ride.updated_date || ride.created_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Ride Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center py-5 bg-green-50 rounded-xl">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
            <p className="font-semibold text-green-800">Ride Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              KES {amount.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No.</span>
              <span className="font-mono font-medium">{receiptId}</span>
            </div>
            {date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{format(new Date(date), 'MMM d, yyyy · h:mm a')}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-500">Ride Type</span>
              <span className="capitalize font-medium">{ride.ride_type}</span>
            </div>
            {ride.driver_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Driver</span>
                <span>{ride.driver_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">From</span>
              <span className="text-right max-w-[160px] truncate">{ride.pickup?.address || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">To</span>
              <span className="text-right max-w-[160px] truncate">{ride.destination?.address || '—'}</span>
            </div>
            {(ride.distance_km || ride.duration_min) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Trip</span>
                <span>{ride.distance_km ? `${ride.distance_km} km` : ''} {ride.duration_min ? `· ${ride.duration_min} min` : ''}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className="capitalize">{ride.payment_method}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total Paid</span>
              <span className="text-teal-600">KES {amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50"
              onClick={() => generateRideInvoicePDF({ ride, user })}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}