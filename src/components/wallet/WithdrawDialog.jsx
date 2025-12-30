import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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

const withdrawalMethods = [
  { value: 'mpesa', label: 'M-Pesa', fee: 0 },
  { value: 'bank_transfer', label: 'Bank Transfer', fee: 50 },
  { value: 'paypal', label: 'PayPal', fee: 0 },
  { value: 'crypto', label: 'Cryptocurrency', fee: 0 },
];

export default function WithdrawDialog({ open, onOpenChange, wallet, onWithdraw, isLoading }) {
  const [formData, setFormData] = useState({
    amount: '',
    currency: wallet?.primary_currency || 'KES',
    withdrawal_method: 'mpesa',
    phone_number: '',
    account_number: '',
    account_name: '',
    bank_name: '',
    paypal_email: '',
    crypto_address: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const balance = wallet?.balances?.find(b => b.currency === formData.currency);
    const method = withdrawalMethods.find(m => m.value === formData.withdrawal_method);
    const totalAmount = parseFloat(formData.amount) + method.fee;

    if (!balance || balance.amount < totalAmount) {
      setError(`Insufficient balance. Need ${totalAmount} (includes ${method.fee} fee)`);
      return;
    }

    const withdrawalData = {
      wallet_id: wallet?.id,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      withdrawal_method: formData.withdrawal_method,
      fee: method.fee,
      net_amount: parseFloat(formData.amount),
      destination: {
        phone_number: formData.phone_number,
        account_number: formData.account_number,
        account_name: formData.account_name,
        bank_name: formData.bank_name,
        paypal_email: formData.paypal_email,
        crypto_address: formData.crypto_address,
      }
    };

    onWithdraw(withdrawalData);
  };

  const balance = wallet?.balances?.find(b => b.currency === formData.currency);
  const selectedMethod = withdrawalMethods.find(m => m.value === formData.withdrawal_method);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Transfer money from your wallet to external accounts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

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
              <Label>Method</Label>
              <Select
                value={formData.withdrawal_method}
                onValueChange={(value) => setFormData({ ...formData, withdrawal_method: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {withdrawalMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
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
                KSh {balance.amount.toLocaleString()}
              </p>
            </div>
          )}

          {formData.withdrawal_method === 'mpesa' && (
            <div>
              <Label>M-Pesa Phone Number</Label>
              <Input
                placeholder="254712345678"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="mt-1"
              />
            </div>
          )}

          {formData.withdrawal_method === 'bank_transfer' && (
            <>
              <div>
                <Label>Account Name</Label>
                <Input
                  placeholder="Account holder name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="mt-1"
                />
              </div>
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

          {formData.withdrawal_method === 'paypal' && (
            <div>
              <Label>PayPal Email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.paypal_email}
                onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                className="mt-1"
              />
            </div>
          )}

          {formData.withdrawal_method === 'crypto' && (
            <div>
              <Label>Crypto Wallet Address</Label>
              <Input
                placeholder="0x742d35Cc6634C0532925a3b844Bc..."
                value={formData.crypto_address}
                onChange={(e) => setFormData({ ...formData, crypto_address: e.target.value })}
                className="mt-1 font-mono text-sm"
              />
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-900">Amount</span>
              <span className="font-medium">KSh {formData.amount || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-900">Transaction Fee</span>
              <span className="font-medium">KSh {selectedMethod?.fee || 0}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
              <span className="text-blue-900 font-semibold">You'll receive</span>
              <span className="font-bold">KSh {formData.amount || '0.00'}</span>
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Withdraw Funds'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}