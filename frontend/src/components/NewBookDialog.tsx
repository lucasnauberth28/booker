"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Setup, Book } from "@/types"
import { fetcher } from "@/lib/fetcher"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface NewBookDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (book: Book) => void
}

export function NewBookDialog({ isOpen, onClose, onCreated }: NewBookDialogProps) {
  const { data: setups } = useSWR<Setup[]>(isOpen ? "/setups" : null, fetcher)
  const [titulo, setTitulo] = useState("")
  const [nicho, setNicho] = useState("")
  const [totalPaginas, setTotalPaginas] = useState(20)
  const [setupId, setSetupId] = useState<number | string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupId) {
      toast.error("Por favor, selecione um gabarito de dimensões KDP.")
      return
    }

    setLoading(true)
    try {
      const newBook = await api.books.create({
        titulo,
        nicho,
        total_paginas_desejadas: Number(totalPaginas),
        setup_id: Number(setupId),
      })
      toast.success(`Livro "${titulo}" criado com sucesso!`)
      setTitulo("")
      setNicho("")
      setTotalPaginas(20)
      onCreated(newBook)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar livro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-blue-600" />
            Novo Projeto de Livro KDP
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Livro</label>
            <Input
              required
              autoFocus
              placeholder="Ex: Mandalas dos Animais Místicos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nicho / Categoria</label>
            <Input
              required
              placeholder="Ex: Mandalas / Adult Coloring / Mindfulness"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total de Páginas</label>
              <Input
                type="number"
                min="1"
                max="200"
                required
                value={totalPaginas}
                onChange={(e) => setTotalPaginas(Number(e.target.value))}
                className="bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gabarito KDP</label>
              <select
                required
                value={setupId}
                onChange={(e) => setSetupId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
              >
                <option value="">Selecione o formato...</option>
                {setups?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.largura_polegadas}" × {s.altura_polegadas}")
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl mt-2 transition-all active:scale-98 shadow-md shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Processando...</span>
              </>
            ) : (
              "Criar Livro"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
