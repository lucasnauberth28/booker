import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "KDP Factory — Studio SPA",
  description: "Automação e geração de livros de colorir voltados para a Amazon KDP",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="light">
      <body className="bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f1f5f9] min-h-screen text-slate-900 antialiased flex flex-col selection:bg-blue-600 selection:text-white">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
