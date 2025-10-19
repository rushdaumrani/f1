/**
 * Main Application Controller
 * Coordinates all components and manages application state
 */

import { F1ApiService } from './services/apiService.js';
import { PointsCalculator } from './utils/pointsCalculator.js';
import { PredictionManager } from './utils/predictionManager.js';
import { TableRenderer } from './components/tableRenderer.js';

class F1StandingsApp {
    constructor() {
        this.apiService = new F1ApiService();
        this.predictionManager = new PredictionManager();
        this.tableRenderer = new TableRenderer('content');
        
        this.driversData = [];
        this.racesData = [];
        this.raceResults = {};
        this.sprintResults = {};
        this.qualifyingResults = {};
        this.sprintQualifyingResults = {};

        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Button event listeners
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadData());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetPredictions());
        document.getElementById('toggle-past-btn').addEventListener('click', () => this.toggleAllPast());
        document.getElementById('toggle-future-btn').addEventListener('click', () => this.toggleAllFuture());

        // Event delegation for table interactions
        document.getElementById('content').addEventListener('click', (e) => {
            if (e.target.classList.contains('collapsible') || e.target.closest('.collapsible')) {
                const header = e.target.classList.contains('collapsible') ? e.target : e.target.closest('.collapsible');
                const columnId = header.dataset.column;
                if (columnId) {
                    this.toggleColumn(columnId);
                }
            }
        });

        document.getElementById('content').addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                const driverId = e.target.dataset.driver;
                const round = e.target.dataset.round;
                const type = e.target.dataset.type;
                const position = e.target.value;

                if (type === 'sprint') {
                    this.updateSprintPrediction(driverId, round, position, e.target);
                } else {
                    this.updatePrediction(driverId, round, position, e.target);
                }
            }
        });
    }

    /**
     * Load all F1 data
     */
    async loadData() {
        try {
            this.tableRenderer.showLoading();

            const data = await this.apiService.loadAllData();

            // Store data
            this.driversData = data.standings.map(s => ({
                driverId: s.Driver.driverId,
                code: s.Driver.code,
                givenName: s.Driver.givenName,
                familyName: s.Driver.familyName,
                position: parseInt(s.position),
                currentPoints: parseInt(s.points)
            }));

            this.racesData = data.races;
            this.raceResults = data.raceResults;
            this.sprintResults = data.sprintResults;
            this.qualifyingResults = data.qualifyingResults;
            this.sprintQualifyingResults = data.sprintQualifyingResults;

            this.renderTable();
        } catch (error) {
            this.tableRenderer.showError(error.message);
            console.error('Error loading data:', error);
        }
    }

    /**
     * Render the standings table
     */
    renderTable() {
        this.tableRenderer.render({
            driversData: this.driversData,
            races: this.racesData,
            raceResults: this.raceResults,
            sprintResults: this.sprintResults,
            userPredictions: this.predictionManager.userPredictions,
            sprintPredictions: this.predictionManager.sprintPredictions,
            getPredictedPosition: (driverId, round, isSprint) => 
                this.predictionManager.getPredictedPosition(
                    driverId, 
                    round, 
                    isSprint, 
                    this.qualifyingResults, 
                    this.sprintQualifyingResults, 
                    this.driversData
                ),
            calculatePoints: (driverId) => 
                PointsCalculator.calculateTotalPoints(
                    driverId,
                    this.racesData,
                    this.raceResults,
                    this.sprintResults,
                    this.predictionManager.userPredictions,
                    this.predictionManager.sprintPredictions,
                    this.tableRenderer.collapsedColumns,
                    (dId, r, isSprint) => this.predictionManager.getPredictedPosition(
                        dId, r, isSprint, 
                        this.qualifyingResults, 
                        this.sprintQualifyingResults, 
                        this.driversData
                    )
                )
        });
    }

    /**
     * Update race prediction with auto-swap for duplicates
     */
    updatePrediction(driverId, round, position, selectElement) {
        // Convert '0' to null for no prediction
        const pos = position === '0' || position === 0 ? null : parseInt(position);
        
        // Check for duplicate and swap if needed
        if (pos && pos > 0) {
            const predictions = this.predictionManager.userPredictions[round] || {};
            for (const [otherDriverId, otherPos] of Object.entries(predictions)) {
                if (otherDriverId !== driverId && parseInt(otherPos) === pos) {
                    // Swap: give the other driver this driver's old position
                    const oldPos = predictions[driverId];
                    this.predictionManager.updatePrediction(otherDriverId, round, oldPos);
                    break;
                }
            }
        }
        
        this.predictionManager.updatePrediction(driverId, round, pos);
        this.renderTable();
    }

    /**
     * Update sprint prediction with auto-swap for duplicates
     */
    updateSprintPrediction(driverId, round, position, selectElement) {
        // Convert '0' to null for no prediction
        const pos = position === '0' || position === 0 ? null : parseInt(position);
        
        // Check for duplicate and swap if needed
        if (pos && pos > 0) {
            const predictions = this.predictionManager.sprintPredictions[round] || {};
            for (const [otherDriverId, otherPos] of Object.entries(predictions)) {
                if (otherDriverId !== driverId && parseInt(otherPos) === pos) {
                    // Swap: give the other driver this driver's old position
                    const oldPos = predictions[driverId];
                    this.predictionManager.updateSprintPrediction(otherDriverId, round, oldPos);
                    break;
                }
            }
        }
        
        this.predictionManager.updateSprintPrediction(driverId, round, pos);
        this.renderTable();
    }

    /**
     * Toggle column visibility
     */
    toggleColumn(columnId) {
        this.tableRenderer.toggleColumn(columnId);
        this.renderTable();
    }

    /**
     * Reset all predictions
     */
    resetPredictions() {
        this.predictionManager.resetPredictions();
        this.renderTable();
    }

    /**
     * Toggle all past race columns
     */
    toggleAllPast() {
        const isNowCollapsed = this.tableRenderer.toggleAllPast(this.racesData, this.raceResults, this.sprintResults);
        this.renderTable();
        
        // Update button state
        const btn = document.getElementById('toggle-past-btn');
        btn.dataset.active = isNowCollapsed ? 'true' : 'false';
        btn.textContent = isNowCollapsed ? '⊞ Show Past Races' : '⊟ Hide Past Races';
    }

    /**
     * Toggle all future race columns
     */
    toggleAllFuture() {
        const isNowCollapsed = this.tableRenderer.toggleAllFuture(this.racesData, this.raceResults, this.sprintResults);
        this.renderTable();
        
        // Update button state
        const btn = document.getElementById('toggle-future-btn');
        btn.dataset.active = isNowCollapsed ? 'true' : 'false';
        btn.textContent = isNowCollapsed ? '⊞ Show Future Races' : '⊟ Hide Future Races';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new F1StandingsApp();
    window.app.loadData();
});
