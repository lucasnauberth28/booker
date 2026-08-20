"use client"

import React, { useState } from "react"
import { Book, Prompt } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
import {
  Sparkles,
  Layers,
  FileCheck2,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Sliders,
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface BookDetailConsoleProps {
  book: Book
  prompts: Prompt[]
  onRefresh: () => void
  onOpenCurate: () => void
  onOpenAddPrompt: () => void
}

export function BookDetailConsole({
  book,
  prompts,
  onRefresh,
  onOpenCurate,
  onOpenAddPrompt,
}: BookDetailConsoleProps) {
  const [generating, setGenerating] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null)

  const approved = book.images_count?.approved || 0
  const rejected = book.images_count?.rejected || 0
  const pending = (book.images_count?.queued || 0) + (book.images_count?.generating || 0)
  const hasPrompts = prompts.length > 0
  const isGenerating = book.status === "generating" || generating

  const handleConfirmGenerate = async () => {
    setShowGenerateConfirm(false)
    setGenerating(true)
    try {
      const res = await api.books.generate(book.id)
      toast.success(`Geração iniciada! ${res.total_images} páginas foram enviadas para a fila da IA.`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar a geração")
    } finally {
      setGenerating(false)
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
      toast.success("PDF compilado com sucesso! Clique no botão verde para baixar.")
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
      toast.success("Prompt de IA removido com sucesso.")
      setPromptToDelete(null)
      onRefresh()
    } catch (err: any) {
      toast.error("Erro ao excluir prompt")
    }
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 pb-16 space-y-8 animate-in fade-in-50 duration-500">
        
        {/* Top Action Ribbon */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{book.titulo}</h2>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-blue-200">
                {book.nicho}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Gabarito KDP: <strong className="text-slate-700">{book.setup?.nome}</strong> ({book.setup?.largura_polegadas}" × {book.setup?.altura_polegadas}") • Margem: {book.setup?.margem_seguranca}" • Verso em Branco: {book.setup?.inserir_paginas_em_branco_verso ? "Sim" : "Não"}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => setShowGenerateConfirm(true)}
              disabled={!hasPrompts || isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 font-bold rounded-2xl transition-all duration-200 active:scale-95 hover:shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Gerar Imagens</span>
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onOpenCurate}
              className="border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-800 font-bold rounded-2xl transition-all duration-200 active:scale-95 hover:shadow-md"
            >
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Curadoria Visual</span>
              {approved > 0 && (
                <Badge variant="success" className="ml-1 px-1.5 py-0.2 text-[11px]">
                  {approved}
                </Badge>
              )}
            </Button>

            {downloadUrl ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 hover:shadow-md cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Baixar PDF KDP</span>
              </a>
            ) : (
              <Button
                size="lg"
                onClick={handleCompilePdf}
                disabled={compiling || approved === 0}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-md"
              >
                {compiling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-1" />
                    <span>Compilando...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-5 h-5" />
                    <span>Compilar PDF</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Production Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200/80 bg-white/90 shadow-xs hover:border-blue-200 transition-all">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Meta Total</p>
                <h3 className="text-2xl font-black text-slate-900">{book.total_paginas_desejadas} págs</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/80 bg-emerald-50/40 shadow-xs hover:border-emerald-300 transition-all">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">Aprovadas</p>
                <h3 className="text-2xl font-black text-emerald-900">{approved}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200/80 bg-amber-50/40 shadow-xs hover:border-amber-300 transition-all">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700 tracking-wider">Na Fila / Gerando</p>
                <h3 className="text-2xl font-black text-amber-900">{pending}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200/80 bg-red-50/40 shadow-xs hover:border-red-300 transition-all">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-red-700 tracking-wider">Rejeitadas</p>
                <h3 className="text-2xl font-black text-red-900">{rejected}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prompts Management Section */}
        <Card className="border-slate-200/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Engenharia de Prompts de IA ({prompts.length})
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Os prompts distribuem a geração de imagens conforme seus pesos relativos.
              </p>
            </div>

            <Button
              size="sm"
              onClick={onOpenAddPrompt}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Prompt
            </Button>
          </CardHeader>

          <CardContent className="p-6 divide-y divide-slate-100">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {prompt.base_prompt}
                  </p>

                  {prompt.style_modifiers && prompt.style_modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.style_modifiers.map((mod, i) => (
                        <Badge key={i} variant="outline" className="text-[11px] bg-slate-50 text-slate-600 border-slate-200">
                          {mod}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight Distribution Bar */}
                <div className="flex items-center gap-4 min-w-[220px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Peso de Distribuição</span>
                      <span className="text-blue-600">{Math.round((prompt.peso_distribuicao || 1) * 100)}%</span>
                    </div>
                    <Progress value={(prompt.peso_distribuicao || 1) * 100} className="h-2" />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPromptToDelete(prompt)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {prompts.length === 0 && (
              <div className="py-10 text-center text-slate-500 space-y-3">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Nenhum prompt adicionado a este livro.</p>
                <Button size="sm" onClick={onOpenAddPrompt} variant="outline" className="rounded-xl">
                  + Adicionar Primeiro Prompt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Confirmation AlertDialog for AI Generation */}
      <AlertDialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Iniciar geração de páginas com IA?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O sistema criará <strong>{book.total_paginas_desejadas} páginas</strong> na fila assíncrona para o livro <strong>"{book.titulo}"</strong> com base nos prompts configurados.
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
              Tem certeza que deseja remover o prompt: <br />
              <em className="text-slate-700 font-medium">"{promptToDelete?.base_prompt}"</em>?
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
