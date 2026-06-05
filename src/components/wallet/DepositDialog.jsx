import React, { useState } from 'react';
import { Loader2, CreditCard, Smartphone, Building2, Bitcoin } from 'lucide-react';
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

const paymentMethods = [
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone, desc: 'Mobile money' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, desc: 'From your bank' },
  { value: 'card', label: 'Debit/Credit Card', icon: CreditCard, desc: 'Visa, Mastercard' },
  { value: 'crypto', label: 'Cryptocurrency', icon: Bitcoin, desc: 'BTC, ETH, USDT' },
];

const currencies = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
];

export default function DepositDialog({ open, onOpenChange, wallet, onDeposit, isLoading }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    currency: wallet?.primary_currency || 'KES',
    payment_method: '',
    phone_number: '',
    account_number: '',
    bank_name: '',
  });

  const handleMethodSelect = (method) => {
    setFormData({ ...formData, payment_method: method });
    setStep(2);
  };

  const handleSubmit = () => {
    const depositData = {
      wallet_id: wallet?.id,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      payment_method: formData.payment_method,
      payment_details: {
        phone_number: formData.phone_number,
        account_number: formData.account_number,
        bank_name: formData.bank_name,
      }
    };
    onDeposit(depositData);
  };

  const selectedMethod = paymentMethods.find(m => m.value === formData.payment_method);
  const selectedCurrency = currencies.find(c => c.code === formData.currency);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) setStep(1);
    }}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200">
        <DialogHeader>
          <DialogTitle className="text-green-900">Deposit Money</DialogTitle>
          <DialogDescription>
            Add funds to your wallet from multiple sources
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
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

            <div>
              <Label className="mb-3 block">Choose Payment Method</Label>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      onClick={() => handleMethodSelect(method.value)}
                      disabled={!formData.amount || parseFloat(formData.amount) <= 0}
                      className="w-full p-4 border-2 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-gray-500">{method.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="bg-teal-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700">Deposit Amount</p>
                <p className="text-2xl font-bold text-teal-900">
                  {selectedCurrency?.symbol} {formData.amount}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Change
              </Button>
            </div>

            {formData.payment_method === 'mpesa' && (
              <div>
                <Label>M-Pesa Phone Number</Label>
                <Input
                  placeholder="254712345678"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive an STK push to complete payment
                </p>
              </div>
            )}

            {formData.payment_method === 'bank_transfer' && (
              <>
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    placeholder="e.g., Equity Bank"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    placeholder="Account number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {formData.payment_method === 'crypto' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  You'll receive deposit instructions with wallet addresses for BTC, ETH, and USDT on the next screen.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}