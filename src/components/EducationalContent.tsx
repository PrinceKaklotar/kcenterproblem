import React from 'react'

export const EducationalContent: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 bg-surface text-text font-sans scroll-smooth">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">K-Center Problem</h1>
        <p className="text-text-muted text-sm uppercase tracking-wider font-semibold">Approximation Algorithms</p>
      </div>

      <section className="space-y-3 relative">
        <div className="absolute -left-3 top-2 bottom-2 w-1 bg-primary rounded-full"></div>
        <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
        <p className="text-gray-300 leading-relaxed">
          The K-Center Problem asks us to choose <strong className="text-primary">k</strong> centers from a given set of locations in such a way that the maximum distance from any location to its nearest center is minimized.
        </p>
        <div className="bg-background/50 p-4 rounded-lg border border-white/5 text-sm">
          <i>"Choose <b>k</b> centers such that the maximum distance to nearest center is minimized."</i>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. Interactive Simulation</h2>
        <p className="text-gray-300 leading-relaxed">
          Use the canvas on the right to place points dynamically. You can watch the Greedy Algorithm automatically select the optimal centers, or manually select them to see how the coverage changes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Mathematical Formulation</h2>
        <p className="text-gray-300 leading-relaxed">
          Let <span className="font-mono text-primary-dark opacity-90">P</span> be the set of points and <span className="font-mono text-success opacity-90">C</span> be the set of selected centers.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>
            <b>Distance to center:</b><br />
            <code className="bg-black/30 px-2 py-1 rounded text-primary text-xs mt-1 inline-block">distance(p, C) = min(dist(p, c) for c in C)</code>
          </li>
          <li>
            <b>Objective:</b><br />
            <code className="bg-black/30 px-2 py-1 rounded text-error text-xs mt-1 inline-block">minimize max(distance(p, C) for p in P)</code>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Greedy Algorithm</h2>
        <p className="text-gray-300 leading-relaxed">
          The problem is NP-Hard, meaning finding the perfect optimal solution is computationally too slow for large datasets. Instead, we use a fast <b>Greedy Algorithm</b>.
        </p>
        <div className="bg-background/80 p-4 rounded-lg text-sm text-gray-200 border border-white/10 overflow-x-auto shadow-inner">
          <ol className="list-decimal pl-4 space-y-2 font-mono">
            <li>Select an arbitrary point as the first center.</li>
            <li>For every point, compute its distance to the nearest existing center.</li>
            <li>Find the point with the <strong className="text-error">maximum</strong> of these minimum distances (the farthest point).</li>
            <li>Add this point as the next center.</li>
            <li>Repeat steps 2-4 until <strong className="text-primary">k</strong> centers are chosen.</li>
          </ol>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">5. Approximation Idea</h2>
        <p className="text-gray-300 leading-relaxed">
          This simple greedy approach is incredibly powerful. It guarantees a <b>2-approximation</b>. 
          This means the maximum distance produced by this algorithm will never be more than twice the optimal possible minimum coverage radius.
        </p>
      </section>

      <section className="space-y-3 mb-8">
        <h2 className="text-xl font-semibold text-white">6. Applications</h2>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="bg-surface border border-white/10 p-3 rounded shadow-sm hover:border-primary transition-colors">
            <h3 className="font-bold text-white mb-1">Facility Location</h3>
            <p className="text-gray-400">Placing fire stations or hospitals to minimize the maximum response time for any neighborhood.</p>
          </div>
          <div className="bg-surface border border-white/10 p-3 rounded shadow-sm hover:border-primary transition-colors">
            <h3 className="font-bold text-white mb-1">Clustering</h3>
            <p className="text-gray-400">Grouping data points in machine learning where we want to ensure tight bounds on cluster radius.</p>
          </div>
          <div className="bg-surface border border-white/10 p-3 rounded shadow-sm hover:border-primary transition-colors">
            <h3 className="font-bold text-white mb-1">Network Design</h3>
            <p className="text-gray-400">Placing cache servers so that no user experiences excessive latency.</p>
          </div>
        </div>
      </section>
      
      <div className="h-10"></div>
    </div>
  )
}
