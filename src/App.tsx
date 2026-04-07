import { CanvasSimulator } from './components/CanvasSimulator'
import { ControlPanel } from './components/ControlPanel'
import { Documentation } from './components/Documentation'
import { useKCenterSimulator } from './hooks/useKCenterSimulator'

export default function App() {
  const simulator = useKCenterSimulator()

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/10 shadow-lg px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="bg-primary text-white rounded px-2 py-0.5 text-sm uppercase">K-C</span>
            Visualizer
        </h1>
        <div className="hidden md:flex space-x-6 text-sm font-medium text-text-muted">
            <a href="#intro" className="hover:text-white transition-colors">Definition</a>
            <a href="#simulation" className="hover:text-primary transition-colors">Simulation</a>
            <a href="#math" className="hover:text-white transition-colors">Math</a>
            <a href="#algorithm" className="hover:text-white transition-colors">Algorithm</a>
            <a href="#proof" className="hover:text-white transition-colors">Proof</a>
            <a href="#examples" className="hover:text-white transition-colors">Examples</a>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8">
          
          {/* Header & Introduction Section */}
          <section id="intro" className="py-16 md:py-24 max-w-3xl mx-auto text-center space-y-6 scroll-mt-20">
              <div className="inline-flex space-x-2 text-xs font-semibold mb-4">
                  <span className="bg-error/20 text-error px-2 py-1 rounded-full border border-error/20">NP-Hard</span>
                  <span className="bg-success/20 text-success px-2 py-1 rounded-full border border-success/20">2-Approximation</span>
                  <span className="bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/20">Greedy Method</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">K-Center</span> Problem
              </h1>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                  You are given a map of cities and need to place exactly <b><span className="text-primary">k</span></b> hospitals. 
                  Where do you place them so that the person who lives <i>farthest</i> from their nearest hospital travels the <i>shortest</i> possible distance?
              </p>
          </section>

          {/* Interactive Simulation Block */}
          <section id="simulation" className="scroll-mt-24 mb-16">
              <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
                 <div className="h-px bg-white/10 flex-1"></div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Simulation</h2>
                 <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="bg-surface border border-white/10 rounded-2xl p-1 md:p-3 shadow-2xl flex flex-col lg:flex-row gap-4 h-[750px] lg:h-[650px]">
                  {/* Canvas Container */}
                  <div className="flex-[3] relative rounded-xl overflow-hidden border border-white/5">
                      <CanvasSimulator 
                        points={simulator.points}
                        centers={simulator.centers}
                        farthestPoint={simulator.farthestPoint}
                        mode={simulator.mode}
                        addPoint={simulator.addPoint}
                        deletePoint={simulator.deletePoint}
                        toggleCenter={simulator.toggleCenter}
                        movePoint={simulator.movePoint}
                      />
                  </div>
                  
                  {/* Side Controls Container */}
                  <div className="flex-[1] min-w-[300px]">
                      <ControlPanel 
                        mode={simulator.mode}
                        setMode={simulator.setMode}
                        k={simulator.k}
                        setK={simulator.setK}
                        pointsCount={simulator.points.length}
                        centersCount={simulator.centers.length}
                        isPlaying={simulator.isPlaying}
                        togglePlay={simulator.togglePlay}
                        nextStep={simulator.nextStep}
                        prevStep={simulator.prevStep}
                        reset={simulator.reset}
                        generateRandomPoints={simulator.generateRandomPoints}
                      />
                  </div>
              </div>
          </section>

          {/* Rest of the Documentation */}
          <Documentation />

      </main>
      
    </div>
  )
}
