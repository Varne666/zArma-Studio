import { useState, useEffect, useRef } from 'react'
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
  ImagePlus,
  Settings2,
  Sliders,
  RotateCcw,
  Percent,
  Plus,
  ChevronDown,
  Upload,
  MessageSquare,
  Type,
  Gem,
  Heart,
  Moon,
  Droplets,
  Home,
  Wine,
  Bath,
  Umbrella,
  Sparkle,
  Activity,
  Wand2,
  Key,
  Image as ImageIcon,
  FolderOpen,
  Pin,
} from 'lucide-react'
import WatermarkRemover from './components/WatermarkRemover'
import ARMscaler from './components/ARMscaler'

// ═══════════════════════════════════════════════════════════════════════════════
// ═══ TYPES & INTERFACES ═══
// ═══════════════════════════════════════════════════════════════════════════════

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

interface PresetConfig {
  id: string
  name: string
  mode: 'sfw' | 'nsfw'
  ethnicity: string
  age: string
  skinTone: string
  height: string
  eyeColor: string
  hairColor: string
  bodyType: string
  background: string
  fitType: string
  breastSize?: string
  bootySize?: string
  pussyType?: string
  breastVisibility?: string
  bootyVisibility?: string
  pussyVisibility?: string
}

interface CustomPreset {
  id: string
  name: string
  config: Partial<PresetConfig>
  createdAt: string
}

interface TemplateConfig {
  id: string
  name: string
  description: string
  settings: Partial<AllSettings>
}

interface AllSettings {
  engine: 'zimage' | 'nbp3' | 'watermark' | 'armscaler'
  ethnicity: string
  skinTone: string
  age: string
  height: string
  eyeColor: string
  hairColor: string
  bodyType: string
  background: string
  fitType: string
  mode: 'sfw' | 'nsfw'
  breastSizeMode: 'simple' | 'advanced'
  breastSizeSimple: string
  breastSizeAdvanced: string
  bootySize: string
  pussyType: string
  breastVisibility: string
  bootyVisibility: string
  pussyVisibility: string
  nbpOutputFormat: 'prose' | 'json'
  nbpPromptStyle: string
  nbpCameraDevice: string
  nbpAesthetic: string
  nbpAspectRatio: string
  nbpIncludeNegative: boolean
  nbpDetailLevel: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══ CONSTANTS & DATA ═══
// ═══════════════════════════════════════════════════════════════════════════════

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

// ── Nano Banana Pro-Specific Options ──
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

// Import additional presets
import { ADDITIONAL_SFW_PRESETS, ADDITIONAL_NSFW_PRESETS } from './presets'

// ── Built-in Presets ──
const BUILT_IN_PRESETS: PresetConfig[] = [
  // SFW Presets
  {
    id: 'preset-gym-girl',
    name: 'Gym Girl',
    mode: 'sfw',
    ethnicity: 'ukrainian',
    age: '22',
    skinTone: 'beige',
    height: '5ft 6in (168cm)',
    eyeColor: 'blue',
    hairColor: 'blonde',
    bodyType: 'fit',
    background: 'gym',
    fitType: 'sports bra and shorts'
  },
  {
    id: 'preset-beach-babe',
    name: 'Beach Babe',
    mode: 'sfw',
    ethnicity: 'brazilian',
    age: '24',
    skinTone: 'tan',
    height: '5ft 7in (170cm)',
    eyeColor: 'hazel',
    hairColor: 'brunette',
    bodyType: 'curvy',
    background: 'beach',
    fitType: 'swimwear'
  },
  {
    id: 'preset-y2k',
    name: 'Y2K Aesthetic',
    mode: 'sfw',
    ethnicity: 'british',
    age: '21',
    skinTone: 'fair',
    height: '5ft 5in (165cm)',
    eyeColor: 'green',
    hairColor: 'platinum blonde',
    bodyType: 'slim',
    background: 'car interior',
    fitType: 'crop top and shorts'
  },
  {
    id: 'preset-influencer',
    name: 'Influencer',
    mode: 'sfw',
    ethnicity: 'colombian',
    age: '23',
    skinTone: 'olive',
    height: '5ft 8in (173cm)',
    eyeColor: 'brown',
    hairColor: 'black',
    bodyType: 'toned',
    background: 'mirror selfie',
    fitType: 'tight leggings and crop top'
  },
  {
    id: 'preset-casual-home',
    name: 'Casual Home',
    mode: 'sfw',
    ethnicity: 'swedish',
    age: '20',
    skinTone: 'porcelain',
    height: '5ft 4in (163cm)',
    eyeColor: 'blue',
    hairColor: 'dirty blonde',
    bodyType: 'average',
    background: 'living room',
    fitType: 'oversized sweater'
  },
  {
    id: 'preset-cocktail',
    name: 'Cocktail Party',
    mode: 'sfw',
    ethnicity: 'italian',
    age: '26',
    skinTone: 'medium',
    height: '5ft 6in (168cm)',
    eyeColor: 'amber',
    hairColor: 'brunette',
    bodyType: 'curvy',
    background: 'hotel room',
    fitType: 'cocktail dress'
  },
  // NSFW Presets
  {
    id: 'preset-bedroom-mirror',
    name: 'Bedroom Mirror',
    mode: 'nsfw',
    ethnicity: 'ukrainian',
    age: '22',
    skinTone: 'beige',
    height: '5ft 6in (168cm)',
    eyeColor: 'blue',
    hairColor: 'blonde',
    bodyType: 'fit',
    background: 'mirror selfie',
    fitType: 'lingerie',
    breastSize: 'large',
    bootySize: 'large',
    pussyType: 'innie',
    breastVisibility: 'tease',
    bootyVisibility: 'show',
    pussyVisibility: 'hide'
  },
  {
    id: 'preset-late-night',
    name: 'Late Night',
    mode: 'nsfw',
    ethnicity: 'russian',
    age: '24',
    skinTone: 'fair',
    height: '5ft 7in (170cm)',
    eyeColor: 'grey',
    hairColor: 'platinum blonde',
    bodyType: 'slim',
    background: 'bedroom',
    fitType: 'towel only',
    breastSize: 'medium',
    bootySize: 'above average',
    pussyType: 'smooth',
    breastVisibility: 'show',
    bootyVisibility: 'tease',
    pussyVisibility: 'hide'
  },
  {
    id: 'preset-fresh-out',
    name: 'Fresh Out',
    mode: 'nsfw',
    ethnicity: 'brazilian',
    age: '23',
    skinTone: 'tan',
    height: '5ft 8in (173cm)',
    eyeColor: 'hazel',
    hairColor: 'brunette',
    bodyType: 'curvy',
    background: 'bathroom',
    fitType: 'robe',
    breastSize: 'extra large',
    bootySize: 'extra large',
    pussyType: 'natural bush',
    breastVisibility: 'show',
    bootyVisibility: 'show',
    pussyVisibility: 'tease'
  },
  {
    id: 'preset-boudoir',
    name: 'Boudoir',
    mode: 'nsfw',
    ethnicity: 'french',
    age: '25',
    skinTone: 'porcelain',
    height: '5ft 5in (165cm)',
    eyeColor: 'green',
    hairColor: 'auburn',
    bodyType: 'voluptuous',
    background: 'bedroom',
    fitType: 'bodysuit',
    breastSize: 'above average',
    bootySize: 'large',
    pussyType: 'innie',
    breastVisibility: 'seductive',
    bootyVisibility: 'seductive',
    pussyVisibility: 'tease'
  },
  {
    id: 'preset-bath-time',
    name: 'Bath Time',
    mode: 'nsfw',
    ethnicity: 'japanese',
    age: '21',
    skinTone: 'light',
    height: '5ft 3in (160cm)',
    eyeColor: 'brown',
    hairColor: 'black',
    bodyType: 'petite',
    background: 'shower',
    fitType: 'towel only',
    breastSize: 'small',
    bootySize: 'small',
    pussyType: 'smooth',
    breastVisibility: 'show',
    bootyVisibility: 'show',
    pussyVisibility: 'hide'
  },
  {
    id: 'preset-poolside-glam',
    name: 'Poolside Glam',
    mode: 'nsfw',
    ethnicity: 'mexican',
    age: '24',
    skinTone: 'olive',
    height: '5ft 6in (168cm)',
    eyeColor: 'amber',
    hairColor: 'chestnut',
    bodyType: 'thick',
    background: 'poolside',
    fitType: 'swimwear',
    breastSize: 'large',
    bootySize: 'above average',
    pussyType: 'smooth',
    breastVisibility: 'show',
    bootyVisibility: 'show',
    pussyVisibility: 'hide'
  },
  // Additional SFW Presets (24 more)
  ...ADDITIONAL_SFW_PRESETS.map(p => ({ ...p, isCustom: false })),
  // Additional NSFW Presets (24 more)
  ...ADDITIONAL_NSFW_PRESETS.map(p => ({ ...p, isCustom: false }))
]

// ── Dynamic Templates ──
const DYNAMIC_TEMPLATES: TemplateConfig[] = [
  {
    id: 'template-vanilla',
    name: 'Vanilla Portrait',
    description: 'Clean, professional portrait photography',
    settings: {
      nbpPromptStyle: 'portrait',
      nbpAesthetic: 'studio_editorial',
      nbpDetailLevel: 'standard',
      nbpIncludeNegative: true
    }
  },
  {
    id: 'template-selfie-queen',
    name: 'Selfie Queen',
    description: 'Instagram-style mirror and phone selfies',
    settings: {
      nbpPromptStyle: 'mirror_selfie',
      nbpAesthetic: 'casual_instagram',
      nbpCameraDevice: 'iPhone 15 Pro',
      nbpDetailLevel: 'ultra',
      nbpIncludeNegative: true
    }
  },
  {
    id: 'template-y2k-baddie',
    name: 'Y2K Baddie',
    description: '2000s aesthetic with flash and grain',
    settings: {
      nbpPromptStyle: 'candid',
      nbpAesthetic: 'y2k_flash',
      nbpCameraDevice: 'Canon PowerShot',
      nbpDetailLevel: 'ultra',
      nbpIncludeNegative: true
    }
  },
  {
    id: 'template-golden-hour',
    name: 'Golden Hour Goddess',
    description: 'Warm sunset lighting, outdoor vibes',
    settings: {
      nbpPromptStyle: 'lifestyle',
      nbpAesthetic: 'golden_hour',
      nbpDetailLevel: 'ultra',
      nbpIncludeNegative: true
    }
  },
  {
    id: 'template-club-night',
    name: 'Club Night',
    description: 'Nightclub flash photography',
    settings: {
      nbpPromptStyle: 'fashion_snapshot',
      nbpAesthetic: 'nightclub',
      nbpDetailLevel: 'maximum',
      nbpIncludeNegative: true
    }
  },
  {
    id: 'template-maximum-control',
    name: 'Maximum ControlNet',
    description: 'Highest detail for ControlNet workflows',
    settings: {
      nbpDetailLevel: 'maximum',
      nbpIncludeNegative: true
    }
  }
]

// ═══════════════════════════════════════════════════════════════════════════════
// ═══ IMAGE GENERATION VIEW COMPONENT ═══
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatSession {
  id: string
  name: string
  prompt: string
  images: string[]
  createdAt: string
  pinned?: boolean
  folder?: string
}

function ImageGenerationView() {
  // Load saved API key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('imagen_api_key') || '')
  // Removed unused showApiKey state
  const [prompt, setPrompt] = useState('')
  const [batchSize, setBatchSize] = useState(1)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1K')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [generationMeta, setGenerationMeta] = useState<any>(null)
  const [nsfwBypass, setNsfwBypass] = useState(true)
  const [temperature, setTemperature] = useState(1.0)
  const [topP, setTopP] = useState(0.95)
  const [outputLength, setOutputLength] = useState(8192)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [timer, setTimer] = useState(0)
  // Token count now computed in real-time via calculateTokens()
  const [showTokenTooltip, setShowTokenTooltip] = useState(false)
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('imagen_chats')
    return saved ? JSON.parse(saved) : []
  })
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatName, setChatName] = useState('')
  const folders = ['Default', 'Favorites']
  const [selectedFolder, setSelectedFolder] = useState('Default')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const aspectRatios = ['Auto', '1:1', '9:16', '16:9', '3:4', '4:3', '3:2']
  const resolutions = ['1K', '2K', '4K']

  // Save API key when changed
  useEffect(() => {
    if (apiKey) localStorage.setItem('imagen_api_key', apiKey)
  }, [apiKey])

  const removeApiKey = () => {
    localStorage.removeItem('imagen_api_key')
    setApiKey('')
  }
  
  const savedApiKey = !!localStorage.getItem('imagen_api_key')

  // Save chats when changed
  useEffect(() => {
    localStorage.setItem('imagen_chats', JSON.stringify(chats))
  }, [chats])

  // Timer effect - using timestamp for accuracy when tabbed out
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (isGenerating) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimer(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);
  
  // Handle visibility change to prevent stopping generation when tabbed out
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Keep generation running even when hidden
      if (document.hidden && isGenerating) {
        // Recalculate timer when tab becomes visible again
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimer(elapsed);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isGenerating]);

  // Real-time token calculation
  const calculateTokens = () => {
    const inputTokens = Math.ceil(prompt.length / 4)
    const outputTokens = 500 * batchSize * (resolution === '4K' ? 4 : resolution === '2K' ? 2 : 1)
    const totalTokens = inputTokens + outputTokens
    
    // Gemini 3 Pro pricing (approximate): $0.002 per 1K tokens
    const inputCost = (inputTokens / 1000) * 0.002
    const outputCost = (outputTokens / 1000) * 0.002
    const totalCost = inputCost + outputCost
    
    return { inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost }
  }

  const tokenData = calculateTokens()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const saveChat = () => {
    if (!prompt && generatedImages.length === 0) return
    
    const newChat: ChatSession = {
      id: currentChatId || `chat-${Date.now()}`,
      name: chatName || `Chat ${chats.length + 1}`,
      prompt,
      images: generatedImages,
      createdAt: new Date().toISOString(),
      folder: selectedFolder
    }
    
    if (currentChatId) {
      setChats(chats.map(c => c.id === currentChatId ? newChat : c))
    } else {
      setChats([newChat, ...chats])
      setCurrentChatId(newChat.id)
    }
  }

  const loadChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id)
    setChatName(chat.name)
    setPrompt(chat.prompt)
    setGeneratedImages(chat.images)
  }

  const deleteChat = (id: string) => {
    setChats(chats.filter(c => c.id !== id))
    if (currentChatId === id) {
      setCurrentChatId(null)
      setChatName('')
      setPrompt('')
      setGeneratedImages([])
    }
  }

  const togglePin = (id: string) => {
    setChats(chats.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c))
  }

  const generateImages = async () => {
    if (!apiKey || !prompt) return
    setIsGenerating(true)
    setTimer(0)
    
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          apiKey,
          prompt,
          batchSize,
          aspectRatio,
          resolution,
          nsfwBypass,
          temperature,
          topP,
          outputLength
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setGeneratedImages(data.images || [])
        setGenerationMeta(data.meta || null)
      }
    } catch (e) {
      console.error('Generation failed:', e)
    }
    
    setIsGenerating(false)
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <ImageIcon size={24} color="#10b981" /> Nano Banana Pro Image Generation
        </h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Powered by Gemini 3 Pro • Less censorship • Batch generation
        </p>
      </div>

      {/* Paid Subscriber Warning */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))', 
        border: '1px solid rgba(245, 158, 11, 0.5)', 
        borderRadius: '8px', 
        padding: '12px 16px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f59e0b', letterSpacing: '0.5px' }}>
          ⚠️ EXCLUSIVELY FOR PAID GEMINI 3 PRO SUBSCRIBERS
        </div>
        <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '4px', fontStyle: 'italic' }}>
          Restricted Access: Not for Free Version 2.5 Flash
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 350px', gap: '24px' }}>
        {/* Left: Chat Management Sidebar */}
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px', height: 'fit-content', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <FolderOpen size={16} /> Chats
            </h3>
            <button
              onClick={() => {
                setCurrentChatId(null)
                setChatName('')
                setPrompt('')
                setGeneratedImages([])
              }}
              style={{
                padding: '4px 8px',
                background: '#10b981',
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              + New
            </button>
          </div>

          {/* Folder Filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.8rem',
              marginBottom: '12px',
              cursor: 'pointer'
            }}
          >
            {folders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Chat List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...chats]
              .filter(c => c.folder === selectedFolder)
              .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
              .map(chat => (
              <div
                key={chat.id}
                onClick={() => loadChat(chat)}
                style={{
                  padding: '10px',
                  background: currentChatId === chat.id ? 'rgba(16, 185, 129, 0.2)' : '#1a1a1a',
                  border: `1px solid ${currentChatId === chat.id ? '#10b981' : '#333'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {chat.pinned && <Pin size={12} color="#f59e0b" />}
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {chat.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{chat.images.length} img</span>
                  <span>•</span>
                  <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(chat.id) }}
                    style={{
                      padding: '2px 6px',
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: chat.pinned ? '#f59e0b' : '#666',
                      cursor: 'pointer',
                      fontSize: '0.65rem'
                    }}
                  >
                    <Pin size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id) }}
                    style={{
                      padding: '2px 6px',
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.65rem'
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
            {chats.filter(c => c.folder === selectedFolder).length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.75rem' }}>
                No chats in this folder
              </div>
            )}
          </div>
        </div>

        {/* Middle: Main Generation Area */}
        <div>
          {/* API Key Input */}
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', color: '#10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} /> API Configuration
              </div>
              {savedApiKey && (
                <span style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} /> Saved
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {savedApiKey ? (
                <div
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#0d1f15',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    color: '#10b981',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    userSelect: 'none',
                    cursor: 'default'
                  }}
                  title="API key saved - click X to remove"
                >
                  {'•'.repeat(32)}
                </div>
              ) : (
                <input
                  type="password"
                  placeholder="Enter Google AI API Key (AIzaxxxxxxxxx...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              )}
              {savedApiKey && (
                <button
                  onClick={removeApiKey}
                  title="Remove saved API key"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>
              Your API key is stored locally and never sent to our servers.
            </div>
          </div>

          {/* Chat Name Input */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Chat name (optional)..."
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Prompt Input */}
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <textarea
              placeholder="Describe the image you want to generate... (NSFW prompts supported with bypass)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
            />
            
            {/* Batch Size */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Batch Size:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setBatchSize(n)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      border: 'none',
                      background: batchSize === n ? '#10b981' : '#1a1a1a',
                      color: batchSize === n ? '#000' : '#fff',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate & Save Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={generateImages}
              disabled={isGenerating || !apiKey || !prompt}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: (isGenerating || !apiKey || !prompt) ? 0.5 : 1
              }}
            >
              {isGenerating ? 'Generating...' : `Generate ${batchSize > 1 ? batchSize + ' Images' : 'Image'}`}
            </button>
            {(prompt || generatedImages.length > 0) && (
              <button
                onClick={saveChat}
                style={{
                  padding: '14px 20px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} /> Save
              </button>
            )}
          </div>

          {/* Generated Images Grid */}
          {generatedImages.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              {generationMeta?.usedFallback && (
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  border: '1px solid rgba(245, 158, 11, 0.5)', 
                  borderRadius: '6px', 
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '0.8rem',
                  color: '#f59e0b'
                }}>
                  ⚠️ <strong>High demand detected.</strong> Switched to fallback model (Gemini 2.5 Flash) and/or reduced quality to ensure generation completes.
                  {generationMeta.sizes && (
                    <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#d97706' }}>
                      Used: {generationMeta.sizes.join(', ')} • Models: {generationMeta.models?.join(', ')}
                    </div>
                  )}
                </div>
              )}
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" /> Generated Images
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {generatedImages.map((img, i) => (
                  <div key={i} style={{ background: '#111', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                    <img src={img} alt={`Generated ${i + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {}}
                        style={{ flex: 1, padding: '6px', background: '#333', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        <Download size={12} /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Settings Panel */}
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} /> Generation Settings
          </h3>

          {/* Aspect Ratio */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '8px' }}>Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Resolution */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '8px' }}>Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {resolutions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Advanced Settings Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#888',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>Advanced settings</span>
              <ChevronDown size={14} style={{ transform: showAdvancedSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>
          </div>

          {/* Advanced Settings Panel */}
          {showAdvancedSettings && (
            <div style={{ marginBottom: '20px', padding: '12px', background: '#0d0d0d', borderRadius: '6px', border: '1px solid #222' }}>
              {/* Temperature */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888' }}>Temperature</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 1.0)}
                    style={{
                      width: '50px',
                      padding: '4px 6px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                  For Gemini 3, best results at default 1.0. Lower values may impact reasoning.
                </div>
              </div>

              {/* Top P */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888' }}>Top P</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value) || 0.95)}
                    style={{
                      width: '50px',
                      padding: '4px 6px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                  Probability threshold for top-p sampling.
                </div>
              </div>

              {/* Output Length */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888' }}>Output length</label>
                  <input
                    type="number"
                    min="1"
                    max="32768"
                    step="1"
                    value={outputLength}
                    onChange={(e) => setOutputLength(parseInt(e.target.value) || 8192)}
                    style={{
                      width: '70px',
                      padding: '4px 6px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                  Maximum number of tokens in response.
                </div>
              </div>
            </div>
          )}

          {/* NSFW Bypass Toggle */}
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> NSFW Bypass
              </span>
              <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={nsfwBypass}
                  onChange={(e) => setNsfwBypass(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{ 
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: nsfwBypass ? '#10b981' : '#333',
                  borderRadius: '24px', transition: '.3s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px',
                    left: nsfwBypass ? '22px' : '3px', bottom: '3px',
                    backgroundColor: 'white', borderRadius: '50%', transition: '.3s'
                  }}/>
                </span>
              </label>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>
              {nsfwBypass ? 'Using prompt obfuscation and token splitting.' : 'Standard generation with safety filters.'}
            </div>
          </div>

          {/* Timer & Token Counter */}
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', padding: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>Time Elapsed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981', fontFamily: 'monospace' }}>
                  {formatTime(timer)}
                </div>
              </div>
              <div 
                style={{ textAlign: 'right', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={() => setShowTokenTooltip(true)}
                onMouseLeave={() => setShowTokenTooltip(false)}
              >
                <div style={{ fontSize: '0.7rem', color: '#888' }}>Est. Tokens</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a855f7' }}>
                  {tokenData.totalTokens.toLocaleString()}
                </div>
                
                {/* Token Cost Tooltip */}
                {showTokenTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: '8px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '12px',
                    minWidth: '220px',
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                      Token Usage Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '4px 12px', fontSize: '0.7rem' }}>
                      <span style={{ color: '#888' }}>Input:</span>
                      <span style={{ color: '#fff', fontFamily: 'monospace' }}>{tokenData.inputTokens.toLocaleString()}</span>
                      <span style={{ color: '#888' }}>(${tokenData.inputCost.toFixed(4)})</span>
                      
                      <span style={{ color: '#888' }}>Output:</span>
                      <span style={{ color: '#fff', fontFamily: 'monospace' }}>{tokenData.outputTokens.toLocaleString()}</span>
                      <span style={{ color: '#888' }}>(${tokenData.outputCost.toFixed(4)})</span>
                      
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>Total:</span>
                      <span style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>{tokenData.totalTokens.toLocaleString()}</span>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>(${tokenData.totalCost.toFixed(4)})</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                      *Based on Gemini 3 Pro pricing
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══ MAIN COMPONENT ═══
// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  // ── Engine State ──
  const [engine, setEngine] = useState<'zimage' | 'nbp3' | 'watermark' | 'armscaler' | 'imggen'>('zimage')

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

  // ── Nano Banana Pro-Specific Config ──
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

  // ── NEW: Custom Instructions State ──
  const [customInstructionsEnabled, setCustomInstructionsEnabled] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')
  const [customInstructionsActive, setCustomInstructionsActive] = useState(false)

  // ── NEW: Image Analysis State ──
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [analyzedImage, setAnalyzedImage] = useState<string | null>(null)
  const [, setCachedImageDescription] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── NEW: Custom Presets State ──
  const [myPresets, setMyPresets] = useState<CustomPreset[]>([])
  const [showNewPresetModal, setShowNewPresetModal] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // ── NEW: Panel Collapse States ──
  const [presetsCollapsed, setPresetsCollapsed] = useState(false)
  const [configCollapsed, setConfigCollapsed] = useState(false)

  // ── NEW: My Presets Section Collapse ──
  const [myPresetsCollapsed, setMyPresetsCollapsed] = useState(false)

  useEffect(() => {
    checkOllama()
    loadHistory()
    loadMyPresets()
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

  // ── NEW: Load My Presets from localStorage ──
  const loadMyPresets = () => {
    try {
      const saved = localStorage.getItem('zarma-custom-presets')
      if (saved) {
        setMyPresets(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  // ── NEW: Save My Presets to localStorage ──
  const saveMyPresets = (presets: CustomPreset[]) => {
    try {
      localStorage.setItem('zarma-custom-presets', JSON.stringify(presets))
      setMyPresets(presets)
    } catch (error) {
      console.error('Failed to save presets:', error)
    }
  }

  // ── NEW: Create New Preset ──
  const createNewPreset = () => {
    if (!newPresetName.trim()) return
    
    const newPreset: CustomPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      config: {
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
        breastSize: mode === 'nsfw' ? getBreastSize() : undefined,
        bootySize: mode === 'nsfw' ? getValue(bootySize, customBootySize) : undefined,
        pussyType: mode === 'nsfw' ? getValue(pussyType, customPussyType) : undefined,
        breastVisibility: mode === 'nsfw' ? breastVisibility : undefined,
        bootyVisibility: mode === 'nsfw' ? bootyVisibility : undefined,
        pussyVisibility: mode === 'nsfw' ? pussyVisibility : undefined
      },
      createdAt: new Date().toISOString()
    }
    
    const updated = [...myPresets, newPreset]
    saveMyPresets(updated)
    setNewPresetName('')
    setShowNewPresetModal(false)
    showToast('Preset saved!')
  }

  // ── NEW: Delete Custom Preset ──
  const deleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this preset?')) return
    const updated = myPresets.filter(p => p.id !== id)
    saveMyPresets(updated)
    showToast('Preset deleted')
  }

  // ── NEW: Load Custom Preset ──
  const loadCustomPreset = (preset: CustomPreset) => {
    const cfg = preset.config
    if (cfg.ethnicity) {
      const isCustom = !ethnicities.includes(cfg.ethnicity)
      setEthnicity(isCustom ? 'custom' : cfg.ethnicity)
      if (isCustom) setCustomEthnicity(cfg.ethnicity)
    }
    if (cfg.skinTone) {
      const isCustom = !skinTones.includes(cfg.skinTone)
      setSkinTone(isCustom ? 'custom' : cfg.skinTone)
      if (isCustom) setCustomSkinTone(cfg.skinTone)
    }
    if (cfg.age) {
      const isCustom = !ages.includes(cfg.age)
      setAge(isCustom ? 'custom' : cfg.age)
      if (isCustom) setCustomAge(cfg.age)
    }
    if (cfg.height) {
      const isCustom = !heights.includes(cfg.height)
      setHeight(isCustom ? 'custom' : cfg.height)
      if (isCustom) setCustomHeight(cfg.height)
    }
    if (cfg.eyeColor) {
      const isCustom = !eyeColors.includes(cfg.eyeColor)
      setEyeColor(isCustom ? 'custom' : cfg.eyeColor)
      if (isCustom) setCustomEyeColor(cfg.eyeColor)
    }
    if (cfg.hairColor) {
      const isCustom = !hairColors.includes(cfg.hairColor)
      setHairColor(isCustom ? 'custom' : cfg.hairColor)
      if (isCustom) setCustomHairColor(cfg.hairColor)
    }
    if (cfg.bodyType) {
      const isCustom = !bodyTypes.includes(cfg.bodyType)
      setBodyType(isCustom ? 'custom' : cfg.bodyType)
      if (isCustom) setCustomBodyType(cfg.bodyType)
    }
    if (cfg.background) {
      const isCustom = !backgrounds.includes(cfg.background)
      setBackground(isCustom ? 'custom' : cfg.background)
      if (isCustom) setCustomBackground(cfg.background)
    }
    if (cfg.fitType) {
      const isCustom = !fitTypes.includes(cfg.fitType)
      setFitType(isCustom ? 'custom' : cfg.fitType)
      if (isCustom) setCustomFitType(cfg.fitType)
    }
    if (cfg.mode) {
      setMode(cfg.mode)
    }
    if (cfg.breastSize && cfg.mode === 'nsfw') {
      const isSimple = breastSizesSimple.includes(cfg.breastSize)
      setBreastSizeMode(isSimple ? 'simple' : 'advanced')
      if (isSimple) {
        setBreastSizeSimple(cfg.breastSize)
      } else {
        setBreastSizeAdvanced(cfg.breastSize)
      }
    }
    if (cfg.bootySize && cfg.mode === 'nsfw') {
      const isCustom = !bootySizes.includes(cfg.bootySize)
      setBootySize(isCustom ? 'custom' : cfg.bootySize)
      if (isCustom) setCustomBootySize(cfg.bootySize)
    }
    if (cfg.pussyType && cfg.mode === 'nsfw') {
      const isCustom = !pussyTypes.includes(cfg.pussyType)
      setPussyType(isCustom ? 'custom' : cfg.pussyType)
      if (isCustom) setCustomPussyType(cfg.pussyType)
    }
    if (cfg.breastVisibility) setBreastVisibility(cfg.breastVisibility)
    if (cfg.bootyVisibility) setBootyVisibility(cfg.bootyVisibility)
    if (cfg.pussyVisibility) setPussyVisibility(cfg.pussyVisibility)
    
    showToast(`Loaded: ${preset.name}`)
  }

  // ── NEW: Apply Template ──
  const applyTemplate = (templateId: string) => {
    const template = DYNAMIC_TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    
    if (template.settings.nbpPromptStyle) setNbpPromptStyle(template.settings.nbpPromptStyle)
    if (template.settings.nbpAesthetic) setNbpAesthetic(template.settings.nbpAesthetic)
    if (template.settings.nbpCameraDevice) setNbpCameraDevice(template.settings.nbpCameraDevice)
    if (template.settings.nbpDetailLevel) setNbpDetailLevel(template.settings.nbpDetailLevel)
    if (template.settings.nbpIncludeNegative !== undefined) setNbpIncludeNegative(template.settings.nbpIncludeNegative)
    
    setSelectedTemplate(templateId)
    showToast(`Template applied: ${template.name}`)
  }

  // ── NEW: Handle Image Upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsAnalyzingImage(true)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string
      setAnalyzedImage(base64Image)
      setCachedImageDescription('') // Clear cache for new image
      
      try {
        // Call the backend API to analyze the image
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Image,
            mode: 'auto',
            outputFormat: nbpOutputFormat // Respect user's selected output format
          })
        })
        
        if (!res.ok) {
          throw new Error('Failed to analyze image')
        }
        
        const data = await res.json()
        
        // Update the mode based on detection (sfw or nsfw)
        if (data.meta?.mode) {
          const detectedMode = data.meta.mode as 'sfw' | 'nsfw'
          setMode(detectedMode)
          if (detectedMode === 'nsfw' && !nsfwConfirmed) {
            setNsfwConfirmed(true)
          }
        }
        
        // Update the prompt output
        if (data.prompt) {
          setCurrentPrompt(data.prompt)
        }
        
        // Cache the description for format switching
        if (data.meta?.description) {
          console.log('Caching description:', data.meta.description.substring(0, 100))
          setCachedImageDescription(data.meta.description)
        } else {
          console.log('No description in response')
        }
        
        showToast(`Analyzed!`)
      } catch (error) {
        console.error('Image analysis error:', error)
        showToast('Failed to analyze image')
      } finally {
        setIsAnalyzingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // ── NEW: Handle Drag and Drop Events ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      showToast('Please drop an image file')
      return
    }

    setIsAnalyzingImage(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string
      setAnalyzedImage(base64Image)
      setCachedImageDescription('') // Clear cache for new image

      try {
        // Call the backend API to analyze the image
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Image,
            mode: 'auto',
            outputFormat: nbpOutputFormat
          })
        })

        if (!res.ok) {
          throw new Error('Failed to analyze image')
        }

        const data = await res.json()

        // Update the mode based on detection
        if (data.meta?.mode) {
          const detectedMode = data.meta.mode as 'sfw' | 'nsfw'
          setMode(detectedMode)
          if (detectedMode === 'nsfw' && !nsfwConfirmed) {
            setNsfwConfirmed(true)
          }
        }

        // Update the prompt output
        if (data.prompt) {
          setCurrentPrompt(data.prompt)
        }

        
        showToast(`Image analyzed! Detected: ${data.meta?.mode?.toUpperCase() || "UNKNOWN"}`)

        setCustomInstructionsActive(true)
        showToast(`Image analyzed! Mode: ${data.meta?.mode?.toUpperCase() || 'AUTO'}`)
      } catch (error) {
        console.error('Image analysis error:', error)
        showToast('Failed to analyze image')
      } finally {
        setIsAnalyzingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // ── NEW: Reset Custom Instructions ──
  const resetCustomInstructions = () => {
    setCustomInstructions('')
    setCustomInstructionsActive(false)
    setAnalyzedImage(null)
    setCachedImageDescription('')
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

  // ── NEW: Apply Built-in Preset ──
  const applyPreset = (preset: PresetConfig) => {
    setMode(preset.mode)
    
    const isCustomEthnicity = !ethnicities.includes(preset.ethnicity)
    setEthnicity(isCustomEthnicity ? 'custom' : preset.ethnicity)
    if (isCustomEthnicity) setCustomEthnicity(preset.ethnicity)
    
    const isCustomSkin = !skinTones.includes(preset.skinTone)
    setSkinTone(isCustomSkin ? 'custom' : preset.skinTone)
    if (isCustomSkin) setCustomSkinTone(preset.skinTone)
    
    const isCustomAge = !ages.includes(preset.age)
    setAge(isCustomAge ? 'custom' : preset.age)
    if (isCustomAge) setCustomAge(preset.age)
    
    const isCustomHeight = !heights.includes(preset.height)
    setHeight(isCustomHeight ? 'custom' : preset.height)
    if (isCustomHeight) setCustomHeight(preset.height)
    
    const isCustomEye = !eyeColors.includes(preset.eyeColor)
    setEyeColor(isCustomEye ? 'custom' : preset.eyeColor)
    if (isCustomEye) setCustomEyeColor(preset.eyeColor)
    
    const isCustomHair = !hairColors.includes(preset.hairColor)
    setHairColor(isCustomHair ? 'custom' : preset.hairColor)
    if (isCustomHair) setCustomHairColor(preset.hairColor)
    
    const isCustomBody = !bodyTypes.includes(preset.bodyType)
    setBodyType(isCustomBody ? 'custom' : preset.bodyType)
    if (isCustomBody) setCustomBodyType(preset.bodyType)
    
    const isCustomBg = !backgrounds.includes(preset.background)
    setBackground(isCustomBg ? 'custom' : preset.background)
    if (isCustomBg) setCustomBackground(preset.background)
    
    const isCustomFit = !fitTypes.includes(preset.fitType)
    setFitType(isCustomFit ? 'custom' : preset.fitType)
    if (isCustomFit) setCustomFitType(preset.fitType)
    
    if (preset.mode === 'nsfw') {
      if (preset.breastSize) {
        const isSimple = breastSizesSimple.includes(preset.breastSize)
        setBreastSizeMode(isSimple ? 'simple' : 'advanced')
        if (isSimple) setBreastSizeSimple(preset.breastSize)
        else setBreastSizeAdvanced(preset.breastSize)
      }
      if (preset.bootySize) {
        const isCustom = !bootySizes.includes(preset.bootySize)
        setBootySize(isCustom ? 'custom' : preset.bootySize)
        if (isCustom) setCustomBootySize(preset.bootySize)
      }
      if (preset.pussyType) {
        const isCustom = !pussyTypes.includes(preset.pussyType)
        setPussyType(isCustom ? 'custom' : preset.pussyType)
        if (isCustom) setCustomPussyType(preset.pussyType)
      }
      if (preset.breastVisibility) setBreastVisibility(preset.breastVisibility)
      if (preset.bootyVisibility) setBootyVisibility(preset.bootyVisibility)
      if (preset.pussyVisibility) setPussyVisibility(preset.pussyVisibility)
    }
    
    showToast(`Preset loaded: ${preset.name}`)
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

  const generatePrompt = async (similar: boolean = false, highConsistency: boolean = false) => {
    setLoading(true)
    try {
      const resolvedNbpCameraDevice = nbpCameraDevice === 'custom'
        ? (nbpCameraDeviceCustom.trim() || 'Generic Smartphone')
        : nbpCameraDevice

      const resolvedNbpAesthetic = nbpAesthetic === 'custom'
        ? (nbpAestheticCustom.trim() || 'casual_instagram')
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
        previousPrompt: (similar || highConsistency) ? currentPrompt : undefined,
        highConsistency,
        customInstructions: customInstructionsActive ? customInstructions : undefined,
        variationSeed: highConsistency ? Date.now() + Math.random() : undefined
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

      // Add Nano Banana Pro-specific params
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

  // ── NEW: Generate with 95% Same (High Consistency) ──
  const generate95PercentSame = async () => {
    await generatePrompt(false, true)
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

  const sfwPresets = BUILT_IN_PRESETS.filter(p => p.mode === 'sfw')
  const nsfwPresets = BUILT_IN_PRESETS.filter(p => p.mode === 'nsfw')

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

  // ── NEW: Get Preset Icon ──
  const getPresetIcon = (presetName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Gym Girl': <Activity size={14} />,
      'Beach Babe': <SunMedium size={14} />,
      'Y2K Aesthetic': <Sparkle size={14} />,
      'Influencer': <Camera size={14} />,
      'Casual Home': <Home size={14} />,
      'Cocktail Party': <Wine size={14} />,
      'Bedroom Mirror': <Eye size={14} />,
      'Late Night': <Moon size={14} />,
      'Fresh Out': <Droplets size={14} />,
      'Boudoir': <Heart size={14} />,
      'Bath Time': <Bath size={14} />,
      'Poolside Glam': <Umbrella size={14} />
    }
    return iconMap[presetName] || <Star size={14} />
  }

  return (
    <div className="container" style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
        .config-section { background: #111; padding: 16px; border-radius: 12px; border: 1px solid #222; margin-bottom: 12px; }
        .full-width { grid-column: 1 / -1; }
        @media (max-width: 1400px) { .config-grid { grid-template-columns: 1fr; } }
        .main-layout { display: grid; grid-template-columns: 280px 260px 1fr 360px; gap: 16px; }
        @media (max-width: 1400px) { .main-layout { grid-template-columns: 260px 240px 1fr; } .history-panel { display: none; } }
        @media (max-width: 1100px) { .main-layout { grid-template-columns: 240px 1fr; } .presets-panel { display: none; } }
        @media (max-width: 768px) { .main-layout { grid-template-columns: 1fr; } }
        .output-box { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; min-height: 200px; max-height: 600px; overflow-y: auto; line-height: 1.6; font-size: 0.9rem; white-space: pre-wrap; }
        .btn { background: #ff3366; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; transition: opacity 0.2s; }
        .btn:hover:not(:disabled) { opacity: 0.9; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #333; }
        .btn-success { background: #22c55e; }
        .btn-nbp3 { background: #a855f7; }
        .btn-nbp3:hover:not(:disabled) { background: #9333ea; }
        .btn-purple { background: #8b5cf6; }
        .btn-purple:hover:not(:disabled) { background: #7c3aed; }
        .btn-pink { background: #ec4899; }
        .btn-pink:hover:not(:disabled) { background: #db2777; }
        .btn-orange { background: #f97316; }
        .btn-orange:hover:not(:disabled) { background: #ea580c; }
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
        .nbp3-label { font-size: 0.7rem; text-transform: uppercase; letterSpacing: 0.5px; color: #a855f7; margin-bottom: 4px; display: block; font-weight: 600; }
        .nbp3-select { width: 100%; padding: 6px 8px; borderRadius: 6px; border: 1px solid rgba(168,85,247,0.3); background: #1a1a1a; color: #fff; font-size: 0.85rem; }
        .nbp3-toggle-row { display: flex; gap: 4px; margin-bottom: 8px; }
        .nbp3-toggle-btn { flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #888; cursor: pointer; font-size: 0.75rem; font-weight: 600; text-align: center; transition: all 0.2s; }
        .nbp3-toggle-btn.active { border-color: #a855f7; background: rgba(168,85,247,0.2); color: #a855f7; }
        
        /* NEW: Preset Button Styles - Compact 2-Column Grid */
        .preset-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
        }
        .preset-btn { 
          width: 100%; 
          padding: 4px 6px; 
          margin-bottom: 0;
          border: 1px solid #333; 
          background: #1a1a1a; 
          color: #aaa; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 0.7rem; 
          display: flex; 
          align-items: center; 
          gap: 4px; 
          transition: all 0.2s;
          text-align: left;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preset-btn:hover { 
          border-color: #ff3366; 
          background: rgba(255, 51, 102, 0.1); 
          color: #fff; 
        }
        .preset-btn svg {
          flex-shrink: 0;
          width: 12px;
          height: 12px;
        }
        .preset-section-title {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
          margin: 12px 0 8px 0;
          padding-bottom: 4px;
          border-bottom: 1px solid #222;
        }
        .preset-section-title:first-child {
          margin-top: 0;
        }
        
        /* NEW: Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #333;
          transition: .3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: #ff3366;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        
        /* NEW: Custom Instructions Textarea */
        .custom-instructions-textarea {
          width: 100%;
          min-height: 80px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #333;
          background: #1a1a1a;
          color: #fff;
          font-size: 0.8rem;
          resize: vertical;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .custom-instructions-textarea:focus {
          outline: none;
          border-color: #ff3366;
        }
        .custom-instructions-textarea.active {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }
        
        /* NEW: Section Header with Collapse */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 4px 0;
        }
        .section-header:hover {
          opacity: 0.8;
        }
        .collapse-icon {
          transition: transform 0.2s;
        }
        .collapse-icon.collapsed {
          transform: rotate(-90deg);
        }
        
        /* NEW: Template Dropdown */
        .template-select {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #444;
          background: #1a1a1a;
          color: #fff;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .template-select:focus {
          outline: none;
          border-color: #a855f7;
        }
        
        /* NEW: Status Indicator */
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          padding: 6px 10px;
          border-radius: 6px;
          background: #1a1a1a;
          border: 1px solid #333;
        }
        .status-indicator.ok {
          border-color: #22c55e;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }
        .status-indicator.error {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        /* NEW: Generate Panel Layout */
        .generate-btn-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .generate-btn-grid .btn-full {
          grid-column: 1 / -1;
        }
        
        /* NEW: Image Upload Area */
        .image-upload-area {
          border: 2px dashed #444;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 12px;
        }
        .image-upload-area:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }
        .image-upload-area.drag-over {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.15);
          border-style: solid;
        }
        .image-upload-area.has-image {
          border-color: #22c55e;
          border-style: solid;
        }
        .uploaded-image-preview {
          width: 100%;
          max-height: 120px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 8px;
        }
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
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
              <Cpu size={16} /> Gemini 3 Pro
            </button>
            <button 
              className={`engine-btn nbpgen ${engine === 'imggen' ? 'active' : ''}`}
              onClick={() => setEngine('imggen')}
              style={{ 
                background: engine === 'imggen' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                color: engine === 'imggen' ? 'white' : '#888'
              }}
            >
              <ImageIcon size={16} /> Nano Banana Pro
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

      {/* ═══ IMAGE GENERATION VIEW ═══ */}
      {engine === 'imggen' && (
        <ImageGenerationView />
      )}

      {/* ═══ MAIN LAYOUT (Prompt Generators) ═══ */}
      {engine !== 'watermark' && engine !== 'armscaler' && engine !== 'imggen' && (
      <div className="main-layout">
        
        {/* ═══ LEFT: GENERATE PANEL ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Image Analysis Section */}
          <div className="config-section">
            <div className="section-header" onClick={() => {}}>
              <h2 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImagePlus size={16} color="#8b5cf6" /> Image Analysis
              </h2>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            {!analyzedImage ? (
              <div 
                className={`image-upload-area ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={24} color={isDragOver ? '#8b5cf6' : '#666'} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8rem', color: isDragOver ? '#8b5cf6' : '#888' }}>
                  {isAnalyzingImage ? 'Analyzing...' : isDragOver ? 'Drop image here' : 'Drag image or click to upload'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                  Supports JPG, PNG, WEBP
                </div>
              </div>
            ) : (
              <div className="image-upload-area has-image">
                <img src={analyzedImage} alt="Analyzed" className="uploaded-image-preview" />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      background: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    New Image
                  </button>
                  <button
                    onClick={() => {
                      // Regenerate with current output format using current prompt (prose) as source
                      if (analyzedImage && currentPrompt) {
                        setIsAnalyzingImage(true)
                        fetch('/api/analyze-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            imageBase64: analyzedImage,
                            mode: 'auto',
                            outputFormat: nbpOutputFormat,
                            cachedDescription: currentPrompt // Use the prose prompt as source
                          })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.prompt) {
                            setCurrentPrompt(data.prompt)
                          }
                          setIsAnalyzingImage(false)
                        })
                        .catch(() => setIsAnalyzingImage(false))
                      }
                    }}
                    disabled={isAnalyzingImage || !currentPrompt}
                    style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      background: '#8b5cf6',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      opacity: (isAnalyzingImage || !currentPrompt) ? 0.5 : 1
                    }}
                  >
                    {isAnalyzingImage ? '...' : `Regen (${nbpOutputFormat})`}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                  <CheckCircle size={12} /> Analyzed
                </div>
              </div>
            )}
            
            <button 
              className="btn btn-purple"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzingImage}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isAnalyzingImage ? <><div className="spinner" /> Analyzing...</> : <><ImagePlus size={16} /> Drag Image</>}
            </button>
          </div>

          {/* Generate Buttons Section */}
          <div className="config-section">
            <h2 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wand2 size={16} color="#ff3366" /> Generate
            </h2>
            
            <div className="generate-btn-grid">
              <button 
                className={`btn btn-pink btn-full`}
                onClick={() => generatePrompt(false)}
                disabled={isGenerateDisabled()}
              >
                {loading ? <><div className="spinner" /> Working...</> : <><Sparkles size={16} /> Generate New</>}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => generatePrompt(true)}
                disabled={isGenerateDisabled() || !currentPrompt}
              >
                <RefreshCw size={14} /> Similar
              </button>
              
              <button 
                className="btn btn-orange"
                onClick={generate95PercentSame}
                disabled={isGenerateDisabled() || !currentPrompt}
              >
                <Percent size={14} /> 95% Same
              </button>
            </div>
          </div>

          {/* Custom Instructions Section */}
          <div className="config-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="#3b82f6" /> Custom
              </h2>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={customInstructionsEnabled}
                  onChange={(e) => {
                    setCustomInstructionsEnabled(e.target.checked)
                    if (!e.target.checked) setCustomInstructionsActive(false)
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            {customInstructionsEnabled && (
              <>
                <textarea
                  className={`custom-instructions-textarea ${customInstructionsActive ? 'active' : ''}`}
                  placeholder="Add custom instructions to guide the AI..."
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value)
                    setCustomInstructionsActive(e.target.value.trim().length > 0)
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    padding: '3px 8px', 
                    borderRadius: '4px',
                    background: customInstructionsActive ? 'rgba(34, 197, 94, 0.2)' : '#1a1a1a',
                    color: customInstructionsActive ? '#22c55e' : '#666',
                    border: `1px solid ${customInstructionsActive ? '#22c55e' : '#333'}`
                  }}>
                    {customInstructionsActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                  <button 
                    onClick={resetCustomInstructions}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#888', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Ollama Status */}
          <div className="status-indicator" style={{ 
            borderColor: ollamaStatus === 'connected' ? '#22c55e' : '#ef4444',
            color: ollamaStatus === 'connected' ? '#22c55e' : '#ef4444',
            background: ollamaStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: ollamaStatus === 'connected' ? '#22c55e' : '#ef4444',
              animation: ollamaStatus === 'checking' ? 'pulse 1.5s infinite' : 'none'
            }} />
            <span style={{ fontWeight: 600 }}>
              Ollama {ollamaStatus === 'connected' ? 'OK' : ollamaStatus === 'checking' ? 'Checking...' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* ═══ MIDDLE-LEFT: PRESETS PANEL ═══ */}
        <div className="presets-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="config-section">
            <div className="section-header" onClick={() => setPresetsCollapsed(!presetsCollapsed)}>
              <h2 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gem size={16} color="#f59e0b" /> Presets
              </h2>
              <ChevronDown size={16} className={`collapse-icon ${presetsCollapsed ? 'collapsed' : ''}`} />
            </div>
            
            {!presetsCollapsed && (
              <>
                {/* SFW Section */}
                <div className="preset-section-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={10} /> SFW
                  </span>
                </div>
                <div className="preset-grid">
                  {sfwPresets.map(preset => (
                    <button 
                      key={preset.id} 
                      className="preset-btn"
                      onClick={() => applyPreset(preset)}
                      title={preset.name}
                    >
                      {getPresetIcon(preset.name)}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{preset.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* NSFW Section */}
                <div className="preset-section-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <EyeOff size={10} /> NSFW
                  </span>
                </div>
                <div className="preset-grid">
                  {nsfwPresets.map(preset => (
                    <button 
                      key={preset.id} 
                      className="preset-btn"
                      onClick={() => applyPreset(preset)}
                      style={{ borderColor: '#331a1a' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff3366'
                        e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#331a1a'
                        e.currentTarget.style.background = '#1a1a1a'
                      }}
                      title={preset.name}
                    >
                      {getPresetIcon(preset.name)}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══ CENTER: CONFIGURATION PANEL ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* My Presets Section */}
          <div className="config-section">
            <div className="section-header" onClick={() => setMyPresetsCollapsed(!myPresetsCollapsed)}>
              <h2 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={16} color="#f59e0b" /> My Presets
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowNewPresetModal(true)
                  }}
                  title="Create new preset"
                >
                  <Plus size={16} />
                </button>
                <ChevronDown size={16} className={`collapse-icon ${myPresetsCollapsed ? 'collapsed' : ''}`} />
              </div>
            </div>
            
            {!myPresetsCollapsed && (
              <>
                {myPresets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#666', fontSize: '0.8rem' }}>
                    No custom presets yet.<br />
                    Click + to save current settings
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {myPresets.map(preset => (
                      <div 
                        key={preset.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          padding: '4px 8px',
                          background: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <span 
                          style={{ cursor: 'pointer' }}
                          onClick={() => loadCustomPreset(preset)}
                        >
                          {preset.name}
                        </span>
                        <button 
                          className="icon-btn"
                          onClick={(e) => deleteCustomPreset(preset.id, e)}
                          style={{ padding: '2px' }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dynamic Templates Section */}
          <div className="config-section">
            <h2 style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} color="#a855f7" /> Dynamic Templates
            </h2>
            <select 
              className="template-select"
              value={selectedTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              <option value="">Select a template...</option>
              {DYNAMIC_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {selectedTemplate && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
                {DYNAMIC_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
              </div>
            )}
          </div>

          {/* Main Configuration */}
          <div className="config-section">
            <div className="section-header" onClick={() => setConfigCollapsed(!configCollapsed)}>
              <h2 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings2 size={16} color="#3b82f6" /> Configuration
              </h2>
              <ChevronDown size={16} className={`collapse-icon ${configCollapsed ? 'collapsed' : ''}`} />
            </div>
            
            {!configCollapsed && (
              <>
                {/* ── Nano Banana Pro Options (shown only when Nano Banana Pro engine selected) ── */}
                {engine === 'nbp3' && (
                  <div className="nbp3-section">
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#a855f7', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={14} /> Nano Banana Pro Settings
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

                {/* ── Z-IMAGE TURBO SETTINGS Section ── */}
                {engine === 'zimage' && (
                  <div style={{ background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#ff3366', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} /> Z-IMAGE TURBO SETTINGS
                    </div>
                    
                    {/* OUTPUT FORMAT Toggle */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ff3366', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                        <Type size={10} style={{ display: 'inline' }} /> OUTPUT FORMAT
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => setNbpOutputFormat('prose')}
                          style={{ 
                            flex: 1, 
                            padding: '6px', 
                            borderRadius: '6px', 
                            border: `1px solid ${nbpOutputFormat === 'prose' ? '#ff3366' : '#333'}`, 
                            background: nbpOutputFormat === 'prose' ? 'rgba(255,51,102,0.2)' : '#1a1a1a', 
                            color: nbpOutputFormat === 'prose' ? '#ff3366' : '#888', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem', 
                            fontWeight: 600 
                          }}
                        >
                          <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />Prose
                        </button>
                        <button 
                          onClick={() => setNbpOutputFormat('json')}
                          style={{ 
                            flex: 1, 
                            padding: '6px', 
                            borderRadius: '6px', 
                            border: `1px solid ${nbpOutputFormat === 'json' ? '#ff3366' : '#333'}`, 
                            background: nbpOutputFormat === 'json' ? 'rgba(255,51,102,0.2)' : '#1a1a1a', 
                            color: nbpOutputFormat === 'json' ? '#ff3366' : '#888', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem', 
                            fontWeight: 600 
                          }}
                        >
                          <FileJson size={12} style={{ display: 'inline', marginRight: '4px' }} />JSON
                        </button>
                      </div>
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

                {/* ── Mode Selector ── */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                  <div className="tabs" style={{ marginBottom: '8px' }}>
                    <button className={mode === 'sfw' ? 'tab active' : 'tab'} onClick={() => handleModeChange('sfw')}>SFW</button>
                    <button className={mode === 'nsfw' ? 'tab active' : 'tab'} onClick={() => handleModeChange('nsfw')}>NSFW</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: OUTPUT & HISTORY ═══ */}
        <div className="history-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Output Section */}
          <div className="config-section" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={18} /> Output
              </h2>
              {currentPrompt && (
                <span className="badge badge-engine" style={getEngineBadgeStyle(engine)}>
                  {engine === 'nbp3' ? <><Cpu size={10} /> Nano Banana Pro</> : <><Zap size={10} /> Z-IMG</>}
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
              <div className="output-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', minHeight: '200px' }}>
                <span style={{ textAlign: 'center' }}>
                  {engine === 'nbp3' 
                    ? 'Select Nano Banana Pro settings and click "Generate New"'
                    : 'Click "Generate New" to create a prompt'
                  }
                </span>
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="config-section" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
                        {item.metadata?.engine === 'nbp3' ? <><Cpu size={10} /> Nano Banana Pro</> : <><Zap size={10} /> Z-IMG</>}
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
                  {selectedHistoryItem.metadata?.engine === 'nbp3' ? 'Nano Banana Pro' : 'Z-IMG'}
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

      {/* ═══ NEW PRESET MODAL ═══ */}
      {showNewPresetModal && (
        <div className="modal-overlay" onClick={() => setShowNewPresetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="#f59e0b" /> New Preset
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '6px' }}>Preset Name</label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., My Custom Girl"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#1a1a1a',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
                onKeyDown={(e) => e.key === 'Enter' && createNewPreset()}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowNewPresetModal(false)}>Cancel</button>
              <button 
                className="btn" 
                onClick={createNewPreset}
                disabled={!newPresetName.trim()}
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
