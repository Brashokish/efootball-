// Bulk Operations System
class BulkOperations {
    constructor() {
        this.operationsQueue = [];
        this.isProcessing = false;
        this.init();
    }

    init() {
        console.log('Bulk Operations initialized');
        this.setupAdminEventListeners();
    }

    setupAdminEventListeners() {
        // Wait for admin page to load
        if (window.location.pathname.includes('admin.html')) {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupBulkOperationForms();
            });
        }
    }

    setupBulkOperationForms() {
        // Bulk fixture creation form
        const bulkFixtureForm = document.getElementById('bulk-fixture-form');
        if (bulkFixtureForm) {
            bulkFixtureForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBulkFixtureCreation();
            });
        }

        // Mass player updates form
        const bulkPlayerForm = document.getElementById('bulk-player-form');
        if (bulkPlayerForm) {
            bulkPlayerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMassPlayerUpdates();
            });
        }

        // Batch result entry form
        const bulkResultForm = document.getElementById('bulk-result-form');
        if (bulkResultForm) {
            bulkResultForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBatchResultEntry();
            });
        }

        // CSV export buttons
        const exportPlayersBtn = document.getElementById('export-players-csv');
        const exportFixturesBtn = document.getElementById('export-fixtures-csv');
        const exportResultsBtn = document.getElementById('export-results-csv');

        if (exportPlayersBtn) {
            exportPlayersBtn.addEventListener('click', () => this.exportToCSV('players'));
        }
        if (exportFixturesBtn) {
            exportFixturesBtn.addEventListener('click', () => this.exportToCSV('fixtures'));
        }
        if (exportResultsBtn) {
            exportResultsBtn.addEventListener('click', () => this.exportToCSV('results'));
        }

        // CSV import handlers
        const importPlayersFile = document.getElementById('import-players-file');
        const importFixturesFile = document.getElementById('import-fixtures-file');
        const importResultsFile = document.getElementById('import-results-file');

        if (importPlayersFile) {
            importPlayersFile.addEventListener('change', (e) => this.importFromCSV(e.target.files[0], 'players'));
        }
        if (importFixturesFile) {
            importFixturesFile.addEventListener('change', (e) => this.importFromCSV(e.target.files[0], 'fixtures'));
        }
        if (importResultsFile) {
            importResultsFile.addEventListener('change', (e) => this.importFromCSV(e.target.files[0], 'results'));
        }
    }

    // Bulk Fixture Creation
    async handleBulkFixtureCreation() {
        const fixtureDataText = document.getElementById('bulk-fixture-data').value;
        if (!fixtureDataText.trim()) {
            showNotification('Please enter fixture data!', 'error');
            return;
        }

        try {
            const fixturesData = this.parseFixtureData(fixtureDataText);
            if (fixturesData.length === 0) {
                showNotification('No valid fixture data found!', 'error');
                return;
            }

            const results = await this.bulkCreateFixtures(fixturesData);
            this.showBulkOperationResults(results, 'fixtures');
            
        } catch (error) {
            showNotification('Error parsing fixture data: ' + error.message, 'error');
        }
    }

    parseFixtureData(text) {
        const lines = text.trim().split('\n');
        const fixturesData = [];

        lines.forEach((line, index) => {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 6) {
                fixturesData.push({
                    homePlayerId: parseInt(parts[0]),
                    awayPlayerId: parseInt(parts[1]),
                    date: parts[2],
                    time: parts[3],
                    venue: parts[4],
                    isHomeLeg: parts[5] === 'true'
                });
            }
        });

        return fixturesData;
    }

    async bulkCreateFixtures(fixturesData) {
        const results = {
            successful: [],
            failed: [],
            total: fixturesData.length
        };

        showNotification(`Creating ${fixturesData.length} fixtures...`, 'info');

        // Create progress UI
        this.showProgressModal('Creating Fixtures', results.total);

        for (let i = 0; i < fixturesData.length; i++) {
            const fixtureData = fixturesData[i];
            
            try {
                // Validate fixture data
                const validation = this.validateFixtureData(fixtureData);
                if (!validation.isValid) {
                    results.failed.push({
                        data: fixtureData,
                        error: validation.error
                    });
                    continue;
                }

                // Create fixture
                const newFixture = await addFixture({
                    homePlayerId: fixtureData.homePlayerId,
                    awayPlayerId: fixtureData.awayPlayerId,
                    date: fixtureData.date,
                    time: fixtureData.time,
                    venue: fixtureData.venue,
                    played: false,
                    isHomeLeg: fixtureData.isHomeLeg !== undefined ? fixtureData.isHomeLeg : true
                });

                results.successful.push(newFixture);
                
            } catch (error) {
                results.failed.push({
                    data: fixtureData,
                    error: error.message
                });
            }

            // Update progress
            this.updateProgressModal(i + 1, results.total);
        }

        this.hideProgressModal();
        return results;
    }

    validateFixtureData(fixtureData) {
        const players = getData(DB_KEYS.PLAYERS);
        
        // Check if home player exists
        const homePlayer = players.find(p => p.id === fixtureData.homePlayerId);
        if (!homePlayer) {
            return { isValid: false, error: 'Home player not found' };
        }

        // Check if away player exists
        const awayPlayer = players.find(p => p.id === fixtureData.awayPlayerId);
        if (!awayPlayer) {
            return { isValid: false, error: 'Away player not found' };
        }

        // Check if players are different
        if (fixtureData.homePlayerId === fixtureData.awayPlayerId) {
            return { isValid: false, error: 'Home and away players must be different' };
        }

        // Validate date
        if (!fixtureData.date || isNaN(new Date(fixtureData.date).getTime())) {
            return { isValid: false, error: 'Invalid date' };
        }

        // Validate time
        if (!fixtureData.time || !fixtureData.time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            return { isValid: false, error: 'Invalid time format (HH:MM)' };
        }

        return { isValid: true };
    }

    // Mass Player Updates
    async handleMassPlayerUpdates() {
        const updatesDataText = document.getElementById('bulk-player-data').value;
        if (!updatesDataText.trim()) {
            showNotification('Please enter player update data!', 'error');
            return;
        }

        try {
            const updatesData = this.parsePlayerUpdateData(updatesDataText);
            if (updatesData.length === 0) {
                showNotification('No valid player update data found!', 'error');
                return;
            }

            const results = await this.bulkUpdatePlayers(updatesData);
            this.showBulkOperationResults(results, 'players');
            
        } catch (error) {
            showNotification('Error parsing player data: ' + error.message, 'error');
        }
    }

    parsePlayerUpdateData(text) {
        const lines = text.trim().split('\n');
        const updatesData = [];

        lines.forEach((line, index) => {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 3) {
                const update = {
                    playerId: parseInt(parts[0]),
                    updates: {}
                };

                // Parse field-value pairs
                for (let i = 1; i < parts.length; i += 2) {
                    if (parts[i] && parts[i + 1]) {
                        update.updates[parts[i]] = parts[i + 1];
                    }
                }

                updatesData.push(update);
            }
        });

        return updatesData;
    }

    async bulkUpdatePlayers(updatesData) {
        const results = {
            successful: [],
            failed: [],
            total: updatesData.length
        };

        showNotification(`Updating ${updatesData.length} players...`, 'info');
        this.showProgressModal('Updating Players', results.total);

        for (let i = 0; i < updatesData.length; i++) {
            const updateData = updatesData[i];
            
            try {
                const player = getPlayerById(updateData.playerId);
                if (!player) {
                    results.failed.push({
                        data: updateData,
                        error: 'Player not found'
                    });
                    continue;
                }

                // Apply updates
                const updatedPlayer = {
                    ...player,
                    ...updateData.updates
                };

                // Convert numeric fields
                if (updateData.updates.strength) {
                    updatedPlayer.strength = parseInt(updateData.updates.strength);
                }

                await updatePlayer(updatedPlayer);
                results.successful.push(updatedPlayer);
                
            } catch (error) {
                results.failed.push({
                    data: updateData,
                    error: error.message
                });
            }

            this.updateProgressModal(i + 1, results.total);
        }

        this.hideProgressModal();
        return results;
    }

    // Batch Result Entry
    async handleBatchResultEntry() {
        const resultsDataText = document.getElementById('bulk-result-data').value;
        if (!resultsDataText.trim()) {
            showNotification('Please enter result data!', 'error');
            return;
        }

        try {
            const resultsData = this.parseResultData(resultsDataText);
            if (resultsData.length === 0) {
                showNotification('No valid result data found!', 'error');
                return;
            }

            const processedResults = await this.bulkAddResults(resultsData);
            this.showBulkOperationResults(processedResults, 'results');
            
        } catch (error) {
            showNotification('Error parsing result data: ' + error.message, 'error');
        }
    }

    parseResultData(text) {
        const lines = text.trim().split('\n');
        const resultsData = [];

        lines.forEach((line, index) => {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 5) {
                resultsData.push({
                    homePlayerId: parseInt(parts[0]),
                    awayPlayerId: parseInt(parts[1]),
                    homeScore: parseInt(parts[2]),
                    awayScore: parseInt(parts[3]),
                    date: parts[4]
                });
            }
        });

        return resultsData;
    }

    async bulkAddResults(resultsData) {
        const processedResults = {
            successful: [],
            failed: [],
            total: resultsData.length
        };

        showNotification(`Processing ${resultsData.length} results...`, 'info');
        this.showProgressModal('Adding Results', processedResults.total);

        for (let i = 0; i < resultsData.length; i++) {
            const resultData = resultsData[i];
            
            try {
                // Validate result data
                const validation = this.validateResultData(resultData);
                if (!validation.isValid) {
                    processedResults.failed.push({
                        data: resultData,
                        error: validation.error
                    });
                    continue;
                }

                // Add result
                const newResult = await addResult({
                    homePlayerId: resultData.homePlayerId,
                    awayPlayerId: resultData.awayPlayerId,
                    homeScore: resultData.homeScore,
                    awayScore: resultData.awayScore,
                    date: resultData.date
                });

                processedResults.successful.push(newResult);
                
            } catch (error) {
                processedResults.failed.push({
                    data: resultData,
                    error: error.message
                });
            }

            this.updateProgressModal(i + 1, processedResults.total);
        }

        this.hideProgressModal();
        return processedResults;
    }

    validateResultData(resultData) {
        const players = getData(DB_KEYS.PLAYERS);
        
        // Check if home player exists
        const homePlayer = players.find(p => p.id === resultData.homePlayerId);
        if (!homePlayer) {
            return { isValid: false, error: 'Home player not found' };
        }

        // Check if away player exists
        const awayPlayer = players.find(p => p.id === resultData.awayPlayerId);
        if (!awayPlayer) {
            return { isValid: false, error: 'Away player not found' };
        }

        // Check if players are different
        if (resultData.homePlayerId === resultData.awayPlayerId) {
            return { isValid: false, error: 'Home and away players must be different' };
        }

        // Validate scores
        if (isNaN(resultData.homeScore) || resultData.homeScore < 0) {
            return { isValid: false, error: 'Invalid home score' };
        }

        if (isNaN(resultData.awayScore) || resultData.awayScore < 0) {
            return { isValid: false, error: 'Invalid away score' };
        }

        // Validate date
        if (!resultData.date || isNaN(new Date(resultData.date).getTime())) {
            return { isValid: false, error: 'Invalid date' };
        }

        return { isValid: true };
    }

    // CSV Export
    exportToCSV(dataType) {
        const data = getData(DB_KEYS[dataType.toUpperCase()]);
        if (!data || data.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Handle values that might contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        this.downloadCSV(csvContent, `efootball_${dataType}_${new Date().toISOString().split('T')[0]}.csv`);
        showNotification(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data exported successfully!`, 'success');
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // CSV Import
    importFromCSV(csvFile, dataType) {
        if (!csvFile) {
            showNotification('Please select a file to import!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = this.parseCSV(e.target.result);
                
                if (confirm(`This will import ${data.length} ${dataType}. Continue?`)) {
                    this.processCSVImport(data, dataType);
                }
            } catch (error) {
                showNotification('Invalid CSV file!', 'error');
            }
        };
        reader.readAsText(csvFile);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    let value = values[index].replace(/^"|"$/g, '');
                    // Convert numeric values
                    if (!isNaN(value) && value !== '') {
                        value = Number(value);
                    }
                    // Convert boolean values
                    if (value === 'true') value = true;
                    if (value === 'false') value = false;
                    record[header] = value;
                });
                data.push(record);
            }
        }

        return data;
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
        return values;
    }

    async processCSVImport(data, dataType) {
        const results = {
            successful: [],
            failed: [],
            total: data.length
        };

        showNotification(`Importing ${data.length} ${dataType}...`, 'info');
        this.showProgressModal(`Importing ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`, results.total);

        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            
            try {
                switch (dataType) {
                    case 'players':
                        await this.importPlayer(record, results);
                        break;
                    case 'fixtures':
                        await this.importFixture(record, results);
                        break;
                    case 'results':
                        await this.importResult(record, results);
                        break;
                }
            } catch (error) {
                results.failed.push({
                    data: record,
                    error: error.message
                });
            }

            this.updateProgressModal(i + 1, results.total);
        }

        this.hideProgressModal();
        this.showBulkOperationResults(results, dataType);

        // Refresh displays
        if (typeof renderAdminPlayers === 'function') renderAdminPlayers();
        if (typeof renderAdminFixtures === 'function') renderAdminFixtures();
        if (typeof renderAdminResults === 'function') renderAdminResults();
        if (typeof populatePlayerSelects === 'function') populatePlayerSelects();
    }

    async importPlayer(record, results) {
        // Check if player already exists
        const existingPlayers = getData(DB_KEYS.PLAYERS);
        const existingPlayer = existingPlayers.find(p => p.id === record.id);

        if (existingPlayer) {
            // Update existing player
            await updatePlayer(record);
            results.successful.push(record);
        } else {
            // Add new player
            const newPlayer = await addPlayer(record);
            results.successful.push(newPlayer);
        }
    }

    async importFixture(record, results) {
        // Check if fixture already exists
        const existingFixtures = getData(DB_KEYS.FIXTURES);
        const existingFixture = existingFixtures.find(f => f.id === record.id);

        if (existingFixture) {
            // Update existing fixture
            await updateFixture(record);
            results.successful.push(record);
        } else {
            // Add new fixture
            const newFixture = await addFixture(record);
            results.successful.push(newFixture);
        }
    }

    async importResult(record, results) {
        // Check if result already exists
        const existingResults = getData(DB_KEYS.RESULTS);
        const existingResult = existingResults.find(r => r.id === record.id);

        if (existingResult) {
            // Update existing result
            await updateResult(record);
            results.successful.push(record);
        } else {
            // Add new result
            const newResult = await addResult(record);
            results.successful.push(newResult);
        }
    }

    // Progress Modal
    showProgressModal(title, total) {
        let modal = document.getElementById('bulk-operation-progress');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bulk-operation-progress';
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header bg-primary">
                            <h5 class="modal-title">${title}</h5>
                        </div>
                        <div class="modal-body">
                            <div class="progress mb-3">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     role="progressbar" style="width: 0%"></div>
                            </div>
                            <div class="text-center">
                                <span class="progress-text">Processing 0 of ${total}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    updateProgressModal(current, total) {
        const modal = document.getElementById('bulk-operation-progress');
        if (!modal) return;

        const progressBar = modal.querySelector('.progress-bar');
        const progressText = modal.querySelector('.progress-text');

        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `Processing ${current} of ${total}`;
    }

    hideProgressModal() {
        const modal = document.getElementById('bulk-operation-progress');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
    }

    // Show bulk operation results
    showBulkOperationResults(results, operationType) {
        const successCount = results.successful.length;
        const failCount = results.failed.length;
        const total = results.total;

        let message = `
            <strong>${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Complete</strong><br>
            ✅ Successful: ${successCount}<br>
            ❌ Failed: ${failCount}<br>
            📊 Total: ${total}
        `;

        if (failCount > 0) {
            message += `<br><br><strong>Failed Items:</strong><br>`;
            results.failed.slice(0, 5).forEach((fail, index) => {
                message += `${index + 1}. ${fail.error}<br>`;
            });
            if (failCount > 5) {
                message += `... and ${failCount - 5} more`;
            }
        }

        // Create results modal
        this.showResultsModal('Bulk Operation Results', message);

        showNotification(
            `${operationType} bulk operation completed: ${successCount} successful, ${failCount} failed`,
            failCount === 0 ? 'success' : 'warning'
        );
    }

    showResultsModal(title, content) {
        const modalId = 'bulk-operation-results';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header bg-primary">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('.modal-body').innerHTML = content;
        }

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    // Template Generators
    generateFixtureTemplate() {
        const players = getData(DB_KEYS.PLAYERS);
        const template = [
            ['homePlayerId', 'homePlayerName', 'awayPlayerId', 'awayPlayerName', 'date', 'time', 'venue', 'isHomeLeg'],
            ...players.flatMap(homePlayer => 
                players.filter(awayPlayer => awayPlayer.id !== homePlayer.id)
                    .map(awayPlayer => [
                        homePlayer.id,
                        homePlayer.name,
                        awayPlayer.id,
                        awayPlayer.name,
                        '2024-02-15',
                        '15:00',
                        'Virtual Stadium A',
                        'true'
                    ])
            )
        ];

        const csvContent = template.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        this.downloadCSV(csvContent, 'fixture_template.csv');
        showNotification('Fixture template downloaded!', 'success');
    }

    generatePlayerTemplate() {
        const template = [
            ['id', 'name', 'team', 'strength', 'photo', 'teamColor'],
            ['1', 'Player One', 'Team A', '3000', 'https://example.com/photo1.jpg', '#000000'],
            ['2', 'Player Two', 'Team B', '2950', 'https://example.com/photo2.jpg', '#FFFFFF']
        ];

        const csvContent = template.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        this.downloadCSV(csvContent, 'player_template.csv');
        showNotification('Player template downloaded!', 'success');
    }

    generateResultTemplate() {
        const players = getData(DB_KEYS.PLAYERS);
        const template = [
            ['homePlayerId', 'homePlayerName', 'awayPlayerId', 'awayPlayerName', 'homeScore', 'awayScore', 'date'],
            ...players.slice(0, 2).map((homePlayer, index) => {
                const awayPlayer = players[index + 1] || players[0];
                return [
                    homePlayer.id,
                    homePlayer.name,
                    awayPlayer.id,
                    awayPlayer.name,
                    '2',
                    '1',
                    '2024-02-15'
                ];
            })
        ];

        const csvContent = template.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        this.downloadCSV(csvContent, 'result_template.csv');
        showNotification('Result template downloaded!', 'success');
    }
}

// Initialize bulk operations
const bulkOperations = new BulkOperations();

// Global access
window.bulkOperations = bulkOperations;
