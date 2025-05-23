"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import html2canvas from "html2canvas"
import type { Team, Player, DrawingMode, FieldType } from "@/lib/types"
import PlayerMarker from "@/components/player-marker"
import DrawingTools from "@/components/drawing-tools"
import { getPlayerPositionByFormation } from "@/lib/formations"

interface FootballPitchProps {
  homeTeam: Team
  awayTeam: Team
  drawingMode: DrawingMode
  onUpdatePlayer: (player: Player) => void
  canDragPlayers: boolean
  fieldType?: FieldType
}

export default function FootballPitch({
  homeTeam,
  awayTeam,
  drawingMode,
  onUpdatePlayer,
  canDragPlayers = false,
  fieldType = "11",
}: FootballPitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [strokeColor, setStrokeColor] = useState("#ffff00")

  // Khởi tạo vị trí cho cầu thủ dựa trên đội hình đã chọn
  useEffect(() => {
    const newPositions = { ...positions }

    // Xử lý cầu thủ đội nhà
    homeTeam.players.filter(p => !p.isSubstitute).forEach(player => {
      if (player.positionKey) {
        // Lấy vị trí theo sơ đồ
        const positionFromFormation = getPlayerPositionByFormation(
          homeTeam.formation || '4-4-2', 
          player.positionKey, 
          "home", 
          fieldType
        );
        if (positionFromFormation) {
          newPositions[player.id] = positionFromFormation;
        }
      }
    });

    // Xử lý cầu thủ đội khách - đảm bảo họ nằm ở phía đối diện sân
    awayTeam.players.filter(p => !p.isSubstitute).forEach(player => {
      if (player.positionKey) {
        // Lấy vị trí theo sơ đồ
        const positionFromFormation = getPlayerPositionByFormation(
          awayTeam.formation || '4-4-2', 
          player.positionKey, 
          "away", 
          fieldType
        );
        if (positionFromFormation) {
          newPositions[player.id] = positionFromFormation;
        }
      }
    });

    setPositions(newPositions);
  }, [homeTeam.players, awayTeam.players, fieldType, homeTeam.formation, awayTeam.formation]);

  // Xử lý vẽ
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Đảm bảo canvas có kích thước đúng
    const resizeCanvas = () => {
      if (pitchRef.current && canvas) {
        const rect = pitchRef.current.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  // Xử lý kéo thả cầu thủ
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (drawingMode !== "none" || !canDragPlayers) return
    if (!pitchRef.current) return

    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setDragging(id)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingMode !== "none") {
      handleDrawing(e)
      return
    }

    if (!dragging || !pitchRef.current || !canDragPlayers) return

    const rect = pitchRef.current.getBoundingClientRect()
    const x = Math.max(20, Math.min(rect.width - 20, e.clientX - rect.left))
    const y = Math.max(20, Math.min(rect.height - 20, e.clientY - rect.top))

    setPositions((prev) => ({
      ...prev,
      [dragging]: { x, y },
    }))
  }

  const handleMouseUp = () => {
    setDragging(null)
    setIsDrawing(false)
    setLastPos(null)
  }

  // Xử lý vẽ chiến thuật
  const handleDrawingStart = (e: React.MouseEvent) => {
    if (drawingMode === "none") return

    const canvas = canvasRef.current
    if (!canvas || !pitchRef.current) return

    setIsDrawing(true)

    const rect = pitchRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setLastPos({ x, y })

    // Bắt đầu vẽ điểm
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = drawingMode === "pencil" ? strokeColor : "rgba(0,0,0,0)"

      if (drawingMode === "eraser") {
        ctx.globalCompositeOperation = "destination-out"
      } else {
        ctx.globalCompositeOperation = "source-over"
      }

      ctx.fill()

      if (drawingMode === "eraser") {
        ctx.globalCompositeOperation = "source-over"
      }
    }
  }

  const handleDrawing = (e: React.MouseEvent) => {
    if (!isDrawing || drawingMode === "none" || !lastPos) return

    const canvas = canvasRef.current
    if (!canvas || !pitchRef.current) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = pitchRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()

    if (drawingMode === "pencil") {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (drawingMode === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = strokeWidth * 3 // Eraser is bigger
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.globalCompositeOperation = "source-over"
    }

    setLastPos({ x, y })
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const exportAsPNG = async () => {
    if (!pitchRef.current) return

    try {
      const canvas = await html2canvas(pitchRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
      })

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = "football-tactics.png"
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error exporting as PNG:", error)
    }
  }

  // Lọc ra chỉ hiển thị cầu thủ chính thức (không phải dự bị)
  const activeHomePlayers = homeTeam.players.filter((p) => !p.isSubstitute)
  const activeAwayPlayers = awayTeam.players.filter((p) => !p.isSubstitute)

  return (
    <div className="relative">
      <div
        ref={pitchRef}
        className="relative w-full h-[500px] rounded-lg shadow-md overflow-hidden"
        onMouseDown={handleDrawingStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Sân cỏ với các dải cỏ đậm nhạt */}
        <div className="absolute inset-0 bg-green-600">
          {/* Dải cỏ ngang */}
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`horizontal-${index}`}
              className={`absolute h-[8.33%] w-full ${index % 2 === 0 ? "bg-green-700" : "bg-green-600"}`}
              style={{ top: `${index * 8.33}%` }}
            ></div>
          ))}

          {/* Dải cỏ dọc */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`vertical-${index}`}
                className="absolute h-full w-[16.66%] bg-green-800"
                style={{ left: `${index * 16.66}%` }}
              ></div>
            ))}
          </div>

          {/* Hiệu ứng cắt cỏ hình tròn */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[30px] border-green-800"></div>
          </div>
        </div>

        {/* Canvas cho vẽ chiến thuật */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />

        {/* Sân bóng đá */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-[90%] h-[90%] border-2 border-white">
            {/* Vòng tròn giữa sân */}
            <div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Khung thành trái */}
            <div className="absolute top-1/2 left-0 w-[100px] h-[200px] border-2 border-white -translate-y-1/2 -translate-x-0">
              <div className="absolute top-1/2 left-[50px] w-[50px] h-[100px] border-2 border-white rounded-full -translate-y-1/2 border-l-0"></div>
            </div>

            {/* Khung thành phải */}
            <div className="absolute top-1/2 right-0 w-[100px] h-[200px] border-2 border-white -translate-y-1/2 translate-x-0">
              <div className="absolute top-1/2 right-[50px] w-[50px] h-[100px] border-2 border-white rounded-full -translate-y-1/2 border-r-0"></div>
            </div>

            {/* Đường giữa sân */}
            <div className="absolute top-0 left-1/2 h-full w-0 border-l-2 border-white -translate-x-1/2"></div>

            {/* Chấm phạt đền trái */}
            <div className="absolute top-1/2 left-[70px] w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>

            {/* Chấm phạt đền phải */}
            <div className="absolute top-1/2 right-[70px] w-4 h-4 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>

            {/* Vùng góc sân */}
            <div className="absolute top-0 left-0 w-[20px] h-[20px] border-r-2 border-b-2 border-white rounded-br-[20px]"></div>
            <div className="absolute top-0 right-0 w-[20px] h-[20px] border-l-2 border-b-2 border-white rounded-bl-[20px]"></div>
            <div className="absolute bottom-0 left-0 w-[20px] h-[20px] border-r-2 border-t-2 border-white rounded-tr-[20px]"></div>
            <div className="absolute bottom-0 right-0 w-[20px] h-[20px] border-l-2 border-t-2 border-white rounded-tl-[20px]"></div>
          </div>
        </div>

        {/* Cầu thủ đội nhà */}
        {activeHomePlayers.map((player) => {
          const pos = positions[player.id] || { x: 250, y: 250 }
          return (
            <PlayerMarker
              key={player.id}
              player={player}
              position={pos}
              onMouseDown={(e) => handleMouseDown(e, player.id)}
              isDraggable={canDragPlayers}
            />
          )
        })}

        {/* Cầu thủ đội khách */}
        {activeAwayPlayers.map((player) => {
          const pos = positions[player.id] || { x: 250, y: 250 }
          return (
            <PlayerMarker
              key={player.id}
              player={player}
              position={pos}
              onMouseDown={(e) => handleMouseDown(e, player.id)}
              isDraggable={canDragPlayers}
            />
          )
        })}

        {/* Chỉ báo người dùng */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center z-30">
          <span className="mr-1">👤</span> Chọn đội
        </div>
      </div>

      {/* Công cụ vẽ */}
      {drawingMode !== "none" && (
        <DrawingTools
          mode={drawingMode}
          onClear={clearDrawing}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          strokeColor={strokeColor}
          onStrokeColorChange={setStrokeColor}
        />
      )}

      {/* Nút xuất PNG */}
      <div className="mt-4 flex justify-end">
        <button
          id="export-button"
          onClick={exportAsPNG}
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Lưu dưới dạng PNG
        </button>
      </div>
    </div>
  )
}
