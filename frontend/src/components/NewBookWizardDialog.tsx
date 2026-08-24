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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  BookPlus,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Loader2,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

interface NewBookWizardDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (book: Book) => void
}

export function NewBookWizardDialog({
  isOpen,
  onClose,
  onCreated,
}: NewBookWizardDialogProps) {
  const { data: setups } = useSWR<Setup[]>(isOpen ? "/setups" : null, fetcher)
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Basic Info
  const [titulo, setTitulo] = useState("")
  const [nicho, setNicho] = useState("")
  const [setupId, setSetupId] = useState<number | string>("")
  const [totalPaginas, setTotalPaginas] = useState(24)

  // Step 2: Cover Art
  const [coverOption, setCoverOption] = useState<"ai" | "upload">("ai")
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFileName, setCoverFileName] = useState<string>("")

  // Step 3: AI Prompt Engineering
  const [basePrompt, setBasePrompt] = useState("")
  const [styleModifiers, setStyleModifiers] = useState<string[]>([
    "thick black outlines",
    "pure white background",
    "coloring book line art",
  ])
  const [pesoDistribuicao, setPesoDistribuicao] = useState(1.0)

  const suggestedModifiers = [
    "thick black outlines",
    "pure white background",
    "coloring book line art",
    "no shading",
    "mandala patterns",
    "high resolution vector",
    "child friendly simple lines",
    "intricate adult coloring",
  ]

  const handleToggleModifier = (mod: string) => {
    if (styleModifiers.includes(mod)) {
      setStyleModifiers(styleModifiers.filter((m) => m !== mod))
    } else {
      setStyleModifiers([...styleModifiers, mod])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFileName(file.name)
      setCoverOption("upload")
      const reader = new FileReader()
      reader.onload = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!titulo.trim()) {
        toast.error("Por favor, informe o título do livro.")
        return
      }
      if (!nicho.trim()) {
        toast.error("Por favor, informe o nicho ou categoria.")
        return
      }
      if (!setupId) {
        toast.error("Por favor, selecione um gabarito de dimensões KDP.")
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  const handleFinish = async () => {
    if (step === 3 && !basePrompt.trim()) {
      toast.error("Por favor, informe o prompt base de IA para o livro.")
      return
    }

    setLoading(true)
    try {
      // 1. Create the Book
      const newBook = await api.books.create({
        titulo,
        nicho,
        total_paginas_desejadas: Number(totalPaginas),
        setup_id: Number(setupId),
      })

      // 2. Create the initial Prompt if provided
      if (basePrompt.trim()) {
        await api.prompts.create(newBook.id, {
          base_prompt: basePrompt,
          style_modifiers: styleModifiers.length > 0 ? styleModifiers : null,
          peso_distribuicao: Number(pesoDistribuicao),
        })
      }

      // 3. Trigger AI Cover Generation if opted
      if (coverOption === "ai") {
        api.books.generateCover(newBook.id).then(() => {
          toast.success("Capa do livro gerada com sucesso pela IA!")
        }).catch(() => {})
      }

      toast.success(`Livro "${titulo}" criado com sucesso!`)
      
      // Reset form
      setTitulo("")
      setNicho("")
      setTotalPaginas(24)
      setCoverPreview(null)
      setCoverOption("ai")
      setBasePrompt("")
      setStep(1)

      onCreated(newBook)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar livro")
    } finally {
      setLoading(false)
    }
  }

  const selectedSetup = setups?.find((s) => s.id === Number(setupId))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 duration-200">
        
        {/* Wizard Header with Progress Steps */}
        <div className="bg-slate-50/80 border-b border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookPlus className="w-5 h-5 text-blue-600" />
              Criar Novo Livro KDP
            </DialogTitle>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              Etapa {step} de 3
            </span>
          </div>

          {/* Stepper Dots & Line */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: "Informações Básicas" },
              { num: 2, label: "Capa do Livro" },
              { num: 3, label: "Engenharia de Prompts" },
            ].map((s) => {
              const isDone = step > s.num
              const isCurrent = step === s.num
              return (
                <div key={s.num} className="flex flex-col space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-blue-600"
                        : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-semibold truncate ${
                      isCurrent
                        ? "text-blue-700 font-bold"
                        : isDone
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do Livro
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nicho / Categoria KDP
                </label>
                <Input
                  required
                  placeholder="Ex: Mandalas / Adult Coloring / Mindfulness"
                  value={nicho}
                  onChange={(e) => setNicho(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gabarito KDP (Dimensões)
                  </label>
                  <select
                    required
                    value={setupId}
                    onChange={(e) => setSetupId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="">Selecione as dimensões...</option>
                    {setups?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.largura_polegadas}" × {s.altura_polegadas}")
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total de Páginas Desejadas
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="300"
                    required
                    value={totalPaginas}
                    onChange={(e) => setTotalPaginas(Number(e.target.value))}
                    className="bg-white"
                  />
                </div>
              </div>

              {selectedSetup && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    Padrão KDP selecionado: {selectedSetup.nome}
                  </p>
                  <p className="text-blue-700/90 text-[11px]">
                    Margens de segurança: {selectedSetup.margem_seguranca}" • Verso em branco: {selectedSetup.inserir_paginas_em_branco_verso ? "Sim (recomendado para colorir)" : "Não"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Cover Image */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div className="text-center">
                <h4 className="text-sm font-bold text-slate-900">Arte da Capa do Livro</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha como deseja definir a capa do seu livro KDP.
                </p>
              </div>

              {/* Cover Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCoverOption("ai")
                    setCoverPreview(null)
                    setCoverFileName("")
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    coverOption === "ai"
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <Badge variant="success" className="text-[10px] font-bold">
                      Recomendado
                    </Badge>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">Gerar Capa com IA</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      A IA cria uma capa colorida exclusiva baseada no título e nicho.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverOption("upload")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    coverOption === "upload"
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                      <Upload className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">Fazer Upload</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Envie um arquivo PNG ou JPG do seu computador.
                    </p>
                  </div>
                </button>
              </div>

              {/* Upload Zone (Only when upload is selected) */}
              {coverOption === "upload" && (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in-50 duration-200">
                  <div className="w-28 aspect-[3/4] rounded-2xl bg-white shadow-md border border-slate-200 overflow-hidden relative flex flex-col items-center justify-center p-2 shrink-0">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Preview da capa"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-2">
                        <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          Mockup KDP
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white rounded-2xl cursor-pointer transition-all hover:bg-blue-50/30">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="w-6 h-6 text-blue-500 mb-1" />
                        <p className="text-xs font-semibold text-slate-700 text-center px-2">
                          {coverFileName || "Clique para escolher uma imagem de capa"}
                        </p>
                        <p className="text-[10px] text-slate-400">PNG, JPG até 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              )}

              {coverOption === "ai" && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 text-xs flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-blue-900 leading-relaxed">
                    Assim que o livro for criado, a IA processará a capa em alta resolução para a vitrine 3D.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Prompt Engineering */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prompt Base de IA
                </label>
                <Textarea
                  required
                  autoFocus
                  rows={3}
                  placeholder="Ex: Detailed mandala with a majestic wolf face in the center, symmetrical floral patterns, intricate line art"
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Modificadores de Estilo (Clique para ativar/desativar)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedModifiers.map((mod) => {
                    const isSelected = styleModifiers.includes(mod)
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => handleToggleModifier(mod)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {isSelected && "✓ "}
                        {mod}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Peso de Distribuição Inicial</span>
                  <span className="text-blue-600 font-bold">{Math.round(pesoDistribuicao * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={pesoDistribuicao}
                  onChange={(e) => setPesoDistribuicao(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation */}
        <div className="bg-slate-50/80 border-t border-slate-100 p-4 px-6 flex items-center justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5"
            >
              Próximo <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-6 shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Criando Livro...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>Finalizar e Criar Livro</span>
                </>
              )}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
