"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Player, Substitution, Team } from "@/lib/types"

interface SubstitutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team
  onSubstitute: (substitution: Substitution) => void
}

export default function SubstitutionDialog({ open, onOpenChange, team, onSubstitute }: SubstitutionDialogProps) {
  const [playerOutId, setPlayerOutId] = useState<string>("")
  const [playerInId, setPlayerInId] = useState<string>("")
  const [minute, setMinute] = useState<number>(0)
  const [reason, setReason] = useState<string>("")

  const activePlayers = team.players.filter((p) => !p.isSubstitute)
  const substitutePlayers = team.players.filter((p) => p.isSubstitute)

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setPlayerOutId("")
      setPlayerInId("")
      setMinute(0)
      setReason("")
    }
  }, [open])

  const handleSubmit = () => {
    if (!playerOutId || !playerInId || minute <= 0) return

    const newSubstitution: Substitution = {
      id: `sub-${Date.now()}`,
      playerInId,
      playerOutId,
      minute,
      reason,
    }

    onSubstitute(newSubstitution)
    onOpenChange(false)
  }

  const getPlayerById = (id: string): Player | undefined => {
    return team.players.find((p) => p.id === id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thay người</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="playerOut" className="text-right">
              Cầu thủ ra sân
            </Label>
            <div className="col-span-3">
              <Select value={playerOutId} onValueChange={setPlayerOutId}>
                <SelectTrigger id="playerOut">
                  <SelectValue placeholder="Chọn cầu thủ ra sân" />
                </SelectTrigger>
                <SelectContent>
                  {activePlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.number ? `${player.number}. ` : ""}
                      {player.name} ({player.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="playerIn" className="text-right">
              Cầu thủ vào sân
            </Label>
            <div className="col-span-3">
              <Select value={playerInId} onValueChange={setPlayerInId}>
                <SelectTrigger id="playerIn">
                  <SelectValue placeholder="Chọn cầu thủ vào sân" />
                </SelectTrigger>
                <SelectContent>
                  {substitutePlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.number ? `${player.number}. ` : ""}
                      {player.name} ({player.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minute" className="text-right">
              Phút thay người
            </Label>
            <Input
              id="minute"
              type="number"
              min={1}
              max={120}
              value={minute}
              onChange={(e) => setMinute(Number.parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Lý do
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do thay người (không bắt buộc)"
              className="col-span-3"
            />
          </div>

          {playerOutId && playerInId && (
            <div className="bg-gray-50 p-3 rounded-md mt-2">
              <h3 className="font-medium text-sm mb-2">Xác nhận thay người:</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                    <span className="text-red-500 text-xs">Ra</span>
                  </div>
                  <div>
                    <p className="font-medium">{getPlayerById(playerOutId)?.name}</p>
                    <p className="text-xs text-gray-500">{getPlayerById(playerOutId)?.position}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div>
                    <p className="font-medium text-right">{getPlayerById(playerInId)?.name}</p>
                    <p className="text-xs text-gray-500 text-right">{getPlayerById(playerInId)?.position}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center ml-2">
                    <span className="text-green-500 text-xs">Vào</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!playerOutId || !playerInId || minute <= 0}>
            Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
