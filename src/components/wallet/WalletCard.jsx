import React from 'react';
import { Wallet, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function WalletCard({ wallet, showBalance = true }) {
  const [balanceVisible, setBalanceVisible] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const primaryBalance = wallet?.balances?.find(b => b.currency === wallet?.primary_currency);
  const totalBalance = primaryBalance?.amount || 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet?.wallet_address);
    setCopied(true);
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 p-6 text-white shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-teal-100 text-sm">FixNow Wallet</p>
              <Badge className="bg-white/20 text-white border-0 mt-1">
                {wallet?.wallet_type || 'Standard'}
              </Badge>
            </div>
          </div>
          <button 
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Balance */}
        <div className="mb-8">
          <p className="text-teal-100 text-sm mb-2">Available Balance</p>
          {balanceVisible ? (
            <h2 className="text-4xl font-bold tracking-tight">
              {symbol} {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          ) : (
            <h2 className="text-4xl font-bold tracking-tight">••••••</h2>
          )}
        </div>

        {/* Wallet Address */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-xs mb-1">Wallet Address</p>
            <p className="font-mono text-sm">
              {wallet?.wallet_address?.slice(0, 12)}...{wallet?.wallet_address?.slice(-8)}
            </p>
          </div>
          <button 
            onClick={copyAddress}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-300" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Multi-Currency Balances */}
        {wallet?.balances?.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {wallet.balances.filter(b => b.currency !== wallet.primary_currency && b.amount > 0).map((balance, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="text-xs text-teal-100">{balance.currency_symbol || balance.currency}</span>
                <span className="text-sm font-semibold ml-1">{balance.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}