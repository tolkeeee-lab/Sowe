"use client";

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Send, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react'
import { Debt } from '../types'
import { Button } from './ui/button'

interface DettesRappelsProps {
  theme: 'dark' | 'light';
  role: 'proprio' | 'employe' | 'vm';
  debts: Debt[];
  onAddDebt: (debtData: Omit<Debt, 'id' | 'cabin_id'>) => Promise<void>;
  onSettleDebt: (id: string) => Promise<void>;
  onDeleteDebt: (id: string) => Promise<void>;
}

export function DettesRappels({ 
  theme, 
  role, 
  debts, 
  onAddDebt, 
  onSettleDebt, 
  onDeleteDebt 
}: DettesRappelsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [clientName, setClientName] = useState('')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [type, setType] = useState<Debt['type']>('depot_a_rendre')
  const [operator, setOperator] = useState<Debt['operator']>('mtn')
  
  // Directions for proprietor/booth transfers
  const [transferDirection, setTransferDirection] = useState<'inject' | 'withdraw'>('inject')

  const [filterStatus, setFilterStatus] = useState<'all' | 'non_paye' | 'paye'>('non_paye')
  const [showArchive, setShowArchive] = useState(false)

  const isDark = theme === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !amount) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    // For owner transfers, we prepend direction prefix to client name if relevant or keep it structured
    let finalClientName = clientName.trim()
    if (type === 'transfert_proprio_cash') {
      finalClientName = transferDirection === 'inject' 
        ? `APPORT CASH (PROPRIO → CABINE)` 
        : `RETRAIT CASH (CABINE → PROPRIO)`
    } else if (type === 'transfert_proprio_sim') {
      finalClientName = transferDirection === 'inject'
        ? `APPRO FLOAT SIM (PROPRIO → SIM)`
        : `RECUP FLOAT SIM (SIM → PROPRIO)`
    }

    await onAddDebt({
      client_name: finalClientName,
      amount: parsedAmount,
      phone: phone.trim() || undefined,
      due_date: dueDate || undefined,
      type,
      operator: type === 'transfert_proprio_sim' ? operator : undefined,
      status: 'non_paye'
    })

    // Reset Form
    setClientName('')
    setAmount('')
    setPhone('')
    setDueDate('')
    setType('depot_a_rendre')
    setTransferDirection('inject')
    setShowAddForm(false)
  }

  // Pre-fill fields helper when changing types
  const handleTypeChange = (newType: Debt['type']) => {
    setType(newType)
    if (newType === 'transfert_proprio_cash') {
      setClientName('PROPRIÉTAIRE')
    } else if (newType === 'transfert_proprio_sim') {
      setClientName('PROPRIÉTAIRE')
    } else {
      setClientName('')
    }
  }

  // Format type label
  const getTypeLabel = (type: Debt['type']) => {
    switch (type) {
      case 'depot_a_rendre': return 'Dépôt client à rendre'
      case 'credit_client': return 'Crédit client'
      case 'transfert_proprio_cash': return 'Flux Cash (Proprio)'
      case 'transfert_proprio_sim': return 'Flux Float SIM (Proprio)'
      default: return 'Autre rappel'
    }
  }

  // Format type style/color badges
  const getTypeBadgeStyles = (type: Debt['type']) => {
    switch (type) {
      case 'depot_a_rendre':
        return isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'credit_client':
        return isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
      case 'transfert_proprio_cash':
        return isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
      case 'transfert_proprio_sim':
        return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default:
        return isDark ? 'bg-stone-500/10 text-stone-400 border-stone-500/20' : 'bg-stone-50 text-stone-700 border-stone-200'
    }
  }

  // Calculate if debt is overdue
  const isOverdue = (dueDateStr?: string) => {
    if (!dueDateStr) return false
    const today = new Date()
    today.setHours(0,0,0,0)
    const targetDate = new Date(dueDateStr)
    targetDate.setHours(0,0,0,0)
    return targetDate < today
  }

  const shareReminderOnWhatsApp = (debt: Debt) => {
    if (!debt.phone) return
    let message = ''
    if (debt.type === 'depot_a_rendre') {
      message = `*RAPPEL MOMO PREMIUM*%0ABonjour, ceci est un rappel concernant votre dépôt de *${debt.amount.toLocaleString('fr-FR')} FCFA* à récupérer dans notre cabine. Merci de passer dès que possible.`
    } else if (debt.type === 'credit_client') {
      message = `*RAPPEL MOMO PREMIUM*%0ABonjour, nous vous contactons pour régulariser le crédit client d'un montant de *${debt.amount.toLocaleString('fr-FR')} FCFA*. Merci pour votre confiance !`
    } else {
      message = `*RAPPEL MOMO PREMIUM*%0AObjet : Rappel de transaction d'un montant de *${debt.amount.toLocaleString('fr-FR')} FCFA*.`
    }
    window.open(`https://api.whatsapp.com/send?phone=${debt.phone}&text=${message}`, '_blank')
  }

  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      if (filterStatus === 'all') return true
      return d.status === filterStatus
    })
  }, [debts, filterStatus])

  const unpaidCount = useMemo(() => debts.filter(d => d.status === 'non_paye').length, [debts])

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-natural-accent animate-pulse" />
          <div>
            <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Dettes & Rappels</h3>
            <p className="text-[9px] text-stone-500">Suivi des fonds à rendre, crédits et transferts proprio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unpaidCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
              {unpaidCount} En cours
            </span>
          )}
          <button
            onClick={() => setShowAddForm(prev => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-natural-accent hover:bg-natural-accent-hover text-natural-primary transition-all cursor-pointer"
          >
            {showAddForm ? <X className="size-3" /> : <Plus className="size-3" />}
            {showAddForm ? 'Fermer' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className={`p-4 rounded-[24px] border flex flex-col gap-3.5 overflow-hidden ${
              isDark ? 'bg-[#0E1B15] border-[#1C2C22]' : 'bg-white border-[#DCD6CD] shadow-sm'
            }`}
          >
            {/* Type selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Type de rappel / dette</label>
              <select
                value={type}
                onChange={e => handleTypeChange(e.target.value as any)}
                className={`w-full p-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                  isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-800'
                }`}
              >
                <option value="depot_a_rendre">Dépôt client à rendre (Cash collecté)</option>
                <option value="credit_client">Crédit client en attente de paiement</option>
                <option value="transfert_proprio_cash">Mouvement Cash (Proprio ↔ Caisse)</option>
                <option value="transfert_proprio_sim">Mouvement Float SIM (Proprio ↔ SIM)</option>
                <option value="autre">Autre dette / rappel</option>
              </select>
            </div>

            {/* Custom inputs based on type */}
            {type === 'transfert_proprio_cash' || type === 'transfert_proprio_sim' ? (
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-natural-accent/10 bg-natural-accent/5">
                <label className="text-[9px] font-bold text-natural-accent uppercase tracking-wide">Sens du transfert</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setTransferDirection('inject')}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      transferDirection === 'inject' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                        : isDark ? 'border-[#1C2C22] text-stone-400' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    {type === 'transfert_proprio_cash' ? '+ Proprio apporte Cash' : '+ Proprio envoie Float'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDirection('withdraw')}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      transferDirection === 'withdraw' 
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400' 
                        : isDark ? 'border-[#1C2C22] text-stone-400' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    {type === 'transfert_proprio_cash' ? '- Proprio prend Cash' : '- Proprio prend Float'}
                  </button>
                </div>
                <span className="text-[8px] text-stone-500 mt-1">
                  💡 Le solde de la caisse sera automatiquement mis à jour à la validation du règlement de cette dette.
                </span>
              </div>
            ) : null}

            {/* Operator select (SIM transfers only) */}
            {type === 'transfert_proprio_sim' && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Opérateur SIM concerné</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mtn', 'moov', 'celtiis'] as const).map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all uppercase cursor-pointer ${
                        operator === op 
                          ? 'border-natural-accent bg-natural-accent/10 text-natural-accent' 
                          : isDark ? 'border-[#1C2C22] text-stone-400' : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">
                  {type === 'transfert_proprio_cash' || type === 'transfert_proprio_sim' ? 'Bénéficiaire / Cible' : 'Nom Client / Entité'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Koffi, SOGEMA, Propriétaire..."
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
                  }`}
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wide font-mono">Montant (FCFA)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 50000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">N° Téléphone (Optionnel)</label>
                <input
                  type="tel"
                  placeholder="Ex: 0196887722"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
                  }`}
                />
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Échéance (Optionnel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-natural-accent/30 ${
                    isDark ? 'bg-[#050807] border-[#1C2C22] text-white' : 'bg-stone-50 border-[#DCD6CD] text-stone-850'
                  }`}
                />
              </div>
            </div>

            <Button
              variant="premium"
              type="submit"
              size="sm"
              className="w-full mt-1.5 py-2.5 font-bold uppercase"
            >
              Créer la dette / rappel
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tabs Filter for list */}
      <div className={`flex p-1 rounded-xl border text-[10px] font-bold ${
        isDark ? 'bg-[#050807] border-[#1C2C22]' : 'bg-stone-100 border-stone-200'
      }`}>
        <button
          onClick={() => { setFilterStatus('non_paye'); setShowArchive(false); }}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
            filterStatus === 'non_paye' && !showArchive
              ? 'bg-natural-accent text-[#0A0F0D] shadow'
              : isDark ? 'text-stone-400' : 'text-stone-650'
          }`}
        >
          Dettes actives ({debts.filter(d => d.status === 'non_paye').length})
        </button>
        <button
          onClick={() => { setFilterStatus('paye'); setShowArchive(true); }}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
            filterStatus === 'paye' && showArchive
              ? 'bg-natural-accent text-[#0A0F0D] shadow'
              : isDark ? 'text-stone-400' : 'text-stone-650'
          }`}
        >
          Historique réglées ({debts.filter(d => d.status === 'paye').length})
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filteredDebts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-8 text-[11px] ${isDark ? 'text-stone-600' : 'text-stone-400'}`}
            >
              {filterStatus === 'non_paye' 
                ? "Aucune dette active. Tout est en ordre ! ✨" 
                : "Aucune transaction réglée pour le moment."}
            </motion.div>
          ) : (
            filteredDebts.map(debt => {
              const overdue = debt.status === 'non_paye' && isOverdue(debt.due_date)
              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-[24px] border flex flex-col gap-3 group relative transition-all ${
                    overdue
                      ? isDark 
                        ? 'border-red-950 bg-red-950/10' 
                        : 'border-red-200 bg-red-50 text-red-900'
                      : isDark
                        ? 'bg-[#0E1B15]/50 border-[#1C2C22] hover:border-[#2A3C2E]'
                        : 'bg-white border-[#DCD6CD] hover:border-stone-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      {/* Title & Client Name */}
                      <span className={`text-xs font-serif font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        {debt.client_name}
                      </span>
                      
                      {/* Type Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider ${getTypeBadgeStyles(debt.type)}`}>
                          {getTypeLabel(debt.type)}
                        </span>
                        
                        {debt.operator && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            debt.operator === 'mtn' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            debt.operator === 'moov' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {debt.operator}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="font-mono font-bold text-sm text-natural-accent whitespace-nowrap">
                      {debt.amount.toLocaleString('fr-FR')} <span className="text-[10px] font-normal">FCFA</span>
                    </span>
                  </div>

                  {/* Date & Contact Details */}
                  <div className="flex flex-wrap items-center justify-between border-t border-stone-500/5 pt-2.5 text-[9px] font-bold">
                    <div className="flex items-center gap-3 flex-wrap">
                      {debt.due_date && (
                        <span className={`flex items-center gap-1 ${
                          overdue ? 'text-red-500 animate-pulse' : isDark ? 'text-stone-500' : 'text-stone-400'
                        }`}>
                          <Calendar className="size-3" />
                          Échéance : {debt.due_date} {overdue && '(RETARD)'}
                        </span>
                      )}
                      
                      {debt.phone && (
                        <span className={`font-mono ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                          Tél : {debt.phone}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Settle button */}
                      {debt.status === 'non_paye' && (
                        <button
                          onClick={() => onSettleDebt(debt.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[#0A0F0D] rounded-lg transition-all cursor-pointer font-extrabold uppercase text-[8px]"
                          title="Marquer comme payé et mettre à jour la caisse"
                        >
                          <Check className="size-3" />
                          Régler
                        </button>
                      )}

                      {/* WhatsApp Reminder */}
                      {debt.status === 'non_paye' && debt.phone && (
                        <button
                          onClick={() => shareReminderOnWhatsApp(debt)}
                          className={`flex items-center gap-1 px-2 py-1.5 border rounded-lg transition-all cursor-pointer text-[8px] font-bold ${
                            isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-300' : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Send className="size-2.5" />
                          Relancer
                        </button>
                      )}

                      {/* Delete button (Proprio only) */}
                      {role === 'proprio' && (
                        <button
                          onClick={() => onDeleteDebt(debt.id)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer`}
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
