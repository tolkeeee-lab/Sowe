"use client";

import { useState, useEffect } from 'react'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building, 
  Trash2, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Plus, 
  Clock,
  Smartphone,
  Info
} from 'lucide-react'
import { Button } from './ui/button'
import { Transaction, VmClient } from '../types'
import { BilanPeriodique } from './bilan-periodique'

interface VmDehorsItem {
  id: string;
  name: string;
  phone: string;
  amount: number;
  operator: 'mtn' | 'moov' | 'celtiis';
  date: string;
  time: string;
}

interface DashboardVmProps {
  theme: 'dark' | 'light';
  profile: any;
  role: 'proprio' | 'employe' | 'vm';
  vmBalances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
  setVmBalances: (balances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  }) => void;
  transactions: Transaction[];
  TODAY_STR: string;
  vmOperator: 'mtn' | 'moov' | 'celtiis' | null;
  setVmOperator: (op: 'mtn' | 'moov' | 'celtiis' | null) => void;
  sommeConfiee: number;
  setSommeConfiee: (amount: number) => void;
  vmClients: VmClient[];
  syncAddVmClient: (name: string, phone: string) => Promise<void>;
  syncDeleteVmClient: (id: string) => Promise<void>;
  syncAddTransaction: (txn: Transaction) => Promise<void>;
  getLocalDateString: (d?: Date) => string;
  getWeekRange: (dateStr: string) => { start: string; end: string };
  YESTERDAY_STR: string;
  renderOperatorBadge: (op: string) => React.ReactNode;
}

export function DashboardVm({
  theme,
  profile,
  role,
  vmBalances,
  setVmBalances,
  transactions,
  TODAY_STR,
  vmOperator,
  setVmOperator,
  sommeConfiee,
  setSommeConfiee,
  vmClients,
  syncAddVmClient,
  syncDeleteVmClient,
  syncAddTransaction,
  getLocalDateString,
  getWeekRange,
  YESTERDAY_STR,
  renderOperatorBadge
}: DashboardVmProps) {
  // Local form & display states
  const [showClientManager, setShowClientManager] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const [vmActionType, setVmActionType] = useState<'deposit' | 'withdrawal' | null>(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [clientNameInput, setClientNameInput] = useState('')
  const [saveClientCheckbox, setSaveClientCheckbox] = useState(false)
  const [vmAmountInput, setVmAmountInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Payment option for transfers: immediately paid cash or credit/dehors
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')

  // Quick sale state: client selected for inline rapid transaction
  const [quickSaleClientId, setQuickSaleClientId] = useState<string | null>(null)
  const [quickSaleType, setQuickSaleType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [quickSaleAmount, setQuickSaleAmount] = useState('')
  const [quickSalePayType, setQuickSalePayType] = useState<'cash' | 'credit'>('cash')
  const [quickLoading, setQuickLoading] = useState(false)

  // Float management & outstanding credit states (saved locally)
  const [isEditingSomme, setIsEditingSomme] = useState(false)
  const [sommeInput, setSommeInput] = useState('')
  const [dehorsList, setDehorsList] = useState<VmDehorsItem[]>([])
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})

  const [isEditingVirtuel, setIsEditingVirtuel] = useState(false)
  const [virtuelInput, setVirtuelInput] = useState('')
  const [isEditingCash, setIsEditingCash] = useState(false)
  const [cashInput, setCashInput] = useState('')

  // Keep inputs in sync with current balances
  useEffect(() => {
    if (vmOperator) {
      setVirtuelInput(vmBalances[vmOperator].toString())
    }
    setCashInput(vmBalances.cash.toString())
    setSommeInput(sommeConfiee.toString())
  }, [vmBalances, vmOperator, sommeConfiee])

  // Setup Wizard States
  const [setupStep, setSetupStep] = useState(1)
  const [setupOperator, setSetupOperator] = useState<'mtn' | 'moov' | 'celtiis' | null>(null)
  const [setupCapital, setSetupCapital] = useState('')
  const [setupVirtuel, setSetupVirtuel] = useState('')
  const [setupCash, setSetupCash] = useState('')

  const isDark = theme === 'dark'

  // Load float config & dehors list from localStorage on mount
  useEffect(() => {
    const savedDehors = localStorage.getItem('momo_vm_dehors_list')
    if (savedDehors) {
      setDehorsList(JSON.parse(savedDehors))
    }
  }, [])

  // Calculate totals
  const totalDehors = dehorsList.reduce((sum, item) => sum + item.amount, 0)
  const virtualAvailable = vmOperator ? vmBalances[vmOperator] : 0
  const totalActifReel = virtualAvailable + vmBalances.cash
  const ecart = (totalActifReel + totalDehors) - sommeConfiee

  // Group dehorsList by client/enterprise (using name as key, fallback to phone)
  const groupedDehors = dehorsList.reduce((acc, item) => {
    const key = (item.name || item.phone).trim();
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        phone: item.phone,
        totalAmount: 0,
        items: [] as VmDehorsItem[]
      }
    }
    acc[key].totalAmount += item.amount;
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; phone: string; totalAmount: number; items: VmDehorsItem[] }>);

  const saveDehorsList = (newList: VmDehorsItem[]) => {
    setDehorsList(newList)
    localStorage.setItem('momo_vm_dehors_list', JSON.stringify(newList))
  }

  const handleUpdateSommeConfiee = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(sommeInput)
    if (!isNaN(val) && val >= 0) {
      setSommeConfiee(val)
      setIsEditingSomme(false)
    }
  }

  const handleUpdateVirtuel = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(virtuelInput)
    if (!isNaN(val) && val >= 0 && vmOperator) {
      const newVm = {
        ...vmBalances,
        [vmOperator]: val
      }
      setVmBalances(newVm)
      localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
      setIsEditingVirtuel(false)
    }
  }

  const handleUpdateCash = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(cashInput)
    if (!isNaN(val) && val >= 0) {
      const newVm = {
        ...vmBalances,
        cash: val
      }
      setVmBalances(newVm)
      localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
      setIsEditingCash(false)
    }
  }

  const toggleClientExpand = (clientKey: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientKey]: !prev[clientKey]
    }))
  }

  // Handle Wizard Submit and Activation
  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupOperator) return
    const cap = parseFloat(setupCapital) || 0
    const virt = parseFloat(setupVirtuel) || 0
    const csh = parseFloat(setupCash) || 0

    // Set operator
    setVmOperator(setupOperator)

    // Set capital
    setSommeConfiee(cap)
    setSommeInput(cap.toString())

    // Set balances
    const newBalances = {
      mtn: setupOperator === 'mtn' ? virt : 0,
      moov: setupOperator === 'moov' ? virt : 0,
      celtiis: setupOperator === 'celtiis' ? virt : 0,
      cash: csh
    }
    setVmBalances(newBalances)
    localStorage.setItem('momo_vm_balances', JSON.stringify(newBalances))
  }

  // Handle a new terrain credit manually or from transaction workflow
  const handleVmTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vmAmountInput || !phoneInput) return
    const amount = parseFloat(vmAmountInput)
    if (isNaN(amount) || amount <= 0) return
    const op = vmOperator || 'mtn'
    let nextVmBalances = { ...vmBalances }
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setLoading(true)
    try {
      if (vmActionType === 'deposit') {
        // Envoi: check if SIM virtual balance is sufficient
        if (vmBalances[op] < amount) {
          alert(`Solde virtuel ${op.toUpperCase()} insuffisant sur votre SIM (${vmBalances[op].toLocaleString('fr-FR')} FCFA) pour effectuer ce transfert !`);
          setLoading(false);
          return;
        }

        if (paymentType === 'cash') {
          // Normal: Client gives cash -> VM sends virtual. Cash increases, virtual decreases.
          nextVmBalances = {
            ...vmBalances,
            cash: vmBalances.cash + amount,
            [op]: vmBalances[op] - amount
          }
        } else {
          // Credit/Dehors: Client gets virtual on credit. Virtual decreases, cash does NOT change yet.
          // Instead, we add to "dehorsList".
          nextVmBalances = {
            ...vmBalances,
            [op]: vmBalances[op] - amount
          }
          const finalName = clientNameInput.trim() !== '' ? clientNameInput.trim() : `Client ${phoneInput}`
          const newCreditItem: VmDehorsItem = {
            id: `DEHORS-${Date.now()}`,
            name: finalName,
            phone: phoneInput.trim(),
            amount,
            operator: op,
            date: getLocalDateString(),
            time: timeStr
          }
          saveDehorsList([...dehorsList, newCreditItem])
        }
      } else {
        // Withdrawal: VM gives cash -> VM takes virtual. Cash decreases, virtual increases.
        if (vmBalances.cash < amount) {
          alert(`Cash en poche insuffisant (${vmBalances.cash.toLocaleString('fr-FR')} FCFA) pour effectuer ce retrait !`);
          setLoading(false);
          return;
        }
        nextVmBalances = {
          ...vmBalances,
          cash: vmBalances.cash - amount,
          [op]: vmBalances[op] + amount
        }
      }

      // Validate business name is provided
      if (!clientNameInput.trim()) {
        alert("Le nom de l'entreprise cliente est requis pour enregistrer une opération VM !");
        setLoading(false);
        return;
      }

      const finalClientName = clientNameInput.trim()

      setVmBalances(nextVmBalances)
      localStorage.setItem('momo_vm_balances', JSON.stringify(nextVmBalances))

      const categoryStr = vmActionType === 'deposit' 
        ? (paymentType === 'cash' ? 'Vente Mobile VM (Cash)' : 'Vente Mobile VM (Crédit Dehors)')
        : 'Vente Mobile VM (Retrait)'

      const newTxn: Transaction = {
        id: `VM-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: phoneInput.trim(),
        operator: op,
        type: vmActionType === 'deposit' ? 'deposit' : 'withdrawal',
        amount,
        time: timeStr,
        date: getLocalDateString(),
        category: categoryStr,
        isScamReported: false,
        clientName: finalClientName
      }

      // Auto-save client if not already in contact list
      const phoneClean = phoneInput.trim()
      const isAlreadySaved = vmClients.some(c => c.phone.trim() === phoneClean)
      if (!isAlreadySaved) {
        await syncAddVmClient(finalClientName, phoneClean)
      }

      await syncAddTransaction(newTxn)
      
      // Reset form states
      setVmAmountInput('')
      setPhoneInput('')
      setSelectedClientId('')
      setClientNameInput('')
      setSaveClientCheckbox(false)
      setVmActionType(null)
      setPaymentType('cash')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle a quick sale directly from contact click
  const handleQuickSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickSaleClientId) return
    const client = vmClients.find(c => c.id === quickSaleClientId)
    if (!client) return
    const amount = parseFloat(quickSaleAmount)
    if (isNaN(amount) || amount <= 0) return
    const op = vmOperator || 'mtn'
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setQuickLoading(true)
    try {
      let nextVmBalances = { ...vmBalances }

      if (quickSaleType === 'deposit') {
        if (vmBalances[op] < amount) {
          alert(`Solde virtuel ${op.toUpperCase()} insuffisant (${vmBalances[op].toLocaleString('fr-FR')} FCFA)`)
          return
        }
        if (quickSalePayType === 'cash') {
          nextVmBalances = { ...vmBalances, cash: vmBalances.cash + amount, [op]: vmBalances[op] - amount }
        } else {
          // Credit/Dehors
          nextVmBalances = { ...vmBalances, [op]: vmBalances[op] - amount }
          const newCreditItem: VmDehorsItem = {
            id: `DEHORS-${Date.now()}`,
            name: client.name,
            phone: client.phone,
            amount,
            operator: op,
            date: getLocalDateString(),
            time: timeStr
          }
          saveDehorsList([...dehorsList, newCreditItem])
        }
      } else {
        // Withdrawal: give cash to client, receive virtual
        if (vmBalances.cash < amount) {
          alert(`Cash en poche insuffisant (${vmBalances.cash.toLocaleString('fr-FR')} FCFA)`)
          return
        }
        nextVmBalances = { ...vmBalances, cash: vmBalances.cash - amount, [op]: vmBalances[op] + amount }
      }

      setVmBalances(nextVmBalances)
      localStorage.setItem('momo_vm_balances', JSON.stringify(nextVmBalances))

      const categoryStr = quickSaleType === 'deposit'
        ? (quickSalePayType === 'cash' ? 'Vente Mobile VM (Cash)' : 'Vente Mobile VM (Crédit Dehors)')
        : 'Vente Mobile VM (Retrait)'

      const newTxn: Transaction = {
        id: `VM-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: client.phone,
        operator: op,
        type: quickSaleType,
        amount,
        time: timeStr,
        date: getLocalDateString(),
        category: categoryStr,
        isScamReported: false,
        clientName: client.name
      }
      await syncAddTransaction(newTxn)
      setQuickSaleAmount('')
      setQuickSaleType('deposit')
      setQuickSalePayType('cash')
    } catch (err) {
      console.error(err)
    } finally {
      setQuickLoading(false)
    }
  }

  // Recover credit from client later
  const handleRecoverCredit = async (item: VmDehorsItem) => {
    const confirmed = confirm(`Confirmer la récupération de ${item.amount.toLocaleString('fr-FR')} FCFA en espèces de la part de "${item.name}" ?`)
    if (!confirmed) return

    // Update balances: cash increases, dehors decreases (removed from list)
    const nextVmBalances = {
      ...vmBalances,
      cash: vmBalances.cash + item.amount
    }
    setVmBalances(nextVmBalances)
    localStorage.setItem('momo_vm_balances', JSON.stringify(nextVmBalances))

    // Remove from dehorsList
    const updatedDehors = dehorsList.filter(d => d.id !== item.id)
    saveDehorsList(updatedDehors)

    // Log recovery transaction
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const recoveryTxn: Transaction = {
      id: `RECOV-${Date.now()}`,
      phone: item.phone,
      operator: item.operator,
      type: 'ajust_cash',
      amount: item.amount,
      time: timeStr,
      date: getLocalDateString(),
      category: 'Encaissement Crédit Terrain',
      isScamReported: false,
      clientName: item.name
    }
    await syncAddTransaction(recoveryTxn)
    alert(`Crédit récupéré ! +${item.amount.toLocaleString('fr-FR')} FCFA ajouté à vos espèces.`)
  }

  // Recover all outstanding balances for a grouped client/enterprise
  const handleRecoverAllForClient = async (clientKey: string) => {
    const clientData = groupedDehors[clientKey]
    if (!clientData) return
    const confirmed = confirm(`Confirmer la récupération de TOUT le solde de "${clientData.name}" (${clientData.totalAmount.toLocaleString('fr-FR')} FCFA) ?`)
    if (!confirmed) return

    // Update balances: add total to cash
    const nextVmBalances = {
      ...vmBalances,
      cash: vmBalances.cash + clientData.totalAmount
    }
    setVmBalances(nextVmBalances)
    localStorage.setItem('momo_vm_balances', JSON.stringify(nextVmBalances))

    // Remove all these items from dehorsList
    const itemIds = clientData.items.map(i => i.id)
    const updatedDehors = dehorsList.filter(d => !itemIds.includes(d.id))
    saveDehorsList(updatedDehors)

    // Log recovery transaction
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const recoveryTxn: Transaction = {
      id: `RECOV-ALL-${Date.now()}`,
      phone: clientData.phone,
      operator: clientData.items[0]?.operator || 'mtn',
      type: 'ajust_cash',
      amount: clientData.totalAmount,
      time: timeStr,
      date: getLocalDateString(),
      category: `Règlement Global — ${clientData.name}`,
      isScamReported: false,
      clientName: clientData.name
    }
    await syncAddTransaction(recoveryTxn)
    alert(`Tout le crédit de "${clientData.name}" (${clientData.totalAmount.toLocaleString('fr-FR')} F) a été encaissé en cash !`)
  }

  // Cancel credit item in case of error
  const handleCancelCredit = (id: string) => {
    if (!confirm("Annuler ce crédit sans récupérer l'argent ? (Attention, cela modifiera votre bilan global)")) return
    saveDehorsList(dehorsList.filter(d => d.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 mb-16 md:mb-0">
      {/* SETUP WIZARD: Request precise initial float & network balances */}
      {!vmOperator ? (
        <div className="flex flex-col gap-6 py-8 px-2 max-w-md mx-auto w-full">
          <div className="text-center mb-2">
            <span className="text-4xl block mb-2 animate-bounce">🛵</span>
            <h2 className="font-serif text-2xl font-black tracking-tight mb-2 text-natural-accent">
              Configuration de mon Espace VM
            </h2>
            <p className={`text-[11px] leading-relaxed max-w-xs mx-auto ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Initialise les montants que le réseau t'a confiés pour démarrer l'activité.
            </p>
          </div>

          <form onSubmit={handleWizardSubmit} className={`p-6 rounded-[32px] border flex flex-col gap-5 ${
            isDark ? 'bg-[#0E1B15] border-[#1C2C22] shadow-2xl' : 'bg-white border-[#DCD6CD] shadow-md'
          }`}>
            {setupStep === 1 ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-extrabold text-stone-500 uppercase tracking-widest">① Choisir mon Réseau</span>
                  <p className="text-[10px] text-stone-500 mb-2">Sélectionne ton réseau principal terrain</p>
                  
                  <div className="flex flex-col gap-3">
                    {([
                      { op: 'mtn', label: 'MTN Mobile Money', emoji: '🟡', color: 'text-amber-500' },
                      { op: 'moov', label: 'Moov Money', emoji: '🔵', color: 'text-blue-500' },
                      { op: 'celtiis', label: 'Celtiis Cash', emoji: '🟢', color: 'text-emerald-500' },
                    ] as const).map(item => (
                      <button
                        key={item.op}
                        type="button"
                        onClick={() => setSetupOperator(item.op)}
                        className={`p-4 rounded-[20px] border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          setupOperator === item.op
                            ? isDark ? 'border-natural-accent bg-natural-accent/10' : 'border-natural-accent bg-amber-50'
                            : isDark ? 'border-[#1C2C22] bg-[#050807] hover:border-stone-800' : 'border-[#DCD6CD] bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <div className={`font-serif font-bold text-xs ${item.color}`}>{item.label}</div>
                          <span className="text-[8px] text-stone-500 uppercase font-semibold">Réseau principal</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="premium"
                  disabled={!setupOperator}
                  onClick={() => setSetupStep(2)}
                  className="font-bold py-3.5 mt-2"
                >
                  Continuer
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-stone-500/5">
                    <span className="text-lg">💰</span>
                    <div>
                      <h4 className="text-xs font-black uppercase text-stone-300">Montants de Départ</h4>
                      <p className="text-[8px] text-stone-500">Ajuste les soldes à cet instant précis</p>
                    </div>
                  </div>

                  {/* Capital Confié (Float) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">Capital Global Confié (ex: 800K)</label>
                    <input
                      type="number"
                      required
                      value={setupCapital}
                      onChange={e => setSetupCapital(e.target.value)}
                      className={`p-3 border rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-900'
                      }`}
                    />
                  </div>

                  {/* Solde Virtuel Initial */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">Solde Virtuel {setupOperator?.toUpperCase()} sur SIM</label>
                    <input
                      type="number"
                      required
                      value={setupVirtuel}
                      onChange={e => setSetupVirtuel(e.target.value)}
                      className={`p-3 border rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-900'
                      }`}
                    />
                  </div>

                  {/* Solde Cash Initial */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">Espèces (Cash) en main</label>
                    <input
                      type="number"
                      required
                      value={setupCash}
                      onChange={e => setSetupCash(e.target.value)}
                      className={`p-3 border rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-900'
                      }`}
                    />
                  </div>

                  {/* Validation Math summary */}
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-[10px] ${
                    isDark ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-250'
                  }`}>
                    <div className="flex justify-between font-bold text-stone-400">
                      <span>Total Actif Initial (Virtuel + Cash) :</span>
                      <span className="font-mono text-stone-200">
                        {(parseFloat(setupVirtuel) + parseFloat(setupCash)).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-400">
                      <span>Capital Confié déclaré :</span>
                      <span className="font-mono text-stone-200">{parseFloat(setupCapital).toLocaleString('fr-FR')} F</span>
                    </div>
                    
                    {parseFloat(setupVirtuel) + parseFloat(setupCash) === parseFloat(setupCapital) ? (
                      <span className="text-[9px] font-black text-emerald-500 mt-1.5 flex items-center gap-1">
                        ✔ Les comptes concordent parfaitement.
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-500 mt-1.5 flex items-center gap-1.5 leading-tight">
                        ⚠️ Attention: Le total initial ({parseFloat(setupVirtuel) + parseFloat(setupCash)} F) ne correspond pas à la somme confiée ({setupCapital} F). Assure-toi que c'est correct.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className={`flex-1 py-3 rounded-xl border font-bold text-xs cursor-pointer ${
                      isDark ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    Retour
                  </button>
                  
                  <Button
                    type="submit"
                    variant="premium"
                    className="flex-1 font-bold py-3"
                  >
                    Activer mon Espace
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      ) : (
        <>
          {/* 1. COMPTABILITÉ & FOND DE ROULEMENT - PREMIUM CAISSIER GRID LOOK */}
          <section className={`p-6 rounded-[36px] border flex flex-col gap-5 relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22] shadow-2xl' 
              : 'bg-gradient-to-b from-white to-[#F2EFE9] border-[#DCD6CD] shadow-md'
          }`}>
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />

            {/* Header info */}
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="text-[8px] font-extrabold text-stone-550 uppercase tracking-widest font-sans">Solde Global du Vendeur Mobile</span>
                <span className="text-[10px] font-bold text-natural-accent uppercase tracking-wider mt-0.5">
                  Bilan Comptable Actif 🛵
                </span>
              </div>
              <div className="text-right flex items-center gap-3">
                {/* Change Operator Select option */}
                <div className="flex flex-col text-left">
                  <select
                    value={vmOperator || ''}
                    onChange={(e) => {
                      const selectedOp = e.target.value as 'mtn' | 'moov' | 'celtiis' | ''
                      if (selectedOp) {
                        setVmOperator(selectedOp)
                        localStorage.setItem('momo_vm_operator', selectedOp)
                      }
                    }}
                    className={`p-1 px-1.5 rounded-lg border text-[9px] font-bold focus:outline-none transition-all cursor-pointer ${
                      isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
                    }`}
                  >
                    <option value="mtn">🟡 MTN MoMo</option>
                    <option value="moov">🔵 Moov Money</option>
                    <option value="celtiis">🟢 Celtiis Cash</option>
                  </select>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">Écart Comptable</span>
                  {ecart === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-500 mt-0.5">
                      <CheckCircle className="size-3.5 fill-emerald-500/10" /> Solde équilibré
                    </span>
                  ) : ecart > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-400 mt-0.5 bg-cyan-950/20 px-2.5 py-0.5 rounded-lg border border-cyan-800/30">
                      Surplus : +{ecart.toLocaleString('fr-FR')} F
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 mt-0.5 bg-rose-950/20 px-2.5 py-0.5 rounded-lg border border-rose-800/30 animate-pulse">
                      <AlertCircle className="size-3.5" /> Manquant : {ecart.toLocaleString('fr-FR')} F
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Solde global display */}
            <div className="text-center py-2 mb-2 relative z-10">
              <h2 className="text-4xl font-serif font-black tracking-tight text-natural-accent">
                {totalActifReel.toLocaleString('fr-FR')} <span className="text-lg font-sans font-medium text-stone-500">FCFA Actif</span>
              </h2>
              {ecart !== 0 && (
                <p className="text-[9.5px] text-stone-500 mt-1.5 max-w-xs mx-auto leading-normal">
                  ⚠️ Si le solde ne correspond pas à vos <strong>{sommeConfiee.toLocaleString('fr-FR')} F</strong> confiés, vérifiez quelle vente vous avez oublié de notifier (Espèces vs Crédit).
                </p>
              )}
            </div>

            {/* PREMIUM BALANCE GRID (CAISSIER STYLE) */}
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {/* Virtual Account SIM */}
              <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
                isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
              }`}>
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold mb-1.5 uppercase tracking-wider ${
                  vmOperator === 'mtn' ? 'text-amber-500' : vmOperator === 'moov' ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  <span className={`size-2 rounded-full ${
                    vmOperator === 'mtn' ? 'bg-amber-400 shadow-sm shadow-amber-400'
                    : vmOperator === 'moov' ? 'bg-blue-500 shadow-sm shadow-blue-500'
                    : 'bg-emerald-500 shadow-sm shadow-emerald-500'
                  }`} />
                  SIM {vmOperator?.toUpperCase()} (Virtuel)
                </span>
                {isEditingVirtuel ? (
                  <form onSubmit={handleUpdateVirtuel} className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      value={virtuelInput}
                      onChange={e => setVirtuelInput(e.target.value)}
                      className={`px-1.5 py-0.5 border rounded-lg text-xs font-mono w-20 focus:outline-none ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-900'
                      }`}
                    />
                    <button type="submit" className="text-[8px] bg-natural-accent text-[#0A0F0D] px-1.5 py-0.5 rounded font-black cursor-pointer">OK</button>
                    <button type="button" onClick={() => setIsEditingVirtuel(false)} className="text-[8px] text-stone-500 hover:text-stone-300 px-1 py-0.5 cursor-pointer">X</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className={`font-mono font-bold text-base ${
                      vmOperator === 'mtn' ? 'text-amber-500' : vmOperator === 'moov' ? 'text-blue-500' : 'text-emerald-500'
                    }`}>
                      {virtualAvailable.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (vmOperator) {
                          setVirtuelInput(vmBalances[vmOperator].toString())
                          setIsEditingVirtuel(true)
                        }
                      }}
                      className="text-stone-500 hover:text-natural-accent transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="size-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cash en Poche */}
              <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
                isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
              }`}>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-purple-400 mb-1.5 uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500" />
                  Cash en Poche (Espèces)
                </span>
                {isEditingCash ? (
                  <form onSubmit={handleUpdateCash} className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      value={cashInput}
                      onChange={e => setCashInput(e.target.value)}
                      className={`px-1.5 py-0.5 border rounded-lg text-xs font-mono w-20 focus:outline-none ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-900'
                      }`}
                    />
                    <button type="submit" className="text-[8px] bg-natural-accent text-[#0A0F0D] px-1.5 py-0.5 rounded font-black cursor-pointer">OK</button>
                    <button type="button" onClick={() => setIsEditingCash(false)} className="text-[8px] text-stone-500 hover:text-stone-300 px-1 py-0.5 cursor-pointer">X</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="font-mono font-bold text-base text-purple-400">
                      {vmBalances.cash.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                    </div>
                    <button 
                      onClick={() => {
                        setCashInput(vmBalances.cash.toString())
                        setIsEditingCash(true)
                      }}
                      className="text-stone-500 hover:text-natural-accent transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="size-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Argent dehors */}
              <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
                isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
              }`}>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-500 mb-1.5 uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
                  Argent Dehors (Créances)
                </span>
                <div className="font-mono font-bold text-base text-amber-500">
                  {totalDehors.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                </div>
              </div>

              {/* Capital Confié */}
              <div className={`p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${
                isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-white border-[#E4DFD5]'
              }`}>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-natural-accent mb-1.5 uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-natural-accent shadow-sm shadow-natural-accent" />
                  Somme Confiée (Réseau)
                </span>
                {isEditingSomme ? (
                  <form onSubmit={handleUpdateSommeConfiee} className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      value={sommeInput}
                      onChange={e => setSommeInput(e.target.value)}
                      className={`px-1.5 py-0.5 border rounded-lg text-xs font-mono w-20 focus:outline-none ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-900'
                      }`}
                    />
                    <button type="submit" className="text-[8px] bg-natural-accent text-[#0A0F0D] px-1.5 py-0.5 rounded font-black">OK</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="font-mono font-bold text-base text-stone-300">
                      {sommeConfiee.toLocaleString('fr-FR')} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
                    </div>
                    <button 
                      onClick={() => setIsEditingSomme(true)}
                      className="text-stone-500 hover:text-natural-accent transition-colors"
                      title="Modifier"
                    >
                      <Edit3 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 2. OUTSTANDING CREDIT LEDGER ("ARGENT DEHORS" GROUPED BY ENTERPRISE) */}
          <section className={`p-5 rounded-[28px] border flex flex-col gap-3.5 ${
            isDark ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
          }`}>
            <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 px-1">
              <Clock className="size-4 text-natural-accent" />
              Créances Terrain & Solde Dehors par Entreprise
            </h3>
            <p className="text-[10px] text-stone-500 -mt-2 px-1">
              Liste des entreprises ayant des soldes dehors. Réclamez et encaissez en cash.
            </p>

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
              {Object.keys(groupedDehors).length > 0 ? (
                Object.keys(groupedDehors).map(clientKey => {
                  const client = groupedDehors[clientKey];
                  const isExpanded = !!expandedClients[clientKey];

                  return (
                    <div key={clientKey} className={`p-3.5 rounded-2xl border flex flex-col gap-3 transition-all ${
                      isDark ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                    }`}>
                      {/* Group Header (Client Name & Total Balance) */}
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-stone-200 dark:text-stone-300 text-xs flex items-center gap-1.5">
                            🏢 {client.name}
                          </span>
                          <span className="font-mono text-[9px] text-stone-500 mt-0.5">{client.phone}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-amber-500 block">
                            {client.totalAmount.toLocaleString('fr-FR')} F
                          </span>
                          <span className="text-[8px] text-stone-500 block">{client.items.length} opération(s)</span>
                        </div>
                      </div>

                      {/* Group Action Buttons */}
                      <div className="flex justify-between items-center border-t border-stone-500/5 pt-2.5">
                        <button
                          type="button"
                          onClick={() => toggleClientExpand(clientKey)}
                          className="text-[9px] font-bold text-natural-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? '▲ Masquer détails' : `▼ Voir détails (${client.items.length})`}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleRecoverAllForClient(clientKey)}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-emerald-500 text-[#0A0F0D] hover:bg-emerald-450 active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Coins className="size-3" /> Tout Encaisser (Cash)
                        </button>
                      </div>

                      {/* Expanded Details List */}
                      {isExpanded && (
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-stone-500/10 pl-2">
                          {client.items.map(item => (
                            <div key={item.id} className={`p-2.5 rounded-xl border flex justify-between items-center text-[10px] ${
                              isDark ? 'bg-[#0E1B15]/40 border-stone-850' : 'bg-white border-stone-200 shadow-2xs'
                            }`}>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  {renderOperatorBadge(item.operator)}
                                  <span className="font-mono text-[9px] text-stone-500">{item.date} {item.time}</span>
                                </div>
                                <span className="font-mono font-bold text-stone-300 dark:text-stone-400 mt-0.5">
                                  {item.amount.toLocaleString('fr-FR')} FCFA
                                </span>
                              </div>
                              
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRecoverCredit(item)}
                                  className="px-2 py-1 rounded bg-stone-100 dark:bg-[#0E1B15] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-bold hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer"
                                  title="Encaisser cette transaction"
                                >
                                  Encaisser
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelCredit(item.id)}
                                  className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  title="Annuler"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={`text-center py-8 border border-dashed rounded-2xl ${
                  isDark ? 'border-stone-800 text-stone-600' : 'border-stone-300 text-stone-400'
                } text-[10px] italic`}>
                  Aucun crédit ou solde dehors pour le moment. Tout est équilibré !
                </div>
              )}
            </div>
          </section>

          {/* 3. CONTACTS ENTREPRISES + VENTE RAPIDE */}
          <section className={`p-5 rounded-[28px] border flex flex-col gap-4 ${
            isDark ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
          }`}>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2">
                  💼 Contacts Entreprises
                </h3>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  Clique sur une entreprise pour une vente rapide
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClientManager(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                  isDark ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                <Plus className="size-3" />
                Ajouter
              </button>
            </div>

            {/* Add client form (collapsible) */}
            {showClientManager && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newClientName.trim() || !newClientPhone.trim()) return
                  syncAddVmClient(newClientName, newClientPhone)
                  setNewClientName('')
                  setNewClientPhone('')
                  setShowClientManager(false)
                }}
                className={`flex flex-col gap-2 p-4 rounded-2xl border ${
                  isDark ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <p className="text-[9px] font-black text-natural-accent uppercase tracking-widest">Nouvelle entreprise cliente</p>
                <input
                  type="text"
                  required
                  placeholder="Nom de l'entreprise (ex: SOGEMA SARL)"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className={`p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-[#DCD6CD] text-[#111614]'
                  }`}
                />
                <input
                  type="tel"
                  required
                  placeholder="Numéro MoMo (ex: 0122334455)"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className={`p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-[#DCD6CD] text-[#111614]'
                  }`}
                />
                <div className="flex gap-2">
                  <Button variant="premium" type="submit" className="flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer">
                    Enregistrer
                  </Button>
                  <button type="button" onClick={() => setShowClientManager(false)}
                    className={`px-4 py-2 rounded-xl border text-xs cursor-pointer ${
                      isDark ? 'border-[#1C2C22] text-stone-400' : 'border-stone-200 text-stone-500'
                    }`}>
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Contacts list */}
            {vmClients.length > 0 ? (
              <div className="flex flex-col gap-2">
                {vmClients.map(client => {
                  const isSelected = quickSaleClientId === client.id
                  const clientHistory = transactions.filter(t =>
                    t.clientName === client.name && t.category.startsWith('Vente Mobile')
                  ).slice(-5).reverse()

                  return (
                    <div key={client.id} className={`rounded-2xl border overflow-hidden transition-all ${
                      isSelected
                        ? isDark ? 'border-natural-accent/50 bg-[#0E1B15]' : 'border-natural-accent/60 bg-amber-50/40'
                        : isDark ? 'border-[#1C2C22] bg-[#050807]/40' : 'border-stone-200 bg-white'
                    }`}>
                      {/* Client row - click to select for quick sale */}
                      <div className="flex items-center justify-between p-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setQuickSaleClientId(null)
                              setQuickSaleAmount('')
                            } else {
                              setQuickSaleClientId(client.id)
                              setQuickSaleAmount('')
                              setQuickSaleType('deposit')
                              setQuickSalePayType('cash')
                            }
                          }}
                          className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                        >
                          <div className={`size-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isSelected ? 'bg-natural-accent text-[#0A0F0D]' : isDark ? 'bg-[#1C2C22] text-natural-accent' : 'bg-amber-50 text-natural-accent'
                          }`}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-bold text-xs truncate ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                              {client.name}
                            </span>
                            <span className="font-mono text-[10px] text-stone-500">{client.phone}</span>
                          </div>
                          {isSelected && (
                            <span className="ml-auto text-[9px] font-black text-natural-accent bg-natural-accent/10 border border-natural-accent/25 px-2 py-0.5 rounded-full shrink-0">
                              SÉLECTIONNÉ
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer l'entreprise "${client.name}" de vos contacts ?`)) {
                              if (quickSaleClientId === client.id) setQuickSaleClientId(null)
                              syncDeleteVmClient(client.id)
                            }
                          }}
                          className="p-1.5 ml-2 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                          title="Supprimer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {/* INLINE QUICK SALE PANEL */}
                      {isSelected && (
                        <div className={`border-t px-4 pb-4 pt-3.5 flex flex-col gap-3.5 ${
                          isDark ? 'border-natural-accent/20' : 'border-natural-accent/25'
                        }`}>

                          {/* Transaction type selector */}
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setQuickSaleType('deposit')}
                              className={`py-2.5 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                quickSaleType === 'deposit' ? 'bg-natural-accent text-[#0A0F0D] border-transparent' : isDark ? 'border-stone-800 text-stone-400' : 'border-stone-300 text-stone-600'
                              }`}>
                              <ArrowDownLeft className="size-3.5 stroke-[3px]" /> Envoi
                            </button>
                            <button type="button" onClick={() => setQuickSaleType('withdrawal')}
                              className={`py-2.5 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                quickSaleType === 'withdrawal' ? 'bg-rose-500 text-white border-transparent' : isDark ? 'border-stone-800 text-stone-400' : 'border-stone-300 text-stone-600'
                              }`}>
                              <ArrowUpRight className="size-3.5 stroke-[3px]" /> Retrait
                            </button>
                          </div>

                          {/* Payment type (only for envoi) */}
                          {quickSaleType === 'deposit' && (
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setQuickSalePayType('cash')}
                                className={`py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer ${
                                  quickSalePayType === 'cash' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : isDark ? 'border-stone-800 text-stone-500' : 'border-stone-300 text-stone-500'
                                }`}>
                                💵 Cash Direct
                              </button>
                              <button type="button" onClick={() => setQuickSalePayType('credit')}
                                className={`py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer ${
                                  quickSalePayType === 'credit' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : isDark ? 'border-stone-800 text-stone-500' : 'border-stone-300 text-stone-500'
                                }`}>
                                ⏱ Crédit
                              </button>
                            </div>
                          )}

                          {/* Amount + submit */}
                          <form onSubmit={handleQuickSale} className="flex gap-2 items-stretch">
                            <input
                              type="number"
                              required
                              autoFocus
                              placeholder="Montant FCFA"
                              value={quickSaleAmount}
                              onChange={e => setQuickSaleAmount(e.target.value)}
                              className={`flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm font-mono font-bold ${
                                isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-[#DCD6CD] text-[#111614]'
                              }`}
                            />
                            <Button
                              variant={quickSaleType === 'deposit' ? 'premium' : 'destructive'}
                              type="submit"
                              loading={quickLoading}
                              className="px-5 py-3 rounded-xl font-bold text-xs cursor-pointer shrink-0"
                            >
                              OK
                            </Button>
                          </form>

                          {/* Mini historique (5 dernières transactions) */}
                          {clientHistory.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Historique récent</p>
                              {clientHistory.map(txn => (
                                <div key={txn.id} className={`flex justify-between items-center px-3 py-2 rounded-lg border text-[10px] ${
                                  isDark ? 'bg-[#0A0F0D] border-stone-900' : 'bg-stone-50 border-stone-100'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-black ${
                                      txn.type === 'deposit' ? 'text-cyan-400' : 'text-rose-400'
                                    }`}>
                                      {txn.type === 'deposit' ? '↙' : '↗'}
                                    </span>
                                    <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>
                                      {txn.date} {txn.time}
                                    </span>
                                    {txn.category === 'Vente Mobile VM (Crédit Dehors)' && (
                                      <span className="text-[8px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/25">Dehors</span>
                                    )}
                                  </div>
                                  <span className={`font-mono font-bold ${
                                    txn.type === 'deposit' ? 'text-cyan-400' : 'text-rose-400'
                                  }`}>
                                    {txn.type === 'deposit' ? '+' : ''}{txn.amount.toLocaleString('fr-FR')} F
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={`text-center py-8 border border-dashed rounded-2xl text-[10px] ${
                isDark ? 'border-stone-800 text-stone-600' : 'border-stone-300 text-stone-400'
              }`}>
                <p className="text-2xl mb-2">🏢</p>
                <p className="font-bold">Aucune entreprise enregistrée</p>
                <p className="opacity-60 mt-1">Clique sur « Ajouter » pour créer votre premier contact</p>
              </div>
            )}
          </section>

          {/* 4. TRANSACTION ENGINE */}
          <section className="flex flex-col gap-3">
            <div className="px-1">
              <h3 className="text-sm font-bold font-serif uppercase text-natural-accent">Mes Opérations Terrain</h3>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Enregistre chaque transaction avec ton client</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setVmActionType('deposit')}
                className={`p-5 rounded-[28px] text-left flex flex-col justify-between h-32 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  vmActionType === 'deposit'
                    ? 'bg-natural-accent text-[#0A0F0D]'
                    : isDark
                      ? 'border border-[#1C2C22] bg-[#0E1B15] text-white hover:bg-[#12241C]'
                      : 'border border-[#DCD6CD] bg-white text-[#111614] hover:bg-stone-50'
                }`}
              >
                <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${vmActionType === 'deposit' ? 'text-[#0A0F0D]' : 'text-natural-accent'}`}>
                  <ArrowDownLeft className="size-4.5 stroke-[3px]" />
                  Client → Envoi
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
                    : isDark
                      ? 'border border-[#1C2C22] bg-[#0E1B15] text-white hover:bg-[#12241C]'
                      : 'border border-[#DCD6CD] bg-white text-[#111614] hover:bg-stone-50'
                }`}
              >
                <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${vmActionType === 'withdrawal' ? 'text-[#0A0F0D]' : 'text-rose-500'}`}>
                  <ArrowUpRight className="size-4.5 stroke-[3px]" />
                  Retrait → Client
                </div>
                <div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest ${vmActionType === 'withdrawal' ? 'opacity-70' : 'text-stone-500'}`}>Client veut du cash</div>
                  <div className={`text-[8px] mt-0.5 ${vmActionType === 'withdrawal' ? 'opacity-60' : 'text-stone-400'}`}>Je prends son virtuel, lui donne l'espèce</div>
                </div>
              </button>
            </div>

            {vmActionType && (
              <form onSubmit={handleVmTransaction} className={`p-5 rounded-[28px] border flex flex-col gap-4 mt-1 ${
                isDark ? 'bg-[#0E1B15]/60 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
              }`}>

                {/* Switch Paid Cash / On Credit (Only for Deposit/Envoi) */}
                {vmActionType === 'deposit' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Règlement client</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType('cash')}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                          paymentType === 'cash'
                            ? 'bg-natural-accent text-[#0A0F0D] border-transparent'
                            : isDark ? 'border-stone-850 text-stone-400' : 'border-stone-300 text-stone-600'
                        }`}
                      >
                        💵 Cash Direct
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('credit')}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                          paymentType === 'credit'
                            ? 'bg-amber-500 text-[#0A0F0D] border-transparent'
                            : isDark ? 'border-stone-850 text-stone-400' : 'border-stone-300 text-stone-600'
                        }`}
                      >
                        ⏱ Crédit (Dehors)
                      </button>
                    </div>
                  </div>
                )}

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
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
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
                      isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                {/* Client Name Input for unregistered clients */}
                {selectedClientId === '' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Nom de l'Entreprise <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: SOGEMA SARL"
                      value={clientNameInput}
                      onChange={e => setClientNameInput(e.target.value)}
                      className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm ${
                        isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                      }`}
                    />
                    <span className="text-[8px] text-stone-400">
                      L'entreprise sera automatiquement enregistrée dans vos contacts si elle est nouvelle.
                    </span>
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
                    className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-accent/30 text-sm font-mono font-bold ${
                      isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
                    }`}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="premium" type="submit" loading={loading} className="flex-1 cursor-pointer font-bold py-3.5">
                    Confirmer
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setVmActionType(null)
                      setPaymentType('cash')
                    }}
                    className={`px-5 rounded-xl border font-bold text-xs cursor-pointer ${
                      isDark ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 5. POINT AGENCE */}
          <section className={`p-6 rounded-[32px] border transition-colors ${
            isDark ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
          }`}>
            <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-1">
              <Building className="size-4.5" />
              Point Agence
            </h3>
            <p className={`text-[10px] mb-5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              À l'agence : remets tes espèces collectées et recharge ton virtuel pour continuer à servir tes clients
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const op = vmOperator || 'mtn'
                  const defaultOpStr = vmOperator ? vmOperator.toUpperCase() : 'MTN'
                  const amountStr = prompt(`Montant d'espèces remis à l'agence pour recharge virtuelle (FCFA) :`)
                  if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) return
                  const amt = Number(amountStr)
                  if (amt > vmBalances.cash) {
                    alert("Erreur: Le montant d'espèces saisi dépasse votre cash disponible en poche.")
                    return
                  }
                  
                  const opChoice = prompt(`Sur quel réseau voulez-vous recevoir le virtuel ?\nSaisissez mtn, moov, ou celtiis (Par défaut: ${defaultOpStr}) :`, op)
                  if (opChoice === null) return
                  
                  const selectedOp = opChoice.trim().toLowerCase() as 'mtn' | 'moov' | 'celtiis'
                  if (!['mtn', 'moov', 'celtiis'].includes(selectedOp)) {
                    alert("Réseau invalide ! Veuillez saisir mtn, moov ou celtiis.")
                    return
                  }
                  
                  const newVm = {
                    ...vmBalances,
                    cash: vmBalances.cash - amt,
                    [selectedOp]: (vmBalances as any)[selectedOp] + amt
                  }
                  setVmBalances(newVm)
                  localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
                  
                  // Also log this transaction to the VM day journal for tracing
                  const newTxn: Transaction = {
                    id: 'agency-swap-' + Date.now(),
                    phone: 'AGENCE',
                    amount: amt,
                    operator: selectedOp,
                    type: 'withdrawal', // withdrawal of cash from pocket
                    category: `Vente Mobile (Échange Cash ➔ Virtuel ${selectedOp.toUpperCase()})`,
                    date: TODAY_STR,
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    clientName: 'AGENCE ROTATION'
                  }
                  syncAddTransaction(newTxn)
                  
                  alert(`Rotation effectuée !\nRemis à l'agence: -${amt.toLocaleString('fr-FR')} FCFA Cash\nReçu sur SIM: +${amt.toLocaleString('fr-FR')} FCFA virtuel ${selectedOp.toUpperCase()}`)
                }}
                className={`p-4 rounded-[24px] border text-left flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isDark ? 'border-[#1C2C22] bg-[#050807]/60 hover:border-natural-accent/45' : 'border-[#DCD6CD] bg-stone-50 hover:border-[#8C7A5C]'
                }`}
              >
                <div className="flex items-center gap-2 text-natural-accent">
                  <Building className="size-4 stroke-[2.5px]" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Échanger Cash contre Virtuel</span>
                </div>
                <p className={`text-[10px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Remets ton cash collecté à l'agence, elle te le recharge immédiatement en virtuel sur ton téléphone.
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono mt-1">
                  <span className={isDark ? 'text-stone-500' : 'text-stone-500'}>
                    Cash dispo : <strong className="text-purple-400">{vmBalances.cash.toLocaleString('fr-FR')} F</strong>
                  </span>
                  <span className={isDark ? 'text-stone-500' : 'text-stone-500'}>
                    Virtuel SIM : <strong className="text-natural-accent">{(vmBalances.mtn + vmBalances.moov + vmBalances.celtiis).toLocaleString('fr-FR')} F</strong>
                  </span>
                </div>
              </button>
            </div>

            {/* Bilan journée */}
            <div className={`mt-4 p-4 rounded-2xl border flex flex-col gap-2.5 ${
              isDark ? 'bg-[#050807]/40 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
            }`}>
              <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Rotation & Crédits de la journée</p>
              
              <div className="flex justify-between text-xs">
                <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Cash encaissé (Envois clients)</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{transactions.filter(t => t.category === 'Vente Mobile VM (Cash)' && t.type === 'deposit' && t.date === TODAY_STR).reduce((a, t) => a + t.amount, 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Cash décaissé (Retraits clients)</span>
                <span className="font-mono font-bold text-rose-450">
                  -{transactions.filter(t => t.category.startsWith('Vente Mobile') && t.type === 'withdrawal' && t.date === TODAY_STR).reduce((a, t) => a + t.amount, 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="border-t border-stone-800/40 my-0.5" />

              <div className="flex justify-between text-xs">
                <span className="text-amber-500 font-medium">Somme dehors à récupérer (Crédits du jour)</span>
                <span className="font-mono font-bold text-amber-500">
                  {(() => {
                    const credits = transactions.filter(t => t.category === 'Vente Mobile VM (Crédit Dehors)' && t.type === 'deposit' && t.date === TODAY_STR).reduce((a, t) => a + t.amount, 0);
                    const recov = transactions.filter(t => (t.id.startsWith('RECOV-') || t.category.includes('Encaissement') || t.category.includes('Règlement Global')) && t.date === TODAY_STR).reduce((a, t) => a + t.amount, 0);
                    return Math.max(0, credits - recov).toLocaleString('fr-FR');
                  })()} FCFA
                </span>
              </div>
            </div>
          </section>

          {/* 6. JOURNAL DU JOUR */}
          <section className="flex flex-col gap-3">
            <div className="px-1">
              <h3 className="text-sm font-bold font-serif uppercase text-natural-accent">Mon Journal du Jour</h3>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Toutes mes opérations enregistrées aujourd'hui</p>
            </div>
            <div className="flex flex-col gap-3">
              {transactions.filter(t => t.category.startsWith('Vente Mobile') && t.date === TODAY_STR).length > 0 ? (
                transactions
                  .filter(t => t.category.startsWith('Vente Mobile') && t.date === TODAY_STR)
                  .map(txn => (
                    <div key={txn.id} className={`p-4 rounded-2xl border flex justify-between items-center ${
                      isDark ? 'border-[#1C2C22] bg-[#0E1B15]/20' : 'border-[#DCD6CD] bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          txn.type === 'deposit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {txn.type === 'deposit' ? 'ENVOI' : 'RETRAIT'}
                        </span>
                        {renderOperatorBadge(txn.operator)}
                        <span className="text-[10px] font-mono text-stone-500">
                          {txn.clientName ? `${txn.clientName} (${txn.phone})` : txn.phone} · {txn.time}
                        </span>
                        {txn.category === 'Vente Mobile VM (Crédit Dehors)' && (
                          <span className="text-[9px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Dehors
                          </span>
                        )}
                      </div>
                      <div className={`font-mono font-bold text-xs ${txn.type === 'deposit' ? 'text-cyan-400' : 'text-rose-400'}`}>
                        {txn.amount.toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  ))
              ) : (
                <div className={`text-center py-10 rounded-2xl border ${
                  isDark ? 'border-[#1C2C22] bg-[#0E1B15]/10 text-stone-500' : 'border-stone-200 bg-stone-50 text-stone-400'
                } text-xs`}>
                  <p className="text-2xl mb-2">🛵</p>
                  <p className="font-bold">Aucune opération enregistrée aujourd'hui</p>
                  <p className="text-[10px] mt-1 opacity-60">Utilise les boutons ci-dessus pour enregistrer tes transactions</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
