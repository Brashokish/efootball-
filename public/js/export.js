// Image Export functionality using html2canvas
class ImageExporter {
    constructor() {
        this.isGenerating = false;
        this.html2canvasLoaded = false;
        this.init();
    }

    init() {
        // Load html2canvas library dynamically
        this.loadHtml2Canvas();

        // Add export buttons to UI
        this.addExportButtons();
    }

    async loadHtml2Canvas() {
        return new Promise((resolve) => {
            if (typeof html2canvas !== 'undefined') {
                this.html2canvasLoaded = true;
                console.log('✅ html2canvas already loaded');
                resolve(true);
                return;
            }

            // Check if script is already loading
            if (document.querySelector('script[src*="html2canvas"]')) {
                const checkInterval = setInterval(() => {
                    if (typeof html2canvas !== 'undefined') {
                        this.html2canvasLoaded = true;
                        clearInterval(checkInterval);
                        console.log('✅ html2canvas loaded from existing script');
                        resolve(true);
                    }
                }, 100);
                return;
            }

            const script = document.createElement('script');
            // ✅ Updated CDN link + correct integrity hash
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.integrity = 'sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';

            script.onload = () => {
                console.log('✅ html2canvas loaded successfully');
                this.html2canvasLoaded = true;
                resolve(true);
            };

            script.onerror = () => {
                console.error('❌ Failed to load html2canvas');
                this.html2canvasLoaded = false;
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    addExportButtons() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addButtons());
        } else {
            this.addButtons();
        }
    }

    addButtons() {
        // Add export buttons to league table
        this.addLeagueTableExport();

        // Add export buttons to fixtures
        this.addFixturesExport();
    }

    addLeagueTableExport() {
        const leagueTableHeader = document.querySelector('#table .card-header');
        if (leagueTableHeader && !document.getElementById('export-league-btn')) {
            const exportBtn = document.createElement('button');
            exportBtn.id = 'export-league-btn';
            exportBtn.className = 'btn btn-sm btn-outline-info ms-2';
            exportBtn.innerHTML = '<i class="fas fa-image me-1"></i> Export Image';
            exportBtn.onclick = () => this.exportLeagueTable();
            leagueTableHeader.appendChild(exportBtn);
        }
    }

    addFixturesExport() {
        const fixturesHeader = document.querySelector('#fixtures .card-header');
        if (fixturesHeader && !document.getElementById('export-fixtures-btn')) {
            const exportBtn = document.createElement('button');
            exportBtn.id = 'export-fixtures-btn';
            exportBtn.className = 'btn btn-sm btn-outline-info ms-2';
            exportBtn.innerHTML = '<i class="fas fa-image me-1"></i> Export Image';
            exportBtn.onclick = () => this.exportMatchDayFixtures();
            fixturesHeader.appendChild(exportBtn);
        }
    }

    // Check if export is ready
    async isReady() {
        if (!this.html2canvasLoaded) {
            const loaded = await this.loadHtml2Canvas();
            if (!loaded) {
                showNotification('Export library failed to load. Please refresh the page.', 'error');
                return false;
            }
        }
        if (this.isGenerating) {
            showNotification('Please wait for current export to complete', 'warning');
            return false;
        }
        return true;
    }

    // Export league table as image
    async exportLeagueTable() {
        if (!(await this.isReady())) return;

        const tableElement = document.getElementById('league-table');
        if (!tableElement) {
            showNotification('League table not found!', 'error');
            return;
        }

        this.isGenerating = true;

        try {
            showNotification('🔄 Generating league table image...', 'info');

            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                max-width: 800px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;

            const header = document.createElement('div');
            header.innerHTML = `
                <div style="text-align: center; margin-bottom: 25px; color: white;">
                    <h1 style="margin: 0 0 10px 0; color: #ffd700; font-size: 2.2em; font-weight: bold;">
                        eFootball League 2025
                    </h1>
                    <p style="margin: 0 0 5px 0; font-size: 1.3em; opacity: 0.9;">League Standings</p>
                    <p style="margin: 0; font-size: 1em; opacity: 0.7;">
                        Generated on ${new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
            `;

            const clonedTable = tableElement.cloneNode(true);
            this.styleTableForExport(clonedTable);

            tempContainer.appendChild(header);
            tempContainer.appendChild(clonedTable);
            document.body.appendChild(tempContainer);

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(tempContainer, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: tempContainer.scrollWidth,
                height: tempContainer.scrollHeight
            });

            document.body.removeChild(tempContainer);

            const image = canvas.toDataURL('image/png', 1.0);
            const filename = `EFL_League_Table_${new Date().toISOString().split('T')[0]}.png`;

            this.downloadImage(image, filename);
            showNotification('✅ League table exported successfully!', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            showNotification('❌ Failed to export league table: ' + error.message, 'error');
        } finally {
            this.isGenerating = false;
        }
    }

    // Export match day fixtures as image
    async exportMatchDayFixtures() {
        if (!(await this.isReady())) return;

        try {
            // Use await to get the actual data from getData()
            const fixtures = await getData(DB_KEYS.FIXTURES);
            const players = await getData(DB_KEYS.PLAYERS);

            // Validate that we got arrays
            if (!Array.isArray(fixtures)) {
                console.error('Fixtures data is not an array:', fixtures);
                showNotification('Error: Fixtures data is not available', 'error');
                return;
            }

            if (!Array.isArray(players)) {
                console.error('Players data is not an array:', players);
                showNotification('Error: Players data is not available', 'error');
                return;
            }

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const upcomingFixtures = fixtures.filter(f => {
                if (!f) return false;
                const fixtureDate = new Date(f.date);
                return !f.played && fixtureDate <= nextWeek;
            }).slice(0, 6);

            if (upcomingFixtures.length === 0) {
                showNotification('No upcoming fixtures found for the next 7 days!', 'warning');
                return;
            }

            this.isGenerating = true;
            showNotification('🔄 Generating fixtures image...', 'info');

            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                padding: 25px;
                border-radius: 20px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 600px;
            `;

            const header = document.createElement('div');
            header.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0 0 10px 0; color: #ffd700; font-size: 1.8em; font-weight: bold;">
                        Upcoming Fixtures
                    </h1>
                    <p style="margin: 0 0 5px 0; font-size: 1.1em; opacity: 0.9;">
                        eFootball League 2025
                    </p>
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.7;">
                        ${new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
            `;
            tempContainer.appendChild(header);

            const fixturesList = document.createElement('div');
            fixturesList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 15px;
            `;

            upcomingFixtures.forEach(fixture => {
                const homePlayer = players.find(p => p.id === fixture.home_player_id);
                const awayPlayer = players.find(p => p.id === fixture.away_player_id);

                if (!homePlayer || !awayPlayer) {
                    console.warn('Could not find players for fixture:', fixture);
                    return;
                }

                const fixtureElement = document.createElement('div');
                fixtureElement.style.cssText = `
                    background: rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                `;

                fixtureElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="font-weight: bold; font-size: 1em; color: #ffd700; background: rgba(0, 0, 0, 0.3); padding: 5px 10px; border-radius: 15px;">
                            ${this.formatDisplayDate(fixture.date)}
                        </div>
                        <div style="background: rgba(255, 107, 107, 0.9); padding: 5px 10px; border-radius: 15px; font-weight: bold; font-size: 0.9em;">
                            ${fixture.time || '15:00'}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                            <img src="${homePlayer.photo}" 
                                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.3);"
                                 onerror="this.src='https://via.placeholder.com/40/1a1a2e/ffffff?text=?'">
                            <div>
                                <div style="font-weight: bold;">${homePlayer.name}</div>
                                <div style="font-size: 0.8em; opacity: 0.8;">${homePlayer.team}</div>
                            </div>
                        </div>
                        <div style="margin: 0 15px; font-weight: bold; font-size: 1.1em; color: #ff6b6b;">VS</div>
                        <div style="display: flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end;">
                            <div style="text-align: right;">
                                <div style="font-weight: bold;">${awayPlayer.name}</div>
                                <div style="font-size: 0.8em; opacity: 0.8;">${awayPlayer.team}</div>
                            </div>
                            <img src="${awayPlayer.photo}" 
                                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.3);"
                                 onerror="this.src='https://via.placeholder.com/40/1a1a2e/ffffff?text=?'">
                        </div>
                    </div>
                    <div style="text-align: center; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <span style="opacity: 0.9; font-size: 0.85em;">
                            🏟️ ${fixture.venue || 'Virtual Stadium'}
                        </span>
                    </div>
                `;

                fixturesList.appendChild(fixtureElement);
            });

            // Check if we have any valid fixtures to display
            if (fixturesList.children.length === 0) {
                showNotification('No valid fixtures found to export', 'warning');
                this.isGenerating = false;
                return;
            }

            tempContainer.appendChild(fixturesList);
            document.body.appendChild(tempContainer);

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(tempContainer, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false
            });

            document.body.removeChild(tempContainer);

            const image = canvas.toDataURL('image/png', 1.0);
            const filename = `EFL_Fixtures_${new Date().toISOString().split('T')[0]}.png`;

            this.downloadImage(image, filename);
            showNotification('✅ Fixtures exported successfully!', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            showNotification('❌ Failed to export fixtures: ' + error.message, 'error');
        } finally {
            this.isGenerating = false;
        }
    }

    // Style table for export
    styleTableForExport(tableElement) {
        tableElement.style.background = 'rgba(255, 255, 255, 0.08)';
        tableElement.style.borderRadius = '10px';
        tableElement.style.overflow = 'hidden';
        tableElement.style.color = 'white';
        tableElement.style.fontSize = '14px';

        const headers = tableElement.querySelectorAll('th');
        headers.forEach(header => {
            header.style.background = 'rgba(0, 0, 0, 0.4)';
            header.style.color = '#ffd700';
            header.style.fontWeight = 'bold';
            header.style.padding = '12px 8px';
        });

        const cells = tableElement.querySelectorAll('td');
        cells.forEach(cell => {
            cell.style.padding = '10px 8px';
            cell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        });
    }

    // Format date for display
    formatDisplayDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const options = { weekday: 'short', day: 'numeric', month: 'short' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return 'Invalid Date';
        }
    }

    // Download image helper
    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export player statistics
    async exportPlayerStats(playerId) {
        if (!(await this.isReady())) return;

        try {
            const player = await getPlayerById(playerId);
            const players = await getData(DB_KEYS.PLAYERS);
            
            if (!player) {
                showNotification('Player not found!', 'error');
                return;
            }

            this.isGenerating = true;
            showNotification('🔄 Generating player stats image...', 'info');

            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 500px;
                text-align: center;
            `;

            // You would need to calculate player stats here
            // This is a simplified version
            tempContainer.innerHTML = `
                <div style="text-align: center;">
                    <h1 style="color: #ffd700; margin-bottom: 20px;">Player Statistics</h1>
                    
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 25px;">
                        <img src="${player.photo}" 
                             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255, 255, 255, 0.3);"
                             onerror="this.src='https://via.placeholder.com/80/1a1a2e/ffffff?text=?'">
                        <div style="text-align: left;">
                            <h2 style="margin: 0 0 5px 0; color: white;">${player.name}</h2>
                            <p style="margin: 0; opacity: 0.8;">${player.team}</p>
                            <p style="margin: 5px 0 0 0; font-size: 0.9em;">Strength: ${player.strength}</p>
                        </div>
                    </div>

                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <p style="margin: 0; opacity: 0.8;">Statistics export coming soon...</p>
                    </div>

                    <div style="margin-top: 20px; font-size: 0.8em; opacity: 0.7;">
                        Generated on ${new Date().toLocaleDateString()}
                    </div>
                </div>
            `;

            document.body.appendChild(tempContainer);

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(tempContainer, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false
            });

            document.body.removeChild(tempContainer);

            const image = canvas.toDataURL('image/png', 1.0);
            const filename = `EFL_${player.name.replace(/\s+/g, '_')}_Stats_${new Date().toISOString().split('T')[0]}.png`;

            this.downloadImage(image, filename);
            showNotification('✅ Player stats exported successfully!', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            showNotification('❌ Failed to export player stats: ' + error.message, 'error');
        } finally {
            this.isGenerating = false;
        }
    }
}

// Initialize exporter
const imageExporter = new ImageExporter();
window.imageExporter = imageExporter;
