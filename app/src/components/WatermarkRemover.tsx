import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Download, RotateCcw, Eye, Wand2,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Maximize2, MousePointer2, Eraser, Brain
} from 'lucide-react'

interface WatermarkRegion { x: number; y: number; w: number; h: number; confidence: number; label: string }
interface LogEntry { time: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }
type DetectionMode = 'auto' | 'manual'
type ProcessingState = 'idle' | 'loaded' | 'detecting' | 'processing' | 'done' | 'error'
interface ServerStatus { available: boolean; python: string|null; model: boolean; engine: string }

const SCAN_REGIONS = [
  { name: 'bottom-left', xRatio: 0, yRatio: 0.88, wRatio: 0.35, hRatio: 0.12 },
  { name: 'bottom-right', xRatio: 0.65, yRatio: 0.88, wRatio: 0.35, hRatio: 0.12 },
  { name: 'bottom-center', xRatio: 0.25, yRatio: 0.90, wRatio: 0.50, hRatio: 0.10 },
  { name: 'top-left', xRatio: 0, yRatio: 0, wRatio: 0.30, hRatio: 0.08 },
  { name: 'top-right', xRatio: 0.70, yRatio: 0, wRatio: 0.30, hRatio: 0.08 },
]
const MASK_PADDING = 3

function analyzeRegion(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
  const data = ctx.getImageData(rx, ry, rw, rh).data; const pixels = rw * rh
  if (pixels < 100) return { score: 0, tightBounds: null }
  const lums: number[] = []
  for (let i = 0; i < data.length; i += 4) lums.push(0.299*data[i]+0.587*data[i+1]+0.114*data[i+2])
  const mean = lums.reduce((a,b)=>a+b,0)/lums.length
  const stddev = Math.sqrt(lums.reduce((a,b)=>a+(b-mean)**2,0)/lums.length)
  let edgePixels = 0; const edgeMap: boolean[] = new Array(pixels).fill(false)
  for (let y=1;y<rh-1;y++) for (let x=1;x<rw-1;x++) { const idx=y*rw+x; if(Math.abs(lums[idx+1]-lums[idx-1])+Math.abs(lums[idx+rw]-lums[idx-rw])>25){edgePixels++;edgeMap[idx]=true} }
  const edgeRatio=edgePixels/pixels; let score=0
  if(edgeRatio>0.02&&edgeRatio<0.30)score+=edgeRatio*3; if(stddev>10&&stddev<80)score+=0.3
  let clustered=0; for(let y=1;y<rh-1;y++)for(let x=1;x<rw-1;x++){const idx=y*rw+x;if(edgeMap[idx]&&[idx-1,idx+1,idx-rw,idx+rw].some(n=>edgeMap[n]))clustered++}
  if(edgePixels>0&&clustered/edgePixels>0.4)score+=0.2
  let minX=rw,maxX=0,minY=rh,maxY=0
  for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)if(edgeMap[y*rw+x]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  const tightBounds=maxX>minX&&maxY>minY?{x:rx+minX-MASK_PADDING,y:ry+minY-MASK_PADDING,w:maxX-minX+MASK_PADDING*2,h:maxY-minY+MASK_PADDING*2}:null
  return {score,tightBounds}
}

function detectWatermarks(canvas: HTMLCanvasElement): WatermarkRegion[] {
  const ctx=canvas.getContext('2d')!;const W=canvas.width,H=canvas.height;const results: WatermarkRegion[]=[]
  for(const r of SCAN_REGIONS){const rx=Math.floor(r.xRatio*W),ry=Math.floor(r.yRatio*H),rw=Math.floor(r.wRatio*W),rh=Math.floor(r.hRatio*H);const a=analyzeRegion(ctx,rx,ry,rw,rh);if(a.score>0.25&&a.tightBounds){const b=a.tightBounds;results.push({x:Math.max(0,b.x),y:Math.max(0,b.y),w:Math.min(b.w,W-b.x),h:Math.min(b.h,H-b.y),confidence:Math.min(a.score,1),label:r.name})}}
  return results.sort((a,b)=>b.confidence-a.confidence)
}

export default function WatermarkRemover() {
  const [state,setState]=useState<ProcessingState>('idle')
  const [serverStatus,setServerStatus]=useState<ServerStatus|null>(null)
  const [originalImage,setOriginalImage]=useState<HTMLImageElement|null>(null)
  const [originalUrl,setOriginalUrl]=useState('');const [processedUrl,setProcessedUrl]=useState('')
  const [detectedRegions,setDetectedRegions]=useState<WatermarkRegion[]>([])
  const [selectedRegionIdx,setSelectedRegionIdx]=useState(0)
  const [progress,setProgress]=useState(0);const [logs,setLogs]=useState<LogEntry[]>([])
  const [showLogs,setShowLogs]=useState(true);const [comparisonPos,setComparisonPos]=useState(50)
  const [isDraggingSlider,setIsDraggingSlider]=useState(false)
  const [detectionMode,setDetectionMode]=useState<DetectionMode>('auto');const [fileName,setFileName]=useState('')
  const [isDrawing,setIsDrawing]=useState(false)
  const [manualRect,setManualRect]=useState<{startX:number;startY:number;x:number;y:number;w:number;h:number}|null>(null)
  const canvasRef=useRef<HTMLCanvasElement>(null);const previewCanvasRef=useRef<HTMLCanvasElement>(null);const comparisonRef=useRef<HTMLDivElement>(null)

  const addLog=useCallback((msg:string,type:LogEntry['type']='info')=>{
    const time=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})
    setLogs(prev=>[...prev,{time,message:msg,type}])
  },[])

  useEffect(()=>{fetch('/api/inpaint-status').then(r=>r.json()).then(d=>setServerStatus(d)).catch(()=>setServerStatus({available:false,python:null,model:false,engine:'none'}))},[])

  const resetAll=useCallback(()=>{setState('idle');setOriginalImage(null);setOriginalUrl('');setProcessedUrl('');setDetectedRegions([]);setSelectedRegionIdx(0);setProgress(0);setLogs([]);setComparisonPos(50);setManualRect(null);setFileName('')},[])

  const handleFile=useCallback((file:File)=>{
    if(!file.type.startsWith('image/')){addLog('Invalid file type.','error');return}
    if(file.size>50*1024*1024){addLog('File too large.','error');return}
    setLogs([]);setProcessedUrl('');setDetectedRegions([]);setManualRect(null);setFileName(file.name)
    addLog(`Loading: ${file.name} (${(file.size/1024).toFixed(1)} KB)`)
    const reader=new FileReader();reader.onload=e=>{const img=new Image();img.onload=()=>{setOriginalImage(img);setOriginalUrl(e.target!.result as string);setState('loaded');addLog(`Loaded: ${img.width}\u00d7${img.height}px`,'success');if(canvasRef.current){canvasRef.current.width=img.width;canvasRef.current.height=img.height;canvasRef.current.getContext('2d')!.drawImage(img,0,0)}};img.src=e.target!.result as string};reader.readAsDataURL(file)
  },[addLog])

  const handleDrop=useCallback((e:React.DragEvent)=>{e.preventDefault();e.stopPropagation();const f=e.dataTransfer.files[0];if(f)handleFile(f)},[handleFile])
  const handleDragOver=useCallback((e:React.DragEvent)=>{e.preventDefault();e.stopPropagation()},[])

  const runDetection=useCallback(()=>{
    if(!canvasRef.current)return;setState('detecting');setProgress(10);addLog('Scanning...')
    requestAnimationFrame(()=>{const regions=detectWatermarks(canvasRef.current!);setDetectedRegions(regions);setSelectedRegionIdx(0);setProgress(30);if(regions.length>0){addLog(`Found ${regions.length} region(s):`,'success');regions.forEach((r,i)=>addLog(`  [${i+1}] ${r.label} \u2014 ${r.w}\u00d7${r.h}px (${(r.confidence*100).toFixed(0)}%)`))}else addLog('No watermarks found. Try manual selection.','warn');setState('loaded')})
  },[addLog])

  const handlePreviewMouseDown=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{if(detectionMode!=='manual'||!previewCanvasRef.current||!originalImage)return;const rect=previewCanvasRef.current.getBoundingClientRect();const sx=originalImage.width/rect.width,sy=originalImage.height/rect.height;setIsDrawing(true);setManualRect({startX:(e.clientX-rect.left)*sx,startY:(e.clientY-rect.top)*sy,x:(e.clientX-rect.left)*sx,y:(e.clientY-rect.top)*sy,w:0,h:0})},[detectionMode,originalImage])
  const handlePreviewMouseMove=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{if(!isDrawing||!manualRect||!previewCanvasRef.current||!originalImage)return;const rect=previewCanvasRef.current.getBoundingClientRect();const sx=originalImage.width/rect.width,sy=originalImage.height/rect.height;const cx=(e.clientX-rect.left)*sx,cy=(e.clientY-rect.top)*sy;setManualRect(p=>p?{...p,x:Math.min(p.startX,cx),y:Math.min(p.startY,cy),w:Math.abs(cx-p.startX),h:Math.abs(cy-p.startY)}:null)},[isDrawing,manualRect,originalImage])
  const handlePreviewMouseUp=useCallback(()=>{if(!isDrawing||!manualRect)return;setIsDrawing(false);if(manualRect.w>10&&manualRect.h>10){const r:WatermarkRegion={x:Math.round(manualRect.x),y:Math.round(manualRect.y),w:Math.round(manualRect.w),h:Math.round(manualRect.h),confidence:1,label:'manual'};setDetectedRegions([r]);setSelectedRegionIdx(0);addLog(`Manual: ${r.w}\u00d7${r.h}px`,'success')}},[isDrawing,manualRect,addLog])

  useEffect(()=>{
    if(!previewCanvasRef.current||!originalImage)return
    const c=previewCanvasRef.current,ctx=c.getContext('2d')!,scale=Math.min(800/originalImage.width,1)
    c.width=originalImage.width*scale;c.height=originalImage.height*scale;ctx.drawImage(originalImage,0,0,c.width,c.height)
    detectedRegions.forEach((r,i)=>{ctx.strokeStyle=i===selectedRegionIdx?'#a855f7':'#ff336680';ctx.lineWidth=i===selectedRegionIdx?3:1.5;ctx.setLineDash([6,3]);ctx.strokeRect(r.x*scale,r.y*scale,r.w*scale,r.h*scale);ctx.setLineDash([]);ctx.fillStyle=i===selectedRegionIdx?'#a855f7':'#ff3366';ctx.font='bold 12px sans-serif';ctx.fillText(`${r.label} (${(r.confidence*100).toFixed(0)}%)`,r.x*scale+4,r.y*scale-5)})
    if(isDrawing&&manualRect&&manualRect.w>0){ctx.strokeStyle='#00ff88';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.strokeRect(manualRect.x*scale,manualRect.y*scale,manualRect.w*scale,manualRect.h*scale);ctx.setLineDash([])}
  },[originalImage,detectedRegions,selectedRegionIdx,isDrawing,manualRect])

  const processImage=useCallback(async()=>{
    if(!canvasRef.current||detectedRegions.length===0||!originalImage)return
    if(!serverStatus?.available){addLog('LaMa not ready. Run: bash setup_watermark.sh in backend folder','error');setState('error');return}
    setState('processing');setProgress(0)
    canvasRef.current.width=originalImage.width;canvasRef.current.height=originalImage.height;canvasRef.current.getContext('2d')!.drawImage(originalImage,0,0)
    const region=detectedRegions[selectedRegionIdx];addLog(`Region: ${region.label} (${region.w}\u00d7${region.h}px)`)
    addLog('Sending to LaMa AI inpainting engine...');setProgress(15)
    try{
      const imageBase64=canvasRef.current.toDataURL('image/png');setProgress(25);addLog('Image uploaded, running LaMa inference (512\u00d7512)...')
      const response=await fetch('/api/inpaint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageBase64,mask:{x:region.x,y:region.y,w:region.w,h:region.h,padding:3}})})
      setProgress(80)
      if(!response.ok){const err=await response.json();throw new Error(err.error||'Server failed')}
      const result=await response.json();setProgress(95)
      addLog(`Engine: ${result.engine||'lama-onnx'}`)
      const img=new Image()
      img.onload=()=>{canvasRef.current!.getContext('2d')!.drawImage(img,0,0);setProcessedUrl(result.imageBase64);setProgress(100);setState('done');addLog('LaMa inpainting complete! Pixel-perfect result.','success')}
      img.onerror=()=>{addLog('Failed to load result image','error');setState('error')}
      img.src=result.imageBase64
    }catch(err:any){addLog(`Error: ${err.message}`,'error');setState('error')}
  },[detectedRegions,selectedRegionIdx,originalImage,serverStatus,addLog])

  const downloadImage=useCallback(()=>{if(!processedUrl)return;const a=document.createElement('a');a.href=processedUrl;a.download=`${(fileName.replace(/\.[^.]+$/,'')||'image')}_clean.png`;a.click();addLog('Downloaded!','success')},[processedUrl,fileName,addLog])

  const handleSliderMove=useCallback((e:React.MouseEvent|React.TouchEvent)=>{if(!isDraggingSlider||!comparisonRef.current)return;const rect=comparisonRef.current.getBoundingClientRect();const clientX='touches' in e?e.touches[0].clientX:e.clientX;setComparisonPos(Math.max(0,Math.min(100,((clientX-rect.left)/rect.width)*100)))},[isDraggingSlider])
  useEffect(()=>{const up=()=>setIsDraggingSlider(false);window.addEventListener('mouseup',up);window.addEventListener('touchend',up);return()=>{window.removeEventListener('mouseup',up);window.removeEventListener('touchend',up)}},[])

  const ac='#10b981'
  const isReady = serverStatus?.available
  const needsPython = serverStatus && !serverStatus.python
  const needsModel = serverStatus && serverStatus.python && !serverStatus.model

  return (
    <div style={{maxWidth:'900px',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'20px',padding:'16px',background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'12px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'6px'}}>
          <Eraser size={20} color={ac}/>
          <span style={{fontSize:'1.1rem',fontWeight:700,color:ac}}>Watermark Remover</span>
          {isReady && <span style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:'20px',background:'rgba(16,185,129,0.15)',color:ac,fontWeight:600,display:'flex',alignItems:'center',gap:'3px'}}><Brain size={10}/> LaMa AI</span>}
          {serverStatus && !isReady && <span style={{fontSize:'0.65rem',padding:'2px 8px',borderRadius:'20px',background:'rgba(239,68,68,0.15)',color:'#ef4444',fontWeight:600}}>SETUP NEEDED</span>}
        </div>
        <p style={{fontSize:'0.8rem',color:'#888',margin:0}}>
          {isReady ? 'Powered by LaMa AI \u2014 the same neural network inpainting engine used by Gemini Watermark Remover. 100% local.' : 'LaMa AI inpainting engine needs setup.'}
        </p>

        {/* Setup instructions when not ready */}
        {serverStatus && !isReady && (
          <div style={{marginTop:'12px',padding:'12px 16px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:'10px',textAlign:'left'}}>
            <div style={{fontSize:'0.85rem',fontWeight:700,color:'#f59e0b',marginBottom:'8px'}}>One-Time Setup Required</div>
            <div style={{fontSize:'0.8rem',color:'#ccc',lineHeight:'1.8'}}>
              <div style={{marginBottom:'6px'}}>Run this in your <code style={{background:'#222',padding:'1px 6px',borderRadius:'3px',color:'#fff'}}>app/backend</code> folder:</div>
              <div style={{background:'#111',border:'1px solid #333',borderRadius:'6px',padding:'10px 14px',fontFamily:'monospace',fontSize:'0.8rem',color:'#10b981',marginBottom:'8px',userSelect:'all'}}>
                bash setup_watermark.sh
              </div>
              <div style={{fontSize:'0.75rem',color:'#888'}}>
                This will:
                {needsPython && <span style={{display:'block',color:'#f59e0b'}}>\u2022 Install Python deps (onnxruntime, numpy, Pillow)</span>}
                {needsModel && <span style={{display:'block',color:'#f59e0b'}}>\u2022 Download LaMa ONNX model (~208MB from HuggingFace)</span>}
                {!needsPython && !needsModel && <>
                  <span style={{display:'block',color:'#f59e0b'}}>\u2022 Install: pip install onnxruntime numpy Pillow</span>
                  <span style={{display:'block',color:'#f59e0b'}}>\u2022 Download: LaMa ONNX model (~208MB)</span>
                </>}
                <span style={{display:'block',marginTop:'4px'}}>Then restart the backend: <code style={{background:'#222',padding:'1px 4px',borderRadius:'3px',color:'#fff'}}>node server.js</code></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{display:'none'}}/>

      {state==='idle'&&(<div onDrop={handleDrop} onDragOver={handleDragOver} onClick={()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=e=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleFile(f)};i.click()}} style={{border:`2px dashed ${isReady?'rgba(16,185,129,0.4)':'rgba(245,158,11,0.4)'}`,borderRadius:'16px',padding:'60px 40px',textAlign:'center',cursor:'pointer',background:isReady?'rgba(16,185,129,0.03)':'rgba(245,158,11,0.03)',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=isReady?ac:'#f59e0b';e.currentTarget.style.background=isReady?'rgba(16,185,129,0.08)':'rgba(245,158,11,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor=isReady?'rgba(16,185,129,0.4)':'rgba(245,158,11,0.4)';e.currentTarget.style.background=isReady?'rgba(16,185,129,0.03)':'rgba(245,158,11,0.03)'}}>
        <Upload size={48} color={isReady?ac:'#f59e0b'} style={{marginBottom:'16px',opacity:0.7}}/><div style={{fontSize:'1.1rem',fontWeight:600,color:'#ccc',marginBottom:'8px'}}>Drop an image here or click to browse</div><div style={{fontSize:'0.85rem',color:'#666'}}>PNG, JPG, WebP &bull; Max 50MB</div>
        {!isReady && <div style={{marginTop:'12px',fontSize:'0.8rem',color:'#f59e0b'}}>Setup required before processing (you can still load images)</div>}
      </div>)}

      {(state==='loaded'||state==='detecting')&&originalImage&&(<div>
        <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
          <button onClick={()=>{setDetectionMode('auto');setManualRect(null)}} style={{flex:1,padding:'10px',borderRadius:'8px',border:`1px solid ${detectionMode==='auto'?ac:'#333'}`,background:detectionMode==='auto'?'rgba(16,185,129,0.15)':'#1a1a1a',color:detectionMode==='auto'?ac:'#888',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><Wand2 size={16}/> Auto Detect</button>
          <button onClick={()=>{setDetectionMode('manual');setDetectedRegions([])}} style={{flex:1,padding:'10px',borderRadius:'8px',border:`1px solid ${detectionMode==='manual'?'#f59e0b':'#333'}`,background:detectionMode==='manual'?'rgba(245,158,11,0.15)':'#1a1a1a',color:detectionMode==='manual'?'#f59e0b':'#888',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><MousePointer2 size={16}/> Manual Select</button>
        </div>
        <div style={{position:'relative',background:'#111',borderRadius:'12px',border:'1px solid #333',overflow:'hidden',marginBottom:'12px'}}>
          <canvas ref={previewCanvasRef} style={{display:'block',width:'100%',height:'auto',cursor:detectionMode==='manual'?'crosshair':'default'}} onMouseDown={handlePreviewMouseDown} onMouseMove={handlePreviewMouseMove} onMouseUp={handlePreviewMouseUp}/>
          {detectionMode==='manual'&&detectedRegions.length===0&&(<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.7)',padding:'10px 20px',borderRadius:'8px',fontSize:'0.85rem',color:'#f59e0b',pointerEvents:'none'}}>Click and drag to select watermark area</div>)}
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
          {detectionMode==='auto'&&(<button onClick={runDetection} style={{flex:1,padding:'12px',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.9rem',background:ac,color:'white',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}><Eye size={16}/> Scan for Watermarks</button>)}
          <button onClick={processImage} disabled={detectedRegions.length===0||!isReady} style={{flex:1,padding:'12px',borderRadius:'8px',border:'none',cursor:detectedRegions.length>0&&isReady?'pointer':'not-allowed',fontWeight:600,fontSize:'0.9rem',background:detectedRegions.length>0&&isReady?'linear-gradient(135deg,#a855f7,#6366f1)':'#333',color:detectedRegions.length>0&&isReady?'white':'#666',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:detectedRegions.length>0&&isReady?1:0.5}}>
            <Brain size={16}/> {isReady ? 'Remove with LaMa AI' : 'Setup Required'}
          </button>
          <button onClick={resetAll} style={{padding:'12px',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#888',cursor:'pointer'}} title="Reset"><RotateCcw size={16}/></button>
        </div>
        {detectedRegions.length>1&&(<div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'}}>{detectedRegions.map((r,i)=>(<button key={i} onClick={()=>setSelectedRegionIdx(i)} style={{padding:'6px 12px',borderRadius:'6px',fontSize:'0.8rem',fontWeight:600,cursor:'pointer',border:`1px solid ${i===selectedRegionIdx?'#a855f7':'#333'}`,background:i===selectedRegionIdx?'rgba(168,85,247,0.2)':'#1a1a1a',color:i===selectedRegionIdx?'#a855f7':'#888'}}>{r.label} ({(r.confidence*100).toFixed(0)}%)</button>))}</div>)}
      </div>)}

      {state==='processing'&&(<div style={{textAlign:'center',padding:'40px'}}>
        <div style={{width:48,height:48,border:'3px solid #333',borderTopColor:ac,borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}/>
        <div style={{fontSize:'1rem',fontWeight:600,marginBottom:'8px',color:'#ccc'}}>LaMa AI Inpainting...</div>
        <div style={{fontSize:'0.8rem',color:'#888',marginBottom:'16px'}}>Neural network processing at 512\u00d7512 \u2022 Fourier convolutions</div>
        <div style={{background:'#222',borderRadius:'8px',height:'8px',overflow:'hidden',maxWidth:'400px',margin:'0 auto'}}><div style={{height:'100%',background:`linear-gradient(90deg,${ac},#a855f7)`,borderRadius:'8px',width:`${progress}%`,transition:'width 0.3s ease'}}/></div>
        <div style={{fontSize:'0.85rem',color:'#888',marginTop:'8px'}}>{progress}%</div>
      </div>)}

      {state==='done'&&originalUrl&&processedUrl&&(<div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'16px'}}><CheckCircle size={20} color={ac}/><span style={{fontSize:'1rem',fontWeight:600,color:ac}}>Watermark Removed (LaMa AI)</span></div>
        <div ref={comparisonRef} style={{position:'relative',borderRadius:'12px',overflow:'hidden',border:'1px solid #333',cursor:'ew-resize',userSelect:'none',marginBottom:'16px'}} onMouseDown={()=>setIsDraggingSlider(true)} onTouchStart={()=>setIsDraggingSlider(true)} onMouseMove={handleSliderMove} onTouchMove={handleSliderMove}>
          <img src={processedUrl} style={{display:'block',width:'100%',height:'auto'}} alt="Processed" draggable={false}/>
          <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',clipPath:`inset(0 ${100-comparisonPos}% 0 0)`}}><img src={originalUrl} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}} alt="Original" draggable={false}/></div>
          <div style={{position:'absolute',top:0,bottom:0,left:`${comparisonPos}%`,width:'3px',background:'white',transform:'translateX(-50%)',boxShadow:'0 0 8px rgba(0,0,0,0.5)'}}><div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'36px',height:'36px',borderRadius:'50%',background:'white',border:'2px solid #333',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.3)'}}><Maximize2 size={16} color="#333"/></div></div>
          <div style={{position:'absolute',top:'10px',left:'10px',background:'rgba(0,0,0,0.7)',color:'#ff6b6b',padding:'4px 10px',borderRadius:'4px',fontSize:'0.75rem',fontWeight:700}}>ORIGINAL</div>
          <div style={{position:'absolute',top:'10px',right:'10px',background:'rgba(0,0,0,0.7)',color:ac,padding:'4px 10px',borderRadius:'4px',fontSize:'0.75rem',fontWeight:700}}>CLEANED</div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={downloadImage} style={{flex:2,padding:'14px',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:700,fontSize:'1rem',background:`linear-gradient(135deg,${ac},#059669)`,color:'white',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}><Download size={18}/> Download Cleaned Image</button>
          <button onClick={resetAll} style={{flex:1,padding:'14px',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#ccc',cursor:'pointer',fontWeight:600,fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><RotateCcw size={16}/> Process Another</button>
        </div>
      </div>)}

      {state==='error'&&(<div style={{textAlign:'center',padding:'30px'}}><AlertCircle size={40} color="#ef4444" style={{marginBottom:'12px'}}/><div style={{color:'#ef4444',fontWeight:600,marginBottom:'12px'}}>Processing failed</div>{!isReady&&<div style={{color:'#f59e0b',fontSize:'0.85rem',marginBottom:'12px'}}>Run <code style={{background:'#222',padding:'1px 6px',borderRadius:'3px'}}>bash setup_watermark.sh</code> in backend folder</div>}<button onClick={resetAll} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'#333',color:'#ccc',cursor:'pointer',fontWeight:600}}><RotateCcw size={14}/> Try Again</button></div>)}

      {logs.length>0&&(<div style={{marginTop:'20px',background:'#111',border:'1px solid #222',borderRadius:'10px',overflow:'hidden'}}>
        <button onClick={()=>setShowLogs(!showLogs)} style={{width:'100%',padding:'10px 16px',background:'none',border:'none',color:'#888',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'0.8rem',fontWeight:600}}><span>Log ({logs.length})</span>{showLogs?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>
        {showLogs&&(<div style={{maxHeight:'200px',overflowY:'auto',padding:'0 16px 12px',fontFamily:'monospace',fontSize:'0.75rem',lineHeight:'1.8'}}>{logs.map((l,i)=>(<div key={i} style={{color:l.type==='success'?'#10b981':l.type==='error'?'#ef4444':l.type==='warn'?'#f59e0b':'#888'}}><span style={{color:'#555'}}>[{l.time}]</span> {l.message}</div>))}</div>)}
      </div>)}
    </div>
  )
}
