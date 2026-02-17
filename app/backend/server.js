const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'dolphin-mistral:7b';

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Determine if running from Electron
const isPackaged = fs.existsSync(path.join(__dirname, '../app/dist'));

// Static files path
let staticPath;
if (isPackaged) {
  staticPath = path.join(__dirname, '../app/dist');
} else {
  staticPath = path.join(__dirname, '../dist');
}

console.log('Looking for static files at:', staticPath);
console.log('Directory exists:', fs.existsSync(staticPath));

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  console.log('✓ Serving static files from:', staticPath);
} else {
  console.error('✗ Static path not found:', staticPath);
}

// Data directory
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

// ═══════════════════════════════════════════════════════════════
// AUTO CLEANUP - Removes temp files but keeps saved prompts
// ═══════════════════════════════════════════════════════════════

function cleanupTempFiles() {
  const tmpDir = os.tmpdir();
  const patterns = ['armscaler_*', 'zimage_*', 'input_*.png', 'output_*.png'];
  
  let cleaned = 0;
  let freedBytes = 0;
  
  try {
    const files = fs.readdirSync(tmpDir);
    
    for (const file of files) {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(file)) {
          const filePath = path.join(tmpDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              freedBytes += stats.size;
              fs.unlinkSync(filePath);
            }
            cleaned++;
          } catch (e) {
            // File might be in use, skip
          }
          break;
        }
      }
    }
    
    if (cleaned > 0) {
      const mb = (freedBytes / 1024 / 1024).toFixed(1);
      console.log(`🧹 Cleaned ${cleaned} temp files, freed ~${mb} MB`);
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

// Cleanup on startup
cleanupTempFiles();

// Cleanup every 30 minutes
setInterval(cleanupTempFiles, 30 * 60 * 1000);

// Cleanup endpoint (manual trigger)
app.post('/api/cleanup', (req, res) => {
  cleanupTempFiles();
  res.json({ success: true, message: 'Cleanup completed' });
});

// Check Python availability
let pythonCmd = null;
(async () => {
  for (const cmd of ['python3', 'python']) {
    try {
      await new Promise((resolve, reject) => {
        execFile(cmd, ['--version'], { timeout: 5000 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      pythonCmd = cmd;
      console.log(`✓ Python available: ${cmd}`);
      break;
    } catch (e) {}
  }
  if (!pythonCmd) {
    console.log('✗ Python not found');
  }
})();

app.get('/api/ollama-status', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    res.json({ status: 'connected', models: response.data.models || [] });
  } catch (error) {
    res.status(503).json({ status: 'disconnected', error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ARMscaler (DiffBIR) API
// ═══════════════════════════════════════════════════════════════

const ARMSCALER_SCRIPT = path.join(__dirname, 'armscaler_simple.py');
const ARMSCALER_QUICK_STATUS = path.join(__dirname, 'armscaler_quick_status.py');
const DIFFBIR_DIR = path.join(__dirname, 'diffbir_engine');

// Simple status check (no persistent server)
app.get('/api/armscaler-status', async (req, res) => {
  try {
    if (!pythonCmd) {
      return res.json({
        available: false,
        message: 'Python not available',
        gpu: { available: false, name: 'Unknown', vram_gb: 0 }
      });
    }
    
    const result = await new Promise((resolve, reject) => {
      execFile(pythonCmd, [ARMSCALER_QUICK_STATUS], { timeout: 10000 }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
    });
    
    const status = JSON.parse(result);
    res.json(status);
  } catch (error) {
    console.error('ARMscaler status error:', error.message);
    const diffbirExists = fs.existsSync(path.join(DIFFBIR_DIR, 'inference.py'));
    res.json({
      available: diffbirExists,
      message: error.message,
      setup_complete: diffbirExists,
      gpu: { available: false, name: 'Unknown', vram_gb: 0 }
    });
  }
});

// Job tracking
const armScalerJobs = {};

// Start processing job
app.post('/api/armscaler/job', async (req, res) => {
  const { imageBase64, task = 'sr', upscale = 4, quality = 'balanced' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image data' });
  
  const crypto = require('crypto');
  const jobId = crypto.randomUUID();
  
  const job = {
    id: jobId,
    status: 'running',
    startTime: Date.now(),
    endTime: null,
    logs: [['info', 'Starting ARMscaler inference...']],
    resultBase64: null,
    error: null,
    progress: 10
  };
  armScalerJobs[jobId] = job;
  
  // Process in background
  const tmpDir = path.join(os.tmpdir(), `armscaler_${jobId}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  
  const inputPath = path.join(tmpDir, 'input.png');
  const outputPath = path.join(tmpDir, 'output.png');
  
  // Write input
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(inputPath, Buffer.from(base64Data, 'base64'));
  
  // Spawn process
  const env = {
    ...process.env,
    PYTHONPATH: `${DIFFBIR_DIR}:${process.env.PYTHONPATH || ''}`,
    PYTHONUNBUFFERED: '1',
    PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:512,expandable_segments:True',
    NVIDIA_TF32_OVERRIDE: '1'
  };
  
  const child = spawn(pythonCmd || 'python3', [
    ARMSCALER_SCRIPT,
    inputPath,
    outputPath,
    '--task', task,
    '--upscale', String(upscale),
    '--quality', quality
  ], { env });
  
  let stdoutBuffer = '';
  let stderrBuffer = '';
  
  child.stdout.on('data', (data) => {
    stdoutBuffer += data.toString();
    job.progress = Math.min(90, job.progress + 5);
    
    // Parse progress from output
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.includes('Server:')) {
        job.logs.push(['info', line.replace(/.*Server:\s*/, '')]);
      } else if (line.includes('inference') || line.includes('Processing')) {
        job.logs.push(['info', line.trim()]);
      }
    }
  });
  
  child.stderr.on('data', (data) => {
    stderrBuffer += data.toString();
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        job.logs.push(['info', line.trim()]);
      }
    }
  });
  
  child.on('close', (code) => {
    if (code === 0 && fs.existsSync(outputPath)) {
      try {
        const buf = fs.readFileSync(outputPath);
        job.resultBase64 = buf.toString('base64');
        job.status = 'done';
        job.progress = 100;
        job.logs.push(['success', 'Processing complete']);
      } catch (e) {
        job.status = 'error';
        job.error = 'Failed to read output';
        job.logs.push(['error', 'Failed to read output file']);
      }
    } else {
      job.status = 'error';
      job.error = stderrBuffer.slice(-500) || 'Processing failed';
      job.logs.push(['error', 'Processing failed']);
    }
    
    job.endTime = Date.now();
    
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  });
  
  res.json({ job_id: jobId });
});

app.get('/api/armscaler/job/:id', (req, res) => {
  const job = armScalerJobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    logs: job.logs.map(([type, msg]) => `[${type}] ${msg}`),
    error: job.error,
    imageBase64: job.status === 'done' ? job.resultBase64 : undefined,
    startTime: job.startTime,
    endTime: job.endTime
  });
});

// Synchronous endpoint (for simple use)
app.post('/api/armscaler', async (req, res) => {
  const { imageBase64, task = 'sr', upscale = 4, quality = 'balanced' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image data' });
  
  try {
    // Create temp files
    const tmpDir = path.join(os.tmpdir(), `armscaler_sync_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    
    const inputPath = path.join(tmpDir, 'input.png');
    const outputPath = path.join(tmpDir, 'output.png');
    
    // Write input
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(inputPath, Buffer.from(base64Data, 'base64'));
    
    // Run inference
    const env = {
      ...process.env,
      PYTHONPATH: `${DIFFBIR_DIR}:${process.env.PYTHONPATH || ''}`,
      PYTHONUNBUFFERED: '1',
      PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:512,expandable_segments:True',
      NVIDIA_TF32_OVERRIDE: '1'
    };
    
    await new Promise((resolve, reject) => {
      const child = spawn(pythonCmd || 'python3', [
        ARMSCALER_SCRIPT,
        inputPath,
        outputPath,
        '--task', task,
        '--upscale', String(upscale),
        '--quality', quality
      ], { env });
      
      let stderr = '';
      child.stderr.on('data', (d) => {
        stderr += d.toString();
        console.log(`[ARMscaler] ${d.toString().trim()}`);
      });
      
      child.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve();
        } else {
          reject(new Error(stderr.slice(-500) || 'Processing failed'));
        }
      });
    });
    
    // Read result
    const buf = fs.readFileSync(outputPath);
    
    // Cleanup
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    
    res.json({ imageBase64: buf.toString('base64'), engine: 'diffbir' });
    
  } catch (err) {
    console.error('ARMscaler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Watermark Removal API
// ═══════════════════════════════════════════════════════════════

const INPAINT_SCRIPT = path.join(__dirname, 'inpaint_lama.py');
const MODEL_PATH = path.join(__dirname, 'models', 'lama_fp32.onnx');

app.get('/api/inpaint-status', (req, res) => {
  const available = fs.existsSync(MODEL_PATH) && pythonCmd !== null;
  res.json({ available, modelPath: MODEL_PATH });
});

app.post('/api/inpaint', async (req, res) => {
  if (!fs.existsSync(MODEL_PATH)) {
    return res.status(503).json({ error: 'LaMa model not found' });
  }
  
  const { imageBase64, mask } = req.body;
  if (!imageBase64 || !mask) {
    return res.status(400).json({ error: 'Missing imageBase64 or mask' });
  }
  
  const tmpDir = path.join(os.tmpdir(), 'zimage-inpaint');
  try {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const ts = Date.now();
    const inputPath = path.join(tmpDir, `input_${ts}.png`);
    const outputPath = path.join(tmpDir, `output_${ts}.png`);
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(inputPath, Buffer.from(base64Data, 'base64'));
    
    const args = [
      INPAINT_SCRIPT,
      inputPath,
      outputPath,
      String(Math.round(mask.x)),
      String(Math.round(mask.y)),
      String(Math.round(mask.w)),
      String(Math.round(mask.h)),
      String(Math.round(mask.padding || 3)),
      MODEL_PATH
    ];
    
    await new Promise((resolve, reject) => {
      execFile(pythonCmd || 'python3', args, { timeout: 60000 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output not created');
    }
    
    const resultBuffer = fs.readFileSync(outputPath);
    const resultBase64 = 'data:image/png;base64,' + resultBuffer.toString('base64');
    
    try { fs.unlinkSync(inputPath); } catch(e) {}
    try { fs.unlinkSync(outputPath); } catch(e) {}
    
    res.json({ imageBase64: resultBase64, engine: 'lama-onnx' });
    
  } catch (error) {
    console.error('Inpaint error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Prompt Generation API
// ═══════════════════════════════════════════════════════════════

app.post('/api/generate', async (req, res) => {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: DEFAULT_MODEL,
      prompt: req.body.prompt || 'Generate a prompt',
      stream: false,
      options: { temperature: 0.8 }
    }, { timeout: 120000 });
    
    res.json({ prompt: response.data.response });
  } catch (error) {
    console.error('Generation error:', error.message);
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
    res.json(history);
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

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not built');
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n🔥 zArma Studio Backend running on port ${PORT}`);
  console.log(`   Ollama: ${OLLAMA_URL}`);
  console.log(`   Data: ${DATA_DIR}\n`);
});

server.requestTimeout = 0;
server.keepAliveTimeout = 0;
