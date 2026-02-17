import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Save, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Star, 
  Download,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Eye,
  EyeOff,
  X,
  Palette,
  EyeIcon,
  Cpu,
  Camera,
  SunMedium,
  Ratio,
  FileJson,
  FileText,
  Layers,
  Zap,
  Eraser,
  Maximize2,
} from 'lucide-react'
import WatermarkRemover from './components/WatermarkRemover'
import ARMscaler from './components/ARMscaler'

interface PromptData {
  id: string
  prompt: string
  metadata: {
    engine?: string
    ethnicity: string
    age: string
    mode: string
    skinTone?: string
    timestamp: string
  }
  favorite: boolean
  createdAt: string
}

const ethnicities = [
  'custom',
  'ukrainian', 'russian', 'polish', 'czech', 'hungarian', 
  'romanian', 'bulgarian', 'serbian', 'croatian', 'slovenian',
  'slovak', 'belarusian', 'lithuanian', 'latvian', 'estonian',
  'german', 'french', 'italian', 'spanish', 'portuguese',
  'dutch', 'belgian', 'swiss', 'austrian', 'swedish',
  'norwegian', 'danish', 'finnish', 'british', 'irish',
  'mexican', 'brazilian', 'colombian', 'argentinian', 'venezuelan',
  'chilean', 'peruvian', 'ecuadorian', 'guatemalan', 'cuban',
  'dominican', 'puerto rican', 'salvadoran', 'honduran', 'nicaraguan',
  'costa rican', 'panamanian', 'bolivian', 'paraguayan', 'uruguayan'
]

const skinTones = [
  'custom',
  'porcelain', 'fair', 'light', 'beige', 'medium', 'olive', 
  'tan', 'brown', 'dark brown', 'ebony', 'golden', 'bronze', 'caramel'
]

const ages = [
  'custom',
  '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
]

const heights = [
  'custom',
  '4ft 10in (147cm)', '4ft 11in (150cm)', '5ft 0in (152cm)', 
  '5ft 1in (155cm)', '5ft 2in (157cm)', '5ft 3in (160cm)',
  '5ft 4in (163cm)', '5ft 5in (165cm)', '5ft 6in (168cm)',
  '5ft 7in (170cm)', '5ft 8in (173cm)', '5ft 9in (175cm)',
  '5ft 10in (178cm)', '5ft 11in (180cm)', '6ft 0in (183cm)',
  '6ft 1in (185cm)'
]

const eyeColors = [
  'custom',
  'blue', 'green', 'hazel', 'brown', 'grey', 'amber', 'violet'
]

const hairColors = [
  'custom',
  'blonde', 'brunette', 'black', 'red', 'auburn', 'chestnut', 
  'platinum blonde', 'dirty blonde', 'ash blonde', 'jet black',
  'honey blonde', 'strawberry blonde', 'silver', 'grey'
]

const bodyTypes = [
  'custom',
  'skinny', 'slim', 'petite', 'fit', 'athletic', 'toned',
  'curvy', 'thick', 'voluptuous', 'chubby', 'bbw', 'average'
]

const backgrounds = [
  'custom',
  'bedroom', 'bathroom', 'kitchen', 'living room', 'gym',
  'car interior', 'beach', 'poolside', 'hotel room', 'dressing room',
  'mirror selfie', 'outdoor patio', 'balcony', 'closet', 'shower'
]

const fitTypes = [
  'custom',
  'casual streetwear', 'athleisure', 'lingerie', 'swimwear',
  'formal dress', 'cocktail dress', 'crop top and shorts',
  'tank top and leggings', 'oversized sweater', 'bodysuit',
  'sports bra and shorts', 'yoga pants and tank', 'jeans and t-shirt',
  'mini skirt and top', 'robe', 'towel only', 'pajamas',
  'tight leggings and crop top', 'booty shorts and tank', 'micro skirt'
]

const breastSizesSimple = [
  'custom',
  'extra small', 'small', 'average-medium', 'above average', 
  'large', 'extra large', 'massive'
]

const bootySizes = [
  'custom',
  'extra small', 'small', 'average-medium', 'above average',
  'large', 'extra large', 'massive'
]

const pussyTypes = [
  'custom',
  'innie', 'outie', 'puffy', 'smooth', 'natural bush',
  'detailed', 'tight', 'spread'
]

const visibilityOptions = [
  { value: 'hide', label: 'Hide', icon: '🚫', desc: 'Covered/Blocked' },
  { value: 'tease', label: 'Tease', icon: '👀', desc: 'Suggestive peek' },
  { value: 'show', label: 'Show', icon: '👁️', desc: 'Fully visible' },
  { value: 'seductive', label: 'Seductive', icon: '🔥', desc: 'Explicit pose' }
]

// ── NBP3-Specific Options ──
const nbpPromptStyles = [
  { value: 'selfie', label: 'Selfie' },
  { value: 'mirror_selfie', label: 'Mirror Selfie' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'fashion_snapshot', label: 'Fashion Snapshot' },
  { value: 'candid', label: 'Candid' },
  { value: 'full_body', label: 'Full Body' }
]

const nbpCameraDevices = [
  { value: 'custom', label: 'Custom' },
  { value: 'iPhone 15 Pro', label: 'iPhone 15 Pro' },
  { value: 'iPhone 14 Pro', label: 'iPhone 14 Pro' },
  { value: 'Samsung Galaxy S24', label: 'Samsung Galaxy S24' },
  { value: 'Canon PowerShot', label: 'Canon PowerShot (Y2K)' },
  { value: 'Sony A7 IV', label: 'Sony A7 IV (Pro)' },
  { value: 'DSLR Generic', label: 'DSLR Generic' },
  { value: 'Generic Smartphone', label: 'Generic Smartphone' }
]

const nbpAesthetics = [
  { value: 'custom', label: 'Custom' },
  { value: 'casual_instagram', label: 'Casual Instagram' },
  { value: 'y2k_flash', label: 'Y2K Flash' },
  { value: 'golden_hour', label: 'Golden Hour' },
  { value: 'nightclub', label: 'Nightclub / Club' },
  { value: 'studio_editorial', label: 'Studio Editorial' },
  { value: 'candid_lifestyle', label: 'Candid Lifestyle' },
  { value: 'flash_snapshot', label: 'Flash Snapshot' },
  { value: 'natural_daylight', label: 'Natural Daylight' }
]

const nbpAspectRatios = [
  { value: '3:4', label: '3:4 Portrait' },
  { value: '4:5', label: '4:5 Instagram' },
  { value: '9:16', label: '9:16 Story/Reel' },
  { value: '2:3', label: '2:3 Classic' },
  { value: '16:9', label: '16:9 Wide' },
  { value: '1:1', label: '1:1 Square' }
]

const nbpDetailLevels = [
  { value: 'standard', label: 'Standard' },
  { value: 'ultra', label: 'Ultra Detailed' },
  { value: 'maximum', label: 'Maximum (ControlNet)' }
]


function App() {
  // ── Engine State ──
  const [engine, setEngine] = useState<'zimage' | 'nbp3' | 'watermark' | 'armscaler'>('zimage')

  // ── Shared Config ──
  const [ethnicity, setEthnicity] = useState('ukrainian')
  const [customEthnicity, setCustomEthnicity] = useState('')
  const [skinTone, setSkinTone] = useState('beige')
  const [customSkinTone, setCustomSkinTone] = useState('')
  const [age, setAge] = useState('22')
  const [customAge, setCustomAge] = useState('')
  
  const [height, setHeight] = useState('5ft 6in (168cm)')
  const [customHeight, setCustomHeight] = useState('')
  const [eyeColor, setEyeColor] = useState('blue')
  const [customEyeColor, setCustomEyeColor] = useState('')
  const [hairColor, setHairColor] = useState('blonde')
  const [customHairColor, setCustomHairColor] = useState('')
  const [bodyType, setBodyType] = useState('fit')
  const [customBodyType, setCustomBodyType] = useState('')
  const [background, setBackground] = useState('bedroom')
  const [customBackground, setCustomBackground] = useState('')
  const [fitType, setFitType] = useState('tight leggings and crop top')
  const [customFitType, setCustomFitType] = useState('')
  
  // ── NSFW Config ──
  const [breastSizeMode, setBreastSizeMode] = useState<'simple' | 'advanced'>('simple')
  const [breastSizeSimple, setBreastSizeSimple] = useState('large')
  const [breastSizeAdvanced, setBreastSizeAdvanced] = useState('')
  const [bootySize, setBootySize] = useState('large')
  const [customBootySize, setCustomBootySize] = useState('')
  const [pussyType, setPussyType] = useState('innie')
  const [customPussyType, setCustomPussyType] = useState('')
  
  const [breastVisibility, setBreastVisibility] = useState('show')
  const [bootyVisibility, setBootyVisibility] = useState('show')
  const [pussyVisibility, setPussyVisibility] = useState('hide')

  // ── NBP3-Specific Config ──
  const [nbpOutputFormat, setNbpOutputFormat] = useState<'prose' | 'json'>('prose')
  const [nbpPromptStyle, setNbpPromptStyle] = useState('selfie')
  const [nbpCameraDevice, setNbpCameraDevice] = useState('iPhone 15 Pro')
  const [nbpCameraDeviceCustom, setNbpCameraDeviceCustom] = useState('')
  const [customNbpCameraDevice, _setCustomNbpCameraDevice] = useState('')
  const [nbpAesthetic, setNbpAesthetic] = useState('casual_instagram')
  const [nbpAestheticCustom, setNbpAestheticCustom] = useState('')
  const [customNbpAesthetic, _setCustomNbpAesthetic] = useState('')
  const [nbpAspectRatio, setNbpAspectRatio] = useState('4:5')
  const [nbpIncludeNegative, setNbpIncludeNegative] = useState(true)
  const [nbpDetailLevel, setNbpDetailLevel] = useState('ultra')
  
  // ── App State ──
  const [mode, setMode] = useState<'sfw' | 'nsfw'>('sfw')
  const [loading, setLoading] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [history, setHistory] = useState<PromptData[]>([])
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [activeTab, setActiveTab] = useState<'all' | 'sfw' | 'nsfw' | 'favorites'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNsfwConfirm, setShowNsfwConfirm] = useState(false)
  const [nsfwConfirmed, setNsfwConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PromptData | null>(null)
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: '', visible: false})

  useEffect(() => {
    checkOllama()
    loadHistory()
    const interval = setInterval(checkOllama, 10000)
    return () => clearInterval(interval)
  }, [])

  const showToast = (message: string) => {
    setToast({message, visible: true})
    setTimeout(() => setToast({message: '', visible: false}), 2000)
  }

  const checkOllama = async () => {
    try {
      const res = await fetch('/api/ollama-status')
      if (res.ok) {
        setOllamaStatus('connected')
      } else {
        setOllamaStatus('disconnected')
      }
    } catch {
      setOllamaStatus('disconnected')
    }
  }

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const getValue = (value: string, customValue: string) => {
    return value === 'custom' ? customValue : value
  }

  const getBreastSize = () => {
    if (breastSizeMode === 'advanced') {
      return breastSizeAdvanced || '32C'
    }
    return getValue(breastSizeSimple, 'large')
  }

  const renderVisibilityControl = (label: string, value: string, onChange: (v: string) => void) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ff3366', marginBottom: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <EyeIcon size={12} /> {label} Visibility
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {visibilityOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '6px 4px',
              border: `1px solid ${value === opt.value ? '#ff3366' : '#333'}`,
              background: value === opt.value ? 'rgba(255, 51, 102, 0.2)' : '#1a1a1a',
              color: value === opt.value ? '#ff3366' : '#888',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s'
            }}
            title={opt.desc}
          >
            <span style={{ fontSize: '1rem' }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '2px', fontStyle: 'italic' }}>
        {visibilityOptions.find(o => o.value === value)?.desc}
      </div>
    </div>
  )

  const generatePrompt = async (similar: boolean = false) => {
    setLoading(true)
    try {
      const resolvedNbpCameraDevice = nbpCameraDevice === 'custom'
        ? (customNbpCameraDevice.trim() || 'Generic Smartphone')
        : nbpCameraDevice

      const resolvedNbpAesthetic = nbpAesthetic === 'custom'
        ? (customNbpAesthetic.trim() || 'casual_instagram')
        : nbpAesthetic

      const params: Record<string, any> = {
        engine,
        ethnicity: getValue(ethnicity, customEthnicity),
        skinTone: getValue(skinTone, customSkinTone),
        age: getValue(age, customAge),
        height: getValue(height, customHeight),
        eyeColor: getValue(eyeColor, customEyeColor),
        hairColor: getValue(hairColor, customHairColor),
        bodyType: getValue(bodyType, customBodyType),
        background: getValue(background, customBackground),
        fitType: getValue(fitType, customFitType),
        mode,
        previousPrompt: similar ? currentPrompt : undefined
      }

      if (mode === 'nsfw') {
        Object.assign(params, {
          breastSize: getBreastSize(),
          bootySize: getValue(bootySize, customBootySize),
          pussyType: getValue(pussyType, customPussyType),
          breastVisibility,
          bootyVisibility,
          pussyVisibility
        })
      }

      // Add NBP3-specific params
      if (engine === 'nbp3') {
        Object.assign(params, {
          nbpOutputFormat,
          nbpPromptStyle,
          nbpCameraDevice: resolvedNbpCameraDevice,
          nbpAesthetic: resolvedNbpAesthetic,
          nbpAspectRatio,
          nbpIncludeNegative,
          nbpDetailLevel
        })
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (res.ok) {
        const data = await res.json()
        setCurrentPrompt(data.prompt)
      } else {
        alert('Failed to generate prompt. Is Ollama running?')
      }
    } catch (error) {
      alert('Error connecting to backend')
    } finally {
      setLoading(false)
    }
  }

  const savePrompt = async () => {
    if (!currentPrompt) return
    
    try {
      const resolvedNbpCameraDevice = nbpCameraDevice === 'custom'
        ? (customNbpCameraDevice.trim() || 'Generic Smartphone')
        : nbpCameraDevice

      const resolvedNbpAesthetic = nbpAesthetic === 'custom'
        ? (customNbpAesthetic.trim() || 'casual_instagram')
        : nbpAesthetic

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          metadata: { 
            engine,
            ethnicity: getValue(ethnicity, customEthnicity), 
            age: getValue(age, customAge), 
            mode, 
            skinTone: getValue(skinTone, customSkinTone),
            ...(engine === 'nbp3' && {
              nbpOutputFormat,
              nbpPromptStyle,
              nbpCameraDevice: resolvedNbpCameraDevice,
              nbpAesthetic: resolvedNbpAesthetic,
              nbpAspectRatio
            }),
            timestamp: new Date().toISOString() 
          }
        })
      })
      
      if (res.ok) {
        loadHistory()
        showToast('Prompt saved!')
      }
    } catch (error) {
      alert('Failed to save')
    }
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt)
    setCopied(true)
    showToast('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyHistoryPrompt = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!')
  }

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/favorite/${id}`, { method: 'PUT' })
      loadHistory()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const deletePrompt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this prompt?')) return
    
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
      loadHistory()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const exportPrompts = () => {
    window.open('/api/export', '_blank')
  }

  const handleModeChange = (newMode: 'sfw' | 'nsfw') => {
    if (newMode === 'nsfw') {
      if (!nsfwConfirmed) {
        setShowNsfwConfirm(true)
      } else {
        setMode('nsfw')
      }
    } else {
      setMode('sfw')
    }
  }

  const confirmNsfw = () => {
    setNsfwConfirmed(true)
    setMode('nsfw')
    setShowNsfwConfirm(false)
  }

  const openHistoryItem = (item: PromptData) => {
    setSelectedHistoryItem(item)
  }

  const closeHistoryModal = () => {
    setSelectedHistoryItem(null)
  }

  const filteredHistory = history.filter(item => {
    if (activeTab === 'favorites' && !item.favorite) return false
    if (activeTab !== 'all' && activeTab !== 'favorites' && item.metadata?.mode !== activeTab) return false
    if (searchQuery && !item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const renderSelect = (label: string, value: string, onChange: (v: string) => void, options: string[], customValue: string, onCustomChange: (v: string) => void, placeholder: string) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', marginBottom: '4px', display: 'block' }}>{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem' }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt === 'custom' ? 'Custom...' : opt}
          </option>
        ))}
      </select>
      {value === 'custom' && (
        <input
          type="text"
          placeholder={placeholder}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          style={{ marginTop: '4px', width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '0.8rem' }}
        />
      )}
    </div>
  )

  const isGenerateDisabled = () => {
    if (loading || ollamaStatus !== 'connected') return true
    if (ethnicity === 'custom' && !customEthnicity) return true
    if (skinTone === 'custom' && !customSkinTone) return true
    if (age === 'custom' && !customAge) return true
    if (height === 'custom' && !customHeight) return true
    if (eyeColor === 'custom' && !customEyeColor) return true
    if (hairColor === 'custom' && !customHairColor) return true
    if (bodyType === 'custom' && !customBodyType) return true
    if (background === 'custom' && !customBackground) return true
    if (fitType === 'custom' && !customFitType) return true
    if (mode === 'nsfw') {
      if (breastSizeMode === 'advanced' && !breastSizeAdvanced) return true
      if (bootySize === 'custom' && !customBootySize) return true
      if (pussyType === 'custom' && !customPussyType) return true
    }
    return false
  }

  // Helper to get engine badge color
  const getEngineBadgeStyle = (eng?: string) => {
    if (eng === 'nbp3') return { background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)' }
    if (eng === 'armscaler') return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }
    return { background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.4)' }
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
        .config-section { background: #111; padding: 16px; border-radius: 12px; border: 1px solid #222; margin-bottom: 12px; }
        .full-width { grid-column: 1 / -1; }
        @media (max-width: 1200px) { .config-grid { grid-template-columns: 1fr; } }
        .main-layout { display: grid; grid-template-columns: 320px 1fr 360px; gap: 20px; }
        @media (max-width: 1200px) { .main-layout { grid-template-columns: 280px 1fr; } .history-panel { display: none; } }
        @media (max-width: 768px) { .main-layout { grid-template-columns: 1fr; } }
        .output-box { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; min-height: 200px; max-height: 600px; overflow-y: auto; line-height: 1.6; font-size: 0.9rem; white-space: pre-wrap; }
        .btn { background: #ff3366; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; transition: opacity 0.2s; }
        .btn:hover:not(:disabled) { opacity: 0.9; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #333; }
        .btn-success { background: #22c55e; }
        .btn-nbp3 { background: #a855f7; }
        .btn-nbp3:hover:not(:disabled) { background: #9333ea; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
        .tab { padding: 6px 12px; border-radius: 4px; border: none; background: #222; color: #888; cursor: pointer; font-size: 0.8rem; }
        .tab.active { background: #ff3366; color: white; }
        .history-item { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.2s; }
        .history-item:hover { border-color: #555; }
        .history-item.favorite { border-left: 3px solid #ff3366; }
        .badges { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
        .badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: #333; display: inline-flex; align-items: center; gap: 4px; }
        .badge-sfw { background: #1e40af; color: white; }
        .badge-nsfw { background: #be123c; color: white; }
        .badge-engine { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px; }
        .history-text { font-size: 0.8rem; color: #aaa; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-content { background: #1a1a1a; border: 1px solid #444; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 20px; }
        .icon-btn { background: none; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 4px; }
        .icon-btn:hover { color: #fff; background: #333; }
        .icon-btn.active { color: #ff3366; }
        .toast { position: fixed; bottom: 20px; right: 20px; background: #22c55e; color: white; padding: 12px 16px; border-radius: 6px; display: flex; align-items: center; gap: 8px; z-index: 200; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .engine-toggle { display: flex; background: #1a1a1a; border-radius: 10px; border: 1px solid #333; padding: 3px; gap: 3px; }
        .engine-btn { flex: 1; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .engine-btn.zimage { background: transparent; color: #888; }
        .engine-btn.zimage.active { background: linear-gradient(135deg, #ff3366, #ff6b6b); color: white; box-shadow: 0 2px 12px rgba(255, 51, 102, 0.4); }
        .engine-btn.nbp3 { background: transparent; color: #888; }
        .engine-btn.nbp3.active { background: linear-gradient(135deg, #a855f7, #6366f1); color: white; box-shadow: 0 2px 12px rgba(168, 85, 247, 0.4); }
        .engine-btn.watermark { background: transparent; color: #888; }
        .engine-btn.watermark.active { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 2px 12px rgba(16, 185, 129, 0.4); }
        .engine-btn.armscaler { background: transparent; color: #888; }
        .engine-btn.armscaler.active { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; box-shadow: 0 2px 12px rgba(245, 158, 11, 0.4); }
        .engine-btn.nbpgen { background: transparent; color: #888; }
        .engine-btn.nbpgen.active { background: linear-gradient(135deg, #c8ff00, #8ab800); color: #000; box-shadow: 0 2px 12px rgba(200, 255, 0, 0.4); }
        .nbp3-section { background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .nbp3-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #a855f7; margin-bottom: 4px; display: block; font-weight: 600; }
        .nbp3-select { width: 100%; padding: 6px 8px; borderRadius: 6px; border: 1px solid rgba(168,85,247,0.3); background: #1a1a1a; color: #fff; font-size: 0.85rem; }
        .nbp3-toggle-row { display: flex; gap: 4px; margin-bottom: 8px; }
        .nbp3-toggle-btn { flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #888; cursor: pointer; font-size: 0.75rem; font-weight: 600; text-align: center; transition: all 0.2s; }
        .nbp3-toggle-btn.active { border-color: #a855f7; background: rgba(168,85,247,0.2); color: #a855f7; }
      `}</style>

      {toast.visible && (
        <div className="toast">
          <CheckCircle size={16} />
          {toast.message}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{
            margin: '0 0 6px',
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)'
          }}>
            zArma Studio
          </h1>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#fff',
            opacity: 0.85,
            textShadow: '0 2px 8px rgba(0,0,0,0.85)'
          }}>
            {engine === 'zimage' || engine === 'nbp3'
              ? 'by Varne | Local LLM-Powered Prompt Engineering Machine'
              : 'by Varne | Local LLM-Powered Machine'}
          </p>
        
        {/* ── Engine Toggle ── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="engine-toggle" style={{ maxWidth: '940px', width: '100%' }}>
            <button 
              className={`engine-btn zimage ${engine === 'zimage' ? 'active' : ''}`}
              onClick={() => setEngine('zimage')}
            >
              <Zap size={16} /> Z-Image Turbo
            </button>
            <button 
              className={`engine-btn nbp3 ${engine === 'nbp3' ? 'active' : ''}`}
              onClick={() => setEngine('nbp3')}
            >
              <Cpu size={16} /> Nano Banana Pro 3
            </button>
            <button 
              className={`engine-btn watermark ${engine === 'watermark' ? 'active' : ''}`}
              onClick={() => setEngine('watermark')}
            >
              <Eraser size={16} /> WM Remover
            </button>
            <button 
              className={`engine-btn armscaler ${engine === 'armscaler' ? 'active' : ''}`}
              onClick={() => setEngine('armscaler')}
            >
              <Maximize2 size={16} /> ARMscaler
            </button>
          </div>
        </div>
      </div>

      {/* ═══ WATERMARK REMOVER VIEW ═══ */}
      {engine === 'watermark' && (
        <WatermarkRemover />
      )}

      {/* ═══ ARMSCALER VIEW ═══ */}
      {engine === 'armscaler' && (
        <ARMscaler />
      )}

      {/* ═══ MAIN LAYOUT (Prompt Generators) ═══ */}
      {engine !== 'watermark' && engine !== 'armscaler' && (
      <div className="main-layout">
        
        {/* ═══ LEFT: CONFIG PANEL ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="config-section">
            <h2 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={18} /> Configuration
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: ollamaStatus === 'connected' ? '#22c55e' : '#ef4444', marginBottom: '12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ollamaStatus === 'connected' ? '#22c55e' : '#ef4444' }} />
              {ollamaStatus === 'checking' ? 'Checking Ollama...' : ollamaStatus === 'connected' ? 'Ollama Connected' : 'Ollama Disconnected'}
            </div>

            {/* ── NBP3 Options (shown only when NBP3 engine selected) ── */}
            {engine === 'nbp3' && (
              <div className="nbp3-section">
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#a855f7', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} /> NBP3 Settings
                </div>

                {/* Output Format Toggle */}
                <div style={{ marginBottom: '10px' }}>
                  <label className="nbp3-label"><FileText size={10} style={{ display: 'inline' }} /> Output Format</label>
                  <div className="nbp3-toggle-row">
                    <button className={`nbp3-toggle-btn ${nbpOutputFormat === 'prose' ? 'active' : ''}`} onClick={() => setNbpOutputFormat('prose')}>
                      <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />Prose
                    </button>
                    <button className={`nbp3-toggle-btn ${nbpOutputFormat === 'json' ? 'active' : ''}`} onClick={() => setNbpOutputFormat('json')}>
                      <FileJson size={12} style={{ display: 'inline', marginRight: '4px' }} />JSON
                    </button>
                  </div>
                </div>

                {/* Prompt Style */}
                <div style={{ marginBottom: '10px' }}>
                  <label className="nbp3-label"><Camera size={10} style={{ display: 'inline' }} /> Prompt Style</label>
                  <select value={nbpPromptStyle} onChange={(e) => setNbpPromptStyle(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem' }}>
                    {nbpPromptStyles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Camera Device */}
                <div style={{ marginBottom: '10px' }}>
                  <label className="nbp3-label"><Camera size={10} style={{ display: 'inline' }} /> Camera Device</label>
                  <select value={nbpCameraDevice} onChange={(e) => setNbpCameraDevice(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem' }}>
                    {nbpCameraDevices.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                {nbpCameraDevice === 'custom' && (
                  <input
                    value={nbpCameraDeviceCustom}
                    onChange={(e) => setNbpCameraDeviceCustom(e.target.value)}
                    placeholder="Type your camera device..."
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                )}
                </div>

                {/* Aesthetic */}
                <div style={{ marginBottom: '10px' }}>
                  <label className="nbp3-label"><SunMedium size={10} style={{ display: 'inline' }} /> Aesthetic</label>
                  <select value={nbpAesthetic} onChange={(e) => setNbpAesthetic(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem' }}>
                    {nbpAesthetics.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                {nbpAesthetic === 'custom' && (
                  <input
                    value={nbpAestheticCustom}
                    onChange={(e) => setNbpAestheticCustom(e.target.value)}
                    placeholder="Type your aesthetic..."
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                )}
                </div>

                {/* Aspect Ratio */}
                <div style={{ marginBottom: '10px' }}>
                  <label className="nbp3-label"><Ratio size={10} style={{ display: 'inline' }} /> Aspect Ratio</label>
                  <select value={nbpAspectRatio} onChange={(e) => setNbpAspectRatio(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem' }}>
                    {nbpAspectRatios.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Detail Level */}
                <div style={{ marginBottom: '10px' }}>
                  <label className="nbp3-label"><Layers size={10} style={{ display: 'inline' }} /> Detail Level</label>
                  <div className="nbp3-toggle-row">
                    {nbpDetailLevels.map(d => (
                      <button key={d.value} className={`nbp3-toggle-btn ${nbpDetailLevel === d.value ? 'active' : ''}`} onClick={() => setNbpDetailLevel(d.value)}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Include Negative Prompts */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#a855f7' }}>
                  <input type="checkbox" checked={nbpIncludeNegative} onChange={(e) => setNbpIncludeNegative(e.target.checked)} style={{ accentColor: '#a855f7' }} />
                  <span>Include Negative Prompts</span>
                </div>
              </div>
            )}

            {/* ── Shared Config Grid ── */}
            <div className="config-grid">
              {renderSelect('Ethnicity', ethnicity, setEthnicity, ethnicities, customEthnicity, setCustomEthnicity, 'Enter custom')}
              {renderSelect('Skin Tone', skinTone, setSkinTone, skinTones, customSkinTone, setCustomSkinTone, 'Enter custom')}
              {renderSelect('Age', age, setAge, ages, customAge, setCustomAge, 'Enter custom')}
              {renderSelect('Height', height, setHeight, heights, customHeight, setCustomHeight, 'Enter custom')}
              {renderSelect('Eye Color', eyeColor, setEyeColor, eyeColors, customEyeColor, setCustomEyeColor, 'Enter custom')}
              {renderSelect('Hair Color', hairColor, setHairColor, hairColors, customHairColor, setCustomHairColor, 'Enter custom')}
              {renderSelect('Body Type', bodyType, setBodyType, bodyTypes, customBodyType, setCustomBodyType, 'Enter custom')}
              {renderSelect('Background', background, setBackground, backgrounds, customBackground, setCustomBackground, 'Enter custom')}
              <div className="full-width">
                {renderSelect('Fit/Clothing', fitType, setFitType, fitTypes, customFitType, setCustomFitType, 'Describe outfit')}
              </div>

              {mode === 'nsfw' && (
                <div className="full-width" style={{ borderTop: '1px solid #333', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#ff3366', marginBottom: '12px', fontWeight: 'bold' }}>🔞 NSFW Attributes & Visibility</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ff3366', marginBottom: '6px', fontWeight: 'bold' }}>Breasts</div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.7rem', color: '#888' }}>Size</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setBreastSizeMode('simple')} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', border: breastSizeMode === 'simple' ? '1px solid #ff3366' : '1px solid #333', background: breastSizeMode === 'simple' ? 'rgba(255,51,102,0.2)' : '#222', color: breastSizeMode === 'simple' ? '#ff3366' : '#888', borderRadius: '4px', cursor: 'pointer' }}>Simple</button>
                          <button onClick={() => setBreastSizeMode('advanced')} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', border: breastSizeMode === 'advanced' ? '1px solid #ff3366' : '1px solid #333', background: breastSizeMode === 'advanced' ? 'rgba(255,51,102,0.2)' : '#222', color: breastSizeMode === 'advanced' ? '#ff3366' : '#888', borderRadius: '4px', cursor: 'pointer' }}>Adv</button>
                        </div>
                      </div>
                      {breastSizeMode === 'simple' ? (
                        <select value={breastSizeSimple} onChange={(e) => setBreastSizeSimple(e.target.value)} style={{ width: '100%', marginBottom: '8px', padding: '4px', borderRadius: '4px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '0.8rem' }}>
                          {breastSizesSimple.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder="e.g. 32DD" value={breastSizeAdvanced} onChange={(e) => setBreastSizeAdvanced(e.target.value)} style={{ width: '100%', marginBottom: '8px', padding: '4px', borderRadius: '4px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '0.8rem' }} />
                      )}
                      {renderVisibilityControl('Breasts', breastVisibility, setBreastVisibility)}
                    </div>

                    <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ff3366', marginBottom: '6px', fontWeight: 'bold' }}>Booty/Glutes</div>
                      {renderSelect('Size', bootySize, setBootySize, bootySizes, customBootySize, setCustomBootySize, 'Custom')}
                      {renderVisibilityControl('Booty', bootyVisibility, setBootyVisibility)}
                    </div>

                    <div className="full-width" style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#ff3366', marginBottom: '6px', fontWeight: 'bold' }}>Pussy/Vulva</div>
                          {renderSelect('Type', pussyType, setPussyType, pussyTypes, customPussyType, setCustomPussyType, 'Custom')}
                        </div>
                        <div>
                          {renderVisibilityControl('Pussy', pussyVisibility, setPussyVisibility)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Mode & Generate ── */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
              <div className="tabs" style={{ marginBottom: '8px' }}>
                <button className={mode === 'sfw' ? 'tab active' : 'tab'} onClick={() => handleModeChange('sfw')}>SFW</button>
                <button className={mode === 'nsfw' ? 'tab active' : 'tab'} onClick={() => handleModeChange('nsfw')}>NSFW</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button 
                  className={`btn ${engine === 'nbp3' ? 'btn-nbp3' : ''}`} 
                  onClick={() => generatePrompt(false)} 
                  disabled={isGenerateDisabled()} 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? <><div className="spinner" /> Generating...</> : <><Sparkles size={16} /> Generate New</>}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => generatePrompt(true)} 
                  disabled={isGenerateDisabled() || !currentPrompt} 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <RefreshCw size={16} /> Generate Similar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CENTER: OUTPUT ═══ */}
        <div className="config-section" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Generated Prompt</h2>
            {currentPrompt && (
              <span className="badge badge-engine" style={getEngineBadgeStyle(engine)}>
                {engine === 'nbp3' ? <><Cpu size={10} /> NBP3</> : <><Zap size={10} /> Z-IMG</>}
              </span>
            )}
          </div>
          {currentPrompt ? (
            <>
              <div className="output-box">{currentPrompt}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-secondary" onClick={copyPrompt} style={{ flex: 1 }}>
                  {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                </button>
                <button className="btn btn-success" onClick={savePrompt} style={{ flex: 1 }}>
                  <Save size={16} /> Save
                </button>
              </div>
            </>
          ) : (
            <div className="output-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', minHeight: '300px' }}>
              <span style={{ textAlign: 'center' }}>
                {engine === 'nbp3' 
                  ? 'Select NBP3 settings and click "Generate New"'
                  : 'Click "Generate New" to create a prompt'
                }
              </span>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: HISTORY ═══ */}
        <div className="config-section history-panel" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={18} /> History</h2>
          <div className="tabs">
            <button className={activeTab === 'all' ? 'tab active' : 'tab'} onClick={() => setActiveTab('all')}>All</button>
            <button className={activeTab === 'sfw' ? 'tab active' : 'tab'} onClick={() => setActiveTab('sfw')}>SFW</button>
            <button className={activeTab === 'nsfw' ? 'tab active' : 'tab'} onClick={() => setActiveTab('nsfw')}>NSFW</button>
            <button className={activeTab === 'favorites' ? 'tab active' : 'tab'} onClick={() => setActiveTab('favorites')}><Star size={12} /></button>
          </div>
          <input type="text" placeholder="Search prompts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '6px 10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem' }} />
          <button className="btn btn-secondary" onClick={exportPrompts} style={{ width: '100%', marginBottom: '12px', justifyContent: 'center' }}>
            <Download size={16} /> Export All
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredHistory.length === 0 ? (
              <p style={{ color: '#555', textAlign: 'center', fontSize: '0.85rem', padding: '20px' }}>{activeTab === 'favorites' ? 'No favorited prompts' : 'No saved prompts'}</p>
            ) : (
              filteredHistory.map(item => (
                <div key={item.id} className={`history-item ${item.favorite ? 'favorite' : ''}`} onClick={() => openHistoryItem(item)}>
                  <div className="badges">
                    {/* Engine Badge */}
                    <span className="badge badge-engine" style={getEngineBadgeStyle(item.metadata?.engine)}>
                      {item.metadata?.engine === 'nbp3' ? <><Cpu size={10} /> NBP3</> : <><Zap size={10} /> Z-IMG</>}
                    </span>
                    <span className={`badge ${item.metadata?.mode === 'nsfw' ? 'badge-nsfw' : 'badge-sfw'}`}>
                      {item.metadata?.mode === 'nsfw' ? <><EyeOff size={10} /> NSFW</> : <><Eye size={10} /> SFW</>}
                    </span>
                    <span className="badge"><User size={10} /> {item.metadata?.ethnicity}</span>
                    <span className="badge"><Calendar size={10} /> {item.metadata?.age}</span>
                    {item.metadata?.skinTone && <span className="badge" style={{background: '#8b5cf6'}}><Palette size={10} /> {item.metadata.skinTone}</span>}

                  </div>
                  <div className="history-text">{item.prompt}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '8px' }}>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, e); }} title="Favorite">
                      <Star size={14} fill={item.favorite ? "currentColor" : "none"} />
                    </button>
                    <button className="icon-btn" onClick={(e) => copyHistoryPrompt(e, item.prompt)} title="Copy"><Copy size={14} /></button>
                    <button className="icon-btn" onClick={(e) => deletePrompt(item.id, e)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* ═══ NSFW CONFIRM MODAL ═══ */}
      {showNsfwConfirm && (
        <div className="modal-overlay" onClick={() => setShowNsfwConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#ff3366" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Enable NSFW Mode?</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>This will generate adult-oriented content. Please ensure you are of legal age and comply with local laws.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowNsfwConfirm(false)}>Cancel</button>
              <button className="btn" onClick={confirmNsfw}>Enable</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HISTORY DETAIL MODAL ═══ */}
      {selectedHistoryItem && (
        <div className="modal-overlay" onClick={closeHistoryModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div className="badges">
                <span className="badge badge-engine" style={getEngineBadgeStyle(selectedHistoryItem.metadata?.engine)}>
                  {selectedHistoryItem.metadata?.engine === 'nbp3' ? 'NBP3' : 'Z-IMG'}
                </span>
                <span className={`badge ${selectedHistoryItem.metadata?.mode === 'nsfw' ? 'badge-nsfw' : 'badge-sfw'}`}>{selectedHistoryItem.metadata?.mode === 'nsfw' ? 'NSFW' : 'SFW'}</span>
                <span className="badge">{selectedHistoryItem.metadata?.ethnicity}</span>
                <span className="badge">{selectedHistoryItem.metadata?.age} yo</span>
                {selectedHistoryItem.metadata?.skinTone && <span className="badge" style={{background: '#8b5cf6'}}>{selectedHistoryItem.metadata.skinTone}</span>}

              </div>
              <button className="icon-btn" onClick={closeHistoryModal}><X size={20} /></button>
            </div>
            <div className="output-box" style={{ marginBottom: '16px', cursor: 'pointer' }} onClick={(e) => copyHistoryPrompt(e, selectedHistoryItem.prompt)}>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '8px' }}>Click to copy</p>
              {selectedHistoryItem.prompt}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className={`icon-btn ${selectedHistoryItem.favorite ? 'active' : ''}`} onClick={(e) => { toggleFavorite(selectedHistoryItem.id, e); setSelectedHistoryItem({...selectedHistoryItem, favorite: !selectedHistoryItem.favorite}); }}>
                <Star size={20} fill={selectedHistoryItem.favorite ? "currentColor" : "none"} />
              </button>
              <button className="btn" onClick={(e) => copyHistoryPrompt(e, selectedHistoryItem.prompt)}><Copy size={16} /> Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
