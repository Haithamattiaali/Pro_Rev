# Proposed Fix for Month Selection Transition Jump

## Issue Summary
When clicking any month (e.g., January), the "Currently Showing" area jumps from top to bottom in a jarring way.

## Root Cause
The issue is caused by:
1. **Height Recalculation**: The TransitionWrapper recalculates height when selections change
2. **Portal Positioning**: The dropdown is rendered in a portal with fixed positioning
3. **Async State Updates**: Multiple state updates trigger re-renders and position recalculations

## Solution Approach

### 1. Stabilize ActiveFiltersDisplay Height
Prevent height changes in the display area by setting a fixed min-height.

### 2. Optimize Portal Positioning
Use transform instead of top/left for smoother positioning.

### 3. Batch State Updates
Ensure selection changes are batched to prevent multiple renders.

### 4. Add Position Stability
Use CSS containment to prevent layout recalculation cascades.

## Implementation Steps

1. **Update ActiveFiltersDisplay** - Add min-height to prevent jumping
2. **Modify FilterBar portal** - Use transform for positioning
3. **Add layout containment** - Prevent cascading reflows
4. **Optimize state updates** - Batch selection changes