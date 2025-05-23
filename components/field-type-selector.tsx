"use client"

import { Button } from "@/components/ui/button"
import type { FieldType } from "@/lib/types"

interface FieldTypeSelectorProps {
  selectedFieldType: FieldType
  onFieldTypeChange: (fieldType: FieldType) => void
}

export default function FieldTypeSelector({ selectedFieldType, onFieldTypeChange }: FieldTypeSelectorProps) {
  const fieldTypes: FieldType[] = ["5", "7", "11"]
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {fieldTypes.map((fieldType) => (
        <Button
          key={fieldType}
          variant={selectedFieldType === fieldType ? "default" : "outline"}
          className={selectedFieldType === fieldType ? "bg-green-600 text-white hover:bg-green-600" : "hover:bg-white hover:text-black"}
          onClick={() => onFieldTypeChange(fieldType)}
        >
          Sân {fieldType}
        </Button>
      ))}
    </div>
  )
} 