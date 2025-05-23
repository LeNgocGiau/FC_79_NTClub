"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import ImageUploader from "@/components/image-uploader"
import type { Player, Position, InjuryStatus } from "@/lib/types"

interface PlayerFormProps {
  player: Player
  onSave: (player: Player) => void
  onCancel: () => void
}

export default function PlayerForm({ player, onSave, onCancel }: PlayerFormProps) {
  const [editedPlayer, setEditedPlayer] = useState<Player>({ ...player })

  const handleChange = (field: keyof Player, value: any) => {
    setEditedPlayer((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUploaded = (imageUrl: string) => {
    handleChange("image", imageUrl)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên cầu thủ</Label>
          <Input id="name" value={editedPlayer.name} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Số áo</Label>
          <Input
            id="number"
            type="number"
            min={1}
            max={99}
            value={editedPlayer.number || ""}
            onChange={(e) => handleChange("number", Number.parseInt(e.target.value) || "")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Vị trí</Label>
          <Select value={editedPlayer.position} onValueChange={(value) => handleChange("position", value as Position)}>
            <SelectTrigger id="position">
              <SelectValue placeholder="Chọn vị trí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GK">Thủ môn (GK)</SelectItem>
              <SelectItem value="CB">Trung vệ (CB)</SelectItem>
              <SelectItem value="LB">Hậu vệ trái (LB)</SelectItem>
              <SelectItem value="RB">Hậu vệ phải (RB)</SelectItem>
              <SelectItem value="DMF">Tiền vệ phòng ngự (DMF)</SelectItem>
              <SelectItem value="CMF">Tiền vệ trung tâm (CMF)</SelectItem>
              <SelectItem value="LWF">Tiền đạo cánh trái (LWF)</SelectItem>
              <SelectItem value="RWF">Tiền đạo cánh phải (RWF)</SelectItem>
              <SelectItem value="CF">Tiền đạo trung tâm (CF)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="injury">Tình trạng</Label>
          <Select
            value={editedPlayer.injuryStatus || "fit"}
            onValueChange={(value) => handleChange("injuryStatus", value as InjuryStatus)}
          >
            <SelectTrigger id="injury">
              <SelectValue placeholder="Tình trạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit">Sẵn sàng thi đấu</SelectItem>
              <SelectItem value="doubt">Không chắc chắn</SelectItem>
              <SelectItem value="injured">Chấn thương</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="yellowCards">Thẻ vàng</Label>
          <Input
            id="yellowCards"
            type="number"
            min={0}
            value={editedPlayer.yellowCards || 0}
            onChange={(e) => handleChange("yellowCards", Number.parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="redCards">Thẻ đỏ</Label>
          <Input
            id="redCards"
            type="number"
            min={0}
            value={editedPlayer.redCards || 0}
            onChange={(e) => handleChange("redCards", Number.parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isSubstitute"
            checked={editedPlayer.isSubstitute || false}
            onCheckedChange={(checked) => handleChange("isSubstitute", checked)}
          />
          <Label htmlFor="isSubstitute">Cầu thủ dự bị</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Hình ảnh cầu thủ</Label>
        <div className="flex items-center gap-4">
          {editedPlayer.image && (
            <div className="w-20 h-20 rounded-full overflow-hidden border">
              <img
                src={editedPlayer.image || "/placeholder.svg"}
                alt={editedPlayer.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <ImageUploader onImageUploaded={handleImageUploaded} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button onClick={() => onSave(editedPlayer)}>Lưu thay đổi</Button>
      </div>
    </div>
  )
}
