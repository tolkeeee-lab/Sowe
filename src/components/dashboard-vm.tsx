"use client";

import { useState } from 'react'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building, 
  Trash2 
} from 'lucide-react'
import { Button } from './ui/button'
import { Transaction, VmClient } from '../types'

interface DashboardVmProps {
  theme: 'dark' | 'light';
  profile: any;
  role: 'proprio' | 'employe' | 'vm' | 'vm_hybrid';
  vmBalances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
  setVmBalances: React.Dispatch<React.SetStateAction<{
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  }>>;
  transactions: Transaction[];
  TODAY_STR: string;
  vmOperator: 'mtn' | 'moov' | 'celtiis' | null;
  setVmOperator: (op: 'mtn' | 'moov' | 'celtiis' | null) => void;
  vmClients: VmClient[];
  syncAddVmClient: (name: string, phone: string) => Promise<void>;
  syncDeleteVmClient: (id: string) => Promise<void>;
  syncAddTransaction: (txn: Transaction) => Promise<void>;
  getLocalDateString: (d?: Date) => string;
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
  vmClients,
  syncAddVmClient,
  syncDeleteVmClient,
  syncAddTransaction,
  getLocalDateString,
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
        await syncAddVmClient(finalClientName, phoneInput)
      }

      await syncAddTransaction(newTxn)
      setVmAmountInput('')
      setPhoneInput('')
      setSelectedClientId('')
      setClientNameInput('')
      setSaveClientCheckbox(false)
      setVmActionType(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
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
                  localStorage.setItem('momo_vm_operator', item.op)
                  // Init balances pour ce seul réseau
                  const newVm = { mtn: 0, moov: 0, celtiis: 0, cash: 0 }
                  setVmBalances(newVm)
                  localStorage.setItem('momo_vm_balances', JSON.stringify(newVm))
                }}
                className={`p-5 rounded-[28px] border text-left flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#1C2C22] bg-[#0E1B15] hover:border-[#D4AF37]/50'
                    : 'border-[#DCD6CD] bg-white hover:border-[#D4AF37]/50 shadow-sm'
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
                + <span className="font-bold text-purple-400">{vmBalances.cash.toLocaleString('fr-FR')} FCFA</span> en poche (espèces)
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
                    : theme === 'dark'
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

            {/* Bilan journée */}
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
                          {txn.clientName ? `${txn.clientName} (${txn.phone})` : txn.phone} · {txn.time}
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
  )
}
