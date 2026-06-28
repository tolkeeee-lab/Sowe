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
  UserCheck,
  Users,
  Clock
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
import { Inventaire } from '../components/inventaire'
import { BilanPeriodique } from '../components/bilan-periodique'
import { HistoriqueTransactions } from '../components/historique-transactions'


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

const INITIAL_TRANSACTIONS: Transaction[] = [];

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
  const [activeTab, setActiveTab] = useState<'cabine' | 'vm'>('cabine')
  const [subTab, setSubTab] = useState<'dashboard' | 'caisse' | 'notes' | 'debts' | 'inventaire' | 'bilan' | 'historique'>('dashboard')
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  // VM (Vente Mobile) States
  const [vmBalances, setVmBalances] = useState({
    mtn: 0,
    moov: 0,
    celtiis: 0,
    cash: 0
  })
  const [vmOperator, setVmOperator] = useState<'mtn' | 'moov' | 'celtiis' | null>(null) // Let user set it up
  const [vmSommeConfiee, setVmSommeConfiee] = useState<number>(0)
  const [selectedVmRunner, setSelectedVmRunner] = useState('')
  const [vmRunners, setVmRunners] = useState<any[]>([])
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
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [cabins, setCabins] = useState<any[]>([])
  const [activeCabinId, setActiveCabinId] = useState<string | null>(null)
  
  // Login / Register Views
  const [appView, setAppView] = useState<'landing' | 'login'>('landing')
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [roleInput, setRoleInput] = useState<'proprio' | 'employe' | 'vm'>('proprio')
  const [bossEmailInput, setBossEmailInput] = useState('')
  const [businessNameInput, setBusinessNameInput] = useState('')
  const [firstCabinNameInput, setFirstCabinNameInput] = useState('')
  const [firstCabinAddressInput, setFirstCabinAddressInput] = useState('')
  const [newCabinName, setNewCabinName] = useState('')
  const [newCabinAddress, setNewCabinAddress] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  // Proprietor employee assignment states
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [creatingCabin, setCreatingCabin] = useState(false)

  // Role & PIN states
  const [role, setRole] = useState<'proprio' | 'employe' | 'vm'>('employe')
  const [showHub, setShowHub] = useState(true)
  const [pinCode, setPinCode] = useState('1234')
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [newPinInput, setNewPinInput] = useState('')
  const [showNewPinSection, setShowNewPinSection] = useState(false)

  // Balances in each medium
  const [balances, setBalances] = useState({
    mtn: 0,
    moov: 0,
    celtiis: 0,
    cash: 0,
  })

  // Start & Float Reserves
  const [coffres, setCoffres] = useState({
    mtn: 0,
    moov: 0,
    celtiis: 0,
    cash: 0,
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Blacklist database
  const [blacklist, setBlacklist] = useState<string[]>([])
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
        if (profileData.role !== 'proprio' && profileData.owner_id) {
          const { data: bossProfile } = await client
            .from('momo_profiles')
            .select('business_name')
            .eq('id', profileData.owner_id)
            .maybeSingle()
          if (bossProfile) {
            profileData.business_name = bossProfile.business_name
          }
        }
        setProfile(profileData)
        setRole(profileData.role)
        localStorage.setItem('momo_role', profileData.role)
        setShowProfileSetup(false)

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
          setActiveTab('cabine')
          setShowHub(false)
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
        } else {
          // Employee
          setActiveTab('cabine')
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
      } else {
        setProfile(null)
        setShowProfileSetup(true)
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
          const parts = settingsData.pin_code.split('|')
          setPinCode(parts[0])
          if (parts[1]) {
            setVmOperator(parts[1] as any)
            localStorage.setItem('momo_vm_operator', parts[1])
          } else {
            setVmOperator(null)
            localStorage.removeItem('momo_vm_operator')
          }
          if (parts[2]) {
            const val = parseFloat(parts[2])
            setVmSommeConfiee(isNaN(val) ? 0 : val)
            localStorage.setItem('momo_vm_somme_confiee', parts[2])
          } else {
            const savedSomme = localStorage.getItem('momo_vm_somme_confiee')
            setVmSommeConfiee(savedSomme ? parseFloat(savedSomme) : 0)
          }
        } else {
          await client.from('momo_settings').insert({ cabin_id: activeCabinId, pin_code: '1234' })
          setPinCode('1234')
          setVmOperator(null)
          setVmSommeConfiee(0)
          localStorage.removeItem('momo_vm_operator')
        }

        // Fetch Balances
        const { data: balancesData } = await client
          .from('momo_balances')
          .select('mtn, moov, celtiis, cash')
          .eq('cabin_id', activeCabinId)
          .maybeSingle()
        if (balancesData) {
          const loadedBalances = {
            mtn: Number(balancesData.mtn),
            moov: Number(balancesData.moov),
            celtiis: Number(balancesData.celtiis),
            cash: Number(balancesData.cash)
          }
          setBalances(loadedBalances)
          setVmBalances(loadedBalances)
          localStorage.setItem('momo_vm_balances', JSON.stringify(loadedBalances))
        } else {
          const zeroBalances = { mtn: 0, moov: 0, celtiis: 0, cash: 0 }
          await client.from('momo_balances').insert({ cabin_id: activeCabinId, ...zeroBalances })
          setBalances(zeroBalances)
          setVmBalances(zeroBalances)
          localStorage.setItem('momo_vm_balances', JSON.stringify(zeroBalances))
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

        // Fetch Transactions with smart merge (Supabase + LocalStorage)
        const localTxnsStr = localStorage.getItem('momo_transactions')
        const localTxns: Transaction[] = localTxnsStr ? JSON.parse(localTxnsStr) : []

        const { data: transactionsData } = await client
          .from('momo_transactions')
          .select('*')
          .eq('cabin_id', activeCabinId)
          .order('date', { ascending: false })
          .order('time', { ascending: false })

        const remoteTxns: Transaction[] = transactionsData ? transactionsData.map(t => ({
          id: t.id,
          phone: t.phone,
          operator: t.operator,
          type: t.type,
          amount: Number(t.amount),
          time: t.time,
          date: typeof t.date === 'string' ? t.date : getLocalDateString(new Date(t.date)),
          category: t.category,
          isScamReported: t.is_scam_reported,
          clientName: t.client_name,
          note: t.note ?? undefined
        })) : []

        const mergedTxnsMap = new Map<string, Transaction>()
        remoteTxns.forEach(t => mergedTxnsMap.set(t.id, t))
        localTxns.forEach(t => mergedTxnsMap.set(t.id, t))
        const combinedTxns = Array.from(mergedTxnsMap.values()).sort((a, b) => b.id.localeCompare(a.id))
        setTransactions(combinedTxns)
        localStorage.setItem('momo_transactions', JSON.stringify(combinedTxns))

        // Fetch Cabin Notes & Cahier Comptable with smart merge
        const localNotesStr = localStorage.getItem('momo_cabin_notes')
        const localNotes: CabinNote[] = localNotesStr ? JSON.parse(localNotesStr) : []

        const { data: notesData } = await client
          .from('momo_cabin_notes')
          .select('*')
          .eq('cabin_id', activeCabinId)
          .order('date', { ascending: false })
          .order('time', { ascending: false })

        const remoteNotes: CabinNote[] = notesData ? notesData.map(n => ({
          id: n.id,
          text: n.text,
          date: typeof n.date === 'string' ? n.date : getLocalDateString(new Date(n.date)),
          time: n.time,
          author: n.author,
          entry_type: n.entry_type || undefined,
          person_name: n.person_name || undefined,
          amount: n.amount ? Number(n.amount) : undefined,
          method: n.method || undefined
        })) : []

        const mergedNotesMap = new Map<string, CabinNote>()
        remoteNotes.forEach(n => mergedNotesMap.set(n.id, n))
        localNotes.forEach(n => mergedNotesMap.set(n.id, n))
        const combinedNotes = Array.from(mergedNotesMap.values()).sort((a, b) => b.id.localeCompare(a.id))
        setCabinNotes(combinedNotes)
        localStorage.setItem('momo_cabin_notes', JSON.stringify(combinedNotes))

        // Fetch VM Clients
        fetchVmClients(activeCabinId)

        // Fetch Debts with smart merge
        const localDebtsStr = localStorage.getItem('momo_debts')
        const localDebts: Debt[] = localDebtsStr ? JSON.parse(localDebtsStr) : []

        const { data: debtsData } = await client
          .from('momo_debts')
          .select('*')
          .eq('cabin_id', activeCabinId)
          .order('created_at', { ascending: false })

        const remoteDebts: Debt[] = debtsData ? debtsData.map(d => ({
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
        })) : []

        const mergedDebtsMap = new Map<string, Debt>()
        remoteDebts.forEach(d => mergedDebtsMap.set(d.id, d))
        localDebts.forEach(d => mergedDebtsMap.set(d.id, d))
        const combinedDebts = Array.from(mergedDebtsMap.values())
        setDebts(combinedDebts)
        localStorage.setItem('momo_debts', JSON.stringify(combinedDebts))
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
      if (storedRole === 'proprio') {
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
      const zeroBalances = { mtn: 0, moov: 0, celtiis: 0, cash: 0 }
      setVmBalances(zeroBalances)
      localStorage.setItem('momo_vm_balances', JSON.stringify(zeroBalances))
    }

    const storedVmClients = localStorage.getItem('momo_vm_clients')
    if (storedVmClients) {
      setVmClients(JSON.parse(storedVmClients))
    } else {
      setVmClients([])
      localStorage.setItem('momo_vm_clients', JSON.stringify([]))
    }

    const storedVmOperator = localStorage.getItem('momo_vm_operator') as 'mtn' | 'moov' | 'celtiis' | null
    if (storedVmOperator) {
      setVmOperator(storedVmOperator)
      setVmOpInput(storedVmOperator)
    } else {
      setVmOperator(null)
      setVmOpInput('mtn')
    }

    const storedVmSommeConfiee = localStorage.getItem('momo_vm_somme_confiee')
    if (storedVmSommeConfiee) {
      setVmSommeConfiee(parseFloat(storedVmSommeConfiee) || 0)
    } else {
      setVmSommeConfiee(0)
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

    // Directly align active balances with new starting float
    const nextBalances = {
      mtn: newCoffres.mtn,
      moov: newCoffres.moov,
      celtiis: newCoffres.celtiis,
      cash: newCoffres.cash,
    }
    await syncBalances(nextBalances)

    const client = getSupabase()
    if (client && activeCabinId) {
      try {
        await client.from('momo_coffres').upsert({ cabin_id: activeCabinId, ...newCoffres, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync coffres error:", e)
      }
    }
  }

  const syncVmBalances = async (newVmBalances: typeof vmBalances) => {
    setVmBalances(newVmBalances)
    localStorage.setItem('momo_vm_balances', JSON.stringify(newVmBalances))
    const client = getSupabase()
    if (client && activeCabinId) {
      try {
        await client.from('momo_balances').upsert({ cabin_id: activeCabinId, ...newVmBalances, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync VM balances error:", e)
      }
    }
  }

  const syncVmOperator = async (op: 'mtn' | 'moov' | 'celtiis' | null) => {
    setVmOperator(op)
    if (op) {
      localStorage.setItem('momo_vm_operator', op)
    } else {
      localStorage.removeItem('momo_vm_operator')
    }
    const client = getSupabase()
    if (client && activeCabinId) {
      try {
        const val = `${pinCode}|${op || ''}|${vmSommeConfiee}`
        await client.from('momo_settings').upsert({ cabin_id: activeCabinId, pin_code: val, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync VM operator error:", e)
      }
    }
  }

  const syncVmSommeConfiee = async (amount: number) => {
    setVmSommeConfiee(amount)
    localStorage.setItem('momo_vm_somme_confiee', amount.toString())
    const client = getSupabase()
    if (client && activeCabinId) {
      try {
        const val = `${pinCode}|${vmOperator || ''}|${amount}`
        await client.from('momo_settings').upsert({ cabin_id: activeCabinId, pin_code: val, updated_at: new Date().toISOString() })
      } catch (e) {
        console.error("Supabase sync VM Somme Confiee error:", e)
      }
    }
  }

  const isVmTransaction = (txn: Transaction) => {
    return txn.id.startsWith('VM-') || 
           txn.id.startsWith('RECOV-') || 
           txn.id.startsWith('agency-swap-') || 
           txn.category.includes('Vente Mobile') || 
           txn.category.includes('Point Agence') || 
           txn.category.includes('Terrain') || 
           txn.category.includes('Règlement Global') || 
           txn.clientName === 'AGENCE ROTATION';
  }

  const syncAddTransaction = async (txn: Transaction) => {
    setTransactions(prev => {
      const updated = [txn, ...prev]
      localStorage.setItem('momo_transactions', JSON.stringify(updated))
      return updated
    })

    // Automatic balance adjustment for caissier transactions
    const isVm = isVmTransaction(txn);

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
  const syncAddCabinNote = (noteInputData: string | Omit<CabinNote, 'id' | 'date' | 'time' | 'author'>) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const extraData = typeof noteInputData === 'string' ? { text: noteInputData } : noteInputData

    const newNote: CabinNote = {
      id: `NOTE-${Date.now()}`,
      date: getLocalDateString(),
      time: timeStr,
      author: role,
      ...extraData
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
        entry_type: newNote.entry_type || null,
        person_name: newNote.person_name || null,
        amount: newNote.amount || null,
        method: newNote.method || null,
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
        const val = role === 'vm' ? `${newPin}|${vmOperator || ''}|${vmSommeConfiee}` : newPin
        await client.from('momo_settings').upsert({ cabin_id: activeCabinId, pin_code: val, updated_at: new Date().toISOString() })
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
      setLoading(false)
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
      const { data: authData, error: signUpErr } = await client.auth.signUp({
        email: emailInput,
        password: passwordInput
      })

      if (signUpErr) throw signUpErr
      if (!authData.user) throw new Error("Échec de la création de l'utilisateur.")

      setAuthSuccess("Inscription réussie ! Connectez-vous maintenant pour compléter votre profil.")
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

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    setAuthSuccess('')
    const client = getSupabase()
    if (!client || !session?.user) {
      setAuthError("Base de données Supabase non connectée ou session expirée.")
      setLoading(false)
      return
    }

    try {
      if (!nameInput.trim()) {
        throw new Error("Le nom complet est requis.")
      }

      let bossId: string | null = null

      if (roleInput === 'employe') {
        if (!bossEmailInput) {
          throw new Error("L'email de votre propriétaire (Boss) est requis pour lier le compte.")
        }
        const { data: bossProfile, error: bossErr } = await client
          .from('momo_profiles')
          .select('id')
          .eq('role', 'proprio')
          .ilike('email', bossEmailInput.trim())
          .maybeSingle()

        if (bossErr || !bossProfile) {
          throw new Error("Aucun compte propriétaire trouvé avec cet email. Veuillez vérifier l'email de votre Boss.")
        }
        bossId = bossProfile.id
      }

      const isOwnerRole = roleInput === 'proprio'
      if (isOwnerRole) {
        if (!businessNameInput.trim()) {
          throw new Error("Le nom de votre entreprise est requis.")
        }
        if (!firstCabinNameInput.trim()) {
          throw new Error("Le nom de votre première cabine est requis.")
        }
        if (!firstCabinAddressInput.trim()) {
          throw new Error("Le quartier/adresse de votre cabine est requis.")
        }
      }

      const { error: profileErr } = await client.from('momo_profiles').insert({
        id: session.user.id,
        role: roleInput,
        name: nameInput.trim(),
        email: session.user.email,
        owner_id: bossId,
        business_name: isOwnerRole ? businessNameInput.trim() : null
      })

      if (profileErr) throw profileErr

      if (roleInput === 'proprio' || roleInput === 'vm') {
        const cabinName = roleInput === 'vm' 
          ? `Espace VM de ${nameInput.trim()}` 
          : firstCabinNameInput.trim()
        const cabinAddress = roleInput === 'vm'
          ? 'Mobile'
          : firstCabinAddressInput.trim()
        const { data: cabinData, error: cabinErr } = await client.from('momo_cabins').insert({
          name: cabinName,
          owner_id: session.user.id,
          address: cabinAddress
        }).select().single()

        if (cabinErr) throw cabinErr

        await Promise.all([
          client.from('momo_balances').insert({ cabin_id: cabinData.id }),
          client.from('momo_coffres').insert({ cabin_id: cabinData.id }),
          client.from('momo_settings').insert({ cabin_id: cabinData.id, pin_code: '1234' })
        ])
      }

      await loadUserProfile(session.user.id)
      setShowProfileSetup(false)
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de la création du profil.")
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
    const mockProfile = { id: 'mock-user-id', role: 'proprio', name: 'Propriétaire Démo' }
    const mockCabins = [{ id: 'mock-cabin-id', name: 'Cabine Démo' }]
    const mockRunners = [
      { name: 'Moussa', operator: 'mtn', zone: 'Cotonou Centre' },
      { name: 'Kofi', operator: 'moov', zone: 'Fidjrossè' },
      { name: 'Ablavi', operator: 'celtiis', zone: 'Abomey-Calavi' }
    ]
    
    setSession(mockSession)
    setProfile(mockProfile)
    setRole('proprio')
    setCabins(mockCabins)
    setVmRunners(mockRunners)
    setActiveCabinId('mock-cabin-id')
    setSupabaseConnected(false)
    setShowHub(false)
    setActiveTab('cabine')
    setAuthLoading(false)
    
    localStorage.setItem('momo_role', 'proprio')
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
        owner_id: 'mock-user-id',
        address: newCabinAddress.trim()
      }
      setCabins(prev => [...prev, mockNewCabin])
      setActiveCabinId(mockNewCabin.id)
      localStorage.setItem('momo_active_cabin_id', mockNewCabin.id)
      setNewCabinName('')
      setNewCabinAddress('')
      alert(`Cabine "${mockNewCabin.name}" créée (Local Bypass) avec succès !`)
      setCreatingCabin(false)
      return
    }

    const client = getSupabase()
    if (!client) return

    try {
      const { data: cabinData, error: cabinErr } = await client.from('momo_cabins').insert({
        name: newCabinName.trim(),
        owner_id: session.user.id,
        address: newCabinAddress.trim()
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
      if (vmBalances.cash < amount) {
        alert(`Cash en poche insuffisant (${vmBalances.cash.toLocaleString('fr-FR')} FCFA) pour effectuer ce retrait !`);
        return;
      }
      nextVmBalances = {
        ...vmBalances,
        cash: vmBalances.cash - amount,
        [op]: vmBalances[op] + amount
      }
    }

    syncVmBalances(nextVmBalances)

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
    const businessName = profile?.business_name || "MOMO PREMIUM"
    const cabinName = cabins.find(c => c.id === activeCabinId)?.name || "Cabine"
    const clientText = txn.clientName ? `*Nom Client* : ${txn.clientName.toUpperCase()}%0A` : ""
    const text = `*${businessName.toUpperCase()} - REÇU (${txn.type.toUpperCase()})*%0A---------------------------%0A*Cabine* : ${cabinName}%0A*Date* : ${txn.date} à ${txn.time}%0A*Réseau* : ${txn.operator.toUpperCase()}%0A*Numéro Client* : ${txn.phone}%0A${clientText}*Montant* : ${txn.amount.toLocaleString('fr-FR')} FCFA%0A*Statut* : RÉUSSI%0A---------------------------%0AMerci de votre confiance !`
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
      setActiveTab('cabine')
    } else {
      setPinError('Code PIN incorrect')
    }
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
    if (isNaN(amount) || amount <= 0) {
      alert("⚠️ Veuillez renseigner un montant valide supérieur à 0.")
      setLoading(false)
      return
    }

    // Balance validations to keep caissiers comfortable and prevent errors
    if (actionType === 'deposit' || actionType === 'credit' || actionType === 'forfait') {
      if (balances[opInput] < amount) {
        alert(`❌ Solde SIM ${opInput.toUpperCase()} insuffisant ! Solde disponible : ${balances[opInput].toLocaleString('fr-FR')} FCFA. L'opération a été bloquée pour éviter les écarts.`);
        setLoading(false)
        return
      }
    } else if (actionType === 'withdrawal') {
      if (balances.cash < amount) {
        alert(`❌ Tiroir Cash (Espèces) insuffisant ! Cash disponible : ${balances.cash.toLocaleString('fr-FR')} FCFA. L'opération a été bloquée pour éviter les écarts.`);
        setLoading(false)
        return
      }
    }

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
              <span className="font-serif text-lg font-bold tracking-tight">MOMOFLOW</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      Gerez vos cabines physiques, vos gérants et suivez vos performances.
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
            MOMOFLOW · Cotonou, Bénin · Propulsé localement · v1.1.2
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
            <h1 className="font-serif text-3xl font-black text-center tracking-tight">MOMOFLOW</h1>
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
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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

  if (session && showProfileSetup) {
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
          <div className="flex flex-col items-center mb-6">
            <div className={`size-16 rounded-2xl flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-[#050807] border border-[#1C2C22] text-natural-accent' : 'bg-stone-50 border border-stone-200 text-natural-accent'
            }`}>
              <UserCheck className="size-8" />
            </div>
            <h1 className="font-serif text-2xl font-black text-center tracking-tight">Configuration du Profil</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-extrabold -mt-1 font-mono">
              Étape finale indispensable
            </p>
          </div>

          {authError && (
            <div className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-stone-500/10 bg-stone-500/5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Type de Compte</label>
              <div className="text-xs font-bold text-natural-accent uppercase tracking-wider">
                {roleInput === 'proprio' ? '👑 Propriétaire' : roleInput === 'employe' ? '👤 Gérant' : '🛵 VM Uniquement'}
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

            {(roleInput === 'proprio') && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Nom de l'Entreprise</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bénin Telecom / Global Flotte"
                    value={businessNameInput}
                    onChange={e => setBusinessNameInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Nom de votre Première Cabine</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cabine Étoile / Cabine Carrefour"
                    value={firstCabinNameInput}
                    onChange={e => setFirstCabinNameInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Quartier / Adresse de la Cabine</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agla / Gbégamey / Calavi"
                    value={firstCabinAddressInput}
                    onChange={e => setFirstCabinAddressInput(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:outline-none text-sm ${
                      theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>
              </>
            )}

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
              Valider mon Profil
            </Button>

            <button
              type="button"
              onClick={handleSignOut}
              className={`w-full text-center text-xs font-bold mt-2 hover:underline cursor-pointer ${
                theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              Déconnexion / Annuler
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen md:h-screen w-full flex flex-col overflow-x-hidden md:overflow-hidden transition-colors duration-550 font-sans ${
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
      <header className={`md:hidden border-b transition-colors sticky top-0 z-40 backdrop-blur-md ${
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

      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className={`hidden md:flex flex-col w-64 border-r p-6 gap-6 shrink-0 h-full overflow-y-auto overflow-x-hidden ${
          theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22]' : 'bg-white border-[#DCD6CD]'
        }`}>
          {/* Logo / Company Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`size-10 rounded-xl flex items-center justify-center border ${
              theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border-stone-200 text-[#D4AF37]'
            }`}>
              <Wallet className="size-5" />
            </div>
            <div>
              <span className="font-serif text-base font-black tracking-tight block truncate w-40">
                {profile?.business_name || "MOMOFLOW"}
              </span>
              <span className="text-[9px] block font-bold tracking-widest uppercase text-natural-accent -mt-1">
                {profile?.role === 'proprio' 
                  ? 'Administration de son entreprise' 
                  : profile?.role === 'vm' 
                    ? 'Mon Activité Terrain' 
                    : 'Administration de son patron'}
              </span>
            </div>
          </div>

          {/* Cabin Selector for Proprio (Desktop) */}
          {profile?.role === 'proprio' && cabins.length > 0 && (
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl border bg-natural-accent/5 border-natural-accent/15">
              <label className="text-[9px] font-bold text-natural-accent uppercase tracking-wider flex items-center gap-1.5">
                <Building className="size-3.5" /> Cabine Active
              </label>
              <select
                value={activeCabinId || ''}
                onChange={(e) => {
                  setActiveCabinId(e.target.value)
                  localStorage.setItem('momo_active_cabin_id', e.target.value)
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
                }`}
              >
                {cabins.map(cab => (
                  <option key={cab.id} value={cab.id}>{cab.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* User Info Card */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${
            theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
          }`}>
            <span className="text-[9px] font-mono uppercase text-stone-500 font-bold">Utilisateur</span>
            <div className="font-bold text-sm truncate">{profile?.name}</div>
            <div className="text-[10px] text-stone-400 truncate">{profile?.email}</div>
          </div>

          {/* Navigation Links */}
          {activeCabinId && (
            <nav className="flex flex-col gap-1.5 mt-2">
              <button
                onClick={() => setSubTab('dashboard')}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  subTab === 'dashboard'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <Smartphone className="size-4" />
                <span>Opérations</span>
              </button>
              {(role === 'proprio') && (
                <button
                  onClick={() => setSubTab('caisse')}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    subTab === 'caisse'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                  }`}
                >
                  <Sliders className="size-4" />
                  <span>Caisse & Flotte</span>
                </button>
              )}
              <button
                onClick={() => setSubTab('notes')}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  subTab === 'notes'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <FileText className="size-4" />
                <span>Notes / Carnet</span>
              </button>
              {activeTab !== 'vm' && (
                <button
                  onClick={() => setSubTab('debts')}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    subTab === 'debts'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                  }`}
                >
                  <Coins className="size-4" />
                  <span>Dettes & Rappels</span>
                </button>
              )}
              <button
                onClick={() => setSubTab('inventaire')}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  subTab === 'inventaire'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <CheckCircle2 className="size-4" />
                <span>Inventaire</span>
              </button>
              {(role === 'proprio' || role === 'vm') && (
                <button
                  onClick={() => setSubTab('bilan')}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    subTab === 'bilan'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                  }`}
                >
                  <TrendingUp className="size-4" />
                  <span>Bilan Périodique</span>
                </button>
              )}
              <button
                onClick={() => setSubTab('historique')}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  subTab === 'historique'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <Clock className="size-4" />
                <span>Historique</span>
              </button>
            </nav>
          )}

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-stone-850/10 dark:border-[#1C2C22]">


            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`w-full px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-yellow-400' : 'bg-white border-[#DCD6CD] text-stone-700'
              }`}
            >
              {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              <span>Thème {theme === 'dark' ? 'Clair' : 'Sombre'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className={`w-full px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                theme === 'dark' 
                  ? 'bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-950/40' 
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              }`}
            >
              <LogOut className="size-3.5" />
              <span>Se Déconnecter</span>
            </button>
          </div>
        </aside>

        {/* Main Body */}
        <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-24 md:pb-8 flex flex-col gap-6 w-full overflow-y-auto">
        
        {role === 'employe' && !activeCabinId ? (
          <div className={`p-8 rounded-[32px] border text-center flex flex-col items-center gap-6 my-8 ${
            theme === 'dark'
              ? 'border-[#1C2C22] bg-gradient-to-b from-[#0E1B15] to-[#050807]'
              : 'border-[#DCD6CD] bg-white shadow-sm'
          }`}>
            <div className={`size-16 rounded-full flex items-center justify-center border ${
              theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border-stone-200 text-[#D4AF37]'
            }`}>
              <ShieldAlert className="size-8" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold mb-2">En Attente d'Affectation</h3>
              <p className={`text-xs leading-relaxed max-w-sm mx-auto ${
                theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Votre compte a été lié avec succès à votre propriétaire. Veuillez patienter pendant qu'il vous affecte à une cabine active.
              </p>
            </div>
            <button
              onClick={() => {
                if (session?.user) loadUserProfile(session.user.id);
              }}
              className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#c09d30] text-[#0A0F0D] rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-4" /> Rafraîchir mon statut
            </button>
          </div>
        ) : (
          <>
        {/* TAB 1: CABINE (CAISSIER + ADMIN) */}
        {activeTab === 'cabine' && (subTab === 'dashboard' || subTab === 'caisse') && (
          <DashboardProprio
            theme={theme}
            role={role}
            viewMode={subTab}
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
            newCabinAddress={newCabinAddress}
            setNewCabinAddress={setNewCabinAddress}
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
            transactions={transactions.filter(t => !isVmTransaction(t))}
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

        {/* Carnet de Bord — espace cabine */}
        {activeTab === 'cabine' && subTab === 'notes' && (
          <CarnetDeBord
            theme={theme}
            role={role}
            notes={cabinNotes}
            onAddNote={syncAddCabinNote}
            onDeleteNote={syncDeleteCabinNote}
          />
        )}

        {/* Dettes & Rappels — espace cabine */}
        {activeTab === 'cabine' && subTab === 'debts' && (
          <DettesRappels
            theme={theme}
            role={role}
            debts={debts}
            onAddDebt={syncAddDebt}
            onSettleDebt={syncSettleDebt}
            onDeleteDebt={syncDeleteDebt}
          />
        )}

        {/* Inventaire — pour tous */}
        {subTab === 'inventaire' && (
          <Inventaire
            theme={theme}
            role={role}
            activeTab={activeTab}
            activeCabinId={activeTab === 'vm' ? (profile?.assigned_cabin_id || activeCabinId) : activeCabinId}
            profile={profile}
            balances={activeTab === 'vm' ? vmBalances : balances}
          />
        )}


        {/* Bilan Périodique (subTab autonome, cabine + vm) - réservé au proprio et au VM runner */}
        {(role === 'proprio' || role === 'vm') && subTab === 'bilan' && (
          <BilanPeriodique
            theme={theme}
            transactions={role === 'vm' ? transactions.filter(isVmTransaction) : (activeTab === 'vm' ? transactions.filter(isVmTransaction) : transactions.filter(t => !isVmTransaction(t)))}
            TODAY_STR={TODAY_STR}
            YESTERDAY_STR={YESTERDAY_STR}
            mode={role === 'vm' ? 'vm' : (activeTab === 'vm' ? 'vm' : 'cabine')}
            getWeekRange={getWeekRange}
            getLocalDateString={getLocalDateString}
          />
        )}

        {subTab === 'historique' && (
          <HistoriqueTransactions
            theme={theme}
            transactions={role === 'vm' ? transactions.filter(isVmTransaction) : (role === 'proprio' ? transactions : transactions.filter(t => !isVmTransaction(t)))}
            TODAY_STR={TODAY_STR}
            YESTERDAY_STR={YESTERDAY_STR}
            role={role}
            getWeekRange={getWeekRange}
            getLocalDateString={getLocalDateString}
            activeTab={activeTab}
            onViewReceipt={setActiveReceipt}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {/* TAB 3: MON ESPACE VM (Vendeur Motorisé) */}
        {activeTab === 'vm' && subTab === 'dashboard' && (
          <DashboardVm
            theme={theme}
            profile={profile}
            role={role}
            vmBalances={vmBalances}
            setVmBalances={syncVmBalances}
            transactions={transactions.filter(isVmTransaction)}
            TODAY_STR={TODAY_STR}
            vmOperator={vmOperator}
            setVmOperator={syncVmOperator}
            sommeConfiee={vmSommeConfiee}
            setSommeConfiee={syncVmSommeConfiee}
            vmClients={vmClients}
            syncAddVmClient={syncAddVmClient}
            syncDeleteVmClient={syncDeleteVmClient}
            syncAddTransaction={syncAddTransaction}
            getLocalDateString={getLocalDateString}
            getWeekRange={getWeekRange}
            YESTERDAY_STR={YESTERDAY_STR}
            renderOperatorBadge={renderOperatorBadge}
          />
        )}

        {/* Carnet de Bord — espace VM */}
        {activeTab === 'vm' && subTab === 'notes' && (
          <CarnetDeBord
            theme={theme}
            role={role}
            notes={cabinNotes}
            onAddNote={syncAddCabinNote}
            onDeleteNote={syncDeleteCabinNote}
          />
        )}

        {/* Floating Bottom Navigation Bar for active workspaces */}
          <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
            <div className={`p-1.5 rounded-2xl border shadow-xl flex gap-1 pointer-events-auto backdrop-blur-lg overflow-x-auto max-w-full flex-nowrap scrollbar-none ${
              theme === 'dark' ? 'bg-[#0E1B15]/90 border-[#1C2C22]' : 'bg-[#FAF9F6]/95 border-[#DCD6CD]'
            }`}>
              <button
                onClick={() => setSubTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  subTab === 'dashboard'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <Smartphone className="size-4" />
                <span>Opérations</span>
              </button>
              {(role === 'proprio') && (
                <button
                  onClick={() => setSubTab('caisse')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    subTab === 'caisse'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                  }`}
                >
                  <Sliders className="size-4" />
                  <span>Caisse</span>
                </button>
              )}
              <button
                onClick={() => setSubTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  subTab === 'notes'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <FileText className="size-4" />
                <span>Notes</span>
              </button>
              {activeTab !== 'vm' && (
                <button
                  onClick={() => setSubTab('debts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    subTab === 'debts'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                  }`}
                >
                  <Coins className="size-4" />
                  <span>Dettes</span>
                </button>
              )}
              <button
                onClick={() => setSubTab('inventaire')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  subTab === 'inventaire'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <CheckCircle2 className="size-4" />
                <span>Inventaire</span>
              </button>
              {(role === 'proprio' || role === 'vm') && (
                <button
                  onClick={() => setSubTab('bilan')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    subTab === 'bilan'
                      ? 'bg-natural-accent text-[#0A0F0D]'
                      : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                  }`}
                >
                  <TrendingUp className="size-4" />
                  <span>Bilan</span>
                </button>
              )}
              <button
                onClick={() => setSubTab('historique')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  subTab === 'historique'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : theme === 'dark' ? 'text-stone-400 hover:text-white hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
                }`}
              >
                <Clock className="size-4" />
                <span>Historique</span>
              </button>
            </div>
          </div>
          </>
        )}
        {/* FOOTER */}
        <footer className="border-t border-stone-900/10 dark:border-[#1C2C22] py-10 mt-16 text-center text-xs text-stone-500 w-full">
          <p className="max-w-md mx-auto px-4 leading-relaxed font-bold">
            « Momo Premium » — Outil d'assistance numérique pour les points de vente agréés MTN MoMo, Moov Money et Celtiis au Bénin.
          </p>
          <p className="mt-2 text-[9px] text-stone-600">
            Propulsé localement · Cotonou, Bénin · v1.1.2
          </p>
        </footer>
      </main>
      </div>

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
                <h4 className="text-xs font-black tracking-widest uppercase">
                  {activeReceipt.type === 'withdrawal' ? '*** TICKET DE RETRAIT ***' : '*** REÇU DE PAIEMENT ***'}
                </h4>
                <p className="text-[10px] text-stone-500 uppercase mt-0.5">
                  {profile?.business_name || "MOMO PREMIUM"}
                </p>
                <p className="text-[9px] text-stone-400 uppercase font-bold">
                  {cabins.find(c => c.id === activeCabinId)?.name || "Cabine active"}
                </p>
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
                {activeReceipt.clientName && (
                  <div className="flex justify-between">
                    <span>NOM CLIENT :</span>
                    <span className="font-bold uppercase">{activeReceipt.clientName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TYPE FLUX :</span>
                  <span className="font-bold uppercase">
                    {activeReceipt.type === 'deposit' ? 'ENVOI (DEPOT)' 
                     : activeReceipt.type === 'withdrawal' ? 'RETRAIT' 
                     : activeReceipt.type === 'credit' ? 'VENTE DE CREDIT' : 'FORFAIT'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FRAIS :</span>
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

      {/* THERMAL RECEIPT / TICKET MODAL */}
      <AnimatePresence>
        {activeReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReceipt(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 overflow-hidden border ${
                theme === 'dark' ? 'bg-[#0E1B15] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-[#121214]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-3 border-stone-800/40">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-natural-accent/10 text-natural-accent border border-natural-accent/20">
                    <FileText className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-natural-accent">Reçu de Transaction</h3>
                    <p className="text-[10px] text-stone-400 font-mono">{activeReceipt.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveReceipt(null)} 
                  className="text-stone-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-stone-800/40 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Printable Receipt Preview Card */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-3 font-mono text-xs ${
                theme === 'dark' ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="text-center font-bold text-sm text-natural-accent uppercase tracking-wider">
                  ★ CABINE MOBILE MONEY ★
                </div>
                <div className="text-center text-[10px] text-stone-400 uppercase">
                  TICKET DE RÈGLEMENT
                </div>
                <div className="border-b border-dashed border-stone-700/60 my-1" />

                <div className="flex justify-between">
                  <span className="text-stone-400">Date & Heure :</span>
                  <span className="font-bold">{activeReceipt.date} {activeReceipt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Opérateur :</span>
                  <span className="font-black uppercase text-natural-accent">{activeReceipt.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Type d'Opération :</span>
                  <span className="font-bold uppercase">{activeReceipt.type === 'deposit' ? 'Dépôt' : activeReceipt.type === 'withdrawal' ? 'Retrait' : 'Opération'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Numéro Téléphone :</span>
                  <span className="font-bold font-mono text-white">{activeReceipt.phone}</span>
                </div>
                {activeReceipt.clientName && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Client :</span>
                    <span className="font-bold">{activeReceipt.clientName}</span>
                  </div>
                )}

                <div className="border-b border-dashed border-stone-700/60 my-1" />

                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-400 font-sans font-bold text-xs uppercase">Montant Total :</span>
                  <span className="text-xl font-black font-serif text-emerald-400">{activeReceipt.amount.toLocaleString('fr-FR')} FCFA</span>
                </div>

                {activeReceipt.note && (
                  <div className="mt-1 p-2 rounded-lg bg-stone-900/60 border border-stone-800 text-[10px] text-stone-300 italic">
                    Note : {activeReceipt.note}
                  </div>
                )}

                <div className="border-b border-dashed border-stone-700/60 my-1" />
                <div className="text-center text-[9px] text-stone-500 uppercase tracking-wider">
                  Merci de votre confiance !
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open('', '_blank', 'width=400,height=600');
                    if (printWin) {
                      printWin.document.write(`
                        <html>
                          <head>
                            <title>Reçu ${activeReceipt.id}</title>
                            <style>
                              body { font-family: monospace; padding: 20px; text-align: center; }
                              .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                              .sub { font-size: 11px; color: #555; margin-bottom: 15px; }
                              .dash { border-top: 1px dashed #000; margin: 10px 0; }
                              .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
                              .amt { font-size: 20px; font-weight: bold; margin: 15px 0; }
                            </style>
                          </head>
                          <body>
                            <div class="title">CABINE MOBILE MONEY</div>
                            <div class="sub">TICKET DE TRANSACTION</div>
                            <div class="dash"></div>
                            <div class="row"><span>ID:</span><strong>${activeReceipt.id}</strong></div>
                            <div class="row"><span>Date:</span><span>${activeReceipt.date} ${activeReceipt.time}</span></div>
                            <div class="row"><span>Opérateur:</span><strong style="text-transform:uppercase;">${activeReceipt.operator}</strong></div>
                            <div class="row"><span>Téléphone:</span><strong>${activeReceipt.phone}</strong></div>
                            ${activeReceipt.clientName ? `<div class="row"><span>Client:</span><strong>${activeReceipt.clientName}</strong></div>` : ''}
                            <div class="dash"></div>
                            <div class="amt">${activeReceipt.amount.toLocaleString('fr-FR')} FCFA</div>
                            <div class="dash"></div>
                            <div style="font-size:10px;color:#666;">Merci de votre confiance !</div>
                            <script>window.onload = function() { window.print(); }</script>
                          </body>
                        </html>
                      `);
                      printWin.document.close();
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-stone-700"
                >
                  🖨️ Imprimer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const content = `CABINE MOBILE MONEY - REÇU DE TRANSACTION\n----------------------------------------\nID Transaction : ${activeReceipt.id}\nDate & Heure    : ${activeReceipt.date} ${activeReceipt.time}\nOpérateur       : ${activeReceipt.operator.toUpperCase()}\nType            : ${activeReceipt.type === 'deposit' ? 'Dépôt' : 'Retrait'}\nTéléphone Client: ${activeReceipt.phone}\nMontant         : ${activeReceipt.amount.toLocaleString('fr-FR')} FCFA\n----------------------------------------\nMerci de votre confiance !`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Recu_${activeReceipt.id}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-3 rounded-xl bg-natural-accent hover:bg-[#c9a430] text-stone-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  📥 Télécharger PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
