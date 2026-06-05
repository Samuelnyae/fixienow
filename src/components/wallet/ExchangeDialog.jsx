import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
];

// Mock exchange rates (in production, fetch from API)
const exchangeRates = {
  'KES-USD': 0.0078,
  'USD-KES': 128.5,
  'KES-EUR': 0.0071,
  'EUR-KES': 140.2,
  'KES-GBP': 0.0061,
  'GBP-KES': 163.8,
  'USD-EUR': 0.91,
  'EUR-USD': 1.10,
  'USD-GBP': 0.79,
  'GBP-USD': 1.27,
};

export default function ExchangeDialog({ open, onOpenChange, wallet, onExchange, isLoading }) {
  const [formData, setFormData] = useState({
    fromCurrency: 'KES',
    toCurrency: 'USD',
    amount: '',
  });
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.amount && formData.fromCurrency && formData.toCurrency) {
      const rateKey = `${formData.fromCurrency}-${formData.toCurrency}`;
      const rate = exchangeRates[rateKey] || 1;
      setConvertedAmount(parseFloat(formData.amount) * rate);
    }
  }, [formData]);

  const handleSubmit = () => {
    setError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (formData.fromCurrency === formData.toCurrency) {
      setError('Please select different currencies');
      return;
    }

    const balance = wallet?.balances?.find(b => b.currency === formData.fromCurrency);
    if (!balance || balance.amount < parseFloat(formData.amount)) {
      setError('Insufficient balance');
      return;
    }

    const rateKey = `${formData.fromCurrency}-${formData.toCurrency}`;
    const rate = exchangeRates[rateKey] || 1;

    onExchange({
      ...formData,
      amount: parseFloat(formData.amount),
      convertedAmount,
      exchangeRate: rate,
    });
  };

  const fromBalance = wallet?.balances?.find(b => b.currency === formData.fromCurrency);
  const fromCurrency = currencies.find(c => c.code === formData.fromCurrency);
  const toCurrency = currencies.find(c => c.code === formData.toCurrency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200">
        <DialogHeader>
          <DialogTitle className="text-purple-900">Exchange Currency</DialogTitle>
          <DialogDescription>
            Convert between different currencies instantly
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
            <Label>From</Label>
            <div className="grid grid-cols-[1fr,auto] gap-2 mt-1">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <Select
                value={formData.fromCurrency}
                onValueChange={(value) => setFormData({ ...formData, fromCurrency: value })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fromBalance && (
              <p className="text-sm text-gray-500 mt-1">
                Available: {fromCurrency?.symbol} {fromBalance.amount.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setFormData({
                ...formData,
                fromCurrency: formData.toCurrency,
                toCurrency: formData.fromCurrency,
              })}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div>
            <Label>To</Label>
            <div className="grid grid-cols-[1fr,auto] gap-2 mt-1">
              <Input
                type="number"
                value={convertedAmount.toFixed(2)}
                readOnly
                className="bg-gray-50"
              />
              <Select
                value={formData.toCurrency}
                onValueChange={(value) => setFormData({ ...formData, toCurrency: value })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Rate: 1 {formData.fromCurrency} = {(exchangeRates[`${formData.fromCurrency}-${formData.toCurrency}`] || 0).toFixed(4)} {formData.toCurrency}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Exchange Fee:</strong> 0% (No fees!)
            </p>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                Exchange
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}