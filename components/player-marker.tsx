"use client"

import type React from "react"
import type { Player } from "@/lib/types"
import { AlertCircle, AlertTriangle } from "lucide-react"

interface PlayerMarkerProps {
  player: Player
  position: { x: number; y: number }
  onMouseDown: (e: React.MouseEvent) => void
  isDraggable: boolean
}

export default function PlayerMarker({ player, position, onMouseDown, isDraggable }: PlayerMarkerProps) {
  return (
    <div
      className={`absolute flex flex-col items-center ${isDraggable ? "cursor-move" : "cursor-default"}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
        zIndex: 20,
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-1 relative shadow-md"
        style={{ backgroundColor: player.color }}
      >
        {player.image ? (
          <div className="w-full h-full rounded-full overflow-hidden">
            <img
              src={player.image || "/placeholder.svg"}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=48&width=48"
              }}
            />
          </div>
        ) : (
          player.position
        )}
        {player.number && (
          <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {player.number}
          </span>
        )}
        {player.injuryStatus === "injured" && (
          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
            <AlertCircle className="h-3 w-3" />
          </span>
        )}
        {player.injuryStatus === "doubt" && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
            <AlertTriangle className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded max-w-[80px] truncate text-center">
        {player.name}
      </div>
    </div>
  )
}
