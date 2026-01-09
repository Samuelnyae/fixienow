import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Calendar, Pause, Play, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function RecurringTransactionCard({ recurring, onPause, onResume, onDelete, isLoading }) {
  const status = statusConfig[recurring.status] || statusConfig.active;
  const currencySymbol = recurring.currency === 'KES' ? 'KSh' : 
                        recurring.currency === 'USD' ? '$' : 
                        recurring.currency === 'EUR' ? '€' : 
                        recurring.currency === 'GBP' ? '£' : recurring.currency;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">
                {recurring.recipient_name || 'Recurring Payment'}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {recurring.recipient_address?.slice(0, 10)}...
              </p>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        {recurring.description && (
          <p className="text-sm text-gray-600 mb-3">{recurring.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-500 text-xs mb-1">Amount</p>
            <p className="font-semibold">
              {currencySymbol}{recurring.amount.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-500 text-xs mb-1">Frequency</p>
            <p className="font-semibold">{frequencyLabels[recurring.frequency]}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-500 text-xs mb-1">Next Payment</p>
            <p className="font-semibold text-xs">
              {recurring.next_execution_date 
                ? format(new Date(recurring.next_execution_date), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-500 text-xs mb-1">Executed</p>
            <p className="font-semibold">
              {recurring.execution_count || 0}
              {recurring.max_executions ? `/${recurring.max_executions}` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {recurring.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onPause(recurring)}
              disabled={isLoading}
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          {recurring.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onResume(recurring)}
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(recurring)}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}