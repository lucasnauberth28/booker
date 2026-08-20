"use client"

import React, { useState } from "react"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddPromptDialogProps {
  bookId: number | null
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddPromptDialog({
  bookId,
  isOpen,
  onClose,
  onCreated,
}: AddPromptDialogProps) {
  const [basePrompt, setBasePrompt] = useState("")
  const [styleModifiers, setStyleModifiers] = useState("thick black outlines, pure white background, coloring book line art")
  const [peso, setPeso] = useState(1.0)
  const [saving, setSaving] = useState(false)

  if (!bookId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const modifiers = styleModifiers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      await api.prompts.create(bookId, {
        base_prompt: basePrompt,
        style_modifiers: modifiers.length > 0 ? modifiers : null,
        peso_distribuicao: Number(peso),
      })

      toast.success("Prompt de IA adicionado com sucesso!")
      setBasePrompt("")
      onCreated()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar prompt")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Adicionar Prompt de IA
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prompt Base</label>
            <Textarea
              required
              autoFocus
              rows={3}
              placeholder="Ex: Majestic lion with intricate floral mandala mane, symmetrical composition"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              className="bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modificadores de Estilo (separados por vírgula)
            </label>
            <Input
              value={styleModifiers}
              onChange={(e) => setStyleModifiers(e.target.value)}
              placeholder="thick lines, vector style, clean outlines"
              className="bg-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Peso de Distribuição</span>
              <span className="text-blue-600 font-bold">{Math.round(peso * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={peso}
              onChange={(e) => setPeso(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl mt-2 transition-all active:scale-98 shadow-md shadow-blue-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Processando...</span>
              </>
            ) : (
              "Salvar Prompt"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
