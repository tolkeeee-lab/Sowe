"use client";

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Building, 
  Sliders, 
  Coins, 
  ShieldAlert, 
  Trash2, 
  Users, 
  AlertTriangle,
  Calendar,
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  Zap,
  Info,
  Download
} from 'lucide-react'
import { Button } from './ui/button'
import { Transaction } from '../types'
import { getSupabase } from '../lib/supabase'

const BENIN_FORFAITS = {
  mtn: [
    { name: "MTN Internet 500F (1.2 Go)", price: 500 },
    { name: "MTN Internet 1000F (3 Go)", price: 1000 },
    { name: "MTN Maxi 2000F (Appels+Net)", price: 2000 },
    { name: "MTN Appel 500F (60 min)", price: 500 }
  ],
  moov: [
    { name: "Moov Giga 500F (1 Go)", price: 500 },
    { name: "Moov Giga 1000F (2.5 Go)", price: 1000 },
    { name: "Moov Internet 2000F (6 Go)", price: 2000 },
    { name: "Moov Appel 500F (60 min)", price: 500 }
  ],
  celtiis: [
    { name: "Celtiis Giga 500F (2 Go)", price: 500 },
    { name: "Celtiis Giga 1000F (5 Go)", price: 1000 },
    { name: "Celtiis Internet 2000F (12 Go)", price: 2000 },
    { name: "Celtiis Appel 500F (70 min)", price: 500 }
  ]
}

interface DashboardProprioProps {
  theme: 'dark' | 'light';
  role: 'proprio' | 'employe' | 'vm' | 'vm_hybrid';
  // Operational props (same as caissier)
  balances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
  syncAddTransaction: (txn: Transaction) => Promise<void>;
  syncToggleScamReport: (id: string, isReported: boolean) => Promise<void>;
  setOpInput: (op: 'mtn' | 'moov' | 'celtiis') => void;
  setSelectedForfait: (val: string) => void;
  setActiveReceipt: (txn: Transaction | null) => void;
  // Admin props
  cabins: any[];
  activeCabinId: string | null;
  newCabinName: string;
  setNewCabinName: (name: string) => void;
  handleCreateCabin: (e: React.FormEvent) => Promise<void>;
  creatingCabin: boolean;
  allEmployees: any[];
  handleAssignCabin: (employeeId: string, cabinId: string) => Promise<void>;
  coffres: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
  setCoffreMtn: (val: string) => void;
  setCoffreMoov: (val: string) => void;
  setCoffreCeltiis: (val: string) => void;
  setCoffreCash: (val: string) => void;
  setShowCoffreModal: (show: boolean) => void;
  setActionType: (type: 'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'adjust_ext' | null) => void;
  blacklist: string[];
  setShowBlacklistModal: (show: boolean) => void;
  transactions: Transaction[];
  deleteTransaction: (id: string) => Promise<void>;
  renderOperatorBadge: (op: string) => React.ReactNode;
  syncBalances: (newBalances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  }) => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setActiveTab: (tab: 'caissier' | 'vm' | 'proprietaire') => void;
  TODAY_STR: string;
  YESTERDAY_STR: string;
  getWeekRange: (dateStr: string) => { start: string; end: string };
  getLocalDateString: (d?: Date) => string;
  getYesterdayDateString: () => string;
}

export function DashboardProprio({
  theme,
  role,
  balances,
  syncAddTransaction,
  syncToggleScamReport,
  setOpInput,
  setSelectedForfait,
  setActiveReceipt,
  cabins,
  activeCabinId,
  newCabinName,
  setNewCabinName,
  handleCreateCabin,
  creatingCabin,
  allEmployees,
  handleAssignCabin,
  coffres,
  setCoffreMtn,
  setCoffreMoov,
  setCoffreCeltiis,
  setCoffreCash,
  setShowCoffreModal,
  setActionType,
  blacklist,
  setShowBlacklistModal,
  transactions,
  deleteTransaction,
  renderOperatorBadge,
  syncBalances,
  setTransactions,
  setActiveTab,
  TODAY_STR,
  YESTERDAY_STR,
  getWeekRange,
  getLocalDateString,
  getYesterdayDateString
}: DashboardProprioProps) {
  // Local states for Proprio analytical dashboards
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [selectedReportDate, setSelectedReportDate] = useState<string>(TODAY_STR)
  const [reportOperator, setReportOperator] = useState<'all' | 'mtn' | 'moov' | 'celtiis'>('all')

  // Local states for history filters (same as caissier)
  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState<'all' | 'deposit' | 'withdrawal' | 'credit' | 'forfait'>('all')
  const [historyOperator, setHistoryOperator] = useState<'all' | 'mtn' | 'moov' | 'celtiis'>('all')

  // Computed: global balance
  const soldeGlobal = useMemo(() => {
    return balances.mtn + balances.moov + balances.celtiis + balances.cash
  }, [balances])

  // Computed: filtered history
  const filteredRecentHistory = useMemo(() => {
    return transactions.filter(txn => {
      const matchSearch = historySearch.trim() === '' || txn.phone.includes(historySearch.trim())
      const matchType = historyType === 'all' || txn.type === historyType
      const matchOperator = historyOperator === 'all' || txn.operator === historyOperator
      return matchSearch && matchType && matchOperator
    })
  }, [transactions, historySearch, historyType, historyOperator])

  const toggleScamReport = async (id: string) => {
    const txn = transactions.find(t => t.id === id)
    if (txn) {
      await syncToggleScamReport(id, !txn.isScamReported)
    }
  }

  const handleExportCSV = () => {
    const headers = 'ID,Telephone,Operateur,Type,Montant,Heure,Date,Details,Arnaque\n'
    const rows = transactions.map(t =>
      `${t.id},${t.phone},${t.operator},${t.type},${t.amount},${t.time},${t.date},${t.category},${t.isScamReported ? 'OUI' : 'NON'}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `historique_proprio_${new Date().toISOString().slice(0,10)}.csv`)
    link.click()
  }

  // Computed states for statistics
  const periodicReportStats = useMemo(() => {
    let periodTxns: Transaction[] = []
    
    if (periodType === 'day') {
      periodTxns = transactions.filter(t => t.date === selectedReportDate)
    } else if (periodType === 'week') {
      const range = getWeekRange(selectedReportDate)
      periodTxns = transactions.filter(t => t.date >= range.start && t.date <= range.end)
    } else if (periodType === 'month') {
      const targetPrefix = selectedReportDate.slice(0, 7) // YYYY-MM
      periodTxns = transactions.filter(t => t.date.startsWith(targetPrefix))
    } else if (periodType === 'year') {
      const targetPrefix = selectedReportDate.slice(0, 4) // YYYY
      periodTxns = transactions.filter(t => t.date.startsWith(targetPrefix))
    }

    if (reportOperator !== 'all') {
      periodTxns = periodTxns.filter(t => t.operator === reportOperator)
    }

    const stats = {
      deposit: { sum: 0, count: 0 },
      withdrawal: { sum: 0, count: 0 },
      credit: { sum: 0, count: 0 },
      forfait: { sum: 0, count: 0 },
      total: { sum: 0, count: 0 }
    }

    periodTxns.forEach(t => {
      if (t.type === 'deposit') {
        stats.deposit.sum += t.amount
        stats.deposit.count += 1
        stats.total.sum += t.amount
        stats.total.count += 1
      } else if (t.type === 'withdrawal') {
        stats.withdrawal.sum += t.amount
        stats.withdrawal.count += 1
        stats.total.sum += t.amount
        stats.total.count += 1
      } else if (t.type === 'credit') {
        stats.credit.sum += t.amount
        stats.credit.count += 1
        stats.total.sum += t.amount
        stats.total.count += 1
      } else if (t.type === 'forfait') {
        stats.forfait.sum += t.amount
        stats.forfait.count += 1
        stats.total.sum += t.amount
        stats.total.count += 1
      }
    })

    return stats
  }, [transactions, periodType, selectedReportDate, reportOperator, getWeekRange])

  const formattedReportPeriodLabel = useMemo(() => {
    if (periodType === 'day') {
      if (selectedReportDate === TODAY_STR) return "Aujourd'hui"
      if (selectedReportDate === YESTERDAY_STR) return "Hier"
      const parts = selectedReportDate.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      }
      return selectedReportDate
    } 
    
    if (periodType === 'week') {
      const range = getWeekRange(selectedReportDate)
      const pStart = range.start.split('-')
      const pEnd = range.end.split('-')
      const dStart = new Date(parseInt(pStart[0]), parseInt(pStart[1]) - 1, parseInt(pStart[2]))
      const dEnd = new Date(parseInt(pEnd[0]), parseInt(pEnd[1]) - 1, parseInt(pEnd[2]))
      return `Sem. du ${dStart.getDate()} ${dStart.toLocaleDateString('fr-FR', { month: 'short' })} au ${dEnd.getDate()} ${dEnd.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
    }

    if (periodType === 'month') {
      const parts = selectedReportDate.split('-')
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
      return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }

    if (periodType === 'year') {
      return `Année ${selectedReportDate.slice(0, 4)}`
    }

    return selectedReportDate
  }, [selectedReportDate, periodType, TODAY_STR, YESTERDAY_STR, getWeekRange])

  return (
    <div className="flex flex-col gap-6">

      {/* ═══════════════════════════════════════════════ */}
      {/* VUE OPÉRATIONNELLE (identique au Caissier)    */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Global Balance Card */}
      <section className={`p-6 rounded-[36px] border transition-all overflow-hidden relative ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22] shadow-2xl'
          : 'bg-gradient-to-b from-white to-[#F2EFE9] border-[#DCD6CD] shadow-md'
      }`}>
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center mb-4 relative z-10">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500">Solde Global en Cabine</span>
          <span className="text-[10px] font-bold text-natural-accent uppercase tracking-wider">
            Vue Propriétaire 👑
          </span>
        </div>

        <div className="text-center py-4 mb-6 relative z-10">
          <h2 className="text-5xl font-serif font-black tracking-tight text-natural-accent">
            {soldeGlobal.toLocaleString('fr-FR')} <span className="text-xl font-sans font-medium">FCFA</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
            theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
          }`}>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-500 mb-1.5 uppercase tracking-wider">
              <span className="size-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              SIM MTN MoMo
            </span>
            <div className="font-mono font-bold text-base text-amber-500">
              {balances.mtn.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
          </div>

          <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
            theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
          }`}>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-blue-500 mb-1.5 uppercase tracking-wider">
              <span className="size-2 rounded-full bg-blue-500 shadow-sm shadow-blue-550" />
              SIM Moov Money
            </span>
            <div className="font-mono font-bold text-base text-blue-500">
              {balances.moov.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
          </div>

          <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
            theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
          }`}>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 mb-1.5 uppercase tracking-wider">
              <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
              SIM Celtiis
            </span>
            <div className="font-mono font-bold text-base text-emerald-500">
              {balances.celtiis.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
          </div>

          <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
            theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
          }`}>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-purple-400 mb-1.5 uppercase tracking-wider">
              <span className="size-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500" />
              Tiroir Cash (Physique)
            </span>
            <div className="font-mono font-bold text-base text-purple-400">
              {balances.cash.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Operations Quick Buttons Grid */}
      <section className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setActionType('deposit'); setOpInput('mtn'); }}
          className="p-5 rounded-[28px] bg-natural-accent hover:bg-[#c9a430] text-[#0A0F0D] text-left flex flex-col justify-between h-28 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <ArrowDownLeft className="size-4.5 stroke-[3px]" />
            ENVOI (DÉPÔT)
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Cash Reçu → SIM Débitée</div>
            <div className="text-[8px] opacity-60 mt-0.5">MTN, Moov, Celtiis</div>
          </div>
        </button>

        <button
          onClick={() => { setActionType('withdrawal'); setOpInput('mtn'); }}
          className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-28 border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            theme === 'dark'
              ? 'border-[#1C2C22] bg-[#0E1B15] hover:bg-[#12241C] text-white shadow-lg'
              : 'border-[#DCD6CD] bg-white hover:bg-stone-50 text-[#111614] shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-500">
            <ArrowUpRight className="size-4.5 stroke-[3px]" />
            RETRAIT
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">SIM Créditée → Cash Donné</div>
            <div className="text-[8px] text-stone-400 mt-0.5">Distribution directe de cash</div>
          </div>
        </button>

        <button
          onClick={() => { setActionType('credit'); setOpInput('mtn'); }}
          className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-28 border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            theme === 'dark'
              ? 'border-[#1C2C22] bg-[#0E1B15] hover:bg-[#12241C] text-white shadow-lg'
              : 'border-[#DCD6CD] bg-white hover:bg-stone-50 text-[#111614] shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500">
            <Smartphone className="size-4.5" />
            VENTE CRÉDIT
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">Cash Reçu → Airtime</div>
            <div className="text-[8px] text-stone-400 mt-0.5">Recharges ordinaires</div>
          </div>
        </button>

        <button
          onClick={() => {
            setActionType('forfait');
            setOpInput('mtn');
            setSelectedForfait(BENIN_FORFAITS.mtn[0].name);
          }}
          className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-28 border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            theme === 'dark'
              ? 'border-[#1C2C22] bg-[#0E1B15] hover:bg-[#12241C] text-white shadow-lg'
              : 'border-[#DCD6CD] bg-white hover:bg-stone-50 text-[#111614] shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-500">
            <Zap className="size-4.5" />
            VENTE FORFAIT
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">Cash Reçu → Forfait Internet</div>
            <div className="text-[8px] text-stone-400 mt-0.5">Activation rapide d'offres</div>
          </div>
        </button>
      </section>

      {/* Safety tip */}
      <div className={`p-4 rounded-[24px] border flex gap-3 ${
        theme === 'dark'
          ? 'bg-[#0E1B15] border-[#1C2C22] text-[#E4EAD8]'
          : 'bg-[#F2EFE9] border-[#DCD6CD] text-[#332C12] font-medium'
      }`}>
        <Info className="size-5 shrink-0 text-amber-600 dark:text-natural-accent mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-extrabold text-amber-700 dark:text-natural-accent block mb-1">📢 RÈGLE D'OR CABINE :</span>
          Pour tout dépôt important (≥ 100 000 FCFA) : comptez physiquement les billets, mettez-les en sécurité dans le tiroir fermé, puis validez le transfert sur votre mobile.
        </div>
      </div>

      {/* Recent history list with filters */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Historique Récent</h3>
            <p className="text-[9px] text-stone-500">Journal d'activité filtrable de la cabine</p>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg ${
            theme === 'dark' ? 'bg-[#0E1B15] text-stone-300 border border-[#1C2C22]' : 'bg-[#F2EFE9] text-stone-700'
          }`}>
            Affichés: {filteredRecentHistory.length} Tx
          </span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
          theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD]'
        }`}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 size-4" />
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Filtrer par N° client..."
              className={`w-full pl-10 pr-8 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
              }`}
            />
            {historySearch && (
              <button onClick={() => setHistorySearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 cursor-pointer">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-[8px] font-bold text-stone-500 uppercase tracking-wide">Activité</label>
              <select
                value={historyType}
                onChange={e => setHistoryType(e.target.value as 'all' | 'deposit' | 'withdrawal' | 'credit' | 'forfait')}
                className={`w-full p-2.5 border rounded-xl text-[10px] font-bold focus:outline-none ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-800'
                }`}
              >
                <option value="all">Toutes Activités</option>
                <option value="deposit">Dépôt (Envoi)</option>
                <option value="withdrawal">Retrait (Sortie)</option>
                <option value="credit">Vente Crédit</option>
                <option value="forfait">Vente Forfait</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-[8px] font-bold text-stone-500 uppercase tracking-wide">Réseau</label>
              <select
                value={historyOperator}
                onChange={e => setHistoryOperator(e.target.value as 'all' | 'mtn' | 'moov' | 'celtiis')}
                className={`w-full p-2.5 border rounded-xl text-[10px] font-bold focus:outline-none ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-800'
                }`}
              >
                <option value="all">Tous Réseaux</option>
                <option value="mtn">MTN</option>
                <option value="moov">Moov</option>
                <option value="celtiis">Celtiis</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filteredRecentHistory.length > 0 ? (
              filteredRecentHistory.map(txn => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (txn.type === 'deposit') setActiveReceipt(txn)
                  }}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col gap-3.5 ${
                    txn.type === 'deposit' ? 'cursor-pointer hover:border-natural-accent' : ''
                  } ${
                    txn.isScamReported
                      ? theme === 'dark' ? 'border-rose-900 bg-rose-950/20 text-rose-300' : 'border-rose-300 bg-rose-50 text-rose-900'
                      : txn.type === 'appro_sim' || txn.type === 'ajust_cash'
                        ? theme === 'dark' ? 'border-purple-900 bg-purple-950/10 text-purple-200' : 'border-purple-300 bg-purple-50 text-purple-900 font-medium'
                        : theme === 'dark' ? 'border-[#1C2C22] bg-[#0E1B15]/40 hover:bg-[#0E1B15]/60' : 'border-[#DCD6CD] bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : txn.type === 'withdrawal'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : txn.type === 'saisie_rapide'
                              ? 'bg-natural-accent/10 text-natural-accent border border-natural-accent/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {txn.type === 'deposit' ? 'DEP' : txn.type === 'withdrawal' ? 'RET' : txn.type === 'credit' ? 'CREDIT' : txn.type === 'forfait' ? 'FORFAIT' : txn.type === 'saisie_rapide' ? '⚡ RAPIDE' : 'AJUST'}
                      </span>
                      {txn.type !== 'ajust_cash' && renderOperatorBadge(txn.operator)}
                      <span className="text-[9px] text-stone-500 font-mono font-bold">{txn.time}</span>
                    </div>
                    <div className="font-mono font-bold text-sm">
                      {txn.type === 'saisie_rapide' && txn.amount > 0 ? '+ ' : txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait' || (txn.type === 'ajust_cash' && txn.category === 'Injection Cash') || txn.type === 'appro_sim' ? '+' : '-'} {txn.amount > 0 ? txn.amount.toLocaleString('fr-FR') : '—'} {txn.amount > 0 ? <span className="text-[10px] font-normal">FCFA</span> : null}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-stone-400">{txn.phone === 'SYSTEM' ? 'Ajustement' : txn.phone === 'RAPIDE' ? '' : 'Client : '}</span>
                      <span className="font-mono font-bold">{txn.phone === 'RAPIDE' ? txn.category : txn.phone}</span>
                      {txn.phone !== 'SYSTEM' && blacklist.includes(txn.phone) && (
                        <span className="ml-1 text-[8px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">ARNAQUEUR</span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${
                      theme === 'dark' ? 'bg-[#050807] text-stone-300' : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {txn.category}
                    </span>
                  </div>

                  {/* Note / Observation */}
                  {txn.note && (
                    <div className={`text-[10px] px-3 py-2 rounded-xl border italic flex items-start gap-1.5 ${
                      theme === 'dark' ? 'bg-stone-900/40 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'
                    }`}>
                      <span className="shrink-0 mt-0.5 font-bold not-italic text-natural-accent">📝</span>
                      {txn.note}
                    </div>
                  )}

                  {txn.phone !== 'SYSTEM' && (
                    <div className="flex justify-between items-center border-t border-stone-500/5 pt-2.5 mt-1 text-[10px] font-bold">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleScamReport(txn.id); }}
                        className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          txn.isScamReported
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'border-rose-900/40 hover:bg-[#1a0a0d] text-rose-500'
                        }`}
                      >
                        <ShieldAlert className="size-3" />
                        {txn.isScamReported ? 'Arnaque Signalée' : 'Signaler Arnaque'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTransaction(txn.id); }}
                        className="text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="size-3" /> Supprimer
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-550 text-xs">
                Aucune transaction enregistrée avec ces filtres.
              </div>
            )}
          </AnimatePresence>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full mt-2 cursor-pointer rounded-xl font-bold">
          <Download className="size-4 mr-2" /> EXPORTER L'HISTORIQUE CSV
        </Button>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* VUE ANALYTIQUE & ADMINISTRATION                */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Cabin Management for Owners */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-2">
          <Building className="size-4.5" />
          Gestion de vos Cabines
        </h3>
        <p className="text-[10px] text-stone-500 mb-4">
          Créez de nouvelles cabines physiques et suivez leurs performances individuelles.
        </p>

        <form onSubmit={handleCreateCabin} className="flex gap-2 mb-4">
          <input
            type="text"
            required
            placeholder="Nom de la cabine (ex: Cabine Cotonou Nord)"
            value={newCabinName}
            onChange={(e) => setNewCabinName(e.target.value)}
            className={`flex-1 p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
              theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
            }`}
          />
          <Button variant="premium" type="submit" loading={creatingCabin} className="text-xs cursor-pointer font-bold px-4 rounded-xl">
            Créer la cabine
          </Button>
        </form>

        {/* List of existing cabins */}
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto mt-2 pr-1">
          {cabins.map(cab => (
            <div key={cab.id} className={`flex justify-between items-center p-3 rounded-xl border text-xs ${
              theme === 'dark' ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-[#DCD6CD]'
            }`}>
              <span className="font-bold flex items-center gap-2">
                <Building className="size-3.5 text-natural-accent" />
                {cab.name}
              </span>
              <span className="text-[9px] text-stone-400 font-mono">
                ID: {cab.id.slice(0, 8)}...
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Employee Management for Owners */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-2">
          <Users className="size-4.5" />
          Affectation de vos Gérants (Employés)
        </h3>
        <p className="text-[10px] text-stone-500 mb-4">
          Associez vos employés inscrits aux différentes cabines actives de votre réseau.
        </p>

        <div className="flex flex-col gap-3">
          {allEmployees.length > 0 ? (
            allEmployees.map(emp => (
              <div key={emp.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border text-xs ${
                theme === 'dark' ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-[#DCD6CD]'
              }`}>
                <div>
                  <span className="font-bold block text-stone-200">{emp.name}</span>
                  <span className="text-[9px] text-stone-550 font-mono block">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-stone-400 uppercase font-bold">Cabine :</span>
                  <select
                    value={emp.assigned_cabin_id || 'none'}
                    onChange={(e) => handleAssignCabin(emp.id, e.target.value)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold focus:outline-none transition-all cursor-pointer ${
                      theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-850'
                    }`}
                  >
                    <option value="none">Aucune cabine affectée</option>
                    {cabins.map(cab => (
                      <option key={cab.id} value={cab.id}>{cab.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-stone-550 text-xs">
              Aucun gérant lié à votre compte propriétaire pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* Bilan Périodique (Déplacé depuis l'Espace Caissier) */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        {/* Period type selector segments */}
        <div className={`flex p-1 rounded-2xl border text-xs font-bold mb-5 transition-all ${
          theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-[#EFECE6] border-[#DCD6CD]'
        }`}>
          {(['day', 'week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              className={`flex-1 py-2.5 rounded-xl transition-all capitalize cursor-pointer font-bold ${
                periodType === p 
                  ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase font-serif tracking-wide flex items-center gap-2 text-natural-accent">
              <Calendar className="size-4.5" />
              Bilan Périodique Cabine ({formattedReportPeriodLabel})
            </h3>
            <p className="text-[9px] text-stone-500">
              Cumul financier de la cabine active pour la période sélectionnée
            </p>
          </div>
          
          {/* Contextual Date Navigators */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border text-[10px] font-bold transition-all ${
            theme === 'dark' ? 'bg-[#050807]/60 border-stone-800' : 'bg-stone-100 border-stone-200'
          }`}>
            {periodType === 'day' && (
              <>
                <button 
                  onClick={() => setSelectedReportDate(TODAY_STR)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedReportDate === TODAY_STR 
                      ? 'bg-natural-accent text-[#0A0F0D] shadow' 
                      : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Auj.
                </button>
                <button 
                  onClick={() => setSelectedReportDate(YESTERDAY_STR)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedReportDate === YESTERDAY_STR 
                      ? 'bg-natural-accent text-[#0A0F0D] shadow' 
                      : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hier
                </button>
                <input 
                  type="date"
                  value={selectedReportDate}
                  onChange={e => e.target.value && setSelectedReportDate(e.target.value)}
                  className={`px-1 bg-transparent border-0 font-mono text-[9px] focus:outline-none cursor-pointer ${
                    theme === 'dark' ? 'text-white' : 'text-stone-850'
                  }`}
                />
              </>
            )}

            {periodType === 'week' && (
              <>
                <button 
                  onClick={() => setSelectedReportDate(TODAY_STR)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    getWeekRange(selectedReportDate).start === getWeekRange(TODAY_STR).start 
                      ? 'bg-natural-accent text-[#0A0F0D] shadow' 
                      : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Cette Semaine
                </button>
                <button 
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() - 7)
                    setSelectedReportDate(getLocalDateString(d))
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    getWeekRange(selectedReportDate).start === getWeekRange(getYesterdayDateString()).start && getWeekRange(selectedReportDate).start !== getWeekRange(TODAY_STR).start 
                      ? 'bg-natural-accent text-[#0A0F0D] shadow' 
                      : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Précédente
                </button>
              </>
            )}

            {periodType === 'month' && (
              <select
                value={selectedReportDate.slice(0, 7)}
                onChange={e => setSelectedReportDate(`${e.target.value}-01`)}
                className={`p-1 bg-transparent border-0 font-mono text-[10px] focus:outline-none ${
                  theme === 'dark' ? 'text-white bg-[#050807]' : 'text-stone-800 bg-[#EFECE6]'
                }`}
              >
                <option value={TODAY_STR.slice(0, 7)}>Mois En Cours</option>
                <option value={YESTERDAY_STR.slice(0, 7)}>Mois Précédent</option>
                <option value="2026-05">Mai 2026</option>
                <option value="2026-04">Avril 2026</option>
              </select>
            )}

            {periodType === 'year' && (
              <select
                value={selectedReportDate.slice(0, 4)}
                onChange={e => setSelectedReportDate(`${e.target.value}-01-01`)}
                className={`p-1 bg-transparent border-0 font-mono text-[10px] focus:outline-none ${
                  theme === 'dark' ? 'text-white bg-[#050807]' : 'text-stone-800 bg-[#EFECE6]'
                }`}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            )}
          </div>
        </div>

        {/* Bilan Network Filter buttons */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-stone-500 uppercase">Filtre Réseau :</span>
          <div className={`flex p-0.5 rounded-lg border text-[9px] font-bold transition-all ${
            theme === 'dark' ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-100 border-stone-200'
          }`}>
            {(['all', 'mtn', 'moov', 'celtiis'] as const).map(op => (
              <button
                key={op}
                onClick={() => setReportOperator(op)}
                className={`px-3 py-1 rounded transition-all capitalize cursor-pointer ${
                  reportOperator === op 
                    ? 'bg-natural-accent text-[#0A0F0D]' 
                    : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {op === 'all' ? 'Tous' : op}
              </button>
            ))}
          </div>
        </div>

        {/* Balance table sheet */}
        <div className={`overflow-hidden rounded-2xl border shadow-inner transition-colors ${
          theme === 'dark' ? 'bg-[#0A0F0D] border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className={`border-b text-[10px] uppercase font-extrabold ${
                theme === 'dark' ? 'bg-[#050807] border-stone-800 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}>
                <th className="py-3 px-4">Activité</th>
                <th className="py-3 px-4 text-right">Cumul (FCFA)</th>
                <th className="py-3 px-4 text-center">Volume Ops</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'divide-stone-800/60' : 'divide-stone-200'
            }`}>
              <tr className="hover:bg-stone-500/5 transition-colors">
                <td className={`py-3 px-4 font-sans font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-[#E4EAD8]' : 'text-stone-900'
                }`}>
                  <span className="size-2 rounded-full bg-natural-accent shadow-sm shadow-natural-accent" />
                  Dépôts (Envois)
                </td>
                <td className={`py-3 px-4 text-right font-bold ${
                  theme === 'dark' ? 'text-[#E4EAD8]' : 'text-stone-900'
                }`}>
                  {periodicReportStats.deposit.sum.toLocaleString('fr-FR')}
                </td>
                <td className={`py-3 px-4 text-center ${
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {periodicReportStats.deposit.count} tx
                </td>
              </tr>
              <tr className="hover:bg-stone-500/5 transition-colors">
                <td className={`py-3 px-4 font-sans font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-[#E4EAD8]' : 'text-stone-900'
                }`}>
                  <span className="size-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
                  Retraits (Sorties)
                </td>
                <td className={`py-3 px-4 text-right font-bold ${
                  theme === 'dark' ? 'text-rose-400' : 'text-rose-700'
                }`}>
                  {periodicReportStats.withdrawal.sum.toLocaleString('fr-FR')}
                </td>
                <td className={`py-3 px-4 text-center ${
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {periodicReportStats.withdrawal.count} tx
                </td>
              </tr>
              <tr className="hover:bg-stone-500/5 transition-colors">
                <td className={`py-3 px-4 font-sans font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-[#E4EAD8]' : 'text-stone-900'
                }`}>
                  <span className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
                  Ventes de Crédits
                </td>
                <td className={`py-3 px-4 text-right font-bold ${
                  theme === 'dark' ? 'text-amber-400' : 'text-amber-800'
                }`}>
                  {periodicReportStats.credit.sum.toLocaleString('fr-FR')}
                </td>
                <td className={`py-3 px-4 text-center ${
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {periodicReportStats.credit.count} tx
                </td>
              </tr>
              <tr className="hover:bg-stone-500/5 transition-colors">
                <td className={`py-3 px-4 font-sans font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-[#E4EAD8]' : 'text-stone-900'
                }`}>
                  <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                  Ventes de Forfaits
                </td>
                <td className={`py-3 px-4 text-right font-bold ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                }`}>
                  {periodicReportStats.forfait.sum.toLocaleString('fr-FR')}
                </td>
                <td className={`py-3 px-4 text-center ${
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {periodicReportStats.forfait.count} tx
                </td>
              </tr>
              {/* Total row */}
              <tr className={`border-t font-black ${
                theme === 'dark' ? 'bg-[#0A0F0D] text-natural-accent border-[#1C2C22]' : 'bg-stone-50 text-stone-900 border-[#DCD6CD]'
              }`}>
                <td className="py-3.5 px-4 font-sans font-black flex items-center gap-2">
                  <Coins className="size-4" />
                  Total Période
                </td>
                <td className="py-3.5 px-4 text-right text-sm">
                  {periodicReportStats.total.sum.toLocaleString('fr-FR')}
                </td>
                <td className="py-3.5 px-4 text-center text-sm">
                  {periodicReportStats.total.count} tx
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Weekly activity chart Mockup (Déplacé depuis l'Espace Caissier) */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD]'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Activité Hebdomadaire</h3>
            <p className="text-[9px] text-stone-500">Volume de vente de crédit & forfaits de la cabine active</p>
          </div>
          <div className="flex gap-1 bg-stone-900/10 p-0.5 border border-stone-800/10 dark:border-stone-800 rounded-lg text-[9px] font-bold">
            <span className="px-2.5 py-1 rounded bg-natural-accent text-[#0A0F0D]">VOLUME (FCFA)</span>
            <span className="px-2.5 py-1 text-stone-400 cursor-not-allowed">OPS</span>
          </div>
        </div>

        <div className="flex justify-between items-end h-32 px-4 gap-2 pt-2 border-b border-stone-500/10">
          {['sam 13', 'dim 14', 'lun 15', 'mar 16', 'mer 17', 'jeu 18', 'ven 19'].map((day, idx) => {
            const heights = [
              { mtn: 'h-2', moov: 'h-3', celtiis: 'h-1' },
              { mtn: 'h-1', moov: 'h-1', celtiis: 'h-0' },
              { mtn: 'h-4', moov: 'h-2', celtiis: 'h-2' },
              { mtn: 'h-6', moov: 'h-4', celtiis: 'h-3' },
              { mtn: 'h-5', moov: 'h-6', celtiis: 'h-2' },
              { mtn: 'h-3', moov: 'h-5', celtiis: 'h-4' },
              { mtn: 'h-12', moov: 'h-16', celtiis: 'h-6' },
            ]
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full max-w-[16px] flex flex-col justify-end rounded-t-lg overflow-hidden h-24 bg-stone-500/5">
                  <div className={`w-full bg-emerald-500 transition-all duration-300 ${heights[idx].celtiis}`} />
                  <div className={`w-full bg-blue-600 transition-all duration-300 ${heights[idx].moov}`} />
                  <div className={`w-full bg-amber-400 transition-all duration-300 ${heights[idx].mtn}`} />
                </div>
                <span className="text-[8px] font-mono text-stone-500 uppercase">{day.split(' ')[1]}</span>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center gap-4 text-[9px] font-bold uppercase mt-4">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-emerald-500" /> Celtiis</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-amber-500" /> MTN</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-blue-600" /> Moov</span>
        </div>
      </section>
      
      {/* Start reserves configurations (Coffres setup) */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-2">
          <Sliders className="size-4.5" />
          Fonds de départ (Coffres)
        </h3>
        <p className="text-[10px] text-stone-500 mb-4">
          Définissez la flotte virtuelle initiale chargée sur chaque carte SIM de caisse.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4.5 rounded-2xl border border-stone-500/10 bg-stone-500/5">
            <span className="block text-[10px] font-bold text-amber-500 mb-1">MTN Initial</span>
            <div className="font-mono text-base font-bold text-stone-500 dark:text-stone-300">
              {coffres.mtn.toLocaleString('fr-FR')} <span className="text-[10px]">FCFA</span>
            </div>
          </div>
          <div className="p-4.5 rounded-2xl border border-stone-500/10 bg-stone-500/5">
            <span className="block text-[10px] font-bold text-blue-500 mb-1">Moov Initial</span>
            <div className="font-mono text-base font-bold text-stone-500 dark:text-stone-300">
              {coffres.moov.toLocaleString('fr-FR')} <span className="text-[10px]">FCFA</span>
            </div>
          </div>
          <div className="p-4.5 rounded-2xl border border-stone-500/10 bg-stone-500/5">
            <span className="block text-[10px] font-bold text-emerald-500 mb-1">Celtiis Initial</span>
            <div className="font-mono text-base font-bold text-stone-500 dark:text-stone-300">
              {coffres.celtiis.toLocaleString('fr-FR')} <span className="text-[10px]">FCFA</span>
            </div>
          </div>
          <div className="p-4.5 rounded-2xl border border-stone-500/10 bg-stone-500/5">
            <span className="block text-[10px] font-bold text-purple-400 mb-1">Cash Initial</span>
            <div className="font-mono text-base font-bold text-stone-500 dark:text-stone-300">
              {coffres.cash.toLocaleString('fr-FR')} <span className="text-[10px]">FCFA</span>
            </div>
          </div>
        </div>

        <Button 
          variant="outline"
          className="w-full text-xs font-bold rounded-xl cursor-pointer"
          onClick={() => {
            setCoffreMtn(String(coffres.mtn))
            setCoffreMoov(String(coffres.moov))
            setCoffreCeltiis(String(coffres.celtiis))
            setCoffreCash(String(coffres.cash))
            setShowCoffreModal(true)
          }}
        >
          Ajuster les soldes initiaux & code PIN
        </Button>
      </section>

      {/* Manual Cash Recharges & SIM Approvals */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-2">
          <Coins className="size-4.5" />
          Mouvements Externes
        </h3>
        <p className="text-[10px] text-stone-500 mb-4">
          Injectez ou retirez des fonds sur les cartes SIM et dans le tiroir de caisse.
        </p>
        
        <Button 
          variant="premium"
          className="w-full text-xs font-bold rounded-xl py-3 cursor-pointer"
          onClick={() => setActionType('adjust_ext')}
        >
          Créer un Ajustement Flotte / Cash
        </Button>
      </section>

      {/* Blacklist management */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2">
            <ShieldAlert className="size-4.5" />
            Blacklist Communautaire
          </h3>
          <span className="text-[10px] font-mono bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-lg">
            {blacklist.length} Signalés
          </span>
        </div>
        <p className="text-[10px] text-stone-500 mb-4">
          Ajoutez ou supprimez des numéros suspects pour alerter automatiquement le gérant lors des saisies.
        </p>

        <Button 
          variant="outline"
          className="w-full text-xs font-bold rounded-xl cursor-pointer"
          onClick={() => setShowBlacklistModal(true)}
        >
          Gérer la Liste des Numéros Suspects
        </Button>
      </section>

      {/* Full historical list with delete option */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent px-1">
          Historique d'Administration (Accès Total)
        </h3>
        
        <div className="flex flex-col gap-3">
          {transactions.length > 0 ? (
            transactions.slice(0, 8).map(txn => (
              <div 
                key={txn.id}
                className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 ${
                  theme === 'dark' ? 'border-[#1C2C22] bg-[#0E1B15]/20' : 'border-[#DCD6CD] bg-white'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                        : txn.type === 'withdrawal'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {txn.type}
                    </span>
                    {txn.type !== 'ajust_cash' && renderOperatorBadge(txn.operator)}
                    <span className="text-[9px] text-stone-500 font-mono">{txn.date} · {txn.time}</span>
                  </div>
                  <div className="font-mono font-bold text-sm">
                    {txn.amount.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-stone-500/5 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Client :</span>
                    <span className="font-mono font-bold">{txn.phone}</span>
                  </div>
                  <button 
                    onClick={() => deleteTransaction(txn.id)}
                    className="text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Trash2 className="size-3" /> Supprimer Tx
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-stone-500 text-xs">
              Aucune transaction disponible.
            </div>
          )}
        </div>
      </section>

      {/* Database resetting configurations */}
      <section className={`p-6 rounded-[32px] border border-rose-900/30 bg-rose-950/5`}>
        <h3 className="text-sm font-bold font-serif uppercase text-rose-500 flex items-center gap-2 mb-2">
          <AlertTriangle className="size-4.5" />
          Zone de Danger
        </h3>
        <p className="text-[10px] text-stone-550 mb-4">
          Ces actions effaceront de manière permanente les données locales et synchronisées.
        </p>

        <button 
          onClick={async () => {
            if (confirm("Réinitialiser toutes les données de la cabine ?")) {
              await syncBalances({ mtn: 240000, moov: 270000, celtiis: 50000, cash: 140000 })
              setTransactions([])
              localStorage.removeItem('momo_transactions')
              const client = getSupabase()
              if (client) {
                await client.from('momo_transactions').delete().neq('id', 'SYSTEM')
              }
              setActiveTab('caissier')
            }
          }}
          className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-extrabold text-xs tracking-wider rounded-xl transition-all cursor-pointer uppercase"
        >
          Réinitialisation complète de la cabine
        </button>
      </section>
    </div>
  )
}
