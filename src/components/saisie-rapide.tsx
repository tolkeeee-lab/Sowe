"use client";

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle2, Plus } from 'lucide-react'
import { Transaction } from '../types'

// ─── Données complètes ──────────────────────────────────────────────────────

const AMOUNTS_DEPOT_RETRAIT = [500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 100000, 200000, 500000]
const AMOUNTS_CREDIT         = [100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000]

interface ForfaitItem {
  label: string;
  price: number;
  type: 'internet' | 'appel' | 'mixte';
}

const FORFAITS: Record<'mtn' | 'moov' | 'celtiis', ForfaitItem[]> = {
  mtn: [
    { label: 'Internet 500F — 1.2 Go',     price: 500,  type: 'internet' },
    { label: 'Internet 1000F — 3 Go',      price: 1000, type: 'internet' },
    { label: 'Internet 1500F — 5 Go',      price: 1500, type: 'internet' },
    { label: 'Maxi 2000F — Appels + Net',  price: 2000, type: 'mixte'    },
    { label: 'Maxi 5000F — Appels + Net',  price: 5000, type: 'mixte'    },
    { label: 'Appels 500F — 60 min',       price: 500,  type: 'appel'    },
    { label: 'Appels 1000F — 130 min',     price: 1000, type: 'appel'    },
    { label: 'Nuit 500F — 5 Go (23h-7h)',  price: 500,  type: 'internet' },
    { label: 'Boost 3000F — 10 Go',        price: 3000, type: 'internet' },
  ],
  moov: [
    { label: 'Giga 500F — 1 Go',           price: 500,  type: 'internet' },
    { label: 'Giga 1000F — 2.5 Go',        price: 1000, type: 'internet' },
    { label: 'Giga 2000F — 6 Go',          price: 2000, type: 'internet' },
    { label: 'Moov Mix 1000F — Appels+Net',price: 1000, type: 'mixte'    },
    { label: 'Moov Mix 2000F — Appels+Net',price: 2000, type: 'mixte'    },
    { label: 'Appels 500F — 60 min',       price: 500,  type: 'appel'    },
    { label: 'Appels 1000F — 120 min',     price: 1000, type: 'appel'    },
    { label: 'Nuit 200F — 1 Go (22h-6h)',  price: 200,  type: 'internet' },
    { label: 'Boost 5000F — 20 Go',        price: 5000, type: 'internet' },
  ],
  celtiis: [
    { label: 'Giga 500F — 2 Go',           price: 500,  type: 'internet' },
    { label: 'Giga 1000F — 5 Go',          price: 1000, type: 'internet' },
    { label: 'Giga 2000F — 12 Go',         price: 2000, type: 'internet' },
    { label: 'Celtiis Mix 1000F — Appels+Net', price: 1000, type: 'mixte' },
    { label: 'Celtiis Mix 2000F — Appels+Net', price: 2000, type: 'mixte' },
    { label: 'Appels 500F — 70 min',       price: 500,  type: 'appel'    },
    { label: 'Appels 1000F — 150 min',     price: 1000, type: 'appel'    },
    { label: 'Nuit 300F — 2 Go (22h-6h)',  price: 300,  type: 'internet' },
    { label: 'Boost 5000F — 25 Go',        price: 5000, type: 'internet' },
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

const OP_COLORS: Record<OpType, { active: string; hover: string }> = {
  depot:   { active: 'bg-cyan-500 text-white',       hover: 'dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:border-cyan-600 hover:text-cyan-600' },
  retrait: { active: 'bg-rose-500 text-white',        hover: 'dark:hover:border-rose-400 dark:hover:text-rose-400 hover:border-rose-600 hover:text-rose-600' },
  credit:  { active: 'bg-amber-500 text-[#0A0F0D]',  hover: 'dark:hover:border-amber-400 dark:hover:text-amber-400 hover:border-amber-600 hover:text-amber-600' },
  forfait: { active: 'bg-natural-accent text-[#0A0F0D]', hover: 'dark:hover:border-natural-accent dark:hover:text-natural-accent hover:border-[#c59b27] hover:text-[#c59b27]' },
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
  const [phoneInput, setPhoneInput] = useState('')
  const [forfaitType, setForfaitType] = useState<'all' | 'internet' | 'appel' | 'mixte'>('all')
  const [flash, setFlash]     = useState(false)

  const isDark = theme === 'dark'
  const getLocalDate = getLocalDateString || defaultGetLocalDateString

  const fire = (label: string, amount: number, operator: OpSig, customPhone?: string) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const txnType =
      opType === 'depot'   ? 'deposit'   :
      opType === 'retrait' ? 'withdrawal' :
      opType === 'credit'  ? 'credit'    : 'forfait'

    const finalPhone = customPhone || phoneInput.trim() || 'RAPIDE'

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
    }
    onAdd(txn)
    setFlash(true)
    setTimeout(() => setFlash(false), 1400)
    setPhoneInput('')
  }

  const handleFreeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = freeText.trim()
    if (!t) return
    const op: OpSig = /moov/i.test(t) ? 'moov' : /celtiis/i.test(t) ? 'celtiis' : 'mtn'
    
    // Find all numbers in the text
    const numbers = t.match(/\d+/g) || []
    
    let parsedAmount = 0
    let parsedPhone = phoneInput.trim() || 'RAPIDE'
    
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

  const cardBase = `p-3 rounded-2xl border text-left text-[11px] font-bold transition-all active:scale-[0.95] cursor-pointer ${
    isDark ? 'border-[#1C2C22] bg-[#0E1B15]' : 'border-[#DCD6CD] bg-white'
  }`

  return (
    <section className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Zap className="size-4 text-natural-accent fill-natural-accent/30" />
        <div>
          <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Saisie Rapide</h3>
          <p className="text-[9px] text-stone-500">Toutes les opérations en 3 taps — sans formulaire</p>
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

        {/* N° Bénéficiaire Input */}
        <div className="flex flex-col gap-1 px-1">
          <span className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest">📱 Numéro Bénéficiaire (Optionnel)</span>
          <input
            type="text"
            value={phoneInput}
            onChange={e => setPhoneInput(e.target.value)}
            placeholder="Ex: 0196887722"
            className={`w-full px-4 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
              isDark
                ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
                : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
            }`}
          />
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
            ③ {opType === 'forfait' ? 'Choisir le forfait' : 'Montant'}
          </span>

          {/* Dépôt / Retrait / Crédit */}
          {opType !== 'forfait' && (
            <div className="grid grid-cols-3 gap-2">
              {(opType === 'credit' ? AMOUNTS_CREDIT : AMOUNTS_DEPOT_RETRAIT).map(amt => (
                <button
                  key={amt}
                  onClick={() => fire(
                    `${opType === 'depot' ? 'Dépôt' : opType === 'retrait' ? 'Retrait' : 'Crédit'} ${opSig.toUpperCase()} ${amt.toLocaleString('fr-FR')}F`,
                    amt,
                    opSig
                  )}
                  className={`${cardBase} text-center hover:scale-[1.03] ${
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
                  <div className={`text-base font-black font-mono ${
                    opType === 'depot'
                      ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                      : opType === 'retrait'
                        ? isDark ? 'text-rose-400' : 'text-rose-600'
                        : isDark ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </div>
                  <div className={`text-[8px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>FCFA</div>
                </button>
              ))}
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
              <div className="grid grid-cols-2 gap-2">
                {FORFAITS[opSig]
                  .filter(f => forfaitType === 'all' || f.type === forfaitType)
                  .map(f => (
                    <button
                      key={f.label}
                      onClick={() => fire(`Forfait ${opSig.toUpperCase()} — ${f.label}`, f.price, opSig)}
                      className={`${cardBase} hover:scale-[1.02] ${
                        isDark
                          ? 'hover:border-natural-accent/40 hover:bg-natural-accent/5'
                          : 'hover:border-natural-accent/60 hover:bg-amber-50'
                      }`}
                    >
                      <div className={`font-black text-base font-mono ${isDark ? 'text-natural-accent' : 'text-stone-800'}`}>{f.price.toLocaleString('fr-FR')} F</div>
                      <div className={`text-[9px] mt-0.5 leading-tight ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{f.label}</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Free text fallback */}
      <form onSubmit={handleFreeSubmit} className="flex gap-2">
        <input
          type="text"
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder='Ou écris librement… ex: "retrait moov 7500"'
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
