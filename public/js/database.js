// ==================== Database and Data Management System with Supabase ====================

// Database table keys
const DB_KEYS = {
    PLAYERS: 'players',
    FIXTURES: 'fixtures',
    RESULTS: 'results',
    TOURNAMENT_UPDATES: 'tournament_updates'
};

// Default balanced teams configuration
const BALANCED_TEAMS = [
    { name: 'Kenya', strength: 85, color: '#000000' },
    { name: 'Chelsea', strength: 88, color: '#034694' },
    { name: 'Liverpool', strength: 87, color: '#c8102e' },
    { name: 'Everton', strength: 78, color: '#003399' },
    { name: 'Manchester United', strength: 85, color: '#da291c' },
    { name: 'West Ham', strength: 79, color: '#7c2c3b' },
    { name: 'Arsenal', strength: 86, color: '#ef0107' },
    { name: 'Manchester City', strength: 89, color: '#6caddf' },
    { name: 'Tottenham', strength: 84, color: '#132257' },
    { name: 'Newcastle', strength: 82, color: '#241f20' }
];

// Default players data
const DEFAULT_PLAYERS = [
    { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138, 
        team_color: '#000000', 
        default_photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg'
    },
    { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100, 
        team_color: '#034694', 
        default_photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg'
    },
    { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042, 
        team_color: '#034694', 
        default_photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg'
    },
    { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700, 
        team_color: '#c8102e', 
        default_photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg'
    },
    { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792, 
        team_color: '#003399', 
        default_photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg'
    },
    { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448, 
        team_color: '#da291c', 
        default_photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg'
    },
    { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110, 
        team_color: '#7c2c3b', 
        default_photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg'
    },
    { 
        id: 8,
        name: 'Bora kesho',
        team: 'Man U',
        photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg',
        strength: 3177,
        team_color: '#DA291C',
        default_photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg'
    }
];

// ==================== Supabase Client Initialization ====================
if (!window.supabase) {
    console.error('Supabase JS SDK not found! Please include it in your HTML before this script.');
}

const SUPABASE_URL = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'; // Replace with your Supabase anon key


if (!supabase) {
    console.error('Supabase client failed to initialize');
} else {
    // ✅ Make globally accessible
    window.supabase = supabase;
}

// ==================== Core Database Functions ====================

// Get data from Supabase
async function getData(tableName) {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            console.error(`Error getting ${tableName}:`, error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error(`Error in getData for ${tableName}:`, err);
        return [];
    }
}

// Save data to Supabase
async function saveData(tableName, data) {
    if (!supabase) return [];
    try {
        if (Array.isArray(data) && data.length > 0) {
            const { data: result, error } = await supabase.from(tableName).insert(data).select();
            if (error) throw error;
            return result;
        } else {
            const { data: result, error } = await supabase.from(tableName).upsert(data).select();
            if (error) throw error;
            return result;
        }
    } catch (error) {
        console.error(`Error saving to ${tableName}:`, error);
        throw error;
    }
}

// Initialize database with default players
async function initializeDatabase() {
    console.log('⚙️ Initializing Supabase database...');
    if (!supabase) return;

    try {
        const existingPlayers = await getData(DB_KEYS.PLAYERS);

        if (!existingPlayers || existingPlayers.length === 0) {
            console.log('Setting up default players in Supabase...');
            const insertedPlayers = await saveData(DB_KEYS.PLAYERS, DEFAULT_PLAYERS);
            console.log(`✅ Default players inserted: ${insertedPlayers.length}`);
            await generateSampleFixtures();
        } else {
            console.log(`✅ Database already initialized with ${existingPlayers.length} players`);
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// ==================== Player Management ====================
async function addPlayer(playerData) {
    const players = await getData(DB_KEYS.PLAYERS);
    const isDuplicate = players.some(p => p.name.toLowerCase() === playerData.name.toLowerCase() && p.team.toLowerCase() === playerData.team.toLowerCase());
    if (isDuplicate) throw new Error(`Player "${playerData.name}" already exists in team ${playerData.team}`);

    const maxId = players.length > 0 ? Math.max(...players.map(p => p.id || 0)) : 0;
    const newPlayer = {
        ...playerData,
        id: maxId + 1,
        photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
        default_photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const inserted = await saveData(DB_KEYS.PLAYERS, [newPlayer]);
    console.log('Player added:', newPlayer.name);
    await refreshAllDisplays();
    return inserted[0];
}

async function updatePlayer(player) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from(DB_KEYS.PLAYERS).update({ ...player, updated_at: new Date().toISOString() }).eq('id', player.id).select();
        if (error) throw error;
        await refreshAllDisplays();
        return data[0];
    } catch (err) {
        console.error('Error updating player:', err);
        throw err;
    }
}

async function deletePlayer(playerId) {
    if (!supabase) return false;
    try {
        await supabase.from(DB_KEYS.PLAYERS).delete().eq('id', playerId);
        await supabase.from(DB_KEYS.FIXTURES).delete().or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
        await supabase.from(DB_KEYS.RESULTS).delete().or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
        await refreshAllDisplays();
        return true;
    } catch (err) {
        console.error('Error deleting player:', err);
        throw err;
    }
}

// ==================== Fixture Management ====================
async function generateSampleFixtures() {
    const players = await getData(DB_KEYS.PLAYERS);
    if (!players || players.length < 2) return;

    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    const matchPairs = [];

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            matchPairs.push([players[i], players[j]]);
        }
    }

    matchPairs.forEach(([p1, p2], idx) => {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + idx * 2);

        fixtures.push({
            id: fixtureId++,
            home_player_id: p1.id,
            away_player_id: p2.id,
            date: matchDate.toISOString().split('T')[0],
            time: '15:00',
            venue: 'Virtual Stadium ' + String.fromCharCode(65 + (idx % 3)),
            played: false,
            is_home_leg: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    });

    await saveData(DB_KEYS.FIXTURES, fixtures);
    console.log('✅ Generated', fixtures.length, 'fixtures');
}

async function addFixture(fixture) {
    return await saveData(DB_KEYS.FIXTURES, [fixture]);
}

async function updateFixture(fixture) {
    if (!supabase) return null;
    const { data, error } = await supabase.from(DB_KEYS.FIXTURES).update({ ...fixture, updated_at: new Date().toISOString() }).eq('id', fixture.id).select();
    if (error) throw error;
    await refreshAllDisplays();
    return data[0];
}

async function deleteFixture(fixtureId) {
    if (!supabase) return false;
    const { error } = await supabase.from(DB_KEYS.FIXTURES).delete().eq('id', fixtureId);
    if (error) throw error;
    await refreshAllDisplays();
    return true;
}

// ==================== Result Management ====================
async function addResult(result) {
    const inserted = await saveData(DB_KEYS.RESULTS, [result]);
    // Mark corresponding fixture as played
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixture = fixtures.find(f => f.home_player_id === result.home_player_id && f.away_player_id === result.away_player_id);
    if (fixture) await updateFixture({ ...fixture, played: true });
    await refreshAllDisplays();
    return inserted[0];
}

async function updateResult(result) {
    if (!supabase) return null;
    const { data, error } = await supabase.from(DB_KEYS.RESULTS).update({ ...result, updated_at: new Date().toISOString() }).eq('id', result.id).select();
    if (error) throw error;
    await refreshAllDisplays();
    return data[0];
}

async function deleteResult(resultId) {
    if (!supabase) return false;
    const { error } = await supabase.from(DB_KEYS.RESULTS).delete().eq('id', resultId);
    if (error) throw error;
    await refreshAllDisplays();
    return true;
}

// ==================== Helper Functions ====================
async function getPlayerById(playerId) {
    const players = await getData(DB_KEYS.PLAYERS);
    return players.find(p => p.id === playerId);
}

async function getFixtureById(fixtureId) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    return fixtures.find(f => f.id === fixtureId);
}

async function getResultById(resultId) {
    const results = await getData(DB_KEYS.RESULTS);
    return results.find(r => r.id === resultId);
}

function getDefaultStats() {
    return { 
        played: 0, 
        wins: 0, 
        draws: 0, 
        losses: 0, 
        goalsFor: 0, 
        goalsAgainst: 0, 
        goalDifference: 0, 
        points: 0 
    };
}

// ==================== Statistics & League Table ====================
async function calculatePlayerStats(playerId) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        
        if (!Array.isArray(results)) {
            console.error('Results data is not an array:', results);
            return getDefaultStats();
        }

        const playerResults = results.filter(r => r && (r.home_player_id === playerId || r.away_player_id === playerId));

        let stats = getDefaultStats();
        
        playerResults.forEach(result => {
            if (!result) return;
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            stats.played++;
            stats.goalsFor += playerScore;
            stats.goalsAgainst += opponentScore;

            if (playerScore > opponentScore) {
                stats.wins++;
                stats.points += 3;
            } else if (playerScore === opponentScore) {
                stats.draws++;
                stats.points += 1;
            } else {
                stats.losses++;
            }
        });

        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        return stats;
    } catch (error) {
        console.error('Error calculating player stats:', error);
        return getDefaultStats();
    }
}

async function getRecentForm(playerId, matches = 5) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        
        if (!Array.isArray(results)) {
            console.error('Results data is not an array in getRecentForm:', results);
            return [];
        }

        const playerResults = results
            .filter(r => r && (r.home_player_id === playerId || r.away_player_id === playerId))
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, matches);

        return playerResults.map(result => {
            if (!result) return 'N';
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        }).reverse();
    } catch (error) {
        console.error('Error getting recent form:', error);
        return [];
    }
}

async function getLeagueTable() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        
        // Ensure players is an array
        if (!Array.isArray(players)) {
            console.error('Players data is not an array:', players);
            return [];
        }

        // Check if we have players
        if (players.length === 0) {
            console.log('No players found for league table');
            return [];
        }

        const tableData = await Promise.all(players.map(async p => {
            const stats = await calculatePlayerStats(p.id);
            const form = await getRecentForm(p.id);
            return { ...p, ...stats, form };
        }));
        
        return tableData.sort((a, b) => 
            b.points - a.points || 
            b.goalDifference - a.goalDifference || 
            b.goalsFor - a.goalsFor
        );
    } catch (error) {
        console.error('Error generating league table:', error);
        return [];
    }
}

// ==================== Refresh UI & Subscriptions ====================
async function refreshAllDisplays() {
    if (typeof renderLeagueTable === 'function') await renderLeagueTable();
    if (typeof renderPlayers === 'function') await renderPlayers();
    if (typeof renderHomePage === 'function') await renderHomePage();
    if (typeof renderFixtures === 'function') await renderFixtures();
    if (typeof renderResults === 'function') await renderResults();
    if (typeof renderAdminPlayers === 'function') await renderAdminPlayers();
    if (typeof renderAdminFixtures === 'function') await renderAdminFixtures();
    if (typeof renderAdminResults === 'function') await renderAdminResults();
    if (typeof populatePlayerSelects === 'function') await populatePlayerSelects();
}

// Subscribe to database changes
function subscribeToChanges(callback) {
    if (!supabase) return null;
    return supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
            console.log('DB change detected', payload);
            if (callback) callback(payload);
            refreshAllDisplays();
        }).subscribe();
}

// ==================== Utilities ====================
function formatDisplayDate(dateString) {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `top:20px; right:20px; z-index:1060; min-width:300px; max-width:400px;`;
    notification.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 5000);
}

// ==================== Global Access ====================
window.supabase = supabase;
window.getData = getData;
window.saveData = saveData;
window.addPlayer = addPlayer;
window.updatePlayer = updatePlayer;
window.deletePlayer = deletePlayer;
window.addFixture = addFixture;
window.updateFixture = updateFixture;
window.deleteFixture = deleteFixture;
window.addResult = addResult;
window.updateResult = updateResult;
window.deleteResult = deleteResult;
window.getPlayerById = getPlayerById;
window.getFixtureById = getFixtureById;
window.getResultById = getResultById;
window.calculatePlayerStats = calculatePlayerStats;
window.getRecentForm = getRecentForm;
window.getLeagueTable = getLeagueTable;
window.refreshAllDisplays = refreshAllDisplays;
window.formatDisplayDate = formatDisplayDate;
window.showNotification = showNotification;
window.DB_KEYS = DB_KEYS;
window.BALANCED_TEAMS = BALANCED_TEAMS;
window.DEFAULT_PLAYERS = DEFAULT_PLAYERS;
window.initializeDatabase = initializeDatabase;

// ==================== Initialize Database on DOM Loaded ====================
document.addEventListener('DOMContentLoaded', async function() {
    if (!supabase) return;
    await initializeDatabase();
    subscribeToChanges(payload => console.log('DB change detected', payload));
    console.log('✅ Supabase database system initialized');
});
