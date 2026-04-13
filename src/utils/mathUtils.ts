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

// Calculate nCk (combinations)
export const calculateCombinations = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k); // Symmetry: nCk = nC(n-k)
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = c * (n - i + 1) / i;
  }
  return c;
}

// Compute the absolute Optimal K-Centers by brute-force evaluation of all nCk subsets.
// Warning: ensure nCk <= 100000 before calling this in UI to avoid blocking the main thread.
export const findOptimalCenters = (points: PointContext[], k: number) => {
  if (k <= 0) return { optimalCenters: [], optimalRadius: 0 };
  if (k >= points.length) return { optimalCenters: points, optimalRadius: 0 };

  let minMaxRadius = Infinity;
  let bestCenters: PointContext[] = [];

  const currentComb: PointContext[] = [];
  
  // Fast backtracking generating index combinations directly
  const backtrack = (startIndex: number) => {
    if (currentComb.length === k) {
      const radius = computeCoverageRadius(points, currentComb);
      if (radius < minMaxRadius) {
        minMaxRadius = radius;
        // save copy of combination
        bestCenters = [...currentComb];
      }
      return;
    }
    
    for (let i = startIndex; i < points.length; i++) {
        // Prune if not enough elements remain to complete 'k' size
        if (currentComb.length + (points.length - i) < k) break;
        currentComb.push(points[i]);
        backtrack(i + 1);
        currentComb.pop();
    }
  };
  
  backtrack(0);

  return { optimalCenters: bestCenters, optimalRadius: minMaxRadius };
}
