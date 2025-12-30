import React from 'react';
import { format } from 'date-fns';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const typeConfig = {
  send: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', label: 'Sent', sign: '-' },
  receive: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50', label: 'Received', sign: '+' },
  deposit: { icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Deposit', sign: '+' },
  withdraw: { icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Withdrawal', sign: '-' },
  booking_payment: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50', label: 'Payment', sign: '+' },
  refund: { icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Refund', sign: '+' },
  exchange: { icon: ArrowLeftRight, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Exchange', sign: '' },
};

const statusConfig = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  processing: { icon: Loader2, color: 'bg-blue-100 text-blue-700', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Completed' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
};

export default function TransactionItem({ transaction, walletAddress }) {
  const config = typeConfig[transaction.transaction_type] || typeConfig.send;
  const statusCfg = statusConfig[transaction.status] || statusConfig.pending;
  const Icon = config.icon;
  const StatusIcon = statusCfg.icon;

  const isIncoming = transaction.to_address === walletAddress || 
    ['receive', 'deposit', 'booking_payment', 'refund'].includes(transaction.transaction_type);

  const actualConfig = isIncoming && transaction.transaction_type === 'send' 
    ? typeConfig.receive 
    : config;

  const currencySymbol = transaction.currency === 'USD' ? '$' : 
                         transaction.currency === 'EUR' ? '€' : 
                         transaction.currency === 'GBP' ? '£' : 
                         transaction.currency === 'KES' ? 'KSh' : 
                         transaction.currency;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors rounded-xl">
      <div className={`w-12 h-12 rounded-full ${actualConfig.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${actualConfig.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{actualConfig.label}</p>
          <Badge className={`${statusCfg.color} text-xs`}>
            {statusCfg.label}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {transaction.description && (
            <p className="text-sm text-gray-500 truncate">{transaction.description}</p>
          )}
          {!transaction.description && transaction.to_address && transaction.to_address !== walletAddress && (
            <p className="text-sm text-gray-500 font-mono">
              To: {transaction.to_address.slice(0, 8)}...{transaction.to_address.slice(-6)}
            </p>
          )}
          {!transaction.description && transaction.from_address && transaction.from_address !== walletAddress && (
            <p className="text-sm text-gray-500 font-mono">
              From: {transaction.from_address.slice(0, 8)}...{transaction.from_address.slice(-6)}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-1">
          {format(new Date(transaction.created_date), 'MMM d, yyyy · h:mm a')}
        </p>
      </div>

      <div className="text-right">
        <p className={`font-semibold text-lg ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
          {isIncoming ? '+' : '-'}{currencySymbol} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        {transaction.fee > 0 && (
          <p className="text-xs text-gray-400">Fee: {currencySymbol} {transaction.fee.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}