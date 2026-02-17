# Z-Image Prompt Gen by ARMA

A fully local web application for generating optimized prompts for Z-Image Turbo AI image model using Ollama LLM integration.

## Features

- **Local LLM Integration**: Connects to Ollama running locally (no external APIs)
- **4-Step Prompt Structure**: Subject → Appearance → Environment → Technical
- **Dual Mode System**: SFW and NSFW content generation with toggle
- **Smart Variation Algorithm**: Generate "same girl, different scenario" prompts
- **History Management**: Save, favorite, search, and export prompts
- **Authentic Phone Selfie Aesthetic**: "2M followers but phone quality" style

## Prerequisites

- Ubuntu 20.04+ or 22.04+
- Node.js 18+ 
- Ollama installed

## Quick Installation

```bash
# Clone or extract the project
cd /path/to/arma-prompt-gen

# Run the installer
./install.sh
```

## Manual Installation

### 1. Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull the Model

```bash
ollama pull qwen2.5:7b-instruct
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Build Frontend

```bash
cd ..
npm install
npm run build
```

## Running the Application

### Option 1: Using the start script

```bash
./start.sh
```

### Option 2: Manual startup

Terminal 1 - Start Ollama:
```bash
ollama serve
```

Terminal 2 - Start Backend:
```bash
cd backend
npm start
```

Terminal 3 - Frontend Development (optional):
```bash
npm run dev
```

### Access the Application

Open your browser to: **http://localhost:3001**

## Architecture

```
arma-prompt-gen/
├── backend/
│   ├── server.js              # Express server
│   ├── services/
│   │   ├── ollama_client.js   # Ollama API integration
│   │   └── storage.js         # JSON file-based storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main application
│   │   ├── sections/          # UI components
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript definitions
│   └── dist/                  # Built frontend
├── install.sh                 # Installation script
├── start.sh                   # Startup script
└── README.md
```

## The 4-Step Prompt Structure

1. **Subject & Action**: Shot type, pose, expression, demographics
2. **Physical Appearance**: Features, hair, clothing, makeup
3. **Environment & Context**: Location, background, props
4. **Lighting & Technical**: Light source, camera quality, aesthetic

## Smart Variation Algorithm

When clicking "Generate Similar":
- **LOCKED**: ethnicity, age, eye color, hair color (maintain identity)
- **ROTATED**: location, outfit, lighting, expression, time of day
- **RANDOMIZED**: minor details (accessories, background clutter, phone angle)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate a new prompt |
| `/api/save` | POST | Save prompt to history |
| `/api/history` | GET | Get prompt history |
| `/api/favorite/:id` | PUT | Toggle favorite status |
| `/api/history/:id` | DELETE | Delete a prompt |
| `/api/export` | GET | Export prompts as JSON |
| `/api/ollama-status` | GET | Check Ollama connection |

## Environment Variables

```bash
PORT=3001                    # Backend server port
OLLAMA_URL=http://localhost:11434  # Ollama API URL
DEFAULT_MODEL=qwen2.5:7b-instruct  # Default LLM model
```

## Troubleshooting

### Ollama not connected
- Ensure Ollama is running: `ollama serve`
- Check Ollama status: `curl http://localhost:11434/api/tags`

### Model not found
- Pull the model: `ollama pull qwen2.5:7b-instruct`
- List available models: `ollama list`

### Port already in use
- Change the PORT in environment variables
- Or kill the process using port 3001: `sudo lsof -ti:3001 | xargs kill -9`

## Security & Privacy

- All processing is local - no data leaves your machine
- NSFW mode requires confirmation before enabling
- No cloud storage, no analytics, no tracking
- Prompts stored locally in JSON file

## License

MIT License - ARMA Project
