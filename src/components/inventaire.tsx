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
  Info
} from 'lucide-react'
import { Button } from './ui/button'
import { Inventory } from '../types'
import { getSupabase } from '../lib/supabase'

interface InventaireProps {
  theme: 'dark' | 'light';
  role: 'proprio' | 'employe' | 'vm' | 'vm_hybrid';
  activeCabinId: string | null;
  profile: any;
  balances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
}

export function Inventaire({
  theme,
  role,
  activeCabinId,
  profile,
  balances
}: InventaireProps) {
  // Input states
  const [physMtn, setPhysMtn] = useState('')
  const [physMoov, setPhysMoov] = useState('')
  const [physCeltiis, setPhysCeltiis] = useState('')
  const [physCash, setPhysCash] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [fetchLoading, setFetchLoading] = useState(false)

  // System balances helper
  const sysMtn = balances.mtn
  const sysMoov = balances.moov
  const sysCeltiis = balances.celtiis
  const sysCash = balances.cash

  // Diff calculations
  const diffMtn = useMemo(() => {
    const val = parseFloat(physMtn)
    return isNaN(val) ? 0 : val - sysMtn
  }, [physMtn, sysMtn])

  const diffMoov = useMemo(() => {
    const val = parseFloat(physMoov)
    return isNaN(val) ? 0 : val - sysMoov
  }, [physMoov, sysMoov])

  const diffCeltiis = useMemo(() => {
    const val = parseFloat(physCeltiis)
    return isNaN(val) ? 0 : val - sysCeltiis
  }, [physCeltiis, sysCeltiis])

  const diffCash = useMemo(() => {
    const val = parseFloat(physCash)
    return isNaN(val) ? 0 : val - sysCash
  }, [physCash, sysCash])

  const totalDiff = diffMtn + diffMoov + diffCeltiis + diffCash

  // Fetch recent inventories
  const fetchInventories = async () => {
    if (!activeCabinId) return
    setFetchLoading(true)
    const client = getSupabase()
    if (!client) {
      // Local fallback
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
        // Fetch creator profiles dynamically
        const creatorIds = Array.from(new Set(data.map(i => i.created_by)))
        const { data: profiles } = await client
          .from('momo_profiles')
          .select('id, name')
          .in('id', creatorIds)

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

  useEffect(() => {
    fetchInventories()
  }, [activeCabinId])

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
      // Local mock save
      const mockInvWithId = { id: `inv-${Date.now()}`, ...newInv }
      const updated = [mockInvWithId, ...inventories]
      setInventories(updated)
      localStorage.setItem(`momo_inventories_${activeCabinId}`, JSON.stringify(updated))
      alert("Rapport d'inventaire enregistré localement (Offline Safe) !")
    }

    // Reset inputs
    setPhysMtn('')
    setPhysMoov('')
    setPhysCeltiis('')
    setPhysCash('')
    setLoading(false)
    fetchInventories()
  }

  const renderDiffBadge = (diff: number) => {
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="size-3" />
          Équilibré
        </span>
      )
    }
    if (diff < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="size-3" />
          {diff.toLocaleString('fr-FR')} FCFA (Manquant)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="size-3" />
        +{diff.toLocaleString('fr-FR')} FCFA (Excédent)
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Introduction Card */}
      <section className={`p-6 rounded-[36px] border relative overflow-hidden transition-all ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-[#0E1B15] to-[#050807] border-[#1C2C22] shadow-2xl'
          : 'bg-gradient-to-b from-white to-[#F2EFE9] border-[#DCD6CD] shadow-md'
      }`}>
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/5 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 z-10 relative">
          <div className={`size-12 rounded-2xl flex items-center justify-center ${
            theme === 'dark' ? 'bg-[#050807] border border-[#1C2C22] text-[#D4AF37]' : 'bg-stone-50 border border-stone-200 text-[#D4AF37]'
          }`}>
            <Sliders className="size-6" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-natural-accent mb-1">Contrôle d'Inventaire Physique</h2>
            <p className={`text-xs leading-relaxed max-w-xl ${
              theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Comparez les fonds physiques disponibles dans la cabine (billets dans le tiroir et soldes affichés sur vos téléphones) avec les soldes virtuels calculés par l'application pour détecter les écarts de caisse.
            </p>
          </div>
        </div>
      </section>

      {/* Main Inventory Entry Form */}
      <section className={`p-6 rounded-[32px] border transition-colors ${
        theme === 'dark' ? 'bg-[#0E1B15]/40 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        <h3 className="text-sm font-bold font-serif uppercase text-natural-accent flex items-center gap-2 mb-4">
          <Coins className="size-4.5" />
          Saisie des Soldes Réels
        </h3>

        <form onSubmit={handleSaveInventory} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* MTN Audit Box */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
              <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">MTN Mobile Money</label>
              <div className="text-[10px] text-stone-500 font-mono mb-2">Virtuel Système: {sysMtn.toLocaleString('fr-FR')} FCFA</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  placeholder="Solde réel sur téléphone"
                  value={physMtn}
                  onChange={e => setPhysMtn(e.target.value)}
                  className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <div className="mt-2.5">{renderDiffBadge(diffMtn)}</div>
            </div>

            {/* MOOV Audit Box */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
              <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Moov Money</label>
              <div className="text-[10px] text-stone-550 font-mono mb-2">Virtuel Système: {sysMoov.toLocaleString('fr-FR')} FCFA</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  placeholder="Solde réel sur téléphone"
                  value={physMoov}
                  onChange={e => setPhysMoov(e.target.value)}
                  className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <div className="mt-2.5">{renderDiffBadge(diffMoov)}</div>
            </div>

            {/* CELTIIS Audit Box */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
              <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">Celtiis Cash</label>
              <div className="text-[10px] text-stone-550 font-mono mb-2">Virtuel Système: {sysCeltiis.toLocaleString('fr-FR')} FCFA</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  placeholder="Solde réel sur téléphone"
                  value={physCeltiis}
                  onChange={e => setPhysCeltiis(e.target.value)}
                  className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <div className="mt-2.5">{renderDiffBadge(diffCeltiis)}</div>
            </div>

            {/* PHYSICAL CASH Audit Box */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#050807]/60 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">Tiroir Cash (Espèces)</label>
              <div className="text-[10px] text-stone-550 font-mono mb-2">Virtuel Système: {sysCash.toLocaleString('fr-FR')} FCFA</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  placeholder="Espèces comptées dans le tiroir"
                  value={physCash}
                  onChange={e => setPhysCash(e.target.value)}
                  className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    theme === 'dark' ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <div className="mt-2.5">{renderDiffBadge(diffCash)}</div>
            </div>

          </div>

          {/* Global discrepancies indicator */}
          <div className={`p-4.5 rounded-[24px] border ${
            totalDiff === 0 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
              : totalDiff < 0 
                ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
          }`}>
            <div className="flex items-center gap-2 mb-1.5 font-serif text-sm font-bold">
              <Info className="size-4" />
              Écart de Caisse Global Estimé
            </div>
            <div className="font-mono text-base font-black">
              {totalDiff === 0 
                ? "Parfaitement équilibré. Aucun écart détecté." 
                : totalDiff < 0 
                  ? `Écart Déficitaire de : ${totalDiff.toLocaleString('fr-FR')} FCFA (manquant physique)`
                  : `Écart Excédentaire de : +${totalDiff.toLocaleString('fr-FR')} FCFA (surplus physique)`
              }
            </div>
          </div>

          <Button variant="premium" type="submit" loading={loading} className="w-full py-3.5 font-bold cursor-pointer rounded-xl text-xs uppercase tracking-wider">
            Enregistrer ce Rapport d'Inventaire
          </Button>
        </form>
      </section>

      {/* Inventories history list */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-sm font-bold uppercase font-serif text-natural-accent flex items-center gap-2">
              <History className="size-4.5" />
              Historique des Inventaires
            </h3>
            <p className="text-[9px] text-stone-500">Les 10 derniers audits de la cabine</p>
          </div>
          <button 
            onClick={fetchInventories}
            disabled={fetchLoading}
            className="p-2 border rounded-xl hover:bg-stone-500/5 text-stone-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${fetchLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {inventories.length > 0 ? (
            inventories.map(inv => {
              const diffM = inv.physical_mtn - inv.system_mtn
              const diffMo = inv.physical_moov - inv.system_moov
              const diffC = inv.physical_celtiis - inv.system_celtiis
              const diffCa = inv.physical_cash - inv.system_cash
              const totD = diffM + diffMo + diffC + diffCa

              return (
                <div 
                  key={inv.id}
                  className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 ${
                    theme === 'dark' ? 'border-[#1C2C22] bg-[#0E1B15]/20' : 'border-[#DCD6CD] bg-white'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-natural-accent" />
                      <span className="text-[10px] font-bold flex items-center gap-1 text-stone-400">
                        <User className="size-3" />
                        {inv.creator_name || 'Gérant'}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono font-bold flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(inv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-stone-500 uppercase">Écart Global:</span>
                      <span className={`text-[10px] font-mono font-black ${
                        totD === 0 ? 'text-emerald-400' : totD < 0 ? 'text-rose-400' : 'text-amber-505'
                      }`}>
                        {totD === 0 ? '0' : totD > 0 ? `+${totD.toLocaleString('fr-FR')}` : totD.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-stone-500/5 text-[10px] font-mono">
                    <div className="flex flex-col">
                      <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">MTN (Phys/Sys)</span>
                      <span className="font-bold text-stone-300">{inv.physical_mtn.toLocaleString('fr-FR')} / {inv.system_mtn.toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">Moov (Phys/Sys)</span>
                      <span className="font-bold text-stone-300">{inv.physical_moov.toLocaleString('fr-FR')} / {inv.system_moov.toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">Celtiis (Phys/Sys)</span>
                      <span className="font-bold text-stone-300">{inv.physical_celtiis.toLocaleString('fr-FR')} / {inv.system_celtiis.toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-stone-500 font-sans text-[8px] uppercase font-bold">Cash (Phys/Sys)</span>
                      <span className="font-bold text-stone-300">{inv.physical_cash.toLocaleString('fr-FR')} / {inv.system_cash.toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-stone-550 text-xs">
              Aucun rapport d'inventaire disponible pour le moment.
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
