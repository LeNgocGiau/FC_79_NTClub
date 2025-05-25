"use client"

import React, { useEffect, useState, useRef } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'trail' | 'click' | 'sparkle' | 'rainbow-line' | 'comet' | 'lightning'
}

interface TrailPoint {
  x: number
  y: number
  timestamp: number
  color: string
}

interface CursorEffectsProps {
  effectTypes?: string[]  // Changed to array for multiple effects
  intensity?: 'low' | 'medium' | 'high'
  colors?: string[]
  customColors?: string[]  // Additional custom colors
}

export default function CursorEffects({
  effectTypes = ['rainbow'],
  intensity = 'medium',
  colors = ['#ff0000', '#ff4500', '#ffa500', '#ffff00', '#00ff00', '#0080ff', '#8000ff'],
  customColors = []
}: CursorEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const trailPointsRef = useRef<TrailPoint[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [prevMousePos, setPrevMousePos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const animationRef = useRef<number>()
  const particleIdRef = useRef(0)

  // Intensity settings
  const intensitySettings = {
    low: { particleCount: 3, trailLength: 10, glowSize: 20 },
    medium: { particleCount: 5, trailLength: 15, glowSize: 30 },
    high: { particleCount: 8, trailLength: 25, glowSize: 40 }
  }

  const settings = intensitySettings[intensity]

  // Mix colors from multiple palettes
  const getAllColors = () => {
    const allColors = [...colors, ...customColors]
    return allColors.length > 0 ? allColors : ['#ff0000', '#ff4500', '#ffa500', '#ffff00', '#00ff00', '#0080ff', '#8000ff']
  }

  // Check if effect is enabled
  const isEffectEnabled = (effect: string) => {
    return effectTypes.includes('all') || effectTypes.includes(effect)
  }

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPrevMousePos(mousePos)
      setMousePos({ x: e.clientX, y: e.clientY })

      // Create continuous rainbow trail
      if (isEffectEnabled('rainbow')) {
        createContinuousRainbowTrail(e.clientX, e.clientY)
      }

      // Create trail particles
      if (isEffectEnabled('trail')) {
        createTrailParticles(e.clientX, e.clientY)
      }

      // Create sparkle particles
      if (isEffectEnabled('sparkles')) {
        if (Math.random() < 0.3) {
          createSparkleParticles(e.clientX, e.clientY)
        }
      }

      // Create bubble particles
      if (isEffectEnabled('bubbles')) {
        if (Math.random() < 0.2) {
          createBubbleParticles(e.clientX, e.clientY)
        }
      }

      // Create comet effect
      if (isEffectEnabled('comet')) {
        createCometTrail(e.clientX, e.clientY)
      }

      // Create lightning effect
      if (isEffectEnabled('lightning')) {
        if (Math.random() < 0.1) {
          createLightningEffect(e.clientX, e.clientY)
        }
      }
    }

    const handleMouseDown = () => {
      setIsClicking(true)
    }

    const handleMouseUp = () => {
      setIsClicking(false)
    }

    const handleClick = (e: MouseEvent) => {
      if (isEffectEnabled('fireworks')) {
        createFireworkParticles(e.clientX, e.clientY)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('click', handleClick)
    }
  }, [effectTypes])

  // Create trail particles
  const createTrailParticles = (x: number, y: number) => {
    const newParticles: Particle[] = []
    const allColors = getAllColors()

    for (let i = 0; i < settings.particleCount; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: settings.trailLength,
        maxLife: settings.trailLength,
        color: allColors[Math.floor(Math.random() * allColors.length)],
        size: Math.random() * 4 + 2,
        type: 'trail'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Create sparkle particles
  const createSparkleParticles = (x: number, y: number) => {
    const newParticles: Particle[] = []

    for (let i = 0; i < 2; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 30,
        maxLife: 30,
        color: '#ffffff',
        size: Math.random() * 3 + 1,
        type: 'sparkle'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Create firework particles
  const createFireworkParticles = (x: number, y: number) => {
    const newParticles: Particle[] = []
    const particleCount = 15

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = Math.random() * 5 + 3

      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        maxLife: 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        type: 'click'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Create rainbow trail
  const createRainbowTrail = (x: number, y: number) => {
    const rainbowColors = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff', '#ff00ff']
    const newParticles: Particle[] = []

    for (let i = 0; i < 3; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 20,
        maxLife: 20,
        color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
        size: Math.random() * 3 + 2,
        type: 'trail'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Create bubble particles
  const createBubbleParticles = (x: number, y: number) => {
    const newParticles: Particle[] = []

    for (let i = 0; i < 2; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 2 - 1, // Float upward
        life: 80,
        maxLife: 80,
        color: 'rgba(255, 255, 255, 0.6)',
        size: Math.random() * 6 + 4,
        type: 'trail'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Create continuous rainbow trail (like in the image)
  const createContinuousRainbowTrail = (x: number, y: number) => {
    const now = Date.now()
    const allColors = getAllColors()

    // Add current position to trail
    trailPointsRef.current.push({
      x,
      y,
      timestamp: now,
      color: allColors[Math.floor((now / 50) % allColors.length)] // Faster color cycling
    })

    // Keep trail longer (3 seconds) and limit points for performance
    trailPointsRef.current = trailPointsRef.current.filter(point => now - point.timestamp < 3000)

    // Limit trail points to prevent memory issues
    if (trailPointsRef.current.length > 500) {
      trailPointsRef.current = trailPointsRef.current.slice(-500)
    }
  }

  // Create comet effect
  const createCometTrail = (x: number, y: number) => {
    const newParticles: Particle[] = []
    const cometColors = colors.length > 0 ? colors : ['#ffffff', '#ffff00', '#ffa500', '#ff4500']

    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x - i * 3,
        y: y - i * 2,
        vx: -i * 0.5,
        vy: -i * 0.3,
        life: 30 - i * 3,
        maxLife: 30 - i * 3,
        color: cometColors[i % cometColors.length],
        size: Math.max(1, 6 - i),
        type: 'comet'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Create lightning effect
  const createLightningEffect = (x: number, y: number) => {
    const newParticles: Particle[] = []
    const lightningColors = ['#ffffff', '#e0e0ff', '#c0c0ff', '#a0a0ff']

    // Create zigzag lightning pattern
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 50 + 20

      newParticles.push({
        id: particleIdRef.current++,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 15,
        maxLife: 15,
        color: lightningColors[Math.floor(Math.random() * lightningColors.length)],
        size: Math.random() * 2 + 1,
        type: 'lightning'
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw continuous rainbow trail
      if (isEffectEnabled('rainbow') && trailPointsRef.current.length > 1) {
        ctx.save()
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Draw connected line segments with different colors
        for (let i = 1; i < trailPointsRef.current.length; i++) {
          const prevPoint = trailPointsRef.current[i - 1]
          const currentPoint = trailPointsRef.current[i]
          const age = Date.now() - currentPoint.timestamp
          const alpha = Math.max(0.1, 1 - (age / 3000)) // Slower fade, minimum alpha 0.1

          if (alpha > 0) {
            ctx.globalAlpha = alpha
            ctx.strokeStyle = currentPoint.color
            ctx.beginPath()
            ctx.moveTo(prevPoint.x, prevPoint.y)
            ctx.lineTo(currentPoint.x, currentPoint.y)
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      // Draw glow effect
      if (isEffectEnabled('glow')) {
        const gradient = ctx.createRadialGradient(
          mousePos.x, mousePos.y, 0,
          mousePos.x, mousePos.y, settings.glowSize
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
        gradient.addColorStop(0.5, 'rgba(74, 144, 226, 0.2)')
        gradient.addColorStop(1, 'rgba(74, 144, 226, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(
          mousePos.x - settings.glowSize,
          mousePos.y - settings.glowSize,
          settings.glowSize * 2,
          settings.glowSize * 2
        )
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          vy: particle.type === 'click' ? particle.vy + 0.1 : particle.vy // Gravity for fireworks
        }))
        .filter(particle => particle.life > 0)

      // Draw particles
      particlesRef.current.forEach(particle => {
        const alpha = particle.life / particle.maxLife

        if (particle.type === 'sparkle') {
          // Draw sparkle as a star
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5
            const x = Math.cos(angle) * particle.size
            const y = Math.sin(angle) * particle.size
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        } else if (particle.color.includes('rgba') && particle.size > 5) {
          // Draw bubble particles
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.strokeStyle = particle.color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.stroke()

          // Add bubble highlight
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
          ctx.beginPath()
          ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else {
          // Draw regular particles
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePos, effectTypes, settings, colors, customColors])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Custom cursor */}
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-100"
        style={{
          left: mousePos.x - 10,
          top: mousePos.y - 10,
          transform: isClicking ? 'scale(1.5)' : 'scale(1)',
        }}
      >
        {isEffectEnabled('glow') ? (
          <div className="w-5 h-5 rounded-full bg-white opacity-80 shadow-lg animate-pulse" />
        ) : null}
      </div>
    </>
  )
}
