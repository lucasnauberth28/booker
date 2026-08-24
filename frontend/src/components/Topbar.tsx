"use client"

import React from "react"
import { BookOpen, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsageWidget } from "@/components/UsageWidget"

interface TopbarProps {
  onNewBook: () => void
  onOpenSetups: () => void
}

export function Topbar({ onNewBook, onOpenSetups }: TopbarProps) {
  return (
    <header className="fixed top-0 w-full z-50 h-14 bg-gradient-to-b from-blue-100/40 to-transparent backdrop-blur-md border-none transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Minimalist Brand Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            KDP<span className="text-blue-600">Factory</span>
          </span>
        </div>

        {/* Primary Header Actions */}
        <div className="flex items-center space-x-2.5">
          <UsageWidget />

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSetups}
            className="h-8 px-3 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-white/60 rounded-lg"
          >
            <Settings className="h-3.5 w-3.5 mr-1 text-slate-500" />
            <span className="hidden sm:inline">Gabaritos KDP</span>
          </Button>

          <Button
            size="sm"
            onClick={onNewBook}
            className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Novo Livro</span>
          </Button>
        </div>

      </div>
    </header>
  )
}
