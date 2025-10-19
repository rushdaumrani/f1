/**
 * Table Renderer
 * Handles rendering of the F1 standings table
 */

import { PointsCalculator } from '../utils/pointsCalculator.js';

export class TableRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.collapsedColumns = new Set();
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = '<div class="loading">Loading F1 data...</div>';
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.container.innerHTML = `<div class="error">Error: ${message}</div>`;
    }

    /**
     * Toggle column visibility
     * @param {string} columnId - Column identifier
     */
    toggleColumn(columnId) {
        if (this.collapsedColumns.has(columnId)) {
            this.collapsedColumns.delete(columnId);
        } else {
            this.collapsedColumns.add(columnId);
        }
    }

    /**
     * Toggle all future race columns
     * @param {Array} races - Array of race objects
     * @param {Object} raceResults - Race results by round
     * @param {Object} sprintResults - Sprint results by round
     * @returns {boolean} - True if now collapsed, false if expanded
     */
    toggleAllFuture(races, raceResults, sprintResults) {
        // Check if any future race is currently visible
        let anyFutureVisible = false;
        for (const race of races) {
            const round = race.round;
            if (!raceResults[round] && !this.collapsedColumns.has(`race-${round}`)) {
                anyFutureVisible = true;
                break;
            }
        }

        // Toggle future races
        for (const race of races) {
            const round = race.round;
            const hasSprint = race.Sprint !== undefined;

            if (!raceResults[round]) {
                if (anyFutureVisible) {
                    this.collapsedColumns.add(`race-${round}`);
                } else {
                    this.collapsedColumns.delete(`race-${round}`);
                }
            }
            if (hasSprint && !sprintResults[round]) {
                if (anyFutureVisible) {
                    this.collapsedColumns.add(`sprint-${round}`);
                } else {
                    this.collapsedColumns.delete(`sprint-${round}`);
                }
            }
        }
        
        // Also toggle predicted points and standings columns
        if (anyFutureVisible) {
            this.collapsedColumns.add('predicted-points');
            this.collapsedColumns.add('predicted-standing');
        } else {
            this.collapsedColumns.delete('predicted-points');
            this.collapsedColumns.delete('predicted-standing');
        }
        
        return anyFutureVisible; // Returns true if we just collapsed them
    }

    /**
     * Toggle all past race columns
     * @param {Array} races - Array of race objects
     * @param {Object} raceResults - Race results by round
     * @param {Object} sprintResults - Sprint results by round
     * @returns {boolean} - True if now collapsed, false if expanded
     */
    toggleAllPast(races, raceResults, sprintResults) {
        // Check if any past race is currently visible
        let anyPastVisible = false;
        for (const race of races) {
            const round = race.round;
            if (raceResults[round] && !this.collapsedColumns.has(`race-${round}`)) {
                anyPastVisible = true;
                break;
            }
        }

        // Toggle past races
        for (const race of races) {
            const round = race.round;
            const hasSprint = race.Sprint !== undefined;

            if (raceResults[round]) {
                if (anyPastVisible) {
                    this.collapsedColumns.add(`race-${round}`);
                } else {
                    this.collapsedColumns.delete(`race-${round}`);
                }
            }
            if (hasSprint && sprintResults[round]) {
                if (anyPastVisible) {
                    this.collapsedColumns.add(`sprint-${round}`);
                } else {
                    this.collapsedColumns.delete(`sprint-${round}`);
                }
            }
        }
        
        return anyPastVisible; // Returns true if we just collapsed them
    }

    /**
     * Expand all columns
     */
    expandAll() {
        this.collapsedColumns.clear();
    }

    /**
     * Generate position dropdown options
     * @param {number|null} selectedPos - Currently selected position
     * @param {Array} usedPositions - Array of positions already used by other drivers (ignored for swapping)
     * @returns {string} - HTML options string
     */
    generatePositionOptions(selectedPos, usedPositions = []) {
        let options = '';
        
        // Add null option
        const nullSelected = (selectedPos === null || selectedPos === 0) ? 'selected' : '';
        options += `<option value="0" ${nullSelected}>-</option>`;
        
        // All positions are selectable - swapping is handled in app.js
        for (let i = 1; i <= 20; i++) {
            const selected = i === selectedPos ? 'selected' : '';
            options += `<option value="${i}" ${selected}>${i}</option>`;
        }
        return options;
    }

    /**
     * Render the standings table
     * @param {Object} data - All data needed for rendering
     */
    render(data) {
        const {
            driversData,
            races,
            raceResults,
            sprintResults,
            getPredictedPosition,
            calculatePoints,
            userPredictions,
            sprintPredictions
        } = data;

        // Calculate points for all drivers
        const driversWithPoints = driversData.map(driver => ({
            ...driver,
            calculatedPoints: calculatePoints(driver.driverId)
        }));

        // Sort by calculated points
        driversWithPoints.sort((a, b) => b.calculatedPoints - a.calculatedPoints);

        let html = '<div class="table-wrapper"><table>';

        // Render header
        html += this.renderHeader(races, raceResults, sprintResults);

        // Render body
        html += this.renderBody(driversWithPoints, races, raceResults, sprintResults, getPredictedPosition, userPredictions, sprintPredictions);

        html += '</table></div>';

        this.container.innerHTML = html;
    }

    /**
     * Get ordered columns (visible first, collapsed at end)
     * @param {Array} races - Array of race objects
     * @param {Object} raceResults - Race results by round
     * @param {Object} sprintResults - Sprint results by round
     * @returns {Array} - Ordered array of column objects
     */
    getOrderedColumns(races, raceResults, sprintResults) {
        const columns = [];
        
        // Build column list
        for (const race of races) {
            const round = race.round;
            const hasSprint = race.Sprint !== undefined;
            
            if (hasSprint) {
                columns.push({
                    type: 'sprint',
                    round,
                    race,
                    isCollapsed: this.collapsedColumns.has(`sprint-${round}`),
                    isFuture: !sprintResults[round]
                });
            }
            
            columns.push({
                type: 'race',
                round,
                race,
                isCollapsed: this.collapsedColumns.has(`race-${round}`),
                isFuture: !raceResults[round]
            });
        }
        
        // Sort: visible columns first, collapsed at end
        return columns.sort((a, b) => {
            if (a.isCollapsed === b.isCollapsed) return 0;
            return a.isCollapsed ? 1 : -1;
        });
    }

    /**
     * Render table header
     * @param {Array} races - Array of race objects
     * @param {Object} raceResults - Race results by round
     * @param {Object} sprintResults - Sprint results by round
     * @returns {string} - HTML string
     */
    renderHeader(races, raceResults, sprintResults) {
        let html = '<thead><tr>';
        html += '<th class="position-cell">Pos</th>';
        html += '<th class="driver-name">Driver</th>';

        // Get ordered columns - separate visible and collapsed
        const orderedColumns = this.getOrderedColumns(races, raceResults, sprintResults);
        const visibleColumns = orderedColumns.filter(col => !col.isCollapsed);
        const collapsedColumns = orderedColumns.filter(col => col.isCollapsed);
        
        // Render visible race columns first
        for (const col of visibleColumns) {
            const columnId = col.type === 'sprint' ? `sprint-${col.round}` : `race-${col.round}`;
            
            if (col.type === 'sprint') {
                html += `<th class="race-header sprint-header collapsible" 
                         onclick="window.app.toggleColumn('${columnId}')"
                         title="${col.race.raceName} Sprint">
                    ${col.race.raceName.replace(' Grand Prix', '')} Sprint (R${col.round})
                </th>`;
            } else {
                html += `<th class="race-header collapsible" 
                         onclick="window.app.toggleColumn('${columnId}')"
                         title="${col.race.raceName}">
                    ${col.race.raceName.replace(' Grand Prix', '')} (R${col.round})
                </th>`;
            }
        }

        // Gap columns and points
        const gapLeaderCollapsed = this.collapsedColumns.has('gap-leader') ? 'collapsed' : '';
        const gapAheadCollapsed = this.collapsedColumns.has('gap-ahead') ? 'collapsed' : '';
        const predictedPointsCollapsed = this.collapsedColumns.has('predicted-points') ? 'collapsed' : '';

        html += `<th class="collapsible ${gapLeaderCollapsed}" onclick="window.app.toggleColumn('gap-leader')">Gap to Leader</th>`;
        html += `<th class="collapsible ${gapAheadCollapsed}" onclick="window.app.toggleColumn('gap-ahead')">Gap to Ahead</th>`;
        
        // Show predicted points column if not collapsed
        if (!this.collapsedColumns.has('predicted-points')) {
            html += `<th class="points-cell collapsible" onclick="window.app.toggleColumn('predicted-points')">Predicted Points</th>`;
        }
        
        html += '<th class="points-cell">Current Points</th>';
        
        // Render collapsed columns at the very end
        
        // Add collapsed predicted points column if needed
        if (this.collapsedColumns.has('predicted-points')) {
            html += `<th class="points-cell collapsible collapsed" onclick="window.app.toggleColumn('predicted-points')">Predicted Points ⊟</th>`;
        }
        
        // Then collapsed race columns
        for (const col of collapsedColumns) {
            const columnId = col.type === 'sprint' ? `sprint-${col.round}` : `race-${col.round}`;
            
            if (col.type === 'sprint') {
                html += `<th class="race-header sprint-header collapsible collapsed" 
                         onclick="window.app.toggleColumn('${columnId}')"
                         title="${col.race.raceName} Sprint">
                    ${col.race.raceName.replace(' Grand Prix', '')} Sprint (R${col.round}) ⊟
                </th>`;
            } else {
                html += `<th class="race-header collapsible collapsed" 
                         onclick="window.app.toggleColumn('${columnId}')"
                         title="${col.race.raceName}">
                    ${col.race.raceName.replace(' Grand Prix', '')} (R${col.round}) ⊟
                </th>`;
            }
        }
        
        html += '</tr></thead>';

        return html;
    }

    /**
     * Render table body
     * @param {Array} driversWithPoints - Sorted drivers with calculated points
     * @param {Array} races - Array of race objects
     * @param {Object} raceResults - Race results by round
     * @param {Object} sprintResults - Sprint results by round
     * @param {Function} getPredictedPosition - Function to get predicted position
     * @param {Object} userPredictions - User predictions by round
     * @param {Object} sprintPredictions - Sprint predictions by round
     * @returns {string} - HTML string
     */
    renderBody(driversWithPoints, races, raceResults, sprintResults, getPredictedPosition, userPredictions, sprintPredictions) {
        let html = '<tbody>';
        
        // Get ordered columns - separate visible and collapsed
        const orderedColumns = this.getOrderedColumns(races, raceResults, sprintResults);
        const visibleColumns = orderedColumns.filter(col => !col.isCollapsed);
        const collapsedColumns = orderedColumns.filter(col => col.isCollapsed);

        for (let i = 0; i < driversWithPoints.length; i++) {
            const driver = driversWithPoints[i];
            const currentPos = i + 1;

            html += '<tr>';
            html += `<td class="position-cell">${currentPos}</td>`;
            html += `<td class="driver-name">${driver.code} - ${driver.givenName} ${driver.familyName}</td>`;

            // Render visible columns first
            for (const col of visibleColumns) {
                if (col.type === 'sprint') {
                    html += this.renderSprintCell(driver, col.round, sprintResults, getPredictedPosition, driversWithPoints, sprintPredictions);
                } else {
                    html += this.renderRaceCell(driver, col.round, raceResults, getPredictedPosition, driversWithPoints, userPredictions);
                }
            }

            // Gap to leader
            const gapToLeader = driversWithPoints[0].calculatedPoints - driver.calculatedPoints;
            const gapLeaderCollapsed = this.collapsedColumns.has('gap-leader') ? 'collapsed' : '';
            html += `<td class="gap-cell ${gapLeaderCollapsed}">${gapToLeader > 0 ? '-' + gapToLeader : '-'}</td>`;

            // Gap to ahead
            const gapToAhead = i > 0 ? driversWithPoints[i - 1].calculatedPoints - driver.calculatedPoints : 0;
            const gapAheadCollapsed = this.collapsedColumns.has('gap-ahead') ? 'collapsed' : '';
            html += `<td class="gap-cell ${gapAheadCollapsed}">${gapToAhead > 0 ? '-' + gapToAhead : '-'}</td>`;

            // Show predicted points if not collapsed
            if (!this.collapsedColumns.has('predicted-points')) {
                html += `<td class="points-cell">${driver.calculatedPoints}</td>`;
            }
            
            // Current points (actual points from API)
            html += `<td class="points-cell">${driver.currentPoints}</td>`;
            
            // Render collapsed columns at the very end
            
            // Add collapsed predicted points if needed
            if (this.collapsedColumns.has('predicted-points')) {
                html += `<td class="points-cell collapsed">${driver.calculatedPoints}</td>`;
            }
            
            // Then collapsed race columns
            for (const col of collapsedColumns) {
                if (col.type === 'sprint') {
                    html += this.renderSprintCell(driver, col.round, sprintResults, getPredictedPosition, driversWithPoints, sprintPredictions, true);
                } else {
                    html += this.renderRaceCell(driver, col.round, raceResults, getPredictedPosition, driversWithPoints, userPredictions, true);
                }
            }

            html += '</tr>';
        }

        html += '</tbody>';
        return html;
    }

    /**
     * Render sprint cell
     * @param {Object} driver - Driver object
     * @param {number} round - Race round
     * @param {Object} sprintResults - Sprint results by round
     * @param {Function} getPredictedPosition - Function to get predicted position
     * @param {Array} allDrivers - All drivers with points
     * @param {Object} sprintPredictions - Sprint predictions by round
     * @param {boolean} forceCollapsed - Force collapsed styling
     * @returns {string} - HTML string
     */
    renderSprintCell(driver, round, sprintResults, getPredictedPosition, allDrivers, sprintPredictions, forceCollapsed = false) {
        const collapsedClass = forceCollapsed ? 'collapsed' : '';

        const sprintResult = PointsCalculator.getDriverSprintResult(driver.driverId, round, sprintResults);

        // Check if sprint has happened
        if (sprintResults[round]) {
            // Past sprint - check if driver participated
            if (sprintResult && sprintResult.isActual) {
                const pos = sprintResult.position;
                let posClass = '';
                
                if (pos === 0) {
                    // DNF - no styling
                    posClass = 'dnf';
                } else if (pos === 1) {
                    posClass = 'result-1';
                } else if (pos === 2) {
                    posClass = 'result-2';
                } else if (pos === 3) {
                    posClass = 'result-3';
                } else if (pos > 0 && pos <= 8) {
                    posClass = 'result-points';
                }
                // Positions 9-20 get no special class
                
                return `<td class="sprint-race ${posClass} ${collapsedClass}">${pos > 0 ? pos : 'DNF'}</td>`;
            } else {
                // Driver didn't participate in this sprint
                return `<td class="sprint-race ${collapsedClass}">-</td>`;
            }
        } else {
            // Future sprint - show dropdown
            const predictedPos = getPredictedPosition(driver.driverId, round, true);
            
            // Get used positions for this round
            const usedPositions = [];
            if (sprintPredictions[round]) {
                for (const [dId, pos] of Object.entries(sprintPredictions[round])) {
                    if (dId !== driver.driverId && pos > 0) {
                        usedPositions.push(parseInt(pos));
                    }
                }
            }
            
            return `<td class="future-race sprint-race ${collapsedClass}">
                <select data-driver="${driver.driverId}" data-round="${round}" data-type="sprint">
                    ${this.generatePositionOptions(predictedPos, usedPositions)}
                </select>
            </td>`;
        }
    }

    /**
     * Render race cell
     * @param {Object} driver - Driver object
     * @param {number} round - Race round
     * @param {Object} raceResults - Race results by round
     * @param {Function} getPredictedPosition - Function to get predicted position
     * @param {Array} allDrivers - All drivers with points
     * @param {Object} userPredictions - User predictions by round
     * @param {boolean} forceCollapsed - Force collapsed styling
     * @returns {string} - HTML string
     */
    renderRaceCell(driver, round, raceResults, getPredictedPosition, allDrivers, userPredictions, forceCollapsed = false) {
        const collapsedClass = forceCollapsed ? 'collapsed' : '';

        const raceResult = PointsCalculator.getDriverRaceResult(driver.driverId, round, raceResults);

        // Check if race has happened
        if (raceResults[round]) {
            // Past race - check if driver participated
            if (raceResult && raceResult.isActual) {
                const pos = raceResult.position;
                let posClass = '';
                
                if (pos === 0) {
                    // DNF - no styling
                    posClass = 'dnf';
                } else if (pos === 1) {
                    posClass = 'result-1';
                } else if (pos === 2) {
                    posClass = 'result-2';
                } else if (pos === 3) {
                    posClass = 'result-3';
                } else if (pos > 0 && pos <= 10) {
                    posClass = 'result-points';
                }
                // Positions 11-20 get no special class
                
                return `<td class="${posClass} ${collapsedClass}">${pos > 0 ? pos : 'DNF'}</td>`;
            } else {
                // Driver didn't participate in this race
                return `<td class="${collapsedClass}">-</td>`;
            }
        } else {
            // Future race - show dropdown
            const predictedPos = getPredictedPosition(driver.driverId, round, false);
            
            // Get used positions for this round
            const usedPositions = [];
            if (userPredictions[round]) {
                for (const [dId, pos] of Object.entries(userPredictions[round])) {
                    if (dId !== driver.driverId && pos > 0) {
                        usedPositions.push(parseInt(pos));
                    }
                }
            }
            
            return `<td class="future-race ${collapsedClass}">
                <select data-driver="${driver.driverId}" data-round="${round}" data-type="race">
                    ${this.generatePositionOptions(predictedPos, usedPositions)}
                </select>
            </td>`;
        }
    }
}
