"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Trophy, Users, Target, Award, Crown, Zap, Plus, X, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types
interface Player {
  id: string
  name: string
  position: string
  teamId: string
  teamName: string
  rating: number
  goals: number
  assists: number
  saves?: number
  cleanSheet?: boolean
  image?: string
  number?: number
  color?: string
}

interface SelectedPlayer extends Player {
  fieldPosition: string // GK, DF, MF, FW
  positionIndex: number // For multiple players in same position
  customX?: number // Custom X position when dragging
  customY?: number // Custom Y position when dragging
}

interface FormationConfig {
  name: string
  positions: {
    GK: number
    DF: number
    MF: number
    FW: number
  }
  layout: {
    position: string
    count: number
    x: number
    y: number
  }[]
}

interface TeamOfTheMatchProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (teamData: TeamOfTheMatchData) => void
  match: {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    fieldType: "5v5" | "7v7" | "11v11"
    formation: string
    teamOfTheMatch?: TeamOfTheMatchData // Existing saved data
  }
  players: Player[]
}

interface TeamOfTheMatchData {
  matchId: string
  formation: string
  selectedPlayers: SelectedPlayer[]
  savedAt: string
}

// Formations for different field types with better spacing
const formations: Record<string, Record<string, FormationConfig>> = {
  "5v5": {
    "3-1": {
      name: "3-1",
      positions: { GK: 1, DF: 3, MF: 1, FW: 0 },
      layout: [
        { position: "GK", count: 1, x: 12, y: 50 },
        { position: "DF", count: 3, x: 40, y: 50 }, // Will be spread vertically
        { position: "MF", count: 1, x: 75, y: 50 }
      ]
    },
    "2-2": {
      name: "2-2",
      positions: { GK: 1, DF: 2, MF: 2, FW: 0 },
      layout: [
        { position: "GK", count: 1, x: 12, y: 50 },
        { position: "DF", count: 2, x: 40, y: 50 }, // Will be spread vertically
        { position: "MF", count: 2, x: 75, y: 50 } // Will be spread vertically
      ]
    },
    "1-3": {
      name: "1-3",
      positions: { GK: 1, DF: 1, MF: 3, FW: 0 },
      layout: [
        { position: "GK", count: 1, x: 12, y: 50 },
        { position: "DF", count: 1, x: 40, y: 50 },
        { position: "MF", count: 3, x: 75, y: 50 } // Will be spread vertically
      ]
    }
  },
  "7v7": {
    "2-1-2-1": {
      name: "2-1-2-1",
      positions: { GK: 1, DF: 2, MF: 3, FW: 1 },
      layout: [
        { position: "GK", count: 1, x: 12, y: 50 },
        { position: "DF", count: 2, x: 30, y: 50 }, // Will be spread vertically
        { position: "MF", count: 3, x: 55, y: 50 }, // Will be spread vertically
        { position: "FW", count: 1, x: 85, y: 50 }
      ]
    },
    "3-2-1": {
      name: "3-2-1",
      positions: { GK: 1, DF: 3, MF: 2, FW: 1 },
      layout: [
        { position: "GK", count: 1, x: 12, y: 50 },
        { position: "DF", count: 3, x: 30, y: 50 }, // Will be spread vertically
        { position: "MF", count: 2, x: 60, y: 50 }, // Will be spread vertically
        { position: "FW", count: 1, x: 85, y: 50 }
      ]
    }
  },
  "11v11": {
    "4-4-2": {
      name: "4-4-2",
      positions: { GK: 1, DF: 4, MF: 4, FW: 2 },
      layout: [
        { position: "GK", count: 1, x: 10, y: 50 },
        { position: "DF", count: 4, x: 25, y: 50 }, // Will be spread vertically
        { position: "MF", count: 4, x: 50, y: 50 }, // Will be spread vertically
        { position: "FW", count: 2, x: 80, y: 50 } // Will be spread vertically
      ]
    },
    "4-3-3": {
      name: "4-3-3",
      positions: { GK: 1, DF: 4, MF: 3, FW: 3 },
      layout: [
        { position: "GK", count: 1, x: 10, y: 50 },
        { position: "DF", count: 4, x: 25, y: 50 }, // Will be spread vertically
        { position: "MF", count: 3, x: 50, y: 50 }, // Will be spread vertically
        { position: "FW", count: 3, x: 80, y: 50 } // Will be spread vertically
      ]
    }
  }
}

export default function TeamOfTheMatch({ isOpen, onClose, onSave, match, players }: TeamOfTheMatchProps) {
  const [selectedFormation, setSelectedFormation] = useState<string>("")
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isDragMode, setIsDragMode] = useState<boolean>(false)
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null)

  // Get available formations for match field type
  const availableFormations = formations[match.fieldType] || {}
  const currentFormation = selectedFormation ? availableFormations[selectedFormation] : null

  // Sort players by rating (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating)

  // Initialize when dialog opens - load saved data if exists
  useEffect(() => {
    if (isOpen) {
      if (match.teamOfTheMatch) {
        // Load saved data
        setSelectedFormation(match.teamOfTheMatch.formation)
        setSelectedPlayers(match.teamOfTheMatch.selectedPlayers)
        setErrorMessage("")
      } else {
        // Reset to empty state
        setSelectedFormation("")
        setSelectedPlayers([])
        setErrorMessage("")
      }
      setIsDragMode(false)
      setDraggedPlayer(null)
    }
  }, [isOpen, match.teamOfTheMatch])

  // Clear error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  // Sync selected players with updated player data
  useEffect(() => {
    if (selectedPlayers.length > 0 && players.length > 0) {
      let hasChanges = false
      const updatedSelectedPlayers = selectedPlayers.map(selectedPlayer => {
        // Find the updated player data from the players prop
        const updatedPlayerData = players.find(p => p.id === selectedPlayer.id)
        if (updatedPlayerData) {
          // Check if there are changes before merging
          const nameChanged = updatedPlayerData.name !== selectedPlayer.name
          const imageChanged = updatedPlayerData.image !== selectedPlayer.image
          const colorChanged = updatedPlayerData.color !== selectedPlayer.color
          const numberChanged = updatedPlayerData.number !== selectedPlayer.number
          const positionChanged = updatedPlayerData.position !== selectedPlayer.position

          if (nameChanged || imageChanged || colorChanged || numberChanged || positionChanged) {
            hasChanges = true
            // Merge updated data while preserving team of the match specific fields
            return {
              ...updatedPlayerData,
              fieldPosition: selectedPlayer.fieldPosition,
              positionIndex: selectedPlayer.positionIndex,
              customX: selectedPlayer.customX,
              customY: selectedPlayer.customY
            }
          }
        }
        return selectedPlayer
      })

      if (hasChanges) {
        console.log('Syncing player data changes:', updatedSelectedPlayers)
        setSelectedPlayers(updatedSelectedPlayers)
      }
    }
  }, [players]) // Only depend on players prop

  // Map player position to field position
  const mapToFieldPosition = (playerPosition: string): string => {
    const mapping: Record<string, string> = {
      "GK": "GK",
      "DF": "DF",
      "CB": "DF",
      "LB": "DF",
      "RB": "DF",
      "MF": "MF",
      "CM": "MF",
      "DM": "MF",
      "AM": "MF",
      "LM": "MF",
      "RM": "MF",
      "FW": "FW",
      "ST": "FW",
      "CF": "FW",
      "LW": "FW",
      "RW": "FW"
    }
    return mapping[playerPosition] || "MF"
  }

  // Check if player can be added to formation
  const canAddPlayer = (player: Player): { canAdd: boolean; reason?: string } => {
    if (!currentFormation) {
      return { canAdd: false, reason: "Vui lòng chọn sơ đồ chiến thuật trước" }
    }

    // Check if player already selected
    if (selectedPlayers.find(p => p.id === player.id)) {
      return { canAdd: false, reason: "Cầu thủ đã được chọn" }
    }

    const fieldPosition = mapToFieldPosition(player.position)
    const currentCount = selectedPlayers.filter(p => p.fieldPosition === fieldPosition).length
    const maxCount = currentFormation.positions[fieldPosition as keyof typeof currentFormation.positions]

    if (currentCount >= maxCount) {
      return {
        canAdd: false,
        reason: `Đã đủ ${maxCount} ${getPositionName(fieldPosition)} theo sơ đồ ${currentFormation.name}`
      }
    }

    return { canAdd: true }
  }

  // Add player to team
  const addPlayer = (player: Player) => {
    const { canAdd, reason } = canAddPlayer(player)

    if (!canAdd) {
      setErrorMessage(reason || "Không thể thêm cầu thủ")
      return
    }

    const fieldPosition = mapToFieldPosition(player.position)
    const positionIndex = selectedPlayers.filter(p => p.fieldPosition === fieldPosition).length

    const selectedPlayer: SelectedPlayer = {
      ...player,
      fieldPosition,
      positionIndex
    }

    setSelectedPlayers([...selectedPlayers, selectedPlayer])
    setErrorMessage("")
  }

  // Remove player from team
  const removePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId))
  }

  // Update player position when dragging
  const updatePlayerPosition = (playerId: string, x: number, y: number) => {
    setSelectedPlayers(prev => prev.map(player =>
      player.id === playerId
        ? { ...player, customX: x, customY: y }
        : player
    ))
  }

  // Handle drag start
  const handleDragStart = (playerId: string) => {
    if (isDragMode) {
      setDraggedPlayer(playerId)
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedPlayer(null)
  }

  // Handle field click to place player
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragMode && draggedPlayer) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Ensure player stays within field bounds
      const boundedX = Math.max(5, Math.min(95, x))
      const boundedY = Math.max(10, Math.min(90, y))

      updatePlayerPosition(draggedPlayer, boundedX, boundedY)
      setDraggedPlayer(null)
    }
  }

  // Save team of the match data
  const handleSave = () => {
    if (selectedPlayers.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất một cầu thủ")
      return
    }

    const teamData: TeamOfTheMatchData = {
      matchId: match.id,
      formation: selectedFormation,
      selectedPlayers: selectedPlayers,
      savedAt: new Date().toISOString()
    }

    if (onSave) {
      onSave(teamData)
    }

    onClose()
  }

  // Get position display name
  const getPositionName = (pos: string) => {
    const names: {[key: string]: string} = {
      "GK": "Thủ môn",
      "DF": "Hậu vệ",
      "MF": "Tiền vệ",
      "FW": "Tiền đạo"
    }
    return names[pos] || pos
  }

  // Get position color
  const getPositionColor = (pos: string) => {
    const colors: {[key: string]: string} = {
      "GK": "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
      "DF": "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
      "MF": "bg-gradient-to-r from-green-600 to-green-700 text-white",
      "FW": "bg-gradient-to-r from-red-600 to-red-700 text-white"
    }
    return colors[pos] || "bg-gradient-to-r from-gray-600 to-gray-700 text-white"
  }

  // Get position hex color
  const getPositionHexColor = (pos: string) => {
    const colors: {[key: string]: string} = {
      "GK": "#EAB308",
      "DF": "#3B82F6",
      "MF": "#10B981",
      "FW": "#EF4444"
    }
    return colors[pos] || "#6B7280"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Đội hình tiêu biểu trận đấu
            <Badge variant="outline" className="ml-2 text-sm">
              {match.homeTeam} {match.homeScore}-{match.awayScore} {match.awayTeam}
            </Badge>
            {match.teamOfTheMatch && (
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                ✓ Đã lưu
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[78vh]">
          {/* Left Panel - Controls and Player List */}
          <div className="w-80 flex flex-col space-y-3 max-h-full">
            {/* Match Info */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-800 mb-1">Thông tin trận đấu</h4>
              <p className="text-sm text-blue-700">
                Loại sân: <span className="font-medium">{match.fieldType}</span>
                <span className="text-xs text-blue-600 ml-2">
                  (Tự động phát hiện từ {players.length} cầu thủ được đánh giá)
                </span>
              </p>
            </div>

            {/* Formation Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sơ đồ chiến thuật</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(availableFormations).map(([key, formation]) => (
                  <Button
                    key={key}
                    variant={selectedFormation === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedFormation(key)
                      setSelectedPlayers([])
                    }}
                    className="text-xs"
                  >
                    {formation.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Drag Mode Toggle */}
            {selectedPlayers.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant={isDragMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsDragMode(!isDragMode)}
                  className="w-full text-sm"
                >
                  {isDragMode ? "✓ Đang điều chỉnh vị trí" : "🎯 Điều chỉnh vị trí"}
                </Button>
                {isDragMode && (
                  <p className="text-xs text-gray-600 text-center">
                    Kéo thả cầu thủ để điều chỉnh vị trí trên sân
                  </p>
                )}
              </div>
            )}

            {/* Formation Info */}
            {currentFormation && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Sơ đồ {currentFormation.name}</h4>
                <div className="space-y-1">
                  {Object.entries(currentFormation.positions).map(([pos, count]) => {
                    if (count === 0) return null
                    const selected = selectedPlayers.filter(p => p.fieldPosition === pos).length
                    return (
                      <div key={pos} className="flex justify-between items-center text-xs">
                        <span>{getPositionName(pos)}</span>
                        <Badge variant={selected === count ? "default" : "secondary"}>
                          {selected}/{count}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Player Rankings */}
            <div className="flex-1 overflow-hidden">
              <h4 className="font-semibold text-base mb-2 text-gray-800">Bảng xếp hạng cầu thủ</h4>
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 2.5rem)' }}>
                {sortedPlayers.map((player, index) => {
                  const isSelected = selectedPlayers.find(p => p.id === player.id)
                  const { canAdd } = canAddPlayer(player)

                  return (
                    <div
                      key={player.id}
                      className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 border-green-500 shadow-lg ring-2 ring-green-200"
                          : canAdd
                            ? index % 2 === 0
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-500 hover:shadow-lg"
                              : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 hover:from-purple-100 hover:to-pink-100 hover:border-purple-500 hover:shadow-lg"
                            : "bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300 opacity-60 cursor-not-allowed"
                      }`}
                      onClick={() => !isSelected && canAdd && addPlayer(player)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {/* Ranking badge */}
                          <div className={`w-8 h-8 rounded-full text-white text-sm flex items-center justify-center font-bold shadow-lg border-2 border-white ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                            index < 10 ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                            'bg-gradient-to-br from-gray-500 to-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Player avatar */}
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-3 border-white ring-2 ring-gray-200"
                            style={{
                              background: player.color
                                ? `linear-gradient(135deg, ${player.color}, ${player.color}dd)`
                                : 'linear-gradient(135deg, #6B7280, #4B5563)'
                            }}
                          >
                            {player.image ? (
                              <img
                                src={player.image}
                                alt={player.name}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                                }}
                              />
                            ) : (
                              player.position
                            )}
                          </div>
                          {player.number && (
                            <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {player.number}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-600 font-medium">{player.teamName}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-lg text-gray-900">{player.rating.toFixed(1)}</span>
                          </div>
                          <Badge className={`${getPositionColor(mapToFieldPosition(player.position))} text-sm font-bold shadow-md border border-white`}>
                            {player.position}
                          </Badge>
                        </div>
                        {isSelected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePlayer(player.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Football Field */}
          <div className="flex-1 flex flex-col">
            {currentFormation ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Sân {match.fieldType} - Sơ đồ {currentFormation.name}
                  </h3>
                  <div className="flex justify-center items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Đã chọn: {selectedPlayers.length} / {Object.values(currentFormation.positions).reduce((a, b) => a + b, 0)} cầu thủ
                      </span>
                    </div>
                    {selectedPlayers.length === Object.values(currentFormation.positions).reduce((a, b) => a + b, 0) && (
                      <Badge className="bg-green-500 text-white">
                        <Trophy className="h-3 w-3 mr-1" />
                        Đội hình hoàn chỉnh
                      </Badge>
                    )}
                  </div>

                  {/* Formation progress bar */}
                  <div className="mt-3 max-w-md mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(selectedPlayers.length / Object.values(currentFormation.positions).reduce((a, b) => a + b, 0)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Compact Football Field */}
                <div className="flex-1 flex items-center justify-center p-2">
                  <div
                    className="relative shadow-2xl overflow-hidden"
                    style={{
                      width: "650px",
                      height: "400px",
                      backgroundColor: "#2d5a3d"
                    }}
                  >
                    {/* Exact grass stripes like the image */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left: `${(i * 100) / 16}%`,
                            width: `${100 / 16}%`,
                            height: '100%',
                            backgroundColor: i % 2 === 0 ? '#4ade80' : '#22c55e'
                          }}
                        />
                      ))}
                    </div>

                    {/* Exact Field Markings Like Image */}
                    <div
                      className="absolute inset-0 z-20"
                      onClick={handleFieldClick}
                      style={{ cursor: isDragMode && draggedPlayer ? 'crosshair' : 'default' }}
                    >
                      {/* Outer field boundary */}
                      <div
                        className="absolute border-4 border-white"
                        style={{
                          left: '2%',
                          top: '4%',
                          width: '96%',
                          height: '92%'
                        }}
                      >
                        {/* Center line */}
                        <div
                          className="absolute border-l-4 border-white h-full"
                          style={{ left: '50%', transform: 'translateX(-50%)' }}
                        />

                        {/* Center circle */}
                        <div
                          className="absolute border-4 border-white rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            width: '120px',
                            height: '120px',
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {/* Center spot */}
                          <div
                            className="absolute bg-white rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                              width: '6px',
                              height: '6px',
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        </div>

                        {/* Left penalty area */}
                        <div
                          className="absolute border-4 border-white border-l-0"
                          style={{
                            left: '0',
                            top: '50%',
                            width: '88px',
                            height: '220px',
                            transform: 'translateY(-50%)'
                          }}
                        >
                          {/* Left goal area */}
                          <div
                            className="absolute border-4 border-white border-l-0"
                            style={{
                              left: '0',
                              top: '50%',
                              width: '44px',
                              height: '132px',
                              transform: 'translateY(-50%)'
                            }}
                          />

                          {/* Left penalty arc */}
                          <div
                            className="absolute border-4 border-white rounded-full border-l-0"
                            style={{
                              left: '88px',
                              top: '50%',
                              width: '60px',
                              height: '60px',
                              transform: 'translate(-50%, -50%)',
                              clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)'
                            }}
                          />
                        </div>

                        {/* Right penalty area */}
                        <div
                          className="absolute border-4 border-white border-r-0"
                          style={{
                            right: '0',
                            top: '50%',
                            width: '88px',
                            height: '220px',
                            transform: 'translateY(-50%)'
                          }}
                        >
                          {/* Right goal area */}
                          <div
                            className="absolute border-4 border-white border-r-0"
                            style={{
                              right: '0',
                              top: '50%',
                              width: '44px',
                              height: '132px',
                              transform: 'translateY(-50%)'
                            }}
                          />

                          {/* Right penalty arc */}
                          <div
                            className="absolute border-4 border-white rounded-full border-r-0"
                            style={{
                              right: '88px',
                              top: '50%',
                              width: '60px',
                              height: '60px',
                              transform: 'translate(50%, -50%)',
                              clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)'
                            }}
                          />
                        </div>

                        {/* Penalty spots */}
                        <div
                          className="absolute bg-white rounded-full"
                          style={{
                            left: '66px',
                            top: '50%',
                            width: '6px',
                            height: '6px',
                            transform: 'translateY(-50%)'
                          }}
                        />
                        <div
                          className="absolute bg-white rounded-full"
                          style={{
                            right: '66px',
                            top: '50%',
                            width: '6px',
                            height: '6px',
                            transform: 'translateY(-50%)'
                          }}
                        />

                        {/* Corner arcs */}
                        <div
                          className="absolute border-4 border-white rounded-full border-t-0 border-l-0"
                          style={{
                            left: '0',
                            top: '0',
                            width: '20px',
                            height: '20px'
                          }}
                        />
                        <div
                          className="absolute border-4 border-white rounded-full border-t-0 border-r-0"
                          style={{
                            right: '0',
                            top: '0',
                            width: '20px',
                            height: '20px'
                          }}
                        />
                        <div
                          className="absolute border-4 border-white rounded-full border-b-0 border-l-0"
                          style={{
                            left: '0',
                            bottom: '0',
                            width: '20px',
                            height: '20px'
                          }}
                        />
                        <div
                          className="absolute border-4 border-white rounded-full border-b-0 border-r-0"
                          style={{
                            right: '0',
                            bottom: '0',
                            width: '20px',
                            height: '20px'
                          }}
                        />
                      </div>

                      {/* Goals */}
                      <div
                        className="absolute bg-white"
                        style={{
                          left: '0',
                          top: '50%',
                          width: '16px',
                          height: '80px',
                          transform: 'translateY(-50%)'
                        }}
                      />
                      <div
                        className="absolute bg-white"
                        style={{
                          right: '0',
                          top: '50%',
                          width: '16px',
                          height: '80px',
                          transform: 'translateY(-50%)'
                        }}
                      />
                    </div>

                    {/* Players */}
                    {selectedPlayers.map((player, index) => {
                      const layoutPosition = currentFormation.layout.find(l => l.position === player.fieldPosition)
                      if (!layoutPosition) return null

                      let x, y

                      // Use custom position if available (from dragging)
                      if (player.customX !== undefined && player.customY !== undefined) {
                        x = player.customX
                        y = player.customY
                      } else {
                        // Calculate position with better spacing for multiple players
                        const playersInPosition = selectedPlayers.filter(p => p.fieldPosition === player.fieldPosition && !p.customX)
                        const playerIndex = playersInPosition.findIndex(p => p.id === player.id)
                        const totalInPosition = playersInPosition.length

                        x = layoutPosition.x
                        y = layoutPosition.y

                        // Adjust position for multiple players with better spacing
                        if (totalInPosition > 1 && playerIndex >= 0) {
                          // Increase spacing based on number of players
                          const baseSpacing = totalInPosition === 2 ? 20 : totalInPosition === 3 ? 18 : totalInPosition === 4 ? 16 : 14
                          const totalHeight = (totalInPosition - 1) * baseSpacing
                          const startY = layoutPosition.y - (totalHeight / 2)
                          y = startY + (playerIndex * baseSpacing)

                          // Ensure players don't go outside field bounds
                          y = Math.max(15, Math.min(85, y))
                        }
                      }

                      return (
                        <div
                          key={player.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 group animate-in fade-in duration-500 z-30 ${
                            isDragMode ? 'cursor-move' : 'cursor-pointer'
                          } ${draggedPlayer === player.id ? 'opacity-50 scale-110' : ''}`}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isDragMode) {
                              handleDragStart(player.id)
                            }
                          }}
                          onMouseDown={(e) => {
                            if (isDragMode) {
                              e.preventDefault()
                              handleDragStart(player.id)
                            }
                          }}
                        >
                          {/* Player circle with enhanced styling */}
                          <div className={`
                            w-12 h-12 rounded-full border-3 border-white shadow-xl flex items-center justify-center text-white font-bold text-sm
                            group-hover:scale-125 transition-all duration-300 hover:shadow-2xl hover:border-yellow-300 relative overflow-hidden
                          `}
                          style={{ backgroundColor: player.color || getPositionHexColor(player.fieldPosition) }}>

                            {player.image ? (
                              <img
                                src={player.image}
                                alt={player.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                                }}
                              />
                            ) : (
                              <span className="relative z-10">{player.number || (index + 1)}</span>
                            )}

                            {/* Glow effect */}
                            <div className={`
                              absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300
                              ${getPositionColor(player.fieldPosition)} blur-sm scale-150
                            `}></div>
                          </div>

                          {/* Enhanced player info tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                            <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700">
                              <div className="font-bold text-base">{player.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span className="font-semibold">{player.rating.toFixed(1)}</span>
                                </div>
                                <Badge className={`${getPositionColor(player.fieldPosition)} text-xs`}>
                                  {player.position}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-300 mt-1">{player.teamName}</div>

                              {/* Stats */}
                              <div className="flex gap-2 mt-1 text-xs">
                                {player.goals > 0 && (
                                  <span className="flex items-center gap-1 text-green-400">
                                    <Target className="h-3 w-3" />
                                    {player.goals}
                                  </span>
                                )}
                                {player.assists > 0 && (
                                  <span className="flex items-center gap-1 text-blue-400">
                                    <Zap className="h-3 w-3" />
                                    {player.assists}
                                  </span>
                                )}
                              </div>

                              {/* Tooltip arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>

                          {/* Position label with team color */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className={`text-white text-xs rounded-full px-2 py-1 font-semibold shadow-lg ${getPositionColor(player.fieldPosition)}`}>
                              {player.position}
                            </div>
                          </div>

                          {/* Selection indicator */}
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSelectedPlayers([])}
                    disabled={selectedPlayers.length === 0}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa tất cả
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={selectedPlayers.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    {selectedPlayers.length === Object.values(currentFormation.positions).reduce((a, b) => a + b, 0)
                      ? "Hoàn thành đội hình"
                      : `Lưu đội hình (${selectedPlayers.length})`
                    }
                  </Button>
                </div>

                {/* Selected players summary */}
                {selectedPlayers.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Đội hình đã chọn:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayers.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-1 bg-white rounded-full px-2 py-1 text-xs border">
                          <span className={`w-4 h-4 rounded-full text-white text-xs flex items-center justify-center ${getPositionColor(player.fieldPosition)}`}>
                            {index + 1}
                          </span>
                          <span className="font-medium">{player.name}</span>
                          <Badge className={`${getPositionColor(player.fieldPosition)} text-xs`}>
                            {player.position}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Chọn loại sân và sơ đồ chiến thuật để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
