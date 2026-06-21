"use client";

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Send,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Smartphone,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

interface Transaction {
  id: string;
  reference: string;
  operator: 'orange' | 'mtn' | 'wave';
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  fee: number;
  phone: string;
  recipientName?: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-10948',
    reference: 'OM-2026-894710',
    operator: 'orange',
    type: 'deposit',
    amount: 45000,
    fee: 450,
    phone: '+225 07 48 93 02 11',
    recipientName: 'Koffi Kouassi',
    status: 'success',
    createdAt: '2026-06-21T09:30:00Z',
  },
  {
    id: 'TXN-10947',
    reference: 'WAV-84729103',
    operator: 'wave',
    type: 'transfer',
    amount: 15000,
    fee: 150,
    phone: '+221 77 123 45 67',
    recipientName: 'Awa Diop',
    status: 'success',
    createdAt: '2026-06-21T08:15:00Z',
  },
  {
    id: 'TXN-10946',
    reference: 'MTN-MOMO-748291',
    operator: 'mtn',
    type: 'withdrawal',
    amount: 80000,
    fee: 800,
    phone: '+225 05 92 84 71 03',
    recipientName: 'Soro Ibrahim',
    status: 'pending',
    createdAt: '2026-06-21T07:45:00Z',
  },
  {
    id: 'TXN-10945',
    reference: 'OM-2026-893041',
    operator: 'orange',
    type: 'withdrawal',
    amount: 25000,
    fee: 250,
    phone: '+225 07 11 22 33 44',
    recipientName: 'Mariam Koné',
    status: 'failed',
    createdAt: '2026-06-20T18:20:00Z',
  },
  {
    id: 'TXN-10944',
    reference: 'WAV-12948573',
    operator: 'wave',
    type: 'deposit',
    amount: 120000,
    fee: 0,
    phone: '+221 78 987 65 43',
    recipientName: 'Ousmane Sy',
    status: 'success',
    createdAt: '2026-06-20T14:10:00Z',
  },
  {
    id: 'TXN-10943',
    reference: 'MTN-MOMO-653920',
    operator: 'mtn',
    type: 'deposit',
    amount: 35000,
    fee: 350,
    phone: '+225 01 02 03 04 05',
    recipientName: 'Jean-Baptiste Yao',
    status: 'success',
    createdAt: '2026-06-20T10:05:00Z',
  },
  {
    id: 'TXN-10942',
    reference: 'OM-2026-891276',
    operator: 'orange',
    type: 'transfer',
    amount: 5000,
    fee: 50,
    phone: '+225 07 88 99 00 11',
    recipientName: 'Fatou Diallo',
    status: 'success',
    createdAt: '2026-06-19T16:40:00Z',
  }
];

export default function Home() {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  
  // State for filters
  const [search, setSearch] = useState('')
  const [selectedOperator, setSelectedOperator] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  // State for transaction details dialog
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null)

  // State for Quick Simulation form
  const [showSimulateForm, setShowSimulateForm] = useState(false)
  const [simOperator, setSimOperator] = useState<'orange' | 'mtn' | 'wave'>('orange')
  const [simType, setSimType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit')
  const [simAmount, setSimAmount] = useState('')
  const [simPhone, setSimPhone] = useState('')
  const [simRecipient, setSimRecipient] = useState('')

  useEffect(() => {
    const client = getSupabase()
    setSupabaseConnected(!!client)
  }, [])

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const successTxns = transactions.filter(t => t.status === 'success');
    
    // Inflow: deposits
    const totalInflow = successTxns
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Outflow: withdrawals + transfers
    const totalOutflow = successTxns
      .filter(t => t.type === 'withdrawal' || t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = 154200 + totalInflow - totalOutflow;

    const totalCount = transactions.length;
    const successCount = transactions.filter(t => t.status === 'success').length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

    return {
      balance,
      inflow: totalInflow,
      outflow: totalOutflow,
      successRate
    };
  }, [transactions])

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchSearch = 
        txn.reference.toLowerCase().includes(search.toLowerCase()) ||
        txn.phone.includes(search) ||
        (txn.recipientName && txn.recipientName.toLowerCase().includes(search.toLowerCase()));
      
      const matchOperator = selectedOperator === 'all' || txn.operator === selectedOperator;
      const matchType = selectedType === 'all' || txn.type === selectedType;
      const matchStatus = selectedStatus === 'all' || txn.status === selectedStatus;

      return matchSearch && matchOperator && matchType && matchStatus;
    });
  }, [transactions, search, selectedOperator, selectedType, selectedStatus]);

  // Handle Simulation
  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAmount || !simPhone) return;

    setLoading(true);

    setTimeout(() => {
      const amount = parseFloat(simAmount);
      const fee = simType === 'deposit' ? 0 : Math.round(amount * 0.01); // 1% fee for withdrawal/transfer
      
      const newTxn: Transaction = {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        reference: `${simOperator.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`,
        operator: simOperator,
        type: simType,
        amount,
        fee,
        phone: simPhone,
        recipientName: simRecipient || 'Client Inconnu',
        status: 'success',
        createdAt: new Date().toISOString(),
      };

      setTransactions(prev => [newTxn, ...prev]);
      setLoading(false);
      setShowSimulateForm(false);
      
      // Reset form
      setSimAmount('');
      setSimPhone('');
      setSimRecipient('');
    }, 800);
  }

  // Operator Badge Helper
  const renderOperatorBadge = (operator: string) => {
    switch (operator) {
      case 'orange':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200/50">
            <span className="size-2 rounded-full bg-orange-500" />
            Orange Money
          </span>
        )
      case 'mtn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
            <span className="size-2 rounded-full bg-amber-500" />
            MTN MoMo
          </span>
        )
      case 'wave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200/50">
            <span className="size-2 rounded-full bg-sky-500" />
            Wave
          </span>
        )
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-natural-primary flex items-center justify-center text-natural-accent shadow-md">
              <Wallet className="size-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-natural-primary">Momo</span>
              <span className="text-[10px] block font-semibold text-natural-accent tracking-widest uppercase -mt-1">Premium</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              supabaseConnected 
                ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200/60' 
                : 'bg-amber-50/60 text-amber-800 border-amber-200/60'
            }`}>
              <Database className="size-3.5" />
              <span className="hidden sm:inline">Supabase: {supabaseConnected ? 'Connecté' : 'Simulation active'}</span>
              <span className="sm:hidden">{supabaseConnected ? 'Supabase OK' : 'Simulation'}</span>
              {supabaseConnected ? (
                <CheckCircle2 className="size-3.5 text-emerald-600 fill-emerald-100" />
              ) : (
                <AlertCircle className="size-3.5 text-amber-600 fill-amber-100" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* Top welcome & action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-extrabold text-natural-primary tracking-tight">
              Tableau de bord financier
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Suivi et analyses de vos comptes Orange Money, MTN MoMo et Wave.
            </p>
          </div>
          <Button variant="premium" size="lg" onClick={() => setShowSimulateForm(true)} className="w-full sm:w-auto">
            <Plus className="size-4 mr-2" /> Nouvelle Transaction
          </Button>
        </div>

        {/* Stats KPIs Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Solde Total */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-natural-primary text-white p-6 rounded-[32px] shadow-lg relative overflow-hidden flex flex-col justify-between h-40"
          >
            <div className="absolute -right-10 -top-10 size-28 rounded-full bg-natural-accent/15 blur-2xl" />
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Solde Momo</span>
              <Wallet className="size-5 text-natural-accent" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight">
                {stats.balance.toLocaleString('fr-FR')} <span className="text-natural-accent text-sm">FCFA</span>
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">Base simulation active</span>
            </div>
          </motion.div>

          {/* Entrées */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white border border-stone-200/80 p-6 rounded-[32px] shadow-sm flex flex-col justify-between h-40"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Dépôts / Entrées</span>
              <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="size-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-natural-primary">
                +{stats.inflow.toLocaleString('fr-FR')} <span className="text-stone-500 text-xs font-sans">FCFA</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> Volume positif
              </span>
            </div>
          </motion.div>

          {/* Sorties */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white border border-stone-200/80 p-6 rounded-[32px] shadow-sm flex flex-col justify-between h-40"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Retraits / Sorties</span>
              <div className="size-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <ArrowUpRight className="size-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-natural-primary">
                -{stats.outflow.toLocaleString('fr-FR')} <span className="text-stone-500 text-xs font-sans">FCFA</span>
              </span>
              <span className="text-[10px] text-red-500 font-semibold block mt-1 flex items-center gap-1">
                <TrendingDown className="size-3" /> Sorties gérées
              </span>
            </div>
          </motion.div>

          {/* Taux de Réussite */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white border border-stone-200/80 p-6 rounded-[32px] shadow-sm flex flex-col justify-between h-40"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Taux de Réussite</span>
              <div className="size-8 rounded-lg bg-stone-50 flex items-center justify-center text-natural-primary">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-mono font-bold text-natural-primary">
                {stats.successRate}%
              </span>
              <span className="text-[10px] text-stone-500 block mt-1">Sur l'ensemble des flux</span>
            </div>
          </motion.div>
        </section>

        {/* Search & Filters Section */}
        <section className="bg-white border border-stone-200/80 rounded-[32px] p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 size-4.5" />
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par téléphone, référence, client..."
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-accent transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Operator Select Filter */}
              <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-2xl p-1">
                <button 
                  onClick={() => setSelectedOperator('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedOperator === 'all' 
                      ? 'bg-natural-primary text-white shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Tous
                </button>
                <button 
                  onClick={() => setSelectedOperator('orange')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedOperator === 'orange' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Orange
                </button>
                <button 
                  onClick={() => setSelectedOperator('mtn')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedOperator === 'mtn' 
                      ? 'bg-amber-500 text-natural-primary shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  MTN
                </button>
                <button 
                  onClick={() => setSelectedOperator('wave')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedOperator === 'wave' 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Wave
                </button>
              </div>

              {/* Type Select */}
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
              >
                <option value="all">Tous types</option>
                <option value="deposit">Dépôt</option>
                <option value="withdrawal">Retrait</option>
                <option value="transfer">Transfert</option>
              </select>

              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
              >
                <option value="all">Tous statuts</option>
                <option value="success">Succès</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoué</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-100 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Référence & Date</th>
                  <th className="py-4 px-4">Opérateur</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Destinataire / Mobile</th>
                  <th className="py-4 px-4 text-right">Montant</th>
                  <th className="py-4 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-sm">
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(txn => (
                      <motion.tr 
                        key={txn.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveTransaction(txn)}
                        className="hover:bg-stone-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="font-semibold text-natural-primary group-hover:text-natural-accent transition-colors">
                            {txn.reference}
                          </div>
                          <div className="text-xs text-stone-400 mt-0.5">
                            {new Date(txn.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {renderOperatorBadge(txn.operator)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            txn.type === 'deposit' ? 'bg-emerald-50 text-emerald-700' :
                            txn.type === 'withdrawal' ? 'bg-red-50 text-red-700' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {txn.type === 'deposit' ? 'Dépôt' : txn.type === 'withdrawal' ? 'Retrait' : 'Transfert'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-stone-700">{txn.recipientName}</div>
                          <div className="text-xs text-stone-400 mt-0.5">{txn.phone}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-natural-primary">
                          {txn.amount.toLocaleString('fr-FR')} <span className="text-xs font-sans text-stone-400 font-normal">FCFA</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            txn.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            txn.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {txn.status === 'success' ? 'Succès' : txn.status === 'pending' ? 'En attente' : 'Échoué'}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400 font-medium">
                        Aucune transaction ne correspond à vos critères de recherche.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Slide-over simulation dialog / drawer */}
      <AnimatePresence>
        {showSimulateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSimulateForm(false)}
              className="absolute inset-0 bg-black"
            />
            {/* Drawer Content */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-natural-primary">Simuler un flux</h2>
                    <p className="text-xs text-stone-500">Ajouter une transaction test en temps réel.</p>
                  </div>
                  <button onClick={() => setShowSimulateForm(false)} className="size-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors">
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSimulate} className="flex flex-col gap-5">
                  {/* Operator */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Opérateur</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['orange', 'mtn', 'wave'] as const).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setSimOperator(op)}
                          className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all uppercase ${
                            simOperator === op 
                              ? op === 'orange' ? 'border-orange-500 bg-orange-50 text-orange-600'
                                : op === 'mtn' ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-sky-500 bg-sky-50 text-sky-600'
                              : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Type de transaction</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['deposit', 'withdrawal', 'transfer'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSimType(t)}
                          className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                            simType === t 
                              ? 'border-natural-primary bg-natural-primary text-white shadow-sm'
                              : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          {t === 'deposit' ? 'Dépôt' : t === 'withdrawal' ? 'Retrait' : 'Transfert'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Montant (FCFA)</label>
                    <input 
                      type="number"
                      required
                      placeholder="Ex: 25000"
                      value={simAmount}
                      onChange={e => setSimAmount(e.target.value)}
                      className="w-full p-3.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Téléphone destinataire</label>
                    <input 
                      type="tel"
                      required
                      placeholder="Ex: +225 07 00 00 00 00"
                      value={simPhone}
                      onChange={e => setSimPhone(e.target.value)}
                      className="w-full p-3.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
                    />
                  </div>

                  {/* Nom du destinataire */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Nom du destinataire (Optionnel)</label>
                    <input 
                      type="text"
                      placeholder="Ex: Kouamé Marc"
                      value={simRecipient}
                      onChange={e => setSimRecipient(e.target.value)}
                      className="w-full p-3.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
                    />
                  </div>

                  <Button variant="premium" size="lg" type="submit" loading={loading} className="mt-4 w-full">
                    Confirmer & Simuler
                  </Button>
                </form>
              </div>
              <p className="text-[10px] text-center text-stone-400 mt-6">
                Le solde dynamique sera recalculé automatiquement après validation.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Transaction Dialog */}
      <AnimatePresence>
        {activeTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTransaction(null)}
              className="absolute inset-0 bg-black"
            />
            {/* Dialog Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl flex flex-col gap-6 overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveTransaction(null)}
                className="absolute right-6 top-6 size-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="flex flex-col items-center gap-4 text-center mt-4">
                <div className="size-16 rounded-full bg-natural-primary/5 flex items-center justify-center text-natural-primary">
                  <FileText className="size-8" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-natural-primary">Fiche Transaction</h3>
                  <span className="text-xs text-stone-400 font-mono">{activeTransaction.reference}</span>
                </div>
              </div>

              {/* Information Rows */}
              <div className="bg-stone-50 rounded-2xl p-5 flex flex-col gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Opérateur</span>
                  <span className="font-semibold text-stone-800 uppercase">{activeTransaction.operator}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Type</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {activeTransaction.type === 'deposit' ? 'Dépôt' : activeTransaction.type === 'withdrawal' ? 'Retrait' : 'Transfert'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Montant net</span>
                  <span className="font-mono font-bold text-natural-primary text-base">
                    {activeTransaction.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Frais d'opérateur</span>
                  <span className="font-mono font-medium text-stone-600">
                    {activeTransaction.fee.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <hr className="border-stone-200/60" />
                <div className="flex flex-col gap-1">
                  <span className="text-stone-400 text-xs">Destinataire / Numéro</span>
                  <span className="font-semibold text-stone-800">{activeTransaction.recipientName}</span>
                  <span className="text-xs text-stone-500">{activeTransaction.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Date & Heure</span>
                  <span className="text-stone-800 font-medium">
                    {new Date(activeTransaction.createdAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium', timeStyle: 'short'
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 pt-6">
                <span className="text-xs text-stone-400">Statut de la transaction</span>
                <span className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  activeTransaction.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  activeTransaction.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {activeTransaction.status === 'success' ? 'Réussie' : activeTransaction.status === 'pending' ? 'En attente' : 'Échouée'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-12 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} Momo Premium. Conçu pour tolkeeee-lab.</p>
      </footer>
    </div>
  )
}

