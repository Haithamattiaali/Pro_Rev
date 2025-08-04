# Feedback Analysis: Production vs Development Server Differences

**Feedback**: "things like logo transitions are working in dev server but on production not"

## Issue Analysis

### Symptoms
- Logo transitions work in development (npm run dev)
- Logo transitions NOT working in production (Netlify)
- Other features may also be affected

### Common Causes for Dev vs Prod Differences

1. **CSS Purging** (Most Likely)
   - Tailwind CSS may be purging transition classes in production
   - Classes used dynamically might be removed

2. **Build Optimization**
   - Vite optimizes differently for production
   - Some dynamic imports might be handled differently

3. **Environment Differences**
   - Different Node versions
   - Different build configurations

4. **CSS Loading Order**
   - Production bundles CSS differently
   - Specificity conflicts may occur

## Investigation Areas

### 1. Tailwind Configuration
Check if transition classes are being purged:
- `transition-opacity`
- `hover:opacity-100`
- Dynamic classes

### 2. Logo Component Code
File: src/components/filters/PeriodFilter.jsx
```jsx
className="h-6 w-auto object-contain sm:h-8 md:h-10 opacity-90 hover:opacity-100 transition-opacity"
```

### 3. Build Output
Production build may strip certain classes or inline styles differently.

## Immediate Actions

1. Check if transition classes are in production CSS bundle
2. Verify Tailwind safelist configuration
3. Test with explicit transition duration
4. Check browser DevTools for applied styles