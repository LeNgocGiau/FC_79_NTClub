"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, Check, Clock, DollarSign, Edit, Filter, Plus, Trash2, User, Shield } from "lucide-react"
import type { Player, PlayerDiscipline, DisciplineType } from "@/lib/types"
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog"

interface PlayerDisciplineProps {
  players: Player[]
  onDisciplineChange?: (disciplines: PlayerDiscipline[]) => void
}

export default function PlayerDisciplineManager({ players, onDisciplineChange }: PlayerDisciplineProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [disciplineToDelete, setDisciplineToDelete] = useState<string | null>(null)
  const [disciplines, setDisciplines] = useState<PlayerDiscipline[]>(() => {
    // Khởi tạo từ localStorage nếu có
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playerDisciplines')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all")
  const [editingDiscipline, setEditingDiscipline] = useState<PlayerDiscipline | null>(null)

  // Lưu vào localStorage khi dữ liệu thay đổi
  useEffect(() => {
    if (disciplines.length > 0) {
      localStorage.setItem('playerDisciplines', JSON.stringify(disciplines))
    } else {
      // Xóa khỏi localStorage nếu không còn kỷ luật nào
      localStorage.removeItem('playerDisciplines');
    }
    
    // Gọi callback nếu có
    if (onDisciplineChange) {
      onDisciplineChange(disciplines)
    }
  }, [disciplines, onDisciplineChange])

  // Theo dõi thay đổi thông tin cầu thủ để cập nhật thông tin kỷ luật
  useEffect(() => {
    // Chỉ cập nhật nếu có kỷ luật và có cầu thủ
    if (disciplines.length > 0) {
      let needsUpdate = false;
      const updatedDisciplines = disciplines.map(discipline => {
        // Tìm cầu thủ tương ứng
        const player = players.find(p => p.id === discipline.playerId);
        if (player) {
          // Kiểm tra nếu có sự thay đổi
          if (
            player.name !== discipline.playerName ||
            player.position !== discipline.position ||
            player.image !== discipline.image
          ) {
            needsUpdate = true;
            // Cập nhật thông tin mới
            return {
              ...discipline,
              playerName: player.name,
              position: player.position,
              image: player.image
            };
          }
        }
        // Nếu không tìm thấy cầu thủ (đã bị xóa), giữ nguyên thông tin
        return discipline;
      });

      // Chỉ cập nhật state nếu có thay đổi
      if (needsUpdate) {
        setDisciplines(updatedDisciplines);
      }
    }
  }, [players]); // Chỉ phụ thuộc vào players để tránh vòng lặp vô hạn

  const handleAddDiscipline = () => {
    if (players.length === 0) {
      alert("Vui lòng chọn đội hình trước khi thêm kỷ luật cầu thủ")
      return
    }
    
    const newDiscipline: PlayerDiscipline = {
      id: `discipline-${Date.now()}`,
      playerId: "",
      playerName: "",
      position: "",
      disciplineType: "warning",
      amount: 0,
      reason: "",
      dateIssued: new Date().toISOString().split("T")[0],
      resolved: false,
      image: "",
      matches: 1
    }
    
    setEditingDiscipline(newDiscipline)
    setIsDialogOpen(true)
  }

  const handleEditDiscipline = (discipline: PlayerDiscipline) => {
    setEditingDiscipline({ ...discipline })
    setIsDialogOpen(true)
  }

  const handleSaveDiscipline = () => {
    if (!editingDiscipline) return
    
    // Validate form
    if (!editingDiscipline.playerId) {
      alert("Vui lòng chọn cầu thủ")
      return
    }
    
    if (editingDiscipline.disciplineType === "fine" && (!editingDiscipline.amount || editingDiscipline.amount <= 0)) {
      alert("Vui lòng nhập số tiền phạt hợp lệ")
      return
    }
    
    if ((editingDiscipline.disciplineType === "suspension" || editingDiscipline.disciplineType === "additional_training") 
        && (!editingDiscipline.matches || editingDiscipline.matches < 1)) {
      alert("Vui lòng nhập số trận/buổi hợp lệ")
      return
    }
    
    if (!editingDiscipline.reason.trim()) {
      alert("Vui lòng nhập lý do kỷ luật")
      return
    }

    // Kiểm tra nếu đã tồn tại ID thì cập nhật, ngược lại thêm mới
    if (disciplines.some(d => d.id === editingDiscipline.id)) {
      setDisciplines(disciplines.map(d => 
        d.id === editingDiscipline.id ? editingDiscipline : d
      ))
    } else {
      setDisciplines([...disciplines, editingDiscipline])
    }

    // Đóng dialog và reset form
    setIsDialogOpen(false)
    setEditingDiscipline(null)
  }

  const handleDeleteDiscipline = (id: string) => {
    setDisciplineToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleResolved = (discipline: PlayerDiscipline) => {
    setDisciplines(disciplines.map(d => 
      d.id === discipline.id ? { ...d, resolved: !d.resolved } : d
    ))
  }

  const handleSelectPlayer = (playerId: string) => {
    if (!editingDiscipline) return
    
    const player = players.find(p => p.id === playerId)
    if (player) {
      setEditingDiscipline({
        ...editingDiscipline,
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        image: player.image // Lấy ảnh từ thông tin người chơi
      })
    }
  }

  // Lọc danh sách kỷ luật theo filter
  const filteredDisciplines = disciplines.filter(discipline => {
    if (filter === "all") return true
    if (filter === "active") return !discipline.resolved
    if (filter === "resolved") return discipline.resolved
    return true
  })

  // Format tiền VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  // Lấy nhãn và biểu tượng cho loại kỷ luật
  const getDisciplineTypeLabel = (type: DisciplineType, discipline?: PlayerDiscipline) => {
    switch (type) {
      case "fine":
        return {
          label: "Phạt tiền",
          icon: <DollarSign className="h-4 w-4 mr-1 text-red-500" />
        }
      case "suspension":
        return {
          label: `Đình chỉ thi đấu${discipline?.matches ? ` (${discipline.matches} trận)` : ''}`,
          icon: <Clock className="h-4 w-4 mr-1 text-orange-500" />
        }
      case "warning":
        return {
          label: "Cảnh cáo",
          icon: <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
        }
      case "additional_training":
        return {
          label: `Tập luyện bổ sung${discipline?.matches ? ` (${discipline.matches} buổi)` : ''}`,
          icon: <Shield className="h-4 w-4 mr-1 text-blue-500" />
        }
      default:
        return {
          label: "Không xác định",
          icon: <AlertTriangle className="h-4 w-4 mr-1" />
        }
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Kỷ luật cầu thủ</h2>
        <div className="flex space-x-2">
          <Button onClick={handleAddDiscipline} className="bg-red-500 hover:bg-red-600">
            <AlertTriangle className="h-4 w-4 mr-2 text-white" /> Thêm kỷ luật
          </Button>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("all")}
        >
          <Filter className="h-4 w-4 mr-2" /> Tất cả
        </Button>
        <Button 
          variant={filter === "active" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("active")}
        >
          <AlertTriangle className="h-4 w-4 mr-2" /> Đang áp dụng
        </Button>
        <Button
          variant={filter === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("resolved")}
        >
          <Check className="h-4 w-4 mr-2" /> Đã giải quyết
        </Button>
      </div>

      {filteredDisciplines.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          Không có kỷ luật cầu thủ nào {filter === "active" ? "đang áp dụng" : filter === "resolved" ? "đã giải quyết" : ""}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisciplines.map((discipline) => (
            <div
              key={discipline.id}
              className={`border rounded-lg p-4 ${
                discipline.resolved ? "bg-gray-50" : "bg-white"
              } hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0">
                    {discipline.image ? (
                      <img src={discipline.image} alt={discipline.playerName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center mt-1">
                      <span className="font-bold">{discipline.playerName}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {discipline.position} #{
                          players.find(p => p.id === discipline.playerId)?.number || ""
                        }
                      </Badge>
                    </div>
                    <div className="mt-1">
                      {discipline.disciplineType === "fine" ? (
                        <span className="text-red-500 font-medium text-sm">
                          <DollarSign className="h-3 w-3 inline mr-1" />
                          Số tiền phạt: {formatCurrency(discipline.amount || 0)} đ
                        </span>
                      ) : (
                        <Badge variant={
                          discipline.disciplineType === "warning" ? "warning" : 
                          discipline.disciplineType === "suspension" ? "destructive" : 
                          "secondary"
                        }>
                          {getDisciplineTypeLabel(discipline.disciplineType, discipline).icon}
                          {getDisciplineTypeLabel(discipline.disciplineType, discipline).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleResolved(discipline)}
                  >
                    {discipline.resolved ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs">Đánh dấu đã giải quyết</span>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditDiscipline(discipline)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => handleDeleteDiscipline(discipline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="mt-2 pt-2">
                  <p className="text-sm text-gray-600">
                    Lý Do: {discipline.reason}
                  </p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Ngày áp dụng: {new Date(discipline.dateIssued).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Thêm kỷ luật cầu thủ
            </DialogTitle>
          </DialogHeader>
          {editingDiscipline && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player">Chọn cầu thủ</Label>
                <Select 
                  value={editingDiscipline.playerId} 
                  onValueChange={handleSelectPlayer}
                >
                  <SelectTrigger id="player">
                    <SelectValue placeholder="Chọn cầu thủ" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} ({player.position} #{player.number || ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disciplineType">Loại kỷ luật</Label>
                <Select
                  value={editingDiscipline.disciplineType}
                  onValueChange={(value: DisciplineType) => setEditingDiscipline({ 
                    ...editingDiscipline, 
                    disciplineType: value 
                  })}
                >
                  <SelectTrigger id="disciplineType">
                    <SelectValue placeholder="Chọn loại kỷ luật" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                        Cảnh cáo
                      </div>
                    </SelectItem>
                    <SelectItem value="fine">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-red-500" />
                        Phạt tiền
                      </div>
                    </SelectItem>
                    <SelectItem value="suspension">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-orange-500" />
                        Đình chỉ thi đấu
                      </div>
                    </SelectItem>
                    <SelectItem value="additional_training">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-blue-500" />
                        Tập luyện bổ sung
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingDiscipline.disciplineType === "fine" && (
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền phạt (VND)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={editingDiscipline.amount || ""}
                    onChange={(e) => setEditingDiscipline({ 
                      ...editingDiscipline, 
                      amount: e.target.value ? parseInt(e.target.value, 10) : undefined
                    })}
                    min={0}
                    step={100000}
                    placeholder="Nhập số tiền phạt"
                  />
                </div>
              )}

              {(editingDiscipline.disciplineType === "suspension" || editingDiscipline.disciplineType === "additional_training") && (
                <div className="space-y-2">
                  <Label htmlFor="matches">
                    {editingDiscipline.disciplineType === "suspension" ? "Số trận đình chỉ" : "Số buổi tập bổ sung"}
                  </Label>
                  <Input
                    id="matches"
                    type="number"
                    value={editingDiscipline.matches || 1}
                    onChange={(e) => setEditingDiscipline({ 
                      ...editingDiscipline, 
                      matches: e.target.value ? parseInt(e.target.value, 10) : 1
                    })}
                    min={1}
                    step={1}
                    placeholder="Nhập số trận/buổi"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dateIssued">Ngày áp dụng</Label>
                <Input
                  id="dateIssued"
                  type="date"
                  value={editingDiscipline.dateIssued}
                  onChange={(e) => setEditingDiscipline({ 
                    ...editingDiscipline, 
                    dateIssued: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Lý do kỷ luật</Label>
                <Textarea
                  id="reason"
                  value={editingDiscipline.reason}
                  onChange={(e) => setEditingDiscipline({ 
                    ...editingDiscipline, 
                    reason: e.target.value
                  })}
                  placeholder="Nhập lý do kỷ luật"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveDiscipline} className="bg-red-500 hover:bg-red-600">Thêm kỷ luật</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa kỷ luật"
        description="Bạn có chắc chắn muốn xóa kỷ luật này? Hành động này không thể hoàn tác."
        onConfirm={() => {
          if (disciplineToDelete) {
            const updatedDisciplines = disciplines.filter(d => d.id !== disciplineToDelete);
            setDisciplines(updatedDisciplines);
            
            // Cập nhật ngay lập tức vào localStorage
            if (updatedDisciplines.length > 0) {
              localStorage.setItem('playerDisciplines', JSON.stringify(updatedDisciplines));
            } else {
              // Xóa khỏi localStorage nếu không còn kỷ luật nào
              localStorage.removeItem('playerDisciplines');
            }
            
            // Gọi callback nếu có
            if (onDisciplineChange) {
              onDisciplineChange(updatedDisciplines);
            }
          }
        }}
      />
    </div>
  )
}