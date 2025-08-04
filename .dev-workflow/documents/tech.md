# Tech Document - Proceed Revenue Dashboard

## Programming Languages

### Frontend
- **JavaScript (ES6+)**: Primary language for React components
- **JSX**: React component syntax
- **CSS**: Styling with Tailwind utility classes
- **TypeScript**: Partial usage in export services (*.ts files)

### Backend
- **JavaScript (Node.js)**: Server-side runtime
- **SQL**: SQLite database queries

## Core Technologies

### Frontend Stack

#### Runtime & Framework
- **React**: v18.2.0 - UI library
- **React DOM**: v18.2.0 - DOM rendering
- **React Router DOM**: v6.22.0 - Client-side routing

#### Build & Development
- **Vite**: v5.1.0 - Build tool and dev server
- **@vitejs/plugin-react**: v4.2.1 - React support for Vite

#### Styling
- **Tailwind CSS**: v3.4.1 - Utility-first CSS framework
- **PostCSS**: v8.4.35 - CSS processing
- **Autoprefixer**: v10.4.17 - CSS vendor prefixes
- **@emotion/react**: v11.14.0 - CSS-in-JS (MUI dependency)
- **@emotion/styled**: v11.14.1 - Styled components

#### UI Components & Icons
- **Lucide React**: v0.356.0 - Icon library
- **@heroicons/react**: v2.2.0 - Additional icons
- **@headlessui/react**: v2.2.4 - Unstyled UI components
- **@radix-ui/react-***: Various - Accessible component primitives
- **@mui/material**: v7.2.0 - Material UI components

#### Data Visualization
- **Recharts**: v2.12.0 - Chart library
- **D3.js** (via Recharts): Data visualization

#### State & Data Management
- **React Context API**: Built-in state management
- **Lodash**: v4.17.21 - Utility functions

#### Animation
- **Framer Motion**: v11.18.2 - Animation library

#### Date Handling
- **date-fns**: v3.3.1 - Date utility library

#### File Processing
- **xlsx**: v0.18.5 - Excel file parsing/generation
- **html2canvas**: v1.4.1 - Screenshot generation
- **jspdf**: v3.0.1 - PDF generation
- **pptxgenjs**: v4.0.1 - PowerPoint generation

### Backend Stack

#### Runtime & Framework
- **Node.js**: v18.x or v20.x - JavaScript runtime
- **Express.js**: Web application framework

#### Database
- **SQLite3**: Embedded database
- **better-sqlite3**: SQLite Node.js driver

#### Middleware & Utilities
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **Body-parser**: Request body parsing

### Testing

#### Frontend Testing
- **Vitest**: v3.2.4 - Test runner
- **@testing-library/react**: v16.3.0 - React testing utilities
- **@testing-library/jest-dom**: v6.6.3 - DOM matchers
- **@testing-library/user-event**: v14.6.1 - User interaction simulation
- **jsdom**: v26.1.0 - DOM implementation
- **@vitest/coverage-v8**: v3.2.4 - Code coverage
- **@vitest/ui**: v3.2.4 - Test UI

#### End-to-End Testing
- **@playwright/test**: v1.54.1 - E2E testing framework

#### Backend Testing
- **Jest**: Test runner for backend
- **Supertest**: HTTP assertion library

### Code Quality

#### Linting
- **ESLint**: v8.56.0 - JavaScript linter
- **@typescript-eslint/eslint-plugin**: v8.36.0 - TypeScript ESLint rules
- **@typescript-eslint/parser**: v8.36.0 - TypeScript parser
- **eslint-plugin-react**: v7.33.2 - React specific rules
- **eslint-plugin-react-hooks**: v4.6.0 - React Hooks rules
- **eslint-plugin-react-refresh**: v0.4.5 - React Refresh rules

#### Formatting
- **Prettier**: v3.6.2 - Code formatter
- **eslint-config-prettier**: v10.1.5 - ESLint Prettier config
- **eslint-plugin-prettier**: v5.5.1 - Prettier ESLint plugin

### Development Tools

#### Version Control
- **Git**: Source control
- **GitHub**: Repository hosting
- **Husky**: v3.x - Git hooks

#### File Watching
- **Chokidar**: v3.6.0 - File system watcher
- **Custom watch script**: `watch-dev.js`

#### TypeScript
- **TypeScript**: v5.8.3 - Type checking (partial usage)

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api  # Backend API URL
```

### Backend (.env)
```
NODE_ENV=development/production
PORT=3001
DATABASE_PATH=./database/proceed_revenue.db
```

## Build Scripts

### Frontend
- `npm run dev`: Start Vite dev server
- `npm run build`: Production build
- `npm run preview`: Preview production build
- `npm test`: Run Vitest tests
- `npm run test:coverage`: Test with coverage
- `npm run lint`: Run ESLint
- `npm run format`: Format with Prettier

### Backend
- `npm start`: Start production server
- `npm run dev`: Start with nodemon
- `npm test`: Run Jest tests
- `npm run init-db`: Initialize database

### Full Stack
- `npm run watch`: Run both frontend and backend
- `npm run dev:all`: Alternative full stack command

## Deployment Configuration

### Frontend (Netlify)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Configuration**: `netlify.toml`
- **Node Version**: 18.x or 20.x

### Backend (Render)
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Configuration**: `render.yaml`
- **Environment**: Node.js
- **Disk Mount**: `/var/data` for SQLite persistence

## External Services & APIs

### Deployment Platforms
- **Netlify**: Frontend hosting
- **Render**: Backend hosting

### CI/CD
- **GitHub Actions**: Automated testing and deployment

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- CSS Grid and Flexbox support required

## Performance Optimizations

### Frontend
- Route-based code splitting
- Lazy loading of components
- 5-minute data caching in dataService
- Memoization with React.memo
- Debounced filter updates

### Backend
- Connection pooling (planned)
- Prepared SQL statements
- Response caching headers
- Request timeout middleware

## Security Considerations

- CORS configuration for production
- Environment variable management
- SQL injection prevention via parameterized queries
- XSS protection in React
- File upload validation

## Monitoring & Logging

- Console logging for development
- Error boundaries in React
- Backend request logging
- Health check endpoints