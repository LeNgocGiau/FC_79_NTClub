"use client"

import { Button } from "@/components/ui/button"
import type { Formation, FieldType } from "@/lib/types"
import { getFormationsForFieldType } from "@/lib/formations"

interface FormationSelectorProps {
  selectedFormation: Formation
  onFormationChange: (formation: Formation) => void
  fieldType?: FieldType
}

export default function FormationSelector({ selectedFormation, onFormationChange, fieldType = "11" }: FormationSelectorProps) {
  // Lấy danh sách đội hình phù hợp với loại sân
  const formations = getFormationsForFieldType(fieldType)

  return (
    <div className="grid grid-cols-3 gap-2">
      {formations.map((formation) => (
        <Button
          key={formation}
          variant={selectedFormation === formation ? "default" : "outline"}
          className={selectedFormation === formation ? "bg-blue-500 text-white" : ""}
          onClick={() => onFormationChange(formation)}
        >
          {formation}
        </Button>
      ))}
    </div>
  )
}
