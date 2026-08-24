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
  Star,
  Layers,
  Palette,
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
          <Badge variant="outline" className="bg-white/95 text-slate-700 border-slate-300 font-medium text-[10px] shadow-xs backdrop-blur-xs">
            <Clock className="w-3 h-3 mr-1 text-slate-500" /> Rascunho
          </Badge>
        )
      case "generating":
        return (
          <Badge variant="warning" className="animate-pulse shadow-sm font-semibold text-[10px] bg-amber-500 text-white">
            <Sparkles className="w-3 h-3 mr-1" /> Gerando IA...
          </Badge>
        )
      case "curating":
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white font-semibold border-none text-[10px] shadow-xs">
            <AlertCircle className="w-3 h-3 mr-1" /> Em Curadoria
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="success" className="bg-emerald-600 text-white font-semibold border-none text-[10px] shadow-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Pronto para Publicar
          </Badge>
        )
    }
  }

  if (books.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto py-20 px-6 text-center bg-white/80 backdrop-blur-md rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 mt-10">
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

  // Component to render a complete, realistic 3D Children's Book Cover
  const renderBookCoverCard = (book: Book, isActive: boolean) => {
    const approved = book.images_count?.approved || 0
    const total = book.total_paginas_desejadas || 1
    const progress = Math.min(100, Math.round((approved / total) * 100))

    return (
      <div
        className={`relative rounded-3xl transition-all duration-300 ease-out transform ${
          isActive
            ? "scale-100 ring-4 ring-blue-500/20 shadow-2xl"
            : "scale-95 opacity-75 hover:opacity-100 hover:scale-98 shadow-md"
        } bg-white border border-slate-200 overflow-hidden flex flex-col`}
      >
        {/* Top Floating Status & Dimension Chips */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {getStatusBadge(book.status)}
          <span className="text-[10px] font-black tracking-wider uppercase bg-slate-900/80 text-white px-2.5 py-1 rounded-full backdrop-blur-xs shadow-xs">
            {book.setup?.largura_polegadas ? `${book.setup.largura_polegadas}" × ${book.setup.altura_polegadas}"` : "8.5\" × 8.5\""}
          </span>
        </div>

        {/* 3D Realistic Children's Book Front Cover */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200 flex flex-col justify-between p-5 select-none shadow-inner group">
          
          {/* Background Illustration (AI Cover or Fun Kid Pattern) */}
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.titulo}
              className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 z-0 flex items-center justify-center">
              <Palette className="w-24 h-24 text-white/20" />
            </div>
          )}

          {/* Book Spine Shadow / Binding 3D effect (Left side) */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-1 w-0.5 bg-white/40 z-10 pointer-events-none" />

          {/* Dark / Gradient Overlays for High Legibility */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-transparent z-1 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-transparent z-1 pointer-events-none" />

          {/* Cover Header Ribbon */}
          <div className="relative z-10 pt-7 text-center">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-lg border border-amber-300/80">
              <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Livro de Colorir Infantil
              </span>
              <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
            </div>
          </div>

          {/* Cover Central / Bottom Title & Subtitle Badge */}
          <div className="relative z-10 text-center pb-2">
            
            {/* Main Book Title */}
            <div className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border-2 border-amber-300/90 transform -rotate-1 hover:rotate-0 transition-transform">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight leading-none drop-shadow-xs">
                {book.titulo}
              </h3>
              
              {/* Playful Subtitle */}
              <p className="text-[11px] font-bold text-amber-900 mt-1 leading-tight">
                Desenhos Fáceis e Divertidos • {book.nicho}
              </p>
            </div>

            {/* Feature Badges Ribbons */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="bg-slate-900/80 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10 shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                +{book.total_paginas_desejadas} Desenhos
              </span>
              <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10 shadow-xs">
                Para Crianças
              </span>
            </div>

          </div>

        </div>

        {/* Card Bottom: Progress & Management Button */}
        <div className="p-5 bg-white border-t border-slate-100 flex flex-col space-y-3">
          
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1 text-slate-700">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Progresso do Livro
            </span>
            <span className="font-black text-slate-900">
              {approved} / {total} págs ({progress}%)
            </span>
          </div>

          <Progress value={progress} className="h-2.5 bg-slate-100" />

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onManageBook(book)
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-md shadow-blue-500/20 text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Sliders className="w-4 h-4 mr-1" />
            <span>Gerenciar Livro & Curadoria</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

        </div>

      </div>
    )
  }

  // If there is only 1 book, render it cleanly centered without carousel clipping
  if (books.length === 1) {
    const singleBook = books[0]
    return (
      <div className="w-full max-w-md mx-auto px-4 py-4">
        {renderBookCoverCard(singleBook, true)}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4">
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4 sm:-ml-6 py-6">
          {books.map((book, index) => {
            const isActive = index === activeIndex
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
                className="pl-4 sm:pl-6 basis-[88%] sm:basis-[360px] md:basis-[400px] cursor-pointer select-none"
              >
                {renderBookCoverCard(book, isActive)}
              </CarouselItem>
            )
          })}
        </CarouselContent>

        <CarouselPrevious className="left-2 sm:-left-4 h-10 w-10 bg-white/95 shadow-lg border-slate-200 hover:bg-white" />
        <CarouselNext className="right-2 sm:-right-4 h-10 w-10 bg-white/95 shadow-lg border-slate-200 hover:bg-white" />
      </Carousel>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {books.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (api) api.scrollTo(idx)
              onSelectBook(idx)
            }}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === activeIndex
                ? "w-6 bg-blue-600"
                : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Ir para livro ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
