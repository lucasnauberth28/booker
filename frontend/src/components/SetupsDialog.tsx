"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Setup } from "@/types"
import { fetcher } from "@/lib/fetcher"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Plus, Trash2, LayoutGrid, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SetupsDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function SetupsDialog({ isOpen, onClose, onUpdated }: SetupsDialogProps) {
  const { data: setups, mutate } = useSWR<Setup[]>(isOpen ? "/setups" : null, fetcher)
  const [showCreate, setShowCreate] = useState(false)
  const [nome, setNome] = useState("")
  const [largura, setLargura] = useState(8.5)
  const [altura, setAltura] = useState(11.0)
  const [margem, setMargem] = useState(0.125)
  const [versoBranco, setVersoBranco] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setupToDelete, setSetupToDelete] = useState<Setup | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.setups.create({
        nome,
        largura_polegadas: Number(largura),
        altura_polegadas: Number(altura),
        margem_seguranca: Number(margem),
        inserir_paginas_em_branco_verso: versoBranco,
      })
      toast.success(`Gabarito "${nome}" criado com sucesso!`)
      setNome("")
      setShowCreate(false)
      mutate()
      onUpdated()
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar setup")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!setupToDelete) return
    try {
      await api.setups.delete(setupToDelete.id)
      toast.success(`Gabarito "${setupToDelete.nome}" removido.`)
      setSetupToDelete(null)
      mutate()
      onUpdated()
    } catch (e: any) {
      toast.error("Erro ao excluir setup")
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
          
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Gabaritos e Dimensões KDP
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Configure os padrões de impressão exigidos pela Amazon (dimensões em polegadas, margens e verso em branco).
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowCreate(!showCreate)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-semibold"
            >
              {showCreate ? "Cancelar" : "+ Novo Gabarito"}
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {showCreate && (
              <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-4 animate-in fade-in-50">
                <h4 className="text-sm font-bold text-blue-900">Novo Gabarito KDP</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Gabarito</label>
                  <Input
                    required
                    autoFocus
                    placeholder="Ex: Livro Infantil 8.5x8.5 Quadrado"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Largura (pol)</label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={largura}
                      onChange={(e) => setLargura(Number(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Altura (pol)</label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={altura}
                      onChange={(e) => setAltura(Number(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Margem (pol)</label>
                    <Input
                      type="number"
                      step="0.001"
                      required
                      value={margem}
                      onChange={(e) => setMargem(Number(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="verso"
                    checked={versoBranco}
                    onChange={(e) => setVersoBranco(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="verso" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Inserir página em branco no verso (evita vazamento de canetinha/tinta no KDP)
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    "Salvar Gabarito"
                  )}
                </Button>
              </form>
            )}

            {/* List of Setups */}
            <div className="space-y-3">
              {setups?.map((setup) => (
                <div
                  key={setup.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 transition-all hover:border-slate-300"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-blue-600" />
                      {setup.nome}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Dimensões: <strong>{setup.largura_polegadas}" × {setup.altura_polegadas}"</strong> • Margem: {setup.margem_seguranca}" • Verso em branco: {setup.inserir_paginas_em_branco_verso ? "Ativo" : "Desativado"}
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSetupToDelete(setup)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

          </div>

        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={!!setupToDelete} onOpenChange={(open) => !open && setSetupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir gabarito KDP?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o gabarito <strong>"{setupToDelete?.nome}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
