import { useRef, useState, useEffect } from 'react'
import { CanvasSimulator } from './components/CanvasSimulator'
import { ControlPanel } from './components/ControlPanel'
import { Documentation } from './components/Documentation'
import { useKCenterSimulator } from './hooks/useKCenterSimulator'
import { clsx } from 'clsx'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export default function App() {
  const simulator = useKCenterSimulator()
  
  const simulationRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Track native fullscreen changes (e.g. user pressing ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (!document.fullscreenElement) {
         setSidebarCollapsed(false) // always open sidebar when exiting fullscreen
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      simulationRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

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
          
          <section id="intro" className="py-16 md:py-24 max-w-3xl mx-auto text-center space-y-6 scroll-mt-20">
              <div className="inline-flex space-x-2 text-xs font-semibold mb-4">
                  <span className="bg-error/20 text-error px-2 py-1 rounded-full border border-error/20">NP-Hard</span>
                  <span className="bg-success/20 text-success px-2 py-1 rounded-full border border-success/20">2-Approximation</span>
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">Optimal Combinatorial</span>
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
              <div className="flex items-center gap-4 mb-6 max-w-4xl mx-auto">
                 <div className="h-px bg-white/10 flex-1"></div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Comparison Engine</h2>
                 <div className="h-px bg-white/10 flex-1"></div>
              </div>

              {/* Fullscreen capable wrapper */}
              <div 
                  ref={simulationRef} 
                  className={clsx(
                      "bg-surface border border-white/10 p-1 md:p-3 flex transition-all",
                      isFullscreen ? "w-screen h-screen m-0 rounded-none p-0 flex-row overflow-hidden absolute inset-0 z-[100]" : "rounded-2xl shadow-2xl flex-col lg:flex-row gap-4 h-[900px] lg:h-[750px] relative w-full"
                  )}
              >
                  {/* Canvas Container */}
                  <div className={clsx(
                      "flex-1 relative rounded-xl overflow-hidden border border-white/5",
                      isFullscreen ? "h-full w-full rounded-none border-none" : "flex-[2.5]"
                  )}>
                      <CanvasSimulator 
                        {...simulator}
                        toggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                      />
                  </div>
                  
                  {/* Side Controls Container */}
                  <div className={clsx(
                      "transition-all duration-300 ease-in-out border-white/10",
                      isFullscreen ? "absolute right-0 top-0 h-full bg-surface shadow-[-8px_0_32px_rgba(0,0,0,0.8)] border-l z-20" : "flex-1 min-w-[320px]",
                      isFullscreen && sidebarCollapsed ? "translate-x-[100%]" : "translate-x-0",
                      isFullscreen ? "w-[350px]" : "w-full"
                  )}>
                      <ControlPanel 
                         {...simulator} 
                         pointsCount={simulator.points.length} 
                         centersCount={simulator.centers.length} 
                      />

                      {/* Floating Collapse Button (Only visible in Fullscreen mode) */}
                      {isFullscreen && (
                          <button 
                             onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                             className={clsx(
                                 "absolute top-1/2 -translate-y-1/2 -left-8 bg-surface border border-white/10 text-white p-1 rounded-l-lg shadow-[-4px_0_12px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-colors z-30"
                             )}
                          >
                             {sidebarCollapsed ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                          </button>
                      )}
                  </div>
              </div>
          </section>

          {/* Rest of the Documentation */}
          <Documentation />

      </main>
    </div>
  )
}
