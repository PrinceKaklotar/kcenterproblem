import { useState, useCallback, useEffect, useRef } from 'react'
import { findFarthestPoint } from '../utils/mathUtils'
import type { PointContext } from '../utils/mathUtils'

export type Mode = 'manual' | 'auto'

export const useKCenterSimulator = () => {
  const [points, setPoints] = useState<PointContext[]>([])
  const [centerIds, setCenterIds] = useState<string[]>([])
  const [k, setK] = useState<number>(3)
  const [mode, setMode] = useState<Mode>('manual')
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Farthest point to become a center next
  const [farthestPoint, setFarthestPoint] = useState<PointContext | null>(null)
  
  const timerRef = useRef<number | null>(null)

  // Derived centers based on IDs
  const centers = points.filter(p => centerIds.includes(p.id))

  // Update farthest point dynamically
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

  const addPoint = useCallback((x: number, y: number) => {
    setPoints(prev => [...prev, { id: crypto.randomUUID(), x, y }])
  }, [])

  const movePoint = useCallback((id: string, x: number, y: number) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))
  }, [])

  const deletePoint = useCallback((id: string) => {
    setPoints(prev => prev.filter(p => p.id !== id))
    setCenterIds(prev => prev.filter(cId => cId !== id))
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
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
    }
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
        // Find current centers based on prev IDs
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

  // Auto-play interval
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
      }, 1000)
    } else {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [isPlaying, points, k])


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
    farthestPoint,
    addPoint,
    movePoint,
    deletePoint,
    toggleCenter,
    generateRandomPoints,
    nextStep,
    prevStep,
    reset
  }
}
