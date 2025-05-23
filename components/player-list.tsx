"use client"

import { Edit, Trash2, AlertCircle, AlertTriangle } from "lucide-react"
import type { Player } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface PlayerListProps {
  players: Player[]
  onRemove: (id: string) => void
  onEdit: (player: Player) => void
  onAddPlayer: () => void
}

export default function PlayerList({ players, onRemove, onEdit, onAddPlayer }: PlayerListProps) {
  const starters = players.filter((player) => !player.isSubstitute)
  const substitutes = players.filter((player) => player.isSubstitute)

  const renderPlayerItem = (player: Player) => (
    <div key={player.id} className="flex items-center p-2 border-b last:border-b-0 hover:bg-gray-50">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs mr-2 relative"
        style={{ backgroundColor: player.color }}
      >
        {player.image ? (
          <img
            src={player.image || "/placeholder.svg"}
            alt={player.name}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=32&width=32"
            }}
          />
        ) : (
          player.position
        )}
        {player.number && (
          <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {player.number}
          </span>
        )}
      </div>
      <div className="flex-grow">
        <div className="font-medium truncate flex items-center gap-1">
          {player.name}
          {player.injuryStatus === "injured" && <AlertCircle className="h-4 w-4 text-red-500" title="Chấn thương" />}
          {player.injuryStatus === "doubt" && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" title="Không chắc chắn" />
          )}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>{player.position}</span>
          {player.yellowCards && player.yellowCards > 0 && (
            <Badge className="bg-yellow-500 text-xs h-4 min-w-4 px-1 flex items-center justify-center">
              {player.yellowCards}
            </Badge>
          )}
          {player.redCards && player.redCards > 0 && (
            <Badge className="bg-red-500 text-xs h-4 min-w-4 px-1 flex items-center justify-center">
              {player.redCards}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white"
          onClick={() => onEdit(player)}
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white"
          onClick={() => onRemove(player.id)}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="border rounded-md overflow-hidden">
      <Tabs defaultValue="starters">
        <TabsList className="w-full">
          <TabsTrigger value="starters" className="flex-1">
            Đội hình chính ({starters.length})
          </TabsTrigger>
          <TabsTrigger value="substitutes" className="flex-1">
            Dự bị ({substitutes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="starters" className="p-0">
          <div className="max-h-[300px] overflow-y-auto">
            {starters.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Chưa có cầu thủ nào</div>
            ) : (
              starters.map(renderPlayerItem)
            )}
          </div>
        </TabsContent>

        <TabsContent value="substitutes" className="p-0">
          <div className="max-h-[300px] overflow-y-auto">
            {substitutes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Chưa có cầu thủ dự bị</div>
            ) : (
              substitutes.map(renderPlayerItem)
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-2 border-t">
        <Button variant="outline" size="sm" className="w-full" onClick={onAddPlayer}>
          + Thêm cầu thủ mới
        </Button>
      </div>
    </div>
  )
}
