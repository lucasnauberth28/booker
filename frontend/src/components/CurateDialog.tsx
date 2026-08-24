"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import {
  Check,
  X,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  LayoutGrid,
  Maximize2,
  CheckCheck,
  Loader2,
  BookOpen,
  FileText,
  Layers,
} from "lucide-react"
import { toast } from "sonner"

interface CurateDialogProps {
  book: Book | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function CurateDialog({ book, isOpen, onClose, onUpdated }: CurateDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel")
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null)
  const [imageToDelete, setImageToDelete] = useState<ImageRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<"approved" | "rejected" | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const { data: images, mutate } = useSWR<ImageRecord[]>(
    book && isOpen ? `/books/${book.id}/images` : null,
    fetcher,
    { refreshInterval: 3000 }
  )

  const imageList = images || []
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, imageList.length - 1))
  const currentImage = imageList[safeIndex] || null

  const approvedCount = imageList.filter((i) => i.status === "approved").length
  const rejectedCount = imageList.filter((i) => i.status === "rejected").length
  const generatingCount = imageList.filter((i) => i.status === "generating" || i.status === "queued").length

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || viewMode !== "carousel" || imageList.length === 0) return
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1))
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(imageList.length - 1, prev + 1))
      }
    },
    [isOpen, viewMode, imageList.length]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!book) return null

  const handleStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      await api.images.updateStatus(id, status)
      mutate()
      onUpdated()
      toast.success(status === "approved" ? "Página aprovada!" : "Página rejeitada")
    } catch {
      toast.error("Erro ao alterar status da imagem")
    }
  }

  const handleRegenerate = async (image: ImageRecord) => {
    setRegeneratingId(image.id)
    try {
      await api.images.regenerate(image.id)
      mutate()
      onUpdated()
      toast.success("Regeneração iniciada com novo traço de IA!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar página")
    } finally {
      setRegeneratingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return
    setDeleting(true)
    try {
      await api.images.delete(imageToDelete.id)
      toast.success("Página removida com sucesso!")
      setImageToDelete(null)
      mutate()
      onUpdated()
      if (safeIndex >= imageList.length - 1) {
        setCurrentIndex(Math.max(0, imageList.length - 2))
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir imagem")
    } finally {
      setDeleting(false)
    }
  }

  const confirmBulkAction = async () => {
    if (!bulkActionType) return
    setBulkLoading(true)
    try {
      await Promise.all(imageList.map((img) => api.images.updateStatus(img.id, bulkActionType)))
      mutate()
      onUpdated()
      toast.success(`Todas as ${imageList.length} páginas foram marcadas como ${bulkActionType === "approved" ? "Aprovadas" : "Rejeitadas"}!`)
      setBulkActionType(null)
    } catch {
      toast.error("Erro em operação em massa")
    } finally {
      setBulkLoading(false)
    }
  }

  const getImageSrc = (img: ImageRecord) => {
    if (img.r2_file_url) return img.r2_file_url
    return `http://localhost:8000/storage/books/${book.id}/images/${img.id}.png`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
          
          {/* Header Bar */}
          <DialogHeader className="p-5 pb-3 border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-white flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Curadoria Visual — {book.titulo}
                  </DialogTitle>
                  <Badge variant="secondary" className="text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                    {book.setup?.nome} ({book.setup?.largura_polegadas}" × {book.setup?.altura_polegadas}")
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {approvedCount} Aprovadas • {rejectedCount} Rejeitadas • {generatingCount > 0 ? `${generatingCount} Processando IA...` : `${imageList.length} Páginas`}
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "carousel" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("carousel")}
                className="h-8 text-xs font-semibold rounded-xl"
              >
                <Maximize2 className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Modo Foco</span>
              </Button>

              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 text-xs font-semibold rounded-xl"
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Grade Geral</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/40">
            {imageList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-base font-bold text-slate-700">Nenhuma página gerada ainda</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Abra o painel lateral do livro e clique em "Gerar IA" para iniciar a criação das ilustrações.
                </p>
              </div>
            ) : viewMode === "carousel" && currentImage ? (
              
              /* 2-Column Split-View: Left Hero Image + Right Dedicated Control Sidebar */
              <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5">
                
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
                  
                  {/* Left Column: Bounded Hero Image Canvas (8 cols) */}
                  <div className="lg:col-span-8 bg-slate-100/70 border border-slate-200 rounded-2xl relative flex items-center justify-center p-4 overflow-hidden shadow-inner max-h-[56vh]">
                    
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={safeIndex === 0}
                      className="absolute left-3 z-20 h-10 w-10 rounded-full bg-white/90 shadow-md border-slate-200 hover:bg-white hover:scale-105 transition-all disabled:opacity-20"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </Button>

                    {/* Image Display */}
                    <div className="relative h-full max-h-[52vh] aspect-[3/4] flex items-center justify-center">
                      <img
                        src={getImageSrc(currentImage)}
                        alt={`Página #${safeIndex + 1}`}
                        className="max-h-full max-w-full object-contain rounded-xl bg-white shadow-xl border border-slate-300 select-none"
                      />

                      {/* Top Page Tag */}
                      <span className="absolute top-2 left-2 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        Página #{safeIndex + 1}
                      </span>

                      {/* Shimmer / Overlay for generating state */}
                      {(currentImage.status === "generating" || regeneratingId === currentImage.id) && (
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl z-10">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                          <span className="text-xs font-bold text-slate-800">Processando traço com IA...</span>
                        </div>
                      )}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentIndex((prev) => Math.min(imageList.length - 1, prev + 1))}
                      disabled={safeIndex === imageList.length - 1}
                      className="absolute right-3 z-20 h-10 w-10 rounded-full bg-white/90 shadow-md border-slate-200 hover:bg-white hover:scale-105 transition-all disabled:opacity-20"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-700" />
                    </Button>

                  </div>

                  {/* Right Column: Dedicated Page Management Panel (4 cols) */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs overflow-y-auto">
                    
                    <div className="space-y-4">
                      
                      {/* Status Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Página Atual
                          </span>
                          <h4 className="text-base font-black text-slate-900">
                            Página #{safeIndex + 1} de {imageList.length}
                          </h4>
                        </div>

                        <div>
                          {currentImage.status === "approved" && (
                            <Badge variant="success" className="text-[11px] font-bold">
                              ✓ Aprovada KDP
                            </Badge>
                          )}
                          {currentImage.status === "rejected" && (
                            <Badge variant="destructive" className="text-[11px] font-bold">
                              ✕ Rejeitada
                            </Badge>
                          )}
                          {(currentImage.status === "queued" || currentImage.status === "generating") && (
                            <Badge variant="warning" className="text-[11px] font-bold animate-pulse">
                              Gerando...
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Prompt Details Card */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" />
                          Prompt da Ilustração:
                        </span>
                        <p className="text-slate-700 italic leading-relaxed line-clamp-3">
                          "{currentImage.prompt?.base_prompt || book.titulo}"
                        </p>
                      </div>

                      {/* Validation Actions */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Ações de Validação:
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleStatus(currentImage.id, "approved")}
                            variant={currentImage.status === "approved" ? "default" : "outline"}
                            className={`h-11 rounded-xl font-bold text-xs shadow-xs transition-all ${
                              currentImage.status === "approved"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            <span>{currentImage.status === "approved" ? "Aprovada" : "Aprovar"}</span>
                          </Button>

                          <Button
                            onClick={() => handleStatus(currentImage.id, "rejected")}
                            variant={currentImage.status === "rejected" ? "default" : "outline"}
                            className={`h-11 rounded-xl font-bold text-xs shadow-xs transition-all ${
                              currentImage.status === "rejected"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "border-red-300 text-red-700 hover:bg-red-50"
                            }`}
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            <span>{currentImage.status === "rejected" ? "Rejeitada" : "Rejeitar"}</span>
                          </Button>
                        </div>
                      </div>

                      {/* AI Regeneration Action */}
                      <div className="pt-2">
                        <Button
                          onClick={() => handleRegenerate(currentImage)}
                          disabled={regeneratingId === currentImage.id || currentImage.status === "generating"}
                          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <RotateCw className={`w-3.5 h-3.5 mr-1 ${regeneratingId === currentImage.id ? "animate-spin" : ""}`} />
                          <span>Tentar Novamente (Regerar)</span>
                        </Button>
                      </div>

                    </div>

                    {/* Delete Page Action */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageToDelete(currentImage)}
                        className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-9 rounded-xl justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>Remover esta Página</span>
                      </Button>
                    </div>

                  </div>

                </div>

                {/* Bottom Thumbnail Strip */}
                <div className="pt-3 mt-3 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {imageList.map((img, idx) => {
                      const isSelected = idx === safeIndex
                      return (
                        <button
                          key={img.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`relative shrink-0 w-11 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-600 ring-2 ring-blue-500/40 scale-105 shadow-md"
                              : "border-slate-200 opacity-60 hover:opacity-100"
                          } ${
                            img.status === "approved"
                              ? "border-emerald-500"
                              : img.status === "rejected"
                              ? "border-red-400"
                              : "border-amber-400"
                          }`}
                        >
                          {img.status === "queued" || img.status === "generating" ? (
                            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-1">
                              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              <span className="text-[7px] font-bold text-slate-500 mt-0.5">Gerando</span>
                            </div>
                          ) : (
                            <img
                              src={getImageSrc(img)}
                              alt={`Thumb ${idx + 1}`}
                              className="w-full h-full object-cover bg-white"
                            />
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[8px] font-bold text-center leading-tight py-0.5">
                            #{idx + 1}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            ) : (
              
              /* Full Grid View with Quick Actions */
              <div className="flex-1 overflow-y-auto p-6">
                
                {/* Bulk Actions Bar */}
                <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-700">
                    Ações em Massa ({imageList.length} páginas):
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkActionType("approved")}
                      className="h-8 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      Aprovar Todas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkActionType("rejected")}
                      className="h-8 text-xs font-bold text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Rejeitar Todas
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {imageList.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => {
                        setCurrentIndex(idx)
                        setViewMode("carousel")
                      }}
                      className={`relative rounded-2xl bg-white border-2 p-2 shadow-xs transition-all hover:shadow-md cursor-pointer ${
                        img.status === "approved"
                          ? "border-emerald-500"
                          : img.status === "rejected"
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden mb-2 relative">
                        <img
                          src={getImageSrc(img)}
                          alt={`Página #${idx + 1}`}
                          className="w-full h-full object-contain bg-white"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatus(img.id, "approved")
                          }}
                          className={`flex-1 h-7 text-[11px] font-bold ${
                            img.status === "approved"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatus(img.id, "rejected")
                          }}
                          className={`flex-1 h-7 text-[11px] font-bold ${
                            img.status === "rejected"
                              ? "bg-red-600 text-white"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog for Page Deletion */}
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Remover esta página?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta página será excluída permanentemente do livro. Você poderá gerar novas páginas depois se desejar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Removendo..." : "Sim, Remover Página"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation AlertDialog for Bulk Actions */}
      <AlertDialog open={!!bulkActionType} onOpenChange={(open) => !open && setBulkActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionType === "approved" ? "Aprovar todas as páginas?" : "Rejeitar todas as páginas?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todas as {imageList.length} páginas deste livro serão marcadas como{" "}
              <strong>{bulkActionType === "approved" ? "Aprovadas" : "Rejeitadas"}</strong> de uma só vez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              disabled={bulkLoading}
              className={bulkActionType === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {bulkLoading ? "Aplicando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
