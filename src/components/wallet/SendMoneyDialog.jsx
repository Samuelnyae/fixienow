import React, { useState } from 'react';
import { Loader2, Send, AlertCircle, Smartphone, Building2, Globe, Bitcoin, CreditCard, Banknote } from 'lucide-react';
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
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

const sendMethods = [
  {
    id: 'mpesa',
    label: 'M-Pesa',
    icon: Smartphone,
    description: 'Kenya, Tanzania, Uganda & more',
    color: 'bg-green-100 border-green-400 text-green-800',
    activeColor: 'bg-green-500 border-green-600 text-white',
    fee: 0,
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: Building2,
    description: 'Local & international banks',
    color: 'bg-blue-100 border-blue-400 text-blue-800',
    activeColor: 'bg-blue-600 border-blue-700 text-white',
    fee: 50,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    icon: Globe,
    description: 'Worldwide PayPal accounts',
    color: 'bg-indigo-100 border-indigo-400 text-indigo-800',
    activeColor: 'bg-indigo-600 border-indigo-700 text-white',
    fee: 0,
  },
  {
    id: 'wise',
    label: 'Wise',
    icon: Globe,
    description: 'Fast international transfers',
    color: 'bg-teal-100 border-teal-400 text-teal-800',
    activeColor: 'bg-teal-600 border-teal-700 text-white',
    fee: 0,
  },
  {
    id: 'western_union',
    label: 'Western Union',
    icon: Banknote,
    description: 'Cash pickup worldwide',
    color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    activeColor: 'bg-yellow-500 border-yellow-600 text-white',
    fee: 0,
  },
  {
    id: 'moneygram',
    label: 'MoneyGram',
    icon: Banknote,
    description: 'Send cash globally',
    color: 'bg-orange-100 border-orange-400 text-orange-800',
    activeColor: 'bg-orange-500 border-orange-600 text-white',
    fee: 0,
  },
  {
    id: 'card',
    label: 'Debit / Credit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, Amex',
    color: 'bg-purple-100 border-purple-400 text-purple-800',
    activeColor: 'bg-purple-600 border-purple-700 text-white',
    fee: 0,
  },
  {
    id: 'crypto',
    label: 'Crypto',
    icon: Bitcoin,
    description: 'BTC, ETH, USDT & more',
    color: 'bg-amber-100 border-amber-400 text-amber-800',
    activeColor: 'bg-amber-500 border-amber-600 text-white',
    fee: 0,
  },
];

export default function SendMoneyDialog({ open, onOpenChange, wallet, onSend, isLoading }) {
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [formData, setFormData] = useState({
    amount: '',
    currency: wallet?.primary_currency || 'KES',
    description: '',
    // mpesa
    phone_number: '',
    // bank
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_swift: '',
    // paypal / wise
    email: '',
    // western union / moneygram
    recipient_name: '',
    recipient_country: '',
    // card
    card_number: '',
    // crypto
    crypto_address: '',
    crypto_network: 'BTC',
  });
  const [error, setError] = useState('');

  const method = sendMethods.find(m => m.id === selectedMethod);
  const selectedCurrency = currencies.find(c => c.code === formData.currency);
  const balance = wallet?.balances?.find(b => b.currency === formData.currency);
  const fee = method?.fee || 0;
  const totalAmount = parseFloat(formData.amount || 0) + fee;

  const handleSubmit = () => {
    setError('');
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!balance || balance.amount < totalAmount) {
      setError(`Insufficient balance. Need ${selectedCurrency?.symbol}${totalAmount.toLocaleString()} (includes fee)`);
      return;
    }

    const payload = {
      recipient: formData.phone_number || formData.email || formData.crypto_address || formData.account_number || formData.recipient_name || '',
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      payment_method: selectedMethod,
      destination: { ...formData },
    };
    onSend(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-orange-200">
        <DialogHeader>
          <DialogTitle className="text-orange-900">Send Money</DialogTitle>
          <DialogDescription>Choose how you want to send money</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Method Selector */}
          <div>
            <Label className="mb-2 block">Send via</Label>
            <div className="grid grid-cols-2 gap-2">
              {sendMethods.map((m) => {
                const Icon = m.icon;
                const isActive = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isActive ? m.activeColor : m.color
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm leading-tight">{m.label}</p>
                      <p className={`text-xs leading-tight ${isActive ? 'opacity-80' : 'opacity-60'}`}>{m.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-3">
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
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
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
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-gray-500">Available Balance</p>
              <p className="font-semibold">{selectedCurrency?.symbol} {balance.amount.toLocaleString()}</p>
            </div>
          )}

          {/* Method-specific fields */}
          {selectedMethod === 'mpesa' && (
            <div>
              <Label>M-Pesa Phone Number</Label>
              <Input
                placeholder="e.g. 254712345678"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Supports Safaricom, Vodacom, Airtel Money</p>
            </div>
          )}

          {selectedMethod === 'bank' && (
            <>
              <div>
                <Label>Account Holder Name</Label>
                <Input placeholder="Full legal name" value={formData.account_name} onChange={(e) => setFormData({ ...formData, account_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input placeholder="e.g. Equity Bank, Barclays, Chase" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Account Number / IBAN</Label>
                <Input placeholder="Account number or IBAN" value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>SWIFT / BIC Code (international)</Label>
                <Input placeholder="e.g. EQBLKENA" value={formData.bank_swift} onChange={(e) => setFormData({ ...formData, bank_swift: e.target.value })} className="mt-1" />
              </div>
            </>
          )}

          {(selectedMethod === 'paypal' || selectedMethod === 'wise') && (
            <div>
              <Label>{selectedMethod === 'paypal' ? 'PayPal' : 'Wise'} Email</Label>
              <Input type="email" placeholder="recipient@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
            </div>
          )}

          {(selectedMethod === 'western_union' || selectedMethod === 'moneygram') && (
            <>
              <div>
                <Label>Recipient Full Name</Label>
                <Input placeholder="As on their ID" value={formData.recipient_name} onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Recipient Country</Label>
                <Input placeholder="e.g. Nigeria, India, Philippines" value={formData.recipient_country} onChange={(e) => setFormData({ ...formData, recipient_country: e.target.value })} className="mt-1" />
              </div>
            </>
          )}

          {selectedMethod === 'card' && (
            <div>
              <Label>Card Number</Label>
              <Input placeholder="•••• •••• •••• ••••" maxLength={19} value={formData.card_number} onChange={(e) => setFormData({ ...formData, card_number: e.target.value })} className="mt-1 font-mono" />
            </div>
          )}

          {selectedMethod === 'crypto' && (
            <>
              <div>
                <Label>Blockchain Network</Label>
                <Select value={formData.crypto_network} onValueChange={(v) => setFormData({ ...formData, crypto_network: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['BTC', 'ETH', 'USDT (TRC20)', 'USDT (ERC20)', 'BNB', 'SOL', 'MATIC', 'XRP'].map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wallet Address</Label>
                <Input placeholder="0x742d35Cc..." value={formData.crypto_address} onChange={(e) => setFormData({ ...formData, crypto_address: e.target.value })} className="mt-1 font-mono text-sm" />
              </div>
            </>
          )}

          <div>
            <Label>Description (Optional)</Label>
            <Textarea placeholder="What's this for?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1" rows={2} />
          </div>

          {/* Summary */}
          <div className="bg-white/70 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">{selectedCurrency?.symbol} {formData.amount || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fee</span>
              <span className="font-medium">{selectedCurrency?.symbol} {fee}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
              <span>Total Deducted</span>
              <span>{selectedCurrency?.symbol} {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full h-12 bg-teal-600 hover:bg-teal-700">
            {isLoading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Send className="w-5 h-5 mr-2" />Send via {method?.label}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}