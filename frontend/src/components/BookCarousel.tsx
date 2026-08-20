"use client"

import React, { useEffect, useState } from "react"
import { Book } from "@/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  ChevronRight,
} from "lucide-react"

interface BookCarouselProps {
  books: Book[]
  activeIndex: number
  onSelectBook: (index: number) => void
  onManageBook: (book: Book) => void
  onAddBookClick?: () => void
}

export function BookCarousel({
  books,
  activeIndex,
  onSelectBook,
  onManageBook,
  onAddBookClick,
}: BookCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) return

    api.scrollTo(activeIndex)

    const onSelect = () => {
      const current = api.selectedScrollSnap()
      onSelectBook(current)
    }

    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api, activeIndex, onSelectBook])

  const getStatusBadge = (status: Book["status"]) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-white/90 text-slate-700 border-slate-300 font-medium text-[10px]">
            <Clock className="w-3 h-3 mr-1 text-slate-500" /> Rascunho
          </Badge>
        )
      case "generating":
        return (
          <Badge variant="warning" className="animate-pulse shadow-sm font-semibold text-[10px]">
            <Sparkles className="w-3 h-3 mr-1" /> Gerando IA...
          </Badge>
        )
      case "curating":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold border-blue-200 text-[10px]">
            <AlertCircle className="w-3 h-3 mr-1 text-blue-600" /> Em Curadoria
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="success" className="bg-emerald-100 text-emerald-800 font-semibold border-emerald-200 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Pronto (PDF)
          </Badge>
        )
    }
  }

  if (books.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto py-20 px-6 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 mt-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum livro criado ainda</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          Crie seu primeiro projeto de livro de colorir para a Amazon KDP através do nosso Wizard guiado.
        </p>
        <Button
          onClick={onAddBookClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-md shadow-blue-500/20"
        >
          + Criar Primeiro Livro
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4">
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: books.length > 1,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-6 py-10">
          {books.map((book, index) => {
            const isActive = index === activeIndex
            const approved = book.images_count?.approved || 0
            const total = book.total_paginas_desejadas || 1
            const progress = Math.min(100, Math.round((approved / total) * 100))

            return (
              <CarouselItem
                key={book.id}
                onClick={() => {
                  if (!isActive) {
                    if (api) api.scrollTo(index)
                    onSelectBook(index)
                  } else {
                    onManageBook(book)
                  }
                }}
                className="pl-6 basis-[85%] sm:basis-[55%] md:basis-[42%] lg:basis-[34%] cursor-pointer select-none"
              >
                <div
                  className={`relative rounded-3xl transition-all duration-500 ease-out transform ${
                    isActive
                      ? "scale-105 sm:scale-110 shadow-2xl shadow-blue-600/20 ring-2 ring-blue-500/30 z-20 opacity-100 bg-white"
                      : "scale-90 opacity-60 hover:opacity-85 z-10 bg-white/80 backdrop-blur-xs"
                  } border border-slate-200/90 overflow-hidden flex flex-col`}
                >
                  {/* Book Spine 3D Effect Bar */}
                  <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent z-10" />

                  {/* Top Status & Specs Badge */}
                  <div className="absolute top-4 left-5 right-4 flex items-center justify-between z-20 pointer-events-none">
                    {getStatusBadge(book.status)}
                    <span className="text-[11px] font-bold text-slate-700 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-slate-200/70">
                      {book.setup?.largura_polegadas}" × {book.setup?.altura_polegadas}"
                    </span>
                  </div>

                  {/* Book Mockup Cover Graphic */}
                  <div className="w-full aspect-[3/4] bg-gradient-to-b from-slate-100 via-blue-50/40 to-slate-100 flex flex-col items-center justify-between p-6 pt-16 relative overflow-hidden">
                    
                    {/* Background Decorative Mandala Vector */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.16] pointer-events-none">
                      <svg className="w-64 h-64" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                        <circle cx="50" cy="50" r="45" strokeWidth="1" />
                        <circle cx="50" cy="50" r="35" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="25" strokeWidth="1" />
                        <circle cx="50" cy="50" r="10" strokeWidth="2" />
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                          <line
                            key={deg}
                            x1="50"
                            y1="50"
                            x2={50 + 40 * Math.cos((deg * Math.PI) / 180)}
                            y2={50 + 40 * Math.sin((deg * Math.PI) / 180)}
                            strokeWidth="1"
                          />
                        ))}
                      </svg>
                    </div>

                    {/* Central Artwork Preview */}
                    <div className="w-full max-w-[190px] aspect-square rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center p-3 relative z-10">
                      <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-2">
                        <BookOpen className="w-7 h-7 text-blue-500 mb-1 opacity-80" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest line-clamp-1">
                          {book.nicho || "Coloring Book"}
                        </span>
                      </div>
                    </div>

                    {/* Cover Title Area */}
                    <div className="w-full text-center relative z-10 mt-auto pt-3">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
                        Amazon KDP Edition
                      </p>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1 leading-tight tracking-tight px-2">
                        {book.titulo}
                      </h4>
                    </div>
                  </div>

                  {/* Card Bottom Progress & Action Trigger */}
                  <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Progresso da Produção</span>
                      <span className="text-blue-600 font-bold">
                        {approved} / {total} págs ({progress}%)
                      </span>
                    </div>

                    <Progress value={progress} className="h-2" />

                    {isActive && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onManageBook(book)
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-xl shadow-xs text-xs flex items-center justify-center space-x-1 transition-all active:scale-95"
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1" />
                        <span>Gerenciar Livro & Prompts</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                  </div>

                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  )
}
