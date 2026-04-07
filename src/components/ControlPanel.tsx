import React, { useState } from 'react'
import type { Mode } from '../hooks/useKCenterSimulator'
import { Play, Pause, SkipForward, SkipBack, RotateCcw, MousePointer2, Sparkles, Hash, Crosshair, HelpCircle } from 'lucide-react'

interface ControlPanelProps {
  mode: Mode
  setMode: (mode: Mode) => void
  k: number
  setK: (k: number) => void
  pointsCount: number
  centersCount: number
  isPlaying: boolean
  togglePlay: () => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
  generateRandomPoints: (count: number, w: number, h: number) => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  setMode,
  k,
  setK,
  pointsCount,
  centersCount,
  isPlaying,
  togglePlay,
  nextStep,
  prevStep,
  reset,
  generateRandomPoints
}) => {
  const isAuto = mode === 'auto'
  
  // Local state for the random node generator input
  const [randomCount, setRandomCount] = useState<number>(15)

  const getStatusMessage = () => {
    if (pointsCount === 0) return "Add points to begin"
    if (centersCount < k) return isAuto ? (isPlaying ? "Finding next farthest point..." : "Paused. Press play or next step.") : "Select a point to be a center"
    return `Max ${k} centers reached.`
  }

  return (
    <div className="flex flex-col bg-surface p-5 border border-white/5 rounded-xl space-y-6 text-sm text-text h-full shadow-lg">
      
      {/* HEADER -> hidden in embedded style to use space efficiently, or keep minimal */}
      <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white mb-1">Simulator Controls</h2>
          <p className="text-text-muted text-xs">Configure the K-Center properties and step through the algorithm.</p>
      </div>

      {/* MODE TOGGLE */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Interaction Mode</label>
        <div className="flex bg-background rounded-lg p-1">
          <button 
            onClick={() => { setMode('manual'); reset() }}
            className={`flex-1 flex justify-center items-center space-x-2 py-2 rounded-md transition-all ${!isAuto ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'}`}
          >
            <MousePointer2 size={16} />
            <span>Manual</span>
          </button>
          <button 
            onClick={() => { setMode('auto'); reset() }}
            className={`flex-1 flex justify-center items-center space-x-2 py-2 rounded-md transition-all ${isAuto ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'}`}
          >
            <Sparkles size={16} />
            <span>Auto</span>
          </button>
        </div>
      </div>

      {/* K VALUE SETTING */}
      <div className="space-y-3 bg-background p-4 rounded-xl border border-white/5 shadow-inner">
        <div className="flex justify-between flex-row items-center">
            <label className="text-sm font-semibold flex items-center gap-2 text-white">
                <Hash size={16} className="text-primary" /> Centers Limit (k)
            </label>
            <span className="bg-primary/20 text-primary font-bold px-3 py-1 rounded shadow-sm">{k}</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={k} 
          onChange={(e) => setK(parseInt(e.target.value))}
          className="w-full accent-primary bg-surface outline-none h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* AUTO ANIMATION CONTROLS */}
      {isAuto && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Algorithm Playback</label>
          <div className="flex gap-2 justify-between">
            <button 
              onClick={prevStep}
              className="flex-1 bg-background hover:bg-surface border border-white/10 p-2 rounded-lg flex justify-center items-center transition-colors"
              title="Previous Step"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={togglePlay}
              className="flex-[2] bg-primary hover:bg-primary-dark text-white p-2 rounded-lg flex justify-center items-center space-x-2 transition-colors shadow-lg shadow-primary/20"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="font-semibold">{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button 
              onClick={nextStep}
              className="flex-1 bg-background hover:bg-surface border border-white/10 p-2 rounded-lg flex justify-center items-center transition-colors"
              title="Next Step"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      )}

      {/* CANVAS UTILITIES */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Canvas Operations</label>
        
        {/* Random Generator Block */}
        <div className="flex items-stretch gap-2 bg-background p-2 rounded-lg border border-white/5">
            <input 
                type="number"
                min="1"
                max="500"
                value={randomCount}
                onChange={(e) => setRandomCount(parseInt(e.target.value) || 0)}
                className="w-16 bg-surface text-center rounded text-white border border-white/10 focus:border-primary outline-none py-1"
            />
            <button 
               onClick={() => generateRandomPoints(randomCount, 800, 600)}
               className="flex-1 bg-surface hover:bg-white/5 border border-white/5 rounded flex items-center justify-center transition-colors gap-2"
            >
               <Crosshair size={16} className="text-success" />
               <span className="font-medium text-white">Generate Nodes</span>
            </button>
        </div>

        <button 
            onClick={reset}
            className="w-full bg-background hover:bg-error/10 border border-white/5 hover:border-error/30 text-white p-2 rounded-lg flex items-center justify-center transition-all gap-2 py-3"
        >
            <RotateCcw size={16} className={centersCount > 0 ? "text-error" : "text-text-muted"} />
            <span className="text-sm font-medium">Reset Selection</span>
        </button>
      </div>

      <div className="flex-grow"></div>

      {/* LIVE INFO PANEL */}
      <div className="bg-background rounded-xl p-4 space-y-3 border border-white/5 relative overflow-hidden mt-4">
        <div className="absolute top-0 right-0 p-2 opacity-[0.03]">
           <HelpCircle size={80} />
        </div>
        <h3 className="font-semibold text-white relative z-10 flex items-center gap-2 mb-3">
            Status Monitor
        </h3>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div>
            <div className="text-xs text-text-muted mb-1 uppercase tracking-wider">Nodes</div>
            <div className="text-xl font-mono text-white">{pointsCount}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1 uppercase tracking-wider">Centers</div>
            <div className="text-xl font-mono">
              <span className="text-success">{centersCount}</span>
              <span className="text-text-muted"> / {k}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
            <div className="text-xs text-text-muted mb-1 uppercase tracking-wider">Current Action</div>
            <div className="text-sm font-semibold text-primary">{getStatusMessage()}</div>
        </div>
      </div>

    </div>
  )
}
