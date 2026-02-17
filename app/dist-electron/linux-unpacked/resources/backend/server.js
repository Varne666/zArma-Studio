const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'qwen2.5:7b-instruct';

app.use(cors());
app.use(express.json());

// Determine if running from Electron (check if we're in resources folder)
const isPackaged = fs.existsSync(path.join(__dirname, '../app/dist'));

// Static files path - CORRECTED PATHS
let staticPath;
if (isPackaged) {
  // In packaged app: backend is at resources/backend/, dist is at resources/app/dist
  staticPath = path.join(__dirname, '../app/dist');
} else {
  // In dev: backend is at app/backend/, dist is at app/dist
  staticPath = path.join(__dirname, '../dist');
}

console.log('Looking for static files at:', staticPath);
console.log('Directory exists:', fs.existsSync(staticPath));

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  console.log('✓ Serving static files from:', staticPath);
} else {
  console.error('✗ Static path not found:', staticPath);
  console.log('__dirname:', __dirname);
  console.log('Contents of parent:', fs.readdirSync(path.join(__dirname, '..')));
}

// Data directory - ALWAYS use home directory for writes
const DATA_DIR = path.join(os.homedir(), '.zimage-prompts', 'data');
console.log('Data directory:', DATA_DIR);

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory');
  }
} catch (err) {
  console.error('Failed to create data directory:', err);
}

app.get('/api/ollama-status', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    res.json({ status: 'connected', models: response.data.models || [] });
  } catch (error) {
    res.status(503).json({ status: 'disconnected', error: error.message });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { 
      ethnicity, age, height, eyeColor, hairColor, bodyType, 
      background, fitType, mode, breastSize, bootySize, pussyType,
      breastVisibility, bootyVisibility, pussyVisibility,
      skinTone,
      previousPrompt 
    } = req.body;
    
    const effectiveSkinTone = skinTone || 'natural';
    
    const getVisibilityPrompt = (part, size, visibility) => {
      if (visibility === 'hide') {
        if (part === 'breasts') return `Her ${size} breasts are completely concealed by loose clothing, turned away from camera, or blocked by objects/arms. No cleavage or shape visible.`;
        if (part === 'booty') return `Her ${size} glutes are fully covered by clothing, facing away, or obscured. No outline or shape visible.`;
        if (part === 'pussy') return `Her ${size} vulva is completely hidden by clothing, legs crossed, angle obstruction, or objects. No suggestion of it visible.`;
      }
      if (visibility === 'tease') {
        if (part === 'breasts') return `Her ${size} breasts are teased with deep cleavage visible, side-boob peeking, see-through fabric hinting at nipples, or barely contained in tight clothing. Suggestive but not fully exposed.`;
        if (part === 'booty') return `Her ${size} glutes are teased with underbun peeking, tight clothing outlining the shape, shorts riding up, or suggestive positioning. Partial visibility through fabric or angles.`;
        if (part === 'pussy') return `Her ${size} vulva is teased with cameltoe visible through tight clothes, damp fabric hinting at shape, upskirt potential, or suggestive positioning. Covered but shape is implied.`;
      }
      if (visibility === 'show') {
        if (part === 'breasts') return `Her ${size} breasts are fully exposed and visible, nipples showing, natural hang and shape clearly seen in the frame.`;
        if (part === 'booty') return `Her ${size} glutes are fully exposed, bare skin visible, natural shape and cellulite clearly shown.`;
        if (part === 'pussy') return `Her ${size} vulva is fully exposed, labia visible, natural arousal state showing.`;
      }
      if (visibility === 'seductive') {
        if (part === 'breasts') return `Her ${size} breasts are presented seductively - pushed together, nipples erect and prominent, glistening with oil/sweat, cupped by her hands or squeezed by clothing. Explicit sexual presentation emphasizing size and arousal.`;
        if (part === 'booty') return `Her ${size} glutes are presented seductively - spread slightly, hands gripping or slapping them, oiled and glistening, positioned high in the air or spread toward camera. Explicit sexual presentation emphasizing size and plumpness.`;
        if (part === 'pussy') return `Her ${size} vulva is presented seductively - spread open with fingers, glistening wetness visible, swollen aroused state, close-up framing. Explicit sexual presentation emphasizing arousal and detail.`;
      }
      return '';
    };

    const breastPrompt = mode === 'nsfw' ? getVisibilityPrompt('breasts', breastSize || 'large', breastVisibility || 'show') : '';
    const bootyPrompt = mode === 'nsfw' ? getVisibilityPrompt('booty', bootySize || 'large', bootyVisibility || 'show') : '';
    const pussyPrompt = mode === 'nsfw' ? getVisibilityPrompt('pussy', pussyType || 'innie', pussyVisibility || 'show') : '';

    const systemPrompt = `You are an expert AI image prompt engineer specializing in Z-Image Turbo. Create detailed, authentic phone selfie prompts in a SINGLE flowing paragraph format.

STRICT FORMAT - Follow this exact structure in one paragraph:

[SHOT TYPE] of a [AGE]-year-old [ETHNICITY] woman, [HEIGHT], [SKIN TONE] skin tone, with [HAIR COLOR] hair and [EYE COLOR] eyes, [BODY TYPE] build, [ACTION/POSE] in [LOCATION]. She wears [CLOTHING DETAILS]. Makeup is [MAKEUP STYLE]. [EXPRESSION DESCRIPTION]. [LIGHTING DETAILS]. Background shows [ENVIRONMENT DETAILS with clutter/props]. [TECHNICAL/CAMERA QUALITY].

${mode === 'nsfw' ? `NSFW VISIBILITY CONTROLS (MANDATORY):
${breastPrompt}
${bootyPrompt}
${pussyPrompt}

Additional NSFW context:
- Expression: ${breastVisibility === 'seductive' || bootyVisibility === 'seductive' || pussyVisibility === 'seductive' ? 'intensely aroused, mouth open, heavy breathing, eyes begging' : 'seductive, sultry, parted lips, bitten lip, flushed cheeks'}
- Clothing: ${breastVisibility === 'hide' || bootyVisibility === 'hide' || pussyVisibility === 'hide' ? 'strategic covering, loose fabric, shadows, objects blocking view' : breastVisibility === 'tease' || bootyVisibility === 'tease' || pussyVisibility === 'tease' ? 'see-through, tight, barely covering, wet fabric' : 'revealing, minimal, lingerie or nude'}
- Poses: ${breastVisibility === 'seductive' ? 'chest pushed forward, arching back to present breasts' : ''} ${bootyVisibility === 'seductive' ? 'doggy style position, back arched, presenting rear to camera' : ''} ${pussyVisibility === 'seductive' ? 'legs spread wide, knees up, intimate exposure' : ''}`
: `SFW REQUIREMENTS:
- Focus on fashion, beauty, and "thirst trap" aesthetic without nudity
- Clothing: tight shorts, leggings, yoga pants, mini skirts, crop tops, tight dresses (emphasize fit on body)
- Emphasize how the outfit hugs her curves but keep descriptions fashion-focused
- No exposed intimate body parts, no sexual acts, no explicit sexual descriptions
- Keep it Instagram-safe: suggestive but not explicit, focus on beauty and style`}

CRITICAL RULES:
- Shot type: mirror selfie, selfie taken on her phone, friend-taken photo on phone, POV shot, etc.
- Lighting: golden hour, warm tungsten, ring light, natural light with crushed blacks/deep shadows
- Environment: include specific clutter (water bottles, fairy lights, plants, rumpled sheets, phone charger, makeup products, etc.)
- Technical: amateur iPhone quality, grainy texture, crushed blacks, overexposed highlights, authentic amateur snapshot, VSCO aesthetic
- Skin: ${effectiveSkinTone} tone, glowing, ${mode === 'nsfw' ? 'natural texture with visible pores' : 'smooth filtered look'}

Return ONLY the single paragraph prompt. No numbered lists. No bullet points. One continuous flowing paragraph.`;

    const userPrompt = previousPrompt 
      ? `Generate a similar prompt to this one but change the scenario:\n\n${previousPrompt}\n\nKeep the same person but change: location, outfit, lighting, expression. Use these specs: ${ethnicity}, ${age}, ${height}, ${effectiveSkinTone} skin, ${hairColor} hair, ${eyeColor} eyes, ${bodyType} body, wearing ${fitType}, in ${background}.`
      : `Generate a ${mode} phone selfie prompt for a ${ethnicity} woman, ${age} years old, ${height}, ${effectiveSkinTone} skin tone, ${hairColor} hair, ${eyeColor} eyes, ${bodyType} body type, wearing ${fitType}, location: ${background}. ${mode === 'nsfw' ? `Physical attributes: ${breastSize} breasts (${breastVisibility}), ${bootySize} booty (${bootyVisibility}), ${pussyType} pussy (${pussyVisibility}).` : 'Keep it SFW, fashion-focused, Instagram thirst-trap style.'} Single paragraph only.`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: DEFAULT_MODEL,
      prompt: userPrompt,
      system: systemPrompt,
      stream: false,
      options: { temperature: 0.8 }
    });

    res.json({ 
      prompt: response.data.response,
      metadata: { ethnicity, age, mode, skinTone: effectiveSkinTone, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/save', (req, res) => {
  try {
    const { prompt, metadata } = req.body;
    const historyPath = path.join(DATA_DIR, 'history.json');
    
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    
    const entry = {
      id: Date.now().toString(),
      prompt,
      metadata,
      favorite: false,
      createdAt: new Date().toISOString()
    };
    
    history.unshift(entry);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    
    res.json({ success: true, id: entry.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const historyPath = path.join(DATA_DIR, 'history.json');
    if (!fs.existsSync(historyPath)) return res.json([]);
    
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const { mode, search } = req.query;
    
    let filtered = history;
    if (mode && mode !== 'all') {
      filtered = filtered.filter(h => h.metadata?.mode === mode);
    }
    if (search) {
      filtered = filtered.filter(h => h.prompt.toLowerCase().includes(search.toLowerCase()));
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/favorite/:id', (req, res) => {
  try {
    const historyPath = path.join(DATA_DIR, 'history.json');
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    
    const entry = history.find(h => h.id === req.params.id);
    if (entry) {
      entry.favorite = !entry.favorite;
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const historyPath = path.join(DATA_DIR, 'history.json');
    let history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    history = history.filter(h => h.id !== req.params.id);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/export', (req, res) => {
  try {
    const historyPath = path.join(DATA_DIR, 'history.json');
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=prompts.json');
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SPA fallback - MUST be after API routes
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not built. index.html not found at: ' + indexPath);
  }
});

app.listen(PORT, () => {
  console.log(`Z-Image Backend running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
