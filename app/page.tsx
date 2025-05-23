"use client"

import { useState, useEffect } from "react"
import { Moon, Save, Share, Trash2, UserPlus, Pencil, Eraser, RefreshCw, FileText, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import FootballPitch from "@/components/football-pitch"
import PlayerList from "@/components/player-list"
import PlayerForm from "@/components/player-form"
import FormationSelector from "@/components/formation-selector"
import FieldTypeSelector from "@/components/field-type-selector"
import SubstitutionDialog from "@/components/substitution-dialog"
import SubstitutionHistory from "@/components/substitution-history"
import NoteManager from "@/components/note-manager"
import MatchSchedule from "@/components/match-schedule"
import PlayerDisciplineManager from "@/components/player-discipline"
import type { Player, Position, Team, Formation, DrawingMode, Substitution, Note, Match, PlayerDiscipline, FieldType } from "@/lib/types"
import { generatePlayersFromFormation } from "@/lib/formations"

export default function TacticBoard() {
  const [homeTeam, setHomeTeam] = useState<Team>({
    id: "home",
    name: "Đội nhà",
    color: "#2563eb",
    formation: "4-4-2",
    players: [
      {
        id: "home-1",
        position: "GK",
        name: "Thủ môn",
        color: "#2563eb",
        image: "",
        number: 1,
        yellowCards: 0,
        redCards: 0,
        injuryStatus: "fit",
        isSubstitute: false,
      },
    ],
    substitutions: [],
  })

  const [awayTeam, setAwayTeam] = useState<Team>({
    id: "away",
    name: "Đội khách",
    color: "#dc2626",
    formation: "4-4-2",
    players: [],
    substitutions: [],
  })

  const [notes, setNotes] = useState<Note[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [activeTeamId, setActiveTeamId] = useState<"home" | "away">("home")
  const [selectedTeamName, setSelectedTeamName] = useState<string>("Việt Nam (Cấp độ cao)")
  const [selectedPosition, setSelectedPosition] = useState<Position>("GK")
  const [selectedFormation, setSelectedFormation] = useState<Formation>("4-4-2")
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>("11")
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none")
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [canDragPlayers, setCanDragPlayers] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [isSubstitutionDialogOpen, setIsSubstitutionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"tactics" | "discipline" | "notes" | "schedule">("tactics")
  const [playerDisciplines, setPlayerDisciplines] = useState<PlayerDiscipline[]>([])
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)

  // Tải dữ liệu kỷ luật cầu thủ từ localStorage khi khởi động
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDisciplines = localStorage.getItem('playerDisciplines')
      if (savedDisciplines) {
        try {
          setPlayerDisciplines(JSON.parse(savedDisciplines))
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu kỷ luật:', error)
        }
      }
    }
  }, [])

  const activeTeam = activeTeamId === "home" ? homeTeam : awayTeam
  const setActiveTeam = activeTeamId === "home" ? setHomeTeam : setAwayTeam

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation)
    
    if (activeTeamId === "home") {
      // Update home team formation
      const newPlayers = generatePlayersFromFormation(formation, homeTeam.color, "home", selectedFieldType)
      
      // Keep the substitutes
      const substitutes = homeTeam.players.filter((p) => p.isSubstitute)
      
      setHomeTeam({
        ...homeTeam,
        formation: formation,
        players: [...newPlayers, ...substitutes],
      })
    } else {
      // Update away team formation
      const newPlayers = generatePlayersFromFormation(formation, awayTeam.color, "away", selectedFieldType)
      
      // Keep the substitutes
      const substitutes = awayTeam.players.filter((p) => p.isSubstitute)
      
      setAwayTeam({
        ...awayTeam,
        formation: formation,
        players: [...newPlayers, ...substitutes],
      })
    }
  }

  const handleFieldTypeChange = (fieldType: FieldType) => {
    setSelectedFieldType(fieldType)
    
    // Lấy đội hình mặc định dựa trên loại sân
    let defaultFormation: Formation;
    switch (fieldType) {
      case "5":
        defaultFormation = "3-1";
        break;
      case "7":
        defaultFormation = "3-3";
        break;
      default:
        defaultFormation = "4-4-2";
    }
    
    // Cập nhật đội hình và vị trí cầu thủ cho đội đang chọn
    setSelectedFormation(defaultFormation)
    
    const activeTeam = activeTeamId === "home" ? homeTeam : awayTeam;
    const newPlayers = generatePlayersFromFormation(defaultFormation, activeTeam.color, activeTeamId, fieldType);
    const substitutes = activeTeam.players.filter((p) => p.isSubstitute);

    if (activeTeamId === "home") {
      setHomeTeam({
        ...homeTeam,
        formation: defaultFormation,
        players: [...newPlayers, ...substitutes],
      });
    } else {
      setAwayTeam({
        ...awayTeam,
        formation: defaultFormation,
        players: [...newPlayers, ...substitutes],
      });
    }
  }

  const addPlayer = () => {
    const newPlayer: Player = {
      id: `${activeTeamId}-${Date.now()}`,
      position: "GK",
      name: "Cầu thủ mới",
      color: activeTeam.color,
      image: "",
      number: activeTeam.players.length + 1,
      yellowCards: 0,
      redCards: 0,
      injuryStatus: "fit",
      isSubstitute: false,
    }

    setEditingPlayer(newPlayer)
    setIsAddingPlayer(true)
  }

  const removePlayer = (id: string) => {
    setActiveTeam({
      ...activeTeam,
      players: activeTeam.players.filter((player) => player.id !== id),
    })
  }

  const updatePlayer = (updatedPlayer: Player) => {
    if (isAddingPlayer) {
      setActiveTeam({
        ...activeTeam,
        players: [...activeTeam.players, updatedPlayer],
      })
      setIsAddingPlayer(false)
    } else {
      setActiveTeam({
        ...activeTeam,
        players: activeTeam.players.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player)),
      })
    }
    setEditingPlayer(null)

    // Component PlayerDisciplineManager sẽ tự động cập nhật thông tin kỷ luật dựa trên thay đổi của props players
  }

  const clearAllPlayers = () => {
    setHomeTeam({
      ...homeTeam,
      players: [],
      substitutions: [],
    })
    setAwayTeam({
      ...awayTeam,
      players: [],
      substitutions: [],
    })
    setDrawingMode("none")
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  const handleCancelEdit = () => {
    setEditingPlayer(null)
    setIsAddingPlayer(false)
  }

  const handleSubstitution = (substitution: Substitution) => {
    // Cập nhật trạng thái cầu thủ
    const updatedPlayers = activeTeam.players.map((player) => {
      if (player.id === substitution.playerOutId) {
        return { ...player, isSubstitute: true }
      }
      if (player.id === substitution.playerInId) {
        return { ...player, isSubstitute: false }
      }
      return player
    })

    // Thêm thông tin thay người
    const updatedSubstitutions = [...(activeTeam.substitutions || []), substitution]

    setActiveTeam({
      ...activeTeam,
      players: updatedPlayers,
      substitutions: updatedSubstitutions,
    })
  }

  const handleRemoveSubstitution = (id: string) => {
    // Tìm thông tin thay người
    const substitution = activeTeam.substitutions?.find((sub) => sub.id === id)
    if (!substitution) return

    // Hoàn tác trạng thái cầu thủ
    const updatedPlayers = activeTeam.players.map((player) => {
      if (player.id === substitution.playerOutId) {
        return { ...player, isSubstitute: false }
      }
      if (player.id === substitution.playerInId) {
        return { ...player, isSubstitute: true }
      }
      return player
    })

    // Xóa thông tin thay người
    const updatedSubstitutions = activeTeam.substitutions?.filter((sub) => sub.id !== id) || []

    setActiveTeam({
      ...activeTeam,
      players: updatedPlayers,
      substitutions: updatedSubstitutions,
    })
  }

  // Xử lý ghi chú
  const handleAddNote = (note: Note) => {
    setNotes([...notes, note])
  }

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
  }

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  // Xử lý lịch thi đấu
  const handleAddMatch = (match: Match) => {
    setMatches([...matches, match])
  }

  const handleUpdateMatch = (updatedMatch: Match) => {
    setMatches(matches.map((match) => (match.id === updatedMatch.id ? updatedMatch : match)))
  }

  const handleDeleteMatch = (id: string) => {
    setMatches(matches.filter((match) => match.id !== id))
  }

  // Xử lý kỷ luật cầu thủ
  const handleDisciplineChange = (disciplines: PlayerDiscipline[]) => {
    setPlayerDisciplines(disciplines)
    
    // Lưu vào localStorage để đảm bảo nhất quán dữ liệu khi chuyển tab
    if (disciplines.length > 0) {
      localStorage.setItem('playerDisciplines', JSON.stringify(disciplines))
    } else {
      localStorage.removeItem('playerDisciplines')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-white font-bold">FC</span>
          </div>
          <h1 className="text-xl font-bold">FCHCMUST Bảng Chiến Thuật</h1>
        </div>
        <Button variant="outline" size="sm" className="rounded-full">
          <Moon className="h-4 w-4 mr-2" />
          <span>Chế độ tối</span>
        </Button>
      </header>

      <div className="container mx-auto p-4">
        <Tabs defaultValue="tactics" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="tactics" className="flex-1">
              <Pencil className="h-4 w-4 mr-2" /> Chiến thuật
            </TabsTrigger>
            <TabsTrigger value="discipline" className="flex-1">
              <AlertTriangle className="h-4 w-4 mr-2" /> Kỷ luật
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">
              <FileText className="h-4 w-4 mr-2" /> Ghi chú
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" /> Lịch thi đấu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tactics" className="mt-0">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={drawingMode === "pencil" ? "default" : "outline"}
                size="sm"
                className={`gap-2 ${drawingMode === "pencil" ? "bg-blue-500 text-white" : ""}`}
                onClick={() => {
                  setDrawingMode(drawingMode === "pencil" ? "none" : "pencil")
                  setCanDragPlayers(false)
                }}
              >
                <Pencil className="h-4 w-4" /> Vẽ chiến thuật
              </Button>
              <Button
                variant={drawingMode === "eraser" ? "default" : "outline"}
                size="sm"
                className={`gap-2 ${drawingMode === "eraser" ? "bg-blue-500 text-white" : ""}`}
                onClick={() => {
                  setDrawingMode(drawingMode === "eraser" ? "none" : "eraser")
                  setCanDragPlayers(false)
                }}
              >
                <Eraser className="h-4 w-4" /> Xóa nét vẽ
              </Button>
              <Button
                variant={canDragPlayers ? "default" : "outline"}
                size="sm"
                className={`gap-2 ${canDragPlayers ? "bg-blue-500 text-white" : ""}`}
                onClick={() => {
                  setCanDragPlayers(!canDragPlayers)
                  setDrawingMode("none")
                }}
              >
                <UserPlus className="h-4 w-4" /> Điều chỉnh vị trí
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsSubstitutionDialogOpen(true)}>
                <RefreshCw className="h-4 w-4" /> Thay người
              </Button>
              <div className="flex-grow"></div>
              <Button variant="default" size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                <Save className="h-4 w-4 mr-2" /> Lưu
              </Button>
              <Button variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" /> Chia sẻ
              </Button>
              <Button variant="default" size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => setConfirmDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Xóa tất cả
              </Button>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="w-full lg:w-1/4">
                <Tabs defaultValue="home" onValueChange={(value) => setActiveTeamId(value as "home" | "away")}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="home" className="flex-1">
                      Đội nhà
                    </TabsTrigger>
                    <TabsTrigger value="away" className="flex-1">
                      Đội khách
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="home" className="mt-0">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Chọn đội bóng</h2>
                      <Select value={selectedTeamName} onValueChange={setSelectedTeamName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đội bóng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Việt Nam (Cấp độ cao)">Việt Nam (Cấp độ cao)</SelectItem>
                          <SelectItem value="Thái Lan">Thái Lan</SelectItem>
                          <SelectItem value="Malaysia">Malaysia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Loại sân</h2>
                      <FieldTypeSelector selectedFieldType={selectedFieldType} onFieldTypeChange={handleFieldTypeChange} />
                    </div>

                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Sơ đồ chiến thuật</h2>
                      <FormationSelector 
                        selectedFormation={homeTeam.formation || selectedFormation} 
                        onFormationChange={handleFormationChange} 
                        fieldType={selectedFieldType} 
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="away" className="mt-0">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Chọn đội bóng</h2>
                      <Select value={selectedTeamName} onValueChange={setSelectedTeamName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đội bóng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Thái Lan">Thái Lan</SelectItem>
                          <SelectItem value="Malaysia">Malaysia</SelectItem>
                          <SelectItem value="Indonesia">Indonesia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Loại sân</h2>
                      <FieldTypeSelector selectedFieldType={selectedFieldType} onFieldTypeChange={handleFieldTypeChange} />
                    </div>

                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Sơ đồ chiến thuật</h2>
                      <FormationSelector 
                        selectedFormation={awayTeam.formation || selectedFormation}
                        onFormationChange={handleFormationChange} 
                        fieldType={selectedFieldType} 
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mb-6">
                  <PlayerList
                    players={activeTeam.players}
                    onRemove={removePlayer}
                    onEdit={setEditingPlayer}
                    onAddPlayer={addPlayer}
                  />
                </div>

                {activeTeam.substitutions && activeTeam.substitutions.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Lịch sử thay người</h2>
                    <SubstitutionHistory team={activeTeam} onRemoveSubstitution={handleRemoveSubstitution} />
                  </div>
                )}
              </div>

              <div className="w-full lg:w-2/3 lg:flex-grow">
                <FootballPitch
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  drawingMode={drawingMode}
                  onUpdatePlayer={updatePlayer}
                  canDragPlayers={canDragPlayers}
                  fieldType={selectedFieldType}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="discipline" className="mt-0">
            <PlayerDisciplineManager
              players={[...homeTeam.players, ...awayTeam.players]}
              onDisciplineChange={handleDisciplineChange}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NoteManager
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            <MatchSchedule
              matches={matches}
              onAddMatch={handleAddMatch}
              onUpdateMatch={handleUpdateMatch}
              onDeleteMatch={handleDeleteMatch}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog để chỉnh sửa thông tin cầu thủ */}
      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAddingPlayer ? "Thêm cầu thủ mới" : "Chỉnh sửa cầu thủ"}</DialogTitle>
          </DialogHeader>
          {editingPlayer && <PlayerForm player={editingPlayer} onSave={updatePlayer} onCancel={handleCancelEdit} />}
        </DialogContent>
      </Dialog>

      {/* Dialog thay người */}
      <SubstitutionDialog
        open={isSubstitutionDialogOpen}
        onOpenChange={setIsSubstitutionDialogOpen}
        team={activeTeam}
        onSubstitute={handleSubstitution}
      />

      {/* Dialog chia sẻ */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chia sẻ chiến thuật</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-500">
              Bạn có thể chia sẻ chiến thuật này bằng cách lưu thành hình ảnh và chia sẻ với bạn bè.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShareDialogOpen(false)
                  setTimeout(() => {
                    const exportButton = document.getElementById("export-button")
                    if (exportButton) exportButton.click()
                  }, 500)
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Lưu thành hình ảnh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa tất cả */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tất cả</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-500">
              Bạn có chắc chắn muốn xóa tất cả cầu thủ và lịch sử thay người? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
                Hủy
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => { clearAllPlayers(); setConfirmDeleteDialogOpen(false) }}>
                Xóa tất cả
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
