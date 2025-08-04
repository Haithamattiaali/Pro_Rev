# Enhancement Requirements: YTD/QTD/MTD Data-Aware Period Filters

## Enhancement Overview
- **Current State**: YTD/QTD/MTD use system current date for calculations
- **Desired State**: Use last compliant month from uploaded Excel data
- **Benefits**: Accurate period calculations based on actual data availability
- **Users Affected**: All dashboard users

## Enhancement Specifications

### Functional Enhancements

1. **Data-Based Current Month**
   - "Current" = Last compliant month in uploaded data
   - Not based on system date/time
   - Everything driven by Excel upload

2. **YTD (Year-to-Date)**
   - Show from January to last compliant month only
   - Example: If last data is July → Show Jan-Jul
   - Disable for past years

3. **QTD (Quarter-to-Date)**  
   - Show quarter up to last compliant month
   - If quarter incomplete, show partial (e.g., "July only")
   - Calculate quarter based on data month, not system

4. **MTD (Month-to-Date)**
   - Show full last compliant month
   - Based on days column in calculations
   - Not partial month or system current

5. **Visual Feedback**
   - Display "Data through [Month] [Year]" prominently
   - Add calendar icon with last data date
   - Tooltips on YTD/QTD/MTD buttons
   - Clear indication of data availability

### Non-Functional Enhancements

- **Animation Removal**: Remove animations from "Currently Showing" component
- **Performance**: Cache last compliant month using best practices
- **Validation**: Only show compliant periods
- **Warnings**: Display only on upload page

### SHOULD

- Detect last compliant month from validation data
- Update all quick preset calculations to use data dates
- Show warnings for data gaps
- Prevent data gaps during upload
- Disable YTD/QTD/MTD for past years
- Remove bouncy/vibration animations
- Keep subtle transitions and number morphing
- Add comprehensive visual feedback
- Cache calculations for performance
- Handle edge cases gracefully

### SHOULD NOT

- Use system current date/time for any calculations
- Show non-compliant periods
- Display validation warnings everywhere
- Remove all animations (keep subtle ones)
- Show future months with no data
- Allow selection of non-compliant months
- Break existing functionality
- Change the core filtering logic

## Success Criteria

1. **Accuracy**: YTD/QTD/MTD correctly use last compliant data month
2. **Clarity**: Users clearly see what data is available
3. **Professional UI**: No jarring animations, smooth experience
4. **Reliability**: Handles all edge cases (no data, gaps, past years)
5. **Performance**: Fast response with proper caching
6. **Compliance**: Only compliant periods are accessible

## Technical Constraints

- Must integrate with existing compliance validation system
- Cannot modify backend data structure
- Must maintain backward compatibility
- Should use existing validation APIs
- Must work with current FilterContext architecture

## Business Rules

1. **Last Compliant Month**: The most recent month that passes compliance validation
2. **Data Gaps**: Warn users but use available data (skip gaps)
3. **Past Years**: Disable quick presets, require manual selection
4. **No Data**: Disable all YTD/QTD/MTD buttons
5. **Future Months**: Never show or allow selection

## Edge Cases

1. **No compliant data**: Disable quick presets with message
2. **Single month data**: YTD = QTD = MTD
3. **Partial quarter**: Show month name with "only" suffix
4. **Year transition**: Each year calculated independently
5. **Data refresh**: Clear cache on new upload