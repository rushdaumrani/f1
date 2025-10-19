/**
 * Points Calculator Utility
 * Handles all points-related calculations for F1 standings
 */

export const POINTS_SYSTEM = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1
};

export const SPRINT_POINTS_SYSTEM = {
    1: 8, 2: 7, 3: 6, 4: 5, 5: 4,
    6: 3, 7: 2, 8: 1
};

export class PointsCalculator {
    /**
     * Get points for a race position
     * @param {number} position - Finishing position
     * @returns {number} - Points awarded
     */
    static getRacePoints(position) {
        return POINTS_SYSTEM[position] || 0;
    }

    /**
     * Get points for a sprint position
     * @param {number} position - Finishing position
     * @returns {number} - Points awarded
     */
    static getSprintPoints(position) {
        return SPRINT_POINTS_SYSTEM[position] || 0;
    }

    /**
     * Calculate total points for a driver
     * @param {string} driverId - Driver ID
     * @param {Array} races - Array of race objects
     * @param {Object} raceResults - Race results by round
     * @param {Object} sprintResults - Sprint results by round
     * @param {Object} userPredictions - User predictions by round
     * @param {Object} sprintPredictions - Sprint predictions by round
     * @param {Set} collapsedColumns - Set of collapsed column IDs
     * @param {Function} getPredictedPosition - Function to get predicted position
     * @returns {number} - Total points
     */
    static calculateTotalPoints(
        driverId,
        races,
        raceResults,
        sprintResults,
        userPredictions,
        sprintPredictions,
        collapsedColumns,
        getPredictedPosition
    ) {
        let totalPoints = 0;

        for (const race of races) {
            const round = race.round;
            const hasSprint = race.Sprint !== undefined;

            // Add sprint points if applicable
            if (hasSprint && !collapsedColumns.has(`sprint-${round}`)) {
                const sprintResult = this.getDriverSprintResult(driverId, round, sprintResults);
                if (sprintResult) {
                    totalPoints += sprintResult.points;
                } else {
                    const predictedPos = getPredictedPosition(driverId, round, true);
                    // Only add points if position is valid (not 0/null)
                    if (predictedPos > 0) {
                        totalPoints += this.getSprintPoints(predictedPos);
                    }
                }
            }

            // Add race points
            if (!collapsedColumns.has(`race-${round}`)) {
                const raceResult = this.getDriverRaceResult(driverId, round, raceResults);
                if (raceResult) {
                    totalPoints += raceResult.points;
                } else {
                    const predictedPos = getPredictedPosition(driverId, round, false);
                    // Only add points if position is valid (not 0/null)
                    if (predictedPos > 0) {
                        totalPoints += this.getRacePoints(predictedPos);
                    }
                }
            }
        }

        return totalPoints;
    }

    /**
     * Get driver's race result
     * @param {string} driverId - Driver ID
     * @param {number} round - Race round
     * @param {Object} raceResults - Race results by round
     * @returns {Object|null} - Result object or null
     */
    static getDriverRaceResult(driverId, round, raceResults) {
        if (raceResults[round]) {
            const result = raceResults[round].find(r => r.Driver.driverId === driverId);
            if (result) {
                return {
                    position: parseInt(result.positionText === 'R' ? 0 : result.position),
                    points: parseInt(result.points),
                    isActual: true
                };
            }
        }
        return null;
    }

    /**
     * Get driver's sprint result
     * @param {string} driverId - Driver ID
     * @param {number} round - Race round
     * @param {Object} sprintResults - Sprint results by round
     * @returns {Object|null} - Result object or null
     */
    static getDriverSprintResult(driverId, round, sprintResults) {
        if (sprintResults[round]) {
            const result = sprintResults[round].find(r => r.Driver.driverId === driverId);
            if (result) {
                return {
                    position: parseInt(result.positionText === 'R' ? 0 : result.position),
                    points: parseInt(result.points),
                    isActual: true
                };
            }
        }
        return null;
    }
}
