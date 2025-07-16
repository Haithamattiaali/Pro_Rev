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
- Customer_By_Service_Type.json