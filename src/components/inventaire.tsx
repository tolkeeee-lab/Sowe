"use client";

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Plus, 
  X, 
  Coins, 
  History, 
  User, 
  Calendar,
  Info,
  Smartphone,
  Wallet,
  ArrowRightLeft
} from 'lucide-react'
import { Button } from './ui/button'
import { Inventory } from '../types'
import { getSupabase } from '../lib/supabase'

// ─── VM Inventory snapshot type ───────────────────────────────────────────────
interface VmInventorySnapshot {
  id: string
  date: string
  time: string
  operator: string
  system_virtuel: number
  physical_virtuel: number
  system_cash: number
  physical_cash: number
  dehors_total: number
  capital_confie: number
  ecart_global: number
}

// ─── Shared props ──────────────────────────────────────────────────────────────
interface InventaireProps {
  theme: 'dark' | 'light';
  role: 'proprio' | 'employe' | 'vm';
  activeTab: 'cabine' | 'vm';
  activeCabinId: string | null;
  profile: any;
  balances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// INVENTAIRE CABINE (original logic, unchanged)
// ═════════════════════════════════════════════════════════════════════════════

function InventaireCabine({ theme, activeCabinId, profile, balances }: Omit<InventaireProps, 'activeTab' | 'role'>) {
  const [physMtn, setPhysMtn] = useState('')
  const [physMoov, setPhysMoov] = useState('')
  const [physCeltiis, setPhysCeltiis] = useState('')
  const [physCash, setPhysCash] = useState('')
  const [loading, setLoading] = useState(false)
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [fetchLoading, setFetchLoading] = useState(false)

  const sysMtn = balances.mtn
  const sysMoov = balances.moov
  const sysCeltiis = balances.celtiis
  const sysCash = balances.cash

  const diffMtn = useMemo(() => { const v = parseFloat(physMtn); return isNaN(v) ? 0 : v - sysMtn }, [physMtn, sysMtn])
  const diffMoov = useMemo(() => { const v = parseFloat(physMoov); return isNaN(v) ? 0 : v - sysMoov }, [physMoov, sysMoov])
  const diffCeltiis = useMemo(() => { const v = parseFloat(physCeltiis); return isNaN(v) ? 0 : v - sysCeltiis }, [physCeltiis, sysCeltiis])
  const diffCash = useMemo(() => { const v = parseFloat(physCash); return isNaN(v) ? 0 : v - sysCash }, [physCash, sysCash])
  const totalDiff = diffMtn + diffMoov + diffCeltiis + diffCash

  const fetchInventories = async () => {
    if (!activeCabinId) return
    setFetchLoading(true)
    const client = getSupabase()
    if (!client) {
      const stored = localStorage.getItem(`momo_inventories_${activeCabinId}`)
      if (stored) setInventories(JSON.parse(stored))
      setFetchLoading(false)
      return
    }
    try {
      const { data, error } = await client
        .from('momo_inventories')
        .select('*')
        .eq('cabin_id', activeCabinId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      if (data) {
        const creatorIds = Array.from(new Set(data.map(i => i.created_by)))
        const { data: profiles } = await client.from('momo_profiles').select('id, name').in('id', creatorIds)
        const formatted = data.map(inv => {
          const creator = profiles?.find(p => p.id === inv.created_by)
          return {
            id: inv.id,
            cabin_id: inv.cabin_id,
            created_by: inv.created_by,
            system_mtn: Number(inv.system_mtn),
            physical_mtn: Number(inv.physical_mtn),
            system_moov: Number(inv.system_moov),
            physical_moov: Number(inv.physical_moov),
            system_celtiis: Number(inv.system_celtiis),
            physical_celtiis: Number(inv.physical_celtiis),
            system_cash: Number(inv.system_cash),
            physical_cash: Number(inv.physical_cash),
            created_at: inv.created_at,
            creator_name: creator ? creator.name : 'Utilisateur inconnu'
          }
        })
        setInventories(formatted)
        localStorage.setItem(`momo_inventories_${activeCabinId}`, JSON.stringify(formatted))
      }
    } catch (e) {
      console.error(e)
      const stored = localStorage.getItem(`momo_inventories_${activeCabinId}`)
      if (stored) setInventories(JSON.parse(stored))
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => { fetchInventories() }, [activeCabinId])

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCabinId || !profile?.id) return
    setLoading(true)
    const mtnVal = parseFloat(physMtn)
    const moovVal = parseFloat(physMoov)
    const celtiisVal = parseFloat(physCeltiis)
    const cashVal = parseFloat(physCash)
    if (isNaN(mtnVal) || isNaN(moovVal) || isNaN(celtiisVal) || isNaN(cashVal)) {
      alert("Veuillez renseigner tous les champs de comptage physique.")
      setLoading(false)
      return
    }
    const newInv: Omit<Inventory, 'id'> = {
      cabin_id: activeCabinId,
      created_by: profile.id,
      system_mtn: sysMtn,
      physical_mtn: mtnVal,
      system_moov: sysMoov,
      physical_moov: moovVal,
      system_celtiis: sysCeltiis,
      physical_celtiis: celtiisVal,
      system_cash: sysCash,
      physical_cash: cashVal,
      created_at: new Date().toISOString(),
      creator_name: profile.name
    }
    const client = getSupabase()
    if (client && profile.id !== 'mock-user-id') {
      try {
        const { error } = await client.from('momo_inventories').insert([newInv])
        if (error) throw error
        alert("Rapport d'inventaire enregistré avec succès !")
      } catch (err) {
        console.error(err)
        alert("Erreur lors de la synchronisation Supabase. Enregistrement local effectué.")
      }
    } else {
      const mockInvWithId = { id: `inv-${Date.now()}`, ...newInv }
      const updated = [mockInvWithId, ...inventories]
      setInventories(updated)
      localStorage.setItem(`momo_inventories_${activeCabinId}`, JSON.stringify(updated))
      alert("Rapport d'inventaire enregistré localement (Offline Safe) !")
    }
    setPhysMtn(''); setPhysMoov(''); setPhysCeltiis(''); setPhysCash('')
    setLoading(false)
    fetchInventories()
  }

  const renderDiffBadge = (diff: number) => {
    if (diff === 0) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="size-3" /> Équilibré
      </span>
    )
    if (diff < 0) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertTriangle className="size-3" /> {diff.toLocaleString('fr-FR')} FCFA (Manquant)
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="size-3" /> +{diff.toLocaleString('fr-FR')} FCFA (Excédent)
      </span>
    )
  }

  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col gap-6">
      {/* Intro card */}
      <section className={`p-6 rounded-[36px] border relative overflow-hidden transition-all ${
        isDark ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22] shadow-2xl'
               : 'bg-gradient-to-b from-white to-[#F2EFE9] border-[#DCD6CD] shadow-md'
      }`}>
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 z-10 relative">
          <div className={`size-12 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-[#050807] border border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border border-stone-200 text-[#D4AF37]'
          }`}>
            <Sliders className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap gap-2 items-center mb-1">
              <h2 className="font-serif text-lg font-bold text-natural-accent">Contrôle d'Inventaire Physique</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-widest">
                🗄️ Mode Cabine — Bilan Agence
              </span>
            </div>
            <p className={`text-xs leading-relaxed max-w-xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              Comparez les fonds physiques disponibles dans la cabine (billets dans le tiroir et soldes affichés sur vos téléphones) avec les soldes calculés par l'application pour détecter les écarts de caisse.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        isDark ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-4">
          <Coins className="size-4.5" /> Saisie des Soldes Réels — Cabine
        </h3>
        <form onSubmit={handleSaveInventory} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'MTN Mobile Money', color: 'text-amber-500', sys: sysMtn, val: physMtn, set: setPhysMtn, diff: diffMtn, ph: 'Solde réel MTN sur téléphone' },
              { label: 'Moov Money', color: 'text-blue-500', sys: sysMoov, val: physMoov, set: setPhysMoov, diff: diffMoov, ph: 'Solde réel Moov sur téléphone' },
              { label: 'Celtiis Cash', color: 'text-emerald-500', sys: sysCeltiis, val: physCeltiis, set: setPhysCeltiis, diff: diffCeltiis, ph: 'Solde réel Celtiis sur téléphone' },
              { label: 'Tiroir Cash (Espèces)', color: 'text-purple-400', sys: sysCash, val: physCash, set: setPhysCash, diff: diffCash, ph: 'Espèces comptées dans le tiroir' },
            ].map(item => (
              <div key={item.label} className={`p-4 rounded-2xl border ${isDark ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
                <label className={`text-[10px] font-bold ${item.color} uppercase tracking-wider block mb-1`}>{item.label}</label>
                <div className="text-[10px] text-stone-500 font-mono mb-2">Virtuel Système: {item.sys.toLocaleString('fr-FR')} FCFA</div>
                <input
                  type="number"
                  required
                  placeholder={item.ph}
                  value={item.val}
                  onChange={e => item.set(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
                <div className="mt-2.5">{renderDiffBadge(item.diff)}</div>
              </div>
            ))}
          </div>

          <div className={`p-4.5 rounded-[24px] border ${
            totalDiff === 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : totalDiff < 0 ? 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
          }`}>
            <div className="flex items-center gap-2 mb-1.5 font-serif text-sm font-bold">
              <Info className="size-4" /> Écart de Caisse Global Estimé
            </div>
            <div className="font-mono text-base font-black">
              {totalDiff === 0 ? "Parfaitement équilibré. Aucun écart détecté."
                : totalDiff < 0 ? `Écart Déficitaire de : ${totalDiff.toLocaleString('fr-FR')} FCFA (manquant physique)`
                : `Écart Excédentaire de : +${totalDiff.toLocaleString('fr-FR')} FCFA (surplus physique)`}
            </div>
          </div>

          <Button variant="premium" type="submit" loading={loading} className="w-full py-3.5 font-bold cursor-pointer rounded-xl text-xs uppercase tracking-wider">
            Enregistrer ce Rapport d'Inventaire
          </Button>
        </form>
      </section>

      {/* History */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-sm font-bold uppercase font-serif text-natural-accent flex items-center gap-2">
              <History className="size-4.5" /> Historique des Inventaires
            </h3>
            <p className="text-[9px] text-stone-500">Les 10 derniers audits de la cabine</p>
          </div>
          <button onClick={fetchInventories} disabled={fetchLoading} className="p-2 border rounded-xl hover:bg-stone-500/5 text-stone-400 hover:text-white transition-all cursor-pointer">
            <RefreshCw className={`size-3.5 ${fetchLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {inventories.length > 0 ? inventories.map(inv => {
            const diffM = inv.physical_mtn - inv.system_mtn
            const diffMo = inv.physical_moov - inv.system_moov
            const diffC = inv.physical_celtiis - inv.system_celtiis
            const diffCa = inv.physical_cash - inv.system_cash
            const totD = diffM + diffMo + diffC + diffCa
            return (
              <div key={inv.id} className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 ${
                isDark ? 'border-[#1C2C22] bg-[#0E1B15]/20' : 'border-[#DCD6CD] bg-white'
              }`}>
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-natural-accent" />
                    <span className="text-[10px] font-bold flex items-center gap-1 text-stone-400"><User className="size-3" />{inv.creator_name || 'Gérant'}</span>
                    <span className="text-[10px] text-stone-500 font-mono font-bold flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(inv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Écart Global:</span>
                    <span className={`text-[10px] font-mono font-black ${totD === 0 ? 'text-emerald-400' : totD < 0 ? 'text-rose-400' : 'text-amber-500'}`}>
                      {totD === 0 ? '0' : totD > 0 ? `+${totD.toLocaleString('fr-FR')}` : totD.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-stone-500/5 text-[10px] font-mono">
                  {[
                    { label: 'MTN (Phys/Sys)', p: inv.physical_mtn, s: inv.system_mtn },
                    { label: 'Moov (Phys/Sys)', p: inv.physical_moov, s: inv.system_moov },
                    { label: 'Celtiis (Phys/Sys)', p: inv.physical_celtiis, s: inv.system_celtiis },
                    { label: 'Cash (Phys/Sys)', p: inv.physical_cash, s: inv.system_cash },
                  ].map(col => (
                    <div key={col.label} className="flex flex-col">
                      <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">{col.label}</span>
                      <span className="font-bold text-stone-300">{col.p.toLocaleString('fr-FR')} / {col.s.toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }) : (
            <div className="text-center py-8 text-stone-550 text-xs">
              Aucun rapport d'inventaire disponible pour le moment.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// INVENTAIRE VM  — Logique terrain : 1 SIM active + Cash poche + Créances
// ═════════════════════════════════════════════════════════════════════════════

function InventaireVm({ theme, profile, balances }: Pick<InventaireProps, 'theme' | 'profile' | 'balances'>) {
  const isDark = theme === 'dark'

  // Read VM context from localStorage (operator, capital, dehors)
  const [vmOperator, setVmOperatorState] = useState<'mtn' | 'moov' | 'celtiis' | null>(null)
  const [capitalConfie, setCapitalConfie] = useState(0)
  const [deholrsTotal, setDehorsTotal] = useState(0)

  useEffect(() => {
    const op = localStorage.getItem('momo_vm_operator') as 'mtn' | 'moov' | 'celtiis' | null
    setVmOperatorState(op)
    const cap = parseFloat(localStorage.getItem('momo_vm_somme_confiee') || '0') || 0
    setCapitalConfie(cap)
    const dehors = JSON.parse(localStorage.getItem('momo_vm_dehors_list') || '[]') as { amount: number }[]
    setDehorsTotal(dehors.reduce((s, d) => s + d.amount, 0))
  }, [])

  // System values from props
  const sysVirtuel = vmOperator ? balances[vmOperator] : 0
  const sysCash = balances.cash

  // Physical input states
  const [physVirtuel, setPhysVirtuel] = useState('')
  const [physCash, setPhysCash] = useState('')
  const [loading, setLoading] = useState(false)
  const [snapshots, setSnapshots] = useState<VmInventorySnapshot[]>([])

  // Diff calculations
  const diffVirtuel = useMemo(() => { const v = parseFloat(physVirtuel); return isNaN(v) ? 0 : v - sysVirtuel }, [physVirtuel, sysVirtuel])
  const diffCash = useMemo(() => { const v = parseFloat(physCash); return isNaN(v) ? 0 : v - sysCash }, [physCash, sysCash])
  const totalActifSys = sysVirtuel + sysCash - deholrsTotal
  const ecartCapital = totalActifSys - capitalConfie

  useEffect(() => {
    const stored = localStorage.getItem('momo_vm_inventory_snapshots')
    if (stored) setSnapshots(JSON.parse(stored))
  }, [])

  const handleSaveVmInventory = (e: React.FormEvent) => {
    e.preventDefault()
    const physV = parseFloat(physVirtuel)
    const physC = parseFloat(physCash)
    if (isNaN(physV) || isNaN(physC)) {
      alert("Veuillez saisir tous les montants physiques.")
      return
    }
    setLoading(true)
    const now = new Date()
    const snap: VmInventorySnapshot = {
      id: `vm-inv-${Date.now()}`,
      date: now.toLocaleDateString('fr-FR'),
      time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
      operator: vmOperator || 'N/A',
      system_virtuel: sysVirtuel,
      physical_virtuel: physV,
      system_cash: sysCash,
      physical_cash: physC,
      dehors_total: deholrsTotal,
      capital_confie: capitalConfie,
      ecart_global: (physV + physC + deholrsTotal) - capitalConfie,
    }
    const updated = [snap, ...snapshots].slice(0, 15)
    setSnapshots(updated)
    localStorage.setItem('momo_vm_inventory_snapshots', JSON.stringify(updated))
    setPhysVirtuel('')
    setPhysCash('')
    setLoading(false)
    alert("Rapport d'inventaire VM enregistré localement !")
  }

  const renderDiffBadge = (diff: number) => {
    if (diff === 0) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="size-3" /> Équilibré
      </span>
    )
    if (diff < 0) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertTriangle className="size-3" /> {diff.toLocaleString('fr-FR')} FCFA (Manquant)
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="size-3" /> +{diff.toLocaleString('fr-FR')} FCFA (Excédent)
      </span>
    )
  }

  const opColor = vmOperator === 'mtn' ? 'text-amber-500' : vmOperator === 'moov' ? 'text-blue-500' : 'text-emerald-500'
  const opDot = vmOperator === 'mtn' ? 'bg-amber-400' : vmOperator === 'moov' ? 'bg-blue-500' : 'bg-emerald-500'

  return (
    <div className="flex flex-col gap-6">

      {/* Intro */}
      <section className={`p-6 rounded-[36px] border relative overflow-hidden transition-all ${
        isDark ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22] shadow-2xl'
               : 'bg-gradient-to-b from-white to-[#F2EFE9] border-[#DCD6CD] shadow-md'
      }`}>
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 z-10 relative">
          <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-[#050807] border border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border border-stone-200 text-[#D4AF37]'
          }`}>
            <Smartphone className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap gap-2 items-center mb-1">
              <h2 className="font-serif text-lg font-bold text-natural-accent">Inventaire Terrain — VM</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25 tracking-widest">
                🛵 Bilan Vendeur Motorisé
              </span>
            </div>
            <p className={`text-xs leading-relaxed max-w-xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              Vérifiez votre SIM {vmOperator?.toUpperCase() || 'active'} et l'argent dans votre poche. L'écart capital vous indique si votre bilan terrain correspond à la mise de fonds confiée par le réseau.
            </p>
          </div>
        </div>
      </section>

      {/* Bilan global (read-only dashboard cards) */}
      <section className={`p-5 rounded-[32px] border flex flex-col gap-4 ${
        isDark ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          Soldes Système Actuels (référence)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Virtuel SIM */}
          <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'}`}>
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${opColor}`}>
              <span className={`size-1.5 rounded-full ${opDot}`} />
              SIM {vmOperator?.toUpperCase() || '—'}
            </span>
            <span className={`font-mono font-black text-base ${opColor}`}>{sysVirtuel.toLocaleString('fr-FR')}</span>
            <span className="text-[8px] text-stone-500 font-sans">FCFA virtuel</span>
          </div>
          {/* Cash poche */}
          <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'}`}>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-400">
              <span className="size-1.5 rounded-full bg-purple-500" />
              Cash Poche
            </span>
            <span className="font-mono font-black text-base text-purple-400">{sysCash.toLocaleString('fr-FR')}</span>
            <span className="text-[8px] text-stone-500 font-sans">FCFA espèces</span>
          </div>
          {/* Créances */}
          <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#050807]/60 border-[#1C2C22]' : 'bg-stone-50 border-stone-200'}`}>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Créances Dehors
            </span>
            <span className="font-mono font-black text-base text-amber-500">{deholrsTotal.toLocaleString('fr-FR')}</span>
            <span className="text-[8px] text-stone-500 font-sans">FCFA dehors</span>
          </div>
        </div>

        {/* Capital confié vs actif total */}
        <div className={`p-4 rounded-2xl border mt-1 ${
          ecartCapital === 0 ? 'bg-emerald-500/5 border-emerald-500/20'
          : ecartCapital < 0 ? 'bg-rose-500/5 border-rose-500/20'
          : 'bg-cyan-500/5 border-cyan-500/20'
        }`}>
          <div className="flex justify-between items-center text-xs">
            <div className="flex flex-col gap-0.5">
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Capital Confié par le Réseau</span>
              <span className="font-mono font-bold text-stone-300">{capitalConfie.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <ArrowRightLeft className="size-4 text-stone-500" />
            <div className="flex flex-col gap-0.5 text-right">
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Actif Total (Virtuel + Cash + Dehors)</span>
              <span className="font-mono font-bold text-natural-accent">{totalActifSys.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
          <div className={`mt-3 pt-2.5 border-t border-dashed ${isDark ? 'border-stone-800' : 'border-stone-200'} flex items-center gap-2`}>
            {ecartCapital === 0 ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Bilan parfaitement équilibré avec le capital confié.
              </span>
            ) : ecartCapital < 0 ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-400">
                <AlertTriangle className="size-3.5 animate-pulse" />
                Déficit de {Math.abs(ecartCapital).toLocaleString('fr-FR')} FCFA — vérifiez vos créances ou vos saisies.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-cyan-400">
                <Info className="size-3.5" />
                Surplus de +{ecartCapital.toLocaleString('fr-FR')} FCFA — possible erreur de saisie ou gain non déclaré.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Physical audit form */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        isDark ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-4">
          <Coins className="size-4.5" /> Audit Physique — Comptage Terrain
        </h3>
        <p className={`text-[10px] mb-5 leading-relaxed ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
          Vérifiez le solde réel affiché sur votre téléphone et comptez l'argent que vous avez physiquement en main. Les créances dehors sont incluses automatiquement dans le bilan.
        </p>
        <form onSubmit={handleSaveVmInventory} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Virtuel SIM */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
              <label className={`text-[10px] font-bold ${opColor} uppercase tracking-wider block mb-1`}>
                Solde Réel SIM {vmOperator?.toUpperCase() || '—'} (sur téléphone)
              </label>
              <div className="text-[10px] text-stone-500 font-mono mb-2">
                Virtuel Système: {sysVirtuel.toLocaleString('fr-FR')} FCFA
              </div>
              <input
                type="number"
                required
                placeholder={`Montant affiché sur SIM ${vmOperator?.toUpperCase() || ''}`}
                value={physVirtuel}
                onChange={e => setPhysVirtuel(e.target.value)}
                className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                  isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                }`}
              />
              <div className="mt-2.5">{renderDiffBadge(diffVirtuel)}</div>
            </div>

            {/* Cash poche */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                Espèces Réelles en Poche (Cash)
              </label>
              <div className="text-[10px] text-stone-500 font-mono mb-2">
                Cash Système: {sysCash.toLocaleString('fr-FR')} FCFA
              </div>
              <input
                type="number"
                required
                placeholder="Espèces comptées en main"
                value={physCash}
                onChange={e => setPhysCash(e.target.value)}
                className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                  isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                }`}
              />
              <div className="mt-2.5">{renderDiffBadge(diffCash)}</div>
            </div>
          </div>

          {/* Créances incluses automatiquement */}
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-[#050807]/30 border-amber-900/30' : 'bg-amber-50/50 border-amber-200'}`}>
            <Info className="size-4 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-500 font-medium">
              <strong className="font-black">Créances dehors :</strong> {deholrsTotal.toLocaleString('fr-FR')} FCFA inclus automatiquement dans le bilan total (ne pas recompter).
            </p>
          </div>

          {/* Total écart physique */}
          {(physVirtuel || physCash) && (
            <div className={`p-4 rounded-[20px] border ${
              (diffVirtuel + diffCash) === 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : (diffVirtuel + diffCash) < 0 ? 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
            }`}>
              <div className="flex items-center gap-2 mb-1 font-serif text-sm font-bold">
                <Wallet className="size-4" /> Écart de Saisie Physique vs Système
              </div>
              <div className="font-mono text-base font-black">
                {(diffVirtuel + diffCash) === 0
                  ? 'Parfaitement équilibré avec les soldes système.'
                  : (diffVirtuel + diffCash) < 0
                    ? `Déficit physique: ${(diffVirtuel + diffCash).toLocaleString('fr-FR')} FCFA`
                    : `Excédent physique: +${(diffVirtuel + diffCash).toLocaleString('fr-FR')} FCFA`}
              </div>
            </div>
          )}

          <Button variant="premium" type="submit" loading={loading} className="w-full py-3.5 font-bold cursor-pointer rounded-xl text-xs uppercase tracking-wider">
            Enregistrer ce Rapport d'Inventaire Terrain
          </Button>
        </form>
      </section>

      {/* Historique snapshots VM */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-sm font-bold uppercase font-serif text-natural-accent flex items-center gap-2">
              <History className="size-4.5" /> Historique des Bilans Terrain
            </h3>
            <p className="text-[9px] text-stone-500">Vos 15 derniers audits VM enregistrés en local</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {snapshots.length > 0 ? snapshots.map(snap => (
            <div key={snap.id} className={`p-4 rounded-2xl border flex flex-col gap-3 ${
              isDark ? 'border-[#1C2C22] bg-[#0E1B15]/20' : 'border-[#DCD6CD] bg-white'
            }`}>
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-natural-accent" />
                  <span className="text-[10px] font-bold text-stone-400">
                    {snap.date} à {snap.time} · SIM {snap.operator.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Écart Capital:</span>
                  <span className={`text-[10px] font-mono font-black ${
                    snap.ecart_global === 0 ? 'text-emerald-400' : snap.ecart_global < 0 ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    {snap.ecart_global === 0 ? '0' : snap.ecart_global > 0 ? `+${snap.ecart_global.toLocaleString('fr-FR')}` : snap.ecart_global.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-stone-500/5 text-[10px] font-mono">
                <div className="flex flex-col">
                  <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">SIM {snap.operator.toUpperCase()} (Phys/Sys)</span>
                  <span className="font-bold text-stone-300">{snap.physical_virtuel.toLocaleString('fr-FR')} / {snap.system_virtuel.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">Cash (Phys/Sys)</span>
                  <span className="font-bold text-stone-300">{snap.physical_cash.toLocaleString('fr-FR')} / {snap.system_cash.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">Créances Dehors</span>
                  <span className="font-bold text-amber-500">{snap.dehors_total.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">Capital Confié</span>
                  <span className="font-bold text-natural-accent">{snap.capital_confie.toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className={`text-center py-10 rounded-2xl border border-dashed text-xs ${
              isDark ? 'border-stone-800 text-stone-600' : 'border-stone-300 text-stone-400'
            }`}>
              <p className="text-2xl mb-2">🛵</p>
              <p className="font-bold">Aucun rapport d'inventaire terrain pour le moment</p>
              <p className="opacity-60 mt-1">Remplissez le formulaire ci-dessus pour créer votre premier audit</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT — Routes vers Cabine ou VM selon activeTab
// ═════════════════════════════════════════════════════════════════════════════

export function Inventaire({
  theme,
  role,
  activeTab,
  activeCabinId,
  profile,
  balances
}: InventaireProps) {
  if (activeTab === 'vm') {
    return <InventaireVm theme={theme} profile={profile} balances={balances} />
  }
  return (
    <InventaireCabine
      theme={theme}
      activeCabinId={activeCabinId}
      profile={profile}
      balances={balances}
    />
  )
}
