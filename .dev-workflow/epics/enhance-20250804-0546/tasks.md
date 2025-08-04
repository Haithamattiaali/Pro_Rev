# Enhancement Tasks: YTD/QTD/MTD Data-Aware Period Filters

## Phase 1: Core Service Implementation (Critical)

1. **Create LastCompliantMonthService**
   - Create `src/services/lastCompliantMonthService.js`
   - Implement `getLastCompliantMonth(year)` function
   - Add caching mechanism with 5-minute TTL
   - Create cache clearing function for uploads
   - Add comprehensive error handling

2. **Create DataAvailabilityIndicator Component**
   - Create `src/components/common/DataAvailabilityIndicator.jsx`
   - Design with calendar icon and text
   - Add tooltip functionality
   - Style to be prominently visible
   - Make responsive for mobile

3. **Update Data Service Integration**
   - Import lastCompliantMonthService in dataService
   - Add method to clear cache on data refresh
   - Ensure integration with existing validation API
   - Add logging for debugging

## Phase 2: Context and State Updates (High Priority)

4. **Update HierarchicalFilterContext - Part 1**
   - Add `lastCompliantMonth` state
   - Add `dataAvailability` state object
   - Create effect to fetch last compliant month
   - Remove dependency on system date

5. **Update HierarchicalFilterContext - Part 2**
   - Rewrite YTD calculation to use data month
   - Rewrite QTD calculation to use data month
   - Rewrite MTD calculation to use data month
   - Handle edge cases (no data, partial quarter)

6. **Update Quick Preset Logic**
   - Modify quick preset switch cases
   - Add disabled state handling
   - Update display labels for partial periods
   - Test all combinations

## Phase 3: UI Component Updates (High Priority)

7. **Update QuickRangePresets Component**
   - Add `disabled` prop support
   - Add `disabledMessage` prop
   - Style disabled state appropriately
   - Add tooltip for disabled buttons

8. **Remove Animations from Currently Showing**
   - Identify the exact component causing vibration
   - Remove motion/animation classes
   - Keep only subtle opacity transitions
   - Test across all dashboard pages

9. **Integrate DataAvailabilityIndicator**
   - Add to HierarchicalFilter layout
   - Position prominently (near filter bar)
   - Connect to dataAvailability state
   - Ensure visibility on all pages

## Phase 4: Edge Case Handling (Medium Priority)

10. **Handle Past Year Scenarios**
    - Detect when selected year is not current
    - Disable YTD/QTD/MTD for past years
    - Show appropriate messaging
    - Allow manual month/quarter selection

11. **Handle No Data Scenarios**
    - Detect when no compliant months exist
    - Disable all quick presets
    - Show clear empty state message
    - Guide user to upload page

12. **Handle Data Gaps**
    - Implement gap detection logic
    - Show warnings on upload page only
    - Allow skipping gaps as specified
    - Log gap occurrences

## Phase 5: Integration and Polish (Medium Priority)

13. **Update Upload Page Warnings**
    - Add validation messages for data gaps
    - Show last compliant month info
    - Warn about missing months
    - Provide clear action items

14. **Add Tooltips to YTD/QTD/MTD**
    - Create informative tooltip content
    - Show what period is covered
    - Indicate if disabled and why
    - Use consistent styling

15. **Performance Optimization**
    - Implement proper memoization
    - Optimize re-render triggers
    - Profile and fix any bottlenecks
    - Ensure smooth user experience

## Phase 6: Testing and Validation (Critical)

16. **Create Unit Tests**
    - Test lastCompliantMonthService
    - Test date calculation logic
    - Test edge cases
    - Test cache behavior

17. **Integration Testing**
    - Test with various data scenarios
    - Test year transitions
    - Test with gaps in data
    - Test performance with cache

18. **User Acceptance Testing**
    - Verify YTD shows correct months
    - Verify QTD handles partial quarters
    - Verify MTD shows full month
    - Verify all visual feedback works

## Phase 7: Documentation and Deployment (Low Priority)

19. **Update Documentation**
    - Document new behavior
    - Add examples of edge cases
    - Update API documentation
    - Create user guide

20. **Deployment Preparation**
    - Create rollback plan
    - Prepare monitoring alerts
    - Schedule deployment
    - Communicate changes to users

## Task Dependencies

```
Core Service → Context Updates → UI Updates
     ↓              ↓               ↓
Edge Cases → Integration → Testing → Documentation
```

## Validation Checklist

- [ ] YTD uses last compliant month, not system date
- [ ] QTD shows partial quarter when incomplete
- [ ] MTD shows full last compliant month
- [ ] Past years have disabled quick presets
- [ ] No data scenario handled gracefully
- [ ] Data gaps show warnings on upload only
- [ ] Visual feedback shows data availability
- [ ] Animations removed from Currently Showing
- [ ] Performance is maintained with caching
- [ ] All edge cases tested and working

## Time Estimates

- Phase 1: 4 hours
- Phase 2: 6 hours
- Phase 3: 4 hours
- Phase 4: 3 hours
- Phase 5: 3 hours
- Phase 6: 4 hours
- Phase 7: 2 hours

**Total: ~26 hours**

## Priority Order

1. Phase 1 & 2 (Core logic) - Must have
2. Phase 3 (UI updates) - Must have
3. Phase 6 (Testing) - Must have
4. Phase 4 (Edge cases) - Should have
5. Phase 5 (Polish) - Nice to have
6. Phase 7 (Documentation) - Nice to have