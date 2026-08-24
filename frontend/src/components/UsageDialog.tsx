"use client"

import React from "react"
import { UsageSummary } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Coins,
  Cpu,
  Layers,
  Activity,
} from "lucide-react"

interface UsageDialogProps {
  isOpen: boolean
  onClose: () => void
  usage: UsageSummary | null
  onRefresh: () => void
  isValidating?: boolean
}

export function UsageDialog({
  isOpen,
  onClose,
  usage,
  onRefresh,
  isValidating,
}: UsageDialogProps) {
  if (!usage) return null

  const isConnected = usage.quota?.status === "active"
  const totalTokens = usage.total_tokens || 0
  const promptTokens = usage.prompt_tokens || 0
  const candidatesTokens = usage.candidates_tokens || 0
  const totalRequests = usage.total_requests || 0
  const costUsd = usage.estimated_cost_usd || 0
  const costBrl = usage.estimated_cost_brl || 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-blue-50/70 to-white flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Painel de Consumo & Cota de IA
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Rastreamento em tempo real de tokens consumidos, custos e status da API do Google Gemini.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isValidating}
            className="h-8 text-xs font-semibold text-slate-700 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isValidating ? "animate-spin text-blue-600" : ""}`} />
            <span>Atualizar</span>
          </Button>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* API Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
              isConnected
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                : "bg-amber-50/60 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-start space-x-3">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">
                    {isConnected ? "Google Gemini PRO / Imagen Conectado" : "Modo Simulador Local Ativo"}
                  </h4>
                  <Badge
                    variant={isConnected ? "success" : "warning"}
                    className="text-[10px] font-bold uppercase"
                  >
                    {usage.quota?.tier || "Local"}
                  </Badge>
                </div>
                <p className="text-xs mt-1 opacity-90 leading-relaxed">
                  {usage.quota?.message}
                </p>
              </div>
            </div>

            <a
              href="https://aistudio.google.com/plan_information"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline shrink-0 pt-0.5"
            >
              <span>Ver no Google</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Tokens Totais
              </span>
              <h3 className="text-xl font-black text-slate-900">
                {totalTokens.toLocaleString("pt-BR")}
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {promptTokens} in / {candidatesTokens} out
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Requisições IA
              </span>
              <h3 className="text-xl font-black text-slate-900">
                {totalRequests}
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                chamadas executadas
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                Custo em Reais
              </span>
              <h3 className="text-xl font-black text-emerald-900">
                R$ {costBrl.toFixed(2)}
              </h3>
              <span className="text-[10px] text-emerald-600/80 font-medium">
                estimado (câmbio R$ 5,50)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                Custo em Dólar
              </span>
              <h3 className="text-xl font-black text-blue-900">
                ${costUsd.toFixed(3)}
              </h3>
              <span className="text-[10px] text-blue-600/80 font-medium">
                Google Cloud billing
              </span>
            </div>

          </div>

          {/* Quota Limits Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              Limites de Cota do Seu Plano
            </h4>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Requisições/min (RPM)</span>
                <strong className="text-sm font-bold text-slate-800">
                  {usage.quota?.limits?.rpm || "Até 360 RPM"}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Tokens/min (TPM)</span>
                <strong className="text-sm font-bold text-slate-800">
                  {usage.quota?.limits?.tpm || "4.000.000 TPM"}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Requisições/dia (RPD)</span>
                <strong className="text-sm font-bold text-slate-800">
                  {usage.quota?.limits?.rpd || "Ilimitado"}
                </strong>
              </div>
            </div>
          </div>

          {/* Recent API Call History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              Últimas Chamadas Registradas ({usage.recent_calls?.length || 0})
            </h4>

            <div className="space-y-2">
              {usage.recent_calls?.map((call) => (
                <div
                  key={call.id}
                  className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {call.book?.titulo || "Geração Avulsa"}
                      </span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                        {call.model}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(call.created_at).toLocaleTimeString("pt-BR")} • {call.operation_type}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-blue-600 block">
                      +{call.total_tokens} tokens
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ${Number(call.estimated_cost_usd).toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}

              {(!usage.recent_calls || usage.recent_calls.length === 0) && (
                <div className="p-6 text-center text-xs text-slate-400 rounded-2xl border-2 border-dashed border-slate-200">
                  Nenhuma chamada registrada ainda. Ao disparar uma geração de imagens, os tokens aparecerão aqui.
                </div>
              )}
            </div>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  )
}
