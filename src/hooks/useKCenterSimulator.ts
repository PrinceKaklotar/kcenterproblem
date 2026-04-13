import { useState, useCallback, useEffect, useRef } from 'react'
import { findFarthestPoint, calculateCombinations, findOptimalCenters, computeCoverageRadius } from '../utils/mathUtils'
import type { PointContext } from '../utils/mathUtils'

export type Mode = 'manual' | 'auto'

export const useKCenterSimulator = () => {
  const [points, setPoints] = useState<PointContext[]>([])
  const [centerIds, setCenterIds] = useState<string[]>([])
  const [k, setK] = useState<number>(3)
  const [mode, setMode] = useState<Mode>('manual')
  
  // Auto Play States
  const [isPlaying, setIsPlaying] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000) // ms per step
  
  // Overlay Toggles
  const [showGreedy, setShowGreedy] = useState<boolean>(true)
  const [showOptimal, setShowOptimal] = useState<boolean>(false)

  // Optimal Solution State
  const [optimalCenters, setOptimalCenters] = useState<PointContext[]>([])
  const [optimalRadius, setOptimalRadius] = useState<number>(0)
  const [isComputingOptimal, setIsComputingOptimal] = useState<boolean>(false)
  const [optimalError, setOptimalError] = useState<string | null>(null)

  // Farthest point to become a center next (Greedy tracking)
  const [farthestPoint, setFarthestPoint] = useState<PointContext | null>(null)
  
  const timerRef = useRef<number | null>(null)

  // Derived Greedy centers based on IDs
  const centers = points.filter(p => centerIds.includes(p.id))

  // Update closest distance / farthest point dynamically for manual mode
  const recomputeFarthest = useCallback((currentCenters: PointContext[], currentPoints: PointContext[], currentK: number) => {
    if (currentCenters.length >= currentK || currentPoints.length === 0) {
      setFarthestPoint(null)
      return
    }
    const farthest = findFarthestPoint(currentPoints, currentCenters)
    setFarthestPoint(farthest)
  }, [])

  // Hook into point/center/k changes for manual mode mostly
  useEffect(() => {
    if (!isPlaying) {
      recomputeFarthest(centers, points, k)
    }
  }, [points, centerIds, k, recomputeFarthest, isPlaying, centers])

  // Math interactions map
  const addPoint = useCallback((x: number, y: number) => {
    setPoints(prev => [...prev, { id: crypto.randomUUID(), x, y }])
    setOptimalCenters([]) // invalidate optimal cache on modifying graph
  }, [])

  const movePoint = useCallback((id: string, x: number, y: number) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))
    setOptimalCenters([])
  }, [])

  const deletePoint = useCallback((id: string) => {
    setPoints(prev => prev.filter(p => p.id !== id))
    setCenterIds(prev => prev.filter(cId => cId !== id))
    setOptimalCenters([])
  }, [])

  const toggleCenter = useCallback((id: string) => {
    if (mode === 'auto') return // block manual override during auto
    setCenterIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id)
      } else {
        if (prev.length < k) {
          return [...prev, id]
        }
        return prev
      }
    })
  }, [k, mode])

  const reset = useCallback(() => {
    setCenterIds([])
    setIsPlaying(false)
    setOptimalCenters([])
    setOptimalError(null)
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
    }
  }, [])

  const replayAlgorithm = useCallback(() => {
    setCenterIds([])
    setTimeout(() => {
        setIsPlaying(true)
    }, 100)
  }, [])

  const generateRandomPoints = useCallback((count: number, width: number, height: number) => {
    const newPoints: PointContext[] = []
    for(let i=0; i<count; i++) {
        newPoints.push({
            id: crypto.randomUUID(),
            x: Math.random() * (width - 40) + 20,
            y: Math.random() * (height - 40) + 20
        })
    }
    setPoints(newPoints)
    reset()
  }, [reset])

  const nextStep = useCallback(() => {
    setCenterIds(prev => {
        const currentCenters = points.filter(p => prev.includes(p.id))
        
        if (currentCenters.length >= k) return prev
        if (points.length === 0) return prev
        
        const nextTarget = findFarthestPoint(points, currentCenters)
        if (nextTarget) {
            return [...prev, nextTarget.id]
        }
        return prev
    })
  }, [points, k])

  const prevStep = useCallback(() => {
    setCenterIds(prev => prev.slice(0, Math.max(0, prev.length - 1)))
  }, [])

  const togglePlay = useCallback(() => {
    setIsPlaying(p => !p)
  }, [])

  // Auto-play interval using updated speed
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCenterIds(prev => {
            const currentCenters = points.filter(p => prev.includes(p.id))
            if (currentCenters.length >= k || points.length === 0) {
                setIsPlaying(false)
                return prev
            }
            const nextTarget = findFarthestPoint(points, currentCenters)
            if (nextTarget) return [...prev, nextTarget.id]
            return prev
        })
      }, animationSpeed)
    } else {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [isPlaying, points, k, animationSpeed])

  // OPTIMAL COMPUTATION TRIGGER
  const computeOptimal = useCallback(() => {
     if (points.length === 0) return;
     const nCk = calculateCombinations(points.length, k)
     if (nCk > 100000) {
         setOptimalError(`Optimal solution disabled due to high computational complexity (${nCk.toLocaleString()} combinations generated).`)
         setShowOptimal(false)
         return
     }
     
     setIsComputingOptimal(true)
     setOptimalError(null)

     // Using setTimeout to allow UI to render spinner / 'Computing...' text
     setTimeout(() => {
        try {
            const { optimalCenters, optimalRadius } = findOptimalCenters(points, k)
            setOptimalCenters(optimalCenters)
            setOptimalRadius(optimalRadius)
            setShowOptimal(true) // auto show it when computed successfully
        } catch (e: any) {
            setOptimalError(e.message || "Computation failed")
        } finally {
            setIsComputingOptimal(false)
        }
     }, 50)
  }, [points, k])

  // Convenience calculation for ratio
  const currentGreedyRadius = computeCoverageRadius(points, centers)
  const approximationRatio = (optimalRadius > 0 && currentGreedyRadius > 0) 
                              ? (currentGreedyRadius / optimalRadius).toFixed(2) 
                              : null

  return {
    points,
    centers,
    centerIds,
    k,
    setK,
    mode,
    setMode,
    isPlaying,
    togglePlay,
    animationSpeed,
    setAnimationSpeed,
    replayAlgorithm,
    farthestPoint,
    addPoint,
    movePoint,
    deletePoint,
    toggleCenter,
    generateRandomPoints,
    nextStep,
    prevStep,
    reset,
    
    // Optimal and comparison exports
    showGreedy,
    setShowGreedy,
    showOptimal,
    setShowOptimal,
    computeOptimal,
    isComputingOptimal,
    optimalCenters,
    optimalRadius,
    optimalError,
    currentGreedyRadius,
    approximationRatio
  }
}
