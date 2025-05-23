"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import type { DrawingMode } from "@/lib/types"

interface DrawingToolsProps {
  mode: DrawingMode
  onClear: () => void
  strokeWidth: number
  onStrokeWidthChange: (width: number) => void
  strokeColor: string
  onStrokeColorChange: (color: string) => void
}

export default function DrawingTools({
  mode,
  onClear,
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
}: DrawingToolsProps) {
  const colors = ["#ffff00", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ff00ff"]

  return (
    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg flex flex-col gap-2 z-30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{mode === "pencil" ? "Chế độ vẽ" : "Chế độ xóa"}</span>
        <Button variant="destructive" size="sm" className="h-7 px-2 bg-red-500 hover:bg-red-600" onClick={onClear}>
          <Trash2 className="h-3 w-3 mr-1" /> Xóa tất cả
        </Button>
      </div>

      {mode === "pencil" && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs">Độ dày:</span>
            <div className="flex-grow">
              <Slider
                value={[strokeWidth]}
                min={1}
                max={10}
                step={1}
                onValueChange={(values) => onStrokeWidthChange(values[0])}
              />
            </div>
            <span className="text-xs">{strokeWidth}px</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">Màu sắc:</span>
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-5 h-5 rounded-full ${strokeColor === color ? "ring-2 ring-white" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onStrokeColorChange(color)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {mode === "eraser" && (
        <div className="flex items-center gap-2">
          <span className="text-xs">Độ dày:</span>
          <div className="flex-grow">
            <Slider
              value={[strokeWidth]}
              min={1}
              max={20}
              step={1}
              onValueChange={(values) => onStrokeWidthChange(values[0])}
            />
          </div>
          <span className="text-xs">{strokeWidth}px</span>
        </div>
      )}
    </div>
  )
}
