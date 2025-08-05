# Proceed Revenue Dashboard

Professional React dashboard for visualizing Proceed logistics revenue performance.

## Features

- **Executive Overview**: High-level KPIs and achievement metrics
- **Business Unit Analysis**: Detailed performance by Transportation and Warehouses
- **Customer Performance**: Comprehensive customer achievement tracking
- **Period Comparisons**: MTD, QTD, and YTD performance analysis
- **Professional Design**: Following brand guidelines with responsive layouts

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Recharts for data visualization
- React Router for navigation
- Lucide React for icons

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm 8.x or higher

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd proceed-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file for local development
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

4. Run development server:
```bash
# Start both frontend and backend
npm run start

# Or run separately:
npm run dev      # Frontend only
npm run backend  # Backend only
```

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Testing

#### Running Tests

**Important Note**: Tests currently fail when run from a directory path containing spaces. If your project is in a path like `/Pro Rev/`, you'll need to either:
1. Move the project to a path without spaces
2. Run tests in CI/CD (GitHub Actions)
3. Use a Docker container

```bash
# Frontend tests
npm test                    # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:ui            # Run tests with UI interface

# Backend tests
cd backend && npm test      # Run backend tests

# E2E tests
npm run test:e2e           # Run Playwright E2E tests
```

#### Test Structure

- **Unit Tests**: Located alongside components in `*.test.{js,jsx}` files
- **E2E Tests**: Located in `e2e/` directory using Playwright
- **Coverage Target**: 100% (configured in `vitest.config.js`)

#### Continuous Integration

Tests run automatically on push/PR via GitHub Actions:
- Frontend unit tests (Node 18.x, 20.x)
- Backend unit tests (Node 18.x, 20.x)
- E2E tests with Playwright
- Build verification

### Development Tools

```bash
# Run both frontend and backend with file watching
npm run watch       # or npm run dev:all

# Code quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
npm run format      # Format code with Prettier
npm run quality     # Run all quality checks
```

### Deployment

This project is configured for deployment on Netlify. The frontend is served as a static site, while the backend API should be deployed separately.

For Netlify deployment:
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables in Netlify dashboard

## Project Structure

```
src/
├── components/
│   ├── cards/         # Reusable card components
│   ├── charts/        # Chart components
│   └── layout/        # Layout components
├── data/              # Data imports and services
├── pages/             # Page components
├── utils/             # Utility functions
└── main.jsx          # Application entry point
```

## Data Sources

The dashboard reads from JSON files in the parent directory:
- Landing_Achievement.json
- Business_Unit_Landing.json
- Business_Unit_Period_Breakdown.json
- Customer_Achievement.json
- Customer_By_Service_Type.json# Redeploy Tue Aug  5 06:35:41 +03 2025
