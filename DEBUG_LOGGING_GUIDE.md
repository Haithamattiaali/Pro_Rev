# Debug Logging Guide

## Overview

A comprehensive debug logging system has been added to help track production issues. The system provides detailed logging for:
- Asset loading (logo and other resources)
- Component lifecycle and transitions
- Filter state changes
- API calls and performance
- General application flow

## How to Enable Debug Logging

### Method 1: Browser Console (Recommended for Production)

1. Open the production site
2. Open browser DevTools (F12)
3. In the console, type:
   ```javascript
   __debugHelp()
   ```
   This will show all available debug commands

4. To enable debug logging:
   ```javascript
   __enableDebug("DEBUG")  // or "TRACE" for maximum detail
   ```

5. To disable:
   ```javascript
   __disableDebug()
   ```

### Method 2: URL Parameters

Add debug parameters to the URL:
```
https://your-site.netlify.app?debug=true&debug_level=TRACE
```

Available levels:
- `ERROR` - Only errors
- `WARN` - Warnings and errors
- `INFO` - General information (default in production)
- `DEBUG` - Detailed debugging info
- `TRACE` - Maximum verbosity

### Method 3: localStorage (Persistent)

Debug settings are saved in localStorage, so they persist across page reloads until explicitly disabled.

## What Gets Logged

### 1. Application Initialization
- Environment detection
- Base URL configuration
- API URL configuration
- Browser information

### 2. Logo Loading
```
[INFO] [ASSET] Asset loaded: /assets/logo-[hash].png
```
or
```
[ERROR] [PeriodFilter] Logo failed to load: {detailed error info}
```

### 3. Filter Changes
```
[DEBUG] [FilterContext] handlePeriodChange called
[STATE] [PeriodFilter] period changed: MTD → QTD
```

### 4. Transitions
```
[DEBUG] [TRANSITION] TransitionWrapper - expanding
[DEBUG] [TRANSITION] TransitionWrapper - collapsed
```

### 5. API Calls
```
[API] GET /api/overview/2025 - started
[API] GET /api/overview/2025 - success (duration: 145ms)
[PERFORMANCE] API GET /api/overview/2025 took 145ms
```

## Debug Categories

- `App` - Application lifecycle
- `ASSET` - Asset loading (images, etc.)
- `PeriodFilter` - Filter component behavior
- `FilterContext` - Global filter state
- `TRANSITION` - Animation and transition events
- `API` - API calls and responses
- `PERFORMANCE` - Performance metrics
- `STATE` - State changes

## Production Debugging Workflow

1. **User reports issue** → Ask them to:
   - Open DevTools console
   - Run `__enableDebug("TRACE")`
   - Reproduce the issue
   - Copy console output
   - Send screenshots

2. **Check specific issues**:
   - Logo not showing: Look for `[ASSET]` or `[PeriodFilter]` errors
   - Janky transitions: Check `[TRANSITION]` timing
   - Data issues: Review `[API]` calls
   - Filter problems: Track `[STATE]` and `[FilterContext]` changes

3. **Performance issues**:
   - Enable debug mode
   - Look for `[PERFORMANCE]` entries
   - Check API call durations
   - Monitor transition timings

## Example Debug Session

```javascript
// In production console:
__enableDebug("TRACE")

// User clicks on QTD filter
[STATE] [PeriodFilter] period changed: MTD → QTD
[DEBUG] [PeriodFilter] Updating period {period: "QTD", year: 2025, ...}
[TRANSITION] [PeriodFilter] animation-frame {period: "QTD"}
[DEBUG] [FilterContext] handlePeriodChange called
[INFO] [FilterContext] Clearing cache for new filter
[API] GET /api/overview/2025?period=QTD&quarter=3 - started
[TRANSITION] [TransitionWrapper] collapsing
[TRANSITION] [TransitionWrapper] expanding {height: 48}
[API] GET /api/overview/2025?period=QTD&quarter=3 - success (duration: 243ms)
```

## Security Note

Debug logging is disabled by default in production. When enabled, it only logs to the browser console and doesn't send data anywhere. Sensitive data is not logged.

## Common Issues and Solutions

### Logo Not Loading
Look for:
```
[ERROR] [PeriodFilter] Logo failed to load
```
Check the error details for the actual asset URL being requested.

### Transitions Flickering
Look for:
```
[TRANSITION] [TransitionWrapper] expanding
[TRANSITION] [TransitionWrapper] collapsing
```
Check if transitions are happening too quickly or in wrong order.

### API Errors
Look for:
```
[API] GET /api/... - error
```
Check error details and network state.

## Browser Compatibility

The debug logger works in all modern browsers:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (but app might not work in IE11 anyway)