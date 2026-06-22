"use client";

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Smartphone, 
  Zap, 
  Info, 
  Search, 
  X, 
  ShieldAlert, 
  Download, 
  AlertTriangle 
} from 'lucide-react'
import { Button } from './ui/button'
import { Transaction } from '../types'

interface DashboardCaissierProps {
  theme: 'dark' | 'light';
  balances: {
    mtn: number;
    moov: number;
    celtiis: number;
    cash: number;
  };
  transactions: Transaction[];
  blacklist: string[];
  role: 'proprio' | 'employe' | 'vm' | 'vm_hybrid';
  activeTab: 'caissier' | 'vm' | 'proprietaire';
  syncAddTransaction: (txn: Transaction) => Promise<void>;
  syncToggleScamReport: (id: string, isReported: boolean) => Promise<void>;
  setActionType: (type: 'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'adjust_ext' | null) => void;
  setOpInput: (op: 'mtn' | 'moov' | 'celtiis') => void;
  setSelectedForfait: (val: string) => void;
  setActiveReceipt: (txn: Transaction | null) => void;
  renderOperatorBadge: (op: string) => React.ReactNode;
}

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

export function DashboardCaissier({
  theme,
  balances,
  transactions,
  blacklist,
  role,
  activeTab,
  syncAddTransaction,
  syncToggleScamReport,
  setActionType,
  setOpInput,
  setSelectedForfait,
  setActiveReceipt,
  renderOperatorBadge
}: DashboardCaissierProps) {
  // Local states for history filters
  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState<'all' | 'deposit' | 'withdrawal' | 'credit' | 'forfait'>('all')
  const [historyOperator, setHistoryOperator] = useState<'all' | 'mtn' | 'moov' | 'celtiis'>('all')

  // Computed states
  const soldeGlobal = useMemo(() => {
    return balances.mtn + balances.moov + balances.celtiis + balances.cash
  }, [balances])

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
    link.setAttribute('download', `historique_cabine_${new Date().toISOString().slice(0,10)}.csv`)
    link.click()
  }

  return (
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
          className="p-5 rounded-[28px] bg-natural-accent hover:bg-[#c9a430] text-[#0A0F0D] text-left flex flex-col justify-between h-28 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
            <Smartphone className="size-4.5" />
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
            <Zap className="size-4.5" />
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

                  {/* Note / Observation */}
                  {txn.note && (
                    <div className={`text-[10px] px-3 py-2 rounded-xl border italic flex items-start gap-1.5 ${
                      theme === 'dark' ? 'bg-stone-900/40 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'
                    }`}>
                      <span className="shrink-0 mt-0.5 font-bold not-italic text-natural-accent">📝</span>
                      {txn.note}
                    </div>
                  )}

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
  )
}
