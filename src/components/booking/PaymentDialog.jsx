import React, { useState } from 'react';
import { Loader2, CreditCard, Smartphone, Building2, Globe, Bitcoin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const CURRENCIES = [
  { code: 'KES', symbol: 'KES', name: 'Kenyan Shilling' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

const METHODS = [
  { id: 'mpesa',    label: 'M-Pesa',        icon: Smartphone,  desc: 'Mobile money (East Africa)' },
  { id: 'card',     label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
  { id: 'bank',     label: 'Bank Transfer',  icon: Building2,   desc: 'SWIFT / local bank' },
  { id: 'paypal',   label: 'PayPal',         icon: Globe,       desc: 'Worldwide online payments' },
  { id: 'crypto',   label: 'Crypto',         icon: Bitcoin,     desc: 'USDT, BTC, ETH' },
];

export default function PaymentDialog({ open, onOpenChange, booking, onConfirm, isPending }) {
  const [method, setMethod] = useState('mpesa');
  const [currency, setCurrency] = useState('KES');
  const [phone, setPhone]   = useState('');
  const [cardNo, setCardNo] = useState('');
  const [cardName, setCardName] = useState('');
  const [bankRef, setBankRef]   = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cryptoAddr, setCryptoAddr]   = useState('');

  if (!booking) return null;

  const baseAmount = booking.final_price || booking.estimated_price || 0;
  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const getPaymentMethodLabel = () => {
    const m = METHODS.find(m => m.id === method);
    switch (method) {
      case 'mpesa':   return `M-Pesa (${phone})`;
      case 'card':    return `Card (****${cardNo.slice(-4) || '0000'})`;
      case 'bank':    return `Bank Transfer`;
      case 'paypal':  return `PayPal (${paypalEmail})`;
      case 'crypto':  return `Crypto`;
      default:        return m?.label || method;
    }
  };

  const canSubmit = () => {
    if (isPending) return false;
    if (method === 'mpesa')   return phone.length >= 9;
    if (method === 'card')    return cardNo.length >= 13 && cardName.length > 1;
    if (method === 'bank')    return bankRef.length > 2;
    if (method === 'paypal')  return paypalEmail.includes('@');
    if (method === 'crypto')  return cryptoAddr.length > 10;
    return false;
  };

  const handleConfirm = () => {
    onConfirm({ method, currency, phone, paymentMethodLabel: getPaymentMethodLabel() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pay for Service</DialogTitle>
          <DialogDescription>Choose your preferred payment method and currency.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Currency selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full h-10 px-3 border rounded-xl text-sm bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount preview */}
          <div className="bg-teal-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-gray-600 text-sm">Amount Due</span>
            <span className="text-xl font-bold text-teal-700">
              {selectedCurrency.symbol} {baseAmount.toLocaleString()}
              {currency !== 'KES' && (
                <span className="text-xs font-normal text-gray-400 ml-1">(≈ KES {baseAmount.toLocaleString()})</span>
              )}
            </span>
          </div>

          {/* Method selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Payment Method</label>
            <div className="grid grid-cols-1 gap-2">
              {METHODS.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      method === m.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      method === m.id ? 'bg-teal-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${method === m.id ? 'text-teal-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method-specific fields */}
          {method === 'mpesa' && (
            <div>
              <label className="text-sm font-medium mb-1 block">M-Pesa Phone Number</label>
              <input type="tel" placeholder="e.g. 254712345678"
                value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full h-11 px-4 border rounded-xl text-sm" />
              <p className="text-xs text-gray-400 mt-1">Include country code (254 for Kenya)</p>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" maxLength={19}
                  value={cardNo} onChange={e => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  className="w-full h-11 px-4 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cardholder Name</label>
                <input type="text" placeholder="Name on card"
                  value={cardName} onChange={e => setCardName(e.target.value)}
                  className="w-full h-11 px-4 border rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Expiry</label>
                  <input type="text" placeholder="MM/YY"
                    className="w-full h-11 px-4 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CVV</label>
                  <input type="password" placeholder="•••" maxLength={4}
                    className="w-full h-11 px-4 border rounded-xl text-sm" />
                </div>
              </div>
            </div>
          )}

          {method === 'bank' && (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-blue-800">Bank Transfer Details</p>
                <p className="text-blue-700">Account Name: Fixie Ltd</p>
                <p className="text-blue-700">Account No: 1234567890</p>
                <p className="text-blue-700">SWIFT: FIXIEKEXX</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Your Reference / Transaction ID</label>
                <input type="text" placeholder="Bank transfer reference"
                  value={bankRef} onChange={e => setBankRef(e.target.value)}
                  className="w-full h-11 px-4 border rounded-xl text-sm" />
              </div>
            </div>
          )}

          {method === 'paypal' && (
            <div>
              <label className="text-sm font-medium mb-1 block">PayPal Email</label>
              <input type="email" placeholder="your@email.com"
                value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)}
                className="w-full h-11 px-4 border rounded-xl text-sm" />
            </div>
          )}

          {method === 'crypto' && (
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-orange-800">Send Payment To</p>
                <p className="text-orange-700 font-mono text-xs break-all">0xFixie1234ABCD5678EFGH9012IJKL3456MNOP</p>
                <p className="text-orange-600 text-xs">Accepts: USDT (TRC20/ERC20), BTC, ETH</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Your Sending Address</label>
                <input type="text" placeholder="Your wallet address"
                  value={cryptoAddr} onChange={e => setCryptoAddr(e.target.value)}
                  className="w-full h-11 px-4 border rounded-xl text-sm font-mono" />
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            disabled={!canSubmit()}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `Confirm Payment · ${selectedCurrency.symbol} ${baseAmount.toLocaleString()}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}