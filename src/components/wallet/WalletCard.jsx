import React from 'react';
import { Wrench, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function WalletCard({ wallet, showBalance = true }) {
  const [balanceVisible, setBalanceVisible] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const primaryBalance = wallet?.balances?.find(b => b.currency === wallet?.primary_currency);
  const totalBalance = primaryBalance?.amount || 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet?.wallet_address);
    setCopied(true);
    toast.success('Wallet ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const currencySymbols = {
    'KES': 'KSh',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'NGN': '₦',
    'ZAR': 'R'
  };

  const symbol = currencySymbols[wallet?.primary_currency] || wallet?.primary_currency;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 p-8 text-white shadow-2xl">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-400/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-teal-300/20 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl">FixNow</h3>
              <p className="text-teal-100 text-sm">Digital Wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30 px-3 py-1">
              {wallet?.primary_currency || 'USD'}
            </Badge>
            <button 
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
            >
              {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-8">
          <p className="text-teal-100 text-sm mb-2 font-medium">Available Balance</p>
          {balanceVisible ? (
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-bold tracking-tight">
                {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-2xl font-semibold text-teal-100">{symbol}</span>
            </div>
          ) : (
            <h2 className="text-5xl font-bold tracking-tight">••••••</h2>
          )}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-medium">Demo Mode</span>
          </div>
        </div>

        {/* Multi-Currency Balances */}
        {wallet?.balances?.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {wallet.balances.filter(b => b.currency !== wallet.primary_currency).map((balance, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-xs text-teal-100 mb-0.5">{balance.currency}</p>
                <p className="font-bold text-sm">
                  {balanceVisible 
                    ? `${balance.currency_symbol || balance.currency} ${balance.amount.toLocaleString()}`
                    : '••••'
                  }
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Wallet Address */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-teal-100 text-xs mb-1 font-medium">Wallet ID</p>
              <p className="font-mono text-sm truncate">
                {wallet?.wallet_address}
              </p>
            </div>
            <button 
              onClick={copyAddress}
              className="p-2.5 hover:bg-white/20 rounded-xl transition-all shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-300" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}