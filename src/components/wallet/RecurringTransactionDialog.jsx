import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Repeat, Loader2 } from 'lucide-react';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

const currencies = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

const frequencies = [
  { value: 'daily', label: 'Daily', next: (date) => addDays(date, 1) },
  { value: 'weekly', label: 'Weekly', next: (date) => addWeeks(date, 1) },
  { value: 'biweekly', label: 'Bi-weekly', next: (date) => addWeeks(date, 2) },
  { value: 'monthly', label: 'Monthly', next: (date) => addMonths(date, 1) },
  { value: 'yearly', label: 'Yearly', next: (date) => addYears(date, 1) },
];

export default function RecurringTransactionDialog({ open, onOpenChange, wallet, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    recipient_address: '',
    recipient_name: '',
    amount: '',
    currency: 'KES',
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    description: '',
    max_executions: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipient_address) {
      newErrors.recipient_address = 'Recipient address is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    const balance = wallet?.balances?.find(b => b.currency === formData.currency)?.amount || 0;
    if (parseFloat(formData.amount) > balance) {
      newErrors.amount = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const startDate = new Date(formData.start_date);
    const frequencyObj = frequencies.find(f => f.value === formData.frequency);
    const nextExecutionDate = frequencyObj.next(startDate);

    onSave({
      wallet_id: wallet.id,
      user_id: wallet.user_id,
      ...formData,
      amount: parseFloat(formData.amount),
      next_execution_date: format(nextExecutionDate, 'yyyy-MM-dd'),
      max_executions: formData.max_executions ? parseInt(formData.max_executions) : null,
      end_date: formData.end_date || null,
    });
  };

  const selectedCurrency = currencies.find(c => c.code === formData.currency);
  const balance = wallet?.balances?.find(b => b.currency === formData.currency)?.amount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-teal-600" />
            Set Up Recurring Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Recipient Wallet Address</Label>
            <Input
              placeholder="0x..."
              value={formData.recipient_address}
              onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
              className="mt-1"
            />
            {errors.recipient_address && (
              <p className="text-xs text-red-500 mt-1">{errors.recipient_address}</p>
            )}
          </div>

          <div>
            <Label>Recipient Name (Optional)</Label>
            <Input
              placeholder="e.g., John Doe"
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1"
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Available Balance:</span>
              <span className="font-semibold">
                {selectedCurrency?.symbol}{balance.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Max Executions (Optional)</Label>
            <Input
              type="number"
              placeholder="Leave blank for unlimited"
              value={formData.max_executions}
              onChange={(e) => setFormData({ ...formData, max_executions: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="e.g., Monthly rent payment"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Repeat className="w-4 h-4 mr-2" />
                Create Recurring Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}