"use client";

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Send, 
  Trash2, 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight, 
  UserCheck, 
  Coins, 
  Filter,
  CreditCard,
  Building2,
  FileText
} from 'lucide-react'
import { CabinNote } from '../types'

interface CarnetDeBordProps {
  theme: 'dark' | 'light';
  role: 'proprio' | 'employe' | 'vm';
  notes: CabinNote[];
  onAddNote: (noteData: string | Omit<CabinNote, 'id' | 'date' | 'time' | 'author'>) => void;
  onDeleteNote: (id: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  proprio: '👑 Proprio',
  employe: '👤 Gérant',
  vm: '🛵 VM',
}

export function CarnetDeBord({ theme, role, notes, onAddNote, onDeleteNote }: CarnetDeBordProps) {
  const [formMode, setFormMode] = useState<'memo' | 'flow'>('flow')
  const [entryType, setEntryType] = useState<'apport' | 'sortie'>('apport')
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'cash' | 'mtn' | 'moov' | 'celtiis'>('cash')
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<'all' | 'flows' | 'memos'>('all')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDark = theme === 'dark'

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'memo') {
      const trimmed = text.trim()
      if (!trimmed) return
      onAddNote(trimmed)
      setText('')
    } else {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) return
      const finalPerson = personName.trim() || (role === 'proprio' ? 'Propriétaire' : 'Gérant / Caissier')
      
      onAddNote({
        text: text.trim() || `${entryType === 'apport' ? 'Apport de fonds' : 'Prise d\'argent'} par ${finalPerson}`,
        entry_type: entryType,
        person_name: finalPerson,
        amount: parsedAmount,
        method: method
      })
      
      setAmount('')
      setText('')
      setPersonName('')
    }
  }

  // Calculate Totals & Net Difference for Today
  const totals = useMemo(() => {
    let apports = 0
    let sorties = 0
    const byMethod = {
      cash: { apports: 0, sorties: 0 },
      mtn: { apports: 0, sorties: 0 },
      moov: { apports: 0, sorties: 0 },
      celtiis: { apports: 0, sorties: 0 }
    }

    notes.forEach(n => {
      const amt = n.amount || 0
      const m = n.method || 'cash'
      if (n.entry_type === 'apport') {
        apports += amt
        if (byMethod[m]) byMethod[m].apports += amt
      }
      if (n.entry_type === 'sortie') {
        sorties += amt
        if (byMethod[m]) byMethod[m].sorties += amt
      }
    })

    const difference = apports - sorties
    return { apports, sorties, difference, byMethod }
  }, [notes])

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return [...notes].reverse().filter(n => {
      if (filter === 'flows') return n.entry_type === 'apport' || n.entry_type === 'sortie'
      if (filter === 'memos') return !n.entry_type || n.entry_type === 'memo'
      return true
    })
  }, [notes, filter])

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-natural-accent/10 text-natural-accent border border-natural-accent/20">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold uppercase font-serif text-natural-accent tracking-tight">Cahier Comptable & Carnet de Bord</h3>
            <p className="text-[10px] text-stone-400 font-medium">Suivez les échanges d'argent (Propriétaire/Caissier/Tiers) et calcul de la différence nette</p>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-900/40 p-1 rounded-xl border border-stone-800/60 text-[10px] font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-natural-accent text-stone-950 font-black' : 'text-stone-400 hover:text-white'}`}
          >
            Tout ({notes.length})
          </button>
          <button
            onClick={() => setFilter('flows')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'flows' ? 'bg-natural-accent text-stone-950 font-black' : 'text-stone-400 hover:text-white'}`}
          >
            💰 Flux Échanges
          </button>
          <button
            onClick={() => setFilter('memos')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'memos' ? 'bg-natural-accent text-stone-950 font-black' : 'text-stone-400 hover:text-white'}`}
          >
            📝 Mémos
          </button>
        </div>
      </div>

      {/* KPI Summary Banner with Explicit Net Difference */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#0E1B15] border-[#1C2C22]' : 'bg-white border-stone-200 shadow-sm'}`}>
            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
              <ArrowDownLeft className="size-3.5" /> Total Entrées (Apports)
            </div>
            <span className={`text-xl font-black font-serif ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              +{totals.apports.toLocaleString()} <span className="text-[10px] font-normal">FCFA</span>
            </span>
          </div>

          <div className={`p-4 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#0E1B15] border-[#1C2C22]' : 'bg-white border-stone-200 shadow-sm'}`}>
            <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase tracking-wider">
              <ArrowUpRight className="size-3.5" /> Total Sorties (Prises)
            </div>
            <span className={`text-xl font-black font-serif ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
              -{totals.sorties.toLocaleString()} <span className="text-[10px] font-normal">FCFA</span>
            </span>
          </div>

          {/* Explicit Net Difference Box */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-1 relative overflow-hidden ${
            totals.difference >= 0 
              ? (isDark ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200')
              : (isDark ? 'bg-rose-950/30 border-rose-800/50' : 'bg-rose-50 border-rose-200')
          }`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${totals.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <Coins className="size-3.5" /> Différence Nette (Entrées - Sorties)
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${totals.difference >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {totals.difference >= 0 ? 'Excédent Entrées' : 'Déficit / En Faveur Caissier'}
              </span>
            </div>
            <span className={`text-2xl font-black font-serif ${totals.difference >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-rose-500'}`}>
              {totals.difference >= 0 ? '+' : ''}{totals.difference.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
            </span>
          </div>
        </div>

        {/* Detailed breakdown per support */}
        <div className={`p-3 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] ${isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-50 border-stone-200'}`}>
          {(['cash', 'mtn', 'moov', 'celtiis'] as const).map(m => {
            const diff = totals.byMethod[m].apports - totals.byMethod[m].sorties
            const label = m === 'cash' ? '💵 Cash' : m.toUpperCase()
            return (
              <div key={m} className="flex flex-col gap-0.5 px-2 py-1 border-r last:border-r-0 border-stone-800/40">
                <span className="text-[9px] font-black uppercase text-stone-400">{label}</span>
                <span className={`font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Diff: {diff >= 0 ? '+' : ''}{diff.toLocaleString()} F
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Input Form Box */}
      <form
        onSubmit={handleSubmit}
        className={`p-5 rounded-[28px] border flex flex-col gap-4 ${
          isDark
            ? 'bg-[#0E1B15] border-[#1C2C22]'
            : 'bg-white border-[#DCD6CD] shadow-md'
        }`}
      >
        {/* Form Mode Selector */}
        <div className="flex items-center justify-between border-b pb-3 border-stone-800/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormMode('flow')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                formMode === 'flow'
                  ? 'bg-natural-accent text-stone-950 shadow-md'
                  : isDark ? 'bg-[#050807] text-stone-400 hover:text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              <Coins className="size-3.5" /> Échange d'Argent (Comptable)
            </button>
            <button
              type="button"
              onClick={() => setFormMode('memo')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                formMode === 'memo'
                  ? 'bg-natural-accent text-stone-950 shadow-md'
                  : isDark ? 'bg-[#050807] text-stone-400 hover:text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              <FileText className="size-3.5" /> Mémo / Note Libre
            </button>
          </div>
        </div>

        {formMode === 'flow' ? (
          <div className="flex flex-col gap-4">
            {/* Flow Type & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Type de mouvement</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryType('apport')}
                    className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      entryType === 'apport'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : isDark ? 'bg-[#050807] border-[#1C2C22] text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <ArrowDownLeft className="size-4 text-emerald-400" /> 📥 Apport / Dépot
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('sortie')}
                    className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      entryType === 'sortie'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : isDark ? 'bg-[#050807] border-[#1C2C22] text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <ArrowUpRight className="size-4 text-rose-400" /> 📤 Sortie / Prise
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Montant (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="ex: 50000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={`w-full h-12 border rounded-xl px-4 text-base font-black focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            {/* Person & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 flex items-center justify-between">
                  <span>Intervenant / Personne</span>
                  <span className="text-[9px] text-stone-500 font-normal">Raccourcis rapides :</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex: M. Koffi, Propriétaire, Livreure..."
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    className={`flex-1 h-11 border rounded-xl px-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                      isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setPersonName('Propriétaire')}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold ${isDark ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'}`}
                  >
                    Proprio
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonName('Caissier')}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold ${isDark ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'}`}
                  >
                    Caissier
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Support / Méthode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['cash', 'mtn', 'moov', 'celtiis'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`h-11 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                        method === m
                          ? 'bg-natural-accent text-stone-950 border-natural-accent'
                          : isDark ? 'bg-[#050807] border-[#1C2C22] text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      {m === 'cash' ? '💵 Cash' : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Motif / Commentaire */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Motif / Commentaire (Optionnel)</label>
              <input
                type="text"
                placeholder="ex: Apport pour recharge SIM MTN, ou Avance carburant..."
                value={text}
                onChange={e => setText(e.target.value)}
                className={`w-full h-11 border rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                  isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}
              />
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Écrivez ici vos mémos ou remarques... Ex: Client 0197 à rappeler pour confirmation, vérifier le solde Moov à 18h...`}
            className={`w-full border rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-natural-accent/30 resize-none leading-relaxed transition-all ${
              isDark
                ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
                : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
            }`}
          />
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={formMode === 'memo' ? !text.trim() : (!amount || parseFloat(amount) <= 0)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              (formMode === 'memo' ? text.trim() : (amount && parseFloat(amount) > 0))
                ? 'bg-natural-accent text-[#0A0F0D] hover:bg-[#c9a430] active:scale-[0.97]'
                : isDark ? 'bg-[#1C2C22] text-stone-600 cursor-not-allowed' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Send className="size-4" />
            Enregistrer dans le cahier
          </button>
        </div>
      </form>

      {/* 2-Column Side-by-Side Layout: Entrées à gauche, Sorties à droite */}
      {(() => {
        const apportsNotes = filteredNotes.filter(n => n.entry_type === 'apport')
        const sortiesNotes = filteredNotes.filter(n => n.entry_type === 'sortie')
        const memoNotes = filteredNotes.filter(n => !n.entry_type || n.entry_type === 'memo')

        const renderNoteCard = (note: CabinNote) => {
          const isApport = note.entry_type === 'apport'
          const isSortie = note.entry_type === 'sortie'
          const isFlow = isApport || isSortie

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.97 }}
              className={`p-4 rounded-2xl border flex flex-col gap-3 group transition-all ${
                isApport 
                  ? (isDark ? 'bg-emerald-950/15 border-emerald-900/30 hover:border-emerald-700/50' : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 shadow-sm')
                  : isSortie
                  ? (isDark ? 'bg-rose-950/15 border-rose-900/30 hover:border-rose-700/50' : 'bg-rose-50/40 border-rose-200 hover:border-rose-300 shadow-sm')
                  : (isDark ? 'bg-[#0E1B15]/60 border-[#1C2C22] hover:border-[#2A3C2E]' : 'bg-white border-[#DCD6CD] hover:border-stone-300 shadow-sm')
              }`}
            >
              {/* Flow Header Badge */}
              {isFlow ? (
                <div className="flex items-center justify-between border-b pb-2.5 border-stone-800/20">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl flex items-center justify-center font-black ${
                      isApport ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isApport ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${isApport ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isApport ? '📥 Apport' : '📤 Sortie'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          isDark ? 'bg-stone-900 text-stone-300' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {note.person_name || 'Intervenant'}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-stone-400 font-medium mt-0.5">
                        Moyen : <span className="font-bold uppercase text-natural-accent">{note.method === 'cash' ? '💵 Cash' : note.method}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-black font-serif ${isApport ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isApport ? '+' : '-'}{(note.amount || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Note Description / Text */}
              <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-[#E4EAD8]' : 'text-[#111614]'}`}>
                {note.text}
              </p>

              {/* Meta row */}
              <div className="flex items-center justify-between pt-1">
                <div className={`flex items-center gap-2 text-[9.5px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  <Clock className="size-3" />
                  <span>{note.date} à {note.time}</span>
                  <span className={`px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}>
                    {ROLE_LABELS[note.author] ?? note.author}
                  </span>
                </div>

                {/* Delete only for proprio */}
                {role === 'proprio' && (
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-400 cursor-pointer flex items-center gap-1 text-[10px] font-bold`}
                  >
                    <Trash2 className="size-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </motion.div>
          )
        }

        return (
          <div className="flex flex-col gap-6">
            {/* 2 COLUMNS GRID FOR ACCOUNTING FLOWS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* LEFT COLUMN: ENTRÉES / APPORTS */}
              <div className="flex flex-col gap-3">
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                    <ArrowDownLeft className="size-4" /> 📥 LISTE DES ENTRÉES / APPORTS
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-400">+{totals.apports.toLocaleString()} FCFA</span>
                </div>

                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {apportsNotes.length === 0 ? (
                      <div className={`text-center py-8 rounded-2xl border border-dashed text-xs ${isDark ? 'border-stone-800 text-stone-500' : 'border-stone-300 text-stone-400'}`}>
                        Aucun apport d'argent enregistré.
                      </div>
                    ) : (
                      apportsNotes.map(note => renderNoteCard(note))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT COLUMN: SORTIES / PRISES D'ARGENT */}
              <div className="flex flex-col gap-3">
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                    <ArrowUpRight className="size-4" /> 📤 LISTE DES SORTIES / PRISES
                  </div>
                  <span className="font-mono font-black text-sm text-rose-400">-{totals.sorties.toLocaleString()} FCFA</span>
                </div>

                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {sortiesNotes.length === 0 ? (
                      <div className={`text-center py-8 rounded-2xl border border-dashed text-xs ${isDark ? 'border-stone-800 text-stone-500' : 'border-stone-300 text-stone-400'}`}>
                        Aucune sortie d'argent enregistrée.
                      </div>
                    ) : (
                      sortiesNotes.map(note => renderNoteCard(note))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION FOR FREE MEMOS (If any exist or when filter is all/memos) */}
            {(filter === 'all' || filter === 'memos') && memoNotes.length > 0 && (
              <div className="flex flex-col gap-3 pt-4 border-t border-stone-800/40">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-natural-accent">
                  <FileText className="size-4" /> 📝 Mémos & Notes Libres
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {memoNotes.map(note => renderNoteCard(note))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </section>
  )
}
