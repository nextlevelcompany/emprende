"use client"

import { useWizard } from "./WizardContext"
import { Button } from "@/components/ui/button"
import StepProgress from "./StepProgress"
import { Children, type ReactNode } from "react"

export default function FormWizard({ children }: { children: ReactNode }) {
  const { step, next, back } = useWizard()
  const steps = Children.toArray(children)

  return (
    <div className="w-full mx-auto p-8 space-y-8">

      {/* Stepper */}
      <StepProgress currentStep={step} />

      {/* Render Step */}
      <div>{steps[step - 1]}</div>

      {/* Controls */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={back} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={next}>
          {step === 4 ? "Finish" : "Next"}
        </Button>
      </div>

    </div>
  )
}
