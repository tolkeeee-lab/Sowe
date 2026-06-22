"use client";

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Plus, CheckCircle2 } from 'lucide-react'
import { Transaction } from '../types'

// ─── Boutons raccourcis pré-définis ────────────────────────────────────────
const QUICK_PRESETS = [
  { label: 'Forfait MTN 500',   text: 'Forfait internet MTN 500F',      operator: 'mtn'     as const, amount: 500   },
  { label: 'Forfait Moov 500',  text: 'Forfait internet Moov 500F',     operator: 'moov'    as const, amount: 500   },
  { label: 'Crédit MTN 200',    text: 'Crédit MTN 200F',                operator: 'mtn'     as const, amount: 200   },
  { label: 'Crédit Moov 200',   text: 'Crédit Moov 200F',               operator: 'moov'    as const, amount: 200   },
  { label: 'Dépôt 5 000',       text: 'Dépôt client 5000F',             operator: 'mtn'     as const, amount: 5000  },
  { label: 'Dépôt 10 000',      text: 'Dépôt client 10000F',            operator: 'mtn'     as const, amount: 10000 },
  { label: 'Retrait 5 000',     text: 'Retrait client 5000F',           operator: 'mtn'     as const, amount: 5000  },
  { label: 'Retrait 10 000',    text: 'Retrait client 10000F',          operator: 'mtn'     as const, amount: 10000 },
  { label: 'Forfait Celtiis',   text: 'Forfait internet Celtiis 500F',  operator: 'celtiis' as const, amount: 500   },
]

interface SaisieRapideProps {
  theme: 'dark' | 'light';
  getLocalDateString: () => string;
  onAdd: (txn: Transaction) => void;
}

export function SaisieRapide({ theme, getLocalDateString, onAdd }: SaisieRapideProps) {
  const [text, setText] = useState('')
  const [flash, setFlash] = useState<string | null>(null) // ID of last added for flash animation

  const isDark = theme === 'dark'

  const buildTxn = (label: string, operator: 'mtn' | 'moov' | 'celtiis', amount: number): Transaction => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return {
      id: `RAPIDE-${Date.now()}`,
      phone: 'RAPIDE',
      operator,
      type: 'saisie_rapide',
      amount,
      time: timeStr,
      date: getLocalDateString(),
      category: label,
      isScamReported: false,
    }
  }

  const handleFreeText = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    // Try to auto-detect operator
    const op: 'mtn' | 'moov' | 'celtiis' =
      /moov/i.test(trimmed) ? 'moov' :
      /celtiis/i.test(trimmed) ? 'celtiis' : 'mtn'

    // Try to extract a number (amount)
    const numMatch = trimmed.match(/\d[\d\s]*/)?.[0]?.replace(/\s/g, '')
    const amount = numMatch ? parseInt(numMatch) : 0

    const txn = buildTxn(trimmed, op, amount)
    onAdd(txn)
    setFlash(txn.id)
    setTimeout(() => setFlash(null), 1500)
    setText('')
  }

  const handlePreset = (preset: typeof QUICK_PRESETS[0]) => {
    const txn = buildTxn(preset.text, preset.operator, preset.amount)
    onAdd(txn)
    setFlash(txn.id)
    setTimeout(() => setFlash(null), 1500)
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Zap className="size-4 text-natural-accent fill-natural-accent/30" />
        <div>
          <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Saisie Rapide</h3>
          <p className="text-[9px] text-stone-500">Notez une opération sans passer par le formulaire complet</p>
        </div>
      </div>

      {/* Flash confirmation */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold"
          >
            <CheckCircle2 className="size-4" />
            Opération ajoutée à l'historique !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free-text input */}
      <form
        onSubmit={handleFreeText}
        className={`flex gap-2 items-end p-4 rounded-[24px] border ${
          isDark ? 'bg-[#0E1B15] border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
        }`}
      >
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">
            Décrire l'opération librement
          </label>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='Ex: "dépôt mtn 30000", "forfait internet moov 1000", "retrait celtiis 5000"'
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
              isDark
                ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
                : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            text.trim()
              ? 'bg-natural-accent text-[#0A0F0D] hover:bg-[#c9a430] active:scale-[0.97]'
              : isDark ? 'bg-[#1C2C22] text-stone-600 cursor-not-allowed' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Plus className="size-4 stroke-[3px]" />
          Ajouter
        </button>
      </form>

      {/* Quick preset buttons */}
      <div className="flex flex-col gap-2 px-1">
        <span className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">
          ⚡ Boutons Rapides — 1 clic pour ajouter
        </span>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className={`px-3 py-2.5 rounded-2xl border text-[10px] font-bold text-left transition-all hover:scale-[1.02] active:scale-[0.97] cursor-pointer ${
                preset.operator === 'mtn'
                  ? isDark
                    ? 'border-amber-800/40 bg-amber-950/20 text-amber-400 hover:border-amber-600/50'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300'
                  : preset.operator === 'moov'
                    ? isDark
                      ? 'border-blue-800/40 bg-blue-950/20 text-blue-400 hover:border-blue-600/50'
                      : 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300'
                    : isDark
                      ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400 hover:border-emerald-600/50'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300'
              }`}
            >
              <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                {preset.operator.toUpperCase()}
              </div>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
