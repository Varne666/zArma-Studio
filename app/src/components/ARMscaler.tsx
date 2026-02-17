import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Download, RotateCcw, Zap, Eye,
  AlertCircle, ChevronDown, ChevronUp,
  Server, Cpu, Maximize2, Sparkles
} from 'lucide-react'

type Task = 'sr' | 'face' | 'denoise' | 'unaligned_face'
type Quality = 'turbo' | 'fast' | 'balanced' | 'quality'
type ProcessingState = 'idle' | 'loaded' | 'processing' | 'done' | 'error'

interface ServerStatus {
  available: boolean
  message: string
  gpu: { available: boolean; name: string; vram_gb: number }
  models_downloaded: number
}

interface LogEntry { time: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }

const TASKS: { id: Task; label: string; desc: string; icon: string }[] = [
  { id: 'sr', label: 'Super Resolution', desc: 'Upscale & enhance', icon: '🔍' },
  { id: 'face', label: 'Face + Background', desc: 'Restore faces & scene', icon: '👤' },
  { id: 'unaligned_face', label: 'Face (Aligned)', desc: 'Aligned face crops', icon: '🎭' },
  { id: 'denoise', label: 'Denoise', desc: 'Remove noise & grain', icon: '✨' },
]

const QUALITY_OPTIONS: { id: Quality; label: string; steps: number; desc: string }[] = [
  { id: 'turbo', label: 'Turbo', steps: 8, desc: '~30-60s' },
  { id: 'fast', label: 'Fast', steps: 15, desc: '~1-2min' },
  { id: 'balanced', label: 'Balanced', steps: 25, desc: '~2-4min' },
  { id: 'quality', label: 'Quality', steps: 40, desc: '~5-10min' },
]

const UPSCALE_OPTIONS = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
]

const ac = '#f59e0b'

export default function ARMscaler() {
  const [state, setState] = useState<ProcessingState>('idle')
  const [task, setTask] = useState<Task>('sr')
  const [quality, setQuality] = useState<Quality>('turbo')
  const [upscale, setUpscale] = useState(4)
  const [originalUrl, setOriginalUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [resultSize, setResultSize] = useState({ w: 0, h: 0 })
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement>(null)
  const compRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-50), { time: new Date().toLocaleTimeString(), message, type }])
  }, [])

  // Check server status
  useEffect(() => {
    fetch('/api/armscaler-status').then(r => r.json()).then(s => {
      setServerStatus(s)
      if (s.available) addLog(`ARMscaler ready — GPU: ${s.gpu?.name || 'CPU'}`, 'success')
      else addLog(`Setup needed: ${s.message}`, 'warn')
    }).catch(() => addLog('Backend not responding', 'error'))
  }, [addLog])

  const isReady = serverStatus?.available ?? false

  // Handle file upload
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setOriginalUrl(url)
      setResultUrl('')
      setState('loaded')
      setProgress(0)
      const img = new window.Image()
      img.onload = () => {
        setOriginalSize({ w: img.width, h: img.height })
        addLog(`Loaded: ${file.name} (${img.width}×${img.height})`)
        if (canvasRef.current) {
          canvasRef.current.width = img.width
          canvasRef.current.height = img.height
          canvasRef.current.getContext('2d')?.drawImage(img, 0, 0)
        }
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }, [addLog])

  // Process image
  const processImage = useCallback(async () => {
    if (!originalUrl || !isReady) return
    setState('processing')
    setProgress(5)
    addLog(`Starting ARMscaler — Task: ${task} | Upscale: ${upscale}× | Quality: ${quality}`)

    try {
      setProgress(10)
      addLog('Uploading image to server...')

      const imageBase64 = originalUrl.split(',')[1]
      setProgress(15)

      addLog(`Running DiffBIR inference (${quality} mode)...`)
      const response = await fetch('/api/armscaler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, task, upscale, quality })
      })

      setProgress(80)

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setProgress(90)

      addLog('Loading result...')
      const resultDataUrl = `data:image/png;base64,${data.imageBase64}`
      setResultUrl(resultDataUrl)

      // Get result dimensions
      const img = new window.Image()
      img.onload = () => {
        setResultSize({ w: img.width, h: img.height })
        addLog(`Result: ${img.width}×${img.height} (${upscale}× upscale)`, 'success')
        if (resultCanvasRef.current) {
          resultCanvasRef.current.width = img.width
          resultCanvasRef.current.height = img.height
          resultCanvasRef.current.getContext('2d')?.drawImage(img, 0, 0)
        }
      }
      img.src = resultDataUrl

      setProgress(100)
      setState('done')
      addLog('ARMscaler complete!', 'success')
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error')
      setState('error')
    }
  }, [originalUrl, isReady, task, upscale, quality, addLog])

  // Download result
  const downloadResult = useCallback(() => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `armscaler_${task}_${upscale}x.png`
    a.click()
  }, [resultUrl, task, upscale])

  // Reset
  const resetAll = useCallback(() => {
    setState('idle'); setOriginalUrl(''); setResultUrl('')
    setProgress(0); setLogs([]); setSliderPos(50)
  }, [])

  // Comparison slider handlers
  const handleSliderMove = useCallback((clientX: number) => {
    if (!compRef.current) return
    const rect = compRef.current.getBoundingClientRect()
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setSliderPos(pos)
  }, [])

  const dropStyle: React.CSSProperties = {
    border: `2px dashed ${isReady ? '#555' : '#f59e0b'}`,
    borderRadius: '16px', padding: '40px', textAlign: 'center', cursor: 'pointer',
    background: isReady ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.05)',
    transition: 'all 0.3s'
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <Maximize2 size={20} color={ac} />
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: ac }}>ARMscaler</span>
          {isReady && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Cpu size={10} /> {serverStatus?.gpu?.name || 'Ready'}</span>}
          {serverStatus && !isReady && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600 }}>SETUP NEEDED</span>}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>DiffBIR-powered image restoration & upscaling</div>

        {/* Setup instructions */}
        {serverStatus && !isReady && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, marginBottom: '6px' }}>First-time setup required:</div>
            <div style={{ marginBottom: '6px', fontSize: '0.78rem', color: '#ccc' }}>
              Run this in your <code style={{ background: '#222', padding: '1px 6px', borderRadius: '3px', color: '#fff' }}>app/backend</code> folder:
            </div>
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#f59e0b', userSelect: 'all' }}>
              bash setup_armscaler.sh
            </div>
            <span style={{ display: 'block', marginTop: '4px', fontSize: '0.72rem', color: '#888' }}>
              Downloads ~7GB of AI models. Then restart: <code style={{ background: '#222', padding: '1px 4px', borderRadius: '3px', color: '#fff' }}>node server.js</code>
            </span>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {state !== 'done' && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          {/* Task selector */}
          <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '12px', border: '1px solid #333' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '8px', fontWeight: 600 }}>Task</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {TASKS.map(t => (
                <button key={t.id} onClick={() => setTask(t.id)} style={{
                  padding: '8px 12px', borderRadius: '8px', border: task === t.id ? `1px solid ${ac}` : '1px solid #333',
                  background: task === t.id ? 'rgba(245,158,11,0.1)' : '#222', color: task === t.id ? ac : '#aaa',
                  cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600
                }}>
                  {t.icon} {t.label}
                  <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: 400, marginTop: '2px' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Upscale + Quality */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '12px', border: '1px solid #333' }}>
              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '8px', fontWeight: 600 }}>Upscale</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {UPSCALE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setUpscale(o.value)} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: upscale === o.value ? `1px solid ${ac}` : '1px solid #333',
                    background: upscale === o.value ? 'rgba(245,158,11,0.1)' : '#222',
                    color: upscale === o.value ? ac : '#aaa', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem'
                  }}>{o.label}</button>
                ))}
              </div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '12px', border: '1px solid #333' }}>
              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '8px', fontWeight: 600 }}>Quality</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {QUALITY_OPTIONS.map(q => (
                  <button key={q.id} onClick={() => setQuality(q.id)} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: quality === q.id ? `1px solid ${ac}` : '1px solid #333',
                    background: quality === q.id ? 'rgba(245,158,11,0.1)' : '#222',
                    color: quality === q.id ? ac : '#aaa', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem'
                  }}>
                    {q.label}
                    <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '2px' }}>{q.steps} steps</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Image display */}
      {state === 'idle' && (
        <div style={dropStyle}
          onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
          onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { if (i.files?.[0]) handleFile(i.files[0]) }; i.click() }}
        >
          <Upload size={40} color={isReady ? '#666' : '#f59e0b'} style={{ marginBottom: '12px' }} />
          <div style={{ color: '#aaa', fontWeight: 600 }}>Drop image here or click to upload</div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>Supports JPG, PNG, WebP</div>
        </div>
      )}

      {/* Preview */}
      {(state === 'loaded' || state === 'processing') && originalUrl && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', marginBottom: '16px' }}>
          <img src={originalUrl} alt="preview" style={{ width: '100%', display: 'block' }} />
          <div style={{ padding: '8px 12px', background: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>Input: {originalSize.w}×{originalSize.h} → Output: {originalSize.w * upscale}×{originalSize.h * upscale}</span>
            <button onClick={processImage} disabled={state === 'processing' || !isReady} style={{
              padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: state === 'processing' || !isReady ? 'not-allowed' : 'pointer',
              background: state === 'processing' ? '#333' : `linear-gradient(135deg, ${ac}, #d97706)`,
              color: state === 'processing' ? '#888' : '#000', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {state === 'processing' ? <><Sparkles size={14} className="animate-spin" /> Processing...</> : <><Zap size={14} /> Enhance</>}
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {state === 'processing' && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${ac}, #d97706)`, transition: 'width 0.5s', borderRadius: '2px' }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px', textAlign: 'center' }}>
            {progress < 15 ? 'Uploading...' : progress < 80 ? `Running DiffBIR inference (${quality} mode)...` : 'Loading result...'}
          </div>
        </div>
      )}

      {/* Result: Before/After comparison */}
      {state === 'done' && resultUrl && (
        <div style={{ marginBottom: '16px' }}>
          <div ref={compRef} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', cursor: 'col-resize', userSelect: 'none' }}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={e => { if (isDragging) handleSliderMove(e.clientX) }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
          >
            {/* Result (full) */}
            <img src={resultUrl} alt="result" style={{ width: '100%', display: 'block' }} />
            {/* Original (clipped) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: `${sliderPos}%`, height: '100%', overflow: 'hidden' }}>
              <img src={originalUrl} alt="original" style={{ width: compRef.current?.offsetWidth || '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            {/* Slider line */}
            <div style={{ position: 'absolute', top: 0, left: `${sliderPos}%`, width: '2px', height: '100%', background: ac, transform: 'translateX(-50%)' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '32px', height: '32px', borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                <Eye size={14} color="#000" />
              </div>
            </div>
            {/* Labels */}
            <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.7)', fontSize: '0.7rem', color: '#fff' }}>Original ({originalSize.w}×{originalSize.h})</div>
            <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', borderRadius: '4px', background: `rgba(245,158,11,0.8)`, fontSize: '0.7rem', color: '#000', fontWeight: 700 }}>ARMscaler ({resultSize.w}×{resultSize.h})</div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
            <button onClick={downloadResult} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${ac}, #d97706)`, color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Download Result
            </button>
            <button onClick={resetAll} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#ccc', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={14} /> New Image
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
          <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '12px' }}>Processing failed</div>
          {!isReady && <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '12px' }}>Run <code style={{ background: '#222', padding: '1px 6px', borderRadius: '3px' }}>bash setup_armscaler.sh</code> in backend folder</div>}
          <button onClick={resetAll} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#333', color: '#ccc', cursor: 'pointer', fontWeight: 600 }}><RotateCcw size={14} /> Try Again</button>
        </div>
      )}

      {/* Logs */}
      <div style={{ marginTop: '16px' }}>
        <button onClick={() => setShowLogs(!showLogs)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 0' }}>
          <Server size={12} /> Logs {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showLogs && (
          <div style={{ maxHeight: '200px', overflow: 'auto', background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '8px 12px', marginTop: '4px', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {logs.map((l, i) => (
              <div key={i} style={{ color: l.type === 'error' ? '#ef4444' : l.type === 'success' ? '#10b981' : l.type === 'warn' ? '#f59e0b' : '#666', marginBottom: '2px' }}>
                <span style={{ color: '#444' }}>{l.time}</span> {l.message}
              </div>
            ))}
            {logs.length === 0 && <div style={{ color: '#444' }}>No logs yet</div>}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={resultCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}
