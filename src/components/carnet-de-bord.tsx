"use client";

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Send, Trash2, Clock } from 'lucide-react'
import { CabinNote } from '../types'

interface CarnetDeBordProps {
  theme: 'dark' | 'light';
  role: 'proprio' | 'employe' | 'vm';
  notes: CabinNote[];
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  proprio: '👑 Proprio',
  employe: '👤 Gérant',
  vm: '🛵 VM',
}

export function CarnetDeBord({ theme, role, notes, onAddNote, onDeleteNote }: CarnetDeBordProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAddNote(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      const trimmed = text.trim()
      if (!trimmed) return
      onAddNote(trimmed)
      setText('')
    }
  }

  const isDark = theme === 'dark'

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <BookOpen className="size-4 text-natural-accent" />
        <div>
          <h3 className="text-sm font-bold uppercase font-serif text-natural-accent">Carnet de Bord</h3>
          <p className="text-[9px] text-stone-500">Journal libre — notez tout ce qui se passe</p>
        </div>
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className={`p-4 rounded-[24px] border flex flex-col gap-3 ${
          isDark
            ? 'bg-[#0E1B15] border-[#1C2C22]'
            : 'bg-white border-[#DCD6CD] shadow-sm'
        }`}
      >
        <textarea
          ref={textareaRef}
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Écrivez ici... Ex: dépôt mtn 30000, retrait moov 5000, client 0197... a rappelé, caisse vérifiée OK...`}
          className={`w-full border rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-natural-accent/30 resize-none leading-relaxed transition-all ${
            isDark
              ? 'bg-[#050807] border-[#1C2C22] text-white placeholder:text-stone-600'
              : 'bg-stone-50 border-[#DCD6CD] text-[#111614] placeholder:text-stone-400'
          }`}
        />

        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-bold ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
            Ctrl+Entrée pour enregistrer
          </span>
          <button
            type="submit"
            disabled={!text.trim()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              text.trim()
                ? 'bg-natural-accent text-[#0A0F0D] hover:bg-[#c9a430] active:scale-[0.97]'
                : isDark ? 'bg-[#1C2C22] text-stone-600 cursor-not-allowed' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Send className="size-3.5" />
            Enregistrer
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-8 text-[11px] ${isDark ? 'text-stone-600' : 'text-stone-400'}`}
            >
              Aucune note pour l'instant. Commencez à écrire !
            </motion.div>
          ) : (
            [...notes].reverse().map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.97 }}
                className={`p-4 rounded-2xl border flex flex-col gap-2 group ${
                  isDark
                    ? 'bg-[#0E1B15]/50 border-[#1C2C22] hover:border-[#2A3C2E]'
                    : 'bg-white border-[#DCD6CD] hover:border-stone-300 shadow-sm'
                }`}
              >
                {/* Note text */}
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-[#E4EAD8]' : 'text-[#111614]'}`}>
                  {note.text}
                </p>

                {/* Meta row */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-[9px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
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
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
