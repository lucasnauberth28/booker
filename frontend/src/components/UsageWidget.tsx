"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { UsageSummary } from "@/types"
import { fetcher } from "@/lib/fetcher"
import { Sparkles, Zap, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react"
import { UsageDialog } from "./UsageDialog"

export function UsageWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: usage, mutate, isValidating } = useSWR<UsageSummary>("/usage/summary", fetcher, {
    refreshInterval: 10000,
  })

  const isConfigured = usage?.quota?.configured ?? false
  const status = usage?.quota?.status ?? "missing_key"
  const totalTokens = usage?.total_tokens ?? 0
  const costBrl = usage?.estimated_cost_brl ?? 0

  const formatTokens = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white border border-slate-200/80 shadow-xs hover:shadow-sm text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
        title="Clique para ver o Painel de Consumo & Cota de Tokens"
      >
        {/* Status Light */}
        <span className="relative flex h-2 w-2">
          {status === "active" ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          )}
        </span>

        {/* Model and Tokens */}
        <div className="flex items-center space-x-1.5 text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold hidden sm:inline">
            {status === "active" ? "Gemini Pro" : "IA Local"}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-700 font-extrabold">{formatTokens(totalTokens)} tok</span>
        </div>

        {/* BRL estimated cost */}
        <span className="hidden md:inline-block text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
          R$ {costBrl.toFixed(2)}
        </span>
      </button>

      <UsageDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        usage={usage || null}
        onRefresh={() => mutate()}
        isValidating={isValidating}
      />
    </>
  )
}
