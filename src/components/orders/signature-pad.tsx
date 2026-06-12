'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataUrl: () => string
}

export const SignaturePad = forwardRef<SignaturePadHandle, { className?: string; onChange?: (empty: boolean) => void }>(
  function SignaturePad({ className, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawingRef = useRef(false)
    const emptyRef = useRef(true)
    const lastPointRef = useRef<{ x: number; y: number } | null>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const configure = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const { width, height } = canvas.getBoundingClientRect()
        canvas.width = width * ratio
        canvas.height = height * ratio

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(ratio, ratio)
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.strokeStyle = '#0f172a'
        }
      }

      configure()
      window.addEventListener('resize', configure)
      return () => window.removeEventListener('resize', configure)
    }, [])

    const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      drawingRef.current = true
      lastPointRef.current = getPoint(e)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return
      e.preventDefault()

      const ctx = canvasRef.current?.getContext('2d')
      const point = getPoint(e)

      if (ctx && lastPointRef.current) {
        ctx.beginPath()
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }

      lastPointRef.current = point

      if (emptyRef.current) {
        emptyRef.current = false
        onChange?.(false)
      }
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      drawingRef.current = false
      lastPointRef.current = null
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    }

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        emptyRef.current = true
        onChange?.(true)
      },
      isEmpty: () => emptyRef.current,
      toDataUrl: () => canvasRef.current?.toDataURL('image/png') ?? '',
    }))

    return (
      <canvas
        ref={canvasRef}
        className={cn('h-40 w-full touch-none rounded-lg border border-input bg-background', className)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    )
  }
)
