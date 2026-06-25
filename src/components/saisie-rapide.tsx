"use client";

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle2, Plus, Trash2, HelpCircle } from 'lucide-react'
import { Transaction } from '../types'

// ─── Données complètes & Tarifs Réels Bénin ──────────────────────────────────

const AMOUNTS_DEPOT_RETRAIT = [500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 100000, 200000, 500000]
const AMOUNTS_CREDIT         = [100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000]

interface ForfaitItem {
  label: string;
  price: number;
  type: 'internet' | 'appel' | 'mixte';
}

const FORFAITS: Record<'mtn' | 'moov' | 'celtiis', ForfaitItem[]> = {
  mtn: [
    // Zo tché zé (2026) Internet
    { label: 'Zo tché zé 100F — 416 Mo (24h)', price: 100,  type: 'internet' },
    { label: 'Zo tché zé 200F — 833 Mo (24h)', price: 200,  type: 'internet' },
    { label: 'Zo tché zé 250F — Illimité 1Go+', price: 250,  type: 'internet' },
    { label: 'Zo tché zé 500F — 2 Go (3j)',     price: 500,  type: 'internet' },
    { label: 'Zo tché zé 1 000F — 4 Go (7j)',   price: 1000, type: 'internet' },
    { label: 'Zo tché zé 2 000F — 8 Go (15j)',  price: 2000, type: 'internet' },
    { label: 'Zo tché zé 5 000F — 20 Go (30j)', price: 5000, type: 'internet' },
    { label: 'Zo tché zé 10 000F — 40 Go (30j)', price: 10000, type: 'internet' },
    { label: 'Zo tché zé 15 000F — 60 Go (30j)', price: 15000, type: 'internet' },
    // Mixte / Go Packs
    { label: 'Maxi 500F — Appels + Net',       price: 500,  type: 'mixte'    },
    { label: 'Maxi 1 000F — Appels + Net',     price: 1000, type: 'mixte'    },
    { label: 'Maxi 2 000F — Appels + Net',     price: 2000, type: 'mixte'    },
    { label: 'Maxi 5 000F — Appels + Net',     price: 5000, type: 'mixte'    },
  ],
  moov: [
    // Extra Bonus (2026) Internet
    { label: 'Moov 100F — 175 Mo (24h)',       price: 100,  type: 'internet' },
    { label: 'Moov 150F — 275 Mo (24h)',       price: 150,  type: 'internet' },
    { label: 'Moov 200F — 370 Mo (24h)',       price: 200,  type: 'internet' },
    { label: 'Moov 250F — 475 Mo (24h)',       price: 250,  type: 'internet' },
    { label: 'Moov 300F — 560 Mo (24h)',       price: 300,  type: 'internet' },
    { label: 'Moov 500F — 950 Mo (3j)',        price: 500,  type: 'internet' },
    { label: 'Moov 1 000F — 1.5 Go (7j)',      price: 1000, type: 'internet' },
    { label: 'Moov 2 000F — 3.5 Go (15j)',     price: 2000, type: 'internet' },
    { label: 'Moov 5 000F — 10 Go (30j)',      price: 5000, type: 'internet' },
    { label: 'Moov 10 000F — 22 Go (30j)',     price: 10000, type: 'internet' },
    { label: 'Moov Illimité 15 100F (30j)',    price: 15100, type: 'internet' },
    // Moov Famille
    { label: 'Moov Famille 5 000F — 5 Go',     price: 5000, type: 'internet' },
    { label: 'Moov Famille 17 000F — 40 Go',   price: 17000, type: 'internet' },
    // Mixte
    { label: 'Moov Mix 1 000F — Appels+Net',   price: 1000, type: 'mixte'    },
    { label: 'Moov Mix 2 000F — Appels+Net',   price: 2000, type: 'mixte'    },
  ],
  celtiis: [
    // Pass Internet Connect / IllimiNet (2026)
    { label: 'Celtiis Connect 100F — 150 Mo',  price: 100,  type: 'internet' },
    { label: 'Celtiis Connect 200F — 350 Mo',  price: 200,  type: 'internet' },
    { label: 'Celtiis 1 Giga Favi (500F — 1.2 Go)', price: 500, type: 'internet' },
    { label: 'Celtiis Connect 1 000F — 3 Go',  price: 1000, type: 'internet' },
    { label: 'Celtiis Connect 2 000F — 6.5 Go', price: 2000, type: 'internet' },
    { label: 'Celtiis Connect 5 000F — 18 Go', price: 5000, type: 'internet' },
    { label: 'Celtiis Connect 10 000F — 40 Go', price: 10000, type: 'internet' },
    { label: 'Celtiis IllimiNet 15 100F (30j)', price: 15100, type: 'internet' },
    { label: 'Celtiis Home 14 900F — Fibre 50M', price: 14900, type: 'internet' },
    // Mixte
    { label: 'Celtiis Mix 1 000F — Appels+Net', price: 1000, type: 'mixte'    },
    { label: 'Celtiis Mix 2 000F — Appels+Net', price: 2000, type: 'mixte'    },
  ],
}

type OpType = 'depot' | 'retrait' | 'credit' | 'forfait'
type OpSig  = 'mtn' | 'moov' | 'celtiis'

const OP_LABELS: Record<OpType, string> = {
  depot:   '⬇ Dépôt',
  retrait: '⬆ Retrait',
  credit:  '📱 Crédit',
  forfait: '⚡ Forfait',
}

const OP_COLORS: Record<OpType, { active: string; hover: string; text: string; bg: string }> = {
  depot:   { active: 'bg-cyan-500 text-white',       hover: 'dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:border-cyan-600 hover:text-cyan-600', text: 'text-cyan-500', bg: 'bg-cyan-500' },
  retrait: { active: 'bg-rose-500 text-white',        hover: 'dark:hover:border-rose-400 dark:hover:text-rose-400 hover:border-rose-600 hover:text-rose-600', text: 'text-rose-500', bg: 'bg-rose-500' },
  credit:  { active: 'bg-amber-500 text-[#0A0F0D]',  hover: 'dark:hover:border-amber-400 dark:hover:text-amber-400 hover:border-amber-600 hover:text-amber-600', text: 'text-amber-500', bg: 'bg-amber-500' },
  forfait: { active: 'bg-natural-accent text-[#0A0F0D]', hover: 'dark:hover:border-natural-accent dark:hover:text-natural-accent hover:border-[#c59b27] hover:text-[#c59b27]', text: 'text-natural-accent', bg: 'bg-natural-accent' },
}

const OP_SIG_COLORS: Record<OpSig, { active: string; hover: string }> = {
  mtn:     { active: 'bg-amber-400 text-[#0A0F0D]', hover: 'dark:hover:border-amber-400 dark:hover:text-amber-400 hover:border-amber-650 hover:text-amber-650' },
  moov:    { active: 'bg-blue-500 text-white',       hover: 'dark:hover:border-blue-400 dark:hover:text-blue-400 hover:border-blue-600 hover:text-blue-600' },
  celtiis: { active: 'bg-emerald-500 text-white',    hover: 'dark:hover:border-emerald-400 dark:hover:text-emerald-400 hover:border-emerald-600 hover:text-emerald-600' },
}

const defaultGetLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface SaisieRapideProps {
  theme: 'dark' | 'light';
  getLocalDateString?: () => string;
  onAdd: (txn: Transaction) => void;
}

export function SaisieRapide({ theme, getLocalDateString, onAdd }: SaisieRapideProps) {
  const [opType, setOpType]   = useState<OpType>('depot')
  const [opSig, setOpSig]     = useState<OpSig>('mtn')
  const [freeText, setFreeText] = useState('')
  
  // Phone and Validation states
  const [clientNameInput, setClientNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  
  // Amount accumulation states
  const [accumulatedAmounts, setAccumulatedAmounts] = useState<number[]>([])
  const [customAmountInput, setCustomAmountInput] = useState('')
  
  // Forfait selection state
  const [selectedForfait, setSelectedForfait] = useState<ForfaitItem | null>(null)

  const [forfaitType, setForfaitType] = useState<'all' | 'internet' | 'appel' | 'mixte'>('all')
  const [flash, setFlash]     = useState(false)

  const isDark = theme === 'dark'
  const getLocalDate = getLocalDateString || defaultGetLocalDateString

  // Sync custom amount text input when accumulation changes
  useEffect(() => {
    if (accumulatedAmounts.length > 0) {
      const sum = accumulatedAmounts.reduce((a, b) => a + b, 0)
      setCustomAmountInput(sum.toString())
    } else {
      setCustomAmountInput('')
    }
  }, [accumulatedAmounts])

  // Clear selections when switching operators or operation type
  useEffect(() => {
    setAccumulatedAmounts([])
    setSelectedForfait(null)
  }, [opType, opSig])

  const handlePhoneChange = (val: string) => {
    // Only keep numbers and clean spaces
    const clean = val.replace(/[^\d]/g, '')
    setPhoneInput(clean)
    if (clean.length >= 8) {
      setPhoneError(null)
    }
  }

  const fire = (label: string, amount: number, operator: OpSig, customPhone?: string) => {
    const finalPhone = (customPhone || phoneInput).trim()

    if (!finalPhone || finalPhone.replace(/\s/g, '').length < 8) {
      setPhoneError("Numéro de téléphone obligatoire (min. 8 chiffres)")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const txnType =
      opType === 'depot'   ? 'deposit'   :
      opType === 'retrait' ? 'withdrawal' :
      opType === 'credit'  ? 'credit'    : 'forfait'

    const txn: Transaction = {
      id:             `RAPIDE-${Date.now()}`,
      phone:          finalPhone,
      operator,
      type:           txnType,
      amount,
      time:           timeStr,
      date:           getLocalDate(),
      category:       label,
      isScamReported: false,
      clientName:     clientNameInput.trim() || undefined,
    }
    
    onAdd(txn)
    setFlash(true)
    setTimeout(() => setFlash(false), 1400)
    
    // Reset states after success
    setPhoneInput('')
    setClientNameInput('')
    setPhoneError(null)
    setAccumulatedAmounts([])
    setCustomAmountInput('')
    setSelectedForfait(null)
  }

  // Submission handler for Dépôt/Retrait/Crédit or Forfait from the accumulated total
  const handleValidateOperation = () => {
    const finalPhone = phoneInput.trim()
    if (!finalPhone || finalPhone.length < 8) {
      setPhoneError("Numéro de téléphone obligatoire (min. 8 chiffres)")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    if (opType === 'forfait') {
      if (!selectedForfait) return
      fire(
        `Forfait ${opSig.toUpperCase()} — ${selectedForfait.label}`,
        selectedForfait.price,
        opSig
      )
    } else {
      const amt = parseFloat(customAmountInput)
      if (!amt || amt <= 0) return
      
      const label = `${opType === 'depot' ? 'Dépôt' : opType === 'retrait' ? 'Retrait' : 'Crédit'} ${opSig.toUpperCase()} ${amt.toLocaleString('fr-FR')}F`
      fire(label, amt, opSig)
    }
  }

  const handleFreeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = freeText.trim()
    if (!t) return

    const finalPhone = phoneInput.trim()
    if (!finalPhone || finalPhone.length < 8) {
      // Try to parse phone number from text
      const numbers = t.match(/\d{8,10}/g) || []
      if (numbers.length > 0 && numbers[0]) {
        setPhoneInput(numbers[0])
        setPhoneError(null)
      } else {
        setPhoneError("Entrez un numéro valide avant de valider l'expression libre.")
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
    }

    const op: OpSig = /moov/i.test(t) ? 'moov' : /celtiis/i.test(t) ? 'celtiis' : 'mtn'
    const numbers = t.match(/\d+/g) || []
    let parsedAmount = 0
    let parsedPhone = phoneInput.trim()
    
    for (const num of numbers) {
      if (num.length >= 8) {
        parsedPhone = num
      } else {
        const val = parseInt(num)
        if (val > parsedAmount) {
          parsedAmount = val
        }
      }
    }
    
    fire(t, parsedAmount, op, parsedPhone)
    setFreeText('')
  }

  const handleQuickAmountClick = (amt: number) => {
    setAccumulatedAmounts(prev => [...prev, amt])
  }

  const handleClearAmount = () => {
    setAccumulatedAmounts([])
    setCustomAmountInput('')
  }

  const cardBase = `p-3 rounded-2xl border text-left text-[11px] font-bold transition-all active:scale-[0.95] cursor-pointer ${
    isDark ? 'border-[#1C2C22] bg-[#0E1B15]' : 'border-[#DCD6CD] bg-white'
  }`

  const currentTotal = parseFloat(customAmountInput) || 0

  return (
    <section className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Zap className="size-4 text-natural-accent fill-natural-accent/30" />
        <div>
          <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Saisie Rapide</h3>
          <p className="text-[9px] text-stone-500">Sélectionnez le montant ou forfait, le numéro est obligatoire</p>
        </div>
      </div>

      {/* Flash confirmation */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold"
          >
            <CheckCircle2 className="size-4" /> Ajouté à l'historique !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main panel */}
      <div className={`p-4 rounded-[28px] border flex flex-col gap-4 ${
        isDark ? 'bg-[#0E1B15] border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
      }`}>

        {/* Nom du Client, N° Bénéficiaire & Montant libre Inputs */}
        <div className={`grid grid-cols-1 gap-3 px-1 ${
          opType !== 'forfait' ? 'md:grid-cols-3' : 'md:grid-cols-2'
        }`}>
          {/* Client Name Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest flex items-center justify-between">
              <span>👤 Nom du Client</span>
            </span>
            <input
              type="text"
              value={clientNameInput}
              onChange={e => setClientNameInput(e.target.value)}
              placeholder="Ex: Jean Dupont (Optionnel)"
              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 font-bold ${
                isDark
                  ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-650'
                  : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
              }`}
            />
          </div>

          {/* Phone Number Input */}
          <motion.div 
            className="flex flex-col gap-1"
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest flex items-center justify-between">
              <span>📱 Numéro Bénéficiaire <span className="text-rose-500 font-black">*</span></span>
              {phoneError && <span className="text-rose-500 text-[8px] font-black">{phoneError}</span>}
            </span>
            <input
              type="text"
              value={phoneInput}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="Ex: 0196887722 (Mandatory)"
              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 font-mono font-bold ${
                phoneError
                  ? 'border-rose-500 bg-rose-500/5 text-rose-400'
                  : isDark
                    ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
                    : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
              }`}
            />
          </motion.div>

          {/* Amount Accumulator & Manual Field */}
          {opType !== 'forfait' && (
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest flex items-center justify-between">
                <span>💰 Montant total (FCFA)</span>
                {accumulatedAmounts.length > 0 && (
                  <button 
                    type="button" 
                    onClick={handleClearAmount}
                    className="text-stone-400 hover:text-rose-400 flex items-center gap-0.5 text-[8px] font-bold uppercase transition-colors"
                  >
                    <Trash2 className="size-2.5" /> Vider
                  </button>
                )}
              </span>
              <div className="flex gap-1.5 relative">
                <input
                  type="number"
                  value={customAmountInput}
                  onChange={e => {
                    setAccumulatedAmounts([]) // Clear quick summation if typing manually
                    setCustomAmountInput(e.target.value)
                  }}
                  placeholder="0 FCFA"
                  className={`flex-1 min-w-0 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 font-mono font-bold ${
                    isDark
                      ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
                      : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
                  }`}
                />
              </div>

              {/* Sum details if accumulated */}
              {accumulatedAmounts.length > 0 && (
                <div className="text-[9px] text-stone-500 font-mono mt-1 px-1 flex flex-wrap gap-1 items-center">
                  <span className="font-semibold text-natural-accent">Addition :</span>
                  {accumulatedAmounts.map((amt, idx) => (
                    <span key={idx}>
                      {amt.toLocaleString('fr-FR')}F {idx < accumulatedAmounts.length - 1 ? '+' : ''}
                    </span>
                  ))}
                  <span className="font-bold text-emerald-500">= {currentTotal.toLocaleString('fr-FR')}F</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 1 — Type d'opération */}
        <div className="flex flex-col gap-2">
          <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest">① Type d'opération</span>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(OP_LABELS) as OpType[]).map(t => (
              <button
                key={t}
                onClick={() => setOpType(t)}
                className={`py-2 px-1 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${
                  opType === t
                    ? OP_COLORS[t].active + ' border-transparent'
                    : isDark
                      ? `border-[#1C2C22] text-stone-400 ${OP_COLORS[t].hover}`
                      : `border-[#DCD6CD] text-stone-600 ${OP_COLORS[t].hover}`
                }`}
              >
                {OP_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2 — Opérateur */}
        <div className="flex flex-col gap-2">
          <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest">② Réseau</span>
          <div className="grid grid-cols-3 gap-2">
            {(['mtn', 'moov', 'celtiis'] as OpSig[]).map(op => (
              <button
                key={op}
                onClick={() => setOpSig(op)}
                className={`py-2.5 px-1 rounded-xl border text-[11px] font-black text-center uppercase transition-all cursor-pointer ${
                  opSig === op
                    ? OP_SIG_COLORS[op].active + ' border-transparent'
                    : isDark
                      ? `border-[#1C2C22] text-stone-400 ${OP_SIG_COLORS[op].hover}`
                      : `border-[#DCD6CD] text-stone-600 ${OP_SIG_COLORS[op].hover}`
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 3 — Montant / Forfait */}
        <div className="flex flex-col gap-2">
          <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest">
            ③ {opType === 'forfait' ? 'Choisir le forfait' : 'Appuyez pour additionner les montants'}
          </span>

          {/* Dépôt / Retrait / Crédit */}
          {opType !== 'forfait' && (
            <div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {(opType === 'credit' ? AMOUNTS_CREDIT : AMOUNTS_DEPOT_RETRAIT).map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmountClick(amt)}
                    className={`${cardBase} text-center hover:scale-[1.03] flex flex-col justify-center items-center py-2.5 ${
                      isDark
                        ? opType === 'depot'   ? 'hover:border-cyan-600/50 hover:bg-cyan-950/20'
                          : opType === 'retrait' ? 'hover:border-rose-600/50 hover:bg-rose-950/20'
                          : opType === 'credit'  ? 'hover:border-amber-600/50 hover:bg-amber-950/20'
                          : ''
                        : opType === 'depot'   ? 'hover:border-cyan-300 hover:bg-cyan-50'
                          : opType === 'retrait' ? 'hover:border-rose-300 hover:bg-rose-50'
                          : opType === 'credit'  ? 'hover:border-amber-300 hover:bg-amber-50'
                          : ''
                    }`}
                  >
                    <div className={`text-sm font-black font-mono ${
                      opType === 'depot'
                        ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                        : opType === 'retrait'
                          ? isDark ? 'text-rose-400' : 'text-rose-600'
                          : isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}>
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </div>
                    <div className={`text-[8px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>FCFA</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Forfaits */}
          {opType === 'forfait' && (
            <div className="flex flex-col gap-3">
              {/* Sub-tabs for forfait type */}
              <div className="flex gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-[#050807] border border-stone-200/60 dark:border-[#1C2C22]">
                {(['all', 'internet', 'appel', 'mixte'] as const).map(subType => (
                  <button
                    key={subType}
                    type="button"
                    onClick={() => setForfaitType(subType)}
                    className={`flex-1 py-1.5 rounded-xl text-[9px] font-black text-center transition-all cursor-pointer ${
                      forfaitType === subType
                        ? isDark
                          ? 'bg-[#0E1B15] text-natural-accent border border-[#1C2C22]'
                          : 'bg-white text-stone-900 border border-stone-200 shadow-sm'
                        : isDark
                          ? 'text-stone-500 hover:text-stone-300'
                          : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {subType === 'all' ? 'Tous' : subType === 'internet' ? '🌐 Internet' : subType === 'appel' ? '📞 Appel' : '🔄 Mixte'}
                  </button>
                ))}
              </div>

              {/* Grid of filtered packages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FORFAITS[opSig]
                  .filter(f => forfaitType === 'all' || f.type === forfaitType)
                  .map(f => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setSelectedForfait(f)}
                      className={`${cardBase} hover:scale-[1.02] flex items-center justify-between gap-3 ${
                        selectedForfait?.label === f.label
                          ? isDark
                            ? 'border-natural-accent bg-natural-accent/10'
                            : 'border-natural-accent bg-amber-50 shadow-sm'
                          : isDark
                            ? 'hover:border-natural-accent/40 hover:bg-natural-accent/5'
                            : 'hover:border-natural-accent/60 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[10px] font-black leading-tight ${isDark ? 'text-stone-200' : 'text-stone-850'}`}>{f.label}</span>
                        <span className="text-[8px] text-stone-500 font-semibold uppercase">{f.type}</span>
                      </div>
                      <div className={`font-black text-xs font-mono shrink-0 ${isDark ? 'text-natural-accent' : 'text-stone-800'}`}>{f.price.toLocaleString('fr-FR')} F</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Validation Button */}
        <div className="pt-2 px-1">
          <button
            type="button"
            onClick={handleValidateOperation}
            disabled={
              (!phoneInput.trim() || phoneInput.length < 8) ||
              (opType === 'forfait' ? !selectedForfait : (!currentTotal || currentTotal <= 0))
            }
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              (!phoneInput.trim() || phoneInput.length < 8) ||
              (opType === 'forfait' ? !selectedForfait : (!currentTotal || currentTotal <= 0))
                ? isDark
                  ? 'bg-[#1C2C22] text-stone-600 border border-[#2A3E31]/30 cursor-not-allowed'
                  : 'bg-stone-100 text-stone-400 border border-stone-205 cursor-not-allowed'
                : `text-[#0A0F0D] hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md ${OP_COLORS[opType].bg}`
            }`}
          >
            <CheckCircle2 className="size-4 shrink-0" />
            {opType === 'forfait'
              ? selectedForfait
                ? `Valider le forfait de ${selectedForfait.price.toLocaleString('fr-FR')} F`
                : 'Sélectionnez un forfait'
              : currentTotal > 0
                ? `Valider le ${opType === 'depot' ? 'Dépôt' : opType === 'retrait' ? 'Retrait' : 'Crédit'} de ${currentTotal.toLocaleString('fr-FR')} F`
                : 'Saisissez ou choisissez un montant'}
          </button>
        </div>

      </div>

      {/* Free text fallback */}
      <form onSubmit={handleFreeSubmit} className="flex gap-2">
        <input
          type="text"
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder='Ou décrivez librement… ex: "retrait moov 7500"'
          className={`flex-1 px-4 py-3 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
            isDark
              ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
              : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
          }`}
        />
        <button
          type="submit"
          disabled={!freeText.trim()}
          className={`shrink-0 px-4 py-3 rounded-2xl text-[11px] font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
            freeText.trim()
              ? 'bg-natural-accent text-[#0A0F0D] hover:bg-[#c9a430] active:scale-[0.97]'
              : isDark ? 'bg-[#1C2C22] text-stone-600 cursor-not-allowed' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Plus className="size-3.5 stroke-[3px]" /> OK
        </button>
      </form>

    </section>
  )
}
