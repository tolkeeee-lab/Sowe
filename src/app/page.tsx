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
  AlertCircle,
  Moon,
  Sun,
  Sliders,
  AlertTriangle,
  Download,
  Trash2,
  Info,
  MapPin,
  ShieldAlert,
  Calendar,
  Coins
} from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

interface Transaction {
  id: string;
  phone: string;
  operator: 'mtn' | 'moov' | 'celtiis';
  type: 'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'appro_sim' | 'ajust_cash';
  amount: number;
  time: string;
  date: string; // YYYY-MM-DD
  category: string;
  isScamReported?: boolean;
}

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getYesterdayDateString = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getLocalDateString(d)
}

const getWeekRange = (dateStr: string) => {
  const parts = dateStr.split('-')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust Monday to Sunday
  
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(d.setDate(diff + 6))
  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday)
  }
}

const TODAY_STR = getLocalDateString()
const YESTERDAY_STR = getYesterdayDateString()

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-1004',
    phone: '0196887722',
    operator: 'mtn',
    type: 'withdrawal',
    amount: 5000,
    time: '16:45',
    date: TODAY_STR,
    category: 'Frais de transaction',
    isScamReported: false,
  },
  {
    id: 'TXN-1003',
    phone: '0140223190',
    operator: 'celtiis',
    type: 'deposit',
    amount: 50000,
    time: '16:10',
    date: TODAY_STR,
    category: 'Business/Ventes',
    isScamReported: false,
  },
  {
    id: 'TXN-1002',
    phone: '0161485060',
    operator: 'moov',
    type: 'withdrawal',
    amount: 120000,
    time: '15:32',
    date: TODAY_STR,
    category: 'Frais de transaction',
    isScamReported: false,
  },
  {
    id: 'TXN-1001',
    phone: '0197451230',
    operator: 'mtn',
    type: 'deposit',
    amount: 15000,
    time: '14:15',
    date: YESTERDAY_STR,
    category: 'Business/Ventes',
    isScamReported: false,
  }
];

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

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Balances in each medium
  const [balances, setBalances] = useState({
    mtn: 240000,
    moov: 270000,
    celtiis: 50000,
    cash: 140000,
  })

  // Start & Float Reserves
  const [coffres, setCoffres] = useState({
    mtn: 250000,
    moov: 150000,
    celtiis: 100000,
    cash: 200000,
  })

  // Period type: 'day' | 'week' | 'month' | 'year'
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('day')
  
  // Selected base date for report calculations
  const [selectedReportDate, setSelectedReportDate] = useState<string>(TODAY_STR)

  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  
  // Blacklist database
  const [blacklist, setBlacklist] = useState<string[]>(['0197451239', '0161485000'])
  const [newBlacklistPhone, setNewBlacklistPhone] = useState('')
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)

  // Transaction Addition Modal State
  const [actionType, setActionType] = useState<'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'adjust_ext' | null>(null)
  const [opInput, setOpInput] = useState<'mtn' | 'moov' | 'celtiis'>('mtn')
  const [phoneInput, setPhoneInput] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [selectedForfait, setSelectedForfait] = useState('')
  
  // External Adjustment States
  const [adjType, setAdjType] = useState<'appro_sim' | 'ajust_cash'>('appro_sim')
  const [adjOperator, setAdjOperator] = useState<'mtn' | 'moov' | 'celtiis'>('mtn')
  const [adjCashDirection, setAdjCashDirection] = useState<'inject' | 'withdraw'>('inject')

  // Float adjustment modal
  const [showCoffreModal, setShowCoffreModal] = useState(false)
  const [coffreMtn, setCoffreMtn] = useState('250000')
  const [coffreMoov, setCoffreMoov] = useState('150000')
  const [coffreCeltiis, setCoffreCeltiis] = useState('100000')
  const [coffreCash, setCoffreCash] = useState('200000')

  useEffect(() => {
    const client = getSupabase()
    setSupabaseConnected(!!client)
  }, [])

  // Auto-fill forfait price when selected
  useEffect(() => {
    if (actionType === 'forfait' && selectedForfait) {
      const allForfaits = [...BENIN_FORFAITS.mtn, ...BENIN_FORFAITS.moov, ...BENIN_FORFAITS.celtiis]
      const found = allForfaits.find(f => f.name === selectedForfait)
      if (found) {
        setAmountInput(String(found.price))
      }
    }
  }, [selectedForfait, actionType])

  // Global actual balance: Sum of all cash + SIM floats
  const soldeGlobal = useMemo(() => {
    return balances.mtn + balances.moov + balances.celtiis + balances.cash
  }, [balances])

  // Total Capitalized float
  const totalCapitalise = useMemo(() => {
    return coffres.mtn + coffres.moov + coffres.celtiis + coffres.cash
  }, [coffres])

  // Filter transactions according to selected period
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
  }, [transactions, periodType, selectedReportDate])

  // Custom range label for Bilan table header
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
  }, [selectedReportDate, periodType])

  // Handle transaction creation (MTN / MOOV / CELTIIS swap with Drawer Cash or external adjustment)
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const todayDateStr = getLocalDateString()

    setLoading(true)

    setTimeout(() => {
      // 1. External Adjustments
      if (actionType === 'adjust_ext') {
        const amount = parseFloat(amountInput) || 0
        if (adjType === 'appro_sim') {
          setBalances(prev => ({
            ...prev,
            [adjOperator]: prev[adjOperator] + amount
          }))

          const newTxn: Transaction = {
            id: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
            phone: 'SYSTEM',
            operator: adjOperator,
            type: 'appro_sim',
            amount,
            time: timeStr,
            date: todayDateStr,
            category: 'Approvisionnement SIM',
          }
          setTransactions(prev => [newTxn, ...prev])
        } else {
          const multiplier = adjCashDirection === 'inject' ? 1 : -1
          setBalances(prev => ({
            ...prev,
            cash: prev.cash + (amount * multiplier)
          }))

          const newTxn: Transaction = {
            id: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
            phone: 'SYSTEM',
            operator: 'mtn',
            type: 'ajust_cash',
            amount,
            time: timeStr,
            date: todayDateStr,
            category: adjCashDirection === 'inject' ? 'Injection Cash' : 'Retrait Cash (Dépense/Banque)',
          }
          setTransactions(prev => [newTxn, ...prev])
        }

        setLoading(false)
        setActionType(null)
        setAmountInput('')
        return
      }

      // 2. Swapping transactions (Deposit, Withdrawal, Credit, Forfait)
      if (!amountInput || !phoneInput) {
        setLoading(false)
        return
      }

      const amount = parseFloat(amountInput)
      const isBlacklisted = blacklist.includes(phoneInput.trim())
      if (isBlacklisted) {
        alert("⚠️ Ce numéro est répertorié dans la BLACKLIST COMMUNAUTAIRE. Soyez vigilant !")
      }

      setBalances(prev => {
        if (actionType === 'deposit' || actionType === 'credit' || actionType === 'forfait') {
          return {
            ...prev,
            cash: prev.cash + amount,
            [opInput]: prev[opInput] - amount
          }
        } else if (actionType === 'withdrawal') {
          return {
            ...prev,
            cash: prev.cash - amount,
            [opInput]: prev[opInput] + amount
          }
        }
        return prev
      })

      const newTxn: Transaction = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: phoneInput,
        operator: opInput,
        type: actionType!,
        amount,
        time: timeStr,
        date: todayDateStr,
        category: actionType === 'forfait' ? selectedForfait : (actionType === 'credit' ? 'Vente de Crédit' : (actionType === 'deposit' ? 'Dépôt client' : 'Retrait client')),
        isScamReported: false
      }

      setTransactions(prev => [newTxn, ...prev])
      setLoading(false)
      setActionType(null)

      setPhoneInput('')
      setAmountInput('')
      setSelectedForfait('')
    }, 600)
  }

  // Adjust Start Float reserves
  const handleSaveCoffres = (e: React.FormEvent) => {
    e.preventDefault()
    setCoffres({
      mtn: parseFloat(coffreMtn) || 0,
      moov: parseFloat(coffreMoov) || 0,
      celtiis: parseFloat(coffreCeltiis) || 0,
      cash: parseFloat(coffreCash) || 0,
    })
    setShowCoffreModal(false)
  }

  // Toggle scam flag
  const toggleScamReport = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isScamReported: !t.isScamReported }
      }
      return t
    }))
  }

  // Delete transaction
  const deleteTransaction = (id: string) => {
    if (confirm("Supprimer définitivement cet enregistrement ?")) {
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
  }

  // Add to blacklist
  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlacklistPhone) return
    setBlacklist(prev => [...prev, newBlacklistPhone.trim()])
    setNewBlacklistPhone('')
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'ID,Telephone,Operateur,Type,Montant,Heure,Date,Details,Arnaque\n'
    const rows = transactions.map(t => 
      `${t.id},${t.phone},${t.operator},${t.type},${t.amount},${t.time},${t.date},${t.category},${t.isScamReported ? 'OUI' : 'NON'}`
    ).join('\n')
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `historique_cabine_${new Date().toISOString().slice(0,10)}.csv`)
    link.click()
  }

  // Highly Contrastive Operator Badges Renderer
  const renderOperatorBadge = (operator: string) => {
    if (theme === 'dark') {
      switch (operator) {
        case 'mtn':
          return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">mtn</span>
        case 'moov':
          return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">moov</span>
        case 'celtiis':
          return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">celtiis</span>
        default:
          return null
      }
    } else {
      switch (operator) {
        case 'mtn':
          return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">mtn</span>
        case 'moov':
          return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">moov</span>
        case 'celtiis':
          return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">celtiis</span>
        default:
          return null
      }
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      theme === 'dark' ? 'bg-[#030305] text-white' : 'bg-[#fcfcfb] text-[#121214]'
    }`}>
      
      {/* Top Banner / Security active */}
      <div className="w-full bg-[#001830] text-cyan-400 py-2.5 px-6 text-center text-xs font-bold tracking-wider flex items-center justify-center gap-2 border-b border-cyan-950/80">
        <span className="inline-block size-2 rounded-full bg-cyan-400 animate-pulse" />
        CABINE DE SÉCURITÉ ACTIVE : BENIN (COTONOU / ABOMEY-CALAVI)
      </div>

      {/* Header */}
      <header className={`border-b transition-colors ${
        theme === 'dark' ? 'border-[#151520] bg-[#07070b]/90' : 'border-stone-300 bg-white/90'
      } backdrop-blur-md sticky top-0 z-45`}>
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center shadow-md transition-colors ${
              theme === 'dark' ? 'bg-cyan-950 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
            }`}>
              <Wallet className="size-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight">MOMO PREMIUM</span>
              <span className="text-[10px] block font-semibold tracking-widest uppercase text-cyan-500 -mt-1">Gestion Cabine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
              theme === 'dark' ? 'bg-stone-900 text-stone-300 border-[#1f1f2e]' : 'bg-stone-100 text-stone-700 border-stone-300'
            }`}>
              Offline Safe 🌐
            </span>

            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`size-10 rounded-xl flex items-center justify-center border transition-all ${
                theme === 'dark' 
                  ? 'bg-stone-900 border-[#1f1f2e] text-yellow-400 hover:bg-stone-800' 
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Global Balance Card */}
        <section className={`p-6 rounded-[32px] border transition-all ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-[#0b0b10] to-[#040406] border-[#181822] shadow-xl' 
            : 'bg-white border-stone-300 shadow-sm'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-wider font-bold text-stone-500">Solde Global Actuel</span>
            <button 
              onClick={() => alert(`Capital totalisé initialement configuré : ${totalCapitalise.toLocaleString('fr-FR')} FCFA`)}
              className="text-[10px] font-bold text-cyan-500 hover:underline uppercase tracking-wider"
            >
              Solde Total Capitalisé
            </button>
          </div>

          <div className="text-center py-2 mb-6">
            <h2 className="text-4xl font-mono font-bold tracking-tight text-cyan-500">
              {soldeGlobal.toLocaleString('fr-FR')} <span className="text-lg font-sans">FCFA</span>
            </h2>
          </div>

          {/* SIM and Cash grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* MTN SIM */}
            <div className={`p-3.5 rounded-2xl border transition-colors ${
              theme === 'dark' ? 'bg-[#08080c] border-[#151520]' : 'bg-stone-50 border-stone-350'
            }`}>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 mb-1">
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                MTN MOMO SIM
              </span>
              <div className="font-mono font-bold text-sm">
                {balances.mtn.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
              </div>
            </div>

            {/* MOOV SIM */}
            <div className={`p-3.5 rounded-2xl border transition-colors ${
              theme === 'dark' ? 'bg-[#08080c] border-[#151520]' : 'bg-stone-50 border-stone-350'
            }`}>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 mb-1">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                MOOV MONEY SIM
              </span>
              <div className="font-mono font-bold text-sm">
                {balances.moov.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
              </div>
            </div>

            {/* CELTIIS SIM */}
            <div className={`p-3.5 rounded-2xl border transition-colors ${
              theme === 'dark' ? 'bg-[#08080c] border-[#151520]' : 'bg-stone-50 border-stone-350'
            }`}>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 mb-1">
                <span className="size-1.5 rounded-full bg-emerald-450 animate-pulse" />
                CELTIIS CASH SIM
              </span>
              <div className="font-mono font-bold text-sm">
                {balances.celtiis.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
              </div>
            </div>

            {/* CASH IN DRAWER */}
            <div className={`p-3.5 rounded-2xl border transition-colors ${
              theme === 'dark' ? 'bg-[#08080c] border-[#151520]' : 'bg-stone-50 border-stone-350'
            }`}>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 mb-1">
                <span className="size-1.5 rounded-full bg-purple-455 animate-pulse" />
                CASH (DANS TIROIR)
              </span>
              <div className="font-mono font-bold text-sm">
                {balances.cash.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Operations Quick Buttons Grid */}
        <section className="grid grid-cols-2 gap-3.5">
          {/* DEPOSIT */}
          <button 
            onClick={() => { setActionType('deposit'); setOpInput('mtn'); }}
            className="p-4 rounded-[22px] bg-cyan-550 hover:bg-cyan-600 text-stone-950 text-left flex flex-col justify-between h-24 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
              <ArrowDownLeft className="size-4" />
              + ENVOI (DÉPÔT)
            </div>
            <div className="text-[9px] font-bold opacity-90 uppercase tracking-widest mt-1">
              Cash Reçu → Float Envoyé
            </div>
          </button>

          {/* WITHDRAWAL */}
          <button 
            onClick={() => { setActionType('withdrawal'); setOpInput('mtn'); }}
            className={`p-4 rounded-[22px] text-left flex flex-col justify-between h-24 border transition-all active:scale-[0.98] cursor-pointer ${
              theme === 'dark' 
                ? 'border-[#1e1e2d] bg-[#0c0c12] hover:bg-[#12121b] text-white' 
                : 'border-stone-355 bg-white hover:bg-stone-100 text-[#121214]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-500">
              <ArrowUpRight className="size-4" />
              - RETRAIT (SORTIE)
            </div>
            <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">
              Float Reçu → Cash Donné
            </div>
          </button>

          {/* CREDIT SALES */}
          <button 
            onClick={() => { setActionType('credit'); setOpInput('mtn'); }}
            className={`p-4 rounded-[22px] text-left flex flex-col justify-between h-24 border transition-all active:scale-[0.98] cursor-pointer ${
              theme === 'dark' 
                ? 'border-[#1e1e2d] bg-[#0c0c12] hover:bg-[#12121b] text-white' 
                : 'border-stone-355 bg-white hover:bg-stone-100 text-[#121214]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-500">
              <Smartphone className="size-4" />
              📱 VENTE CRÉDIT
            </div>
            <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">
              Cash Reçu → Airtime SIM
            </div>
          </button>

          {/* FORFAIT SALES */}
          <button 
            onClick={() => { 
              setActionType('forfait'); 
              setOpInput('mtn');
              setSelectedForfait(BENIN_FORFAITS.mtn[0].name); 
            }}
            className={`p-4 rounded-[22px] text-left flex flex-col justify-between h-24 border transition-all active:scale-[0.98] cursor-pointer ${
              theme === 'dark' 
                ? 'border-[#1e1e2d] bg-[#0c0c12] hover:bg-[#12121b] text-white' 
                : 'border-stone-355 bg-white hover:bg-stone-100 text-[#121214]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-500">
              <Zap className="size-4" />
              ⚡ VENTE FORFAIT
            </div>
            <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">
              Cash Reçu → Forfait SIM
            </div>
          </button>
        </section>

        {/* Bilan Périodique Section */}
        <section className={`p-5 rounded-[28px] border transition-colors ${
          theme === 'dark' ? 'bg-[#0b0b10] border-[#151520]' : 'bg-white border-stone-300 shadow-sm'
        }`}>
          
          {/* Period type selector segments */}
          <div className="flex bg-[#050508]/60 dark:bg-stone-950/40 p-1 rounded-2xl border border-stone-300 dark:border-stone-850 text-xs font-bold mb-5">
            {(['day', 'week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodType(p)}
                className={`flex-1 py-2 rounded-xl transition-all capitalize ${
                  periodType === p 
                    ? 'bg-cyan-500 text-stone-950 shadow-md' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase font-serif tracking-wide flex items-center gap-2">
                <Calendar className="size-4.5 text-cyan-500" />
                Bilan Périodique ({formattedReportPeriodLabel})
              </h3>
              <p className="text-[9px] text-stone-500">
                Cumul financier pour la période sélectionnée
              </p>
            </div>
            
            {/* Contextual Date Navigators */}
            <div className="flex items-center gap-1.5 bg-[#050508]/40 dark:bg-stone-950/20 p-1 rounded-xl border border-stone-350 dark:border-stone-850 text-[10px] font-bold">
              {periodType === 'day' && (
                <>
                  <button 
                    onClick={() => setSelectedReportDate(TODAY_STR)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedReportDate === TODAY_STR ? 'bg-cyan-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Aujourd'hui
                  </button>
                  <button 
                    onClick={() => setSelectedReportDate(YESTERDAY_STR)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedReportDate === YESTERDAY_STR ? 'bg-cyan-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Hier
                  </button>
                  <input 
                    type="date"
                    value={selectedReportDate}
                    onChange={e => e.target.value && setSelectedReportDate(e.target.value)}
                    className={`px-1 bg-transparent border-0 font-mono text-[9px] focus:outline-none ${
                      theme === 'dark' ? 'text-white' : 'text-stone-850'
                    }`}
                  />
                </>
              )}

              {periodType === 'week' && (
                <>
                  <button 
                    onClick={() => setSelectedReportDate(TODAY_STR)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      getWeekRange(selectedReportDate).start === getWeekRange(TODAY_STR).start ? 'bg-cyan-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
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
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      getWeekRange(selectedReportDate).start === getWeekRange(getYesterdayDateString()).start && getWeekRange(selectedReportDate).start !== getWeekRange(TODAY_STR).start ? 'bg-cyan-500 text-stone-950 shadow' : 'text-stone-400'
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
                    theme === 'dark' ? 'text-white bg-stone-900' : 'text-stone-850 bg-white'
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
                    theme === 'dark' ? 'text-white bg-stone-900' : 'text-stone-850 bg-white'
                  }`}
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              )}
            </div>
          </div>

          {/* Balance table sheet */}
          <div className="overflow-hidden rounded-xl border border-stone-300 dark:border-stone-850">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-[#0f0f15] border-stone-850' : 'bg-stone-100 border-stone-250'} text-[10px] uppercase font-bold`}>
                  <th className="py-2.5 px-3.5">Activité</th>
                  <th className="py-2.5 px-3.5 text-right">Cumul (FCFA)</th>
                  <th className="py-2.5 px-3.5 text-center">Volume Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300/40 dark:divide-stone-850/40">
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-bold flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-cyan-500" />
                    Dépôts (Envois)
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold">
                    {periodicReportStats.deposit.sum.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-3.5 text-center text-stone-500">
                    {periodicReportStats.deposit.count} tx
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-bold flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    Retraits (Sorties)
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold">
                    {periodicReportStats.withdrawal.sum.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-3.5 text-center text-stone-500">
                    {periodicReportStats.withdrawal.count} tx
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-bold flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Ventes de Crédits
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold">
                    {periodicReportStats.credit.sum.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-3.5 text-center text-stone-500">
                    {periodicReportStats.credit.count} tx
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-bold flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Ventes de Forfaits
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold">
                    {periodicReportStats.forfait.sum.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-3.5 text-center text-stone-500">
                    {periodicReportStats.forfait.count} tx
                  </td>
                </tr>
                {/* Total row */}
                <tr className={`border-t font-black ${
                  theme === 'dark' ? 'bg-[#0f0f15]/80 text-cyan-400' : 'bg-stone-50 text-[#121214]'
                }`}>
                  <td className="py-3 px-3.5 font-sans font-black flex items-center gap-1.5">
                    <Coins className="size-3.5" />
                    Total Période
                  </td>
                  <td className="py-3 px-3.5 text-right text-sm">
                    {periodicReportStats.total.sum.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-3.5 text-center text-sm">
                    {periodicReportStats.total.count} tx
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Adjustments & Config section */}
        <section className={`p-4.5 rounded-[24px] border transition-colors ${
          theme === 'dark' ? 'bg-[#0b0b10] border-[#151520]' : 'bg-white border-stone-300'
        } flex flex-col gap-4`}>
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Sliders className="size-4 text-stone-400" />
                Mouvements de Caisse & Config
              </h3>
              <p className="text-[10px] text-stone-505 mt-0.5">
                Approvisionnements externes & Soldes de départ
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="xs" 
                onClick={() => setActionType('adjust_ext')}
                className="text-xs shrink-0"
              >
                ⚙️ Ajustement Flotte
              </Button>
              <Button 
                variant="outline" 
                size="xs" 
                onClick={() => {
                  setCoffreMtn(String(coffres.mtn))
                  setCoffreMoov(String(coffres.moov))
                  setCoffreCeltiis(String(coffres.celtiis))
                  setCoffreCash(String(coffres.cash))
                  setShowCoffreModal(true)
                }}
                className="text-xs shrink-0"
              >
                Ajuster Coffres
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-stone-500 text-center">
            <div>
              <span className="block text-amber-600 font-bold mb-0.5">MTN Initial</span>
              {coffres.mtn.toLocaleString('fr-FR')}
            </div>
            <div>
              <span className="block text-blue-600 font-bold mb-0.5">Moov Initial</span>
              {coffres.moov.toLocaleString('fr-FR')}
            </div>
            <div>
              <span className="block text-emerald-600 font-bold mb-0.5">Celtiis Initial</span>
              {coffres.celtiis.toLocaleString('fr-FR')}
            </div>
            <div>
              <span className="block text-purple-500 font-bold mb-0.5">Cash Initial</span>
              {coffres.cash.toLocaleString('fr-FR')}
            </div>
          </div>
        </section>

        {/* Safety tip 1 (Terrain tip) */}
        <div className={`p-4 rounded-[20px] border flex gap-3 ${
          theme === 'dark' 
            ? 'bg-blue-950/20 border-blue-900/40 text-blue-300' 
            : 'bg-blue-50/70 border-blue-100 text-blue-900 font-medium'
        }`}>
          <Info className="size-5 shrink-0 text-blue-400 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold block mb-1">📢 Astuce du terrain Béninois :</span>
            La loi suprême du gérant MoMo en cas de gros transfert (≥ 100k FCFA) : compte d'abord les billets physiques, range-les au chaud, et ne valide le transfert sur ton mobile qu'après. Méfie-toi des clients pressés ou qui passent des appels téléphoniques bruyants.
          </div>
        </div>

        {/* Weekly activity chart Mockup */}
        <section className={`p-5 rounded-[28px] border transition-colors ${
          theme === 'dark' ? 'bg-[#0b0b10] border-[#151520]' : 'bg-white border-stone-300'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase font-serif">Activité Hebdomadaire</h3>
              <p className="text-[9px] text-stone-500">Volume de vente de crédit & forfaits</p>
            </div>
            <div className="flex gap-1 bg-stone-950/20 p-0.5 border border-stone-850 rounded-lg text-[9px] font-bold">
              <span className="px-2 py-1 rounded bg-cyan-555 text-stone-950">VOLUME (FCFA)</span>
              <span className="px-2 py-1 text-stone-400 cursor-pointer">OPÉRATIONS</span>
            </div>
          </div>

          <div className="flex justify-between items-end h-32 px-4 gap-2 pt-2 border-b border-stone-800/40">
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
                <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full max-w-[14px] flex flex-col justify-end rounded-t overflow-hidden h-24 bg-[#050508]">
                    <div className={`w-full bg-emerald-500 ${heights[idx].celtiis}`} />
                    <div className={`w-full bg-blue-600 ${heights[idx].moov}`} />
                    <div className={`w-full bg-amber-400 ${heights[idx].mtn}`} />
                  </div>
                  <span className="text-[8px] font-mono text-stone-500 uppercase">{day.split(' ')[1]}</span>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center gap-4 text-[9px] font-bold uppercase mt-3">
            <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-500" /> Celtiis</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded bg-amber-400" /> MTN</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded bg-blue-600" /> Moov</span>
          </div>
        </section>

        {/* Recent history list */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-end px-1">
            <div>
              <h3 className="text-sm font-bold uppercase font-serif">Historique Récent</h3>
              <p className="text-[9px] text-stone-500">Journal d'activité de la cabine</p>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
              theme === 'dark' ? 'bg-[#0f0f15] text-stone-300 border border-[#1e1e2d]' : 'bg-stone-200 text-stone-850'
            }`}>
              Total: {transactions.length} Tx
            </span>
          </div>

          {/* Cards for transactions */}
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {transactions.map(txn => (
                <motion.div 
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col gap-3 ${
                    txn.isScamReported 
                      ? theme === 'dark' 
                        ? 'border-rose-900 bg-rose-955/20 text-rose-300' 
                        : 'border-rose-300 bg-rose-50 text-rose-900'
                      : txn.type === 'appro_sim' || txn.type === 'ajust_cash'
                        ? theme === 'dark' ? 'border-purple-900 bg-purple-955/10 text-purple-200' : 'border-purple-300 bg-purple-50 text-purple-900 font-medium'
                        : theme === 'dark'
                          ? 'border-[#151520] bg-[#08080c] hover:bg-[#121217]'
                          : 'border-stone-300 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait'
                          ? 'bg-cyan-500/20 text-cyan-400' 
                          : txn.type === 'withdrawal'
                            ? 'bg-rose-500/20 text-rose-550'
                            : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {txn.type === 'deposit' ? 'DEP' : 
                         txn.type === 'withdrawal' ? 'RET' : 
                         txn.type === 'credit' ? 'CREDIT' : 
                         txn.type === 'forfait' ? 'FORFAIT' : 'AJUST'}
                      </span>
                      
                      {/* Operator badge */}
                      {txn.type !== 'ajust_cash' && renderOperatorBadge(txn.operator)}

                      <span className="text-[10px] text-stone-500 font-mono">{txn.time}</span>
                    </div>

                    <div className="font-mono font-bold text-sm">
                      {txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait' || (txn.type === 'ajust_cash' && txn.category === 'Injection Cash') || txn.type === 'appro_sim' ? '+' : '-'} {txn.amount.toLocaleString('fr-FR')} <span className="text-[10px] font-normal">FCFA</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-stone-400">{txn.phone === 'SYSTEM' ? 'Ajustement' : 'N° client : '}</span>
                      <span className="font-mono font-bold">{txn.phone}</span>
                      {txn.phone !== 'SYSTEM' && blacklist.includes(txn.phone) && (
                        <span className="ml-1 text-[9px] bg-red-655 text-white font-bold px-1 rounded animate-pulse">BLACKLISTÉ</span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${
                      theme === 'dark' ? 'bg-[#0f0f15] text-stone-300' : 'bg-stone-100 text-stone-850 border border-stone-300/40'
                    }`}>
                      {txn.category}
                    </span>
                  </div>

                  {/* Actions for this transaction */}
                  {txn.phone !== 'SYSTEM' && (
                    <div className="flex justify-between items-center border-t border-stone-900/10 dark:border-stone-850/40 pt-2.5 mt-1 text-[10px] font-bold">
                      <button 
                        onClick={() => toggleScamReport(txn.id)}
                        className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                          txn.isScamReported 
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'border-rose-900/40 hover:bg-[#1a0a0d] text-rose-500'
                        }`}
                      >
                        <ShieldAlert className="size-3" />
                        {txn.isScamReported ? 'Arnaque Signalée !' : 'Signaler Arnaque'}
                      </button>

                      <button 
                        onClick={() => deleteTransaction(txn.id)}
                        className="text-stone-500 hover:text-stone-400 flex items-center gap-1"
                      >
                        <Trash2 className="size-3" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full mt-2">
            <Download className="size-4 mr-2" /> TÉLÉCHARGER L'HISTORIQUE (FORMAT CSV)
          </Button>

          <div className="flex justify-between items-center mt-2 text-[10px] text-stone-505 px-1">
            <span>Données hébergées en local sur ton téléphone.</span>
            <button 
              onClick={() => {
                if (confirm("Réinitialiser toutes les données de la cabine ?")) {
                  setBalances({ mtn: 240000, moov: 270000, celtiis: 50000, cash: 140000 })
                  setTransactions([])
                }
              }}
              className="text-rose-500 font-bold hover:underline"
            >
              Réinitialiser tout
            </button>
          </div>
        </section>

        {/* Blacklist section */}
        <section className={`p-5 rounded-[28px] border transition-colors ${
          theme === 'dark' ? 'bg-[#08080c] border-[#151520]' : 'bg-white border-stone-300'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold uppercase font-serif">Blacklist Communautaire</h3>
                <p className="text-[9px] text-stone-500">Numéros suspects recensés localement</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="xs" 
              onClick={() => setShowBlacklistModal(true)}
            >
              Gérer ({blacklist.length})
            </Button>
          </div>
        </section>

        {/* Survival bulletin Red Alert Card */}
        <section className="p-5 rounded-[28px] bg-red-950/20 border border-red-900/40 text-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-5 text-red-550" />
            <h3 className="text-sm font-bold uppercase font-serif tracking-wider">Bulletin de survie des gérants (Cotonou)</h3>
          </div>
          <ul className="text-[11px] list-disc pl-4 flex flex-col gap-2 leading-relaxed">
            <li>
              Exige que le client éteigne son téléphone s'il insiste pour te le donner pour "t'aider à recopier son nom".
            </li>
            <li>
              Ne t'éloigne jamais de ton tiroir ouvert pour "donner de la monnaie" à un démarcheur. Appelle ton voisin.
            </li>
            <li>
              En cas de doute, compose le **136** (Numéro d'urgence au Bénin) pour signaler les arnaqueurs.
            </li>
          </ul>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-900/10 dark:border-stone-900/60 py-8 mt-12 text-center text-xs text-stone-500">
        <p className="max-w-md mx-auto px-4 leading-relaxed">
          « Momo Premium » — Outil d'assistance numérique pour les points de vente agréés MTN MoMo, Moov Money et Celtiis au Bénin.
        </p>
        <p className="mt-2 text-[10px] text-stone-600">
          Propulsé localement · Cotonou, Bénin · v1.1.2
        </p>
      </footer>

      {/* MODAL TRANSACTION FORM (DEPOT / RETRAIT / CREDIT / FORFAIT) */}
      <AnimatePresence>
        {actionType && actionType !== 'adjust_ext' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionType(null)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#08080c] border-[#151520] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold">
                    {actionType === 'deposit' ? 'Nouvel Envoi (Dépôt)' : 
                     actionType === 'withdrawal' ? 'Nouveau Retrait (Sortie)' : 
                     actionType === 'credit' ? 'Nouvelle Vente Crédit' : 'Nouvelle Vente Forfait'}
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    {actionType === 'withdrawal' ? 'FLOAT REÇU → CASH DONNÉ' : 'CASH REÇU → VALEUR SIM DÉBITÉE'}
                  </p>
                </div>
                <button onClick={() => setActionType(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
                {/* Operator select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Opérateur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['mtn', 'moov', 'celtiis'] as const).map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          setOpInput(op)
                          if (actionType === 'forfait') {
                            setSelectedForfait(BENIN_FORFAITS[op][0].name)
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all uppercase ${
                          opInput === op 
                            ? op === 'mtn' ? 'border-amber-550 bg-amber-500/10 text-amber-500'
                              : op === 'moov' ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                              : 'border-emerald-500 bg-emerald-500/10 text-emerald-555'
                            : 'border-stone-850 text-stone-400 hover:bg-stone-900/30'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Forfait Select (Only if type is forfait) */}
                {actionType === 'forfait' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Choisir le Forfait</label>
                    <select
                      value={selectedForfait}
                      onChange={e => setSelectedForfait(e.target.value)}
                      className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                        theme === 'dark' ? 'bg-[#151520] border-stone-800 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                      }`}
                    >
                      {BENIN_FORFAITS[opInput].map(f => (
                        <option key={f.name} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Montant (FCFA)</label>
                  <input 
                    type="number"
                    required
                    disabled={actionType === 'forfait'}
                    placeholder="Ex: 1000"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-800 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                    }`}
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Numéro Client</label>
                  <input 
                    type="tel"
                    required
                    placeholder="Ex: 0196887722"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-800 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                    }`}
                  />
                  {phoneInput && blacklist.includes(phoneInput.trim()) && (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                      <AlertTriangle className="size-3 text-red-550" /> ATTENTION : Numéro répertorié comme arnaqueur !
                    </span>
                  )}
                </div>

                <Button variant="premium" type="submit" loading={loading} className="w-full mt-2">
                  Valider l'Opération
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXTERNAL ADJUSTMENT MODAL */}
      <AnimatePresence>
        {actionType === 'adjust_ext' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionType(null)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#08080c] border-[#151520] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold">Ajustement Externe</h3>
                  <p className="text-[10px] text-stone-505">Mouvements de fonds sans swap interne</p>
                </div>
                <button onClick={() => setActionType(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
                {/* Adjustment Type selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Cible de l'ajustement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjType('appro_sim')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                        adjType === 'appro_sim' 
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                          : 'border-stone-800 text-stone-400'
                      }`}
                    >
                      Flotte SIM (Virtuel)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjType('ajust_cash')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                        adjType === 'ajust_cash' 
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                          : 'border-stone-800 text-stone-400'
                      }`}
                    >
                      Tiroir Cash (Physique)
                    </button>
                  </div>
                </div>

                {/* Sub-form based on selection */}
                {adjType === 'appro_sim' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">SIM à approvisionner</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mtn', 'moov', 'celtiis'] as const).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setAdjOperator(op)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all uppercase ${
                            adjOperator === op 
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                              : 'border-stone-850 text-stone-400'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Sens de l'ajustement</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjCashDirection('inject')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                          adjCashDirection === 'inject' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-450' 
                            : 'border-stone-800 text-stone-400'
                        }`}
                      >
                        + Injecter Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjCashDirection('withdraw')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                          adjCashDirection === 'withdraw' 
                            ? 'border-rose-500 bg-rose-500/10 text-rose-450' 
                            : 'border-stone-800 text-stone-400'
                        }`}
                      >
                        - Retirer Cash
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Montant (FCFA)</label>
                  <input 
                    type="number"
                    required
                    placeholder="Ex: 50000"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-800 text-white' : 'bg-stone-50 border-stone-300 text-stone-850'
                    }`}
                  />
                </div>

                <Button variant="premium" type="submit" loading={loading} className="w-full mt-2">
                  Enregistrer l'Ajustement
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADJUST COFFRES INITIALS MODAL */}
      <AnimatePresence>
        {showCoffreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoffreModal(false)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#08080c] border-[#151520] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold">Ajuster les Coffres</h3>
                  <p className="text-[10px] text-stone-500">Configure tes soldes de départ (Flotte initiale)</p>
                </div>
                <button onClick={() => setShowCoffreModal(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCoffres} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-505 uppercase">MTN MoMo Initial</label>
                  <input 
                    type="number"
                    value={coffreMtn}
                    onChange={e => setCoffreMtn(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-850 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-blue-505 uppercase">Moov Money Initial</label>
                  <input 
                    type="number"
                    value={coffreMoov}
                    onChange={e => setCoffreMoov(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-850 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-emerald-505 uppercase">Celtiis Cash Initial</label>
                  <input 
                    type="number"
                    value={coffreCeltiis}
                    onChange={e => setCoffreCeltiis(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-850 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-purple-405 uppercase">Tiroir Cash Initial</label>
                  <input 
                    type="number"
                    value={coffreCash}
                    onChange={e => setCoffreCash(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#151520] border-stone-850 text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                    }`}
                  />
                </div>

                <Button variant="premium" type="submit" className="w-full mt-2">
                  Enregistrer les configurations
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE BLACKLIST MODAL */}
      <AnimatePresence>
        {showBlacklistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlacklistModal(false)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#08080c] border-[#151520] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold">Gérer la Blacklist</h3>
                  <p className="text-[10px] text-stone-500">Numéros suspects bloqués</p>
                </div>
                <button onClick={() => setShowBlacklistModal(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="size-5" />
                </button>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddBlacklist} className="flex gap-2">
                <input 
                  type="tel"
                  placeholder="Nouveau numéro suspect"
                  value={newBlacklistPhone}
                  onChange={e => setNewBlacklistPhone(e.target.value)}
                  className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    theme === 'dark' ? 'bg-stone-900 border-stone-850 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
                <Button variant="premium" type="submit" size="sm" className="text-xs">
                  Ajouter
                </Button>
              </form>

              {/* List */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto mt-2 pr-1">
                {blacklist.map(phone => (
                  <div key={phone} className="flex justify-between items-center p-2 rounded-lg bg-stone-900/30 border border-stone-850 text-xs">
                    <span className="font-mono font-bold">{phone}</span>
                    <button 
                      onClick={() => setBlacklist(prev => prev.filter(p => p !== phone))}
                      className="text-rose-500 hover:text-rose-400 font-bold"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
