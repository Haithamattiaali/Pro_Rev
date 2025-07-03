# ImpactFlow Pro - Development Guide

## 🚀 Continuous Development Setup

This project is configured for automatic development with hot reloading and auto-restart capabilities.

### Quick Start

Simply run one of these commands:

```bash
# Option 1: Auto-restart Next.js only
npm run dev:watch

# Option 2: Auto-restart Next.js + Socket.io
npm run dev:all

# Option 3: Use the interactive script
./start-dev.sh

# Option 4: Simple auto-dev mode
./auto-dev.sh
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Standard Next.js development |
| `npm run dev:watch` | Next.js with auto-restart on file changes |
| `npm run dev:socket` | Standard Socket.io server |
| `npm run dev:socket:watch` | Socket.io with auto-restart |
| `npm run dev:all` | Both servers with auto-restart |

### Auto-Restart Features

The development server will automatically restart when you modify:
- TypeScript files (`*.ts`, `*.tsx`)
- JavaScript files (`*.js`, `*.jsx`)
- CSS files (`*.css`)
- JSON configuration files
- Server files

### VS Code Integration

If you're using VS Code:

1. The server can auto-start when you open the project
2. Use `Cmd+Shift+P` → `Tasks: Run Task` → Select "Start Dev Server (Auto-Restart)"
3. The terminal will show live logs with hot reloading

### PM2 Alternative (Advanced)

For a more production-like development experience:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Stop all
pm2 stop all
```

### Benefits

1. **No Manual Restarts**: Changes are detected automatically
2. **Fast Refresh**: React components update without losing state
3. **Error Recovery**: Server restarts on crashes
4. **Real-time Updates**: Socket.io connections maintained
5. **Background Running**: Continues running even if terminal is closed (PM2)

### Troubleshooting

If the server doesn't start:
1. Check if port 3001 is in use: `lsof -i:3001`
2. Kill existing processes: `npx kill-port 3001`
3. Clear Next.js cache: `rm -rf .next`

### File Watching

Watched directories:
- `/src` - All source code
- `/public` - Static assets
- `/server.js` - Socket.io server
- `/package.json` - Dependencies

Ignored:
- `/node_modules`
- `/.next`
- `/build`
- `/.git`

## 🎯 Development Workflow

1. Open terminal in project directory
2. Run `./auto-dev.sh` or `npm run dev:watch`
3. Open browser to `http://localhost:3001`
4. Make changes to any file
5. Save the file
6. Watch the browser auto-refresh!

No more manual `npm run dev` needed! 🎉