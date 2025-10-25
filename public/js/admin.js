// Admin-specific functionality with Supabase
async function populatePlayerSelects() {
    const players = await getData(DB_KEYS.PLAYERS);
    console.log('Available players for selects:', players);

    const selects = [
        'homePlayerSelect',
        'awayPlayerSelect',
        'homePlayerResult',
        'awayPlayerResult'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Clear existing options
            select.innerHTML = '<option value="" selected disabled>Select player</option>';
            
            // Add player options
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.name} (${player.team} - ${player.strength})`;
                select.appendChild(option);
            });
            
            console.log(`Populated ${selectId} with ${players.length} players`);
        } else {
            console.error(`Select element with id '${selectId}' not found`);
        }
    });
}

async function updateAdminStatistics() {
    const players = await getData(DB_KEYS.PLAYERS);
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const results = await getData(DB_KEYS.RESULTS);
    
    // Update counts
    const playersCount = document.getElementById('players-count');
    const fixturesCount = document.getElementById('fixtures-count');
    const resultsCount = document.getElementById('results-count');
    const livePlayers = document.getElementById('live-players');
    const playersBadge = document.getElementById('players-badge');
    const fixturesBadge = document.getElementById('fixtures-badge');
    const resultsBadge = document.getElementById('results-badge');
    
    if (playersCount) playersCount.textContent = players.length;
    if (fixturesCount) fixturesCount.textContent = fixtures.length;
    if (resultsCount) resultsCount.textContent = results.length;
    if (livePlayers) livePlayers.textContent = players.length;
    if (playersBadge) playersBadge.textContent = players.length;
    if (fixturesBadge) fixturesBadge.textContent = fixtures.length;
    if (resultsBadge) resultsBadge.textContent = results.length;
}

async function renderAdminPlayers() {
    const players = await getData(DB_KEYS.PLAYERS);
    
    const container = document.getElementById('players-table');
    if (!container) {
        console.error('Players table container not found');
        return;
    }
    
    const tbody = container.querySelector('tbody');
    if (!tbody) {
        console.error('Players table tbody not found');
        return;
    }
    
    const playersHTML = await Promise.all(players.map(async (player) => {
        const stats = await calculatePlayerStats(player.id);
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${player.photo}" alt="${player.name}" 
                             class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;"
                             onerror="this.src='${player.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div>
                            <div class="fw-bold">${player.name}</div>
                            <small class="text-muted">Strength: ${player.strength}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge" style="background-color: ${player.teamColor || '#6c757d'}; color: white;">
                        ${player.team}
                    </span>
                </td>
                <td>${player.strength}</td>
                <td>${stats.played}</td>
                <td class="fw-bold text-warning">${stats.points}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info me-1" onclick="editPlayer(${player.id})" title="Edit Player">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editPlayerStrength(${player.id})" title="Edit Strength">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePlayerHandler(${player.id})" title="Delete Player">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }));
    
    tbody.innerHTML = playersHTML.join('');
    await updateAdminStatistics();
}

async function renderAdminFixtures() {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const players = await getData(DB_KEYS.PLAYERS);
    
    const container = document.getElementById('admin-fixtures-table');
    if (!container) {
        console.error('Fixtures table container not found');
        return;
    }
    
    const tbody = container.querySelector('tbody');
    if (!tbody) {
        console.error('Fixtures table tbody not found');
        return;
    }
    
    tbody.innerHTML = fixtures.map(fixture => {
        const homePlayer = players.find(p => p.id === fixture.home_player_id);
        const awayPlayer = players.find(p => p.id === fixture.away_player_id);
        
        if (!homePlayer || !awayPlayer) {
            console.warn('Missing player data for fixture:', fixture);
            return '';
        }
        
        const statusBadge = fixture.played ? 
            '<span class="badge bg-success status-badge"><i class="fas fa-check me-1"></i>Played</span>' : 
            '<span class="badge bg-warning status-badge"><i class="fas fa-clock me-1"></i>Upcoming</span>';
        
        const legBadge = fixture.is_home_leg ? 
            '<span class="badge bg-primary me-1">Home</span>' : 
            '<span class="badge bg-secondary me-1">Away</span>';
        
        return `
            <tr>
                <td>${formatDisplayDate(fixture.date)}</td>
                <td>${fixture.time}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div>
                            <div class="fw-bold">${homePlayer.name}</div>
                            <small class="text-muted">${homePlayer.strength}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div>
                            <div class="fw-bold">${awayPlayer.name}</div>
                            <small class="text-muted">${awayPlayer.strength}</small>
                        </div>
                    </div>
                </td>
                <td>${fixture.venue}</td>
                <td>${legBadge} ${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editFixture(${fixture.id})">
                        <i class="fas fa-edit me-1"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFixtureHandler(${fixture.id})">
                        <i class="fas fa-trash me-1"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    await updateAdminStatistics();
}

async function renderAdminResults() {
    const results = await getData(DB_KEYS.RESULTS);
    const players = await getData(DB_KEYS.PLAYERS);
    
    // Sort by date (newest first)
    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('admin-results-table');
    if (!container) {
        console.error('Results table container not found');
        return;
    }
    
    const tbody = container.querySelector('tbody');
    if (!tbody) {
        console.error('Results table tbody not found');
        return;
    }
    
    tbody.innerHTML = sortedResults.map(result => {
        const homePlayer = players.find(p => p.id === result.home_player_id);
        const awayPlayer = players.find(p => p.id === result.away_player_id);
        
        if (!homePlayer || !awayPlayer) {
            console.warn('Missing player data for result:', result);
            return '';
        }
        
        return `
            <tr>
                <td>${formatDisplayDate(result.date)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${homePlayer.photo}" alt="${homePlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${homePlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div class="fw-bold">${homePlayer.name}</div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <input type="number" class="form-control form-control-sm edit-score text-center" 
                               data-result-id="${result.id}" data-player="home" value="${result.home_score}" 
                               style="width: 60px;" min="0">
                        <span class="mx-2 fw-bold">-</span>
                        <input type="number" class="form-control form-control-sm edit-score text-center" 
                               data-result-id="${result.id}" data-player="away" value="${result.away_score}" 
                               style="width: 60px;" min="0">
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${awayPlayer.photo}" alt="${awayPlayer.name}" 
                             class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;"
                             onerror="this.src='${awayPlayer.defaultPhoto || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=?'}'">
                        <div class="fw-bold">${awayPlayer.name}</div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="updateResultHandler(${result.id})">
                        <i class="fas fa-sync me-1"></i> Update
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteResultHandler(${result.id})">
                        <i class="fas fa-trash me-1"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    await updateAdminStatistics();
}

// Enhanced Admin action handlers
async function deletePlayerHandler(id) {
    if (confirm('Are you sure you want to delete this player? This will also remove their fixtures and results.')) {
        await deletePlayer(id);
        showNotification('Player deleted successfully!', 'success');
    }
}

async function deleteFixtureHandler(id) {
    if (confirm('Are you sure you want to delete this fixture?')) {
        await deleteFixture(id);
        showNotification('Fixture deleted successfully!', 'success');
    }
}

async function deleteResultHandler(id) {
    if (confirm('Are you sure you want to delete this result?')) {
        await deleteResult(id);
        showNotification('Result deleted successfully!', 'success');
    }
}

async function updateResultHandler(id) {
    const result = (await getData(DB_KEYS.RESULTS)).find(r => r.id === id);
    if (!result) return;
    
    const homeScoreInput = document.querySelector(`.edit-score[data-result-id="${id}"][data-player="home"]`);
    const awayScoreInput = document.querySelector(`.edit-score[data-result-id="${id}"][data-player="away"]`);
    
    if (!homeScoreInput || !awayScoreInput) return;
    
    const homeScore = parseInt(homeScoreInput.value);
    const awayScore = parseInt(awayScoreInput.value);
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
        showNotification('Please enter valid scores!', 'error');
        return;
    }
    
    result.home_score = homeScore;
    result.away_score = awayScore;
    
    await updateResult(result);
    showNotification('Result updated successfully!', 'success');
}

async function editPlayer(id) {
    const player = await getPlayerById(id);
    if (!player) return;
    
    const newName = prompt('Enter new name:', player.name);
    if (newName === null) return;
    
    const newTeam = prompt('Enter new team:', player.team);
    if (newTeam === null) return;
    
    const newPhoto = prompt('Enter new photo URL (leave empty for default):', player.photo);
    
    player.name = newName;
    player.team = newTeam;
    if (newPhoto) player.photo = newPhoto;
    
    await updatePlayer(player);
    showNotification('Player updated successfully!', 'success');
}

async function editPlayerStrength(id) {
    const player = await getPlayerById(id);
    if (!player) return;
    
    const newStrength = prompt('Enter new strength rating:', player.strength);
    if (newStrength === null) return;
    
    const strengthValue = parseInt(newStrength);
    if (isNaN(strengthValue) || strengthValue < 0) {
        showNotification('Please enter a valid strength number!', 'error');
        return;
    }
    
    player.strength = strengthValue;
    
    await updatePlayer(player);
    showNotification('Player strength updated successfully!', 'success');
}

async function editFixture(id) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixture = fixtures.find(f => f.id === id);
    if (!fixture) return;
    
    const newDate = prompt('Enter new date (YYYY-MM-DD):', fixture.date);
    if (newDate === null) return;
    
    const newTime = prompt('Enter new time (HH:MM):', fixture.time);
    if (newTime === null) return;
    
    const newVenue = prompt('Enter new venue:', fixture.venue);
    if (newVenue === null) return;
    
    fixture.date = newDate;
    fixture.time = newTime;
    fixture.venue = newVenue;
    
    await updateFixture(fixture);
    showNotification('Fixture updated successfully!', 'success');
}

// Enhanced reset functions for Supabase
async function resetTournament() {
    if (confirm('⚠️ DANGER: This will reset the entire tournament in Supabase! This cannot be undone. Continue?')) {
        try {
            showNotification('Resetting tournament in Supabase...', 'info');
            
            // Delete all data from Supabase
            await supabase.from(DB_KEYS.RESULTS).delete().neq('id', 0);
            await supabase.from(DB_KEYS.FIXTURES).delete().neq('id', 0);
            await supabase.from(DB_KEYS.PLAYERS).delete().neq('id', 0);
            
            // Reinitialize with default players
            await initializeDatabase();
            
            showNotification('Tournament reset successfully!', 'success');
        } catch (error) {
            console.error('Tournament reset failed:', error);
            showNotification('Failed to reset tournament: ' + error.message, 'error');
        }
    }
}

async function resetAllResults() {
    if (confirm('This will clear all match results but keep players and fixtures. Continue?')) {
        try {
            // Clear results in Supabase
            await supabase.from(DB_KEYS.RESULTS).delete().neq('id', 0);
            
            // Mark all fixtures as unplayed
            const fixtures = await getData(DB_KEYS.FIXTURES);
            for (const fixture of fixtures) {
                if (fixture.played) {
                    fixture.played = false;
                    await updateFixture(fixture);
                }
            }
            
            showNotification('All results have been cleared!', 'success');
        } catch (error) {
            console.error('Reset results failed:', error);
            showNotification('Failed to clear results: ' + error.message, 'error');
        }
    }
}

// Event Listeners for admin
function setupAdminEventListeners() {
    console.log('Setting up admin event listeners...');

    // Admin form submissions
    const addPlayerForm = document.getElementById('add-player-form');
    if (addPlayerForm) {
        addPlayerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('playerName').value;
            const team = document.getElementById('playerTeam').value;
            const photo = document.getElementById('playerPhoto').value;
            const strength = parseInt(document.getElementById('playerStrength').value) || 2500;
            
            try {
                await addPlayer({ name, team, photo, strength });
                this.reset();
            } catch (error) {
                // Error handling is done in addPlayer function
            }
        });
    }
    
    const addFixtureForm = document.getElementById('add-fixture-form');
    if (addFixtureForm) {
        addFixtureForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const homePlayerId = parseInt(document.getElementById('homePlayerSelect').value);
            const awayPlayerId = parseInt(document.getElementById('awayPlayerSelect').value);
            const date = document.getElementById('fixtureDate').value;
            const time = document.getElementById('fixtureTime').value;
            const venue = document.getElementById('fixtureVenue').value;
            
            // Check if players are different
            if (homePlayerId === awayPlayerId) {
                showNotification('Home and away players must be different!', 'error');
                return;
            }
            
            await addFixture({ home_player_id: homePlayerId, away_player_id: awayPlayerId, date, time, venue });
            this.reset();
        });
    }
    
    const addResultForm = document.getElementById('add-result-form');
    if (addResultForm) {
        addResultForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const homePlayerId = parseInt(document.getElementById('homePlayerResult').value);
            const awayPlayerId = parseInt(document.getElementById('awayPlayerResult').value);
            const homeScore = parseInt(document.getElementById('homeScore').value);
            const awayScore = parseInt(document.getElementById('awayScore').value);
            const date = document.getElementById('matchDateResult').value;
            
            // Check if players are different
            if (homePlayerId === awayPlayerId) {
                showNotification('Home and away players must be different!', 'error');
                return;
            }
            
            // Check if players are selected
            if (!homePlayerId || !awayPlayerId) {
                showNotification('Please select both players!', 'error');
                return;
            }
            
            await addResult({ home_player_id: homePlayerId, away_player_id: awayPlayerId, home_score: homeScore, away_score: awayScore, date });
            this.reset();
        });
    }
    
    // Export data
    const exportButton = document.getElementById('export-data');
    if (exportButton) {
        exportButton.addEventListener('click', async function() {
            const players = await getData(DB_KEYS.PLAYERS);
            const fixtures = await getData(DB_KEYS.FIXTURES);
            const results = await getData(DB_KEYS.RESULTS);
            
            const data = {
                players,
                fixtures,
                results,
                exportDate: new Date().toISOString(),
                tournament: 'eFootball League 2025'
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'efootball_tournament_data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Tournament data exported successfully!', 'success');
        });
    }
    
    // Populate team options with updated teams
    const teamSelect = document.getElementById('playerTeam');
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="" selected disabled>Select team</option>' +
            BALANCED_TEAMS.map(team => 
                `<option value="${team.name}">${team.name} (Strength: ${team.strength})</option>`
            ).join('');
    }
}

// ✅ Initialize admin dashboard safely (no redirect)
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin page loaded, checking authentication...');

    // Only run this on admin pages
    if (window.location.pathname.includes('admin.html')) {

        // Prevent crash if checkAdminAuth is missing
        if (typeof checkAdminAuth !== 'function') {
            console.error('❌ checkAdminAuth is not defined. Ensure auth.js is loaded before admin.js');
            const errorContainer = document.getElementById('adminError');
            if (errorContainer) {
                errorContainer.textContent = 'Authentication system not loaded. Please refresh the page.';
            }
            return;
        }

        try {
            const isAuthenticated = await checkAdminAuth();

            if (isAuthenticated) {
                console.log('✅ Admin authenticated, initializing dashboard...');

                // Initialize Supabase or DB connection
                await initializeDatabase();

                // Load admin UI data
                setupAdminEventListeners();
                await populatePlayerSelects();
                await renderAdminPlayers();
                await renderAdminFixtures();
                await renderAdminResults();

                // Set today's date on forms
                const today = new Date().toISOString().split('T')[0];
                const fixtureDate = document.getElementById('fixtureDate');
                const matchDateResult = document.getElementById('matchDateResult');
                if (fixtureDate) fixtureDate.value = today;
                if (matchDateResult) matchDateResult.value = today;

                console.log('✅ Admin dashboard initialized successfully');
            } else {
                console.warn('⚠️ Admin not authenticated.');
                const errorContainer = document.getElementById('adminError');
                if (errorContainer) {
                    errorContainer.textContent = 'You are not authorized to access this dashboard.';
                } else {
                    alert('Unauthorized access. Please log in as admin.');
                }
        } catch (error) {
            console.error('❌ Error initializing admin dashboard:', error);
            const errorContainer = document.getElementById('adminError');
            if (errorContainer) {
                errorContainer.textContent = 'Error loading admin dashboard. Check console for details.';
            }
        }
    }
});


    // Auto-close navbar on mobile when links are clicked
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
    });
});
