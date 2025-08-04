# Console Bug Fix Design

## Error Context
TypeError: undefined is not an object (evaluating 'e.toFixed')
- Location: src/utils/formatters.js:11
- Function: formatPercentage
- Issue: Calling toFixed() on undefined/null value

## Web-Sourced Solution Analysis
### Recommended Approach
Based on web research, implementing defensive programming with null checks:
- **Solution Source**: Stack Overflow consensus and MDN best practices
- **Why This Works**: toFixed() is a Number prototype method that requires a valid number
- **Code Pattern**: Validate and provide default before method call
  ```javascript
  // Common pattern from web
  const safeValue = value == null ? 0 : Number(value);
  return `${safeValue.toFixed(1)}%`;
  ```

### Our Implementation Strategy
Adapting the web solution to our codebase:
- **File**: src/utils/formatters.js
  - Line 10-12: Add validation and type coercion
  - Reason: Prevents TypeError while maintaining expected output format

### Alternative Solutions Considered
1. Optional chaining: `value?.toFixed(1)` - Doesn't handle null/undefined completely
2. Try-catch wrapper: Too heavy for a simple formatter
3. TypeScript strict types: Good long-term but requires broader changes

## Fix Implementation
### Code Changes
- **Primary Fix**: Add null/undefined check with numeric validation
  ```javascript
  export const formatPercentage = (value) => {
    // Handle null, undefined, or non-numeric values
    const numValue = value == null ? 0 : Number(value);
    // Handle NaN and Infinity cases
    if (!isFinite(numValue)) {
      return '0.0%';
    }
    return `${numValue.toFixed(1)}%`;
  }
  ```

### Error Prevention (from research)
- Similar protection needed for other formatters
- Consider adding to formatCurrency and formatNumber
- Community recommends consistent null handling across all formatters

### Additional Improvements from Web
- Add JSDoc comments for expected input types
- Consider logging warnings for invalid inputs in development
- Add unit tests for edge cases

## Testing Approach
- Test with null, undefined, 0, negative numbers
- Test with non-numeric strings
- Test with NaN and Infinity
- Verify backward compatibility with valid numbers
- Check that percentage symbol is always included

## Similar Issues to Fix
The same pattern should be applied to:
1. `dataService.js:156` - hitRate calculation with toFixed
2. `dataService.js:255` - formatPercentage method (duplicate implementation)
3. Other toFixed calls throughout the codebase

## Risk Assessment
- **Low Risk**: Simple validation addition
- **No Breaking Changes**: Invalid inputs now return "0.0%" instead of crashing
- **Performance Impact**: Negligible (simple checks)