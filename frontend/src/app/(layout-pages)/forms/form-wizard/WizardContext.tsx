"use client"
// app/components/WizardContext.tsx
import React, { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

interface WizardContextValue { step: number; next: () => void; back: () => void; goTo: (step: number) => void }
const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1)
  const next = () => setStep((s) => Math.min(s + 1, 4))
  const back = () => setStep((s) => Math.max(s - 1, 1))
  const goTo = (s: number) => setStep(s)
  
  return (
    <WizardContext.Provider value={{ step, next, back, goTo }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) throw new Error("useWizard debe usarse dentro de WizardProvider")
  return context
}
