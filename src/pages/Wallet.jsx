import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Send,
  Download,
  Plus,
  ArrowUpRight,
  History,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  Filter,
  ArrowLeftRight,
  Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletCard from '../components/wallet/WalletCard';
import TransactionItem from '../components/wallet/TransactionItem';
import SendMoneyDialog from '../components/wallet/SendMoneyDialog';
import DepositDialog from '../components/wallet/DepositDialog';
import WithdrawDialog from '../components/wallet/WithdrawDialog';
import ExchangeDialog from '../components/wallet/ExchangeDialog';
import RecurringTransactionDialog from '../components/wallet/RecurringTransactionDialog';
import RecurringTransactionCard from '../components/wallet/RecurringTransactionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [showSend, setShowSend] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  // Get or create wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['myWallet', user?.id],
    queryFn: async () => {
      let wallets = await base44.entities.Wallet.filter({ user_id: user.id });
      
      if (wallets.length === 0) {
        // Create wallet
        const newWallet = await base44.entities.Wallet.create({
          user_id: user.id,
          wallet_address: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          balances: [
            { currency: 'KES', amount: 1000, currency_symbol: 'KSh' },
            { currency: 'USD', amount: 0, currency_symbol: '$' },
            { currency: 'EUR', amount: 0, currency_symbol: '€' },
            { currency: 'GBP', amount: 0, currency_symbol: '£' },
          ],
          primary_currency: 'KES',
          wallet_type: user.user_type === 'technician' ? 'technician' : 'standard',
          status: 'active',
        });
        return newWallet;
      }
      
      return wallets[0];
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['myTransactions', wallet?.id],
    queryFn: async () => {
      const sent = await base44.entities.Transaction.filter(
        { from_wallet_id: wallet.id },
        '-created_date',
        50
      );
      const received = await base44.entities.Transaction.filter(
        { to_wallet_id: wallet.id },
        '-created_date',
        50
      );
      return [...sent, ...received].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!wallet,
  });

  const { data: recurringTransactions = [], isLoading: recurringLoading } = useQuery({
    queryKey: ['recurringTransactions', wallet?.id],
    queryFn: () => base44.entities.RecurringTransaction.filter(
      { wallet_id: wallet.id },
      '-created_date',
      100
    ),
    enabled: !!wallet,
  });

  // Send money mutation
  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Get recipient wallet by address
      const recipientWallets = await base44.entities.Wallet.filter({ 
        wallet_address: data.recipient.trim()
      });

      if (recipientWallets.length === 0) {
        throw new Error('Recipient wallet not found. Please verify the wallet address.');
      }

      const recipientWallet = recipientWallets[0];

      if (recipientWallet.id === wallet.id) {
        throw new Error('Cannot send money to yourself');
      }

      // Create transaction
      const transaction = await base44.entities.Transaction.create({
        transaction_id: txId,
        from_wallet_id: wallet.id,
        to_wallet_id: recipientWallet.id,
        from_address: wallet.wallet_address,
        to_address: data.recipient,
        amount: parseFloat(data.amount),
        currency: data.currency,
        transaction_type: 'send',
        status: 'completed',
        payment_method: 'wallet',
        fee: 0,
        description: data.description,
      });

      // Update sender balance
      const senderBalances = [...wallet.balances];
      const senderBalanceIndex = senderBalances.findIndex(b => b.currency === data.currency);
      senderBalances[senderBalanceIndex].amount -= parseFloat(data.amount);
      await base44.entities.Wallet.update(wallet.id, { 
        balances: senderBalances,
        total_sent: (wallet.total_sent || 0) + parseFloat(data.amount)
      });

      // Update recipient balance
      const recipientBalances = [...recipientWallet.balances];
      let recipientBalanceIndex = recipientBalances.findIndex(b => b.currency === data.currency);
      if (recipientBalanceIndex === -1) {
        recipientBalances.push({ currency: data.currency, amount: parseFloat(data.amount), currency_symbol: data.currency });
        recipientBalanceIndex = recipientBalances.length - 1;
      } else {
        recipientBalances[recipientBalanceIndex].amount += parseFloat(data.amount);
      }
      await base44.entities.Wallet.update(recipientWallet.id, { 
        balances: recipientBalances,
        total_received: (recipientWallet.total_received || 0) + parseFloat(data.amount)
      });

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWallet']);
      queryClient.invalidateQueries(['myTransactions']);
      setShowSend(false);
    },
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data) => {
      const depositRequest = await base44.entities.DepositRequest.create({
        ...data,
        user_id: user.id,
        status: 'completed',
        external_reference: `DEP_${Date.now()}`,
      });

      // Update wallet balance
      const balances = [...wallet.balances];
      let balanceIndex = balances.findIndex(b => b.currency === data.currency);
      if (balanceIndex === -1) {
        balances.push({ currency: data.currency, amount: data.amount, currency_symbol: data.currency });
      } else {
        balances[balanceIndex].amount += data.amount;
      }
      await base44.entities.Wallet.update(wallet.id, { 
        balances,
        total_received: (wallet.total_received || 0) + data.amount
      });

      // Create transaction record
      await base44.entities.Transaction.create({
        transaction_id: `tx_${Date.now()}`,
        to_wallet_id: wallet.id,
        to_address: wallet.wallet_address,
        amount: data.amount,
        currency: data.currency,
        transaction_type: 'deposit',
        status: 'completed',
        payment_method: data.payment_method,
        external_reference: depositRequest.external_reference,
        description: `Deposit via ${data.payment_method}`,
      });

      return depositRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWallet']);
      queryClient.invalidateQueries(['myTransactions']);
      setShowDeposit(false);
    },
  });

  // Exchange mutation
  const exchangeMutation = useMutation({
    mutationFn: async (data) => {
      const txId = `tx_${Date.now()}_exchange`;

      // Update balances
      const balances = [...wallet.balances];
      
      // Deduct from source currency
      let fromIndex = balances.findIndex(b => b.currency === data.fromCurrency);
      balances[fromIndex].amount -= data.amount;

      // Add to target currency
      let toIndex = balances.findIndex(b => b.currency === data.toCurrency);
      if (toIndex === -1) {
        const toCurrency = currencies.find(c => c.code === data.toCurrency);
        balances.push({ 
          currency: data.toCurrency, 
          amount: data.convertedAmount,
          currency_symbol: toCurrency?.symbol || data.toCurrency
        });
      } else {
        balances[toIndex].amount += data.convertedAmount;
      }

      await base44.entities.Wallet.update(wallet.id, { balances });

      // Create transaction record
      await base44.entities.Transaction.create({
        transaction_id: txId,
        from_wallet_id: wallet.id,
        to_wallet_id: wallet.id,
        from_address: wallet.wallet_address,
        to_address: wallet.wallet_address,
        amount: data.amount,
        currency: data.fromCurrency,
        transaction_type: 'exchange',
        status: 'completed',
        payment_method: 'wallet',
        from_currency: data.fromCurrency,
        to_currency: data.toCurrency,
        exchange_rate: data.exchangeRate,
        description: `Exchanged ${data.amount} ${data.fromCurrency} to ${data.convertedAmount.toFixed(2)} ${data.toCurrency}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWallet']);
      queryClient.invalidateQueries(['myTransactions']);
      setShowExchange(false);
    },
  });

  // Recurring transaction mutation
  const createRecurringMutation = useMutation({
    mutationFn: (data) => base44.entities.RecurringTransaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recurringTransactions']);
      setShowRecurring(false);
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecurringTransaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recurringTransactions']);
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringTransaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['recurringTransactions']);
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data) => {
      const withdrawRequest = await base44.entities.WithdrawalRequest.create({
        ...data,
        user_id: user.id,
        status: 'completed',
        external_reference: `WD_${Date.now()}`,
      });

      // Update wallet balance
      const balances = [...wallet.balances];
      const balanceIndex = balances.findIndex(b => b.currency === data.currency);
      balances[balanceIndex].amount -= (data.amount + data.fee);
      await base44.entities.Wallet.update(wallet.id, { 
        balances,
        total_sent: (wallet.total_sent || 0) + data.amount
      });

      // Create transaction record
      await base44.entities.Transaction.create({
        transaction_id: `tx_${Date.now()}`,
        from_wallet_id: wallet.id,
        from_address: wallet.wallet_address,
        amount: data.amount,
        currency: data.currency,
        transaction_type: 'withdraw',
        status: 'completed',
        payment_method: data.withdrawal_method,
        external_reference: withdrawRequest.external_reference,
        fee: data.fee,
        description: `Withdrawal to ${data.withdrawal_method}`,
      });

      return withdrawRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWallet']);
      queryClient.invalidateQueries(['myTransactions']);
      setShowWithdraw(false);
    },
  });

  if (walletLoading) {
    return <LoadingSpinner text="Loading wallet..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('Profile')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Wallet Card */}
        <WalletCard wallet={wallet} />

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-3">
          <button
            onClick={() => setShowSend(true)}
            className="bg-white rounded-2xl p-4 hover:shadow-md transition-all border-2 border-transparent hover:border-teal-200"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-teal-600" />
            </div>
            <p className="font-semibold text-gray-900">Send</p>
            <p className="text-xs text-gray-500">Transfer money</p>
          </button>

          <button
            onClick={() => setShowDeposit(true)}
            className="bg-white rounded-2xl p-4 hover:shadow-md transition-all border-2 border-transparent hover:border-green-200"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">Deposit</p>
            <p className="text-xs text-gray-500">Add funds</p>
          </button>

          <button
            onClick={() => setShowWithdraw(true)}
            className="bg-white rounded-2xl p-4 hover:shadow-md transition-all border-2 border-transparent hover:border-orange-200"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-orange-600" />
            </div>
            <p className="font-semibold text-gray-900">Withdraw</p>
            <p className="text-xs text-gray-500">Cash out</p>
          </button>

          <button
            onClick={() => setShowExchange(true)}
            className="bg-white rounded-2xl p-4 hover:shadow-md transition-all border-2 border-transparent hover:border-purple-200"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight className="w-6 h-6 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900">Exchange</p>
            <p className="text-xs text-gray-500">Convert</p>
          </button>

          <button
            onClick={() => setShowRecurring(true)}
            className="bg-white rounded-2xl p-4 hover:shadow-md transition-all border-2 border-transparent hover:border-indigo-200"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Repeat className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="font-semibold text-gray-900">Recurring</p>
            <p className="text-xs text-gray-500">Automate</p>
          </button>
          </div>

        {/* Recurring Transactions */}
        {recurringTransactions.length > 0 && (
          <div className="bg-white rounded-2xl border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold">Recurring Payments</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRecurring(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {recurringTransactions.map((recurring) => (
                <RecurringTransactionCard
                  key={recurring.id}
                  recurring={recurring}
                  onPause={(rec) => updateRecurringMutation.mutate({ 
                    id: rec.id, 
                    data: { status: 'paused' }
                  })}
                  onResume={(rec) => updateRecurringMutation.mutate({ 
                    id: rec.id, 
                    data: { status: 'active' }
                  })}
                  onDelete={(rec) => deleteRecurringMutation.mutate(rec.id)}
                  isLoading={updateRecurringMutation.isPending || deleteRecurringMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
            <Globe className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-blue-900">Global Transfers</h3>
            <p className="text-sm text-blue-700 mt-1">Send to any country, any currency</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
            <Shield className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-purple-900">Secure & Safe</h3>
            <p className="text-sm text-purple-700 mt-1">Bank-level security protection</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4">
            <Zap className="w-8 h-8 text-amber-600 mb-2" />
            <h3 className="font-semibold text-amber-900">Instant</h3>
            <p className="text-sm text-amber-700 mt-1">Transactions in seconds</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold">Transaction History</h2>
              </div>
              <Button variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>

          <div>
            {txLoading ? (
              <LoadingSpinner />
            ) : transactions.length > 0 ? (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <TransactionItem 
                    key={tx.id} 
                    transaction={tx} 
                    walletAddress={wallet?.wallet_address}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No transactions yet"
                description="Your transaction history will appear here"
              />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SendMoneyDialog
        open={showSend}
        onOpenChange={setShowSend}
        wallet={wallet}
        onSend={(data) => sendMutation.mutate(data)}
        isLoading={sendMutation.isPending}
      />

      <DepositDialog
        open={showDeposit}
        onOpenChange={setShowDeposit}
        wallet={wallet}
        onDeposit={(data) => depositMutation.mutate(data)}
        isLoading={depositMutation.isPending}
      />

      <WithdrawDialog
        open={showWithdraw}
        onOpenChange={setShowWithdraw}
        wallet={wallet}
        onWithdraw={(data) => withdrawMutation.mutate(data)}
        isLoading={withdrawMutation.isPending}
      />

      <ExchangeDialog
        open={showExchange}
        onOpenChange={setShowExchange}
        wallet={wallet}
        onExchange={(data) => exchangeMutation.mutate(data)}
        isLoading={exchangeMutation.isPending}
      />

      <RecurringTransactionDialog
        open={showRecurring}
        onOpenChange={setShowRecurring}
        wallet={wallet}
        onSave={(data) => createRecurringMutation.mutate(data)}
        isLoading={createRecurringMutation.isPending}
      />
      </div>
      );
      }