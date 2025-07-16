# Proceed Revenue Dashboard - Command Reference Guide

This document provides a comprehensive reference for all available commands in the Proceed Revenue Dashboard project, including testing, development, build, and quality assurance commands.

## Table of Contents
- [Development Commands](#development-commands)
- [Testing Commands](#testing-commands)
- [Code Quality Commands](#code-quality-commands)
- [Build & Deployment Commands](#build--deployment-commands)
- [Utility Scripts](#utility-scripts)
- [Backend-Specific Commands](#backend-specific-commands)

---

## Development Commands

### `npm run dev`
**Description**: Starts the frontend development server using Vite  
**Usage**: Main command for frontend development  
**Features**:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Runs on http://localhost:5173
- Auto-opens in browser

```bash
npm run dev
```

### `npm run dev:all`
**Description**: Starts both frontend and backend development servers simultaneously  
**Usage**: Full-stack development with auto-restart  
**What it does**:
- Runs frontend on port 5173
- Runs backend on port 3001
- Watches for file changes
- Auto-restarts on changes

```bash
npm run dev:all
```

### `npm run watch`
**Description**: Alternative command for `dev:all`  
**Usage**: Watches and runs all development servers

```bash
npm run watch
```

### `./start-dev.sh`
**Description**: Shell script that starts both frontend and backend with proper cleanup  
**Features**:
- Kills existing processes on ports
- Starts backend first, then frontend
- Handles Ctrl+C gracefully
- Shows server URLs

```bash
./start-dev.sh
```

---

## Testing Commands

### `npm test`
**Description**: Runs all frontend tests using Vitest  
**Usage**: Primary test command for development  
**Features**:
- Runs in watch mode by default
- Re-runs tests on file changes
- Shows test results in real-time
- Interactive test filtering

```bash
npm test
```

### `npm run test:ui`
**Description**: Opens Vitest's interactive UI in browser  
**Usage**: Visual test exploration and debugging  
**Features**:
- Browse test files visually
- See test results with source code
- Filter and run specific tests
- View test history

```bash
npm run test:ui
# Opens at http://localhost:51204/__vitest__/
```

### `npm run test:coverage`
**Description**: Runs tests once and generates coverage report  
**Usage**: Check test coverage metrics  
**Output**:
- Console coverage summary
- HTML report in `coverage/` directory
- Shows uncovered lines
- Tracks branches, functions, lines, statements

```bash
npm run test:coverage
# View report: open coverage/index.html
```

### `npm run test:watch`
**Description**: Runs tests in watch mode (same as `npm test`)  
**Usage**: Continuous testing during development

```bash
npm run test:watch
```

### `npm test -- --run`
**Description**: Runs tests once and exits (CI mode)  
**Usage**: For CI/CD pipelines or pre-commit hooks  
**Options**:
- `--reporter=verbose`: Detailed output
- `--reporter=json`: JSON output
- `--bail`: Stop on first failure

```bash
npm test -- --run
npm test -- --run --reporter=verbose
```

---

## Code Quality Commands

### `npm run lint`
**Description**: Runs ESLint on all JavaScript/JSX files  
**Usage**: Check code quality and style issues  
**Checks**:
- Syntax errors
- Code style violations
- React best practices
- Unused variables
- Console statements

```bash
npm run lint
```

### `npm run lint:fix`
**Description**: Runs ESLint and automatically fixes issues  
**Usage**: Auto-fix code style problems  
**Fixes**:
- Indentation
- Quotes (single vs double)
- Semicolons
- Spacing issues
- Some simple violations

```bash
npm run lint:fix
```

### `npm run format`
**Description**: Formats all code using Prettier  
**Usage**: Ensure consistent code formatting  
**Formats**:
- JavaScript/JSX files
- JSON files
- CSS files
- Markdown files

```bash
npm run format
```

### `npm run format:check`
**Description**: Checks if files are formatted correctly  
**Usage**: Verify formatting without changing files  
**Use cases**:
- Pre-commit hooks
- CI/CD checks
- PR validation

```bash
npm run format:check
```

### `npm run quality`
**Description**: Runs all quality checks (lint + format check + tests)  
**Usage**: Complete code quality validation  
**Order**:
1. ESLint check
2. Prettier format check
3. Test suite

```bash
npm run quality
```

---

## Build & Deployment Commands

### `npm run build`
**Description**: Creates production build of frontend  
**Usage**: Prepare for deployment  
**Output**:
- Optimized bundles in `dist/`
- Minified JavaScript
- Optimized CSS
- Asset optimization

```bash
npm run build
```

### `npm run preview`
**Description**: Preview production build locally  
**Usage**: Test production build before deployment  
**Features**:
- Serves from `dist/`
- Production-like environment
- Performance testing

```bash
npm run preview
# Runs on http://localhost:4173
```

---

## Utility Scripts

### `./run-tests.sh`
**Description**: Comprehensive test suite demonstration  
**Usage**: Show testing capabilities and results  
**Displays**:
- Test summary
- Coverage metrics
- Code quality status
- Available commands

```bash
./run-tests.sh
```

### Pre-commit Hook
**Location**: `.husky/pre-commit`  
**Description**: Runs tests and linting before git commit  
**Checks**:
1. All tests pass
2. No ESLint errors
3. Maximum warnings threshold

---

## Backend-Specific Commands

### `cd backend && npm start`
**Description**: Starts backend server in production mode  
**Usage**: Production backend deployment  
**Features**:
- No auto-restart
- Production optimizations
- Error logging only

```bash
cd backend && npm start
```

### `cd backend && npm run dev`
**Description**: Starts backend with nodemon  
**Usage**: Backend development with auto-restart  
**Features**:
- Watches for file changes
- Auto-restarts server
- Detailed logging
- Source maps

```bash
cd backend && npm run dev
```

### `cd backend && npm run init-db`
**Description**: Initializes database with schema  
**Usage**: Set up new database  
**Creates**:
- Tables
- Indexes
- Default data
- Migrations

```bash
cd backend && npm run init-db
```

### `cd backend && npm test`
**Description**: Runs backend test suite  
**Usage**: Test backend services and APIs  
**Tests**:
- ETL service
- API endpoints
- Database operations
- Error handling

```bash
cd backend && npm test
```

---

## Environment-Specific Commands

### Development Environment
```bash
# Start everything for development
npm run dev:all

# Or manually:
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2
```

### Testing Environment
```bash
# Run all tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/services/dataService.test.js

# Run tests matching pattern
npm test -- --grep "formatCurrency"
```

### Production Build
```bash
# Build and test
npm run build
npm run preview

# Deploy (example)
npm run build && netlify deploy --prod
```

### Quality Assurance
```bash
# Full quality check
npm run quality

# Fix all auto-fixable issues
npm run lint:fix && npm run format
```

---

## Command Combinations

### Pre-deployment Checklist
```bash
# 1. Run all quality checks
npm run quality

# 2. Build and test
npm run build && npm run preview

# 3. Check bundle size
du -sh dist/
```

### New Feature Workflow
```bash
# 1. Start development
npm run dev:all

# 2. Write tests
npm test -- --watch

# 3. Check coverage
npm run test:coverage

# 4. Fix quality issues
npm run lint:fix && npm run format
```

### Debugging Workflow
```bash
# 1. Run specific test
npm test -- --run src/components/MetricCard.test.jsx

# 2. Open test UI
npm run test:ui

# 3. Check with verbose output
npm test -- --run --reporter=verbose
```

---

## Tips & Best Practices

1. **Always run `npm run quality` before committing**
   - Ensures tests pass
   - Maintains code style
   - Prevents CI failures

2. **Use `npm run dev:all` for full-stack development**
   - Saves time switching terminals
   - Ensures both servers are in sync

3. **Run `npm run test:coverage` weekly**
   - Monitor coverage trends
   - Identify untested code
   - Maintain quality standards

4. **Use `npm run format` before PR reviews**
   - Reduces review comments
   - Ensures consistency
   - Focuses review on logic

5. **Leverage `npm run test:ui` for debugging**
   - Visual test exploration
   - Easier than console debugging
   - Great for complex test failures

---

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

### Tests Failing Unexpectedly
```bash
# Clear test cache
rm -rf node_modules/.vitest

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### ESLint/Prettier Conflicts
```bash
# Reset to clean state
npm run lint:fix
npm run format
git add -A
```

### Slow Test Performance
```bash
# Run without coverage
npm test -- --run --no-coverage

# Run specific suite
npm test -- --run ConnectionManager
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Start development | `npm run dev:all` |
| Run tests | `npm test` |
| Check coverage | `npm run test:coverage` |
| Fix code style | `npm run lint:fix` |
| Format code | `npm run format` |
| Full quality check | `npm run quality` |
| Build for production | `npm run build` |
| Preview build | `npm run preview` |

---

*Last updated: January 2025*