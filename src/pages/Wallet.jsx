import React, { useState, useEffect, useMemo } from 'react';
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
import TransactionFilters from '../components/wallet/TransactionFilters';
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    currency: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc',
  });
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

  // Filter and sort transactions
  const filteredTransactions = React.useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === filters.type);
    }

    // Filter by currency
    if (filters.currency !== 'all') {
      filtered = filtered.filter(tx => tx.currency === filters.currency);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(tx => new Date(tx.created_date) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tx => new Date(tx.created_date) <= toDate);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date-asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, filters]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to={createPageUrl('Profile')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Wallet</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200">
              <span className="text-xs font-semibold text-teal-700">Demo Mode</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Wallet Card */}
        <WalletCard wallet={wallet} />

        {/* Quick Actions - Modern Grid */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowSend(true)}
              className="group bg-white rounded-2xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-teal-300 active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/30 group-hover:shadow-xl group-hover:shadow-teal-500/40 transition-shadow">
                <Send className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-base">Send Money</p>
              <p className="text-xs text-gray-500 mt-1">Transfer funds</p>
            </button>

            <button
              onClick={() => setShowDeposit(true)}
              className="group bg-white rounded-2xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-300 active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/30 group-hover:shadow-xl group-hover:shadow-green-500/40 transition-shadow">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-base">Add Funds</p>
              <p className="text-xs text-gray-500 mt-1">Deposit money</p>
            </button>

            <button
              onClick={() => setShowWithdraw(true)}
              className="group bg-white rounded-2xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-orange-300 active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-orange-500/40 transition-shadow">
                <Download className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-base">Withdraw</p>
              <p className="text-xs text-gray-500 mt-1">Cash out</p>
            </button>

            <button
              onClick={() => setShowExchange(true)}
              className="group bg-white rounded-2xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-purple-300 active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-shadow">
                <ArrowLeftRight className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-base">Convert</p>
              <p className="text-xs text-gray-500 mt-1">Exchange currency</p>
            </button>

            <button
              onClick={() => setShowRecurring(true)}
              className="group bg-white rounded-2xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-indigo-300 active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-shadow">
                <Repeat className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-base">Recurring</p>
              <p className="text-xs text-gray-500 mt-1">Automate payments</p>
            </button>
          </div>
        </div>

        {/* Recurring Transactions */}
        {recurringTransactions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Recurring Payments</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRecurring(true)}
                  className="hover:bg-indigo-50"
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

        {/* Enhanced Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Global Transfers</h3>
            <p className="text-sm text-gray-600">Send money across regions</p>
          </div>
          <div className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Access</h3>
            <p className="text-sm text-gray-600">Encrypted & protected transactions</p>
          </div>
          <div className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Processing</h3>
            <p className="text-sm text-gray-600">Transactions complete in seconds</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <History className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                  {transactions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Showing {filteredTransactions.length} of {transactions.length} transactions
                    </p>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-gray-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          {showFilters && (
            <TransactionFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({
                type: 'all',
                currency: 'all',
                status: 'all',
                dateFrom: '',
                dateTo: '',
                sortBy: 'date-desc',
              })}
            />
          )}

          <div>
            {txLoading ? (
              <LoadingSpinner />
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y">
                {filteredTransactions.map((tx) => (
                  <TransactionItem 
                    key={tx.id} 
                    transaction={tx} 
                    walletAddress={wallet?.wallet_address}
                  />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <EmptyState
                icon={Filter}
                title="No matching transactions"
                description="Try adjusting your filters"
                actionLabel="Clear Filters"
                onAction={() => setFilters({
                  type: 'all',
                  currency: 'all',
                  status: 'all',
                  dateFrom: '',
                  dateTo: '',
                  sortBy: 'date-desc',
                })}
              />
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