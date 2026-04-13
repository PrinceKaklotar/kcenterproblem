import React, { useRef, useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { distanceToNearestCenter } from '../utils/mathUtils'
import type { PointContext } from '../utils/mathUtils'
import type { Mode } from '../hooks/useKCenterSimulator'
import { clsx } from 'clsx'
import { Maximize, Minimize } from 'lucide-react'

interface CanvasSimulatorProps {
  points: PointContext[]
  centers: PointContext[]
  optimalCenters: PointContext[]
  farthestPoint: PointContext | null
  mode: Mode
  showGreedy: boolean
  showOptimal: boolean
  addPoint: (x: number, y: number) => void
  deletePoint: (id: string) => void
  toggleCenter: (id: string) => void
  movePoint: (id: string, x: number, y: number) => void
  toggleFullscreen?: () => void
  isFullscreen?: boolean
}

export const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  points,
  centers,
  optimalCenters,
  farthestPoint,
  mode,
  showGreedy,
  showOptimal,
  addPoint,
  deletePoint,
  toggleCenter,
  movePoint,
  toggleFullscreen,
  isFullscreen
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  
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

  // --- Strict Wheel Event for Scroll override ---
  useEffect(() => {
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault()

      const zoomSensitivity = 0.001
      const zoomFactor = 1 + e.deltaY * zoomSensitivity
      
      const { x: pointerX, y: pointerY } = getSVGCoordinates(e.clientX, e.clientY)
      
      setViewBox(prev => {
          const newWidth = prev.width * zoomFactor
          const newHeight = prev.height * zoomFactor
          
          const newX = pointerX - (pointerX - prev.x) * zoomFactor
          const newY = pointerY - (pointerY - prev.y) * zoomFactor
          
          if (newWidth > 15000 || newWidth < 50) return prev
          return { x: newX, y: newY, width: newWidth, height: newHeight }
      })
    }
    
    const svgEl = svgRef.current
    if (svgEl) {
      svgEl.addEventListener('wheel', handleNativeWheel, { passive: false })
    }
    return () => {
      if (svgEl) svgEl.removeEventListener('wheel', handleNativeWheel)
    }
  }, [])

  // Pan interaction
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current) return 
    if (e.button !== 0) return 

    setIsPanning(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    
    let hasMoved = false
    const startX = e.clientX
    const startY = e.clientY
    
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
        
        if (!hasMoved) {
            addPoint(svgX, svgY)
        }
    }
    
    svgRef.current.addEventListener('pointermove', onPointerMove)
    svgRef.current.addEventListener('pointerup', onPointerUp)
  }

  // Precompute Greedy and Optimal Radii
  const greedyData = useMemo(() => {
    let maxDistance = 0
    let worstGreedyPoint: PointContext | null = null
    if (centers.length > 0) {
      points.forEach(p => {
        const d = distanceToNearestCenter(p, centers)
        if (d > maxDistance) { maxDistance = d; worstGreedyPoint = p }
      })
    }
    return { maxDistance, worstGreedyPoint }
  }, [points, centers])

  const optimalData = useMemo(() => {
    let maxDistance = 0
    let worstOptimalPoint: PointContext | null = null
    if (optimalCenters.length > 0) {
      points.forEach(p => {
        const d = distanceToNearestCenter(p, optimalCenters)
        if (d > maxDistance) { maxDistance = d; worstOptimalPoint = p; }
      })
    }
    return { maxDistance, worstOptimalPoint }
  }, [points, optimalCenters])

  const restoreView = () => {
      if(svgRef.current){
          const r = svgRef.current.getBoundingClientRect()
          setViewBox({ x: 0, y: 0, width: r.width, height: r.height })
      }
  }

  return (
    <div className="h-full w-full bg-[#0a0f18] relative overflow-hidden flex flex-col rounded-xl shadow-inner group">
      
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <div className="bg-surface/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-xs shadow-lg text-white font-medium flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="text-gray-300">Unselected Node (Click/Drag)</span>
            </div>
            
            {showGreedy && (
              <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  <span className="text-success">Greedy Center & Coverage</span>
              </div>
            )}

            {showOptimal && optimalCenters.length > 0 && (
              <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-purple-400">Optimal Center & Coverage</span>
              </div>
            )}
            
            {(showGreedy) && farthestPoint && (
              <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="text-error">Farthest (Worst Case)</span>
              </div>
            )}
            <div className="pt-1 border-t border-white/10 mt-1 text-gray-500 text-[10px]">Right-click point to delete</div>
        </div>
      </div>
      
      <div className="absolute top-2 right-2 z-10 flex gap-2 transition-opacity opacity-0 group-hover:opacity-100">
         <span className="bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-text-muted">
            Scroll = Zoom · Drag = Pan
         </span>
         <button 
           onClick={restoreView}
           className="bg-primary/20 hover:bg-primary text-primary hover:text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow shrink-0">
             Reset View
         </button>
         {toggleFullscreen && (
            <button 
              onClick={toggleFullscreen}
              className="bg-surface/80 hover:bg-white/10 text-white backdrop-blur-md px-2 py-1.5 rounded-lg text-xs font-semibold border border-white/10 transition-all flex items-center justify-center shrink-0">
                {isFullscreen ? <Minimize size={16}/> : <Maximize size={16}/>}
            </button>
         )}
      </div>

      <svg 
        ref={svgRef}
        className={clsx("flex-1 w-full h-full touch-none", isPanning ? "cursor-grabbing" : "cursor-crosshair")}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      >
        {/* OPTIMAL COVERAGE CIRCLES */}
        {showOptimal && (<AnimatePresence>
          {optimalCenters.map(center => (
            <motion.circle
              key={`optimal-coverage-${center.id}`}
              cx={center.x}
              cy={center.y}
              r={optimalData.maxDistance}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: optimalData.maxDistance, opacity: 0.1 }}
              exit={{ r: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="fill-purple-500 stroke-purple-500"
              strokeWidth={3}
              strokeDasharray="8 8"
            />
          ))}
        </AnimatePresence>)}

        {/* GREEDY COVERAGE CIRCLES */}
        {showGreedy && (<AnimatePresence>
          {centers.map(center => (
            <motion.circle
              key={`greedy-coverage-${center.id}`}
              cx={center.x}
              cy={center.y}
              r={greedyData.maxDistance}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: greedyData.maxDistance, opacity: 0.1 }}
              exit={{ r: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="fill-success stroke-success"
              strokeWidth={2}
            />
          ))}
        </AnimatePresence>)}

        {/* LINES DISTANCE - GREEDY ONLY (to reduce visual clutter) */}
        {showGreedy && (<AnimatePresence>
          {points.map(p => {
             const isCenter = centers.some(c => c.id === p.id)
             if (isCenter || centers.length === 0) return null
             
             let nearest: PointContext | null = null
             let minD = Infinity
             for (const c of centers) {
               const d = Math.hypot(p.x - c.x, p.y - c.y)
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
        </AnimatePresence>)}

        {/* POINTS RENDER */}
        {points.map(point => {
          const isGreedyCenter = centers.some(c => c.id === point.id)
          const isOptimalCenter = optimalCenters.some(c => c.id === point.id)
          const isWorstGreedy = farthestPoint?.id === point.id
          
          let circleClass = "fill-primary hover:fill-blue-300"
          let scaleSize = 6

          if (showGreedy && isGreedyCenter) {
             circleClass = "fill-success drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
             scaleSize = 8
          }
          if (showOptimal && isOptimalCenter && !isGreedyCenter) {
             circleClass = "fill-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
             scaleSize = 8
          }
          if (showOptimal && isOptimalCenter && showGreedy && isGreedyCenter) {
             // Dual role - striped or mixed, let's just make it bigger and white to indicate intersection
             circleClass = "fill-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]"
             scaleSize = 9
          }
          if (showGreedy && isWorstGreedy && !isGreedyCenter) {
             circleClass = "fill-error drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]"
             scaleSize = 8
          }

          // Tooltip builder
          let tooltip = `Node ID: ${point.id.slice(0, 5)}\nCoord: (${Math.round(point.x)}, ${Math.round(point.y)})`
          if (showGreedy && centers.length > 0) {
              tooltip += `\nDist to Greedy: ${Math.round(distanceToNearestCenter(point, centers))}`
          }
          if (showOptimal && optimalCenters.length > 0) {
              tooltip += `\nDist to Optimal: ${Math.round(distanceToNearestCenter(point, optimalCenters))}`
          }

          return (
            <motion.circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={scaleSize}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={clsx("cursor-pointer transition-colors outline-none", circleClass)}
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
                  e.stopPropagation() 
                  const target = e.currentTarget
                  target.setPointerCapture(e.pointerId)
                 // let nodeHasMoved = false
                  
                  const onPointerMove = (evt: PointerEvent) => {
                 //    nodeHasMoved = true
                      const { x: svgX, y: svgY } = getSVGCoordinates(evt.clientX, evt.clientY)
                      movePoint(point.id, svgX, svgY)
                  }
                  
                  const onPointerUp = () => {
                      target.releasePointerCapture(e.pointerId)
                      target.removeEventListener('pointermove', onPointerMove)
                      target.removeEventListener('pointerup', onPointerUp)
                  }
                  
                  target.addEventListener('pointermove', onPointerMove)
                  target.addEventListener('pointerup', onPointerUp)
              }}
            >
              <title>{tooltip}</title>
            </motion.circle>
          )
        })}

        {/* Pulsing effect for the farthest point if it exists - Greedy */}
        {showGreedy && (<AnimatePresence>
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
        </AnimatePresence>)}

      </svg>
    </div>
  )
}
