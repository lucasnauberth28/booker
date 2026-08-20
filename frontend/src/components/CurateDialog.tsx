"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Book, ImageRecord } from "@/types"
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
import { Badge } from "@/components/ui/badge"
import { Check, X, Sparkles, CheckCheck, Trash, Layers, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CurateDialogProps {
  book: Book | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function CurateDialog({ book, isOpen, onClose, onUpdated }: CurateDialogProps) {
  const [filter, setFilter] = useState<"all" | "approved" | "rejected" | "pending">("all")
  const [bulkActionType, setBulkActionType] = useState<"approved" | "rejected" | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const { data: images, mutate } = useSWR<ImageRecord[]>(
    book && isOpen ? `/books/${book.id}/images` : null,
    fetcher,
    { refreshInterval: 4000 }
  )

  if (!book) return null

  const imageList = images || []
  const approvedCount = imageList.filter((i) => i.status === "approved").length
  const rejectedCount = imageList.filter((i) => i.status === "rejected").length
  const pendingCount = imageList.filter((i) => i.status === "queued" || i.status === "generating").length

  const filteredImages = imageList.filter((img) => {
    if (filter === "approved") return img.status === "approved"
    if (filter === "rejected") return img.status === "rejected"
    if (filter === "pending") return img.status === "queued" || img.status === "generating"
    return true
  })

  const handleStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      await api.images.updateStatus(id, status)
      mutate()
      onUpdated()
      toast.success(status === "approved" ? "Página aprovada!" : "Página rejeitada")
    } catch (e) {
      toast.error("Erro ao alterar status da imagem")
    }
  }

  const confirmBulkAction = async () => {
    if (!bulkActionType) return
    setBulkLoading(true)
    try {
      await Promise.all(filteredImages.map((img) => api.images.updateStatus(img.id, bulkActionType)))
      mutate()
      onUpdated()
      toast.success(`Todas as ${filteredImages.length} imagens foram marcadas como ${bulkActionType === "approved" ? "Aprovadas" : "Rejeitadas"}!`)
      setBulkActionType(null)
    } catch (e) {
      toast.error("Erro em operação em massa")
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
          
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Curadoria de Imagens — {book.titulo}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Revise cada página gerada pela IA. Apenas imagens com status "Aprovada" entrarão no PDF KDP.
                </p>
              </div>

              {/* Quick Filter Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className="h-8 text-xs font-semibold rounded-lg"
                >
                  Todas ({imageList.length})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "approved" ? "default" : "outline"}
                  onClick={() => setFilter("approved")}
                  className={`h-8 text-xs font-semibold rounded-lg ${filter === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-700"}`}
                >
                  Aprovadas ({approvedCount})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "pending" ? "default" : "outline"}
                  onClick={() => setFilter("pending")}
                  className="h-8 text-xs font-semibold rounded-lg text-amber-700"
                >
                  Gerando ({pendingCount})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "rejected" ? "default" : "outline"}
                  onClick={() => setFilter("rejected")}
                  className="h-8 text-xs font-semibold rounded-lg text-red-700"
                >
                  Rejeitadas ({rejectedCount})
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {filteredImages.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkActionType("approved")}
                  className="h-8 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Aprovar Visíveis ({filteredImages.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkActionType("rejected")}
                  className="h-8 text-xs font-semibold text-red-700 border-red-200 hover:bg-red-50 rounded-lg"
                >
                  <Trash className="w-3.5 h-3.5 mr-1" /> Rejeitar Visíveis ({filteredImages.length})
                </Button>
              </div>
            )}
          </DialogHeader>

          {/* Image Grid Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            {filteredImages.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Nenhuma imagem encontrada neste filtro.</p>
                <p className="text-xs text-slate-400 mt-1">Dispare a geração de imagens pelo painel do livro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map((img) => {
                  const isApproved = img.status === "approved"
                  const isRejected = img.status === "rejected"
                  const isGenerating = img.status === "generating" || img.status === "queued"

                  return (
                    <div
                      key={img.id}
                      className={`relative rounded-2xl overflow-hidden bg-white border-2 transition-all flex flex-col ${
                        isApproved
                          ? "border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                          : isRejected
                          ? "border-red-300 opacity-50 grayscale"
                          : "border-slate-200"
                      }`}
                    >
                      {/* Page order tag */}
                      <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-xs text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
                        #{img.page_order + 1}
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        {isApproved && (
                          <Badge variant="success" className="px-1.5 py-0.5 text-[10px]">
                            ✓ Aprovada
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px]">
                            ✗ Rejeitada
                          </Badge>
                        )}
                        {isGenerating && (
                          <Badge variant="warning" className="px-1.5 py-0.5 text-[10px] animate-pulse">
                            IA Gerando...
                          </Badge>
                        )}
                      </div>

                      {/* Image Canvas / Preview */}
                      <div className="w-full aspect-[3/4] bg-slate-100 relative flex items-center justify-center p-2">
                        {img.r2_file_url ? (
                          <img
                            src={img.r2_file_url}
                            alt={`Página ${img.page_order}`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Sparkles className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-1" />
                            <span className="text-[11px] font-semibold text-slate-500">
                              {img.status === "generating" ? "Desenhando..." : "Na fila"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 mt-auto">
                        <Button
                          size="sm"
                          variant={isApproved ? "default" : "outline"}
                          onClick={() => handleStatus(img.id, "approved")}
                          className={`flex-1 h-8 rounded-lg text-xs font-bold ${
                            isApproved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant={isRejected ? "default" : "outline"}
                          onClick={() => handleStatus(img.id, "rejected")}
                          className={`flex-1 h-8 rounded-lg text-xs font-bold ${
                            isRejected ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-700 hover:bg-red-50 border-red-200"
                          }`}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                        </Button>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>

      {/* Confirmation for Bulk Actions */}
      <AlertDialog open={!!bulkActionType} onOpenChange={(open) => !open && setBulkActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionType === "approved" ? "Aprovar todas as imagens visíveis?" : "Rejeitar todas as imagens visíveis?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará <strong>{filteredImages.length} imagens</strong> como{" "}
              {bulkActionType === "approved" ? "Aprovadas para o livro" : "Rejeitadas"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              disabled={bulkLoading}
              className={bulkActionType === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {bulkLoading ? "Processando..." : "Confirmar Ação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
