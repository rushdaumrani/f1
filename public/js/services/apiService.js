/**
 * API Service for F1 data
 * Handles all communication with the Ergast F1 API
 */

const API_BASE = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_SEASON = '2025';

export class F1ApiService {
    /**
     * Fetch JSON data from API endpoint
     * @param {string} url - API endpoint URL
     * @returns {Promise<Object>} - MRData object from API response
     */
    async fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.MRData;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            throw error;
        }
    }

    /**
     * Get current driver standings
     * @returns {Promise<Array>} - Array of driver standings
     */
    async getDriverStandings() {
        const data = await this.fetchJSON(`${API_BASE}/current/driverstandings`);
        return data.StandingsTable.StandingsLists[0].DriverStandings;
    }

    /**
     * Get all races for current season
     * @returns {Promise<Array>} - Array of race objects
     */
    async getRaces() {
        const data = await this.fetchJSON(`${API_BASE}/current`);
        return data.RaceTable.Races;
    }

    /**
     * Get race results for a specific round
     * @param {number} round - Race round number
     * @returns {Promise<Array|null>} - Array of results or null if not available
     */
    async getRaceResults(round) {
        try {
            const data = await this.fetchJSON(`${API_BASE}/${CURRENT_SEASON}/${round}/results`);
            if (data.RaceTable.Races.length > 0) {
                return data.RaceTable.Races[0].Results;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get sprint results for a specific round
     * @param {number} round - Race round number
     * @returns {Promise<Array|null>} - Array of sprint results or null if not available
     */
    async getSprintResults(round) {
        try {
            const data = await this.fetchJSON(`${API_BASE}/${CURRENT_SEASON}/${round}/sprint`);
            if (data.RaceTable.Races.length > 0 && data.RaceTable.Races[0].SprintResults) {
                return data.RaceTable.Races[0].SprintResults;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get qualifying results for a specific round
     * @param {number} round - Race round number
     * @returns {Promise<Array|null>} - Array of qualifying results or null if not available
     */
    async getQualifyingResults(round) {
        try {
            const data = await this.fetchJSON(`${API_BASE}/${CURRENT_SEASON}/${round}/qualifying`);
            if (data.RaceTable.Races.length > 0 && data.RaceTable.Races[0].QualifyingResults) {
                return data.RaceTable.Races[0].QualifyingResults;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get sprint qualifying results for a specific round
     * @param {number} round - Race round number
     * @returns {Promise<Array|null>} - Array of sprint qualifying results or null if not available
     */
    async getSprintQualifyingResults(round) {
        try {
            const data = await this.fetchJSON(`${API_BASE}/${CURRENT_SEASON}/${round}/sprintQualifying`);
            if (data.RaceTable.Races.length > 0 && data.RaceTable.Races[0].QualifyingResults) {
                return data.RaceTable.Races[0].QualifyingResults;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Load all data needed for the standings tracker
     * @returns {Promise<Object>} - Object containing all race data
     */
    async loadAllData() {
        const standings = await this.getDriverStandings();
        const races = await this.getRaces();

        const raceResults = {};
        const sprintResults = {};
        const qualifyingResults = {};
        const sprintQualifyingResults = {};

        // Fetch results for each race
        for (const race of races) {
            const round = race.round;
            const hasSprint = race.Sprint !== undefined;

            // Fetch race results
            const raceResult = await this.getRaceResults(round);
            if (raceResult) {
                raceResults[round] = raceResult;
            }

            // Fetch sprint results if applicable
            if (hasSprint) {
                const sprintResult = await this.getSprintResults(round);
                if (sprintResult) {
                    sprintResults[round] = sprintResult;
                }
            }

            // Fetch qualifying results for future races
            if (!raceResults[round]) {
                const qualResult = await this.getQualifyingResults(round);
                if (qualResult) {
                    qualifyingResults[round] = qualResult;
                }
            }

            // Fetch sprint qualifying for future sprints
            if (hasSprint && !sprintResults[round]) {
                const sprintQualResult = await this.getSprintQualifyingResults(round);
                if (sprintQualResult) {
                    sprintQualifyingResults[round] = sprintQualResult;
                }
            }
        }

        return {
            standings,
            races,
            raceResults,
            sprintResults,
            qualifyingResults,
            sprintQualifyingResults
        };
    }
}
