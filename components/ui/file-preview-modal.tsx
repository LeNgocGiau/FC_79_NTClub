"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, FileText, Image as ImageIcon, Download, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, RotateCcw, Settings, Maximize, Minimize, FastForward, Rewind } from 'lucide-react'


interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  fileType: 'image' | 'document' | 'audio' | 'video'
  preview?: string
  content?: string
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  fileType,
  preview,
  content
}: FilePreviewModalProps) {
  const [previewContent, setPreviewContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [pdfCanvases, setPdfCanvases] = useState<string[]>([])
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Video player states
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen && file && isClient) {
      loadFileContent()
    }
  }, [isOpen, file?.name, isClient])

  // Reset current page when totalPages changes
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Add scroll listener for better page tracking
  useEffect(() => {
    if (!isOpen || totalPages <= 1) return

    const container = document.querySelector('.h-full.overflow-y-auto.overflow-x-hidden') as HTMLElement
    if (!container) return

    // Force a scroll check after content loads
    const checkInitialPage = () => {
      const pageElements = container.querySelectorAll('.page-container, section.docx, img[alt*="Trang"]')
      if (pageElements && pageElements.length > 0) {
        console.log('Initial page check: found', pageElements.length, 'page elements')
        // Trigger a manual scroll event to set initial page
        const scrollEvent = new Event('scroll', { bubbles: true })
        container.dispatchEvent(scrollEvent)
      }
    }

    // Check after a short delay to ensure content is rendered
    const timeoutId = setTimeout(checkInitialPage, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isOpen, totalPages, pdfCanvases.length, htmlContent.length])

  // Keyboard zoom for all file types
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if ((e.ctrlKey || e.metaKey)) {
        if (fileType === 'image') {
          // Image keyboard shortcuts
          if (e.key === '=' || e.key === '+') {
            e.preventDefault()
            handleImageZoom(0.25)
          } else if (e.key === '-') {
            e.preventDefault()
            handleImageZoom(-0.25)
          } else if (e.key === '0') {
            e.preventDefault()
            resetImageView()
          } else if (e.key === '1') {
            e.preventDefault()
            setImageZoom(1)
          }
        } else if (fileType === 'audio') {
          // Audio keyboard shortcuts
          if (e.key === ' ') {
            e.preventDefault()
            togglePlayPause()
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            skipTime(-10)
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            skipTime(10)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            handleVolumeChange(Math.min(1, volume + 0.1))
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            handleVolumeChange(Math.max(0, volume - 0.1))
          } else if (e.key === 'm' || e.key === 'M') {
            e.preventDefault()
            toggleMute()
          }
        } else if (fileType === 'video') {
          // Video keyboard shortcuts
          if (e.key === ' ') {
            e.preventDefault()
            toggleVideoPlayPause()
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            skipVideoTime(-10)
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            skipVideoTime(10)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            handleVideoVolumeChange(Math.min(1, volume + 0.1))
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            handleVideoVolumeChange(Math.max(0, volume - 0.1))
          } else if (e.key === 'm' || e.key === 'M') {
            e.preventDefault()
            toggleVideoMute()
          } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            toggleVideoFullscreen()
          }
        } else if (file?.type.includes('pdf') || file?.type.includes('word') || file?.type.includes('document') || file?.type === 'text/plain') {
          // Document keyboard shortcuts
          if (e.key === '=' || e.key === '+') {
            e.preventDefault()
            handleZoom(0.2)
          } else if (e.key === '-') {
            e.preventDefault()
            handleZoom(-0.2)
          } else if (e.key === '0') {
            e.preventDefault()
            setZoomLevel(1)
          }
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, file?.type || '', fileType, zoomLevel, imageZoom])

  const loadFileContent = async () => {
    if (!file) return

    setIsLoading(true)
    setError('')
    setPreviewContent('')
    setPdfCanvases([])
    setHtmlContent('')
    setCurrentPage(1)
    setTotalPages(0)
    setZoomLevel(1)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })

    // Reset audio/video player states
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setPlaybackRate(1)
    setVolume(1)
    setIsMuted(false)
    setIsVideoFullscreen(false)

    try {
      if (fileType === 'image') {
        // For images, use the preview URL directly
        setPreviewContent(preview || '')
      } else if (fileType === 'audio' || fileType === 'video') {
        // For audio/video files, create object URL
        const objectUrl = URL.createObjectURL(file)
        setPreviewContent(objectUrl)
      } else if (file.type === 'text/plain' || file.type === 'text/csv') {
        // For text files, read directly with original formatting
        const text = await readTextFile(file)
        setPreviewContent(text)
      } else if (file.type === 'application/pdf') {
        // For PDF files, render as visual pages
        await loadPdfContentAsImages(file)
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // For Word documents, convert to HTML with formatting
        await loadWordContentAsImages(file)
      } else {
        // Fallback to existing content
        setPreviewContent(content || 'Không thể xem trước loại file này.')
      }
    } catch (err) {
      setError(`Lỗi khi tải nội dung file: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Không thể đọc file text'))
      reader.readAsText(file, 'utf-8')
    })
  }

  const loadPdfContentAsImages = async (file: File) => {
    try {
      // Dynamic import PDF.js only when needed
      const pdfjsLib = await import('pdfjs-dist')

      // Use worker from public folder
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js'

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const canvases: string[] = []

      // Render first 5 pages to avoid performance issues
      const maxPages = Math.min(pdf.numPages, 5)

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum)

        // Set up canvas for rendering
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('Cannot get canvas context')
        }

        canvas.height = viewport.height
        canvas.width = viewport.width

        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png')
        canvases.push(dataUrl)
      }

      setPdfCanvases(canvases)
      setTotalPages(canvases.length)

      if (pdf.numPages > 5) {
        setPreviewContent(`Tải ${maxPages} trang đầu tiên. Tổng cộng ${pdf.numPages} trang.`)
      } else {
        setPreviewContent(`Tải tất cả ${pdf.numPages} trang.`)
      }
    } catch (err) {
      throw new Error(`Không thể đọc PDF: ${err}`)
    }
  }

  const loadWordContentAsImages = async (file: File) => {
    try {
      // Method 1: Try to render Word document as images for 100% fidelity
      // This approach converts each page to an image like PDF

      const docxPreview = await import('docx-preview')
      const html2canvas = await import('html2canvas')

      const arrayBuffer = await file.arrayBuffer()

      // Create a hidden container for rendering with enhanced styling
      const hiddenContainer = document.createElement('div')
      if (!hiddenContainer) {
        throw new Error('Failed to create hidden container')
      }

      hiddenContainer.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 8.5in;
        background: white;
        font-family: 'Times New Roman', 'Calibri', serif;
        visibility: hidden;
        pointer-events: none;
        zoom: 1;
      `

      // Add comprehensive CSS for better rendering
      const styleSheet = document.createElement('style')
      styleSheet.textContent = `
        .docx-image-render * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        .docx-image-render section.docx {
          background: white !important;
          width: 8.5in !important;
          min-height: 11in !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          page-break-after: always !important;
          position: relative !important;
          overflow: visible !important;
        }

        .docx-image-render .docx-wrapper {
          width: 100% !important;
          height: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .docx-image-render table {
          border-collapse: collapse !important;
          width: 100% !important;
        }

        .docx-image-render td, .docx-image-render th {
          border: 1px solid #000 !important;
          padding: 4px !important;
        }

        .docx-image-render img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }

        .docx-image-render p {
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.15 !important;
        }

        .docx-image-render div {
          position: relative !important;
        }
      `
      hiddenContainer.appendChild(styleSheet)
      document.body.appendChild(hiddenContainer)

      try {
        // Render document with maximum fidelity settings
        await docxPreview.renderAsync(arrayBuffer, hiddenContainer, undefined, {
          className: "docx-image-render",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: true, // Enable experimental features for better rendering
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          renderChanges: false,
          renderComments: false,
          debug: false
        })

        // Find all page sections with comprehensive error handling
        let pages: NodeListOf<Element> | null = null
        try {
          if (hiddenContainer && typeof hiddenContainer.querySelectorAll === 'function') {
            pages = hiddenContainer.querySelectorAll('section.docx')
          }
        } catch (queryError) {
          console.warn('Failed to query page sections:', queryError)
          pages = null
        }

        const pageImages: string[] = []

        if (pages && pages.length > 0) {
          // Convert each page to image
          for (let i = 0; i < Math.min(pages.length, 10); i++) { // Limit to 10 pages for performance
            const page = pages[i] as HTMLElement

            // Style the page for maximum fidelity rendering
            page.style.cssText += `
              background: white;
              width: 8.5in;
              min-height: 11in;
              padding: 0;
              margin: 0;
              box-sizing: border-box;
              font-family: 'Times New Roman', 'Calibri', serif;
              position: relative;
              display: block;
              overflow: visible;
              border: none;
              outline: none;
            `

            // Ensure all child elements are visible and properly styled
            let allElements: NodeListOf<Element> | null = null
            try {
              if (page && typeof page.querySelectorAll === 'function') {
                allElements = page.querySelectorAll('*')
              }
            } catch (queryError) {
              console.warn('Failed to query child elements:', queryError)
              allElements = null
            }

            if (allElements) {
              allElements.forEach(el => {
                const element = el as HTMLElement
                if (element && element.style) {
                  element.style.visibility = 'visible'
                  element.style.opacity = '1'
                  element.style.display = element.style.display || 'block'
                }
              })
            }

            try {
              // Wait for fonts and images to load
              await new Promise(resolve => setTimeout(resolve, 500))

              // Convert page to canvas with maximum quality settings
              const canvas = await html2canvas.default(page, {
                scale: 3, // Very high DPI for maximum quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: page.offsetWidth || 816, // 8.5in at 96dpi
                height: page.offsetHeight || 1056, // 11in at 96dpi
                scrollX: 0,
                scrollY: 0,
                logging: false,
                removeContainer: false,
                foreignObjectRendering: true,
                imageTimeout: 5000,
                onclone: (clonedDoc) => {
                  // Ensure all styles are preserved in the clone
                  if (clonedDoc && typeof clonedDoc.querySelector === 'function') {
                    try {
                      const clonedPage = clonedDoc.querySelector('section.docx') as HTMLElement
                      if (clonedPage && clonedPage.style) {
                        clonedPage.style.cssText += `
                          background: white !important;
                          width: 8.5in !important;
                          min-height: 11in !important;
                          font-family: 'Times New Roman', 'Calibri', serif !important;
                        `
                      }
                    } catch (queryError) {
                      console.warn('Failed to query cloned document:', queryError)
                    }
                  }
                }
              })

              // Convert canvas to data URL
              const imageData = canvas.toDataURL('image/png', 0.95)
              pageImages.push(imageData)
            } catch (canvasErr) {
              console.warn(`Failed to render page ${i + 1} as image:`, canvasErr)
            }
          }
        }

        // Clean up hidden container
        document.body.removeChild(hiddenContainer)

        if (pageImages.length > 0) {
          // Use images like PDF
          setPdfCanvases(pageImages)
          setTotalPages(pageImages.length)
          setPreviewContent(`Word document - ${pageImages.length} trang - Rendered as images`)
          return
        } else {
          // Debug: Log the rendered HTML to see what's missing
          console.log('No images generated. Rendered HTML:', hiddenContainer.innerHTML)
        }

      } catch (renderErr) {
        console.warn('Failed to render as images, falling back to HTML:', renderErr)
        if (document.body.contains(hiddenContainer)) {
          document.body.removeChild(hiddenContainer)
        }
      }

      // Try alternative approach: iframe-based rendering for complex layouts
      try {
        console.log('Trying iframe-based rendering for better fidelity...')

        const iframe = document.createElement('iframe')
        iframe.style.cssText = `
          position: absolute;
          top: -10000px;
          left: -10000px;
          width: 8.5in;
          height: 11in;
          border: none;
          visibility: hidden;
        `
        document.body.appendChild(iframe)

        // Render in iframe for better isolation
        const iframeContainer = document.createElement('div')
        if (!iframeContainer) {
          throw new Error('Failed to create iframe container')
        }

        try {
          await docxPreview.renderAsync(arrayBuffer, iframeContainer, undefined, {
            className: "docx-iframe-render",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
            debug: false
          })
        } catch (renderError) {
          console.warn('Failed to render DOCX in iframe container:', renderError)
          document.body.removeChild(iframe)
          throw renderError
        }

        if (iframe.contentDocument && iframeContainer) {
          iframe.contentDocument.body.innerHTML = `
            <style>
              body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
              section.docx {
                width: 8.5in;
                min-height: 11in;
                background: white;
                margin: 0;
                padding: 1in;
                box-sizing: border-box;
              }
            </style>
            ${iframeContainer.innerHTML || ''}
          `

          // Wait for iframe to load
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Add comprehensive null checks for iframe.contentDocument
          if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) {
            console.warn('iframe or iframe.contentDocument is null, skipping iframe rendering')
            if (iframe && document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            throw new Error('iframe.contentDocument is null or invalid')
          }

          let iframePages: NodeListOf<Element> | null = null
          try {
            iframePages = iframe.contentDocument.querySelectorAll('section.docx')
          } catch (queryError) {
            console.warn('Failed to query iframe content:', queryError)
            document.body.removeChild(iframe)
            throw new Error('Failed to query iframe content')
          }

          const iframeImages: string[] = []

          if (iframePages && iframePages.length > 0) {
            for (let i = 0; i < Math.min(iframePages.length, 5); i++) {
              const page = iframePages[i] as HTMLElement
              try {
                const canvas = await html2canvas.default(page, {
                  scale: 2,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: '#ffffff',
                  width: 816,
                  height: 1056
                })

                const imageData = canvas.toDataURL('image/png', 0.9)
                iframeImages.push(imageData)
              } catch (err) {
                console.warn(`Failed to render iframe page ${i + 1}:`, err)
              }
            }
          }

          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }

          if (iframeImages.length > 0) {
            setPdfCanvases(iframeImages)
            setTotalPages(iframeImages.length)
            setPreviewContent(`Word document - ${iframeImages.length} trang - Iframe rendered`)
            return
          }
        }

        if (iframe && document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }

      } catch (iframeErr) {
        console.warn('Iframe rendering also failed:', iframeErr)
      }

      // Fallback: Enhanced HTML rendering
      const container = document.createElement('div')
      if (!container) {
        throw new Error('Failed to create container for HTML rendering')
      }

      try {
        await docxPreview.renderAsync(arrayBuffer, container, undefined, {
          className: "docx-preview-container",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          debug: false
        })
      } catch (renderError) {
        console.warn('Failed to render DOCX in HTML container:', renderError)
        throw renderError
      }

      const renderedHtml = container.innerHTML
      const finalHtml = `
        <div style="
          background: #f0f0f0;
          padding: 20px;
          min-height: 100vh;
          font-family: 'Calibri', 'Times New Roman', serif;
        ">
          ${renderedHtml}
        </div>
        <style>
          .docx-preview-container {
            max-width: none !important;
            margin: 0 auto;
          }

          .docx-preview-container .docx {
            background: white;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            border: 1px solid #e0e0e0;
            margin: 0 auto 20px auto;
            max-width: 8.5in;
            font-family: 'Calibri', 'Times New Roman', serif !important;
          }

          .docx-preview-container .docx * {
            font-family: 'Calibri', 'Times New Roman', serif !important;
          }

          .docx-preview-container section.docx {
            margin-bottom: 20px;
          }
        </style>
      `

      setHtmlContent(finalHtml)

      let pageCount = 0
      try {
        if (container && typeof container.querySelectorAll === 'function') {
          const sections = container.querySelectorAll('section.docx')
          pageCount = sections ? sections.length : 0
        }
      } catch (queryError) {
        console.warn('Failed to count pages in final HTML:', queryError)
        pageCount = 0
      }

      setTotalPages(pageCount)
      setPreviewContent(`Word document - ${pageCount} trang - Enhanced HTML`)

    } catch (err) {
      console.error('Error with Word rendering, falling back to mammoth:', err)

      // Final fallback to mammoth
      try {
        const mammothLib = await import('mammoth')
        const mammoth = mammothLib.default || mammothLib
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })

        const fallbackHtml = `
          <div style="
            background: #f0f0f0;
            padding: 20px;
            min-height: 100vh;
          ">
            <div style="
              background: white;
              width: 8.5in;
              min-height: 11in;
              margin: 0 auto;
              padding: 1in;
              box-shadow: 0 8px 24px rgba(0,0,0,0.12);
              border: 1px solid #e0e0e0;
              font-family: 'Calibri', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.15;
              color: #000000;
            ">
              ${result.value}
            </div>
          </div>
        `

        setHtmlContent(fallbackHtml)
        setPreviewContent(`Word document - Fallback mode`)
      } catch (fallbackErr) {
        throw new Error(`Không thể đọc Word document: ${fallbackErr}`)
      }
    }
  }

  const downloadFile = () => {
    if (!file) return

    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  // Zoom functions for documents
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta))
    setZoomLevel(newZoom)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      handleZoom(delta)
    }
  }

  // Image zoom functions
  const handleImageZoom = (delta: number) => {
    const newZoom = Math.max(0.25, Math.min(5, imageZoom + delta))
    setImageZoom(newZoom)

    // Reset position when zooming out to fit
    if (newZoom <= 1) {
      setImagePosition({ x: 0, y: 0 })
    }
  }

  const handleImageWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.2 : 0.2
      handleImageZoom(delta)
    }
  }

  // Image dragging functions
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (imageZoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      })
      e.preventDefault()
    }
  }

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleImageMouseUp = () => {
    setIsDragging(false)
  }

  const resetImageView = () => {
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  // Audio player functions
  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    handleSeek(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Video player functions (reuse audio functions for video)
  const toggleVideoPlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleVideoSeek = (newTime: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVideoVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleVideoMute = () => {
    if (!videoRef.current) return

    if (isMuted) {
      videoRef.current.volume = volume
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const changeVideoPlaybackRate = (rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const skipVideoTime = (seconds: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    handleVideoSeek(newTime)
  }

  const toggleVideoFullscreen = () => {
    if (!videoRef.current) return

    if (!isVideoFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
      setIsVideoFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsVideoFullscreen(false)
    }
  }

  // Throttle scroll events for better performance
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track scroll position to update current page
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Throttle scroll events for better performance
    scrollTimeoutRef.current = setTimeout(() => {
      // Debug logging
      console.log('Scroll event - totalPages:', totalPages, 'currentPage:', currentPage)

      if (totalPages <= 1) return

      const container = e.currentTarget

      // Find all page elements with comprehensive selectors
      let pageElements: NodeListOf<Element> | null = null
      try {
        if (container && typeof container.querySelectorAll === 'function') {
          // Try multiple selectors to find page elements
          pageElements = container.querySelectorAll('.page-container, section.docx, .docx-page, [data-page], .page')

          // If no elements found, try looking deeper in the DOM
          if (!pageElements || pageElements.length === 0) {
            pageElements = container.querySelectorAll('img[alt*="Trang"], div[class*="page"], section')
          }
        }
      } catch (queryError) {
        console.warn('Failed to query page elements in scroll handler:', queryError)
        return
      }

      console.log('Found page elements:', pageElements ? pageElements.length : 0)

      if (!pageElements || pageElements.length === 0) {
        console.log('No page elements found, trying alternative approach...')

        // Alternative approach: use images as page indicators for PDF/Word
        try {
          const images = container.querySelectorAll('img[alt*="Trang"]')
          if (images && images.length > 0) {
            pageElements = images
            console.log('Using images as page elements:', images.length)
          }
        } catch (err) {
          console.warn('Alternative page detection failed:', err)
          return
        }
      }

      if (!pageElements || pageElements.length === 0) return

      // Calculate which page is currently visible with improved algorithm
      let visiblePage = 1
      let maxVisibleArea = 0
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.top + containerRect.height / 2

      pageElements.forEach((pageElement, index) => {
        const element = pageElement as HTMLElement
        const rect = element.getBoundingClientRect()

        // Calculate visible area of this page
        const visibleTop = Math.max(rect.top, containerRect.top)
        const visibleBottom = Math.min(rect.bottom, containerRect.bottom)
        const visibleHeight = Math.max(0, visibleBottom - visibleTop)

        // Also consider which page is closest to center
        const pageCenter = rect.top + rect.height / 2
        const distanceFromCenter = Math.abs(pageCenter - containerCenter)

        // Prioritize pages with more visible area, but also consider center proximity
        const score = visibleHeight - (distanceFromCenter * 0.1)

        if (score > maxVisibleArea) {
          maxVisibleArea = score
          visiblePage = index + 1
        }
      })

      console.log('Calculated visible page:', visiblePage, 'current:', currentPage, 'maxVisibleArea:', maxVisibleArea)

      if (visiblePage !== currentPage && maxVisibleArea > 0) {
        console.log('Updating current page from', currentPage, 'to', visiblePage)
        setCurrentPage(visiblePage)
      }
    }, 50) // Reduced throttle for more responsive updates
  }

  // Navigate to specific page
  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return

    let container: HTMLElement | null = null
    try {
      container = document.querySelector('.h-full.overflow-y-auto.overflow-x-hidden') as HTMLElement
    } catch (queryError) {
      console.warn('Failed to find container for navigation:', queryError)
      return
    }

    if (!container) return

    let pageElements: NodeListOf<Element> | null = null
    try {
      if (container && typeof container.querySelectorAll === 'function') {
        // Use the same comprehensive selectors as handleScroll
        pageElements = container.querySelectorAll('.page-container, section.docx, .docx-page, [data-page], .page')

        // If no elements found, try looking for images
        if (!pageElements || pageElements.length === 0) {
          pageElements = container.querySelectorAll('img[alt*="Trang"], div[class*="page"], section')
        }

        // Last resort: try to find any images in the container
        if (!pageElements || pageElements.length === 0) {
          const images = container.querySelectorAll('img')
          if (images && images.length > 0) {
            pageElements = images
          }
        }
      }
    } catch (queryError) {
      console.warn('Failed to query page elements for navigation:', queryError)
      return
    }

    console.log('Navigation: Found', pageElements ? pageElements.length : 0, 'page elements, going to page', pageNumber)

    if (!pageElements || pageElements.length === 0) return

    const targetPage = pageElements[pageNumber - 1] as HTMLElement

    if (targetPage && typeof targetPage.scrollIntoView === 'function') {
      try {
        // Update current page immediately for better UX
        setCurrentPage(pageNumber)

        // Scroll to the target page
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' })

        console.log('Successfully navigated to page', pageNumber)
      } catch (scrollError) {
        console.warn('Failed to scroll to page:', scrollError)
      }
    }
  }

  const getFileIcon = () => {
    if (fileType === 'image') return <ImageIcon className="h-5 w-5" />
    if (fileType === 'audio') return <Volume2 className="h-5 w-5" />
    if (fileType === 'video') return <Play className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const isAudioFile = (file: File) => {
    return file.type.startsWith('audio/') ||
           file.type === 'audio/mpeg' ||
           file.type === 'audio/wav' ||
           file.type === 'audio/mp3' ||
           file.type === 'audio/ogg' ||
           file.type === 'audio/webm'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Don't render on server-side
  if (!isClient) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon()}
              <div>
                <DialogTitle className="text-left">{file?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {file && formatFileSize(file.size)} • {file?.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Controls for all file types */}
              {(fileType === 'image' ||
                fileType === 'audio' ||
                fileType === 'video' ||
                (file?.type === 'application/pdf' && pdfCanvases.length > 0) ||
                ((file?.type.includes('word') || file?.type.includes('document')) && (htmlContent || pdfCanvases.length > 0)) ||
                (file?.type === 'text/plain' && previewContent)) && (
                <div className="flex items-center gap-2 mr-2">
                  {/* Debug info for documents */}
                  {fileType !== 'image' && (
                    <span className="text-xs text-gray-500 mr-2 bg-gray-100 px-2 py-1 rounded">
                      📊 {totalPages} trang, hiện tại: {currentPage}
                    </span>
                  )}

                  {/* Image zoom info */}
                  {fileType === 'image' && (
                    <span className="text-xs text-gray-500 mr-2 bg-gray-100 px-2 py-1 rounded">
                      🖼️ Zoom: {Math.round(imageZoom * 100)}%
                    </span>
                  )}

                  {/* Audio player info */}
                  {fileType === 'audio' && (
                    <span className="text-xs text-gray-500 mr-2 bg-gray-100 px-2 py-1 rounded">
                      🎵 {formatTime(currentTime)} / {formatTime(duration)} • {playbackRate}x
                    </span>
                  )}

                  {/* Video player info */}
                  {fileType === 'video' && (
                    <span className="text-xs text-gray-500 mr-2 bg-gray-100 px-2 py-1 rounded">
                      🎬 {formatTime(currentTime)} / {formatTime(duration)} • {playbackRate}x
                    </span>
                  )}

                  {(file?.type === 'application/pdf' || (file?.type.includes('word') && pdfCanvases.length > 0)) && totalPages > 0 ? (
                    <div className="flex items-center gap-1">
                      {totalPages > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-6 w-6 p-0"
                        >
                          ←
                        </Button>
                      )}
                      <span className="text-sm font-medium min-w-[60px] text-center">
                        Trang {currentPage}/{totalPages}
                      </span>
                      {totalPages > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="h-6 w-6 p-0"
                        >
                          →
                        </Button>
                      )}
                    </div>
                  ) : (file?.type.includes('word') || file?.type.includes('document')) && htmlContent && totalPages > 0 ? (
                    <span className="text-sm font-medium">
                      Trang {currentPage}/{totalPages} - HTML mode
                    </span>
                  ) : (
                    <span className="text-sm font-medium">
                      {file?.type === 'text/plain' ? 'Text File' :
                       previewContent.includes('trang') ? previewContent.split(' - ')[1] : 'Document'}
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-2">
                    {fileType === 'image' ? (
                      // Image zoom controls
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImageZoom(-0.25)}
                          className="h-8 w-8 p-0"
                          title="Zoom out (Ctrl + Scroll)"
                        >
                          -
                        </Button>
                        <span className="text-xs min-w-[50px] text-center">
                          {Math.round(imageZoom * 100)}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImageZoom(0.25)}
                          className="h-8 w-8 p-0"
                          title="Zoom in (Ctrl + Scroll)"
                        >
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetImageView}
                          className="h-8 px-2 text-xs"
                          title="Reset view"
                        >
                          Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImageZoom(1)}
                          className="h-8 px-2 text-xs"
                          title="Fit to screen"
                        >
                          Fit
                        </Button>
                      </>
                    ) : fileType === 'audio' ? (
                      // Audio player controls
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => skipTime(-10)}
                          className="h-8 w-8 p-0"
                          title="Tua lùi 10s"
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={togglePlayPause}
                          className="h-8 w-8 p-0"
                          title={isPlaying ? "Dừng" : "Phát"}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => skipTime(10)}
                          className="h-8 w-8 p-0"
                          title="Tua tới 10s"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleMute}
                          className="h-8 w-8 p-0"
                          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <select
                          value={playbackRate}
                          onChange={(e) => changePlaybackRate(Number(e.target.value))}
                          className="h-8 px-2 text-xs border rounded"
                          title="Tốc độ phát"
                        >
                          <option value={0.5}>0.5x</option>
                          <option value={0.75}>0.75x</option>
                          <option value={1}>1x</option>
                          <option value={1.25}>1.25x</option>
                          <option value={1.5}>1.5x</option>
                          <option value={2}>2x</option>
                        </select>
                      </>
                    ) : fileType === 'video' ? (
                      // Video player controls
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => skipVideoTime(-10)}
                          className="h-8 w-8 p-0"
                          title="Tua lùi 10s"
                        >
                          <Rewind className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleVideoPlayPause}
                          className="h-8 w-8 p-0"
                          title={isPlaying ? "Dừng" : "Phát"}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => skipVideoTime(10)}
                          className="h-8 w-8 p-0"
                          title="Tua tới 10s"
                        >
                          <FastForward className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleVideoMute}
                          className="h-8 w-8 p-0"
                          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleVideoFullscreen}
                          className="h-8 w-8 p-0"
                          title="Toàn màn hình"
                        >
                          {isVideoFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </Button>
                        <select
                          value={playbackRate}
                          onChange={(e) => changeVideoPlaybackRate(Number(e.target.value))}
                          className="h-8 px-2 text-xs border rounded"
                          title="Tốc độ phát"
                        >
                          <option value={0.25}>0.25x</option>
                          <option value={0.5}>0.5x</option>
                          <option value={0.75}>0.75x</option>
                          <option value={1}>1x</option>
                          <option value={1.25}>1.25x</option>
                          <option value={1.5}>1.5x</option>
                          <option value={2}>2x</option>
                        </select>
                      </>
                    ) : (
                      // Document zoom controls
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom(-0.2)}
                          className="h-8 w-8 p-0"
                          title="Zoom out"
                        >
                          -
                        </Button>
                        <span className="text-xs min-w-[40px] text-center">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom(0.2)}
                          className="h-8 w-8 p-0"
                          title="Zoom in"
                        >
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(1)}
                          className="h-8 px-2 text-xs"
                          title="Reset zoom"
                        >
                          Reset
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Tải xuống
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải nội dung...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <Button variant="outline" onClick={loadFileContent}>
                  Thử lại
                </Button>
              </div>
            </div>
          ) : fileType === 'image' && previewContent ? (
            <div
              ref={imageContainerRef}
              className="flex items-center justify-center h-full p-4 overflow-hidden relative"
              onWheel={handleImageWheel}
              onMouseMove={handleImageMouseMove}
              onMouseUp={handleImageMouseUp}
              onMouseLeave={handleImageMouseUp}
              style={{ cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                🖼️ Ctrl + Scroll để zoom • {imageZoom > 1 ? 'Kéo để di chuyển' : 'Zoom để kéo ảnh'}
              </div>
              <img
                src={previewContent}
                alt={file?.name}
                className="rounded-lg shadow-lg transition-transform duration-200"
                style={{
                  transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                  maxWidth: imageZoom <= 1 ? '100%' : 'none',
                  maxHeight: imageZoom <= 1 ? '100%' : 'none',
                  width: imageZoom > 1 ? 'auto' : 'auto',
                  height: imageZoom > 1 ? 'auto' : 'auto',
                  objectFit: 'contain',
                  userSelect: 'none',
                  pointerEvents: imageZoom > 1 ? 'auto' : 'none'
                }}
                onMouseDown={handleImageMouseDown}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          ) : fileType === 'audio' && previewContent ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              {/* Audio Element */}
              <audio
                ref={audioRef}
                src={previewContent}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration)
                  }
                }}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime)
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false)
                  setCurrentTime(0)
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Audio Visualizer */}
              <div className="w-full max-w-2xl bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center mb-6">
                <div className="mb-4">
                  <Volume2 className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <h3 className="text-xl font-semibold mb-2">{file?.name}</h3>
                  <p className="text-sm opacity-80">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-4">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Seek Bar */}
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer mb-6"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => skipTime(-30)}
                    className="text-white hover:bg-white hover:bg-opacity-20 h-12 w-12 p-0"
                    title="Tua lùi 30s"
                  >
                    <SkipBack className="h-6 w-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white hover:bg-opacity-20 h-16 w-16 p-0 rounded-full"
                    title={isPlaying ? "Dừng" : "Phát"}
                  >
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => skipTime(30)}
                    className="text-white hover:bg-white hover:bg-opacity-20 h-12 w-12 p-0"
                    title="Tua tới 30s"
                  >
                    <SkipForward className="h-6 w-6" />
                  </Button>
                </div>

                {/* Secondary Controls */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8 p-0"
                      title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <select
                    value={playbackRate}
                    onChange={(e) => changePlaybackRate(Number(e.target.value))}
                    className="bg-white bg-opacity-20 text-white border-0 rounded px-2 py-1 text-sm"
                    title="Tốc độ phát"
                  >
                    <option value={0.5} className="text-black">0.5x</option>
                    <option value={0.75} className="text-black">0.75x</option>
                    <option value={1} className="text-black">1x</option>
                    <option value={1.25} className="text-black">1.25x</option>
                    <option value={1.5} className="text-black">1.5x</option>
                    <option value={2} className="text-black">2x</option>
                  </select>
                </div>
              </div>

              {/* Audio Info */}
              <div className="text-center text-gray-600">
                <p className="text-sm mb-2">
                  🎵 Audio Player • Tốc độ: {playbackRate}x •
                  {isPlaying ? " Đang phát" : " Đã dừng"}
                </p>
                <p className="text-xs text-gray-500">
                  Phím tắt: Space (Phát/Dừng) • ← → (Tua) • ↑ ↓ (Âm lượng) • M (Tắt/Bật âm)
                </p>
              </div>
            </div>
          ) : fileType === 'video' && previewContent ? (
            <div className="flex items-center justify-center h-full p-4 bg-black">
              {/* Video Element */}
              <video
                ref={videoRef}
                src={previewContent}
                className="w-full h-full object-contain rounded-lg shadow-2xl"
                controls={false}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration)
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime)
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false)
                  setCurrentTime(0)
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />

              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-4 text-white">
                {/* Progress Bar */}
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-4">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Seek Bar */}
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => handleVideoSeek(Number(e.target.value))}
                  className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer mb-4"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipVideoTime(-10)}
                      className="text-white hover:bg-white hover:bg-opacity-20 h-10 w-10 p-0"
                      title="Tua lùi 10s"
                    >
                      <Rewind className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={toggleVideoPlayPause}
                      className="text-white hover:bg-white hover:bg-opacity-20 h-12 w-12 p-0 rounded-full"
                      title={isPlaying ? "Dừng" : "Phát"}
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipVideoTime(10)}
                      className="text-white hover:bg-white hover:bg-opacity-20 h-10 w-10 p-0"
                      title="Tua tới 10s"
                    >
                      <FastForward className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleVideoMute}
                        className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8 p-0"
                        title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVideoVolumeChange(Number(e.target.value))}
                        className="w-16 h-1 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <select
                      value={playbackRate}
                      onChange={(e) => changeVideoPlaybackRate(Number(e.target.value))}
                      className="bg-white bg-opacity-20 text-white border-0 rounded px-2 py-1 text-sm"
                      title="Tốc độ phát"
                    >
                      <option value={0.25} className="text-black">0.25x</option>
                      <option value={0.5} className="text-black">0.5x</option>
                      <option value={0.75} className="text-black">0.75x</option>
                      <option value={1} className="text-black">1x</option>
                      <option value={1.25} className="text-black">1.25x</option>
                      <option value={1.5} className="text-black">1.5x</option>
                      <option value={2} className="text-black">2x</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleVideoFullscreen}
                      className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8 p-0"
                      title="Toàn màn hình"
                    >
                      {isVideoFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Video Info */}
                <div className="text-center text-gray-300 mt-2">
                  <p className="text-xs">
                    🎬 Video Player • Tốc độ: {playbackRate}x • {isPlaying ? "Đang phát" : "Đã dừng"}
                  </p>
                  <p className="text-xs opacity-75">
                    Phím tắt: Space (Phát/Dừng) • ← → (Tua) • ↑ ↓ (Âm lượng) • F (Toàn màn hình)
                  </p>
                </div>
              </div>
            </div>
          ) : (file?.type === 'application/pdf' || (file?.type.includes('word') && pdfCanvases.length > 0)) && pdfCanvases.length > 0 ? (
            <div className="h-full overflow-y-auto overflow-x-hidden" onWheel={handleWheel} onScroll={handleScroll}>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-4 text-center bg-blue-50 p-2 rounded">
                  {previewContent} • Ctrl + Scroll để zoom • Scroll để xem các trang • Realtime page tracking: {currentPage}/{totalPages}
                </div>
                <div className="space-y-4">
                  {pdfCanvases.map((canvasData, index) => (
                    <div
                      key={index}
                      className={`page-container border rounded overflow-hidden shadow-sm bg-white ${
                        currentPage === index + 1 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                      }`}
                      data-page={index + 1}
                    >
                      <div className={`px-3 py-2 text-sm font-medium border-b ${
                        currentPage === index + 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        📄 Trang {index + 1} {currentPage === index + 1 ? '(Đang xem)' : ''}
                      </div>
                      <div className="p-3 flex justify-center bg-gray-50">
                        <img
                          src={canvasData}
                          alt={`Trang ${index + 1}`}
                          className="border shadow rounded"
                          style={{
                            width: zoomLevel === 1 ? '100%' : `${100 * zoomLevel}%`,
                            maxWidth: zoomLevel === 1 ? '100%' : 'none',
                            height: 'auto',
                            transition: 'width 0.2s ease',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (file?.type.includes('word') || file?.type.includes('document')) && htmlContent ? (
            <div className="h-full overflow-y-auto overflow-x-hidden" onWheel={handleWheel} onScroll={handleScroll}>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-4 text-center bg-blue-50 p-2 rounded">
                  {previewContent} • Ctrl + Scroll để zoom
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-white shadow-lg border"
                    style={{
                      width: `${100 * zoomLevel}%`,
                      maxWidth: zoomLevel === 1 ? '100%' : 'none',
                      transition: 'width 0.2s ease'
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto overflow-x-hidden" onWheel={handleWheel}>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-4 text-center bg-gray-50 p-2 rounded">
                  📄 {file?.type === 'text/plain' ? 'Text Document' : 'File Content'} • Ctrl + Scroll để zoom
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-white border rounded shadow-sm"
                    style={{
                      width: `${100 * zoomLevel}%`,
                      maxWidth: zoomLevel === 1 ? '100%' : 'none',
                      transition: 'width 0.2s ease'
                    }}
                  >
                    <div className="p-4">
                      <pre
                        className="whitespace-pre-wrap text-sm leading-relaxed"
                        style={{
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                          color: '#000',
                          margin: 0,
                          background: 'transparent',
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'top left',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        {previewContent || 'Không có nội dung để hiển thị.'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
