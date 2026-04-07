export type PointContext = {
  id: string
  x: number
  y: number
}

// Distance between two points
export const euclideanDistance = (p1: PointContext, p2: PointContext) => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

// Distance from a point p to the nearest center in C
export const distanceToNearestCenter = (p: PointContext, centers: PointContext[]) => {
  if (centers.length === 0) return Infinity
  let minDistance = Infinity
  for (const center of centers) {
    const dist = euclideanDistance(p, center)
    if (dist < minDistance) {
      minDistance = dist
    }
  }
  return minDistance
}

// Coverage radius of current centers (max of all nearest distances)
export const computeCoverageRadius = (points: PointContext[], centers: PointContext[]) => {
  if (centers.length === 0 || points.length === 0) return 0
  let maxMinDistance = 0
  for (const p of points) {
    const minDistance = distanceToNearestCenter(p, centers)
    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance
    }
  }
  return maxMinDistance
}

// Farthest point to be added as the NEXT center
export const findFarthestPoint = (points: PointContext[], centers: PointContext[]): PointContext | null => {
  if (points.length === 0) return null
  if (centers.length === 0) return points[0] // by default the first point

  let maxMinDistance = -1
  let farthestPoint: PointContext | null = null

  for (const p of points) {
    // If it's already a center, skip
    if (centers.some(c => c.id === p.id)) continue

    const minDistance = distanceToNearestCenter(p, centers)
    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance
      farthestPoint = p
    }
  }

  return farthestPoint
}
