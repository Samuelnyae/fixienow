import React, { useState } from 'react';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const currencies = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

export default function SendMoneyDialog({ open, onOpenChange, wallet, onSend, isLoading }) {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    currency: wallet?.primary_currency || 'KES',
    description: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    
    if (!formData.recipient) {
      setError('Please enter recipient wallet address');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const balance = wallet?.balances?.find(b => b.currency === formData.currency);
    if (!balance || balance.amount < parseFloat(formData.amount)) {
      setError('Insufficient balance');
      return;
    }

    onSend(formData);
  };

  const selectedCurrency = currencies.find(c => c.code === formData.currency);
  const balance = wallet?.balances?.find(b => b.currency === formData.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-orange-200">
        <DialogHeader>
          <DialogTitle className="text-orange-900">Send Money</DialogTitle>
          <DialogDescription>
            Send money to any wallet address worldwide
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <Label>Recipient Wallet Address</Label>
            <Input
              placeholder="0x742d35Cc6634C0532925a3b844Bc..."
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="mt-1 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {balance && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="font-semibold text-lg">
                {selectedCurrency?.symbol} {balance.amount.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="What's this for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Transaction Fee:</strong> {selectedCurrency?.symbol} 0.00 (No fees!)
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>You'll send:</strong> {selectedCurrency?.symbol} {formData.amount || '0.00'}
            </p>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Money
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}