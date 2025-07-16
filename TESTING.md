# Testing Guide for Proceed Revenue Dashboard

## Overview

This document outlines the comprehensive testing strategy for the Proceed Revenue Dashboard, covering frontend, backend, integration, and end-to-end testing.

## Testing Architecture

### Frontend Testing Stack
- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: vitest mocks
- **Coverage**: v8 provider

### Backend Testing Stack
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: SQLite (in-memory for tests)
- **Mocking**: Jest mocks

## Running Tests

### Frontend Tests

```bash
# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

### Backend Tests

```bash
cd backend

# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality Checks

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Check code formatting
npm run format:check

# Fix formatting issues
npm run format

# Run all quality checks
npm run quality
```

## Test Structure

### Frontend Test Organization

```
src/
├── services/
│   ├── connectionManager.test.js
│   ├── dataService.test.js
│   └── api.service.test.js
├── components/
│   ├── cards/
│   │   └── MetricCard.test.jsx
│   ├── charts/
│   │   └── GaugeChart.test.jsx
│   └── filters/
│       └── PeriodFilter.test.jsx
└── test/
    ├── setup.js
    └── utils.js
```

### Backend Test Organization

```
backend/
├── services/
│   └── etl.service.test.js
├── server.test.js
└── test/
    ├── setup.js
    └── utils.js
```

## Testing Best Practices

### 1. Unit Tests

**Frontend Components**
- Test component rendering with different props
- Test user interactions (clicks, input changes)
- Test conditional rendering
- Mock external dependencies

Example:
```javascript
describe('MetricCard', () => {
  it('formats currency values correctly', () => {
    render(<MetricCard value={5000000} type="currency" />)
    expect(screen.getByText('SAR 5,000,000')).toBeInTheDocument()
  })
})
```

**Backend Services**
- Test service methods independently
- Mock database connections
- Test error handling
- Validate data transformations

Example:
```javascript
describe('ETLService', () => {
  it('should validate correct data structure', () => {
    const result = etlService.validateData(validData)
    expect(result.isValid).toBe(true)
  })
})
```

### 2. Integration Tests

**API Endpoints**
- Test complete request/response cycle
- Validate status codes
- Check response structure
- Test error scenarios

Example:
```javascript
describe('GET /api/overview', () => {
  it('should return overview data', async () => {
    const response = await request(app)
      .get('/api/overview?year=2025')
      .expect(200)
    
    expect(response.body).toHaveProperty('revenue')
  })
})
```

### 3. Component Integration Tests

**Testing with Context**
- Use custom render utilities
- Test components with providers
- Verify context updates

Example:
```javascript
it('updates filter when button clicked', async () => {
  renderWithProviders(<PeriodFilter />)
  
  await userEvent.click(screen.getByText('MTD'))
  expect(mockSetPeriodFilter).toHaveBeenCalledWith('MTD')
})
```

## Mocking Strategies

### Frontend Mocks

1. **API Calls**
```javascript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' })
})
```

2. **Context Providers**
```javascript
vi.mock('../../contexts/FilterContext', () => ({
  useFilter: vi.fn(() => ({
    periodFilter: 'YTD',
    setPeriodFilter: vi.fn()
  }))
}))
```

### Backend Mocks

1. **Database**
```javascript
jest.mock('./database/persistent-db', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}))
```

2. **External Services**
```javascript
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}))
```

## Coverage Goals

### Target Coverage
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Critical Areas (90%+ coverage)
- ConnectionManager (retry logic)
- DataService (caching)
- ETL Service (data validation)
- API endpoints
- Authentication flows

## CI/CD Integration

### GitHub Actions Workflow

1. **On Pull Request**
   - Run linting
   - Run tests with coverage
   - Deploy preview to Netlify
   - Post results to PR

2. **On Main Branch**
   - Run full test suite
   - Build production assets
   - Deploy to production
   - Run smoke tests

### Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## Debugging Tests

### Frontend Debugging

```javascript
// Use screen.debug() to see DOM
screen.debug()

// Use prettyDOM for specific elements
import { prettyDOM } from '@testing-library/react'
console.log(prettyDOM(element))
```

### Backend Debugging

```javascript
// Enable console logs in specific tests
beforeEach(() => {
  global.console = {
    ...console,
    log: console.log, // Re-enable for debugging
  }
})
```

## Performance Testing

### Frontend Performance
- Measure render times
- Test with large datasets
- Monitor memory usage

### Backend Performance
- Test database query performance
- Measure API response times
- Load test critical endpoints

## Security Testing

### Input Validation
- Test SQL injection prevention
- Validate file upload restrictions
- Test XSS prevention

### Authentication Testing
- Test unauthorized access
- Validate token expiration
- Test role-based access

## Maintenance

### Regular Tasks
1. Update test dependencies monthly
2. Review and update test coverage
3. Refactor brittle tests
4. Add tests for new features

### Test Data Management
- Keep test data minimal
- Use factories for complex objects
- Clear test database after each test
- Avoid hardcoded values

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase test timeout
   - Check for missing await statements
   - Verify mock implementations

2. **Flaky Tests**
   - Add proper wait conditions
   - Mock time-dependent functions
   - Ensure proper cleanup

3. **Coverage Gaps**
   - Check for untested error paths
   - Add edge case tests
   - Test conditional branches

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update test documentation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)