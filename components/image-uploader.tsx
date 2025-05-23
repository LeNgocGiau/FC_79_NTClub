"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void
  buttonText?: string
}

export default function ImageUploader({ onImageUploaded, buttonText = "Tải ảnh lên" }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  })
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)

      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
        setIsDialogOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = useCallback((crop: Crop) => {
    setCrop(crop)
  }, [])

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    imageRef.current = img
    // Thiết lập crop ban đầu để tạo hình vuông ở giữa
    const minSize = Math.min(img.width, img.height)
    const x = (img.width - minSize) / 2
    const y = (img.height - minSize) / 2
    setCrop({
      unit: "px",
      width: minSize,
      height: minSize,
      x,
      y,
    })
  }, [])

  const getCroppedImage = useCallback(() => {
    if (!imageRef.current || !crop.width || !crop.height) return

    const image = imageRef.current
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Thiết lập kích thước canvas cho ảnh đã cắt
    canvas.width = crop.width
    canvas.height = crop.height

    // Vẽ ảnh đã cắt lên canvas
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    )

    // Chuyển canvas thành URL
    const croppedImageUrl = canvas.toDataURL("image/jpeg")
    onImageUploaded(croppedImageUrl)
    setIsDialogOpen(false)
  }, [crop, onImageUploaded])

  const handleZoomChange = (values: number[]) => {
    setZoom(values[0])
  }

  const handleRotationChange = (values: number[]) => {
    setRotation(values[0])
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById("image-upload")?.click()}
        className="w-full"
      >
        {buttonText}
      </Button>
      <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cắt ảnh</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="overflow-auto max-h-[60vh] flex justify-center">
              {previewUrl && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  circularCrop
                >
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    onLoad={(e) => handleImageLoad(e.currentTarget)}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      maxHeight: "60vh",
                      transition: "transform 0.3s",
                    }}
                  />
                </ReactCrop>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phóng to/Thu nhỏ</label>
                <Slider value={[zoom]} min={0.5} max={3} step={0.1} onValueChange={handleZoomChange} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Xoay ảnh</label>
                <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={handleRotationChange} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={getCroppedImage}>Áp dụng</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
