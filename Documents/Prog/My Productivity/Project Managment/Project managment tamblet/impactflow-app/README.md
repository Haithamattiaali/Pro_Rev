# ImpactFlow Pro - Impact-Based Project Management

A next-generation project management application that uses impact-based scoring instead of simple task counting, providing more meaningful insights into project health and progress.

## 🚀 Features

### Core Functionality
- **Impact-Based Scoring**: Multi-factor algorithm considering duration, dependencies, criticality, and resource allocation
- **Parent-Child Task Hierarchy**: Bottom-up progress calculation with weighted averages
- **Excel Import/Export**: Flexible column mapping for non-homogeneous data
- **Real-time Collaboration**: Live updates and approval workflows

### Sync-up Dashboard Components

1. **Project Pulse** 🫀
   - Real-time health gauge (0-100 score)
   - Vital signs monitoring (Schedule, Budget, Risk, Team Load)
   - Critical alerts with trend analysis

2. **Impact Matrix** 📊
   - 2x2 quadrant visualization
   - Task categorization (Critical Focus, Quick Wins, Risk Mitigation, Routine)
   - Interactive bubble chart with task details

3. **Resource Orchestra** 👥
   - Resource workload visualization
   - Efficiency tracking
   - Overallocation alerts
   - Team performance metrics

4. **Timeline Rhythm** 📅
   - Milestone tracking with risk indicators
   - Weekly delivery rhythm visualization
   - Critical path alerts
   - Time range filtering (week/month/quarter)

5. **Decision Command** 🎯
   - AI-powered decision alerts
   - Categorized by type (approval, escalation, resource, budget, timeline)
   - Priority-based filtering
   - Actionable recommendations

6. **Predictive Insights** 🔮
   - ML-based predictions with confidence levels
   - Project completion forecasting
   - Risk emergence patterns
   - Success pattern recognition
   - Resource optimization opportunities

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Animations**: Framer Motion
- **Charts**: Chart.js, D3.js
- **Forms**: React Hook Form with Zod validation
- **Excel Processing**: xlsx library

## 📦 Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the app directory
cd impactflow-app

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at http://localhost:3001

## 🎨 Design System

### Colors
- Primary: `#9e1f63` (Corporate purple)
- Success: `#27AE60`
- Warning: `#F39C12`
- Danger: `#E74C3C`
- Neutral: `#2d2d2d`

### Components
- Glass morphism effects
- Smooth animations
- Responsive grid layouts
- Interactive visualizations
- Progressive information disclosure

## 📊 Impact Score Algorithm

The impact score is calculated using multiple factors:

```typescript
Impact Score = (Base Score × Multipliers) × 100

Base Score = 
  Duration Weight (25%) +
  Dependency Weight (30%) +
  Criticality Weight (20%) +
  Timeline Position (25%)

Multipliers = 
  Blocking Factor ×
  Parallel Efficiency ×
  Resource Allocation
```

## 🔄 Project Structure

```
impactflow-app/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   │   └── dashboard/    # Sync-up dashboard components
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── public/              # Static assets
└── package.json         # Dependencies
```

## 🚦 Getting Started

1. **Create a Project**: Start with the landing page and create your first project
2. **Import Excel**: Use the Excel import feature to bring in existing task data
3. **View Dashboard**: Navigate to the project dashboard to see all 6 sync-up components
4. **Track Progress**: Monitor health, resources, timeline, and get AI-powered insights
5. **Make Decisions**: Use the Decision Command center for actionable recommendations

## 📝 Next Steps

- [ ] Complete Excel import with column mapping wizard
- [ ] Implement task management interface
- [ ] Add team collaboration features
- [ ] Create report builder
- [ ] Add real-time updates with Socket.io
- [ ] Implement authentication and RBAC
- [ ] Add email notifications

## 🤝 Contributing

This is a prototype implementation. For production use, additional features like authentication, data persistence, and security measures should be implemented.

---

Built with ❤️ using Next.js and TypeScript