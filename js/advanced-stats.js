// Advanced Statistics System
class AdvancedStatistics {
    constructor() {
        this.playerMetrics = new Map();
        this.teamAnalytics = new Map();
        this.init();
    }

    init() {
        console.log('Advanced Statistics initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for tab changes to load advanced stats
        document.addEventListener('DOMContentLoaded', () => {
            const advancedStatsTab = document.querySelector('[data-tab="advanced-stats"]');
            if (advancedStatsTab) {
                advancedStatsTab.addEventListener('click', () => {
                    this.loadAdvancedStatsDashboard();
                });
            }
        });
    }

    // Load the advanced statistics dashboard
    async loadAdvancedStatsDashboard() {
        const container = document.getElementById('advanced-stats-container');
        if (!container) return;

        container.innerHTML = this.generateDashboardHTML();
        await this.populatePlayerStats();
        this.setupComparisonTool();
    }

    generateDashboardHTML() {
        return `
            <div class="text-center mb-5">
                <h1 class="text-warning"><i class="fas fa-chart-line me-3"></i>Advanced Statistics</h1>
                <p class="text-muted">Deep insights into player and team performance</p>
            </div>

            <!-- Player Performance Analysis -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-user me-2"></i>Player Performance Analysis
                        </h4>
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label for="player-select" class="form-label">Select Player</label>
                                <select class="form-select bg-dark text-light" id="player-select">
                                    <option value="">Choose a player...</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="compare-player-select" class="form-label">Compare With</label>
                                <select class="form-select bg-dark text-light" id="compare-player-select">
                                    <option value="">Select player to compare...</option>
                                </select>
                            </div>
                        </div>
                        <div id="player-stats-container">
                            <!-- Player stats will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Player Comparison -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-users me-2"></i>Player Comparison
                        </h4>
                        <div id="player-comparison-container">
                            <div class="text-center text-muted p-5">
                                <i class="fas fa-users fa-3x mb-3"></i>
                                <p>Select two players to compare their performance</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Team Performance -->
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-card">
                        <h5 class="text-info mb-3">
                            <i class="fas fa-shield-alt me-2"></i>Team Performance
                        </h5>
                        <div id="team-stats-container">
                            <!-- Team stats will be loaded here -->
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-card">
                        <h5 class="text-info mb-3">
                            <i class="fas fa-trophy me-2"></i>Tournament Leaders
                        </h5>
                        <div id="tournament-leaders-container">
                            <!-- Tournament leaders will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Metrics -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h4 class="text-warning mb-4">
                            <i class="fas fa-chart-bar me-2"></i>Advanced Metrics
                        </h4>
                        <div class="row" id="advanced-metrics-container">
                            <!-- Advanced metrics will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Populate player select dropdowns
    async populatePlayerSelects() {
        try {
            const players = await getData(DB_KEYS.PLAYERS);
            const playerSelect = document.getElementById('player-select');
            const compareSelect = document.getElementById('compare-player-select');

            if (!playerSelect || !compareSelect) return;

            // Clear existing options
            playerSelect.innerHTML = '<option value="">Choose a player...</option>';
            compareSelect.innerHTML = '<option value="">Select player to compare...</option>';

            // Validate players is an array
            if (!Array.isArray(players)) {
                console.error('Players data is not an array:', players);
                return;
            }

            // Remove duplicate players
            const uniquePlayers = [];
            const seenPlayerIds = new Set();
            
            players.forEach(player => {
                if (player && !seenPlayerIds.has(player.id)) {
                    seenPlayerIds.add(player.id);
                    uniquePlayers.push(player);
                }
            });

            // Add player options
            uniquePlayers.forEach(player => {
                const option1 = document.createElement('option');
                option1.value = player.id;
                option1.textContent = `${player.name} (${player.team})`;
                playerSelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = player.id;
                option2.textContent = `${player.name} (${player.team})`;
                compareSelect.appendChild(option2);
            });

            // Add event listeners
            playerSelect.addEventListener('change', (e) => {
                this.loadPlayerStats(parseInt(e.target.value));
                this.updateComparison();
            });

            compareSelect.addEventListener('change', () => {
                this.updateComparison();
            });
        } catch (error) {
            console.error('Error populating player selects:', error);
        }
    }

    // Load player statistics
    async loadPlayerStats(playerId) {
        if (!playerId) {
            document.getElementById('player-stats-container').innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-user fa-2x mb-2"></i>
                    <p>Select a player to view detailed statistics</p>
                </div>
            `;
            return;
        }

        const player = await getPlayerById(playerId);
        if (!player) return;

        const stats = await this.analyzePlayerPerformance(playerId);
        
        document.getElementById('player-stats-container').innerHTML = this.generatePlayerStatsHTML(player, stats);
    }

    // Analyze player performance comprehensively
    async analyzePlayerPerformance(playerId) {
        const results = await getData(DB_KEYS.RESULTS);
        const playerResults = results.filter(r => 
            r && (r.home_player_id === playerId || r.away_player_id === playerId)
        );

        return {
            basicStats: this.getBasicStats(playerResults, playerId),
            formAnalysis: this.analyzeForm(playerResults, playerId),
            strengthAnalysis: this.analyzeStrengthProgression(playerId),
            predictiveAnalytics: this.predictFuturePerformance(playerId)
        };
    }

    getBasicStats(results, playerId) {
        let stats = {
            matches: results.length,
            wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            homeRecord: { wins: 0, draws: 0, losses: 0 },
            awayRecord: { wins: 0, draws: 0, losses: 0 },
            cleanSheets: 0,
            avgGoalsPerMatch: 0,
            winPercentage: 0
        };

        if (results.length === 0) return stats;

        results.forEach(result => {
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? result.home_score : result.away_score;
            const opponentScore = isHome ? result.away_score : result.home_score;

            // Win/draw/loss
            if (playerScore > opponentScore) {
                stats.wins++;
                if (isHome) stats.homeRecord.wins++;
                else stats.awayRecord.wins++;
            } else if (playerScore === opponentScore) {
                stats.draws++;
                if (isHome) stats.homeRecord.draws++;
                else stats.awayRecord.draws++;
            } else {
                stats.losses++;
                if (isHome) stats.homeRecord.losses++;
                else stats.awayRecord.losses++;
            }

            // Goals
            stats.goalsFor += playerScore || 0;
            stats.goalsAgainst += opponentScore || 0;

            // Clean sheets
            if (opponentScore === 0) stats.cleanSheets++;
        });

        // Calculate averages and percentages
        stats.avgGoalsPerMatch = (stats.goalsFor / stats.matches).toFixed(1);
        stats.winPercentage = ((stats.wins / stats.matches) * 100).toFixed(1);
        stats.homeWinRate = stats.homeRecord.wins > 0 ? 
            ((stats.homeRecord.wins / (stats.homeRecord.wins + stats.homeRecord.draws + stats.homeRecord.losses)) * 100).toFixed(1) : 0;
        stats.awayWinRate = stats.awayRecord.wins > 0 ? 
            ((stats.awayRecord.wins / (stats.awayRecord.wins + stats.awayRecord.draws + stats.awayRecord.losses)) * 100).toFixed(1) : 0;

        return stats;
    }

    analyzeForm(results, playerId) {
        // Last 5 matches form
        const last5 = results.slice(-5).reverse();
        const form = last5.map(result => {
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? result.home_score : result.away_score;
            const opponentScore = isHome ? result.away_score : result.home_score;

            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        });

        // Form trend analysis
        const pointsPerGame = last5.reduce((acc, result) => {
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? result.home_score : result.away_score;
            const opponentScore = isHome ? result.away_score : result.home_score;

            if (playerScore > opponentScore) return acc + 3;
            if (playerScore === opponentScore) return acc + 1;
            return acc;
        }, 0) / (last5.length || 1);

        return {
            recentForm: form,
            currentStreak: this.calculateStreak(form),
            pointsPerGame: pointsPerGame.toFixed(2),
            formRating: this.calculateFormRating(form)
        };
    }

    calculateStreak(form) {
        if (form.length === 0) return { type: 'none', length: 0 };
        
        let currentType = form[0];
        let length = 1;

        for (let i = 1; i < form.length; i++) {
            if (form[i] === currentType) {
                length++;
            } else {
                break;
            }
        }

        return { type: currentType, length: length };
    }

    calculateFormRating(form) {
        if (form.length === 0) return 0;
        
        const weights = { 'W': 1, 'D': 0.5, 'L': 0 };
        const rating = form.reduce((acc, result) => acc + weights[result], 0) / form.length;
        return Math.round(rating * 100);
    }

    generatePlayerStatsHTML(player, stats) {
        const formBadges = stats.formAnalysis.recentForm.map(result => {
            const badgeClass = result === 'W' ? 'bg-success' : result === 'D' ? 'bg-warning' : 'bg-danger';
            return `<span class="badge ${badgeClass} me-1">${result}</span>`;
        }).join('');

        return `
            <div class="row">
                <div class="col-md-3 text-center">
                    <img src="${player.photo}" class="rounded-circle mb-3" 
                         style="width: 100px; height: 100px; object-fit: cover;"
                         onerror="this.src='${player.default_photo || 'https://via.placeholder.com/100'}')">
                    <h5 class="text-warning">${player.name}</h5>
                    <span class="badge" style="background-color: ${player.team_color || '#6c757d'}; color: white;">
                        ${player.team}
                    </span>
                    <div class="mt-2">
                        <small class="text-muted">Strength: ${player.strength}</small>
                    </div>
                </div>

                <div class="col-md-5">
                    <h6 class="text-info">Basic Statistics</h6>
                    <div class="row">
                        <div class="col-4 mb-3">
                            <div class="text-center p-2 rounded" style="background: rgba(106, 17, 203, 0.2);">
                                <div class="h5 text-warning mb-1">${stats.basicStats.matches}</div>
                                <small>Matches</small>
                            </div>
                        </div>
                        <div class="col-4 mb-3">
                            <div class="text-center p-2 rounded" style="background: rgba(40, 167, 69, 0.2);">
                                <div class="h5 text-success mb-1">${stats.basicStats.wins}</div>
                                <small>Wins</small>
                            </div>
                        </div>
                        <div class="col-4 mb-3">
                            <div class="text-center p-2 rounded" style="background: rgba(255, 193, 7, 0.2);">
                                <div class="h5 text-warning mb-1">${stats.basicStats.draws}</div>
                                <small>Draws</small>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Win Rate</span>
                            <span class="text-warning">${stats.basicStats.winPercentage}%</span>
                        </div>
                        <div class="progress progress-custom">
                            <div class="progress-bar bg-success" style="width: ${stats.basicStats.winPercentage}%"></div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Goals Scored</span>
                            <span class="text-warning">${stats.basicStats.goalsFor}</span>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Goals Conceded</span>
                            <span class="text-warning">${stats.basicStats.goalsAgainst}</span>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <h6 class="text-info">Form Analysis</h6>
                    <div class="mb-3">
                        <strong>Recent Form:</strong>
                        <div class="mt-1">${formBadges || '<span class="text-muted">No matches</span>'}</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Current Streak:</span>
                            <span class="badge ${stats.formAnalysis.currentStreak.type === 'W' ? 'bg-success' : 
                                stats.formAnalysis.currentStreak.type === 'D' ? 'bg-warning' : 'bg-danger'}">
                                ${stats.formAnalysis.currentStreak.type} ${stats.formAnalysis.currentStreak.length}
                            </span>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Form Rating:</span>
                            <span class="text-warning">${stats.formAnalysis.formRating}/100</span>
                        </div>
                        <div class="progress progress-custom">
                            <div class="progress-bar bg-warning" style="width: ${stats.formAnalysis.formRating}%"></div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Points/Game:</span>
                            <span class="text-warning">${stats.formAnalysis.pointsPerGame}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup player comparison tool
    setupComparisonTool() {
        this.populatePlayerSelects();
    }

    // Update player comparison
    async updateComparison() {
        const player1Id = parseInt(document.getElementById('player-select').value);
        const player2Id = parseInt(document.getElementById('compare-player-select').value);

        if (!player1Id || !player2Id) {
            document.getElementById('player-comparison-container').innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-users fa-3x mb-3"></i>
                    <p>Select two players to compare their performance</p>
                </div>
            `;
            return;
        }

        const comparison = await this.generatePlayerComparison(player1Id, player2Id);
        document.getElementById('player-comparison-container').innerHTML = comparison;
    }

    // Generate player comparison HTML
    async generatePlayerComparison(player1Id, player2Id) {
        const player1 = await getPlayerById(player1Id);
        const player2 = await getPlayerById(player2Id);
        const stats1 = await this.analyzePlayerPerformance(player1Id);
        const stats2 = await this.analyzePlayerPerformance(player2Id);

        return `
            <div class="player-comparison">
                <div class="row text-center mb-4">
                    <div class="col-md-5">
                        <img src="${player1.photo}" 
                             class="rounded-circle mb-2" style="width: 80px; height: 80px; object-fit: cover;"
                             onerror="this.src='${player1.default_photo || 'https://via.placeholder.com/100'}')">
                        <h5 class="text-warning">${player1.name}</h5>
                        <small class="text-muted">${player1.team}</small>
                    </div>
                    <div class="col-md-2 d-flex align-items-center justify-content-center">
                        <h3 class="text-muted">VS</h3>
                    </div>
                    <div class="col-md-5">
                        <img src="${player2.photo}" 
                             class="rounded-circle mb-2" style="width: 80px; height: 80px; object-fit: cover;"
                             onerror="this.src='${player2.default_photo || 'https://via.placeholder.com/100'}')">
                        <h5 class="text-info">${player2.name}</h5>
                        <small class="text-muted">${player2.team}</small>
                    </div>
                </div>

                <!-- Comparison Stats -->
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Win Rate</span>
                                <span>${stats1.basicStats.winPercentage}% vs ${stats2.basicStats.winPercentage}%</span>
                            </div>
                            <div class="progress progress-custom mt-1">
                                <div class="progress-bar bg-warning" style="width: ${stats1.basicStats.winPercentage}%"></div>
                                <div class="progress-bar bg-info" style="width: ${stats2.basicStats.winPercentage}%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Goals/Match</span>
                                <span>${stats1.basicStats.avgGoalsPerMatch} vs ${stats2.basicStats.avgGoalsPerMatch}</span>
                            </div>
                            <div class="progress progress-custom mt-1">
                                <div class="progress-bar bg-warning" style="width: ${(parseFloat(stats1.basicStats.avgGoalsPerMatch) / 5) * 100}%"></div>
                                <div class="progress-bar bg-info" style="width: ${(parseFloat(stats2.basicStats.avgGoalsPerMatch) / 5) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Form Rating</span>
                                <span>${stats1.formAnalysis.formRating} vs ${stats2.formAnalysis.formRating}</span>
                            </div>
                            <div class="progress progress-custom mt-1">
                                <div class="progress-bar bg-warning" style="width: ${stats1.formAnalysis.formRating}%"></div>
                                <div class="progress-bar bg-info" style="width: ${stats2.formAnalysis.formRating}%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Points/Game</span>
                                <span>${stats1.formAnalysis.pointsPerGame} vs ${stats2.formAnalysis.pointsPerGame}</span>
                            </div>
                            <div class="progress progress-custom mt-1">
                                <div class="progress-bar bg-warning" style="width: ${(parseFloat(stats1.formAnalysis.pointsPerGame) / 3) * 100}%"></div>
                                <div class="progress-bar bg-info" style="width: ${(parseFloat(stats2.formAnalysis.pointsPerGame) / 3) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Head-to-Head Record -->
                <div class="mt-4">
                    <h6 class="text-info">Head-to-Head Record</h6>
                    ${await this.generateHeadToHeadRecord(player1Id, player2Id)}
                </div>
            </div>
        `;
    }

    // Generate head-to-head record between two players
    async generateHeadToHeadRecord(player1Id, player2Id) {
        const results = await getData(DB_KEYS.RESULTS);
        const headToHead = results.filter(result => 
            result && ((result.home_player_id === player1Id && result.away_player_id === player2Id) ||
            (result.home_player_id === player2Id && result.away_player_id === player1Id))
        );

        if (headToHead.length === 0) {
            return '<p class="text-muted text-center">No head-to-head matches yet</p>';
        }

        let player1Wins = 0, player2Wins = 0, draws = 0;

        headToHead.forEach(result => {
            const isPlayer1Home = result.home_player_id === player1Id;
            const player1Score = isPlayer1Home ? result.home_score : result.away_score;
            const player2Score = isPlayer1Home ? result.away_score : result.home_score;

            if (player1Score > player2Score) player1Wins++;
            else if (player2Score > player1Score) player2Wins++;
            else draws++;
        });

        const player1 = await getPlayerById(player1Id);
        const player2 = await getPlayerById(player2Id);

        return `
            <div class="row text-center">
                <div class="col-4">
                    <div class="h4 text-warning">${player1Wins}</div>
                    <small>${player1.name} Wins</small>
                </div>
                <div class="col-4">
                    <div class="h4 text-muted">${draws}</div>
                    <small>Draws</small>
                </div>
                <div class="col-4">
                    <div class="h4 text-info">${player2Wins}</div>
                    <small>${player2.name} Wins</small>
                </div>
            </div>
        `;
    }

    // Analyze strength progression (placeholder for future enhancement)
    analyzeStrengthProgression(playerId) {
        // This would track strength changes over time
        return {
            currentStrength: 0, // Will be populated from player data
            trend: 'stable', // rising, falling, stable
            progression: [] // historical strength data
        };
    }

    // Predict future performance (basic implementation)
    predictFuturePerformance(playerId) {
        // This is a simplified implementation - in real scenario, we'd use the actual stats
        const formRating = 50; // Default value
        
        let prediction = 'Stable';
        if (formRating >= 80) prediction = 'Excellent';
        else if (formRating >= 60) prediction = 'Good';
        else if (formRating >= 40) prediction = 'Average';
        else prediction = 'Needs Improvement';

        return {
            formPrediction: prediction,
            nextMatchConfidence: Math.min(formRating + 10, 95),
            recommendedStrategy: "Balanced approach recommended"
        };
    }

    // Load team statistics
    async loadTeamStats() {
        const teams = await this.getUniqueTeams();
        const container = document.getElementById('team-stats-container');
        
        if (!container) return;

        let html = '';
        for (const team of teams) {
            const stats = await this.analyzeTeamPerformance(team);
            html += this.generateTeamStatsHTML(team, stats);
        }

        container.innerHTML = html || '<p class="text-muted text-center">No team data available</p>';
    }

    // Get unique teams from players
    async getUniqueTeams() {
        const players = await getData(DB_KEYS.PLAYERS);
        if (!Array.isArray(players)) return [];
        const teams = [...new Set(players.map(p => p.team))];
        return teams.filter(team => team); // Remove empty/null teams
    }

    // Analyze team performance
    async analyzeTeamPerformance(teamName) {
        const players = await getData(DB_KEYS.PLAYERS);
        const teamPlayers = players.filter(p => p && p.team === teamName);
        const results = await getData(DB_KEYS.RESULTS);
        
        const teamResults = results.filter(result => {
            if (!result) return false;
            const homePlayer = teamPlayers.find(p => p.id === result.home_player_id);
            const awayPlayer = teamPlayers.find(p => p.id === result.away_player_id);
            return homePlayer || awayPlayer;
        });

        return this.getTeamOverview(teamResults, teamName);
    }

    getTeamOverview(results, teamName) {
        let overview = {
            totalMatches: results.length,
            wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            homePerformance: { played: 0, wins: 0 },
            awayPerformance: { played: 0, wins: 0 }
        };

        results.forEach(result => {
            const isHomeTeam = result.home_player_id && teamName === this.getPlayerTeam(result.home_player_id);
            const teamScore = isHomeTeam ? result.home_score : result.away_score;
            const opponentScore = isHomeTeam ? result.away_score : result.home_score;

            if (teamScore > opponentScore) overview.wins++;
            else if (teamScore === opponentScore) overview.draws++;
            else overview.losses++;

            overview.goalsFor += teamScore || 0;
            overview.goalsAgainst += opponentScore || 0;

            if (isHomeTeam) {
                overview.homePerformance.played++;
                if (teamScore > opponentScore) overview.homePerformance.wins++;
            } else {
                overview.awayPerformance.played++;
                if (teamScore > opponentScore) overview.awayPerformance.wins++;
            }
        });

        overview.winPercentage = overview.totalMatches > 0 ? 
            ((overview.wins / overview.totalMatches) * 100).toFixed(1) : 0;
        overview.homeWinRate = overview.homePerformance.played > 0 ? 
            ((overview.homePerformance.wins / overview.homePerformance.played) * 100).toFixed(1) : 0;
        overview.awayWinRate = overview.awayPerformance.played > 0 ? 
            ((overview.awayPerformance.wins / overview.awayPerformance.played) * 100).toFixed(1) : 0;

        return overview;
    }

    // Helper method to get player team (would need to be implemented properly)
    async getPlayerTeam(playerId) {
        const player = await getPlayerById(playerId);
        return player ? player.team : null;
    }

    generateTeamStatsHTML(teamName, stats) {
        return `
            <div class="mb-3 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <h6 class="text-warning">${teamName}</h6>
                <div class="row text-center">
                    <div class="col-4">
                        <div class="small text-muted">Win Rate</div>
                        <div class="h6 text-success">${stats.winPercentage}%</div>
                    </div>
                    <div class="col-4">
                        <div class="small text-muted">Goals</div>
                        <div class="h6 text-info">${stats.goalsFor}:${stats.goalsAgainst}</div>
                    </div>
                    <div class="col-4">
                        <div class="small text-muted">Form</div>
                        <div class="h6 text-warning">${stats.wins}-${stats.draws}-${stats.losses}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Load tournament leaders
    async loadTournamentLeaders() {
        const container = document.getElementById('tournament-leaders-container');
        if (!container) return;

        const players = await getData(DB_KEYS.PLAYERS);
        const results = await getData(DB_KEYS.RESULTS);

        // Calculate top scorers
        const topScorers = await this.getTopScorers(players, results);
        // Calculate best defense
        const bestDefense = await this.getBestDefense(players, results);
        // Calculate best form
        const bestForm = await this.getBestForm(players, results);

        container.innerHTML = `
            <div class="list-group list-group-flush bg-transparent">
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>🥇 Top Scorer</span>
                    <span class="text-warning">${topScorers[0]?.name || 'N/A'} (${topScorers[0]?.goals || 0} goals)</span>
                </div>
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>🛡️ Best Defense</span>
                    <span class="text-info">${bestDefense[0]?.name || 'N/A'} (${bestDefense[0]?.goalsConceded || 0} conceded)</span>
                </div>
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>📈 Best Form</span>
                    <span class="text-success">${bestForm[0]?.name || 'N/A'} (${bestForm[0]?.formRating || 0}/100)</span>
                </div>
                <div class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center">
                    <span>⚡ Most Wins</span>
                    <span class="text-primary">${(await this.getMostWins(players, results))[0]?.name || 'N/A'} (${(await this.getMostWins(players, results))[0]?.wins || 0} wins)</span>
                </div>
            </div>
        `;
    }

    async getTopScorers(players, results) {
        const playerGoals = players.map(player => {
            let goals = 0;
            results.forEach(result => {
                if (result.home_player_id === player.id) goals += result.home_score || 0;
                if (result.away_player_id === player.id) goals += result.away_score || 0;
            });
            return { ...player, goals };
        });

        return playerGoals.sort((a, b) => b.goals - a.goals).slice(0, 3);
    }

    async getBestDefense(players, results) {
        const playerDefense = players.map(player => {
            let goalsConceded = 0;
            results.forEach(result => {
                if (result.home_player_id === player.id) goalsConceded += result.away_score || 0;
                if (result.away_player_id === player.id) goalsConceded += result.home_score || 0;
            });
            return { ...player, goalsConceded };
        });

        return playerDefense.sort((a, b) => a.goalsConceded - b.goalsConceded).slice(0, 3);
    }

    async getBestForm(players, results) {
        const playerForms = await Promise.all(players.map(async player => {
            const stats = await this.analyzePlayerPerformance(player.id);
            return { ...player, formRating: stats.formAnalysis.formRating };
        }));

        return playerForms.sort((a, b) => b.formRating - a.formRating).slice(0, 3);
    }

    async getMostWins(players, results) {
        const playerWins = players.map(player => {
            let wins = 0;
            results.forEach(result => {
                const isHome = result.home_player_id === player.id;
                const playerScore = isHome ? result.home_score : result.away_score;
                const opponentScore = isHome ? result.away_score : result.home_score;
                if (playerScore > opponentScore) wins++;
            });
            return { ...player, wins };
        });

        return playerWins.sort((a, b) => b.wins - a.wins).slice(0, 3);
    }

    // Populate all statistics when dashboard loads
    async populatePlayerStats() {
        await this.populatePlayerSelects();
        await this.loadTeamStats();
        await this.loadTournamentLeaders();
        await this.loadAdvancedMetrics();
    }

    // Load advanced metrics
    async loadAdvancedMetrics() {
        const container = document.getElementById('advanced-metrics-container');
        if (!container) return;

        const results = await getData(DB_KEYS.RESULTS);

        // Calculate various advanced metrics
        const totalGoals = results.reduce((acc, result) => acc + (result.home_score || 0) + (result.away_score || 0), 0);
        const avgGoalsPerMatch = results.length > 0 ? (totalGoals / results.length).toFixed(2) : 0;
        const drawPercentage = results.length > 0 ? 
            ((results.filter(r => r.home_score === r.away_score).length / results.length) * 100).toFixed(1) : 0;
        const homeAdvantage = this.calculateHomeAdvantage(results);

        container.innerHTML = `
            <div class="col-md-3">
                <div class="text-center p-3">
                    <div class="h2 text-warning">${totalGoals}</div>
                    <div class="text-muted">Total Goals</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center p-3">
                    <div class="h2 text-info">${avgGoalsPerMatch}</div>
                    <div class="text-muted">Avg Goals/Match</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center p-3">
                    <div class="h2 text-success">${drawPercentage}%</div>
                    <div class="text-muted">Draw Rate</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center p-3">
                    <div class="h2 text-primary">${homeAdvantage}%</div>
                    <div class="text-muted">Home Advantage</div>
                </div>
            </div>
        `;
    }

    calculateHomeAdvantage(results) {
        if (results.length === 0) return 0;

        let homeWins = 0;
        results.forEach(result => {
            if ((result.home_score || 0) > (result.away_score || 0)) homeWins++;
        });

        return ((homeWins / results.length) * 100).toFixed(1);
    }
}

// Initialize advanced statistics
const advancedStats = new AdvancedStatistics();

// Global access
window.advancedStats = advancedStats;