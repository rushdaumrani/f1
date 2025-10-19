/**
 * Prediction Manager
 * Manages user predictions and default predictions based on qualifying
 */

export class PredictionManager {
    constructor() {
        this.userPredictions = {};
        this.sprintPredictions = {};
    }

    /**
     * Get predicted position for a driver
     * @param {string} driverId - Driver ID
     * @param {number} round - Race round
     * @param {boolean} isSprint - Whether this is for a sprint race
     * @param {Object} qualifyingResults - Qualifying results by round
     * @param {Object} sprintQualifyingResults - Sprint qualifying results by round
     * @param {Array} driversData - Array of driver data with current positions
     * @returns {number|null} - Predicted position or null
     */
    getPredictedPosition(driverId, round, isSprint, qualifyingResults, sprintQualifyingResults, driversData) {
        // Check user predictions first
        const predictions = isSprint ? this.sprintPredictions : this.userPredictions;
        if (predictions[round] && predictions[round].hasOwnProperty(driverId)) {
            const pos = predictions[round][driverId];
            return pos === null ? 0 : parseInt(pos);
        }

        // Check qualifying results to see if driver participated
        const qualResults = isSprint ? sprintQualifyingResults : qualifyingResults;
        if (qualResults[round]) {
            const qualResult = qualResults[round].find(q => q.Driver.driverId === driverId);
            if (qualResult) {
                return parseInt(qualResult.position);
            } else {
                // Driver didn't participate in qualifying, default to null
                return 0;
            }
        }

        // Default to current championship position, or null if past 20
        const driver = driversData.find(d => d.driverId === driverId);
        if (!driver || driver.position > 20) {
            return 0; // null option
        }
        return driver.position;
    }

    /**
     * Update race prediction
     * @param {string} driverId - Driver ID
     * @param {number} round - Race round
     * @param {number|null} position - Predicted position or null
     */
    updatePrediction(driverId, round, position) {
        if (!this.userPredictions[round]) {
            this.userPredictions[round] = {};
        }
        this.userPredictions[round][driverId] = position;
    }

    /**
     * Update sprint prediction
     * @param {string} driverId - Driver ID
     * @param {number} round - Race round
     * @param {number|null} position - Predicted position or null
     */
    updateSprintPrediction(driverId, round, position) {
        if (!this.sprintPredictions[round]) {
            this.sprintPredictions[round] = {};
        }
        this.sprintPredictions[round][driverId] = position;
    }

    /**
     * Reset all predictions
     */
    resetPredictions() {
        this.userPredictions = {};
        this.sprintPredictions = {};
    }

    /**
     * Export predictions to JSON
     * @returns {Object} - Predictions object
     */
    exportPredictions() {
        return {
            userPredictions: this.userPredictions,
            sprintPredictions: this.sprintPredictions
        };
    }

    /**
     * Import predictions from JSON
     * @param {Object} data - Predictions object
     */
    importPredictions(data) {
        if (data.userPredictions) {
            this.userPredictions = data.userPredictions;
        }
        if (data.sprintPredictions) {
            this.sprintPredictions = data.sprintPredictions;
        }
    }
}
