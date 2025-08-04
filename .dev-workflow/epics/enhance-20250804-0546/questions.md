# Enhancement Clarification Questions

For enhancement: "YTD/QTD/MTD Period Filters - Data-Aware Current Period"

Based on analysis, the system currently uses the system date for "current" period calculations, but should use the last available data month from uploaded Excel files.

## Data Availability Questions

1. **Last Available Month Detection**
   - How should the system determine the "last available month"?
     last compliant month as per current compliance logic

2. **Handling Data Gaps**
   - If July has data but June doesn't, what should happen?
     a) Use July as current (skip gaps)
     b) Use May as current (last continuous month)
     c) Show warning about data gap yes
     d) Prevent this scenario during upload yes

3. **Multi-Year Scenarios**
   - If viewing 2024 data in 2025, how should YTD/QTD/MTD work?
     a) Use last available month of 2024
     b) Use December 2024 as "current"
     c) Show full year (no partial periods)
     d) Disable quick presets for past year yes

## Business Logic Questions

4. **YTD Behavior**
   - For Year-to-Date with last data in July:
     a) Show Jan-Jul data only yes
     b) Show Jan-Jul with note about missing Aug-Dec no
     c) Project/forecast remaining months no
     d) Show Jan-Dec with zeros for future months no

5. **QTD Edge Cases**
   - If last data is July (Q3), but Q3 isn't complete:
     a) Show Q3 partial (Jul only or Apr-Jul) Jul only 
     b) Show Q2 complete (Apr-Jun)
     c) Show both with clear labels
     d) User choice via setting

6. **MTD Definition**
   - Month-to-Date should show:
     a) Partial current month (up to last upload date) yes but the uploaddatedosent play as we dependon dayscolumn in calculations
     b) Full last available month
     c) Both options available
     d) Depends on data completeness

## Validation & Compliance

7. **Compliance Integration**
   - How should compliance affect period calculations?
     a) Only show compliant periods yes
     b) Show all periods but mark non-compliant
     c) Compliance doesn't affect quick presets
     d) User configurable

8. **Validation Warnings**
   - When should users see validation messages?
     a) Always visible when data is incompleteno
     b) Only on upload page yes
     c) As tooltips on YTD/QTD/MTD buttons no
     d) In a dedicated data status panel no

## UI/UX Questions

9. **Animation Removal**
   - Which animations should be removed?
     a) All animations everywhere no
     b) Only the component under "Currently Showing" yes
     c) Keep subtle transitions, remove bouncy effects yes
     d) Remove all except number morphing yes

10. **Visual Feedback**
    - How should users know which month is "current"?
      a) Display "Data through July 2024" prominently
      b) Add calendar icon with last data date
      c) Tooltip on hover over YTD/QTD/MTD
      d) All of the above all

## Technical Implementation

11. **Data Source for "Current Month"**
    - Where should this information come from?
      a) API endpoint that queries database
      b) Calculated from validation data
      c) Stored in user settings
      d) Combination of above its in database based on excel upload

12. **Performance Considerations**
    - Should we cache the last available month?
       use bestpractice

## Edge Cases

13. **No Data Scenario**
    - If no data is uploaded for current year:
      a) Disable YTD/QTD/MTD buttons yes
      b) Show previous year's data
      c) Show empty state message
      d) Default to full year view

14. **Future Month Selection**
    - If user manually selects future month:
        if month have no data or non compliant will not shown we are not based on current date and time all our operations are file upload based and all defentions are based on that 

Please provide your preferences to ensure the enhancement meets business requirements while maintaining data accuracy.
