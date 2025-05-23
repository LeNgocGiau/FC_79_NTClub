"use client"

import { ArrowDownUp, X } from "lucide-react"
import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface SubstitutionHistoryProps {
  team: Team
  onRemoveSubstitution: (id: string) => void
}

export default function SubstitutionHistory({ team, onRemoveSubstitution }: SubstitutionHistoryProps) {
  if (!team.substitutions || team.substitutions.length === 0) {
    return <div className="text-center p-4 text-gray-500 text-sm">Chưa có thay người nào</div>
  }

  const getPlayerName = (id: string) => {
    const player = team.players.find((p) => p.id === id)
    return player ? player.name : "Unknown"
  }

  return (
    <div className="space-y-2 max-h-[200px] overflow-y-auto">
      {team.substitutions
        .sort((a, b) => a.minute - b.minute)
        .map((sub) => (
          <div key={sub.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <div className="flex items-center">
              <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                {sub.minute}'
              </div>
              <div className="flex items-center">
                <span className="text-red-500 font-medium">{getPlayerName(sub.playerOutId)}</span>
                <ArrowDownUp className="h-4 w-4 mx-2 text-gray-400" />
                <span className="text-green-500 font-medium">{getPlayerName(sub.playerInId)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => onRemoveSubstitution(sub.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
    </div>
  )
}
