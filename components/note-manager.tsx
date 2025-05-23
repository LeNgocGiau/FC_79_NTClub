"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Tag, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Note } from "@/lib/types"
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog"

interface NoteManagerProps {
  notes: Note[]
  onAddNote: (note: Note) => void
  onUpdateNote: (note: Note) => void
  onDeleteNote: (id: string) => void
}

export default function NoteManager({ notes, onAddNote, onUpdateNote, onDeleteNote }: NoteManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes)

  // Mẫu note mới
  const newNoteTemplate: Note = {
    id: "",
    title: "",
    content: "",
    createdAt: new Date().toISOString(),
    tags: [],
    color: "#ffffff",
  }

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNotes(notes)
    } else {
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredNotes(filtered)
    }
  }, [searchTerm, notes])

  const handleAddNote = () => {
    setEditingNote({
      ...newNoteTemplate,
      id: `note-${Date.now()}`,
    })
    setIsDialogOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsDialogOpen(true)
  }

  const handleSaveNote = () => {
    if (!editingNote) return

    if (notes.some((note) => note.id === editingNote.id)) {
      onUpdateNote(editingNote)
    } else {
      onAddNote(editingNote)
    }

    setIsDialogOpen(false)
    setEditingNote(null)
  }

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null)

  const handleDeleteNote = (id: string) => {
    setNoteIdToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteNote = () => {
    if (noteIdToDelete) {
      onDeleteNote(noteIdToDelete)
      setNoteIdToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ghi chú</h2>
        <Button onClick={handleAddNote} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" /> Thêm ghi chú
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Tìm kiếm ghi chú..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          {searchTerm ? "Không tìm thấy ghi chú nào phù hợp" : "Chưa có ghi chú nào"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="border rounded-md p-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: note.color, borderLeftWidth: "4px" }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{note.title}</h3>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditNote(note)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 mb-2">{note.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(note.createdAt)}
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {note.tags.join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNote?.id.includes("note-") ? "Thêm ghi chú mới" : "Chỉnh sửa ghi chú"}</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Tiêu đề ghi chú"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="Nội dung ghi chú"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Thẻ (phân cách bằng dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={editingNote.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setEditingNote({
                      ...editingNote,
                      tags: e.target.value.split(",").map((tag) => tag.trim()),
                    })
                  }
                  placeholder="chiến thuật, luyện tập, trận đấu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Màu sắc</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={editingNote.color}
                    onChange={(e) => setEditingNote({ ...editingNote, color: e.target.value })}
                    className="w-12 h-8 p-1"
                  />
                  <div className="w-full h-8 rounded border" style={{ backgroundColor: editingNote.color }}></div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveNote}>Lưu</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xác nhận xóa ghi chú"
        description="Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác."
        onConfirm={confirmDeleteNote}
      />
    </div>
  )
}
