"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200/90 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl font-sans",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white font-semibold rounded-xl",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 rounded-xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
