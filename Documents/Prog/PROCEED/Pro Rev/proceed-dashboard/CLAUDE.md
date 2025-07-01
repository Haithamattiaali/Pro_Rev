# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Proceed Revenue Dashboard - A full-stack revenue analytics dashboard with React frontend and Express/SQLite backend. The project is deployed with frontend on Netlify and backend on Render.

## Development Commands

### Frontend Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Commands
```bash
cd backend
npm install          # Install backend dependencies
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start production server
npm run init-db      # Initialize database (scripts/init-database.js)
```

### Full Stack Development
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend && npm run dev
```

## Architecture & Key Design Patterns

### Frontend Architecture
- **React 18 + Vite** - Fast development with HMR
- **State Management** - Context API for global state (FilterContext, DataRefreshContext)
- **Routing** - React Router v6 with nested routes
- **Data Visualization** - Recharts for charts, custom gauge components
- **Styling** - Tailwind CSS with custom brand colors (see tailwind.config.js)
- **API Communication** - Centralized through `connectionManager.js` with retry logic and health checks

### Backend Architecture
- **Express.js** - RESTful API with CORS configuration
- **Database** - SQLite with better-sqlite3, persistent connection wrapper
- **File Uploads** - Multer for Excel file handling
- **ETL Process** - Excel processing with xlsx library, data validation and transformation
- **Middleware** - Request timeout, connection health checks, error recovery

### Key Architectural Decisions

1. **Connection Management**: The frontend uses a ConnectionManager class that handles:
   - Automatic health checks before API calls
   - Retry logic with exponential backoff
   - Queue management for failed requests
   - Graceful degradation in production

2. **Data Caching**: Frontend DataService implements 5-minute cache with manual clear capability for immediate updates after uploads

3. **Database Persistence**: 
   - Development: Local SQLite file in `backend/database/`
   - Production: Uses `/tmp/` (temporary) or `/var/data/` (with Render disk)

4. **CORS Configuration**: Production allows all HTTPS origins, development has explicit whitelist

5. **Global Data Refresh**: DataRefreshContext provides app-wide data synchronization after uploads

## Deployment Configuration

### Frontend (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL` (set to backend URL)
- Configuration: `netlify.toml`

### Backend (Render)
- Root directory: `backend` (when deploying from monorepo)
- Build command: `npm install`
- Start command: `node server.js`
- Configuration: `render.yaml`
- Disk mount: `/var/data` for persistent SQLite storage

## Data Flow

1. **Upload Flow**: 
   - User uploads Excel → Multer processes → ETL validates/transforms → Database insert/update
   - Global refresh triggered → Cache cleared → All components refetch

2. **Query Flow**:
   - Component requests data → DataService checks cache → ConnectionManager ensures health → API call with retry → Data transformation → Component render

3. **Period Filtering**:
   - FilterContext maintains global period state (MTD/QTD/YTD)
   - Components subscribe to filter changes
   - API queries include year, period, month, quarter parameters

## Critical Files & Their Roles

- `src/services/connectionManager.js` - API health checks and retry logic
- `src/services/dataService.js` - Data caching and API abstraction
- `src/contexts/DataRefreshContext.jsx` - Global refresh orchestration
- `backend/services/etl.service.js` - Excel processing and validation
- `backend/database/persistent-db.js` - SQLite connection management
- `backend/server.js` - CORS, routing, and middleware setup

## Common Issues & Solutions

1. **"Backend connection is not available"** - Backend is down or CORS issue. Check health endpoint and CORS config.

2. **Data not refreshing after upload** - DataService cache needs clearing. Already handled by DataRefreshContext.

3. **Upload fails with 500** - Check file format matches expected columns, ensure upload directory exists.

4. **Render deployment fails** - Check disk mount permissions, use `/tmp` if `/var/data` unavailable.

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api  # Development
VITE_API_URL=https://your-backend.onrender.com/api  # Production
```

### Backend (.env)
```
NODE_ENV=production
PORT=3001
```