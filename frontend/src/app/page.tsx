"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Book, Prompt } from "@/types"
import { fetcher } from "@/lib/fetcher"
import { Topbar } from "@/components/Topbar"
import { BookCarousel } from "@/components/BookCarousel"
import { BookManagementSheet } from "@/components/BookManagementSheet"
import { CurateDialog } from "@/components/CurateDialog"
import { SetupsDialog } from "@/components/SetupsDialog"
import { NewBookWizardDialog } from "@/components/NewBookWizardDialog"
import { AddPromptDialog } from "@/components/AddPromptDialog"

export default function HomePage() {
  const [activeBookIndex, setActiveBookIndex] = useState(0)
  const [isNewBookOpen, setIsNewBookOpen] = useState(false)
  const [isSetupsOpen, setIsSetupsOpen] = useState(false)
  const [isCurateOpen, setIsCurateOpen] = useState(false)
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false)
  const [isManagementSheetOpen, setIsManagementSheetOpen] = useState(false)

  // Fetch all books with real-time refresh
  const { data: books, mutate: mutateBooks } = useSWR<Book[]>("/books", fetcher, {
    refreshInterval: 5000,
  })

  // Ensure active index is within bounds
  const bookList = books || []
  const safeIndex = Math.min(Math.max(0, activeBookIndex), Math.max(0, bookList.length - 1))
  const activeBook = bookList[safeIndex] || null

  // Fetch prompts for the currently active book
  const { data: prompts, mutate: mutatePrompts } = useSWR<Prompt[]>(
    activeBook ? `/books/${activeBook.id}/prompts` : null,
    fetcher
  )

  const handleBookCreated = (newBook: Book) => {
    mutateBooks().then((updatedBooks) => {
      if (updatedBooks) {
        const newIndex = updatedBooks.findIndex((b) => b.id === newBook.id)
        if (newIndex !== -1) {
          setActiveBookIndex(newIndex)
        }
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Minimalist Transparent Topbar */}
      <Topbar
        onNewBook={() => setIsNewBookOpen(true)}
        onOpenSetups={() => setIsSetupsOpen(true)}
      />

      {/* Main Focus: 3D Showcase Carousel as the First Visual Element */}
      <main className="flex-1 flex flex-col justify-center items-center pt-20 pb-10">
        <section className="w-full flex items-center justify-center">
          <BookCarousel
            books={bookList}
            activeIndex={safeIndex}
            onSelectBook={(idx) => setActiveBookIndex(idx)}
            onManageBook={(book) => setIsManagementSheetOpen(true)}
            onAddBookClick={() => setIsNewBookOpen(true)}
          />
        </section>
      </main>

      {/* Unified Side Panel for Active Book Management */}
      <BookManagementSheet
        book={activeBook}
        prompts={prompts || []}
        isOpen={isManagementSheetOpen}
        onClose={() => setIsManagementSheetOpen(false)}
        onRefresh={() => {
          mutateBooks()
          mutatePrompts()
        }}
        onOpenCurate={() => setIsCurateOpen(true)}
        onOpenAddPrompt={() => setIsAddPromptOpen(true)}
      />

      {/* 3-Step Creation Wizard Modal */}
      <NewBookWizardDialog
        isOpen={isNewBookOpen}
        onClose={() => setIsNewBookOpen(false)}
        onCreated={handleBookCreated}
      />

      {/* Image Curation Gallery Dialog */}
      <CurateDialog
        book={activeBook}
        isOpen={isCurateOpen}
        onClose={() => setIsCurateOpen(false)}
        onUpdated={() => {
          mutateBooks()
          mutatePrompts()
        }}
      />

      {/* KDP Setups Dimensions Dialog */}
      <SetupsDialog
        isOpen={isSetupsOpen}
        onClose={() => setIsSetupsOpen(false)}
        onUpdated={() => mutateBooks()}
      />

      {/* Prompt Creation Dialog */}
      <AddPromptDialog
        bookId={activeBook?.id || null}
        isOpen={isAddPromptOpen}
        onClose={() => setIsAddPromptOpen(false)}
        onCreated={() => {
          mutatePrompts()
          mutateBooks()
        }}
      />

    </div>
  )
}
