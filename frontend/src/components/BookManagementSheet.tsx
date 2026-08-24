"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Book, Prompt } from "@/types"
import { fetcher } from "@/lib/fetcher"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Progress } from "@/components/ui/progress"
import {
  Sparkles,
  Layers,
  FileCheck2,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle,
  Clock,
  Sliders,
  Download,
  Loader2,
  XCircle,
  Check,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface BookManagementSheetProps {
  book: Book | null
  prompts: Prompt[]
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  onOpenCurate: () => void
  onOpenAddPrompt: () => void
}

export function BookManagementSheet({
  book,
  prompts,
  isOpen,
  onClose,
  onRefresh,
  onOpenCurate,
  onOpenAddPrompt,
}: BookManagementSheetProps) {
  const [generating, setGenerating] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null)

  const { data: bookUsage } = useSWR<{
    total_tokens: number;
    total_requests: number;
    estimated_cost_usd: number;
    estimated_cost_brl: number;
  }>(book && isOpen ? `/books/${book.id}/usage` : null, fetcher)

  if (!book) return null

  const approved = book.images_count?.approved || 0
  const rejected = book.images_count?.rejected || 0
  const queued = (book.images_count?.queued || 0) + (book.images_count?.generating || 0)
  const total = book.total_paginas_desejadas || 1
  const progressPercent = Math.min(100, Math.round((approved / total) * 100))
  const isGenerating = book.status === "generating" || generating
  const hasPrompts = prompts.length > 0

  const handleConfirmGenerate = async () => {
    setShowGenerateConfirm(false)
    setGenerating(true)
    try {
      const res = await api.books.generate(book.id)
      toast.success(`Geração iniciada! ${res.total_images} páginas foram enviadas para a fila da IA.`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar geração")
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirmDeleteBook = async () => {
    setDeleting(true)
    try {
      await api.books.delete(book.id)
      toast.success(`Livro "${book.titulo}" e seus arquivos foram excluídos com sucesso.`)
      setShowDeleteConfirm(false)
      onClose()
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir livro")
    } finally {
      setDeleting(false)
    }
  }

  const handleCompilePdf = async () => {
    if (approved === 0) {
      toast.error("Você precisa aprovar ao menos uma imagem antes de compilar o PDF.")
      return
    }

    setCompiling(true)
    setDownloadUrl(null)
    toast.info("Iniciando compilação do PDF nos padrões Amazon KDP...")

    try {
      const res = await api.books.compile(book.id)
      setDownloadUrl(res.pdf_url)
      toast.success("PDF compilado com sucesso! Clique no botão para baixar.")
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Erro ao compilar PDF")
    } finally {
      setCompiling(false)
    }
  }

  const handleConfirmDeletePrompt = async () => {
    if (!promptToDelete) return
    try {
      await api.prompts.delete(promptToDelete.id)
      toast.success("Prompt de IA removido.")
      setPromptToDelete(null)
      onRefresh()
    } catch (err: any) {
      toast.error("Erro ao excluir prompt")
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="overflow-y-auto p-0 border-l border-slate-200 shadow-2xl bg-white">
          
          {/* Sheet Header Banner */}
          <div className="p-6 bg-gradient-to-b from-blue-50/80 to-white border-b border-slate-100">
            <div className="flex items-center justify-between space-x-3 mb-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase mb-1">
                    {book.nicho}
                  </Badge>
                  <SheetTitle className="text-xl font-black text-slate-900 truncate">
                    {book.titulo}
                  </SheetTitle>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                title="Excluir este Livro"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* KDP Specifications Tag */}
            <div className="flex items-center justify-between text-xs text-slate-600 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-xs font-medium">
              <span>Gabarito: <strong className="text-slate-900">{book.setup?.nome}</strong></span>
              <span>{book.setup?.largura_polegadas}" × {book.setup?.altura_polegadas}"</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* 1. Production Progress & Live Stats */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Progresso da Produção</span>
                <span className="text-blue-600">{approved} / {total} págs ({progressPercent}%)</span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Aprovadas</span>
                  <strong className="text-base font-black text-emerald-800">{approved}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">Gerando</span>
                  <strong className="text-base font-black text-amber-800">{queued}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-red-200">
                  <span className="text-[10px] font-bold uppercase text-red-700 block">Rejeitadas</span>
                  <strong className="text-base font-black text-red-800">{rejected}</strong>
                </div>
              </div>

              {/* Book Token Consumption Badge */}
              <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-200/80 text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Tokens gastos neste livro:
                </span>
                <span className="font-bold text-slate-900">
                  {(bookUsage?.total_tokens || 0).toLocaleString("pt-BR")} tok (~R$ {(bookUsage?.estimated_cost_brl || 0).toFixed(2)})
                </span>
              </div>
            </div>

            {/* 2. Primary Highlight Action: Curadoria Visual */}
            <Button
              size="lg"
              onClick={onOpenCurate}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-13 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
            >
              <Layers className="w-5 h-5" />
              <span>Abrir Curadoria Visual</span>
              {approved > 0 && (
                <Badge variant="success" className="ml-1 bg-white/20 text-white border-none text-xs">
                  {approved} Aprovadas
                </Badge>
              )}
            </Button>

            {/* 3. AI Generation Trigger */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Geração em Lote
                </h4>
                <p className="text-[11px] text-blue-700/80 mt-0.5">
                  Dispara a fila de IA para {book.total_paginas_desejadas} páginas.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setShowGenerateConfirm(true)}
                disabled={!hasPrompts || isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  "Gerar IA"
                )}
              </Button>
            </div>

            {/* 4. AI Prompts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Prompts de IA ({prompts.length})
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onOpenAddPrompt}
                  className="h-7 text-xs text-blue-600 hover:bg-blue-50 font-bold px-2 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>

              <div className="space-y-2.5">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {prompt.base_prompt}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPromptToDelete(prompt)}
                        className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {prompt.style_modifiers && prompt.style_modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prompt.style_modifiers.map((mod, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Peso: <strong>{Math.round((prompt.peso_distribuicao || 1) * 100)}%</strong></span>
                    </div>
                  </div>
                ))}

                {prompts.length === 0 && (
                  <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs">
                    Nenhum prompt adicionado. Clique em "Adicionar" para configurar o estilo do livro.
                  </div>
                )}
              </div>
            </div>

            {/* 5. PDF Compilation & Download */}
            <div className="pt-2 border-t border-slate-100">
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF KDP Pronto</span>
                </a>
              ) : (
                <Button
                  size="lg"
                  onClick={handleCompilePdf}
                  disabled={compiling || approved === 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-2xl shadow-md disabled:opacity-50"
                >
                  {compiling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      <span>Compilando PDF KDP...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 mr-1.5" />
                      <span>Compilar PDF KDP ({approved} págs)</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* 6. Danger Zone / Delete Project */}
            <div className="pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-red-950">Excluir Projeto</h5>
                  <p className="text-[11px] text-red-700/80">
                    Apaga permanentemente o livro, prompts, imagens e PDF.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="h-8 border-red-200 text-red-700 hover:bg-red-600 hover:text-white text-xs font-bold rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Excluir</span>
                </Button>
              </div>
            </div>

          </div>

        </SheetContent>
      </Sheet>

      {/* Confirmation AlertDialog for Book Deletion */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Excluir este projeto permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O livro <strong>"{book.titulo}"</strong>, todas as suas <strong>{book.images_count?.total || 0} imagens geradas</strong>, prompts e o arquivo PDF compilado serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteBook}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Excluindo..." : "Sim, Excluir Projeto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation AlertDialog for AI Generation */}
      <AlertDialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Iniciar geração de páginas com IA?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O sistema criará <strong>{book.total_paginas_desejadas} páginas</strong> na fila assíncrona para o livro <strong>"{book.titulo}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmGenerate} className="bg-blue-600 hover:bg-blue-700 text-white">
              Sim, Iniciar Geração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation AlertDialog for Prompt Deletion */}
      <AlertDialog open={!!promptToDelete} onOpenChange={(open) => !open && setPromptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover prompt de IA?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o prompt selecionado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletePrompt} className="bg-red-600 hover:bg-red-700 text-white">
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
