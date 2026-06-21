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
  Lock,
  LogOut,
  Building,
  UserPlus,
  Users
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
  clientName?: string;
}

interface VmClient {
  id: string;
  cabin_id: string;
  name: string;
  phone: string;
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
  const [activeTab, setActiveTab] = useState<'caissier' | 'vm' | 'proprietaire'>('caissier')
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  // VM (Vente Mobile) States
  const [vmBalances, setVmBalances] = useState({
    mtn: 0,
    moov: 0,
    celtiis: 0,
    cash: 0
  })
  const [vmOperator, setVmOperator] = useState<'mtn' | 'moov' | 'celtiis' | null>(null) // Le reseau du VM (un seul)
  const [selectedVmRunner, setSelectedVmRunner] = useState('Moussa')
  const [vmRunners, setVmRunners] = useState<any[]>([
    { name: 'Moussa', operator: 'mtn', zone: 'Cotonou Centre' },
    { name: 'Kofi', operator: 'moov', zone: 'Fidjrossé' },
    { name: 'Ablavi', operator: 'celtiis', zone: 'Abomey-Calavi' }
  ])
  const [newRunnerName, setNewRunnerName] = useState('')
  const [newRunnerOperator, setNewRunnerOperator] = useState<'mtn' | 'moov' | 'celtiis'>('mtn')
  const [newRunnerZone, setNewRunnerZone] = useState('')
  const [showAddRunner, setShowAddRunner] = useState(false)
  const [vmActionType, setVmActionType] = useState<'deposit' | 'withdrawal' | null>(null)
  const [vmOpInput, setVmOpInput] = useState<'mtn' | 'moov' | 'celtiis'>('mtn')
  const [vmAmountInput, setVmAmountInput] = useState('')
  const [vmClients, setVmClients] = useState<VmClient[]>([])
  const [showClientManager, setShowClientManager] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientNameInput, setClientNameInput] = useState('')
  const [saveClientCheckbox, setSaveClientCheckbox] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  // Auth & Session States
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [cabins, setCabins] = useState<any[]>([])
  const [activeCabinId, setActiveCabinId] = useState<string | null>(null)
  
  // Login / Register Views
  const [appView, setAppView] = useState<'landing' | 'login'>('landing')
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [roleInput, setRoleInput] = useState<'proprio' | 'employe' | 'vm' | 'vm_hybrid'>('proprio')
  const [bossEmailInput, setBossEmailInput] = useState('')
  const [newCabinName, setNewCabinName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  // Proprietor employee assignment states
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [creatingCabin, setCreatingCabin] = useState(false)

  // Role & PIN states
  const [role, setRole] = useState<'proprio' | 'employe' | 'vm' | 'vm_hybrid'>('employe')
  const [showHub, setShowHub] = useState(true)
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

  // Sync document class with active theme
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Synchronizers & Fetchers
  useEffect(() => {
    const client = getSupabase()
    setSupabaseConnected(!!client)

    if (!client) {
      setAuthLoading(false)
      loadFromLocalStorage()
      return
    }

    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadUserProfile(session.user.id)
      } else {
        setAuthLoading(false)
        loadFromLocalStorage()
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadUserProfile(session.user.id)
      } else {
        setProfile(null)
        setCabins([])
        setActiveCabinId(null)
        setAuthLoading(false)
        loadFromLocalStorage()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    const client = getSupabase()
    if (!client) return

    try {
      const { data: profileData, error: profileErr } = await client
        .from('momo_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) throw profileErr

      if (profileData) {
        setProfile(profileData)
        setRole(profileData.role)
        localStorage.setItem('momo_role', profileData.role)

        if (profileData.role === 'proprio') {
          // Fetch owned cabins
          const { data: cabinsData } = await client
            .from('momo_cabins')
            .select('*')
            .eq('owner_id', userId)
          
          if (cabinsData) {
            setCabins(cabinsData)
            const savedCabinId = localStorage.getItem('momo_active_cabin_id')
            const exists = cabinsData.find(c => c.id === savedCabinId)
            const defaultCabinId = exists ? savedCabinId : (cabinsData[0]?.id || null)
            setActiveCabinId(defaultCabinId)
            if (defaultCabinId) {
              localStorage.setItem('momo_active_cabin_id', defaultCabinId)
            }
          }
          fetchProprioEmployees(userId)
          setShowHub(true)
        } else if (profileData.role === 'vm') {
          setActiveTab('vm')
          setSelectedVmRunner(profileData.name)
          setShowHub(false)
          const { data: cabinsData } = await client
            .from('momo_cabins')
            .select('*')
            .eq('owner_id', userId)
          
          if (cabinsData) {
            setCabins(cabinsData)
            const savedCabinId = localStorage.getItem('momo_active_cabin_id')
            const exists = cabinsData.find(c => c.id === savedCabinId)
            const defaultCabinId = exists ? savedCabinId : (cabinsData[0]?.id || null)
            setActiveCabinId(defaultCabinId)
          }
        } else if (profileData.role === 'vm_hybrid') {
          setActiveTab('vm')
          setSelectedVmRunner(profileData.name)
          const { data: cabinsData } = await client
            .from('momo_cabins')
            .select('*')
            .eq('owner_id', userId)
          
          if (cabinsData) {
            setCabins(cabinsData)
            const savedCabinId = localStorage.getItem('momo_active_cabin_id')
            const exists = cabinsData.find(c => c.id === savedCabinId)
            const defaultCabinId = exists ? savedCabinId : (cabinsData[0]?.id || null)
            setActiveCabinId(defaultCabinId)
          }
          fetchProprioEmployees(userId)
          setShowHub(true)
        } else {
          // Employee
          setShowHub(false)
          if (profileData.assigned_cabin_id) {
            const { data: cabinData } = await client
              .from('momo_cabins')
              .select('*')
              .eq('id', profileData.assigned_cabin_id)
              .maybeSingle()
            if (cabinData) {
              setCabins([cabinData])
              setActiveCabinId(cabinData.id)
            }
          }
        }
      }
    } catch (e) {
      console.error("Error loading profile:", e)
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchProprioEmployees = async (ownerId: string) => {
    const client = getSupabase()
    if (!client) return
    const { data } = await client
      .from('momo_profiles')
      .select('*')
      .eq('owner_id', ownerId)
    if (data) setAllEmployees(data)
  }

  // Load Cabin Specific Data
  useEffect(() => {
    if (!activeCabinId) return
    const client = getSupabase()
    if (!client) return

    const loadCabinData = async () => {
      try {
        // Fetch Settings
        const { data: settingsData } = await client
          .from('momo_settings')
          .select('pin_code')
          .eq('cabin_id', activeCabinId)
          .maybeSingle()
        if (settingsData) {
          setPinCode(settingsData.pin_code)
        } else {
          await client.from('momo_settings').insert({ cabin_id: activeCabinId, pin_code: '1234' })
          setPinCode('1234')
        }

        // Fetch Balances
        const { data: balancesData } = await client
          .from('momo_balances')
          .select('mtn, moov, celtiis, cash')
          .eq('cabin_id', activeCabinId)
          .maybeSingle()
        if (balancesData) {
          setBalances({
            mtn: Number(balancesData.mtn),
            moov: Number(balancesData.moov),
            celtiis: Number(balancesData.celtiis),
            cash: Number(balancesData.cash)
          })
        } else {
          await client.from('momo_balances').insert({ cabin_id: activeCabinId })
        }

        // Fetch Coffres
        const { data: coffresData } = await client
          .from('momo_coffres')
          .select('mtn, moov, celtiis, cash')
          .eq('cabin_id', activeCabinId)
          .maybeSingle()
        if (coffresData) {
          setCoffres({
            mtn: Number(coffresData.mtn),
            moov: Number(coffresData.moov),
            celtiis: Number(coffresData.celtiis),
            cash: Number(coffresData.cash)
          })
        } else {
          await client.from('momo_coffres').insert({ cabin_id: activeCabinId })
        }

        // Fetch Blacklist
        const { data: blacklistData } = await client.from('momo_blacklist').select('phone')
        if (blacklistData) {
          setBlacklist(blacklistData.map(b => b.phone))
        }

        // Fetch Transactions
        const { data: transactionsData } = await client
          .from('momo_transactions')
          .select('*')
          .eq('cabin_id', activeCabinId)
          .order('date', { ascending: false })
          .order('time', { ascending: false })
        if (transactionsData) {
          setTransactions(transactionsData.map(t => ({
            id: t.id,
            phone: t.phone,
            operator: t.operator,
            type: t.type,
            amount: Number(t.amount),
            time: t.time,
            date: typeof t.date === 'string' ? t.date : getLocalDateString(new Date(t.date)),
            category: t.category,
            isScamReported: t.is_scam_reported,
            clientName: t.client_name
          })))
        }

        // Fetch VM Clients
        fetchVmClients(activeCabinId)
      } catch (err) {
        console.error("Error loading cabin data:", err)
      }
    }

    loadCabinData()
  }, [activeCabinId])

  const loadFromLocalStorage = () => {
    const storedRole = localStorage.getItem('momo_role')
    if (storedRole) {
      setRole(storedRole as any)
      if (storedRole === 'proprio' || storedRole === 'vm_hybrid') {
        setShowHub(true)
        // Restore bypass session if it was a mock session
        const bypassName = localStorage.getItem('momo_bypass_name')
        if (bypassName) {
          const mockSession = { user: { id: 'mock-user-id', email: 'bypass@demo.com' } }
          const mockProfile = { id: 'mock-user-id', role: storedRole, name: bypassName }
          setSession(mockSession)
          setProfile(mockProfile)
        }
      } else if (storedRole === 'vm') {
        setActiveTab('vm')
        setShowHub(false)
        const bypassName = localStorage.getItem('momo_bypass_name')
        if (bypassName) {
          const mockSession = { user: { id: 'mock-user-id', email: 'bypass@demo.com' } }
          const mockProfile = { id: 'mock-user-id', role: storedRole, name: bypassName }
          setSession(mockSession)
          setProfile(mockProfile)
        }
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

    const storedVmBalances = localStorage.getItem('momo_vm_balances')
    if (storedVmBalances) setVmBalances(JSON.parse(storedVmBalances))

    const storedVmClients = localStorage.getItem('momo_vm_clients')
    if (storedVmClients) setVmClients(JSON.parse(storedVmClients))

    const storedVmOperator = localStorage.getItem('momo_vm_operator') as 'mtn' | 'moov' | 'celtiis' | null
    if (storedVmOperator) {
      setVmOperator(storedVmOperator)
      setVmOpInput(storedVmOperator)
    }

    const storedVmRunners = localStorage.getItem('momo_vm_runners')
    if (storedVmRunners) {
      try {
        const parsed = JSON.parse(storedVmRunners)
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          setVmRunners(parsed.map((name: string, idx: number) => ({
            name,
            operator: idx % 3 === 0 ? 'mtn' : idx % 3 === 1 ? 'moov' : 'celtiis',
            zone: 'Zone Benin'
          })))
        } else {
          setVmRunners(parsed)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Automatically select operator based on runner's assigned network
  useEffect(() => {
    const runner = vmRunners.find(r => r.name === selectedVmRunner)
    if (runner) {
      setVmOpInput(runner.operator)
    }
  }, [selectedVmRunner, vmRunners])

  const fetchVmClients = async (cabinId: string) => {
    const client = getSupabase()
    if (client && cabinId) {
      try {
        const { data, error } = await client
          .from('momo_vm_clients')
          .select('*')
          .eq('cabin_id', cabinId)
        if (error) throw error
        if (data) {
          setVmClients(data)
          localStorage.setItem('momo_vm_clients', JSON.stringify(data))
        }
      } catch (e) {
        console.error("Supabase fetch VM clients error:", e)
      }
    } else {
      const stored = localStorage.getItem('momo_vm_clients')
      if (stored) setVmClients(JSON.parse(stored))
    }
  }

  const syncAddVmClient = async (name: string, phone: string) => {
    if (!activeCabinId) return
    const cleanedPhone = phone.trim()
    const cleanedName = name.trim()
    
    // Check if phone already exists locally
    if (vmClients.some(c => c.phone === cleanedPhone)) {
      return // Don't add duplicate
    }

    const newClientLocal: VmClient = {
      id: `client-${Math.floor(1000 + Math.random() * 9000)}`,
      cabin_id: activeCabinId,
      name: cleanedName,
      phone: cleanedPhone
    }

    setVmClients(prev => {
      const updated = [...prev, newClientLocal]
      localStorage.setItem('momo_vm_clients', JSON.stringify(updated))
      return updated
    })

    const client = getSupabase()
    if (client) {
      try {
        const { data, error } = await client
          .from('momo_vm_clients')
          .insert([{
            cabin_id: activeCabinId,
            name: cleanedName,
            phone: cleanedPhone
          }])
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setVmClients(prev => {
            const filtered = prev.filter(c => c.phone !== cleanedPhone)
            const updated = [...filtered, data]
            localStorage.setItem('momo_vm_clients', JSON.stringify(updated))
            return updated
          })
        }
      } catch (e) {
        console.error("Supabase sync add VM client error:", e)
      }
    }
  }

  const syncDeleteVmClient = async (clientId: string) => {
    setVmClients(prev => {
      const updated = prev.filter(c => c.id !== clientId)
      localStorage.setItem('momo_vm_clients', JSON.stringify(updated))
      return updated
    })

    const client = getSupabase()
    if (client && !clientId.startsWith('client-')) {
      try {
        const { error } = await client
          .from('momo_vm_clients')
          .delete()
          .eq('id', clientId)
        if (error) throw error
      } catch (e) {
        console.error("Supabase sync delete VM client error:", e)
      }
    }
  }

  // Sync state helpers
  const syncBalances = async (newBalances: typeof balances) => {
    setBalances(newBalances)
    localStorage.setItem('momo_balances', JSON.stringify(newBalances))
    const client = getSupabase()
    if (client && activeCabinId) {
      try {
        await client.from('momo_balances').upsert({ cabin_id: activeCabinId, ...newBalances, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync balances error:", e)
      }
    }
  }

  const syncCoffres = async (newCoffres: typeof coffres) => {
    setCoffres(newCoffres)
    localStorage.setItem('momo_coffres', JSON.stringify(newCoffres))
    const client = getSupabase()
    if (client && activeCabinId) {
      try {
        await client.from('momo_coffres').upsert({ cabin_id: activeCabinId, ...newCoffres, updated_at: new Date().toISOString() })
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
    if (client && activeCabinId) {
      try {
        await client.from('momo_transactions').insert([{
          id: txn.id,
          cabin_id: activeCabinId,
          phone: txn.phone,
          operator: txn.operator,
          type: txn.type,
          amount: txn.amount,
          time: txn.time,
          date: txn.date,
          category: txn.category,
          is_scam_reported: !!txn.isScamReported,
          client_name: txn.clientName
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
    if (role !== 'proprio') {
      alert("Action non autorisée : Seul le propriétaire peut supprimer des transactions.")
      return
    }
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
    if (client && activeCabinId) {
      try {
        await client.from('momo_settings').upsert({ cabin_id: activeCabinId, pin_code: newPin, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync PIN error:", e)
      }
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    setAuthSuccess('')
    const client = getSupabase()
    if (!client) {
      setAuthError("Base de données Supabase non connectée.")
      setLoading(false)
      return
    }
    const { data, error } = await client.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput
    })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
    } else {
      setAuthSuccess("Connexion réussie !")
      setEmailInput('')
      setPasswordInput('')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    setAuthSuccess('')
    const client = getSupabase()
    if (!client) {
      setAuthError("Base de données Supabase non connectée.")
      setLoading(false)
      return
    }

    try {
      let bossId: string | null = null

      if (roleInput === 'employe') {
        if (!bossEmailInput) {
          throw new Error("L'email de votre propriétaire (Boss) est requis pour lier le compte.")
        }
        const { data: bossProfile, error: bossErr } = await client
          .from('momo_profiles')
          .select('id')
          .eq('role', 'proprio')
          .eq('email', bossEmailInput.trim())
          .maybeSingle()

        if (bossErr || !bossProfile) {
          throw new Error("Aucun compte propriétaire trouvé avec cet email. Veuillez vérifier l'email de votre Boss.")
        }
        bossId = bossProfile.id
      }

      const { data: authData, error: signUpErr } = await client.auth.signUp({
        email: emailInput,
        password: passwordInput
      })

      if (signUpErr) throw signUpErr
      if (!authData.user) throw new Error("Échec de la création de l'utilisateur.")

      const { error: profileErr } = await client.from('momo_profiles').insert({
        id: authData.user.id,
        role: roleInput,
        name: nameInput,
        email: emailInput,
        owner_id: bossId
      })

      if (profileErr) throw profileErr

      if (roleInput === 'proprio' || roleInput === 'vm' || roleInput === 'vm_hybrid') {
        const cabinName = roleInput === 'vm' ? `Espace VM de ${nameInput}` : "Cabine Principale"
        const { data: cabinData, error: cabinErr } = await client.from('momo_cabins').insert({
          name: cabinName,
          owner_id: authData.user.id
        }).select().single()

        if (cabinErr) throw cabinErr

        await Promise.all([
          client.from('momo_balances').insert({ cabin_id: cabinData.id }),
          client.from('momo_coffres').insert({ cabin_id: cabinData.id }),
          client.from('momo_settings').insert({ cabin_id: cabinData.id, pin_code: '1234' })
        ])
      }

      setAuthSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.")
      setAuthView('login')
      setEmailInput('')
      setPasswordInput('')
      setNameInput('')
      setBossEmailInput('')
    } catch (err: any) {
      setAuthError(err.message || "Erreur d'inscription.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    const client = getSupabase()
    if (client) {
      await client.auth.signOut()
    }
  }

  const handleBypass = () => {
    const mockSession = { user: { id: 'mock-user-id', email: 'bypass@demo.com' } }
    const mockProfile = { id: 'mock-user-id', role: 'vm_hybrid', name: 'Propriétaire Démo' }
    const mockCabins = [{ id: 'mock-cabin-id', name: 'Cabine Démo' }]
    const mockRunners = [
      { name: 'Moussa', operator: 'mtn', zone: 'Cotonou Centre' },
      { name: 'Kofi', operator: 'moov', zone: 'Fidjrossè' },
      { name: 'Ablavi', operator: 'celtiis', zone: 'Abomey-Calavi' }
    ]
    
    setSession(mockSession)
    setProfile(mockProfile)
    setRole('vm_hybrid')
    setCabins(mockCabins)
    setVmRunners(mockRunners)
    setActiveCabinId('mock-cabin-id')
    setSupabaseConnected(false)
    setShowHub(true)
    setAuthLoading(false)
    
    localStorage.setItem('momo_role', 'vm_hybrid')
    localStorage.setItem('momo_bypass_name', 'Propriétaire Démo')
    localStorage.setItem('momo_active_cabin_id', 'mock-cabin-id')
    localStorage.setItem('momo_vm_runners', JSON.stringify(mockRunners))
    
    if (!localStorage.getItem('momo_balances')) {
      const demoBalances = { mtn: 250000, moov: 150000, celtiis: 100000, cash: 200000 }
      setBalances(demoBalances)
      localStorage.setItem('momo_balances', JSON.stringify(demoBalances))
    }

    if (!localStorage.getItem('momo_vm_clients')) {
      const demoClients: VmClient[] = [
        { id: 'client-1', cabin_id: 'mock-cabin-id', name: 'SOGEMA SARL', phone: '0122334455' },
        { id: 'client-2', cabin_id: 'mock-cabin-id', name: 'ETS TOUTA & CO', phone: '0198765432' },
        { id: 'client-3', cabin_id: 'mock-cabin-id', name: 'BÉNIN CONSTRUCTION SA', phone: '0155667788' }
      ]
      setVmClients(demoClients)
      localStorage.setItem('momo_vm_clients', JSON.stringify(demoClients))
    } else {
      const stored = localStorage.getItem('momo_vm_clients')
      if (stored) setVmClients(JSON.parse(stored))
    }
  }

  const handleCreateCabin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCabinName.trim() || !session) return
    setCreatingCabin(true)

    if (session?.user?.id === 'mock-user-id') {
      const mockNewCabin = {
        id: `mock-cabin-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newCabinName.trim(),
        owner_id: 'mock-user-id'
      }
      setCabins(prev => [...prev, mockNewCabin])
      setActiveCabinId(mockNewCabin.id)
      localStorage.setItem('momo_active_cabin_id', mockNewCabin.id)
      setNewCabinName('')
      alert(`Cabine "${mockNewCabin.name}" créée (Local Bypass) avec succès !`)
      setCreatingCabin(false)
      return
    }

    const client = getSupabase()
    if (!client) return

    try {
      const { data: cabinData, error: cabinErr } = await client.from('momo_cabins').insert({
        name: newCabinName.trim(),
        owner_id: session.user.id
      }).select().single()

      if (cabinErr) throw cabinErr

      await Promise.all([
        client.from('momo_balances').insert({ cabin_id: cabinData.id }),
        client.from('momo_coffres').insert({ cabin_id: cabinData.id }),
        client.from('momo_settings').insert({ cabin_id: cabinData.id, pin_code: '1234' })
      ])

      setCabins(prev => [...prev, cabinData])
      setActiveCabinId(cabinData.id)
      localStorage.setItem('momo_active_cabin_id', cabinData.id)
      setNewCabinName('')
      alert(`Cabine "${cabinData.name}" créée et initialisée avec succès !`)
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la création de la cabine.")
    } finally {
      setCreatingCabin(false)
    }
  }

  const handleAssignCabin = async (employeeId: string, cabinId: string) => {
    if (session?.user?.id === 'mock-user-id') {
      setAllEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, assigned_cabin_id: cabinId === 'none' ? null : cabinId } 
          : emp
      ))
      alert("Affectation de cabine mise à jour (Local Bypass) !")
      return
    }

    const client = getSupabase()
    if (!client || !session) return

    try {
      const { error } = await client
        .from('momo_profiles')
        .update({ assigned_cabin_id: cabinId === 'none' ? null : cabinId })
        .eq('id', employeeId)

      if (error) throw error

      setAllEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, assigned_cabin_id: cabinId === 'none' ? null : cabinId } 
          : emp
      ))
      alert("Affectation de cabine mise à jour !")
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'affectation.")
    }
  }

  const handleVmTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vmAmountInput || !phoneInput) return
    const amount = parseFloat(vmAmountInput)
    if (isNaN(amount) || amount <= 0) return
    const op = vmOperator || 'mtn'
    let nextVmBalances = { ...vmBalances }
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    if (vmActionType === 'deposit') {
      // Client donne cash → VM envoie virtuel. Cash monte, virtuel baisse.
      nextVmBalances = {
        ...vmBalances,
        cash: vmBalances.cash + amount,
        [op]: vmBalances[op] - amount
      }
    } else {
      // Client veut cash → VM prend virtuel. Cash baisse, virtuel monte.
      nextVmBalances = {
        ...vmBalances,
        cash: vmBalances.cash - amount,
        [op]: vmBalances[op] + amount
      }
    }

    setVmBalances(nextVmBalances)
    localStorage.setItem('momo_vm_balances', JSON.stringify(nextVmBalances))

    const finalClientName = clientNameInput.trim() !== '' ? clientNameInput.trim() : undefined

    const newTxn: Transaction = {
      id: `VM-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: phoneInput.trim(),
      operator: op,
      type: vmActionType === 'deposit' ? 'deposit' : 'withdrawal',
      amount,
      time: timeStr,
      date: getLocalDateString(),
      category: 'Vente Mobile VM',
      isScamReported: false,
      clientName: finalClientName
    }

    // Save client if requested
    if (saveClientCheckbox && finalClientName) {
      syncAddVmClient(finalClientName, phoneInput)
    }

    syncAddTransaction(newTxn)
    setVmAmountInput('')
    setPhoneInput('')
    setSelectedClientId('')
    setClientNameInput('')
    setSaveClientCheckbox(false)
    setVmActionType(null)
  }

  const handleAddRunner = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRunnerName.trim() || !newRunnerZone.trim()) return
    const newRunner = {
      name: newRunnerName.trim(),
      operator: newRunnerOperator,
      zone: newRunnerZone.trim()
    }
    setVmRunners(prev => {
      const updated = [...prev, newRunner]
      localStorage.setItem('momo_vm_runners', JSON.stringify(updated))
      return updated
    })
    setNewRunnerName('')
    setNewRunnerZone('')
    setShowAddRunner(false)
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

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${
        theme === 'dark' ? 'bg-[#050807] text-[#E4EAD8]' : 'bg-[#FAF9F6] text-[#111614]'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <RefreshCw className="size-10 animate-spin text-natural-accent" />
            <Wallet className="size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-natural-accent" />
          </div>
          <span className="text-xs font-serif font-bold tracking-widest uppercase text-natural-accent">Chargement Sécurisé...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    // --- LANDING PAGE (PUBLIC) ---
    if (appView === 'landing') {
      return (
        <div className={`min-h-screen flex flex-col font-sans relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#050807] text-[#E4EAD8]' : 'bg-[#FAF9F6] text-[#111614]'
        }`}>
          {/* Decorative background glows */}
          <div className="absolute -left-40 top-20 size-[500px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />
          <div className="absolute -right-40 bottom-20 size-[400px] rounded-full bg-[#D4AF37]/4 blur-[100px] pointer-events-none" />
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 size-[300px] rounded-full bg-emerald-900/5 blur-[80px] pointer-events-none" />

          {/* Top bar */}
          <div className={`w-full py-3 px-6 flex items-center justify-between border-b transition-colors relative z-10 ${
            theme === 'dark' ? 'border-[#1C2C22] bg-[#050807]/80 backdrop-blur-md' : 'border-[#DCD6CD] bg-white/80 backdrop-blur-md'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`size-9 rounded-xl flex items-center justify-center border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border-stone-200 text-[#D4AF37]'
              }`}>
                <Wallet className="size-4.5" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">MOMO PREMIUM</span>
            </div>
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`size-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-yellow-400' : 'bg-white border-[#DCD6CD] text-stone-700'
              }`}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10">
            <div className="text-center mb-14 max-w-xl">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest mb-6 ${
                theme === 'dark' ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-amber-300 bg-amber-50 text-amber-800'
              }`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D4AF37]"></span>
                </span>
                Bénin · Cotonou · Abomey-Calavi
              </div>
              <h1 className="font-serif text-5xl font-black tracking-tight leading-tight mb-4">
                La plateforme de gestion<br />
                <span className="text-[#D4AF37]">Mobile Money</span> au Bénin
              </h1>
              <p className={`text-sm leading-relaxed max-w-md mx-auto ${
                theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Gérez vos cabines physiques, coordonnez votre flotte de vendeurs motorisés, et suivez vos transactions en temps réel — depuis un seul espace sécurisé.
              </p>
            </div>

            {/* Role selector cards */}
            <div className="w-full max-w-4xl">
              <p className={`text-center text-[11px] uppercase tracking-widest font-bold mb-6 ${
                theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
              }`}>Je suis...</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Propriétaire */}
                <button
                  onClick={() => {
                    setRoleInput('proprio')
                    setAuthView('login')
                    setAppView('login')
                  }}
                  className={`group p-6 rounded-[32px] border text-left flex flex-col gap-4 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer relative overflow-hidden ${
                    theme === 'dark'
                      ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807] hover:border-[#D4AF37]/40'
                      : 'border-[#DCD6CD] bg-white hover:border-amber-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="absolute -right-6 -top-6 size-20 rounded-full bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 blur-xl transition-colors pointer-events-none" />
                  <div className={`size-12 rounded-2xl flex items-center justify-center text-2xl border ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                  }`}>
                    👑
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold mb-1">Propriétaire</h3>
                    <p className={`text-[11px] leading-relaxed ${
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-550'
                    }`}>
                      Gérez vos cabines physiques, vos gérants et suivez vos performances.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Accéder →</span>
                </button>

                {/* Gérant */}
                <button
                  onClick={() => {
                    setRoleInput('employe')
                    setAuthView('login')
                    setAppView('login')
                  }}
                  className={`group p-6 rounded-[32px] border text-left flex flex-col gap-4 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer relative overflow-hidden ${
                    theme === 'dark'
                      ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807] hover:border-emerald-700/40'
                      : 'border-[#DCD6CD] bg-white hover:border-emerald-400 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="absolute -right-6 -top-6 size-20 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 blur-xl transition-colors pointer-events-none" />
                  <div className={`size-12 rounded-2xl flex items-center justify-center text-2xl border ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                  }`}>
                    👤
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold mb-1">Gérant</h3>
                    <p className={`text-[11px] leading-relaxed ${
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-550'
                    }`}>
                      Accédez à votre cabine assignée et gérez les transactions quotidiennes.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Accéder →</span>
                </button>

                {/* VM Uniquement */}
                <button
                  onClick={() => {
                    setRoleInput('vm')
                    setAuthView('login')
                    setAppView('login')
                  }}
                  className={`group p-6 rounded-[32px] border text-left flex flex-col gap-4 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer relative overflow-hidden ${
                    theme === 'dark'
                      ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807] hover:border-blue-700/40'
                      : 'border-[#DCD6CD] bg-white hover:border-blue-400 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="absolute -right-6 -top-6 size-20 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 blur-xl transition-colors pointer-events-none" />
                  <div className={`size-12 rounded-2xl flex items-center justify-center text-2xl border ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                  }`}>
                    🛵
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold mb-1">VM Uniquement</h3>
                    <p className={`text-[11px] leading-relaxed ${
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-550'
                    }`}>
                      Gérez vos opérations de vente mobile sur le terrain individuellement.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Accéder →</span>
                </button>

                {/* VM & Propriétaire */}
                <button
                  onClick={() => {
                    setRoleInput('vm_hybrid')
                    setAuthView('login')
                    setAppView('login')
                  }}
                  className={`group p-6 rounded-[32px] border text-left flex flex-col gap-4 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer relative overflow-hidden ${
                    theme === 'dark'
                      ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807] hover:border-amber-700/40'
                      : 'border-[#DCD6CD] bg-white hover:border-amber-400 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="absolute -right-6 -top-6 size-20 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 blur-xl transition-colors pointer-events-none" />
                  <div className={`size-12 rounded-2xl flex items-center justify-center text-2xl border ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                  }`}>
                    🛵👑
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold mb-1">VM & Propriétaire</h3>
                    <p className={`text-[11px] leading-relaxed ${
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-550'
                    }`}>
                      Combinez la gestion de vos cabines physiques et vos opérations de vente mobile terrain.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Accéder →</span>
                </button>
              </div>

              {/* Dev bypass */}
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleBypass}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#0A0F0D] rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  🔑 Tester sans Connexion (Bypass)
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`py-6 text-center text-[10px] font-bold border-t relative z-10 ${
            theme === 'dark' ? 'border-[#1C2C22] text-stone-600' : 'border-[#DCD6CD] text-stone-400'
          }`}>
            MOMO PREMIUM · Cotonou, Bénin · Propulsé localement · v1.1.2
          </div>
        </div>
      )
    }

    // --- LOGIN PAGE ---
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans px-4 relative overflow-hidden ${
        theme === 'dark' ? 'bg-[#050807] text-[#E4EAD8]' : 'bg-[#FAF9F6] text-[#111614]'
      }`}>
        {/* Glow decorative spheres */}
        <div className="absolute -left-32 -bottom-32 size-96 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />

        <div className={`w-full max-w-md p-8 rounded-[40px] border shadow-2xl transition-all relative z-10 ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22]' 
            : 'bg-white border-[#DCD6CD]'
        }`}>
          {/* Back to landing */}
          <button
            onClick={() => { setAppView('landing'); setAuthError(''); setAuthSuccess(''); }}
            className={`flex items-center gap-1.5 text-[10px] font-bold mb-4 cursor-pointer transition-opacity hover:opacity-70 ${
              theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            ← Retour à l'accueil
          </button>

          <div className="flex flex-col items-center mb-6">
            <div className={`size-16 rounded-2xl flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-[#050807] border border-[#1C2C22] text-natural-accent' : 'bg-stone-50 border border-stone-200 text-natural-accent'
            }`}>
              <Wallet className="size-8" />
            </div>
            <h1 className="font-serif text-3xl font-black text-center tracking-tight">MOMO PREMIUM</h1>
            <p className="text-[10px] uppercase tracking-widest text-natural-accent font-extrabold -mt-1">
              {roleInput === 'proprio' ? '👑 Espace Propriétaire' : roleInput === 'employe' ? '👤 Espace Gérant' : roleInput === 'vm' ? '🛵 Espace VM Motorisé' : 'Luxury Cabin Suite'}
            </p>
          </div>

          <div className={`flex p-1 rounded-2xl border text-xs font-bold mb-6 ${
            theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-100 border-stone-200'
          }`}>
            <button
              onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                authView === 'login'
                  ? 'bg-natural-accent text-[#0A0F0D] shadow'
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setAuthView('register'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                authView === 'register'
                  ? 'bg-natural-accent text-[#0A0F0D] shadow'
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Créer un Compte
            </button>
          </div>

          {authError && (
            <div className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="p-3 mb-4 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              {authSuccess}
            </div>
          )}

          {authView === 'login' ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Adresse Email</label>
                <input
                  type="email"
                  required
                  placeholder="proprio@example.com ou gerant@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Mot de Passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                  }`}
                />
              </div>

              <Button variant="premium" type="submit" loading={loading} className="w-full mt-2 py-3.5 rounded-xl font-bold cursor-pointer">
                Se Connecter
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#1C2C22] dark:border-stone-850"></div>
                <span className="flex-shrink mx-4 text-stone-500 text-[10px] font-bold uppercase">Ou</span>
                <div className="flex-grow border-t border-[#1C2C22] dark:border-stone-850"></div>
              </div>

              <button
                type="button"
                onClick={handleBypass}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-[#0A0F0D] rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                🔑 Tester sans Connexion (Bypass)
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide font-mono">Type de Compte</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleInput('proprio')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      roleInput === 'proprio'
                        ? 'border-natural-accent bg-natural-accent/10 text-natural-accent'
                        : theme === 'dark' ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    👑 Proprio
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleInput('employe')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      roleInput === 'employe'
                        ? 'border-natural-accent bg-natural-accent/10 text-natural-accent'
                        : theme === 'dark' ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    👤 Gérant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleInput('vm')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      roleInput === 'vm'
                        ? 'border-natural-accent bg-natural-accent/10 text-natural-accent'
                        : theme === 'dark' ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    🛵 VM Uniquement
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleInput('vm_hybrid')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      roleInput === 'vm_hybrid'
                        ? 'border-natural-accent bg-natural-accent/10 text-natural-accent'
                        : theme === 'dark' ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    🛵👑 VM & Proprio
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean Gnonlonfoun"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Adresse Email</label>
                <input
                  type="email"
                  required
                  placeholder="votreemail@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Mot de Passe</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 caractères"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                  }`}
                />
              </div>

              {roleInput === 'employe' && (
                <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-natural-accent/20 bg-natural-accent/5">
                  <label className="text-[10px] font-bold text-natural-accent uppercase tracking-wide flex items-center gap-1">
                    <Lock className="size-3" /> Email de votre Propriétaire (Boss)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="boss@example.com"
                    value={bossEmailInput}
                    onChange={e => setBossEmailInput(e.target.value)}
                    className={`w-full p-2.5 border rounded-lg focus:outline-none text-xs ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                  <span className="text-[8px] text-stone-400">
                    Saisissez l'email exact avec lequel votre patron s'est inscrit afin d'associer votre compte à sa flotte.
                  </span>
                </div>
              )}

              <Button variant="premium" type="submit" loading={loading} className="w-full mt-2 py-3 rounded-xl font-bold cursor-pointer">
                Créer mon Compte
              </Button>
            </form>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                theme === 'dark' ? 'border-[#1C2C22] bg-[#0E1B15] text-[#D4AF37]' : 'border-[#DCD6CD] bg-white text-stone-700'
              }`}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />} Mode {theme === 'dark' ? 'Clair' : 'Sombre'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-550 font-sans ${
      theme === 'dark' ? 'bg-[#050807] text-[#E4EAD8]' : 'bg-[#FAF9F6] text-[#111614]'
    }`}>
      
      {/* Top Banner / Security active */}
      <div className={`w-full py-3 px-4 text-center text-xs font-bold tracking-wider flex flex-wrap items-center justify-center gap-2 border-b transition-colors ${
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
              <span className="text-[9px] block font-bold tracking-widest uppercase text-natural-accent -mt-1">
                {profile?.role === 'proprio' ? 'Espace Propriétaire' : `Cabine: ${cabins.find(c => c.id === activeCabinId)?.name || 'Gérant'}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cabin selector for Owner */}
            {profile?.role === 'proprio' && cabins.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Building className="size-3.5 text-natural-accent hidden sm:inline" />
                <select
                  value={activeCabinId || ''}
                  onChange={(e) => {
                    setActiveCabinId(e.target.value)
                    localStorage.setItem('momo_active_cabin_id', e.target.value)
                  }}
                  className={`p-1.5 rounded-xl border text-[10px] font-bold focus:outline-none transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-800'
                  }`}
                >
                  {cabins.map(cab => (
                    <option key={cab.id} value={cab.id}>{cab.name}</option>
                  ))}
                </select>
              </div>
            )}

            {role === 'proprio' && (
              <button
                onClick={handleSwitchToEmployee}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === 'dark' 
                    ? 'bg-rose-950/20 border-rose-900/30 text-rose-500 hover:bg-rose-950/40' 
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
                title="Verrouiller la session Propriétaire"
              >
                <Lock className="size-3" /> Verrouiller
              </button>
            )}

            {(role === 'vm_hybrid' || role === 'proprio') && !showHub && (
              <button
                onClick={() => setShowHub(true)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === 'dark' 
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-950/40' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                🏠 Menu Hub
              </button>
            )}

            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-colors hidden md:inline-block ${
              theme === 'dark' ? 'bg-[#0E1B15] text-emerald-400 border-[#1C2C22]' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {supabaseConnected ? `${profile?.name} 🟢` : 'Offline Safe 🌐'}
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

            <button 
              onClick={handleSignOut}
              className={`size-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-[#0E1B15] border-[#1C2C22] text-rose-400 hover:bg-[#1C2C22]' 
                  : 'bg-white border-[#DCD6CD] text-rose-600 hover:bg-stone-100'
              }`}
              title="Se Déconnecter"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-xl mx-auto px-4 pt-8 pb-24 md:pb-8 flex flex-col gap-6">
        {showHub && (role === 'vm_hybrid' || role === 'proprio') ? (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center mb-4">
              <h2 className="font-serif text-3xl font-black tracking-tight text-[#D4AF37]">Bienvenue dans votre Hub</h2>
              <p className="text-xs text-stone-500 uppercase tracking-widest font-bold mt-1">Sélectionnez l'espace de travail souhaité</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Option 1: Espace Propriétaire / Cabine Physique */}
              <button
                onClick={() => {
                  if (role === 'proprio') {
                    setActiveTab('proprietaire')
                  } else {
                    setActiveTab('caissier')
                  }
                  setShowHub(false)
                }}
                className={`p-6 rounded-[36px] border text-left flex flex-col justify-between h-44 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
                  theme === 'dark'
                    ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807] text-white hover:border-[#D4AF37]/50'
                    : 'border-[#DCD6CD] bg-white text-[#111614] hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="absolute -right-8 -top-8 size-24 rounded-full bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors blur-xl pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shadow ${
                    theme === 'dark' ? 'bg-[#050807] border border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border border-stone-200 text-[#D4AF37]'
                  }`}>
                    <Building className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">Espace Cabines & Administration</h3>
                    <p className="text-[10px] uppercase font-bold text-stone-500">Propriétaire / Cabine Momo physique</p>
                  </div>
                </div>
                <div>
                  <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                    Gérez vos cabines physiques, visualisez le solde global, affectez vos gérants, configurez vos coffres et gérez la blacklist.
                  </p>
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mt-2 block font-sans">Accéder à l'espace →</span>
                </div>
              </button>

              {/* Option 2: Espace Vendeur Motorisé (VM) */}
              <button
                onClick={() => {
                  setActiveTab('vm')
                  setShowHub(false)
                }}
                className={`p-6 rounded-[36px] border text-left flex flex-col justify-between h-44 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
                  theme === 'dark'
                    ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807] text-white hover:border-[#D4AF37]/50'
                    : 'border-[#DCD6CD] bg-white text-[#111614] hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="absolute -right-8 -top-8 size-24 rounded-full bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors blur-xl pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shadow ${
                    theme === 'dark' ? 'bg-[#050807] border border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border border-stone-200 text-[#D4AF37]'
                  }`}>
                    <Send className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">Espace Vendeur Motorisé (VM)</h3>
                    <p className="text-[10px] uppercase font-bold text-[#D4AF37]">Mode Terrain / Vente Mobile</p>
                  </div>
                </div>
                <div>
                  <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                    Suivez la flotte de vente mobile, gérez les transferts de fonds sur le terrain, enregistrez les dépôts et retraits des VM.
                  </p>
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mt-2 block font-sans">Accéder à l'espace →</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Espace Tabs Switcher (Desktop only) */}
        {role !== 'vm' && (
          <div className={`hidden md:flex p-1 rounded-2xl border text-xs font-bold transition-all ${
            theme === 'dark' ? 'bg-[#0A0F0D] border-[#1C2C22]' : 'bg-[#EFECE6] border-[#DCD6CD]'
          }`}>
            <button
              onClick={() => setActiveTab('caissier')}
              className={`flex-1 py-3 rounded-xl transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                activeTab === 'caissier' 
                  ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Espace Caissier 👤</span>
            </button>
            <button
              onClick={() => setActiveTab('vm')}
              className={`flex-1 py-3 rounded-xl transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                activeTab === 'vm' 
                  ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Espace VM (Vente Mobile) 🛵</span>
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
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Espace Propriétaire 👑</span>
              {role !== 'proprio' && <Lock className="size-3" />}
            </button>
          </div>
        )}

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
                    <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
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
                    Bilan Périodique ({formattedReportPeriodLabel})
                  </h3>
                  <p className="text-[9px] text-stone-500">
                    Cumul financier pour la période sélectionnée
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

            {/* Weekly activity chart Mockup */}
            <section className={`p-6 rounded-[32px] border transition-colors ${
              theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD]'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Activité Hebdomadaire</h3>
                  <p className="text-[9px] text-stone-500">Volume de vente de crédit & forfaits</p>
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

        {/* TAB 3: MON ESPACE VM (Vendeur Motorisé) */}
        {activeTab === 'vm' && (
          <div className="flex flex-col gap-6 mb-16 md:mb-0">

            {/* SETUP: Choix du réseau si pas encore défini */}
            {!vmOperator ? (
              <div className="flex flex-col items-center justify-center py-16 gap-8">
                <div className="text-center">
                  <p className="text-3xl mb-3">🛵</p>
                  <h2 className="font-serif text-2xl font-black tracking-tight mb-2">
                    Quel est ton réseau ?
                  </h2>
                  <p className={`text-xs leading-relaxed max-w-xs mx-auto ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Choisis le réseau mobile sur lequel tu travailles. Ce choix est définitif et ne peut pas être changé plus tard.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                  {([
                    { op: 'mtn', label: 'MTN Mobile Money', color: 'amber', emoji: '🟡', desc: 'Je suis agent MTN MoMo' },
                    { op: 'moov', label: 'Moov Money', color: 'blue', emoji: '🔵', desc: 'Je suis agent Moov Money' },
                    { op: 'celtiis', label: 'Celtiis Cash', color: 'emerald', emoji: '🟢', desc: 'Je suis agent Celtiis Cash' },
                  ] as const).map(item => (
                    <button
                      key={item.op}
                      onClick={() => {
                        const confirmed = confirm(`Confirmer : je suis VM ${item.label} ?`)
                        if (!confirmed) return
                        setVmOperator(item.op)
                        setVmOpInput(item.op)
                        localStorage.setItem('momo_vm_operator', item.op)
                        // Init balances pour ce seul réseau
                        const newVm = { mtn: 0, moov: 0, celtiis: 0, cash: 0 }
                        setVmBalances(newVm)
                        localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
                      }}
                      className={`p-5 rounded-[28px] border text-left flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        theme === 'dark'
                          ? `border-[#1C2C22] bg-[#0E1B15] hover:border-${item.color}-700/50`
                          : `border-[#DCD6CD] bg-white hover:border-${item.color}-400 shadow-sm`
                      }`}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div>
                        <div className={`font-serif font-bold text-sm ${
                          item.op === 'mtn' ? 'text-amber-500' : item.op === 'moov' ? 'text-blue-500' : 'text-emerald-500'
                        }`}>{item.label}</div>
                        <div className={`text-[10px] ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>

            {/* Collapsible Client Manager Section */}
            <section className={`p-5 rounded-[28px] border transition-all ${
              theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
            }`}>
              <button
                type="button"
                onClick={() => setShowClientManager(prev => !prev)}
                className="w-full flex justify-between items-center font-serif text-sm font-bold text-natural-accent uppercase tracking-wide cursor-pointer text-left"
              >
                <span className="flex items-center gap-2">
                  💼 Gérer mes Clients Entreprises ({vmClients.length})
                </span>
                <span>{showClientManager ? '▲ Masquer' : '▼ Afficher'}</span>
              </button>

              {showClientManager && (
                <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-stone-500/10">
                  {/* Form to add a client */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!newClientName.trim() || !newClientPhone.trim()) return
                      syncAddVmClient(newClientName, newClientPhone)
                      setNewClientName('')
                      setNewClientPhone('')
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Nom de l'entreprise (ex: SOGEMA SARL)"
                      value={newClientName}
                      onChange={e => setNewClientName(e.target.value)}
                      className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                        theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                      }`}
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Numéro MoMo (ex: 0122334455)"
                      value={newClientPhone}
                      onChange={e => setNewClientPhone(e.target.value)}
                      className={`w-full sm:w-44 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                        theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                      }`}
                    />
                    <Button variant="premium" type="submit" className="text-xs px-4 py-2.5 rounded-xl font-bold cursor-pointer shrink-0">
                      Enregistrer
                    </Button>
                  </form>

                  {/* Clients List */}
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {vmClients.length > 0 ? (
                      vmClients.map(client => (
                        <div key={client.id} className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                          theme === 'dark' ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                        }`}>
                          <div className="flex flex-col">
                            <span className="font-bold text-stone-200 dark:text-stone-300">{client.name}</span>
                            <span className="font-mono text-[10px] text-stone-500">{client.phone}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer l'entreprise "${client.name}" de vos contacts ?`)) {
                                syncDeleteVmClient(client.id)
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-[10px] text-stone-500 italic">Aucune entreprise enregistrée pour le moment.</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className={`p-6 rounded-[36px] border transition-all overflow-hidden relative ${
              theme === 'dark' 
                ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22] shadow-2xl' 
                : 'bg-gradient-to-b from-white to-[#F2EFE9] border-[#DCD6CD] shadow-md'
            }`}>
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 font-sans">Mon Solde Terrain</span>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border ${
                  vmOperator === 'mtn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : vmOperator === 'moov' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                }`}>
                  {vmOperator?.toUpperCase()} — {profile?.name || 'VM'}
                </span>
              </div>

              <div className="text-center py-4 mb-6 relative z-10">
                <p className={`text-[10px] uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                  Virtuel {vmOperator?.toUpperCase()} disponible
                </p>
                <h2 className={`text-4xl font-serif font-black tracking-tight ${
                  vmOperator === 'mtn' ? 'text-amber-500' : vmOperator === 'moov' ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  {vmOperator ? vmBalances[vmOperator].toLocaleString('fr-FR') : '0'} <span className="text-lg font-sans font-medium text-stone-500">FCFA</span>
                </h2>
                <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                  + <span className="font-bold text-purple-400">{vmBalances.cash.toLocaleString('fr-FR')} FCFA</span> en poche (especes)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className={`p-4 rounded-[20px] border ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
                }`}>
                  <span className={`block text-[9px] font-bold mb-1.5 uppercase ${
                    vmOperator === 'mtn' ? 'text-amber-500' : vmOperator === 'moov' ? 'text-blue-500' : 'text-emerald-500'
                  }`}>Virtuel {vmOperator?.toUpperCase()}</span>
                  <div className={`font-mono font-bold text-base ${
                    vmOperator === 'mtn' ? 'text-amber-500' : vmOperator === 'moov' ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    {vmOperator ? vmBalances[vmOperator].toLocaleString('fr-FR') : '0'} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                  </div>
                </div>
                <div className={`p-4 rounded-[20px] border ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
                }`}>
                  <span className="block text-[9px] font-bold text-purple-400 mb-1.5 uppercase">Cash en Poche</span>
                  <div className="font-mono font-bold text-base text-purple-400">
                    {vmBalances.cash.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Operations Terrain */}
            <section className="flex flex-col gap-3">
              <div className="px-1">
                <h3 className="text-sm font-bold font-serif uppercase text-natural-accent">Mes Opérations Terrain</h3>
                <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>Enregistre chaque transaction avec ton client</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setVmActionType('deposit')}
                  className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-32 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    vmActionType === 'deposit'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark'
                        ? 'border border-[#1C2C22] bg-[#0E1B15] text-white hover:bg-[#12241C]'
                        : 'border border-[#DCD6CD] bg-white text-[#111614] hover:bg-stone-50'
                  }`}
                >
                  <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${vmActionType === 'deposit' ? 'text-[#0A0F0D]' : 'text-natural-accent'}`}>
                    <ArrowDownLeft className="size-4.5 stroke-[3px]" />
                    Client - Envoi
                  </div>
                  <div>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${vmActionType === 'deposit' ? 'opacity-70' : 'text-stone-500'}`}>Client me donne du cash</div>
                    <div className={`text-[8px] mt-0.5 ${vmActionType === 'deposit' ? 'opacity-60' : 'text-stone-400'}`}>Je lui envoie le virtuel via mobile</div>
                  </div>
                </button>

                <button
                  onClick={() => setVmActionType('withdrawal')}
                  className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-32 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    vmActionType === 'withdrawal'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark'
                        ? 'border border-[#1C2C22] bg-[#0E1B15] text-white hover:bg-[#12241C]'
                        : 'border border-[#DCD6CD] bg-white text-[#111614] hover:bg-stone-50'
                  }`}
                >
                  <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${vmActionType === 'withdrawal' ? 'text-[#0A0F0D]' : 'text-rose-500'}`}>
                    <ArrowUpRight className="size-4.5 stroke-[3px]" />
                    Retrait - Client
                  </div>
                  <div>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${vmActionType === 'withdrawal' ? 'opacity-70' : 'text-stone-500'}`}>Client veut du cash</div>
                    <div className={`text-[8px] mt-0.5 ${vmActionType === 'withdrawal' ? 'opacity-60' : 'text-stone-400'}`}>Je prends son virtuel, lui donne l'espèce</div>
                  </div>
                </button>
              </div>

              {vmActionType && (
                <form onSubmit={handleVmTransaction} className={`p-5 rounded-[28px] border flex flex-col gap-4 mt-1 ${
                  theme === 'dark' ? 'bg-[#0E1B15]/60 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
                }`}>

                  {/* Select Enterprise (Registered Clients) */}
                  {vmClients.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Sélectionner Entreprise Cliente</label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => {
                          const cid = e.target.value
                          setSelectedClientId(cid)
                          if (cid === '') {
                            setPhoneInput('')
                            setClientNameInput('')
                            setSaveClientCheckbox(false)
                          } else {
                            const found = vmClients.find(c => c.id === cid)
                            if (found) {
                              setPhoneInput(found.phone)
                              setClientNameInput(found.name)
                            }
                          }
                        }}
                        className={`p-3 border rounded-xl focus:outline-none text-xs ${
                          theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                        }`}
                      >
                        <option value="">-- Saisir manuellement (Aucune) --</option>
                        {vmClients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Tel Client</label>
                      {/* Check if phone matches any registered client */}
                      {(() => {
                        const matched = vmClients.find(c => c.phone.trim() === phoneInput.trim())
                        if (matched && selectedClientId === '') {
                          return (
                            <span className="text-[9px] font-bold text-natural-accent bg-natural-accent/10 px-2 py-0.5 rounded border border-natural-accent/20 animate-pulse">
                              🏢 Reconnue : {matched.name}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 0196887722"
                      value={phoneInput}
                      onChange={e => {
                        const val = e.target.value
                        setPhoneInput(val)
                        // If it matches a client, set the clientNameInput
                        const found = vmClients.find(c => c.phone.trim() === val.trim())
                        if (found) {
                          setClientNameInput(found.name)
                        } else if (selectedClientId === '') {
                          setClientNameInput('')
                        }
                      }}
                      disabled={selectedClientId !== ''}
                      className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                        selectedClientId !== '' ? 'opacity-60 cursor-not-allowed ' : ''
                      }${
                        theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                      }`}
                    />
                  </div>

                  {/* Client Name Input for unregistered clients */}
                  {selectedClientId === '' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Nom de l'Entreprise (Optionnel)</label>
                      <input
                        type="text"
                        placeholder="Ex: SOGEMA SARL"
                        value={clientNameInput}
                        onChange={e => setClientNameInput(e.target.value)}
                        className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                          theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                        }`}
                      />
                      {clientNameInput.trim() !== '' && !vmClients.some(c => c.phone.trim() === phoneInput.trim()) && (
                        <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveClientCheckbox}
                            onChange={e => setSaveClientCheckbox(e.target.checked)}
                            className="rounded accent-natural-accent"
                          />
                          <span className="text-[9px] text-stone-400">Enregistrer cette entreprise dans mes contacts</span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Montant (FCFA)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 25000"
                      value={vmAmountInput}
                      onChange={e => setVmAmountInput(e.target.value)}
                      className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                        theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                      }`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="premium" type="submit" loading={loading} className="flex-1 cursor-pointer font-bold py-3.5">
                      Confirmer
                    </Button>
                    <button
                      type="button"
                      onClick={() => setVmActionType(null)}
                      className={`px-5 rounded-xl border font-bold text-xs cursor-pointer ${
                        theme === 'dark' ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Point Agence */}
            <section className={`p-6 rounded-[32px] border transition-colors ${
              theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
            }`}>
              <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-1">
                <Building className="size-4.5" />
                Point Agence
              </h3>
              <p className={`text-[10px] mb-5 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                À l'agence : remets tes espèces collectées et recharge ton virtuel pour continuer à servir tes clients
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const montant = prompt("Espèces à remettre à l'agence (FCFA) :")
                    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) return
                    const amt = Number(montant)
                    if (amt > vmBalances.cash) { alert("Montant supérieur à ton cash disponible !"); return }
                    const newVm = { ...vmBalances, cash: vmBalances.cash - amt }
                    setVmBalances(newVm)
                    localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
                    alert(`OK: ${amt.toLocaleString('fr-FR')} FCFA remis à l'agence.`)
                  }}
                  className={`p-4 rounded-[24px] border text-left flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    theme === 'dark' ? 'border-[#1C2C22] bg-[#050807]/60 hover:border-rose-900/40' : 'border-[#DCD6CD] bg-stone-50 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-rose-500">
                    <ArrowUpRight className="size-4 stroke-[2.5px]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Remettre Espèces</span>
                  </div>
                  <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Déposer le cash collecté sur le terrain
                  </p>
                  <span className="font-mono font-bold text-xs text-purple-400">{vmBalances.cash.toLocaleString('fr-FR')} FCFA dispo</span>
                </button>

                <button
                  onClick={() => {
                    const op = vmOperator
                    if (!op) { alert("Veuillez d'abord configurer votre réseau."); return }
                    const montant = prompt(`Montant de virtuel ${op.toUpperCase()} reçu de l'agence (FCFA) :`)
                    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) return
                    const amt = Number(montant)
                    const newVm = { ...vmBalances, [op]: (vmBalances as any)[op] + amt }
                    setVmBalances(newVm)
                    localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
                    alert(`OK: +${amt.toLocaleString('fr-FR')} FCFA virtuel ${op.toUpperCase()} rechargé !`)
                  }}
                  className={`p-4 rounded-[24px] border text-left flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    theme === 'dark' ? 'border-[#1C2C22] bg-[#050807]/60 hover:border-emerald-900/40' : 'border-[#DCD6CD] bg-stone-50 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-500">
                    <ArrowDownLeft className="size-4 stroke-[2.5px]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Recevoir Virtuel</span>
                  </div>
                  <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Recharger mon solde virtuel auprès de l'agence
                  </p>
                  <span className="font-mono font-bold text-xs text-natural-accent">{(vmBalances.mtn + vmBalances.moov + vmBalances.celtiis).toLocaleString('fr-FR')} FCFA actuel</span>
                </button>
              </div>

              {/* Bilan journee */}
              <div className={`mt-4 p-4 rounded-2xl border flex flex-col gap-2 ${
                theme === 'dark' ? 'bg-[#050807]/40 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
              }`}>
                <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Bilan de ma journée</p>
                <div className="flex justify-between text-xs">
                  <span className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>Cash reçu (envois clients)</span>
                  <span className="font-mono font-bold text-natural-accent">
                    +{transactions.filter(t => t.category.startsWith('Vente Mobile') && t.type === 'deposit' && t.date === TODAY_STR).reduce((a, t) => a + t.amount, 0).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>Cash donné (retraits clients)</span>
                  <span className="font-mono font-bold text-rose-400">
                    -{transactions.filter(t => t.category.startsWith('Vente Mobile') && t.type === 'withdrawal' && t.date === TODAY_STR).reduce((a, t) => a + t.amount, 0).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </section>

            {/* Journal du Jour */}
            <section className="flex flex-col gap-3">
              <div className="px-1">
                <h3 className="text-sm font-bold font-serif uppercase text-natural-accent">Mon Journal du Jour</h3>
                <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>Toutes mes opérations enregistrées aujourd'hui</p>
              </div>
              <div className="flex flex-col gap-3">
                {transactions.filter(t => t.category.startsWith('Vente Mobile') && t.date === TODAY_STR).length > 0 ? (
                  transactions
                    .filter(t => t.category.startsWith('Vente Mobile') && t.date === TODAY_STR)
                    .map(txn => (
                      <div key={txn.id} className={`p-4 rounded-2xl border flex justify-between items-center ${
                        theme === 'dark' ? 'border-[#1C2C22] bg-[#0E1B15]/20' : 'border-[#DCD6CD] bg-white'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            txn.type === 'deposit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {txn.type === 'deposit' ? 'ENVOI' : 'RETRAIT'}
                          </span>
                          {renderOperatorBadge(txn.operator)}
                          <span className="text-[10px] font-mono text-stone-500">
                            {txn.clientName ? `${txn.clientName} (${txn.phone})` : txn.phone} - {txn.time}
                          </span>
                        </div>
                        <div className={`font-mono font-bold text-xs ${txn.type === 'deposit' ? 'text-natural-accent' : 'text-rose-400'}`}>
                          {txn.type === 'deposit' ? '+' : '-'}{txn.amount.toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>
                    ))
                ) : (
                  <div className={`text-center py-10 rounded-2xl border ${
                    theme === 'dark' ? 'border-[#1C2C22] bg-[#0E1B15]/10 text-stone-500' : 'border-stone-200 bg-stone-50 text-stone-400'
                  } text-xs`}>
                    <p className="text-2xl mb-2">{'\u{1F6F5}'}</p>
                    <p className="font-bold">Aucune opération enregistrée aujourd'hui</p>
                    <p className="text-[10px] mt-1 opacity-60">Utilise les boutons ci-dessus pour enregistrer tes transactions</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    )}


        {/* TAB 2: PROPRIÉTAIRE / CONFIG */}
        {activeTab === 'proprietaire' && role === 'proprio' && (
          <div className="flex flex-col gap-6">

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
                        <span className="text-[9px] text-stone-500 font-mono block">{emp.email}</span>
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
        )}
          </>
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
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">SIM à approvisionner</label>
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

      {/* Mobile Bottom Navigation Bar */}
      {role !== 'vm' && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-md transition-colors duration-550 ${
          theme === 'dark' 
            ? 'bg-[#050807]/90 border-[#1C2C22] text-[#E4EAD8]' 
            : 'bg-[#FAF9F6]/90 border-[#DCD6CD] text-[#111614]'
        }`}>
          <div className="flex h-16 items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap px-4 py-2">
            <button
              onClick={() => setActiveTab('caissier')}
              className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[110px] h-full gap-0.5 relative rounded-xl transition-all cursor-pointer ${
                activeTab === 'caissier'
                  ? 'text-natural-accent'
                  : 'text-stone-500 hover:text-stone-400'
              }`}
            >
              {activeTab === 'caissier' && (
                <motion.div
                  layoutId="activeTabMobileIndicator"
                  className="absolute inset-0 bg-natural-accent/10 dark:bg-natural-accent/15 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Wallet className="size-4.5 relative z-10" />
              <span className="text-[9px] uppercase tracking-wider font-bold relative z-10">Caisse</span>
            </button>
            
            <button
              onClick={() => setActiveTab('vm')}
              className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[110px] h-full gap-0.5 relative rounded-xl transition-all cursor-pointer ${
                activeTab === 'vm'
                  ? 'text-natural-accent'
                  : 'text-stone-500 hover:text-stone-400'
              }`}
            >
              {activeTab === 'vm' && (
                <motion.div
                  layoutId="activeTabMobileIndicator"
                  className="absolute inset-0 bg-natural-accent/10 dark:bg-natural-accent/15 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Send className="size-4.5 relative z-10" />
              <span className="text-[9px] uppercase tracking-wider font-sans font-bold relative z-10">Flotte VM</span>
            </button>
            
            <button
              onClick={() => {
                if (role === 'proprio') {
                  setActiveTab('proprietaire')
                } else {
                  setShowPinModal(true)
                }
              }}
              className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[110px] h-full gap-0.5 relative rounded-xl transition-all cursor-pointer ${
                activeTab === 'proprietaire'
                  ? 'text-natural-accent'
                  : 'text-stone-500 hover:text-stone-400'
              }`}
            >
              {activeTab === 'proprietaire' && (
                <motion.div
                  layoutId="activeTabMobileIndicator"
                  className="absolute inset-0 bg-natural-accent/10 dark:bg-natural-accent/15 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <Building className="size-4.5" />
                {role !== 'proprio' && (
                  <Lock className="size-2.5 absolute -top-1 -right-1 text-natural-accent" />
                )}
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold relative z-10">Proprio</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
