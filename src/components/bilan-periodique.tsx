"use client";

import { useState, useMemo } from "react"
import { BarChart3, Coins, TrendingUp, Download } from "lucide-react"
import { Transaction } from "../types"

interface BilanPeriodiqueProps {
  theme: "dark" | "light";
  transactions: Transaction[];
  TODAY_STR: string;
  YESTERDAY_STR: string;
  mode: "cabine" | "vm";
  getWeekRange: (dateStr: string) => { start: string; end: string };
  getLocalDateString: (d?: Date) => string;
}

type PeriodType = "day" | "week" | "month" | "year" | "custom";
type OpFilter = "all" | "mtn" | "moov" | "celtiis";

export function BilanPeriodique({
  theme,
  transactions,
  TODAY_STR,
  YESTERDAY_STR,
  mode,
  getWeekRange,
  getLocalDateString,
}: BilanPeriodiqueProps) {
  const isDark = theme === "dark";

  const [periodType, setPeriodType] = useState<PeriodType>("day");
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [customStart, setCustomStart] = useState(TODAY_STR);
  const [customEnd, setCustomEnd] = useState(TODAY_STR);
  const [opFilter, setOpFilter] = useState<OpFilter>("all");

  const periodTxns = useMemo(() => {
    let filtered: Transaction[] = [];
    if (periodType === "day") {
      filtered = transactions.filter((t) => t.date === selectedDate);
    } else if (periodType === "week") {
      const range = getWeekRange(selectedDate);
      filtered = transactions.filter((t) => t.date >= range.start && t.date <= range.end);
    } else if (periodType === "month") {
      const prefix = selectedDate.slice(0, 7);
      filtered = transactions.filter((t) => t.date.startsWith(prefix));
    } else if (periodType === "year") {
      const prefix = selectedDate.slice(0, 4);
      filtered = transactions.filter((t) => t.date.startsWith(prefix));
    } else if (periodType === "custom") {
      filtered = transactions.filter((t) => t.date >= customStart && t.date <= customEnd);
    }
    if (opFilter !== "all") {
      filtered = filtered.filter((t) => t.operator === opFilter);
    }
    return filtered;
  }, [transactions, periodType, selectedDate, customStart, customEnd, opFilter, getWeekRange]);

  const stats = useMemo(() => {
    const s = {
      // Cabine types
      deposit:    { sum: 0, count: 0 },
      withdrawal: { sum: 0, count: 0 },
      credit:     { sum: 0, count: 0 },
      forfait:    { sum: 0, count: 0 },
      appro:      { sum: 0, count: 0 },
      ajust:      { sum: 0, count: 0 },
      // VM types
      vmEnvoi:    { sum: 0, count: 0 },
      vmRetrait:  { sum: 0, count: 0 },
      vmCredit:   { sum: 0, count: 0 },
      vmRecov:    { sum: 0, count: 0 },
      vmSwap:     { sum: 0, count: 0 },
      // Total
      total:      { sum: 0, count: 0 },
    };
    periodTxns.forEach((t) => {
      if (mode === "vm") {
        if (t.id.startsWith("RECOV-") || t.category.includes("Encaissement") || t.category.includes("Règlement Global")) {
          s.vmRecov.sum += t.amount; s.vmRecov.count += 1;
        } else if (t.id.startsWith("agency-swap-") || t.category.includes("Échange") || t.category.includes("Rotation") || t.clientName === "AGENCE ROTATION") {
          s.vmSwap.sum += t.amount; s.vmSwap.count += 1;
        } else if (t.type === "withdrawal") {
          s.vmRetrait.sum += t.amount; s.vmRetrait.count += 1;
          s.total.sum += t.amount;
          s.total.count += 1;
        } else {
          if (t.category.includes("Crédit Dehors") || t.category.includes("Crédit")) {
            s.vmCredit.sum += t.amount; s.vmCredit.count += 1;
            // Treat as deposit (envoi) too
            s.vmEnvoi.sum += t.amount; s.vmEnvoi.count += 1;
          } else {
            s.vmEnvoi.sum += t.amount; s.vmEnvoi.count += 1;
          }
          s.total.sum += t.amount;
          s.total.count += 1;
        }
      } else {
        if (t.type === "deposit")    { s.deposit.sum    += t.amount; s.deposit.count    += 1; s.total.sum += t.amount; s.total.count += 1; }
        else if (t.type === "withdrawal") { s.withdrawal.sum += t.amount; s.withdrawal.count += 1; s.total.sum += t.amount; s.total.count += 1; }
        else if (t.type === "credit")     { s.credit.sum     += t.amount; s.credit.count     += 1; s.total.sum += t.amount; s.total.count += 1; }
        else if (t.type === "forfait")    { s.forfait.sum    += t.amount; s.forfait.count    += 1; s.total.sum += t.amount; s.total.count += 1; }
        else if (t.type === "appro_sim")  { s.appro.sum      += t.amount; s.appro.count      += 1; }
        else if (t.type === "ajust_cash") { s.ajust.sum      += t.amount; s.ajust.count      += 1; }
      }
    });
    return s;
  }, [periodTxns, mode]);

  const periodLabel = useMemo(() => {
    if (periodType === "day") {
      if (selectedDate === TODAY_STR) return "Aujourd'hui";
      if (selectedDate === YESTERDAY_STR) return "Hier";
      const [y, m, d] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (periodType === "week") {
      const { start, end } = getWeekRange(selectedDate);
      const [sy, sm, sd] = start.split("-").map(Number);
      const [ey, em, ed] = end.split("-").map(Number);
      const ds = new Date(sy, sm - 1, sd);
      const de = new Date(ey, em - 1, ed);
      return `Sem. du ${ds.getDate()} ${ds.toLocaleDateString("fr-FR", { month: "short" })} au ${de.getDate()} ${de.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
    }
    if (periodType === "month") {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    }
    if (periodType === "year") return `Année ${selectedDate.slice(0, 4)}`;
    if (periodType === "custom") return `${customStart} → ${customEnd}`;
    return selectedDate;
  }, [periodType, selectedDate, customStart, customEnd, TODAY_STR, YESTERDAY_STR, getWeekRange]);

  const handleExportCSV = () => {
    const headers = "ID,Telephone,Operateur,Type,Montant,Heure,Date,Categorie,ClientName\n";
    const rows = periodTxns.map((t) =>
      `${t.id},${t.phone},${t.operator},${t.type},${t.amount},${t.time},${t.date},"${t.category}","${t.clientName || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bilan_${mode}_${periodLabel.replace(/[\s\/]/g, "_")}.csv`;
    link.click();
  };

  const rows =
    mode === "vm"
      ? [
          { label: "Envois (Dépôts / Crédits)", dot: "bg-cyan-400", textColor: isDark ? "text-cyan-400" : "text-cyan-700", s: stats.vmEnvoi },
          { label: "Retraits (Cash Versé)", dot: "bg-rose-500", textColor: isDark ? "text-rose-400" : "text-rose-700", s: stats.vmRetrait },
        ]
      : [
          { label: "Dépôts (Envois)", dot: "bg-natural-accent", textColor: isDark ? "text-stone-200" : "text-stone-900", s: stats.deposit },
          { label: "Retraits (Sorties)", dot: "bg-rose-500", textColor: isDark ? "text-rose-400" : "text-rose-700", s: stats.withdrawal },
          { label: "Ventes de Crédits", dot: "bg-amber-500", textColor: isDark ? "text-amber-400" : "text-amber-800", s: stats.credit },
          { label: "Ventes de Forfaits", dot: "bg-emerald-500", textColor: isDark ? "text-emerald-400" : "text-emerald-700", s: stats.forfait },
          { label: "Recharges SIM (Appro)", dot: "bg-indigo-500", textColor: isDark ? "text-indigo-400" : "text-indigo-700", s: stats.appro },
          { label: "Ajustements Caisse (Cash)", dot: "bg-stone-500", textColor: isDark ? "text-stone-400" : "text-stone-600", s: stats.ajust },
        ];

  const byDate = useMemo(() => {
    if (periodType !== "week" && periodType !== "month" && periodType !== "custom") return null;
    const map: Record<string, number> = {};
    periodTxns.forEach((t) => { map[t.date] = (map[t.date] || 0) + t.amount; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  }, [periodTxns, periodType]);

  return (
    <section
      className={`p-6 rounded-[32px] border transition-colors flex flex-col gap-5 ${
        isDark ? "bg-[#0E1B15]/40 border-[#1C2C22]" : "bg-white border-[#DCD6CD] shadow-sm"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold uppercase font-serif tracking-wide flex items-center gap-2 text-natural-accent">
            <BarChart3 className="size-4.5" />
            Bilan Périodique — {mode === "vm" ? "🛵 Terrain VM" : "🗄️ Cabine"}
          </h3>
          <p className={`text-[10px] mt-0.5 ${isDark ? "text-stone-500" : "text-stone-400"}`}>
            {periodLabel} · {stats.total.count} opération{stats.total.count !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
            isDark ? "border-[#1C2C22] text-stone-400 hover:bg-[#1C2C22]" : "border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          <Download className="size-3" /> CSV
        </button>
      </div>

      {/* Period type tabs */}
      <div
        className={`flex p-1 rounded-2xl border text-xs font-bold transition-all ${
          isDark ? "bg-[#050807] border-[#1C2C22]" : "bg-[#EFECE6] border-[#DCD6CD]"
        }`}
      >
        {(["day", "week", "month", "year", "custom"] as PeriodType[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodType(p)}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer font-bold text-[10px] ${
              periodType === p
                ? "bg-natural-accent text-[#0A0F0D] shadow-md"
                : isDark
                ? "text-stone-400 hover:text-white"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {p === "day" ? "Jour" : p === "week" ? "Sem." : p === "month" ? "Mois" : p === "year" ? "Année" : "Période"}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div
        className={`flex flex-wrap items-center gap-2 p-1.5 rounded-xl border text-[10px] font-bold ${
          isDark ? "bg-[#050807]/60 border-stone-800" : "bg-stone-100 border-stone-200"
        }`}
      >
        {periodType === "day" && (
          <>
            {[{ label: "Auj.", val: TODAY_STR }, { label: "Hier", val: YESTERDAY_STR }].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setSelectedDate(val)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDate === val
                    ? "bg-natural-accent text-[#0A0F0D] shadow"
                    : isDark ? "text-stone-400 hover:text-white" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {label}
              </button>
            ))}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className={`px-1 bg-transparent border-0 font-mono text-[9px] focus:outline-none cursor-pointer ${isDark ? "text-white" : "text-stone-850"}`}
            />
          </>
        )}
        {periodType === "week" && (
          <>
            <button
              onClick={() => setSelectedDate(TODAY_STR)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                getWeekRange(selectedDate).start === getWeekRange(TODAY_STR).start
                  ? "bg-natural-accent text-[#0A0F0D] shadow"
                  : isDark ? "text-stone-400 hover:text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Cette Sem.
            </button>
            <button
              onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setSelectedDate(getLocalDateString(d)); }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${isDark ? "text-stone-400 hover:text-white" : "text-stone-600 hover:text-stone-900"}`}
            >
              Précédente
            </button>
          </>
        )}
        {periodType === "month" && (
          <select
            value={selectedDate.slice(0, 7)}
            onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
            className={`p-1 bg-transparent border-0 font-mono text-[10px] focus:outline-none cursor-pointer ${isDark ? "text-white bg-[#050807]" : "text-stone-850 bg-[#EFECE6]"}`}
          >
            <option value={TODAY_STR.slice(0, 7)}>Mois En Cours</option>
            <option value={YESTERDAY_STR.slice(0, 7)}>Mois Précédent</option>
            {["2026-05","2026-04","2026-03","2026-02","2026-01","2025-12","2025-11"].map((m) => (
              <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</option>
            ))}
          </select>
        )}
        {periodType === "year" && (
          <select
            value={selectedDate.slice(0, 4)}
            onChange={(e) => setSelectedDate(`${e.target.value}-01-01`)}
            className={`p-1 bg-transparent border-0 font-mono text-[10px] focus:outline-none cursor-pointer ${isDark ? "text-white bg-[#050807]" : "text-stone-850 bg-[#EFECE6]"}`}
          >
            {["2026", "2025", "2024"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {periodType === "custom" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={isDark ? "text-stone-500" : "text-stone-400"}>Du</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => e.target.value && setCustomStart(e.target.value)}
              className={`px-2 py-0.5 rounded-lg border font-mono text-[9px] focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${isDark ? "bg-[#050807] border-[#1C2C22] text-white" : "bg-white border-stone-300 text-stone-900"}`}
            />
            <span className={isDark ? "text-stone-500" : "text-stone-400"}>au</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={(e) => e.target.value && setCustomEnd(e.target.value)}
              className={`px-2 py-0.5 rounded-lg border font-mono text-[9px] focus:outline-none focus:ring-1 focus:ring-natural-accent/30 ${isDark ? "bg-[#050807] border-[#1C2C22] text-white" : "bg-white border-stone-300 text-stone-900"}`}
            />
          </div>
        )}
      </div>

      {/* Operator filter — cabine only */}
      {mode === "cabine" && (
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold uppercase ${isDark ? "text-stone-500" : "text-stone-400"}`}>Réseau :</span>
          <div className={`flex p-0.5 rounded-lg border text-[9px] font-bold transition-all ${isDark ? "bg-[#050807]/60 border-[#1C2C22]" : "bg-stone-105 border-stone-200"}`}>
            {(["all", "mtn", "moov", "celtiis"] as OpFilter[]).map((op) => (
              <button
                key={op}
                onClick={() => setOpFilter(op)}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  opFilter === op ? "bg-natural-accent text-[#0A0F0D]" : isDark ? "text-stone-400 hover:text-white" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {op === "all" ? "Tous" : op.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI hero — Chiffre d'affaires */}
      <div className={`p-5 rounded-2xl border relative overflow-hidden ${isDark ? "bg-gradient-to-br from-[#0E1B15] to-[#050807] border-[#1C2C22]" : "bg-gradient-to-br from-amber-50/50 to-white border-amber-200/50"}`}>
        <div className="absolute -right-8 -top-8 size-32 rounded-full bg-natural-accent/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? "text-stone-500" : "text-stone-500"}`}>
              📊 Chiffre d'Affaires — {periodLabel}
            </p>
            <div className="font-serif font-black text-3xl text-natural-accent">
              {stats.total.sum.toLocaleString("fr-FR")}
              <span className="text-base font-sans font-medium text-stone-500 ml-1">FCFA</span>
            </div>
            <p className={`text-[10px] mt-1 ${isDark ? "text-stone-500" : "text-stone-400"}`}>
              sur {stats.total.count} opération{stats.total.count !== 1 ? "s" : ""} au total
            </p>
          </div>
          <div className={`size-11 rounded-2xl flex items-center justify-center ${isDark ? "bg-natural-accent/10 border border-natural-accent/20" : "bg-amber-50 border border-amber-200"}`}>
            <TrendingUp className="size-5 text-natural-accent" />
          </div>
        </div>
      </div>

      {/* Breakdown table */}
      <div className={`overflow-hidden rounded-2xl border shadow-inner ${isDark ? "bg-[#0A0F0D] border-stone-800" : "bg-white border-stone-200"}`}>
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className={`border-b text-[10px] uppercase font-extrabold ${isDark ? "bg-[#050807] border-stone-800 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"}`}>
              <th className="py-3 px-4 font-sans">Activité</th>
              <th className="py-3 px-4 text-right font-sans">Volume (FCFA)</th>
              <th className="py-3 px-4 text-center font-sans">Ops</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-stone-800/60" : "divide-stone-200"}`}>
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-stone-500/5 transition-colors">
                <td className={`py-3 px-4 font-sans font-bold flex items-center gap-2 ${isDark ? "text-stone-200" : "text-stone-800"}`}>
                  <span className={`size-2 rounded-full ${row.dot} shadow-sm`} />
                  {row.label}
                </td>
                <td className={`py-3 px-4 text-right font-bold ${row.textColor}`}>{row.s.sum.toLocaleString("fr-FR")}</td>
                <td className={`py-3 px-4 text-center ${isDark ? "text-stone-400" : "text-stone-600"}`}>{row.s.count} tx</td>
              </tr>
            ))}
            <tr className={`border-t font-black text-sm ${isDark ? "bg-[#0A0F0D] text-natural-accent border-[#1C2C22]" : "bg-stone-50 text-stone-900 border-[#DCD6CD]"}`}>
              <td className="py-3.5 px-4 font-sans font-black flex items-center gap-2">
                <Coins className="size-4" /> Total Période
              </td>
              <td className="py-3.5 px-4 text-right">{stats.total.sum.toLocaleString("fr-FR")}</td>
              <td className="py-3.5 px-4 text-center">{stats.total.count} tx</td>
            </tr>
          </tbody>
        </table>
      </div>

      {mode === "vm" && (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border ${isDark ? "bg-[#050807] border-[#1C2C22]" : "bg-stone-50 border-stone-200"}`}>
          <div className="flex flex-col gap-0.5">
            <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-amber-500" : "text-amber-700"}`}>
              ⚠️ Crédits Dehors Accordés
            </span>
            <div className="font-mono font-bold text-base text-amber-500">
              {stats.vmCredit.sum.toLocaleString("fr-FR")} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
            <span className={`text-[8.5px] leading-tight ${isDark ? "text-stone-550" : "text-stone-500"}`}>
              {stats.vmCredit.count} transaction{stats.vmCredit.count !== 1 ? "s" : ""} (Inclus dans Envois)
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-emerald-500" : "text-emerald-700"}`}>
              ✔ Crédits Récupérés (Encaissements)
            </span>
            <div className="font-mono font-bold text-base text-emerald-500">
              {stats.vmRecov.sum.toLocaleString("fr-FR")} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
            <span className={`text-[8.5px] leading-tight ${isDark ? "text-stone-550" : "text-stone-500"}`}>
              {stats.vmRecov.count} transaction{stats.vmRecov.count !== 1 ? "s" : ""} (Non cumulés dans le CA)
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-indigo-400" : "text-indigo-650"}`}>
              🔄 Rotations Agence (Échanges)
            </span>
            <div className="font-mono font-bold text-base text-indigo-500">
              {stats.vmSwap.sum.toLocaleString("fr-FR")} <span className="text-[10px] text-stone-500 font-normal">FCFA</span>
            </div>
            <span className={`text-[8.5px] leading-tight ${isDark ? "text-stone-550" : "text-stone-500"}`}>
              {stats.vmSwap.count} transaction{stats.vmSwap.count !== 1 ? "s" : ""} (Non cumulés dans le CA)
            </span>
          </div>
        </div>
      )}

      {/* Mini bar chart for week/month/custom */}
      {byDate && byDate.length > 0 && (() => {
        const maxVal = Math.max(...byDate.map(([, v]) => v), 1);
        return (
          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0A0F0D]/60 border-stone-900" : "bg-stone-50 border-stone-200"}`}>
            <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-3 ${isDark ? "text-stone-500" : "text-stone-400"}`}>Volume par jour</p>
            <div className="flex items-end gap-1 h-14">
              {byDate.map(([date, vol]) => {
                const h = Math.max((vol / maxVal) * 100, 4);
                const dayNum = date.split("-")[2];
                return (
                  <div key={date} className="flex flex-col items-center gap-1 flex-1" title={`${date}: ${vol.toLocaleString("fr-FR")} FCFA`}>
                    <div
                      className="w-full rounded-t bg-natural-accent/70 hover:bg-natural-accent transition-all"
                      style={{ height: `${h}%` }}
                    />
                    <span className={`text-[6px] font-mono ${isDark ? "text-stone-600" : "text-stone-400"}`}>{dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
