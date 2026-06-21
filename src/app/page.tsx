"use client";

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Send,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

export default function Home() {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(154200)

  useEffect(() => {
    const client = getSupabase()
    if (client) {
      setSupabaseConnected(true)
    } else {
      setSupabaseConnected(false)
    }
  }, [])

  const simulateTransaction = () => {
    setLoading(true)
    setTimeout(() => {
      setBalance(prev => prev + 5000)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-natural-primary flex items-center justify-center text-natural-accent shadow-md">
              <Wallet className="size-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-natural-primary">Momo</span>
              <span className="text-[10px] block font-semibold text-natural-accent tracking-widest uppercase -mt-1">Premium</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Supabase Status Badge */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              supabaseConnected 
                ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200/60' 
                : 'bg-amber-50/60 text-amber-800 border-amber-200/60'
            }`}>
              <Database className="size-3.5" />
              <span>Supabase: {supabaseConnected ? 'Connecté' : 'Non configuré'}</span>
              {supabaseConnected ? (
                <CheckCircle2 className="size-3.5 text-emerald-600 fill-emerald-100" />
              ) : (
                <XCircle className="size-3.5 text-amber-600 fill-amber-100" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-natural-accent/10 border border-natural-accent/20 rounded-full text-natural-primary text-xs font-semibold w-fit">
              <Zap className="size-3 text-natural-accent" />
              <span>Bienvenue sur votre nouveau projet Next.js</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-natural-primary leading-tight tracking-tight">
              Gérez vos transactions <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-natural-accent to-emerald-700">
                Mobile Money
              </span> avec élégance.
            </h1>
            
            <p className="text-stone-600 text-lg max-w-xl leading-relaxed">
              Momo est configuré avec Next.js App Router, TypeScript et Tailwind CSS v4. Prêt à être connecté à votre base de données Supabase.
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <Button variant="premium" size="lg" onClick={simulateTransaction} loading={loading}>
                Simuler un dépôt (+5 000 FCFA)
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.open('https://supabase.com', '_blank')}>
                Console Supabase
              </Button>
            </div>
          </div>

          {/* Cards Visuals */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-natural-primary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col gap-8 group"
            >
              {/* Background Glow */}
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-natural-accent/20 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Solde Momo</span>
                <Wallet className="size-6 text-natural-accent" />
              </div>

              <div>
                <span className="text-xs text-stone-400 block mb-1">Total disponible</span>
                <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tight">
                  {balance.toLocaleString('fr-FR')} <span className="text-natural-accent text-xl">FCFA</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-white/10 pt-6">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <TrendingUp className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Aujourd'hui</span>
                    <span className="text-xs font-semibold text-emerald-400">+12%</span>
                  </div>
                </div>
                <span className="text-xs text-stone-400 font-medium">**** 8842</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-6 bg-white border border-stone-200/60 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-12 rounded-2xl bg-stone-50 flex items-center justify-center text-natural-primary">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-natural-primary">Sécurité Premium</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Vos transactions sont sécurisées avec un cryptage de bout en bout et connectées à votre authentification Supabase.
            </p>
          </div>

          <div className="p-6 bg-white border border-stone-200/60 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-12 rounded-2xl bg-stone-50 flex items-center justify-center text-natural-primary">
              <Send className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-natural-primary">Intégration Simple</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Connectez facilement vos comptes Orange Money, MTN Mobile Money et Wave via des APIs directes.
            </p>
          </div>

          <div className="p-6 bg-white border border-stone-200/60 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-12 rounded-2xl bg-stone-50 flex items-center justify-center text-natural-primary">
              <Database className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-natural-primary">Base de Données Prête</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Initialisez vos tables PostgreSQL sur Supabase en copiant simplement notre schéma de base de données.
            </p>
          </div>
        </section>

        {/* Setup Assistance Box */}
        {!supabaseConnected && (
          <section className="bg-amber-50/50 border border-amber-200/60 rounded-[32px] p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <Database className="size-5 text-amber-700" />
                Configurez votre projet Supabase
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                Pour lier votre application à votre base de données Supabase, créez un fichier <strong>.env.local</strong> à la racine du projet avec vos identifiants Supabase (par exemple <strong>NEXT_PUBLIC_SUPABASE_URL</strong>).
              </p>
            </div>
            <Button variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100/50 shrink-0" onClick={() => window.open('https://supabase.com', '_blank')}>
              Créer ma DB
            </Button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-12 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} Momo Premium. Conçu pour tolkeeee-lab.</p>
      </footer>
    </div>
  )
}
