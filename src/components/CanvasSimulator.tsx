import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { distanceToNearestCenter } from '../utils/mathUtils'
import type { PointContext } from '../utils/mathUtils'
import type { Mode } from '../hooks/useKCenterSimulator'
import { clsx } from 'clsx'

interface CanvasSimulatorProps {
  points: PointContext[]
  centers: PointContext[]
  farthestPoint: PointContext | null
  mode: Mode
  addPoint: (x: number, y: number) => void
  deletePoint: (id: string) => void
  toggleCenter: (id: string) => void
  movePoint: (id: string, x: number, y: number) => void
}

export const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  points,
  centers,
  farthestPoint,
  mode,
  addPoint,
  deletePoint,
  toggleCenter,
  movePoint
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  // Viewport/Transform State
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  
  // Resize observer to match SVG initial viewBox logic if needed
  useEffect(() => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    setViewBox(prev => ({ ...prev, width: rect.width || 800, height: rect.height || 600 }))
  }, [])

  const getSVGCoordinates = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const CTM = svgRef.current.getScreenCTM()
    if (!CTM) return { x: 0, y: 0 }
    return {
      x: (clientX - CTM.e) / CTM.a,
      y: (clientY - CTM.f) / CTM.d
    }
  }

  // Pan interaction
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current) return // Only pan if background is clicked
    if (e.button !== 0) return // Ensure left click

    // If double clicking, maybe add point? Let's use alt+click or simply clicking to add point if not moved.
    // Wait, the requirement was "Click anywhere -> add vertex".
    // If they drag, we pan. If they just click, we add a point.
    
    setIsPanning(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    
    let hasMoved = false
    const startX = e.clientX
    const startY = e.clientY
    
    // Coordinates inside SVG space for adding point later if no movement occurred
    const { x: svgX, y: svgY } = getSVGCoordinates(e.clientX, e.clientY)

    const onPointerMove = (moveEvent: PointerEvent) => {
       const dx = moveEvent.clientX - startX
       const dy = moveEvent.clientY - startY
       
       if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true
       
       if (hasMoved) {
           setViewBox(prev => {
               return {
                   ...prev,
                   x: prev.x - moveEvent.movementX * (prev.width / (svgRef.current?.getBoundingClientRect().width || prev.width)),
                   y: prev.y - moveEvent.movementY * (prev.height / (svgRef.current?.getBoundingClientRect().height || prev.height))
               }
           })
       }
    }

    const onPointerUp = () => {
        setIsPanning(false)
        if (svgRef.current) {
            svgRef.current.releasePointerCapture(e.pointerId)
            svgRef.current.removeEventListener('pointermove', onPointerMove)
            svgRef.current.removeEventListener('pointerup', onPointerUp)
        }
        
        // If they just clicked without dragging, add a point!
        if (!hasMoved) {
            addPoint(svgX, svgY)
        }
    }
    
    svgRef.current.addEventListener('pointermove', onPointerMove)
    svgRef.current.addEventListener('pointerup', onPointerUp)
  }

  // Zoom interaction
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault() // Block browser scroll
      
      const zoomSensitivity = 0.001
      const zoomFactor = 1 + e.deltaY * zoomSensitivity
      
      const { x: pointerX, y: pointerY } = getSVGCoordinates(e.clientX, e.clientY)
      
      setViewBox(prev => {
          const newWidth = prev.width * zoomFactor
          const newHeight = prev.height * zoomFactor
          
          // Math to keep zoom centered on mouse
          const newX = pointerX - (pointerX - prev.x) * zoomFactor
          const newY = pointerY - (pointerY - prev.y) * zoomFactor
          
          // Limit Max Zoom Out / In
          if (newWidth > 10000 || newWidth < 100) return prev
          
          return {
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
          }
      })
  }, [])

  // Precompute distances
  const coverageData = useMemo(() => {
    let maxDistance = 0
    if (centers.length > 0) {
      points.forEach(p => {
        const d = distanceToNearestCenter(p, centers)
        if (d > maxDistance) maxDistance = d
      })
    }
    return { maxDistance }
  }, [points, centers])

  const restoreView = () => {
      if(svgRef.current){
          const r = svgRef.current.getBoundingClientRect()
          setViewBox({ x: 0, y: 0, width: r.width, height: r.height })
      }
  }

  return (
    <div className="h-full w-full bg-[#0a0f18] relative overflow-hidden flex flex-col rounded-xl border border-white/10 shadow-inner group">
      
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs shadow-lg text-white font-medium flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Point (Click/Drag)</span>
            <span className="w-2 h-2 rounded-full bg-success ml-2"></span>
            <span>Center</span>
            <span className="w-2 h-2 rounded-full bg-error ml-2"></span>
            <span>Farthest</span>
            <span className="text-text-muted ml-2"> | Right-click point to delete</span>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10 flex gap-2 transition-opacity opacity-0 group-hover:opacity-100">
         <span className="bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-text-muted">
            Scroll = Zoom · Drag = Pan
         </span>
         <button 
           onClick={restoreView}
           className="bg-primary/20 hover:bg-primary text-primary hover:text-white backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold transition-all">
             Reset View
         </button>
      </div>

      <svg 
        ref={svgRef}
        className={clsx("flex-1 w-full h-full touch-none", isPanning ? "cursor-grabbing" : "cursor-crosshair")}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      >
        {/* Coverage Circles */}
        <AnimatePresence>
          {centers.map(center => (
            <motion.circle
              key={`coverage-${center.id}`}
              cx={center.x}
              cy={center.y}
              r={coverageData.maxDistance}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: coverageData.maxDistance, opacity: 0.1 }}
              exit={{ r: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="fill-success stroke-success"
              strokeWidth={2}
            />
          ))}
        </AnimatePresence>

        {/* Lines indicating distances */}
        <AnimatePresence>
          {points.map(p => {
             const isCenter = centers.some(c => c.id === p.id)
             if (isCenter || centers.length === 0) return null
             
             let nearest: PointContext | null = null
             let minD = Infinity
             for (const c of centers) {
               const d = distanceToNearestCenter(p, [c])
               if (d < minD) { minD = d; nearest = c }
             }

             if (!nearest) return null

             const isFarthest = p.id === farthestPoint?.id

             return (
               <motion.line
                 key={`line-${p.id}`}
                 x1={nearest.x}
                 y1={nearest.y}
                 x2={p.x}
                 y2={p.y}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: isFarthest ? 0.6 : 0.2 }}
                 transition={{ duration: 0.3 }}
                 stroke={isFarthest ? '#ef4444' : '#94a3b8'}
                 strokeWidth={isFarthest ? 2 : 1}
                 strokeDasharray="4 4"
               />
             )
          })}
        </AnimatePresence>

        {/* Points Render */}
        {points.map(point => {
          const isCenter = centers.some(c => c.id === point.id)
          const isFarthest = farthestPoint?.id === point.id

          return (
            <motion.circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={isCenter || isFarthest ? 8 : 6}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={clsx(
                "cursor-pointer transition-colors outline-none",
                isCenter ? "fill-success drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                : isFarthest ? "fill-error drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" 
                : "fill-primary hover:fill-blue-300"
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (mode === 'manual') toggleCenter(point.id)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                deletePoint(point.id)
              }}
              onPointerDown={(e) => {
                  e.stopPropagation() // Prevent panning when dragging a node
                  const target = e.currentTarget
                  target.setPointerCapture(e.pointerId)
                  
                  let nodeHasMoved = false
                  
                  const onPointerMove = (evt: PointerEvent) => {
                      nodeHasMoved = true
                      const { x: svgX, y: svgY } = getSVGCoordinates(evt.clientX, evt.clientY)
                      movePoint(point.id, svgX, svgY)
                  }
                  
                  const onPointerUp = () => {
                      target.releasePointerCapture(e.pointerId)
                      target.removeEventListener('pointermove', onPointerMove)
                      target.removeEventListener('pointerup', onPointerUp)
                      
                      // If it was just a quick click without much move, it should trigger the onClick instead!
                      // Though onClick natively fires as well.
                      if (!nodeHasMoved && mode === 'manual' && e.button===0) {
                         // toggleCenter(point.id) handled natively by onClick
                      }
                  }
                  
                  target.addEventListener('pointermove', onPointerMove)
                  target.addEventListener('pointerup', onPointerUp)
              }}
            />
          )
        })}

        {/* Pulsing effect for the farthest point if it exists */}
        <AnimatePresence>
            {farthestPoint && (
                <motion.circle
                    key={`pulse-${farthestPoint.id}`}
                    cx={farthestPoint.x}
                    cy={farthestPoint.y}
                    initial={{ r: 8, opacity: 0.8 }}
                    animate={{ r: 24, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="fill-transparent stroke-error"
                    strokeWidth={2}
                    pointerEvents="none"
                />
            )}
        </AnimatePresence>
      </svg>
    </div>
  )
}
