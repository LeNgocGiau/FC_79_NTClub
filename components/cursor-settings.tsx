"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Palette, Sparkles, Zap, Settings } from 'lucide-react'

interface CursorSettingsProps {
  effectTypes: string[]
  intensity: string
  colors: string[]
  customColors: string[]
  onEffectTypesChange: (effects: string[]) => void
  onIntensityChange: (intensity: string) => void
  onColorsChange: (colors: string[]) => void
  onCustomColorsChange: (colors: string[]) => void
  onToggle: (enabled: boolean) => void
  enabled: boolean
}

const effectOptions = [
  { value: 'all', label: 'Tất cả hiệu ứng', icon: '✨', description: 'Kết hợp tất cả hiệu ứng' },
  { value: 'rainbow', label: 'Dải cầu vồng liên tục', icon: '🌈', description: 'Đường thẳng cầu vồng không đứt đoạn' },
  { value: 'trail', label: 'Vệt màu', icon: '🎨', description: 'Để lại vệt màu khi di chuyển' },
  { value: 'glow', label: 'Phát sáng', icon: '💫', description: 'Hiệu ứng phát sáng xung quanh chuột' },
  { value: 'sparkles', label: 'Tia sáng', icon: '⭐', description: 'Các tia sáng nhỏ bay xung quanh' },
  { value: 'fireworks', label: 'Pháo hoa', icon: '🎆', description: 'Bắn pháo hoa khi click chuột' },
  { value: 'comet', label: 'Sao băng', icon: '☄️', description: 'Hiệu ứng sao băng theo chuột' },
  { value: 'lightning', label: 'Tia chớp', icon: '⚡', description: 'Hiệu ứng tia chớp ngẫu nhiên' },
  { value: 'bubbles', label: 'Bong bóng', icon: '🫧', description: 'Hiệu ứng bong bóng bay' }
]

const intensityOptions = [
  { value: 'low', label: 'Nhẹ', description: 'Hiệu ứng nhẹ nhàng' },
  { value: 'medium', label: 'Vừa', description: 'Hiệu ứng cân bằng' },
  { value: 'high', label: 'Mạnh', description: 'Hiệu ứng mạnh mẽ' }
]

const colorPresets = [
  {
    name: 'Cầu vồng cổ điển',
    colors: ['#ff0000', '#ff4500', '#ffa500', '#ffff00', '#00ff00', '#0080ff', '#8000ff']
  },
  {
    name: 'Neon siêu sáng',
    colors: ['#ff0040', '#ff4000', '#ff8000', '#ffff00', '#40ff00', '#0080ff', '#8040ff']
  },
  {
    name: 'Lửa rực rỡ',
    colors: ['#8b0000', '#dc143c', '#ff4500', '#ff6347', '#ff8c00', '#ffa500', '#ffff00']
  },
  {
    name: 'Xanh dương đậm',
    colors: ['#000080', '#0000cd', '#0040ff', '#0080ff', '#00bfff', '#40e0d0', '#00ffff']
  },
  {
    name: 'Tím huyền bí',
    colors: ['#4b0082', '#6a0dad', '#8a2be2', '#9932cc', '#ba55d3', '#da70d6', '#ee82ee']
  },
  {
    name: 'Đỏ máu',
    colors: ['#800000', '#8b0000', '#a52a2a', '#dc143c', '#ff0000', '#ff4500', '#ff6347']
  },
  {
    name: 'Xanh lá rừng',
    colors: ['#006400', '#228b22', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#98fb98']
  },
  {
    name: 'Cam rực lửa',
    colors: ['#cc4400', '#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffee00']
  },
  {
    name: 'Hồng neon',
    colors: ['#c71585', '#ff1493', '#ff69b4', '#ff6eb4', '#ff91a4', '#ffb6c1', '#ffc0cb']
  },
  {
    name: 'Vàng kim',
    colors: ['#b8860b', '#daa520', '#ffd700', '#ffff00', '#ffff33', '#ffff66', '#ffff99']
  },
  {
    name: 'Đen trắng tương phản',
    colors: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff', '#f0f0f0']
  },
  {
    name: 'Cyberpunk',
    colors: ['#ff0080', '#ff0040', '#ff4000', '#ff8000', '#00ff80', '#0080ff', '#8000ff']
  }
]

export default function CursorSettings({
  effectTypes,
  intensity,
  colors,
  customColors,
  onEffectTypesChange,
  onIntensityChange,
  onColorsChange,
  onCustomColorsChange,
  onToggle,
  enabled
}: CursorSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentIntensity = intensityOptions.find(opt => opt.value === intensity)

  // Handle effect toggle
  const toggleEffect = (effectValue: string) => {
    if (effectValue === 'all') {
      onEffectTypesChange(['all'])
    } else {
      const newEffects = effectTypes.includes(effectValue)
        ? effectTypes.filter(e => e !== effectValue && e !== 'all')
        : [...effectTypes.filter(e => e !== 'all'), effectValue]
      onEffectTypesChange(newEffects.length > 0 ? newEffects : ['rainbow'])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 left-4 z-40 bg-white/90 backdrop-blur-sm hover:bg-white/95 border-2 border-blue-200 hover:border-blue-300 shadow-lg"
        >
          <Settings className="h-4 w-4 mr-2" />
          Hiệu ứng chuột
          {enabled && (
            <Badge className="ml-2 bg-green-500 text-white text-xs">
              ON
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-blue-500" />
            Cài đặt hiệu ứng con trỏ chuột
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toggle hiệu ứng */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">Bật/Tắt hiệu ứng</h3>
              <p className="text-sm text-gray-600">Kích hoạt hiệu ứng con trỏ chuột</p>
            </div>
            <Button
              onClick={() => onToggle(!enabled)}
              variant={enabled ? "default" : "outline"}
              className={enabled ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {enabled ? "Đang bật" : "Đang tắt"}
            </Button>
          </div>

          {enabled && (
            <>
              {/* Chọn loại hiệu ứng */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Loại hiệu ứng
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {effectOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        effectTypes.includes(option.value) || (option.value !== 'all' && effectTypes.includes('all'))
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleEffect(option.value)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                        {(effectTypes.includes(option.value) || (option.value !== 'all' && effectTypes.includes('all'))) && (
                          <Badge className="bg-blue-500">
                            {effectTypes.includes('all') && option.value !== 'all' ? 'Tự động' : 'Đã chọn'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 italic mt-2">
                  💡 Có thể chọn nhiều hiệu ứng cùng lúc. Click để bật/tắt từng hiệu ứng.
                </div>
              </div>

              {/* Cường độ hiệu ứng */}
              <div className="space-y-3">
                <h3 className="font-semibold">Cường độ hiệu ứng</h3>
                <Select value={intensity} onValueChange={onIntensityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn cường độ" />
                  </SelectTrigger>
                  <SelectContent>
                    {intensityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-sm text-gray-600">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bảng màu */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Bảng màu (Tối ưu cho nền trắng)
                </h3>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {colorPresets.map((preset) => (
                    <div
                      key={preset.name}
                      className={`p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        JSON.stringify(colors) === JSON.stringify(preset.colors)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => onColorsChange(preset.colors)}
                    >
                      <div className="font-medium mb-1 text-xs">{preset.name}</div>
                      <div className="flex gap-0.5 flex-wrap">
                        {preset.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 italic">
                  💡 Các bảng màu được tối ưu để nổi bật trên nền trắng
                </div>
              </div>

              {/* Custom Colors */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Màu tùy chỉnh (Trộn với bảng màu chính)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {customColors.map((color, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          const newColors = customColors.filter((_, i) => i !== index)
                          onCustomColorsChange(newColors)
                        }}
                      />
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </div>
                    </div>
                  ))}
                  <input
                    type="color"
                    className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                    onChange={(e) => {
                      if (!customColors.includes(e.target.value)) {
                        onCustomColorsChange([...customColors, e.target.value])
                      }
                    }}
                    title="Thêm màu tùy chỉnh"
                  />
                </div>
                <div className="text-xs text-gray-500 italic">
                  🎨 Click vào ô màu để thêm màu tùy chỉnh. Các màu này sẽ được trộn với bảng màu chính.
                </div>
              </div>

              {/* Preview hiệu ứng hiện tại */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-2">Hiệu ứng hiện tại</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {effectTypes.map(effectType => {
                      const effect = effectOptions.find(opt => opt.value === effectType)
                      return effect ? (
                        <div key={effectType} className="flex items-center gap-1">
                          <span className="text-sm">{effect.icon}</span>
                          <span className="text-xs font-medium">{effect.label}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{currentIntensity?.label}</Badge>
                    <div className="flex gap-1">
                      {colors.slice(0, 5).map((color, index) => (
                        <div
                          key={index}
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {customColors.length > 0 && (
                        <>
                          <span className="text-xs text-gray-500 mx-1">+</span>
                          {customColors.slice(0, 3).map((color, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
