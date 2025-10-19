# Fixes Applied

## Issue 1: Cannot expand collapsed columns + Greyed out styling
**Problem:** Event delegation wasn't working properly, and collapsed columns were hidden instead of greyed out.

**Solution:** 
- Changed from `data-column` attributes with event delegation to direct `onclick` handlers
- Exposed the app instance globally as `window.app` so headers can call `window.app.toggleColumn()`
- Headers now use: `onclick="window.app.toggleColumn('race-${round}')"`
- Made ALL race headers collapsible (not just future races)
- Fixed CSS: collapsed headers now show as greyed out (`opacity: 0.5`) instead of hidden
- Removed duplicate `th.collapsed` CSS rule that was causing visibility issues

## Issue 2: Two drivers can have the same result
**Problem:** No validation to prevent duplicate position selections.

**Solution:**
- Modified `generatePositionOptions()` to accept `usedPositions` array
- Before rendering each dropdown, collect all positions already selected by other drivers for that round
- Disable options that are already taken (except for the current driver's selection)
- Implementation in both `renderRaceCell()` and `renderSprintCell()`

## Issue 3: Past races should be immutable with static '-' for non-participants
**Problem:** Past races needed to be immutable, and drivers who didn't participate should show '-'.

**Solution:**
- Modified `renderRaceCell()` and `renderSprintCell()` to check if race has happened first
- For past races: if driver participated, show result; if not, show static '-'
- For future races: show dropdown with predictions
- Logic flow:
  1. Check if `raceResults[round]` exists (race happened)
  2. If yes, check if driver has result
  3. If driver participated: show position/DNF
  4. If driver didn't participate: show '-'
  5. If race hasn't happened: show dropdown

## Issue 4: Add null dropdown option
**Problem:** Users had to rank every driver even if they don't want to predict certain positions.

**Solution:**
- Added `<option value="0">-</option>` as the first option in all dropdowns
- Modified prediction handling to treat `0` as null/no prediction
- Updated points calculator to skip drivers with null predictions (no points awarded)
- Modified `getPredictedPosition()` to return `0` for null predictions

## Issue 5: Default to null for drivers past position 20 or not participating
**Problem:** Drivers ranked past 20 or not participating in races were getting default predictions.

**Solution:**
- Modified `getPredictedPosition()` to check:
  - If driver position > 20: return `0` (null)
  - If driver didn't participate in qualifying: return `0` (null)
  - If driver not found in standings: return `0` (null)
- This ensures drivers who weren't present or are ranked low default to the null option

## Issue 6: Toggle Past Races Button
**Problem:** Need a button to quickly collapse/expand all past races to declutter the screen.

**Solution:**
- Added "⊟ Toggle Past Races" button in the controls
- Created `toggleAllPast()` method in `TableRenderer`
- Logic: Check if any past race is visible
  - If yes: collapse all past races
  - If no: expand all past races
- Works for both main races and sprint races
- Button acts as a toggle - click once to collapse, click again to expand

## Technical Changes

### Files Modified:
1. **`public/js/components/tableRenderer.js`**
   - Updated `generatePositionOptions()` to handle null and disabled options
   - Modified `renderHeader()` to make ALL races collapsible with onclick handlers
   - Updated `renderRaceCell()` and `renderSprintCell()` to:
     - Check if race has happened first
     - Show static '-' for non-participants in past races
     - Pass used positions to prevent duplicates
   - Added `toggleAllPast()` method for bulk past race toggling
   - Fixed `renderBody()` signature to accept predictions parameters

2. **`public/js/app.js`**
   - Exposed app instance globally as `window.app`
   - Modified `updatePrediction()` and `updateSprintPrediction()` to convert '0' to null
   - Added `userPredictions` and `sprintPredictions` to render data
   - Added `toggleAllPast()` method and button event listener

3. **`public/js/utils/predictionManager.js`**
   - Updated `getPredictedPosition()` to handle null values
   - Added check for driver participation in qualifying
   - Default to null for drivers past position 20

4. **`public/js/utils/pointsCalculator.js`**
   - Added validation to skip null predictions (position 0) when calculating points
   - Only adds points if `predictedPos > 0`

5. **`public/css/styles.css`**
   - Fixed collapsed header styling to show greyed out instead of hidden
   - Removed duplicate `th.collapsed` rule
   - Headers now use `opacity: 0.5` when collapsed

6. **`public/index.html`**
   - Added "⊟ Toggle Past Races" button

## Testing Checklist
- [x] Collapsed columns can be expanded by clicking header again
- [x] Collapsed headers show greyed out (not hidden)
- [x] All race headers are clickable/collapsible (past and future)
- [x] Cannot select same position for two different drivers in same race
- [x] Past races show static results (no dropdowns)
- [x] Drivers who didn't participate in past races show static '-'
- [x] "Toggle Past Races" button collapses/expands all past races
- [x] Null option ("-") available in all dropdowns
- [x] Drivers past position 20 default to null
- [x] Drivers not in qualifying default to null
- [x] Points calculation ignores null predictions
