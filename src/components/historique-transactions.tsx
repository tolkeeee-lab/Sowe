"use client";

import { useState, useMemo } from 'react'
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Smartphone,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { Transaction } from '../types'
import { Button } from './ui/button'

interface HistoriqueTransactionsProps {
  theme: 'dark' | 'light';
  transactions: Transaction[];
  TODAY_STR: string;
  YESTERDAY_STR: string;
  role: 'proprio' | 'employe' | 'vm';
  getWeekRange: (dateStr: string) => { start: string; end: string };
  getLocalDateString: (d?: Date) => string;
  activeTab: 'cabine' | 'vm';
  onViewReceipt?: (txn: Transaction) => void;
  onDeleteTransaction?: (id: string) => Promise<void>;
}

type PeriodType = 'day' | 'week' | 'month' | 'custom';

export function HistoriqueTransactions({
  theme,
  transactions,
  TODAY_STR,
  YESTERDAY_STR,
  role,
  getWeekRange,
  getLocalDateString,
  activeTab,
  onViewReceipt,
  onDeleteTransaction
}: HistoriqueTransactionsProps) {
  const isDark = theme === 'dark'

  // Period filters
  const [periodType, setPeriodType] = useState<PeriodType>('day')
  const [selectedDate, setSelectedDate] = useState(TODAY_STR)
  const [customStart, setCustomStart] = useState(TODAY_STR)
  const [customEnd, setCustomEnd] = useState(TODAY_STR)

  // Advanced search/filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [opFilter, setOpFilter] = useState<'all' | 'mtn' | 'moov' | 'celtiis'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'vmEnvoi' | 'vmRetrait' | 'vmCredit' | 'vmRecov' | 'vmSwap'>('all')
  
  // envFilter is locked to the workspace environment (Cabine vs VM)
  const envFilter = activeTab

  // Parse period labels
  const periodLabel = useMemo(() => {
    if (periodType === 'day') {
      if (selectedDate === TODAY_STR) return "Aujourd'hui"
      if (selectedDate === YESTERDAY_STR) return "Hier"
      const [y, m, d] = selectedDate.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (periodType === 'week') {
      const range = getWeekRange(selectedDate)
      const ds = new Date(range.start)
      const de = new Date(range.end)
      return `Sem. du ${ds.getDate()} ${ds.toLocaleDateString('fr-FR', { month: 'short' })} au ${de.getDate()} ${de.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
    }
    if (periodType === 'month') {
      const [y, m] = selectedDate.split('-').map(Number)
      return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
    return `Période du ${customStart} au ${customEnd}`
  }, [periodType, selectedDate, customStart, customEnd, TODAY_STR, YESTERDAY_STR, getWeekRange])

  // Filter transactions based on date and selections
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 0. Environment (Cabine vs VM) Filter
      const isVm = t.id.startsWith('VM-') || 
                   t.id.startsWith('RECOV-') || 
                   t.id.startsWith('agency-swap-') || 
                   t.category.includes('Vente Mobile') || 
                   t.category.includes('Point Agence') || 
                   t.category.includes('Terrain') || 
                   t.category.includes('Règlement Global') || 
                   t.clientName === 'AGENCE ROTATION';
      if (envFilter === 'vm' && !isVm) return false
      if (envFilter === 'cabine' && isVm) return false

      // 1. Date Range Filter
      let matchesDate = false
      if (periodType === 'day') {
        matchesDate = t.date === selectedDate
      } else if (periodType === 'week') {
        const range = getWeekRange(selectedDate)
        matchesDate = t.date >= range.start && t.date <= range.end
      } else if (periodType === 'month') {
        matchesDate = t.date.startsWith(selectedDate.slice(0, 7))
      } else if (periodType === 'custom') {
        matchesDate = t.date >= customStart && t.date <= customEnd
      }

      if (!matchesDate) return false

      // 2. Operator Filter
      if (opFilter !== 'all' && t.operator !== opFilter) return false

      // 3. Type Filter
      if (typeFilter !== 'all') {
        if (envFilter === 'vm') {
          const isRecov = t.id.startsWith("RECOV-") || t.category.includes("Encaissement") || t.category.includes("Règlement Global");
          const isSwap = t.id.startsWith("agency-swap-") || t.category.includes("Échange") || t.category.includes("Rotation") || t.clientName === "AGENCE ROTATION";
          const isWithdrawal = t.type === "withdrawal";
          const isCredit = t.category.includes("Crédit Dehors") || t.category.includes("Crédit");

          if (typeFilter === 'vmRecov' && !isRecov) return false;
          if (typeFilter === 'vmSwap' && !isSwap) return false;
          if (typeFilter === 'vmRetrait' && (!isWithdrawal || isRecov || isSwap)) return false;
          if (typeFilter === 'vmCredit' && (!isCredit || isRecov || isSwap)) return false;
          if (typeFilter === 'vmEnvoi' && (isRecov || isSwap || isWithdrawal || isCredit)) return false;
        } else {
          if (t.type !== typeFilter) return false;
        }
      }

      // 4. Text Search (Phone, ClientName, ID, Category, Note)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchId = t.id.toLowerCase().includes(query)
        const matchPhone = t.phone.toLowerCase().includes(query)
        const matchClient = t.clientName?.toLowerCase().includes(query) || false
        const matchCat = t.category.toLowerCase().includes(query)
        const matchNote = t.note?.toLowerCase().includes(query) || false
        
        if (!matchId && !matchPhone && !matchClient && !matchCat && !matchNote) {
          return false
        }
      }

      return true
    })
  }, [transactions, periodType, selectedDate, customStart, customEnd, opFilter, typeFilter, searchQuery, envFilter, getWeekRange])

  // Compute stats on filtered list
  const stats = useMemo(() => {
    let depositSum = 0
    let depositCount = 0
    let withdrawalSum = 0
    let withdrawalCount = 0

    filteredTransactions.forEach(t => {
      if (envFilter === 'vm') {
        const isRecov = t.id.startsWith("RECOV-") || t.category.includes("Encaissement") || t.category.includes("Règlement Global");
        const isSwap = t.id.startsWith("agency-swap-") || t.category.includes("Échange") || t.category.includes("Rotation") || t.clientName === "AGENCE ROTATION";
        if (isRecov || isSwap) {
          // Exclude from total CA stats to avoid double counting
        } else if (t.type === 'withdrawal') {
          withdrawalSum += t.amount
          withdrawalCount++
        } else {
          depositSum += t.amount
          depositCount++
        }
      } else {
        if (t.type === 'withdrawal') {
          withdrawalSum += t.amount
          withdrawalCount++
        } else {
          depositSum += t.amount
          depositCount++
        }
      }
    })

    return {
      depositSum,
      depositCount,
      withdrawalSum,
      withdrawalCount,
      totalCount: filteredTransactions.length
    }
  }, [filteredTransactions])

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = "ID,Telephone,Operateur,Type,Montant,Heure,Date,Categorie,ClientName,Note\n"
    const rows = filteredTransactions.map(t =>
      `${t.id},${t.phone},${t.operator},${t.type},${t.amount},${t.time},${t.date},"${t.category}","${t.clientName || ''}","${t.note || ''}"`
    ).join("\n")
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `historique_${periodLabel.replace(/[\s\/]/g, '_')}.csv`
    link.click()
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-serif font-black tracking-tight text-natural-accent flex items-center gap-2">
            <Clock className="size-5.5 text-natural-accent" />
            Historique des Transactions
          </h2>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Recherchez et filtrez l'intégralité des opérations sur n'importe quelle période.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredTransactions.length === 0}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            isDark 
              ? 'border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22] disabled:opacity-50 disabled:hover:bg-transparent' 
              : 'border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-50 disabled:hover:bg-transparent'
          }`}
        >
          <Download className="size-3.5" /> Exporter en CSV
        </button>
      </div>

      {/* PERIOD & ADVANCED FILTER PANEL */}
      <section className={`p-5 rounded-[28px] border transition-all flex flex-col gap-4 ${
        isDark ? 'bg-[#0E1B15]/30 border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>
        {/* Environment toggle removed. Users stay in their active workspace context */}

        {/* Period Tabs */}
        <div className="flex flex-wrap gap-4 justify-between items-center border-b border-stone-500/10 pb-4">
          <div className={`flex p-0.5 rounded-xl border text-[10px] font-bold ${
            isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-[#EFECE6] border-[#DCD6CD]'
          }`}>
            {(['day', 'week', 'month', 'custom'] as PeriodType[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodType(p)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  periodType === p 
                    ? 'bg-natural-accent text-[#0A0F0D] shadow-sm font-black' 
                    : isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p === 'day' ? 'Journée' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mensuel' : 'Période'}
              </button>
            ))}
          </div>

          {/* Date controls */}
          <div className="flex items-center gap-3">
            {periodType === 'day' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => e.target.value && setSelectedDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
                <Button 
                  variant="outline" 
                  size="xs" 
                  onClick={() => setSelectedDate(TODAY_STR)}
                  className={selectedDate === TODAY_STR ? 'border-natural-accent/50 text-natural-accent' : ''}
                >
                  Aujourd'hui
                </Button>
              </div>
            )}

            {periodType === 'week' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => e.target.value && setSelectedDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
                <Button 
                  variant="outline" 
                  size="xs" 
                  onClick={() => setSelectedDate(TODAY_STR)}
                >
                  Cette Semaine
                </Button>
              </div>
            )}

            {periodType === 'month' && (
              <select
                value={selectedDate.slice(0, 7)}
                onChange={e => setSelectedDate(`${e.target.value}-01`)}
                className={`p-2 rounded-xl border font-mono text-xs focus:outline-none cursor-pointer ${
                  isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'
                }`}
              >
                <option value={TODAY_STR.slice(0, 7)}>Mois En Cours</option>
                <option value={YESTERDAY_STR.slice(0, 7)}>Mois Précédent</option>
                {["2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01", "2025-12"].map(m => (
                  <option key={m} value={m}>
                    {new Date(m + "-01").toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            )}

            {periodType === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input 
                  type="date"
                  value={customStart}
                  onChange={e => e.target.value && setCustomStart(e.target.value)}
                  className={`px-2 py-1.5 rounded-xl border font-mono text-xs focus:outline-none ${isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'}`}
                />
                <span className="text-stone-500">à</span>
                <input 
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={e => e.target.value && setCustomEnd(e.target.value)}
                  className={`px-2 py-1.5 rounded-xl border font-mono text-xs focus:outline-none ${isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-white border-stone-300 text-stone-900'}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Search and Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-stone-500" />
            <input 
              type="text"
              placeholder="Rechercher client, tel, ID, note..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${
                isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-[#111614]'
              }`}
            />
          </div>

          {/* Network Filter */}
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-stone-500" />
            <select
              value={opFilter}
              onChange={e => setOpFilter(e.target.value as any)}
              className={`flex-1 p-2.5 rounded-xl border text-xs focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD]'
              }`}
            >
              <option value="all">Tous les réseaux</option>
              <option value="mtn">MTN</option>
              <option value="moov">Moov</option>
              <option value="celtiis">Celtiis</option>
            </select>
          </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className={`flex-1 p-2.5 rounded-xl border text-xs focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD]'
              }`}
            >
              {envFilter === 'vm' ? (
                <>
                  <option value="all">Toutes les opérations</option>
                  <option value="vmEnvoi">Envois (Dépôts)</option>
                  <option value="vmRetrait">Retraits</option>
                  <option value="vmCredit">Crédits Dehors</option>
                  <option value="vmRecov">Récupérations de Crédits</option>
                  <option value="vmSwap">Rotations Agence</option>
                </>
              ) : (
                <>
                  <option value="all">Toutes les opérations</option>
                  <option value="deposit">Dépôts / Envois</option>
                  <option value="withdrawal">Retraits</option>
                  <option value="credit">Crédits</option>
                  <option value="forfait">Forfaits</option>
                </>
              )}
            </select>
        </div>
      </section>

      {/* STATS HERO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4.5 rounded-[22px] border ${
          isDark ? 'bg-gradient-to-br from-[#0E1B15] to-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'
        }`}>
          <span className="block text-[9px] font-black uppercase text-stone-500 tracking-wider">Période sélectionnée</span>
          <span className="block font-serif text-base font-extrabold text-natural-accent mt-0.5">{periodLabel}</span>
          <span className={`block text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {stats.totalCount} transaction(s) correspondante(s)
          </span>
        </div>

        <div className={`p-4.5 rounded-[22px] border ${
          isDark ? 'bg-[#050807] border-[#1D2B22]/50' : 'bg-emerald-50/20 border-emerald-100'
        }`}>
          <span className="block text-[9px] font-black uppercase text-emerald-500 tracking-wider">Total Entrées / Ventes</span>
          <span className="block font-mono text-xl font-bold text-emerald-400 mt-0.5">
            +{stats.depositSum.toLocaleString('fr-FR')} F
          </span>
          <span className={`block text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {stats.depositCount} opération(s) (Dépôts, Crédits, Forfaits)
          </span>
        </div>

        <div className={`p-4.5 rounded-[22px] border ${
          isDark ? 'bg-[#050807] border-[#2C1D20]/50' : 'bg-rose-50/20 border-rose-100'
        }`}>
          <span className="block text-[9px] font-black uppercase text-rose-400 tracking-wider">Total Sorties / Retraits</span>
          <span className="block font-mono text-xl font-bold text-rose-450 mt-0.5">
            -{stats.withdrawalSum.toLocaleString('fr-FR')} F
          </span>
          <span className={`block text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {stats.withdrawalCount} opération(s)
          </span>
        </div>
      </div>

      {/* HISTORIC LIST TABLE */}
      <div className={`overflow-hidden rounded-[24px] border shadow-sm flex flex-col ${
        isDark ? 'bg-[#0A0F0D] border-stone-850' : 'bg-white border-stone-200'
      }`}>
        {/* Quick Separation Buttons for Entrées vs Sorties */}
        <div className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#050807] border-stone-850' : 'bg-stone-50 border-stone-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-stone-400 font-sans tracking-wider">Séparer dans la vue :</span>
            <div className="flex items-center gap-1 bg-stone-900/40 p-1 rounded-xl border border-stone-800/60 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all font-sans cursor-pointer ${
                  typeFilter === 'all' 
                    ? 'bg-natural-accent text-stone-950 font-black shadow' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                🔄 Toutes ({filteredTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter(envFilter === 'vm' ? 'vmEnvoi' as any : 'deposit')}
                className={`px-3 py-1.5 rounded-lg transition-all font-sans cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'deposit' || typeFilter === 'vmEnvoi'
                    ? 'bg-emerald-500 text-stone-950 font-black shadow' 
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                📥 Entrées uniquement
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter(envFilter === 'vm' ? 'vmRetrait' as any : 'withdrawal')}
                className={`px-3 py-1.5 rounded-lg transition-all font-sans cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'withdrawal' || typeFilter === 'vmRetrait'
                    ? 'bg-rose-500 text-white font-black shadow' 
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                📤 Sorties uniquement
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className={`border-b text-[9px] uppercase font-extrabold sticky top-0 z-10 ${
                isDark ? 'bg-[#050807] border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}>
                <th className="py-3 px-4 font-sans">Opérateur & ID</th>
                <th className="py-3 px-4 font-sans">Date & Heure</th>
                <th className="py-3 px-4 font-sans">Client / Téléphone</th>
                <th className="py-3 px-4 font-sans">Type & Catégorie</th>
                <th className="py-3 px-4 text-right font-sans">Montant (FCFA)</th>
                <th className="py-3 px-4 text-center font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-stone-850' : 'divide-stone-150'}`}>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => {
                  const isDeposit = t.type !== 'withdrawal'
                  const opUpper = t.operator.toUpperCase()
                  
                  return (
                    <tr key={t.id} className="hover:bg-stone-500/5 transition-colors">
                      {/* Operator */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${
                            t.operator === 'mtn' ? 'bg-amber-400 shadow-sm'
                            : t.operator === 'moov' ? 'bg-blue-500 shadow-sm'
                            : 'bg-emerald-500 shadow-sm'
                          }`} />
                          <span className="font-sans font-bold">{opUpper}</span>
                        </div>
                        <span className={`text-[8.5px] block font-mono mt-0.5 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>{t.id}</span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="text-stone-300 dark:text-stone-200">{t.time}</div>
                        <div className="text-[9px] text-stone-500 mt-0.5">{t.date}</div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                          {t.clientName || <span className="text-stone-500 font-normal italic">Client Anonyme</span>}
                        </div>
                        <div className="text-[9.5px] text-stone-500 font-mono mt-0.5">{t.phone}</div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3.5 px-4 font-sans">
                        {envFilter === 'vm' ? (() => {
                          const isRecov = t.id.startsWith("RECOV-") || t.category.includes("Encaissement") || t.category.includes("Règlement Global");
                          const isSwap = t.id.startsWith("agency-swap-") || t.category.includes("Échange") || t.category.includes("Rotation") || t.clientName === "AGENCE ROTATION";
                          const isWithdrawal = t.type === "withdrawal";
                          const isCredit = t.category.includes("Crédit Dehors") || t.category.includes("Crédit");

                          if (isRecov) {
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                isDark ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                <ArrowUpRight className="size-2.5" /> Récupération
                              </span>
                            );
                          }
                          if (isSwap) {
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                isDark ? 'bg-indigo-950/20 text-indigo-400 border border-indigo-900/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                🔄 Rotation
                              </span>
                            );
                          }
                          if (isWithdrawal) {
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                isDark ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                <ArrowDownLeft className="size-2.5" /> Retrait
                              </span>
                            );
                          }
                          if (isCredit) {
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                isDark ? 'bg-amber-950/20 text-amber-500 border border-amber-900/30' : 'bg-amber-50 text-amber-800 border border-amber-100'
                              }`}>
                                <ArrowUpRight className="size-2.5" /> Crédit Dehors
                              </span>
                            );
                          }
                          return (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                              isDark ? 'bg-cyan-950/20 text-cyan-400 border border-cyan-900/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                            }`}>
                              <ArrowUpRight className="size-2.5" /> Envoi
                            </span>
                          );
                        })() : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                            t.type === 'withdrawal' 
                              ? (isDark ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' : 'bg-rose-50 text-rose-700 border border-rose-100')
                              : t.type === 'credit'
                              ? (isDark ? 'bg-amber-950/20 text-amber-500 border border-amber-900/30' : 'bg-amber-50 text-amber-800 border border-amber-100')
                              : (isDark ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-100')
                          }`}>
                            {t.type === 'withdrawal' ? <ArrowDownLeft className="size-2.5" /> : <ArrowUpRight className="size-2.5" />}
                            {t.type === 'withdrawal' ? 'Retrait' : t.type === 'credit' ? 'Crédit' : 'Dépôt'}
                          </span>
                        )}
                        <span className={`block text-[9px] mt-1 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>{t.category}</span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-black text-sm ${
                          isDeposit 
                            ? (isDark ? 'text-emerald-400' : 'text-emerald-700') 
                            : (isDark ? 'text-rose-400' : 'text-rose-700')
                        }`}>
                          {isDeposit ? '+' : ''}{t.amount.toLocaleString('fr-FR')} F
                        </span>
                        {t.note && (
                          <span className={`block text-[8.5px] font-sans mt-0.5 italic ${isDark ? 'text-stone-550' : 'text-stone-400'}`} title={t.note}>
                            📝 {t.note.length > 20 ? t.note.slice(0, 20) + '...' : t.note}
                          </span>
                        )}
                      </td>

                      {/* Actions Column (Print Ticket for everyone, Delete for Proprio) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {onViewReceipt && (
                            <button
                              type="button"
                              onClick={() => onViewReceipt(t)}
                              className="text-stone-500 hover:text-natural-accent transition-colors p-1 cursor-pointer"
                              title="Voir / Imprimer le reçu"
                            >
                              📄
                            </button>
                          )}
                          {role === 'proprio' && onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(t.id)}
                              className="text-stone-500 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                              title="Supprimer la transaction"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-7 text-stone-600" />
                      <span className="font-sans text-xs">Aucune transaction trouvée pour les filtres sélectionnés.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className={`border-t font-extrabold sticky bottom-0 z-10 ${
                isDark ? 'bg-[#0E1B15] border-stone-800 text-stone-300' : 'bg-stone-100 border-stone-300 text-stone-900'
              }`}>
                <td colSpan={3} className="py-3.5 px-4 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-wider">Cumul des Transactions :</span>
                    <span className="text-[10px] text-stone-400 font-normal">({filteredTransactions.length} filtrée(s))</span>
                  </div>
                </td>
                <td colSpan={3} className="py-3.5 px-4">
                  <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-5 font-mono">
                    {/* Somme Totale des Entrées */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] uppercase text-emerald-500 font-sans font-black">📥 Somme Entrées :</span>
                      <span className="font-black text-emerald-400 text-sm">+{stats.depositSum.toLocaleString('fr-FR')} FCFA</span>
                      <span className="text-[9px] text-stone-400 font-sans font-normal">({stats.depositCount})</span>
                    </div>

                    {/* Somme Totale des Sorties */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] uppercase text-rose-400 font-sans font-black">📤 Somme Sorties :</span>
                      <span className="font-black text-rose-400 text-sm">-{stats.withdrawalSum.toLocaleString('fr-FR')} FCFA</span>
                      <span className="text-[9px] text-stone-400 font-sans font-normal">({stats.withdrawalCount})</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
