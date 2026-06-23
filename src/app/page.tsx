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

import { Transaction, VmClient, CabinNote, Debt } from '../types'
import { DashboardCaissier } from '../components/dashboard-caissier'
import { DashboardVm } from '../components/dashboard-vm'
import { DashboardProprio } from '../components/dashboard-proprio'
import { CarnetDeBord } from '../components/carnet-de-bord'
import { SaisieRapide } from '../components/saisie-rapide'
import { DettesRappels } from '../components/dettes-rappels'


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
    id: 'VM-demo-1',
    phone: '0199887766',
    operator: 'mtn',
    type: 'deposit',
    amount: 150000,
    time: '09:15',
    date: TODAY_STR,
    category: 'Vente Mobile VM (Cash)',
    clientName: 'Cabine Agla'
  },
  {
    id: 'VM-demo-2',
    phone: '0177665544',
    operator: 'mtn',
    type: 'withdrawal',
    amount: 100000,
    time: '10:00',
    date: TODAY_STR,
    category: 'Vente Mobile VM (Retrait)',
    clientName: 'Cabine Gbégamey'
  },
  {
    id: 'VM-demo-3',
    phone: '0199887766',
    operator: 'mtn',
    type: 'deposit',
    amount: 50000,
    time: '11:30',
    date: TODAY_STR,
    category: 'Vente Mobile VM (Crédit Dehors)',
    clientName: 'SOGEMA SARL'
  },
  {
    id: 'VM-demo-4',
    phone: 'AGENCE',
    operator: 'mtn',
    type: 'withdrawal', // Cash leaving pocket
    amount: 200000,
    time: '14:20',
    date: TODAY_STR,
    category: 'Vente Mobile (Échange Cash ➔ Virtuel MTN)',
    clientName: 'AGENCE ROTATION'
  },
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
    mtn: 400000,
    moov: 0,
    celtiis: 0,
    cash: 350000
  })
  const [vmOperator, setVmOperator] = useState<'mtn' | 'moov' | 'celtiis' | null>('mtn') // Le reseau du VM (un seul)
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

  // Carnet de Bord (free-text journal)
  const [cabinNotes, setCabinNotes] = useState<CabinNote[]>([])

  // Dettes & Rappels (debts and reminders)
  const [debts, setDebts] = useState<Debt[]>([])

  // Transaction Addition Modal State
  const [actionType, setActionType] = useState<'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'adjust_ext' | null>(null)
  const [opInput, setOpInput] = useState<'mtn' | 'moov' | 'celtiis'>('mtn')
  const [phoneInput, setPhoneInput] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [selectedForfait, setSelectedForfait] = useState('')
  const [noteInput, setNoteInput] = useState('')
  
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
    // Register or unregister Service Worker depending on environment
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('ServiceWorker registered:', reg.scope),
          (err) => console.error('ServiceWorker registration failed:', err)
        );
      } else {
        // Unregister existing service workers in development to prevent HMR reload loops
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Unregistered active service worker in development mode.');
              }
            });
          }
        });
        // Clear caches in development to prevent cache poisoning loops
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.keys().then((names) => {
            for (let name of names) {
              caches.delete(name).then(() => {
                console.log('Cleared service worker cache:', name);
              });
            }
          });
        }
      }
    }

    const client = getSupabase()
    setSupabaseConnected(!!client)

    if (!client) {
      setAuthLoading(false)
      loadFromLocalStorage()
      return
    }

    // Get initial session with a timeout fallback
    let authTimeout = setTimeout(() => {
      console.warn("Supabase auth session timeout. Falling back to local storage.");
      setAuthLoading(false);
      loadFromLocalStorage();
    }, 2000);

    client.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(authTimeout);
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setAuthLoading(false);
        loadFromLocalStorage();
      }
    }).catch((err) => {
      clearTimeout(authTimeout);
      console.error("Supabase getSession error:", err);
      setAuthLoading(false);
      loadFromLocalStorage();
    });

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
          setActiveTab('caissier')
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
          const zeroBalances = { mtn: 0, moov: 0, celtiis: 0, cash: 0 }
          await client.from('momo_balances').insert({ cabin_id: activeCabinId, ...zeroBalances })
          setBalances(zeroBalances)
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
          const zeroCoffres = { mtn: 0, moov: 0, celtiis: 0, cash: 0 }
          await client.from('momo_coffres').insert({ cabin_id: activeCabinId, ...zeroCoffres })
          setCoffres(zeroCoffres)
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
        } else {
          setTransactions([])
        }

        // Fetch VM Clients
        fetchVmClients(activeCabinId)

        // Fetch Debts
        const { data: debtsData } = await client
          .from('momo_debts')
          .select('*')
          .eq('cabin_id', activeCabinId)
          .order('created_at', { ascending: false })
        if (debtsData) {
          setDebts(debtsData.map(d => ({
            id: d.id,
            cabin_id: d.cabin_id,
            client_name: d.client_name,
            amount: Number(d.amount),
            due_date: d.due_date || undefined,
            phone: d.phone || undefined,
            status: d.status,
            type: d.type,
            operator: d.operator || undefined,
            created_at: d.created_at
          })))
        } else {
          setDebts([])
        }
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
    if (storedVmBalances) {
      setVmBalances(JSON.parse(storedVmBalances))
    } else {
      const demoBalances = { mtn: 400000, moov: 0, celtiis: 0, cash: 350000 }
      setVmBalances(demoBalances)
      localStorage.setItem('momo_vm_balances', JSON.stringify(demoBalances))
    }

    const storedVmClients = localStorage.getItem('momo_vm_clients')
    if (storedVmClients) {
      setVmClients(JSON.parse(storedVmClients))
    } else {
      const demoClients: VmClient[] = [
        { id: 'c1', cabin_id: 'default', name: 'SOGEMA SARL', phone: '0199887766' },
        { id: 'c2', cabin_id: 'default', name: 'Cabine Agla', phone: '0196887722' },
        { id: 'c3', cabin_id: 'default', name: 'Cabine Gbégamey', phone: '0177665544' }
      ]
      setVmClients(demoClients)
      localStorage.setItem('momo_vm_clients', JSON.stringify(demoClients))
    }

    const storedVmOperator = localStorage.getItem('momo_vm_operator') as 'mtn' | 'moov' | 'celtiis' | null
    if (storedVmOperator) {
      setVmOperator(storedVmOperator)
      setVmOpInput(storedVmOperator)
    } else {
      setVmOperator('mtn')
      setVmOpInput('mtn')
      localStorage.setItem('momo_vm_operator', 'mtn')
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

    const storedCabinNotes = localStorage.getItem('momo_cabin_notes')
    if (storedCabinNotes) setCabinNotes(JSON.parse(storedCabinNotes))

    const storedDebts = localStorage.getItem('momo_debts')
    if (storedDebts) setDebts(JSON.parse(storedDebts))
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
        const stored = localStorage.getItem('momo_vm_clients')
        if (stored) setVmClients(JSON.parse(stored))
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

    // Automatic balance adjustment for caissier transactions
    const isVm = txn.id.startsWith('VM-') || 
                 txn.id.startsWith('agency-swap-') || 
                 txn.category.includes('Vente Mobile') || 
                 txn.category.includes('Point Agence') || 
                 txn.clientName === 'AGENCE ROTATION';

    if (!isVm) {
      let nextBalances = { ...balances }
      const amount = txn.amount
      const op = txn.operator

      if (txn.type === 'deposit' || txn.type === 'credit' || txn.type === 'forfait') {
        nextBalances = {
          ...balances,
          cash: balances.cash + amount,
          [op]: balances[op] - amount
        }
      } else if (txn.type === 'withdrawal') {
        nextBalances = {
          ...balances,
          cash: balances.cash - amount,
          [op]: balances[op] + amount
        }
      } else if (txn.type === 'appro_sim') {
        const isDebit = txn.category.includes('Débit') || txn.category.includes('Retrait')
        const multiplier = isDebit ? -1 : 1
        nextBalances = {
          ...balances,
          [op]: balances[op] + (amount * multiplier)
        }
      } else if (txn.type === 'ajust_cash') {
        const isInjection = txn.category.includes('Injection') || txn.category.includes('Apport')
        const multiplier = isInjection ? 1 : -1
        nextBalances = {
          ...balances,
          cash: balances.cash + (amount * multiplier)
        }
      }

      await syncBalances(nextBalances)
    }

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
          client_name: txn.clientName,
          note: txn.note ?? null
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

  // ─── Carnet de Bord ───────────────────────────────────────────────────────
  const syncAddCabinNote = (text: string) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const newNote: CabinNote = {
      id: `NOTE-${Date.now()}`,
      text,
      date: getLocalDateString(),
      time: timeStr,
      author: role,
    }
    setCabinNotes(prev => {
      const updated = [...prev, newNote]
      localStorage.setItem('momo_cabin_notes', JSON.stringify(updated))
      return updated
    })
    // Supabase (best-effort, no await to keep it instant)
    const client = getSupabase()
    if (client && activeCabinId) {
      client.from('momo_cabin_notes').insert([{
        id: newNote.id,
        cabin_id: activeCabinId,
        text: newNote.text,
        date: newNote.date,
        time: newNote.time,
        author: newNote.author,
      }]).then(({ error }) => {
        if (error) console.error('Supabase cabin note insert error:', error)
      })
    }
  }

  const syncDeleteCabinNote = (id: string) => {
    setCabinNotes(prev => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem('momo_cabin_notes', JSON.stringify(updated))
      return updated
    })
    const client = getSupabase()
    if (client) {
      client.from('momo_cabin_notes').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase cabin note delete error:', error)
      })
    }
  }

  // ─── Dettes & Rappels ─────────────────────────────────────────────────────
  const syncAddDebt = async (debtData: Omit<Debt, 'id' | 'cabin_id'>) => {
    if (!activeCabinId) return
    const newDebt: Debt = {
      id: `DEBT-${Date.now()}`,
      cabin_id: activeCabinId,
      ...debtData
    }

    setDebts(prev => {
      const updated = [newDebt, ...prev]
      localStorage.setItem('momo_debts', JSON.stringify(updated))
      return updated
    })

    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_debts').insert([{
          id: newDebt.id,
          cabin_id: activeCabinId,
          client_name: newDebt.client_name,
          amount: newDebt.amount,
          due_date: newDebt.due_date || null,
          phone: newDebt.phone || null,
          status: newDebt.status,
          type: newDebt.type,
          operator: newDebt.operator || null
        }])
      } catch (e) {
        console.error("Supabase sync add debt error:", e)
      }
    }
  }

  const syncSettleDebt = async (id: string) => {
    const debt = debts.find(d => d.id === id)
    if (!debt) return

    // 1. Update status locally
    const updatedDebts = debts.map(d => d.id === id ? { ...d, status: 'paye' as const } : d)
    setDebts(updatedDebts)
    localStorage.setItem('momo_debts', JSON.stringify(updatedDebts))

    // 2. Perform Cash / SIM balance adjustment if it is a proprietor/booth transfer
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const todayDateStr = getLocalDateString()

    if (debt.type === 'transfert_proprio_cash') {
      const isApport = debt.client_name.includes('APPORT')
      const newTxn: Transaction = {
        id: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: 'SYSTEM',
        operator: 'mtn', // default fallback operator for cash adjustments
        type: 'ajust_cash',
        amount: debt.amount,
        time: timeStr,
        date: todayDateStr,
        category: isApport ? 'Injection Cash' : 'Retrait Cash (Dépense/Banque)',
        note: `Règlement transfert : ${debt.client_name}`
      }
      await syncAddTransaction(newTxn)
    } else if (debt.type === 'transfert_proprio_sim' && debt.operator) {
      const isAppro = debt.client_name.includes('APPRO')
      const newTxn: Transaction = {
        id: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: 'SYSTEM',
        operator: debt.operator,
        type: 'appro_sim',
        amount: debt.amount,
        time: timeStr,
        date: todayDateStr,
        category: isAppro ? 'Approvisionnement SIM' : 'Ajustement SIM (Débit)',
        note: `Règlement transfert : ${debt.client_name}`
      }
      await syncAddTransaction(newTxn)
    }

    // 3. Sync status to Supabase
    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_debts').update({ status: 'paye' }).eq('id', id)
      } catch (e) {
        console.error("Supabase sync settle debt error:", e)
      }
    }
  }

  const syncDeleteDebt = async (id: string) => {
    if (role !== 'proprio') {
      alert("Action non autorisée : Seul le propriétaire peut supprimer définitivement des dettes.")
      return
    }
    if (!confirm("Supprimer définitivement ce rappel/dette de l'historique ?")) return

    setDebts(prev => {
      const updated = prev.filter(d => d.id !== id)
      localStorage.setItem('momo_debts', JSON.stringify(updated))
      return updated
    })

    const client = getSupabase()
    if (client) {
      try {
        await client.from('momo_debts').delete().eq('id', id)
      } catch (e) {
        console.error("Supabase sync delete debt error:", e)
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
    // Nettoyage de localStorage
    localStorage.removeItem('momo_role')
    localStorage.removeItem('momo_bypass_name')
    localStorage.removeItem('momo_active_cabin_id')
    localStorage.removeItem('momo_balances')
    localStorage.removeItem('momo_coffres')
    localStorage.removeItem('momo_transactions')
    localStorage.removeItem('momo_vm_balances')
    localStorage.removeItem('momo_vm_clients')
    localStorage.removeItem('momo_vm_runners')
    localStorage.removeItem('momo_pin')
    localStorage.removeItem('momo_blacklist')
    localStorage.removeItem('momo_vm_operator')
    
    // Réinitialisation des états à zéro
    setBalances({ mtn: 0, moov: 0, celtiis: 0, cash: 0 })
    setCoffres({ mtn: 0, moov: 0, celtiis: 0, cash: 0 })
    setTransactions([])
    setVmBalances({ mtn: 0, moov: 0, celtiis: 0, cash: 0 })
    setVmClients([])
    setCabins([])
    setActiveCabinId(null)
    setProfile(null)
    setSession(null)
    setAppView('landing')
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
    } else {
      const stored = localStorage.getItem('momo_balances')
      if (stored) setBalances(JSON.parse(stored))
    }

    if (!localStorage.getItem('momo_coffres')) {
      const demoCoffres = { mtn: 250000, moov: 150000, celtiis: 100000, cash: 200000 }
      setCoffres(demoCoffres)
      localStorage.setItem('momo_coffres', JSON.stringify(demoCoffres))
    } else {
      const stored = localStorage.getItem('momo_coffres')
      if (stored) setCoffres(JSON.parse(stored))
    }

    if (!localStorage.getItem('momo_vm_balances')) {
      const demoVmBalances = { mtn: 120000, moov: 80000, celtiis: 45000, cash: 60000 }
      setVmBalances(demoVmBalances)
      localStorage.setItem('momo_vm_balances', JSON.stringify(demoVmBalances))
    } else {
      const stored = localStorage.getItem('momo_vm_balances')
      if (stored) setVmBalances(JSON.parse(stored))
    }

    if (!localStorage.getItem('momo_transactions')) {
      setTransactions(INITIAL_TRANSACTIONS)
      localStorage.setItem('momo_transactions', JSON.stringify(INITIAL_TRANSACTIONS))
    } else {
      const stored = localStorage.getItem('momo_transactions')
      if (stored) setTransactions(JSON.parse(stored))
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
      if (vmBalances[op] < amount) {
        alert(`Solde virtuel ${op.toUpperCase()} insuffisant sur votre SIM (${vmBalances[op].toLocaleString('fr-FR')} FCFA) pour effectuer ce transfert !`);
        return;
      }
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

    const newTxn: Transaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: phoneInput,
      operator: opInput,
      type: actionType!,
      amount,
      time: timeStr,
      date: todayDateStr,
      category: actionType === 'forfait' ? selectedForfait : (actionType === 'credit' ? 'Vente de Crédit' : (actionType === 'deposit' ? 'Dépôt client' : 'Retrait client')),
      isScamReported: false,
      note: noteInput.trim() || undefined
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
    setNoteInput('')
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
        {role !== 'vm' && role !== 'employe' && (
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

        {role === 'employe' && (
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
              onClick={() => setShowPinModal(true)}
              className={`flex-1 py-3 rounded-xl transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                activeTab === 'proprietaire' 
                  ? 'bg-natural-accent text-[#0A0F0D] shadow-md' 
                  : theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Espace Propriétaire 👑</span>
              <Lock className="size-3" />
            </button>
          </div>
        )}

        {/* TAB 1: CAISSIER / OPERATIONS */}
        {activeTab === 'caissier' && (
          <DashboardCaissier
            theme={theme}
            balances={balances}
            transactions={transactions}
            blacklist={blacklist}
            role={role}
            activeTab={activeTab}
            syncAddTransaction={syncAddTransaction}
            syncToggleScamReport={syncToggleScamReport}
            setActionType={setActionType}
            setOpInput={setOpInput}
            setSelectedForfait={setSelectedForfait}
            setActiveReceipt={setActiveReceipt}
            renderOperatorBadge={renderOperatorBadge}
          />
        )}

        {/* Carnet de Bord — espace caissier */}
        {activeTab === 'caissier' && (
          <CarnetDeBord
            theme={theme}
            role={role}
            notes={cabinNotes}
            onAddNote={syncAddCabinNote}
            onDeleteNote={syncDeleteCabinNote}
          />
        )}

        {/* Dettes & Rappels — espace caissier */}
        {activeTab === 'caissier' && (
          <DettesRappels
            theme={theme}
            role={role}
            debts={debts}
            onAddDebt={syncAddDebt}
            onSettleDebt={syncSettleDebt}
            onDeleteDebt={syncDeleteDebt}
          />
        )}


        {/* TAB 3: MON ESPACE VM (Vendeur Motorisé) */}
        {activeTab === 'vm' && (
          <DashboardVm
            theme={theme}
            profile={profile}
            role={role}
            vmBalances={vmBalances}
            setVmBalances={setVmBalances}
            transactions={transactions}
            TODAY_STR={TODAY_STR}
            vmOperator={vmOperator}
            setVmOperator={setVmOperator}
            vmClients={vmClients}
            syncAddVmClient={syncAddVmClient}
            syncDeleteVmClient={syncDeleteVmClient}
            syncAddTransaction={syncAddTransaction}
            getLocalDateString={getLocalDateString}
            renderOperatorBadge={renderOperatorBadge}
          />
        )}

        {/* TAB 2: PROPRIÉTAIRE / CONFIG */}
        {activeTab === 'proprietaire' && role === 'proprio' && (
          <DashboardProprio
            theme={theme}
            role={role}
            balances={balances}
            syncAddTransaction={syncAddTransaction}
            syncToggleScamReport={syncToggleScamReport}
            setOpInput={setOpInput}
            setSelectedForfait={setSelectedForfait}
            setActiveReceipt={setActiveReceipt}
            cabins={cabins}
            activeCabinId={activeCabinId}
            newCabinName={newCabinName}
            setNewCabinName={setNewCabinName}
            handleCreateCabin={handleCreateCabin}
            creatingCabin={creatingCabin}
            allEmployees={allEmployees}
            handleAssignCabin={handleAssignCabin}
            coffres={coffres}
            setCoffreMtn={setCoffreMtn}
            setCoffreMoov={setCoffreMoov}
            setCoffreCeltiis={setCoffreCeltiis}
            setCoffreCash={setCoffreCash}
            setShowCoffreModal={setShowCoffreModal}
            setActionType={setActionType}
            blacklist={blacklist}
            setShowBlacklistModal={setShowBlacklistModal}
            transactions={transactions}
            deleteTransaction={deleteTransaction}
            renderOperatorBadge={renderOperatorBadge}
            syncBalances={syncBalances}
            setTransactions={setTransactions}
            setActiveTab={setActiveTab}
            TODAY_STR={TODAY_STR}
            YESTERDAY_STR={YESTERDAY_STR}
            getWeekRange={getWeekRange}
            getLocalDateString={getLocalDateString}
            getYesterdayDateString={getYesterdayDateString}
          />
        )}

        {/* Saisie Rapide + Carnet de Bord — espace proprio */}
        {activeTab === 'proprietaire' && role === 'proprio' && (
          <>
            <SaisieRapide
              theme={theme}
              getLocalDateString={getLocalDateString}
              onAdd={syncAddTransaction}
            />
            <CarnetDeBord
              theme={theme}
              role={role}
              notes={cabinNotes}
              onAddNote={syncAddCabinNote}
              onDeleteNote={syncDeleteCabinNote}
            />
            <DettesRappels
              theme={theme}
              role={role}
              debts={debts}
              onAddDebt={syncAddDebt}
              onSettleDebt={syncSettleDebt}
              onDeleteDebt={syncDeleteDebt}
            />
          </>
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
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[90vh] border ${
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

                {/* Note / Observation (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="size-3" /> Note / Observation
                    <span className="normal-case text-[9px] font-normal text-stone-500">(optionnel)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Client habituel, billet suspect, remarque..."
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm resize-none ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600' : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
                    }`}
                  />
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
      {role !== 'vm' && role !== 'employe' && (
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

      {role === 'employe' && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-md transition-colors duration-550 ${
          theme === 'dark' 
            ? 'bg-[#050807]/90 border-[#1C2C22] text-[#E4EAD8]' 
            : 'bg-[#FAF9F6]/90 border-[#DCD6CD] text-[#111614]'
        }`}>
          <div className="flex h-16 items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap px-4 py-2 justify-around">
            <button
              onClick={() => setActiveTab('caissier')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative rounded-xl transition-all cursor-pointer ${
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
              onClick={() => setShowPinModal(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative rounded-xl transition-all cursor-pointer ${
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
                <Lock className="size-2.5 absolute -top-1 -right-1 text-natural-accent" />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold relative z-10">Proprio</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
