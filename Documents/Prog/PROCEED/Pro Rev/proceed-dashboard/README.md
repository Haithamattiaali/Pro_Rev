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

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

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