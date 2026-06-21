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
  Coins,
  Share2,
  Lock
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
  const [activeTab, setActiveTab] = useState<'caissier' | 'proprietaire'>('caissier')
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Role & PIN states
  const [role, setRole] = useState<'proprio' | 'employe'>('employe')
  const [pinCode, setPinCode] = useState('1234')
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [newPinInput, setNewPinInput] = useState('')
  const [showNewPinSection, setShowNewPinSection] = useState(false)

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

  // Bilan network filter
  const [reportOperator, setReportOperator] = useState<'all' | 'mtn' | 'moov' | 'celtiis'>('all')

  // History search and filters
  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState<'all' | 'deposit' | 'withdrawal' | 'credit' | 'forfait'>('all')
  const [historyOperator, setHistoryOperator] = useState<'all' | 'mtn' | 'moov' | 'celtiis'>('all')

  // Active receipt for thermal ticket (deposits only)
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null)

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

  // Synchronizers & Fetchers
  useEffect(() => {
    const client = getSupabase()
    setSupabaseConnected(!!client)

    const loadInitialData = async () => {
      if (client) {
        try {
          // Fetch settings (PIN)
          const { data: settingsData } = await client.from('momo_settings').select('pin_code').eq('id', 1).maybeSingle()
          if (settingsData) {
            setPinCode(settingsData.pin_code)
          }

          // Fetch balances
          const { data: balancesData } = await client.from('momo_balances').select('mtn, moov, celtiis, cash').eq('id', 1).maybeSingle()
          if (balancesData) {
            setBalances({
              mtn: Number(balancesData.mtn),
              moov: Number(balancesData.moov),
              celtiis: Number(balancesData.celtiis),
              cash: Number(balancesData.cash)
            })
          }

          // Fetch coffres
          const { data: coffresData } = await client.from('momo_coffres').select('mtn, moov, celtiis, cash').eq('id', 1).maybeSingle()
          if (coffresData) {
            setCoffres({
              mtn: Number(coffresData.mtn),
              moov: Number(coffresData.moov),
              celtiis: Number(coffresData.celtiis),
              cash: Number(coffresData.cash)
            })
          }

          // Fetch blacklist
          const { data: blacklistData } = await client.from('momo_blacklist').select('phone')
          if (blacklistData && blacklistData.length > 0) {
            setBlacklist(blacklistData.map((b: any) => b.phone))
          }

          // Fetch transactions
          const { data: transactionsData } = await client
            .from('momo_transactions')
            .select('*')
            .order('date', { ascending: false })
            .order('time', { ascending: false })
          if (transactionsData && transactionsData.length > 0) {
            setTransactions(transactionsData.map((t: any) => ({
              id: t.id,
              phone: t.phone,
              operator: t.operator,
              type: t.type,
              amount: Number(t.amount),
              time: t.time,
              date: typeof t.date === 'string' ? t.date : getLocalDateString(new Date(t.date)),
              category: t.category,
              isScamReported: t.is_scam_reported
            })))
          }
        } catch (err) {
          console.error("Error loading data from Supabase, falling back to localStorage:", err)
          loadFromLocalStorage()
        }
      } else {
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      const storedRole = localStorage.getItem('momo_role')
      if (storedRole) {
        setRole(storedRole as any)
        if (storedRole === 'proprio') {
          setActiveTab('proprietaire')
        }
      }
      
      const storedPin = localStorage.getItem('momo_pin')
      if (storedPin) setPinCode(storedPin)

      const storedBalances = localStorage.getItem('momo_balances')
      if (storedBalances) setBalances(JSON.parse(storedBalances))

      const storedCoffres = localStorage.getItem('momo_coffres')
      if (storedCoffres) setCoffres(JSON.parse(storedCoffres))

      const storedBlacklist = localStorage.getItem('momo_blacklist')
      if (storedBlacklist) setBlacklist(JSON.parse(storedBlacklist))

      const storedTransactions = localStorage.getItem('momo_transactions')
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions))
    }

    loadInitialData()
  }, [])

  // Sync state helpers
  const syncBalances = async (newBalances: typeof balances) => {
    setBalances(newBalances)
    localStorage.setItem('momo_balances', JSON.stringify(newBalances))
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_balances').upsert({ id: 1, ...newBalances, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync balances error:", e)
      }
    }
  }

  const syncCoffres = async (newCoffres: typeof coffres) => {
    setCoffres(newCoffres)
    localStorage.setItem('momo_coffres', JSON.stringify(newCoffres))
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_coffres').upsert({ id: 1, ...newCoffres, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync coffres error:", e)
      }
    }
  }

  const syncAddTransaction = async (txn: Transaction) => {
    setTransactions(prev => {
      const updated = [txn, ...prev]
      localStorage.setItem('momo_transactions', JSON.stringify(updated))
      return updated
    })
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_transactions').insert([{
          id: txn.id,
          phone: txn.phone,
          operator: txn.operator,
          type: txn.type,
          amount: txn.amount,
          time: txn.time,
          date: txn.date,
          category: txn.category,
          is_scam_reported: !!txn.isScamReported
        }])
      } catch (e) {
        console.error("Supabase sync add transaction error:", e)
      }
    }
  }

  const syncToggleScamReport = async (id: string, isReported: boolean) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, isScamReported: isReported } : t)
      localStorage.setItem('momo_transactions', JSON.stringify(updated))
      return updated
    })
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_transactions').update({ is_scam_reported: isReported }).eq('id', id)
      } catch (e) {
        console.error("Supabase sync toggle scam error:", e)
      }
    }
  }

  const syncDeleteTransaction = async (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id)
      localStorage.setItem('momo_transactions', JSON.stringify(updated))
      return updated
    })
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_transactions').delete().eq('id', id)
      } catch (e) {
        console.error("Supabase sync delete transaction error:", e)
      }
    }
  }

  const syncAddBlacklist = async (phone: string) => {
    setBlacklist(prev => {
      const updated = [...prev, phone]
      localStorage.setItem('momo_blacklist', JSON.stringify(updated))
      return updated
    })
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_blacklist').upsert({ phone })
      } catch (e) {
        console.error("Supabase sync add blacklist error:", e)
      }
    }
  }

  const syncRemoveBlacklist = async (phone: string) => {
    setBlacklist(prev => {
      const updated = prev.filter(p => p !== phone)
      localStorage.setItem('momo_blacklist', JSON.stringify(updated))
      return updated
    })
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_blacklist').delete().eq('phone', phone)
      } catch (e) {
        console.error("Supabase sync remove blacklist error:", e)
      }
    }
  }

  const syncPinCode = async (newPin: string) => {
    setPinCode(newPin)
    localStorage.setItem('momo_pin', newPin)
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_settings').upsert({ id: 1, pin_code: newPin, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync PIN error:", e)
      }
    }
  }

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

  // Filter transactions according to selected period and selected network
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

    // Filter by network if selected
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
  }, [transactions, periodType, selectedReportDate, reportOperator])

  // Filtered recent history list
  const filteredRecentHistory = useMemo(() => {
    return transactions.filter(txn => {
      const matchSearch = historySearch.trim() === '' || txn.phone.includes(historySearch.trim())
      const matchType = historyType === 'all' || txn.type === historyType
      const matchOperator = historyOperator === 'all' || txn.operator === historyOperator
      return matchSearch && matchType && matchOperator
    })
  }, [transactions, historySearch, historyType, historyOperator])

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

  // WhatsApp share link generator
  const shareOnWhatsApp = (txn: Transaction) => {
    const text = `*MOMO PREMIUM - REÇU DE DÉPÔT*%0A---------------------------%0A*Date* : ${txn.date} à ${txn.time}%0A*Réseau* : ${txn.operator.toUpperCase()}%0A*Numéro Client* : ${txn.phone}%0A*Montant* : ${txn.amount.toLocaleString('fr-FR')} FCFA%0A*Statut* : RÉUSSI%0A---------------------------%0AMerci de votre confiance !`
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  // Handle role change / PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === pinCode) {
      setRole('proprio')
      localStorage.setItem('momo_role', 'proprio')
      setShowPinModal(false)
      setPinInput('')
      setPinError('')
      setActiveTab('proprietaire')
    } else {
      setPinError('Code PIN incorrect')
    }
  }

  const handleSwitchToEmployee = () => {
    setRole('employe')
    localStorage.setItem('momo_role', 'employe')
    setActiveTab('caissier')
  }

  // Handle transaction creation (MTN / MOOV / CELTIIS swap with Drawer Cash or external adjustment)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const todayDateStr = getLocalDateString()

    setLoading(true)

    // 1. External Adjustments
    if (actionType === 'adjust_ext') {
      const amount = parseFloat(amountInput) || 0
      if (adjType === 'appro_sim') {
        const nextBalances = {
          ...balances,
          [adjOperator]: balances[adjOperator] + amount
        }
        await syncBalances(nextBalances)

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
        await syncAddTransaction(newTxn)
      } else {
        const multiplier = adjCashDirection === 'inject' ? 1 : -1
        const nextBalances = {
          ...balances,
          cash: balances.cash + (amount * multiplier)
        }
        await syncBalances(nextBalances)

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
        await syncAddTransaction(newTxn)
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

    let nextBalances = { ...balances }
    if (actionType === 'deposit' || actionType === 'credit' || actionType === 'forfait') {
      nextBalances = {
        ...balances,
        cash: balances.cash + amount,
        [opInput]: balances[opInput] - amount
      }
    } else if (actionType === 'withdrawal') {
      nextBalances = {
        ...balances,
        cash: balances.cash - amount,
        [opInput]: balances[opInput] + amount
      }
    }
    await syncBalances(nextBalances)

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

    await syncAddTransaction(newTxn)
    setLoading(false)
    setActionType(null)

    // Open ticket automatically if it's a deposit
    if (actionType === 'deposit') {
      setActiveReceipt(newTxn)
    }

    setPhoneInput('')
    setAmountInput('')
    setSelectedForfait('')
  }

  // Adjust Start Float reserves
  const handleSaveCoffres = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save coffres
    const nextCoffres = {
      mtn: parseFloat(coffreMtn) || 0,
      moov: parseFloat(coffreMoov) || 0,
      celtiis: parseFloat(coffreCeltiis) || 0,
      cash: parseFloat(coffreCash) || 0,
    }
    await syncCoffres(nextCoffres)

    // Update PIN if requested
    if (newPinInput.trim() !== '') {
      await syncPinCode(newPinInput.trim())
      setNewPinInput('')
      setShowNewPinSection(false)
      alert("Code PIN mis à jour avec succès !")
    }

    setShowCoffreModal(false)
  }

  // Toggle scam flag
  const toggleScamReport = async (id: string) => {
    const txn = transactions.find(t => t.id === id)
    if (txn) {
      await syncToggleScamReport(id, !txn.isScamReported)
    }
  }

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    if (confirm("Supprimer définitivement cet enregistrement ?")) {
      await syncDeleteTransaction(id)
    }
  }

  // Add to blacklist
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlacklistPhone) return
    await syncAddBlacklist(newBlacklistPhone.trim())
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
          return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">mtn</span>
        case 'moov':
          return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">moov</span>
        case 'celtiis':
          return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">celtiis</span>
        default:
          return null
      }
    } else {
      switch (operator) {
        case 'mtn':
          return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">mtn</span>
        case 'moov':
          return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">moov</span>
        case 'celtiis':
          return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">celtiis</span>
        default:
          return null
      }
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-550 font-sans ${
      theme === 'dark' ? 'bg-[#050807] text-[#E4EAD8]' : 'bg-[#FAF9F6] text-[#111614]'
    }`}>
      
      {/* Top Banner / Security active */}
      <div className={`w-full py-3 px-6 text-center text-xs font-bold tracking-wider flex items-center justify-center gap-2 border-b transition-colors ${
        theme === 'dark' 
          ? 'bg-[#0E1B15] text-[#D4AF37] border-[#1C2C22]' 
          : 'bg-[#F2EFE9] text-[#7C651A] border-[#DCD6CD]'
      }`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-natural-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-natural-accent"></span>
        </span>
        CABINE DE SÉCURITÉ ACTIVE : BÉNIN (COTONOU / ABOMEY-CALAVI)
      </div>

      {/* Header */}
      <header className={`border-b transition-colors sticky top-0 z-40 backdrop-blur-md ${
        theme === 'dark' 
          ? 'border-[#1C2C22] bg-[#050807]/90' 
          : 'border-[#DCD6CD] bg-[#FAF9F6]/90'
      }`}>
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-11 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-[#0E1B15] text-natural-accent border border-[#1C2C22]' 
                : 'bg-white text-natural-accent-hover border border-[#DCD6CD]'
            }`}>
              <Wallet className="size-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight block">MOMO PREMIUM</span>
              <span className="text-[9px] block font-bold tracking-widest uppercase text-natural-accent -mt-1">Luxury Cabin Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === 'proprio' && (
              <button
                onClick={handleSwitchToEmployee}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === 'dark' 
                    ? 'bg-rose-950/20 border-rose-900/30 text-rose-455 hover:bg-rose-950/40' 
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
                title="Verrouiller la session Propriétaire"
              >
                <Lock className="size-3" /> Verrouiller
              </button>
            )}

            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-colors hidden sm:inline-block ${
              theme === 'dark' ? 'bg-[#0E1B15] text-emerald-400 border-[#1C2C22]' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {supabaseConnected ? 'Supabase Sync 🟢' : 'Offline Safe 🌐'}
            </span>

            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`size-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-[#0E1B15] border-[#1C2C22] text-yellow-400 hover:bg-[#1C2C22]' 
                  : 'bg-white border-[#DCD6CD] text-stone-700 hover:bg-stone-100'
              }`}
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Espace Tabs Switcher */}
        <div className={`flex p-1 rounded-2xl border text-xs font-bold transition-all ${
          theme === 'dark' ? 'bg-[#0A0F0D] border-[#1C2C22]' : 'bg-[#EFECE6] border-[#DCD6CD]'
        }`}>
          <button
            onClick={() => setActiveTab('caissier')}
            className={`flex-1 py-3 rounded-xl transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'caissier' 
                ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Espace Caissier 👤</span>
          </button>
          <button
            onClick={() => {
              if (role === 'proprio') {
                setActiveTab('proprietaire')
              } else {
                setShowPinModal(true)
              }
            }}
            className={`flex-1 py-3 rounded-xl transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'proprietaire' 
                ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Espace Propriétaire 👑</span>
            {role !== 'proprio' && <Lock className="size-3" />}
          </button>
        </div>

        {/* TAB 1: CAISSIER / OPERATIONS */}
        {activeTab === 'caissier' && (
          <div className="flex flex-col gap-6">
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
                  Mode Caisse actif
                </span>
              </div>

              <div className="text-center py-4 mb-6 relative z-10">
                <h2 className="text-5xl font-serif font-black tracking-tight text-natural-accent">
                  {soldeGlobal.toLocaleString('fr-FR')} <span className="text-xl font-sans font-medium">FCFA</span>
                </h2>
              </div>

              {/* SIM and Cash grid */}
              <div className="grid grid-cols-2 gap-4 relative z-10">
                {/* MTN SIM */}
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

                {/* MOOV SIM */}
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

                {/* CELTIIS SIM */}
                <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
                }`}>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 mb-1.5 uppercase tracking-wider">
                    <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-450" />
                    SIM Celtiis
                  </span>
                  <div className="font-mono font-bold text-base text-emerald-500">
                    {balances.celtiis.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                  </div>
                </div>

                {/* CASH IN DRAWER */}
                <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
                }`}>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-purple-400 mb-1.5 uppercase tracking-wider">
                    <span className="size-2 rounded-full bg-purple-500 shadow-sm shadow-purple-450" />
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
              {/* DEPOSIT */}
              <button 
                onClick={() => { setActionType('deposit'); setOpInput('mtn'); }}
                className="p-5 rounded-[28px] bg-natural-accent hover:bg-natural-accent-hover text-[#0A0F0D] text-left flex flex-col justify-between h-28 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                  <ArrowDownLeft className="size-4.5 stroke-[3px]" />
                  ENVOI (DÉPÔT)
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-80">
                    Cash Reçu → SIM Débitée
                  </div>
                  <div className="text-[8px] opacity-60 mt-0.5">MTN, Moov, Celtiis</div>
                </div>
              </button>

              {/* WITHDRAWAL */}
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
                  RETRAIT (RETRAIT)
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                    SIM Créditée → Cash Donné
                  </div>
                  <div className="text-[8px] text-stone-400 mt-0.5">Distribution directe de cash</div>
                </div>
              </button>

              {/* CREDIT SALES */}
              <button 
                onClick={() => { setActionType('credit'); setOpInput('mtn'); }}
                className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-28 border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-[#1C2C22] bg-[#0E1B15] hover:bg-[#12241C] text-white shadow-lg' 
                    : 'border-[#DCD6CD] bg-white hover:bg-stone-50 text-[#111614] shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500">
                  <Smartphone className="size-4.5 stroke-[2px]" />
                  VENTE CRÉDIT
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                    Cash Reçu → Airtime
                  </div>
                  <div className="text-[8px] text-stone-400 mt-0.5">Recharges ordinaires</div>
                </div>
              </button>

              {/* FORFAIT SALES */}
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
                  <Zap className="size-4.5 stroke-[2px]" />
                  VENTE FORFAIT
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                    Cash Reçu → Forfait Internet
                  </div>
                  <div className="text-[8px] text-stone-400 mt-0.5">Activation rapide d'offres</div>
                </div>
              </button>
            </section>

            {/* Safety tip 1 (Terrain tip) */}
            <div className={`p-4 rounded-[24px] border flex gap-3 ${
              theme === 'dark' 
                ? 'bg-[#0E1B15] border-[#1C2C22] text-[#E4EAD8]' 
                : 'bg-[#F2EFE9] border-[#DCD6CD] text-[#332C12] font-medium'
            }`}>
              <Info className="size-5 shrink-0 text-amber-600 dark:text-natural-accent mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-extrabold text-amber-700 dark:text-natural-accent block mb-1">📢 RÈGLE D'OR CABINE :</span>
                Pour tout dépôt important (≥ 100 000 FCFA) : comptez physiquement les billets, mettez-les en sécurité dans le tiroir fermé, puis validez le transfert sur votre mobile. Ne vous laissez pas distraire.
              </div>
            </div>

            {/* Bilan Périodique Section */}
            <section className={`p-6 rounded-[32px] border transition-colors ${
              theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
            }`}>
              {/* Period type selector segments */}
              <div className="flex bg-[#050807]/60 dark:bg-stone-950/20 p-1 rounded-2xl border border-stone-300 dark:border-stone-850 text-xs font-bold mb-5">
                {(['day', 'week', 'month', 'year'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodType(p)}
                    className={`flex-1 py-2.5 rounded-xl transition-all capitalize cursor-pointer font-bold ${
                      periodType === p 
                        ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                        : 'text-stone-400 hover:text-white'
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
                    Bilan Périodique ({formattedReportPeriodLabel})
                  </h3>
                  <p className="text-[9px] text-stone-500">
                    Cumul financier pour la période sélectionnée
                  </p>
                </div>
                
                {/* Contextual Date Navigators */}
                <div className="flex items-center gap-1.5 bg-[#050807]/40 dark:bg-stone-950/20 p-1 rounded-xl border border-stone-350 dark:border-stone-850 text-[10px] font-bold">
                  {periodType === 'day' && (
                    <>
                      <button 
                        onClick={() => setSelectedReportDate(TODAY_STR)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedReportDate === TODAY_STR ? 'bg-natural-accent text-[#0A0F0D] shadow' : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        Auj.
                      </button>
                      <button 
                        onClick={() => setSelectedReportDate(YESTERDAY_STR)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedReportDate === YESTERDAY_STR ? 'bg-natural-accent text-[#0A0F0D] shadow' : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        Hier
                      </button>
                      <input 
                        type="date"
                        value={selectedReportDate}
                        onChange={e => e.target.value && setSelectedReportDate(e.target.value)}
                        className={`px-1 bg-transparent border-0 font-mono text-[9px] focus:outline-none cursor-pointer ${
                          theme === 'dark' ? 'text-white' : 'text-stone-800'
                        }`}
                      />
                    </>
                  )}

                  {periodType === 'week' && (
                    <>
                      <button 
                        onClick={() => setSelectedReportDate(TODAY_STR)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          getWeekRange(selectedReportDate).start === getWeekRange(TODAY_STR).start ? 'bg-natural-accent text-[#0A0F0D] shadow' : 'text-stone-400 hover:text-white'
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
                          getWeekRange(selectedReportDate).start === getWeekRange(getYesterdayDateString()).start && getWeekRange(selectedReportDate).start !== getWeekRange(TODAY_STR).start ? 'bg-natural-accent text-[#0A0F0D] shadow' : 'text-stone-400 hover:text-white'
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
                        theme === 'dark' ? 'text-white bg-[#050807]' : 'text-stone-800 bg-white'
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
                        theme === 'dark' ? 'text-white bg-[#050807]' : 'text-stone-800 bg-white'
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
                <div className="flex bg-[#050807]/40 dark:bg-stone-950/20 p-0.5 rounded-lg border border-stone-300 dark:border-stone-850 text-[9px] font-bold">
                  {(['all', 'mtn', 'moov', 'celtiis'] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => setReportOperator(op)}
                      className={`px-3 py-1 rounded transition-all capitalize cursor-pointer ${
                        reportOperator === op 
                          ? 'bg-natural-accent text-[#0A0F0D]' 
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {op === 'all' ? 'Tous' : op}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance table sheet */}
              <div className="overflow-hidden rounded-2xl border border-stone-300 dark:border-stone-850 shadow-inner">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'bg-[#050807] border-stone-850' : 'bg-stone-100 border-stone-250'} text-[10px] uppercase font-extrabold text-stone-700 dark:text-stone-450`}>
                      <th className="py-3 px-4">Activité</th>
                      <th className="py-3 px-4 text-right">Cumul (FCFA)</th>
                      <th className="py-3 px-4 text-center">Volume Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-350/20 dark:divide-stone-850/40">
                    <tr className="hover:bg-stone-500/5 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold flex items-center gap-2">
                        <span className="size-2 rounded-full bg-natural-accent shadow-sm shadow-natural-accent" />
                        Dépôts (Envois)
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#111614] dark:text-[#E4EAD8]">
                        {periodicReportStats.deposit.sum.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {periodicReportStats.deposit.count} tx
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-500/5 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold flex items-center gap-2">
                        <span className="size-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
                        Retraits (Sorties)
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-500">
                        {periodicReportStats.withdrawal.sum.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {periodicReportStats.withdrawal.count} tx
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-500/5 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
                        Ventes de Crédits
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-500">
                        {periodicReportStats.credit.sum.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {periodicReportStats.credit.count} tx
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-500/5 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                        Ventes de Forfaits
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-450">
                        {periodicReportStats.forfait.sum.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {periodicReportStats.forfait.count} tx
                      </td>
                    </tr>
                    {/* Total row */}
                    <tr className={`border-t font-black ${
                      theme === 'dark' ? 'bg-[#0A0F0D] text-natural-accent border-[#1C2C22]' : 'bg-stone-50 text-[#111614] border-[#DCD6CD]'
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

            {/* Weekly activity chart Mockup */}
            <section className={`p-6 rounded-[32px] border transition-colors ${
              theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD]'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Activité Hebdomadaire</h3>
                  <p className="text-[9px] text-stone-500">Volume de vente de crédit & forfaits</p>
                </div>
                <div className="flex gap-1 bg-stone-900/10 p-0.5 border border-stone-800/10 dark:border-stone-850 rounded-lg text-[9px] font-bold">
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
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-emerald-555" /> Celtiis</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-amber-455" /> MTN</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-blue-555" /> Moov</span>
              </div>
            </section>

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

              {/* Interactive filter controls above the list */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD]'
              }`}>
                
                {/* Phone search */}
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
                  {/* Type filter */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                    <label className="text-[8px] font-bold text-stone-500 uppercase tracking-wide">Activité</label>
                    <select
                      value={historyType}
                      onChange={e => setHistoryType(e.target.value as any)}
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

                  {/* Operator filter */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                    <label className="text-[8px] font-bold text-stone-500 uppercase tracking-wide">Réseau</label>
                    <select
                      value={historyOperator}
                      onChange={e => setHistoryOperator(e.target.value as any)}
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

              {/* Cards for transactions */}
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
                          if (txn.type === 'deposit') {
                            setActiveReceipt(txn)
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col gap-3.5 ${
                          txn.type === 'deposit' ? 'cursor-pointer hover:border-natural-accent' : ''
                        } ${
                          txn.isScamReported 
                            ? theme === 'dark' 
                              ? 'border-rose-900 bg-rose-950/20 text-rose-300' 
                              : 'border-rose-300 bg-rose-50 text-rose-900'
                            : txn.type === 'appro_sim' || txn.type === 'ajust_cash'
                              ? theme === 'dark' ? 'border-purple-900 bg-purple-950/10 text-purple-200' : 'border-purple-300 bg-purple-50 text-purple-900 font-medium'
                              : theme === 'dark'
                                ? 'border-[#1C2C22] bg-[#0E1B15]/40 hover:bg-[#0E1B15]/60'
                                : 'border-[#DCD6CD] bg-white hover:bg-stone-50'
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
                              {txn.type === 'deposit' ? 'DEP' : 
                               txn.type === 'withdrawal' ? 'RET' : 
                               txn.type === 'credit' ? 'CREDIT' : 
                               txn.type === 'forfait' ? 'FORFAIT' : 'AJUST'}
                            </span>
                            
                            {/* Operator badge */}
                            {txn.type !== 'ajust_cash' && renderOperatorBadge(txn.operator)}

                            <span className="text-[9px] text-stone-500 font-mono font-bold">{txn.time}</span>
                          </div>

                          <div className="font-mono font-bold text-sm">
                            {txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait' || (txn.type === 'ajust_cash' && txn.category === 'Injection Cash') || txn.type === 'appro_sim' ? '+' : '-'} {txn.amount.toLocaleString('fr-FR')} <span className="text-[10px] font-normal">FCFA</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-stone-400">{txn.phone === 'SYSTEM' ? 'Ajustement' : 'Client : '}</span>
                            <span className="font-mono font-bold">{txn.phone}</span>
                            {txn.phone !== 'SYSTEM' && blacklist.includes(txn.phone) && (
                              <span className="ml-1 text-[8px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">ARNAQUEUR</span>
                            )}
                            {txn.type === 'deposit' && (
                              <span className="ml-2 text-[8px] font-extrabold text-natural-accent bg-natural-accent/10 px-1.5 py-0.5 rounded border border-natural-accent/25 uppercase tracking-wider">Reçu</span>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${
                            theme === 'dark' ? 'bg-[#050807] text-stone-300' : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {txn.category}
                          </span>
                        </div>

                        {/* Actions for this transaction */}
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
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-stone-500 text-xs">
                      Aucune transaction enregistrée avec ces filtres.
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full mt-2 cursor-pointer rounded-xl font-bold">
                <Download className="size-4 mr-2" /> EXPORTER L'HISTORIQUE CSV
              </Button>
            </section>

            {/* Survival bulletin Red Alert Card */}
            <section className={`p-5 rounded-[32px] border transition-all ${
              theme === 'dark'
                ? 'bg-rose-950/15 border-rose-900/30 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-5 text-rose-500" />
                <h3 className="text-sm font-bold uppercase font-serif tracking-wider">Sécurité active (Cotonou)</h3>
              </div>
              <ul className={`text-[11px] list-disc pl-4 flex flex-col gap-2.5 leading-relaxed ${
                theme === 'dark' ? 'text-stone-400' : 'text-stone-700'
              }`}>
                <li>
                  N'acceptez jamais d'aide extérieure pour copier un numéro ou manipuler votre téléphone de caisse.
                </li>
                <li>
                  Sécurisez toujours les fonds physiques en tiroir à clé avant de réaliser une opération à distance.
                </li>
                <li>
                  Pour tout signalement direct d'arnaque en cours, composez le **136** (Numéro d'urgence au Bénin).
                </li>
              </ul>
            </section>
          </div>
        )}

        {/* TAB 2: PROPRIÉTAIRE / CONFIG */}
        {activeTab === 'proprietaire' && role === 'proprio' && (
          <div className="flex flex-col gap-6">
            
            {/* Start reserves configurations (Coffres setup) */}
            <section className={`p-6 rounded-[32px] border transition-colors ${
              theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
            }`}>
              <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-2">
                <Sliders className="size-4.5" />
                Fonds de départ (Coffres)
              </h3>
              <p className="text-[10px] text-stone-505 mb-4">
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
              <p className="text-[10px] text-stone-505 mb-4">
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
              <p className="text-[10px] text-stone-505 mb-4">
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
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-900/10 dark:border-[#1C2C22] py-10 mt-16 text-center text-xs text-stone-500">
        <p className="max-w-md mx-auto px-4 leading-relaxed font-bold">
          « Momo Premium » — Outil d'assistance numérique pour les points de vente agréés MTN MoMo, Moov Money et Celtiis au Bénin.
        </p>
        <p className="mt-2 text-[9px] text-stone-600">
          Propulsé localement · Cotonou, Bénin · v1.1.2
        </p>
      </footer>

      {/* THERMAL TICKET DE CAISSE DIALOG (DEPOSITS ONLY) */}
      <AnimatePresence>
        {activeReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReceipt(null)}
              className="absolute inset-0 bg-black/60"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative w-full max-w-xs bg-white text-stone-900 p-6 shadow-2xl rounded-[24px] font-mono flex flex-col gap-4 border border-stone-200 z-50 select-none overflow-hidden"
            >
              {/* Serrated roll paper top decoration */}
              <div className="absolute -top-1 left-0 right-0 h-2 bg-gradient-to-r from-transparent to-stone-200/55 flex justify-between">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="size-2 bg-stone-300 rotate-45 transform -translate-y-1.5" />
                ))}
              </div>

              {/* Receipt Content */}
              <div className="text-center mt-3">
                <h4 className="text-xs font-black tracking-widest uppercase">*** REÇU DE PAIEMENT ***</h4>
                <p className="text-[10px] text-stone-500 uppercase mt-0.5">Momo Premium - Cabine Bénin</p>
                <p className="text-[8px] text-stone-400 font-mono mt-1">ID: {activeReceipt.id}</p>
              </div>

              <div className="border-t border-dashed border-stone-300 my-1" />

              <div className="flex flex-col gap-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span>DATE & HEURE :</span>
                  <span>{activeReceipt.date} à {activeReceipt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>OPERATEUR :</span>
                  <span className="font-bold uppercase">{activeReceipt.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span>NUMERO CLIENT :</span>
                  <span className="font-bold">{activeReceipt.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>TYPE FLUX :</span>
                  <span>ENVOI (DEPOT)</span>
                </div>
                <div className="flex justify-between">
                  <span>FRAIS CABINE :</span>
                  <span>0 FCFA</span>
                </div>
              </div>

              <div className="border-t border-dashed border-stone-300 my-1" />

              <div className="flex justify-between items-center text-sm font-black">
                <span>MONTANT NET :</span>
                <span>{activeReceipt.amount.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="border-t border-dashed border-stone-300 my-1" />

              <div className="text-center text-[10px]">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-905 border border-emerald-300 font-bold uppercase rounded-lg">
                  RÉUSSI
                </span>
                
                {/* Simulated barcode */}
                <div className="flex justify-center gap-0.5 h-7 mt-4 bg-stone-100/55 p-1 rounded">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-full bg-stone-700 ${
                        (i % 3 === 0) ? 'w-[1px]' : (i % 5 === 0) ? 'w-[3px]' : 'w-[2px]'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-[7px] text-stone-400 mt-1 uppercase tracking-widest font-mono">Merci pour votre confiance !</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-stone-300">
                <Button 
                  onClick={() => shareOnWhatsApp(activeReceipt)}
                  variant="premium" 
                  size="sm"
                  className="w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="size-3.5" /> Envoi WhatsApp
                </Button>
                <button 
                  onClick={() => setActiveReceipt(null)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-750 text-center rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TRANSACTION FORM (DEPOT / RETRAIT / CREDIT / FORFAIT) */}
      <AnimatePresence>
        {actionType && actionType !== 'adjust_ext' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionType(null)}
              className="absolute inset-0 bg-black/60"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold text-natural-accent">
                    {actionType === 'deposit' ? 'Nouvel Envoi (Dépôt)' : 
                     actionType === 'withdrawal' ? 'Nouveau Retrait' : 
                     actionType === 'credit' ? 'Nouvelle Vente Crédit' : 'Nouvelle Vente Forfait'}
                  </h3>
                  <p className="text-[9px] text-stone-500">
                    {actionType === 'withdrawal' ? 'FLOAT REÇU → CASH PHYSIQUE RETIRÉ' : 'CASH PHYSIQUE REÇU → FLOAT SIM DÉBITÉ'}
                  </p>
                </div>
                <button onClick={() => setActionType(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
                {/* Operator select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Opérateur</label>
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
                        className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all uppercase cursor-pointer ${
                          opInput === op 
                            ? op === 'mtn' ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : op === 'moov' ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                              : 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                            : 'border-stone-500/20 text-stone-400 hover:bg-stone-500/5'
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
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Choisir le Forfait</label>
                    <select
                      value={selectedForfait}
                      onChange={e => setSelectedForfait(e.target.value)}
                      className={`w-full p-3.5 border rounded-xl focus:outline-none text-sm ${
                        theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
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
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Montant (FCFA)</label>
                  <input 
                    type="number"
                    required
                    disabled={actionType === 'forfait'}
                    placeholder="Ex: 5000"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Numéro de Téléphone Client</label>
                  <input 
                    type="tel"
                    required
                    placeholder="Ex: 0196887722"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                  {phoneInput && blacklist.includes(phoneInput.trim()) && (
                    <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1.5 mt-1 animate-pulse">
                      <AlertTriangle className="size-3.5" /> ATTENTION : Ce numéro est signalé dans la blacklist !
                    </span>
                  )}
                </div>

                <Button variant="premium" type="submit" loading={loading} className="w-full mt-2 cursor-pointer font-bold py-3.5">
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
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionType(null)}
              className="absolute inset-0 bg-black/60"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold text-natural-accent">Ajustement Externe</h3>
                  <p className="text-[10px] text-stone-500">Mouvements de caisse virtuels ou réapprovisionnements</p>
                </div>
                <button onClick={() => setActionType(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
                {/* Adjustment Type selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Cible de l'ajustement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjType('appro_sim')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        adjType === 'appro_sim' 
                          ? 'border-natural-accent bg-natural-accent/10 text-natural-accent' 
                          : 'border-stone-500/25 text-stone-400 hover:bg-stone-500/5'
                      }`}
                    >
                      Flotte SIM (Virtuel)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjType('ajust_cash')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        adjType === 'ajust_cash' 
                          ? 'border-natural-accent bg-natural-accent/10 text-natural-accent' 
                          : 'border-stone-500/25 text-stone-400 hover:bg-stone-500/5'
                      }`}
                    >
                      Tiroir Cash (Physique)
                    </button>
                  </div>
                </div>

                {/* Sub-form based on selection */}
                {adjType === 'appro_sim' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-555 uppercase tracking-wide">SIM à approvisionner</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mtn', 'moov', 'celtiis'] as const).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setAdjOperator(op)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all uppercase cursor-pointer ${
                            adjOperator === op 
                              ? 'border-natural-accent bg-natural-accent/10 text-natural-accent' 
                              : 'border-[#1C2C22] text-stone-400'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Sens du mouvement</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjCashDirection('inject')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          adjCashDirection === 'inject' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                            : 'border-stone-500/25 text-stone-400 hover:bg-stone-500/5'
                        }`}
                      >
                        + Injecter Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjCashDirection('withdraw')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          adjCashDirection === 'withdraw' 
                            ? 'border-rose-500 bg-rose-500/10 text-rose-400' 
                            : 'border-stone-500/25 text-stone-400 hover:bg-stone-500/5'
                        }`}
                      >
                        - Retirer Cash
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Montant (FCFA)</label>
                  <input 
                    type="number"
                    required
                    placeholder="Ex: 50000"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:outline-none text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <Button variant="premium" type="submit" loading={loading} className="w-full mt-2 cursor-pointer font-bold py-3.5">
                  Enregistrer
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADJUST COFFRES INITIALS MODAL */}
      <AnimatePresence>
        {showCoffreModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoffreModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold text-natural-accent">Ajuster les Coffres</h3>
                  <p className="text-[10px] text-stone-500">Configurez les fonds de départ initiaux (Start Float)</p>
                </div>
                <button onClick={() => setShowCoffreModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCoffres} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Fonds MTN Initial</label>
                  <input 
                    type="number"
                    value={coffreMtn}
                    onChange={e => setCoffreMtn(e.target.value)}
                    className={`w-full p-3 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">Fonds Moov Initial</label>
                  <input 
                    type="number"
                    value={coffreMoov}
                    onChange={e => setCoffreMoov(e.target.value)}
                    className={`w-full p-3 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Fonds Celtiis Initial</label>
                  <input 
                    type="number"
                    value={coffreCeltiis}
                    onChange={e => setCoffreCeltiis(e.target.value)}
                    className={`w-full p-3 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Fonds Cash Initial</label>
                  <input 
                    type="number"
                    value={coffreCash}
                    onChange={e => setCoffreCash(e.target.value)}
                    className={`w-full p-3 border rounded-xl text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                {/* Change PIN section */}
                <div className="border-t border-stone-500/10 pt-3.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewPinSection(prev => !prev)}
                    className="text-xs font-bold text-natural-accent hover:underline uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                  >
                    ⚙️ Modifier le Code PIN de sécurité
                  </button>
                  
                  {showNewPinSection && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide font-mono">Nouveau PIN</label>
                      <input 
                        type="password"
                        placeholder="Ex: 1234"
                        maxLength={6}
                        value={newPinInput}
                        onChange={e => setNewPinInput(e.target.value)}
                        className={`w-full p-3 border rounded-xl text-sm ${
                          theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <Button variant="premium" type="submit" className="w-full mt-2 cursor-pointer font-bold py-3.5">
                  Enregistrer les modifications
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE BLACKLIST MODAL */}
      <AnimatePresence>
        {showBlacklistModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlacklistModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-serif font-bold text-natural-accent">Gérer la Blacklist</h3>
                  <p className="text-[10px] text-stone-500">Numéros suspects bloqués</p>
                </div>
                <button onClick={() => setShowBlacklistModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                  <X className="size-5" />
                </button>
              </div>

              {/* Add form */}
              {role === 'proprio' && (
                <form onSubmit={handleAddBlacklist} className="flex gap-2">
                  <input 
                    type="tel"
                    placeholder="Ex: 0197451239"
                    value={newBlacklistPhone}
                    onChange={e => setNewBlacklistPhone(e.target.value)}
                    className={`flex-1 p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-300'
                    }`}
                  />
                  <Button variant="premium" type="submit" size="sm" className="text-xs cursor-pointer font-bold px-4 rounded-xl">
                    Ajouter
                  </Button>
                </form>
              )}

              {/* List */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto mt-2 pr-1 scrollbar-thin">
                {blacklist.map(phone => (
                  <div key={phone} className={`flex justify-between items-center p-3 rounded-xl border text-xs ${
                    theme === 'dark' ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-[#DCD6CD]'
                  }`}>
                    <span className="font-mono font-bold">{phone}</span>
                    {role === 'proprio' && (
                      <button 
                        onClick={() => syncRemoveBlacklist(phone)}
                        className="text-rose-500 hover:text-rose-400 font-extrabold cursor-pointer"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ENTER PIN CODE MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }}
              className="absolute inset-0 bg-black/60"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-xs rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-md font-serif font-bold text-natural-accent">🔒 Accès Administrateur</h3>
                  <p className="text-[10px] text-stone-500">Saisissez le code PIN propriétaire</p>
                </div>
                <button 
                  onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }} 
                  className="text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <form onSubmit={handleVerifyPin} className="flex flex-col gap-4">
                <input 
                  type="password"
                  required
                  placeholder="••••"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  className={`w-full p-3.5 border rounded-xl text-center font-mono font-bold tracking-widest text-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-300 text-stone-800'
                  }`}
                />
                
                {pinError && (
                  <span className="text-[10px] text-rose-500 font-bold text-center">
                    ❌ {pinError}
                  </span>
                )}

                <Button variant="premium" type="submit" className="w-full cursor-pointer font-bold py-3">
                  Déverrouiller
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
