import { Tile } from './Tile';
import { GameConfig } from './GameConfig';
import { Cell } from './fungus-sim/Cell';
import { Fungus } from './fungus-sim/Fungus';
import { SimulationEngine } from './fungus-sim/SimulationEngine';
import { EnergyType } from './fungus-sim/Energy';

/**
 * TilePopup - Handles displaying information about clicked tiles
 * Now displays discrete energy units
 */
export class TilePopup {
    private popupElement: HTMLElement;
    private isVisible: boolean = false;
    private clickOutsideHandler: ((event: MouseEvent) => void) | null = null;
    private justOpened: boolean = false;

    constructor() {
        this.popupElement = this.createPopupElement();
        document.body.appendChild(this.popupElement);
        this.setupClickOutsideListener();
    }

    /**
     * Create the popup HTML element
     */
    private createPopupElement(): HTMLElement {
        const popup = document.createElement('div');
        popup.id = 'tile-popup';
        popup.style.cssText = `
            position: fixed;
            background: rgba(255, 255, 255, 0.95);
            border: 3px solid #2c3e50;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            min-width: 600px;
            max-width: 1200px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: none;
            pointer-events: auto;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            line-height: 1;
            transition: background 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#c0392b';
        closeBtn.onmouseout = () => closeBtn.style.background = '#e74c3c';
        closeBtn.onclick = () => this.hide();

        popup.appendChild(closeBtn);
        
        // Prevent clicks inside popup from propagating to document
        popup.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        return popup;
    }

    /**
     * Show popup with tile information
     */
    public show(tile: Tile, config: GameConfig, mouseX: number, mouseY: number, cell?: Cell, deltaTime: number = 0.016, simulationEngine?: SimulationEngine): void {
        // Clear previous content (except close button)
        while (this.popupElement.children.length > 1) {
            this.popupElement.removeChild(this.popupElement.lastChild!);
        }

        // Create content
        const content = document.createElement('div');
        content.style.marginTop = '10px';

        // Title
        const title = document.createElement('h3');
        title.textContent = `Tile (${tile.x}, ${tile.y})`;
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 20px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
        `;
        content.appendChild(title);
        
        // Create horizontal container for sections
        const sectionsContainer = document.createElement('div');
        sectionsContainer.style.cssText = `
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        `;

        // === TILE ENERGY INFORMATION ===
        const tileSection = this.createSection('🌱 Tile Energy');
        
        // Status
        const status = this.createInfoRow('Status', tile.isEmpty ? 'Empty' : 'Occupied', tile.isEmpty ? '#27ae60' : '#e67e22');
        tileSection.appendChild(status);

        // Energy information (discrete SOIL_UNITs)
        const soilUnits = tile.getTotalEnergy();
        const energyPercent = (soilUnits / config.maxTileEnergy * 100).toFixed(1);
        const energyRow = this.createInfoRow(
            'Soil Energy',
            `${soilUnits} / ${config.maxTileEnergy} units`,
            this.getEnergyColor(soilUnits / config.maxTileEnergy)
        );
        tileSection.appendChild(energyRow);

        // Energy generation rate (units per second)
        const baseRate = tile.isEmpty ? config.emptyTileEnergyRate : config.occupiedTileEnergyRate;
        const actualRate = config.calculateGenerationRate(soilUnits, baseRate);
        const genRate = this.createInfoRow(
            'Gen Rate',
            `${actualRate.toFixed(1)} units/s (base: ${baseRate} units/s)`,
            '#3498db'
        );
        tileSection.appendChild(genRate);

        // Fill ratio bar
        const fillRatio = tile.getFillRatio(config.maxTileEnergy);
        const progressBar = this.createProgressBar(fillRatio, `${energyPercent}%`);
        tileSection.appendChild(progressBar);

        sectionsContainer.appendChild(tileSection);

        // === CELL INFORMATION ===
        if (cell) {
            const cellSection = this.createSection('🍄 Cell Information');
            
            // Cell position
            const posRow = this.createInfoRow('Position', `(${cell.x}, ${cell.y})`, '#9b59b6');
            cellSection.appendChild(posRow);
            
            // Cell energy
            const cellEnergyRatio = cell.getEnergyRatio();
            const cellEnergyRow = this.createInfoRow(
                'Cell Energy',
                `${cell.getEnergy().toFixed(1)} / ${cell.getMaxEnergy().toFixed(1)}`,
                this.getEnergyColor(cellEnergyRatio)
            );
            cellSection.appendChild(cellEnergyRow);
            
            // Cell energy bar
            const cellEnergyBar = this.createProgressBar(cellEnergyRatio, `${(cellEnergyRatio * 100).toFixed(1)}%`);
            cellSection.appendChild(cellEnergyBar);
            
            // Mushroom status
            if (cell.hasMushroom) {
                const mushroomRow = this.createInfoRow(
                    'Mushroom',
                    `${(cell.mushroomGrowth * 100).toFixed(1)}% grown`,
                    '#e74c3c'
                );
                cellSection.appendChild(mushroomRow);
                
                const mushroomBar = this.createProgressBar(cell.mushroomGrowth, 'Growing');
                cellSection.appendChild(mushroomBar);
            } else {
                const noMushroom = this.createInfoRow('Mushroom', 'None', '#95a5a6');
                cellSection.appendChild(noMushroom);
            }
            
            // === CELL ENERGY FLOW ===
            const flowTitle = document.createElement('div');
            flowTitle.textContent = '⚡ Energy Flow (This Frame)';
            flowTitle.style.cssText = `
                font-weight: 700;
                color: #2c3e50;
                margin-top: 12px;
                margin-bottom: 8px;
                font-size: 13px;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 4px;
            `;
            cellSection.appendChild(flowTitle);
            
            // Calculate total energy gained across all types
            let cellTotalGained = 0;
            cell.energyGainedThisFrame.forEach(amount => cellTotalGained += amount);
            
            // Add continuous rates for smooth display
            const soilRate = cell.soilAbsorptionRateThisFrame;
            const photoRate = cell.photosynthesisRateThisFrame;
            const parasitismRate = cell.parasitismRateThisFrame;
            
            const energyGainedPerSec = deltaTime > 0 ? (cellTotalGained + soilRate + photoRate + parasitismRate) / deltaTime : 0;
            const gainRow = this.createInfoRow(
                'Gained',
                `+${energyGainedPerSec.toFixed(1)} units/sec`,
                '#27ae60'
            );
            cellSection.appendChild(gainRow);
            
            // Energy gain breakdown - show continuous rates
            // Soil Absorption
            if (soilRate > 0) {
                const soilRow = this.createInfoRow(
                    `  Soil Absorption (🌱 SOIL)`,
                    `+${soilRate.toFixed(1)}`,
                    '#8b4513'
                );
                soilRow.style.fontSize = '11px';
                soilRow.style.marginLeft = '8px';
                cellSection.appendChild(soilRow);
            }
            
            // Photosynthesis
            if (photoRate > 0) {
                const photoRow = this.createInfoRow(
                    `  Photosynthesis (☀️ SUN)`,
                    `+${photoRate.toFixed(1)}`,
                    '#27ae60'
                );
                photoRow.style.fontSize = '11px';
                photoRow.style.marginLeft = '8px';
                cellSection.appendChild(photoRow);
            }
            
            // Parasitism
            if (parasitismRate > 0) {
                const parasitismRow = this.createInfoRow(
                    `  Parasitism (⚡ NUTRITION)`,
                    `+${parasitismRate.toFixed(1)}`,
                    '#e74c3c'
                );
                parasitismRow.style.fontSize = '11px';
                parasitismRow.style.marginLeft = '8px';
                cellSection.appendChild(parasitismRow);
            }
            
            // Other sources from breakdown (parasitism, etc)
            if (Object.keys(cell.energyGainBreakdown).length > 0) {
                for (const [source, typeMap] of Object.entries(cell.energyGainBreakdown)) {
                    // Skip sources we already displayed with continuous rates
                    if (source === 'Soil Absorption' || source === 'Photosynthesis' || source === 'Parasitism') continue;
                    
                    typeMap.forEach((amount, type) => {
                        if (amount > 0) {
                            const amountPerSec = deltaTime > 0 ? amount / deltaTime : 0;
                            const sourceColor = this.getSourceColor(source);
                            const typeLabel = this.getEnergyTypeLabel(type);
                            const sourceRow = this.createInfoRow(
                                `  ${source} (${typeLabel})`,
                                `+${amountPerSec.toFixed(1)}`,
                                sourceColor
                            );
                            sourceRow.style.fontSize = '11px';
                            sourceRow.style.marginLeft = '8px';
                            cellSection.appendChild(sourceRow);
                        }
                    });
                }
            }
            
            // Calculate total energy consumed across all types
            let cellTotalConsumed = 0;
            cell.energyConsumedThisFrame.forEach(amount => cellTotalConsumed += amount);
            
            // Add continuous metabolism rate (for smooth display)
            const metabolismRate = cell.metabolismRateThisFrame;
            
            const energyConsumedPerSec = deltaTime > 0 ? (cellTotalConsumed + metabolismRate) / deltaTime : 0;
            const consumeRow = this.createInfoRow(
                'Consumed',
                `-${energyConsumedPerSec.toFixed(1)} units/sec`,
                '#e74c3c'
            );
            cellSection.appendChild(consumeRow);
            
            // Energy consumption breakdown by purpose and type
            // First show the continuous metabolism rate
            if (metabolismRate > 0) {
                const metabolismRow = this.createInfoRow(
                    `  Metabolism (⚡ NUTRITION)`,
                    `-${metabolismRate.toFixed(1)}`,
                    '#f1c40f'
                );
                metabolismRow.style.fontSize = '11px';
                metabolismRow.style.marginLeft = '8px';
                cellSection.appendChild(metabolismRow);
            }
            
            // Then show other consumption breakdowns
            if (Object.keys(cell.energyConsumeBreakdown).length > 0) {
                for (const [purpose, typeMap] of Object.entries(cell.energyConsumeBreakdown)) {
                    // Skip Metabolism as we already displayed it above
                    if (purpose === 'Metabolism') continue;
                    
                    typeMap.forEach((amount, type) => {
                        if (amount > 0) {
                            const amountPerSec = deltaTime > 0 ? amount / deltaTime : 0;
                            const purposeColor = this.getPurposeColor(purpose);
                            const typeLabel = this.getEnergyTypeLabel(type);
                            const purposeRow = this.createInfoRow(
                                `  ${purpose} (${typeLabel})`,
                                `-${amountPerSec.toFixed(1)}`,
                                purposeColor
                            );
                            purposeRow.style.fontSize = '11px';
                            purposeRow.style.marginLeft = '8px';
                            cellSection.appendChild(purposeRow);
                        }
                    });
                }
            }
            
            // Net energy flow
            const netFlow = cellTotalGained - cellTotalConsumed;
            const netFlowPerSec = deltaTime > 0 ? netFlow / deltaTime : 0;
            const netColor = netFlow > 0 ? '#27ae60' : netFlow < 0 ? '#e74c3c' : '#95a5a6';
            const netRow = this.createInfoRow(
                'Net Flow',
                `${netFlowPerSec >= 0 ? '+' : ''}${netFlowPerSec.toFixed(2)}/sec`,
                netColor
            );
            netRow.style.fontWeight = '700';
            cellSection.appendChild(netRow);
            
            sectionsContainer.appendChild(cellSection);
            
            // === FUNGUS INFORMATION ===
            const fungus = cell.fungus;
            const fungusSection = this.createSection('🧬 Fungus DNA');
            
            // Fungus ID and generation
            const idRow = this.createInfoRow('ID', `#${fungus.id}`, '#34495e');
            fungusSection.appendChild(idRow);
            
            const genRow = this.createInfoRow('Generation', fungus.generation.toString(), '#3498db');
            fungusSection.appendChild(genRow);
            
            // Total cells and energy
            const cellsRow = this.createInfoRow('Total Cells', fungus.getCellCount().toString(), '#2ecc71');
            fungusSection.appendChild(cellsRow);
            
            const totalEnergyRow = this.createInfoRow(
                'Total Energy',
                fungus.getTotalEnergy().toFixed(1),
                '#f39c12'
            );
            fungusSection.appendChild(totalEnergyRow);
            
            const avgEnergyRow = this.createInfoRow(
                'Avg Energy/Cell',
                fungus.getAverageEnergy().toFixed(1),
                '#9b59b6'
            );
            fungusSection.appendChild(avgEnergyRow);
            
            // === COST CALCULATIONS ===
            const costTitle = document.createElement('div');
            costTitle.textContent = '💰 Action Costs';
            costTitle.style.cssText = `
                font-weight: 700;
                color: #2c3e50;
                margin-top: 12px;
                margin-bottom: 8px;
                font-size: 13px;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 4px;
            `;
            fungusSection.appendChild(costTitle);
            
            // Calculate expansion cost (Blue DNA)
            const blueRatio = fungus.dna.blue / 100;
            const expansionMultiplier = 1.0 - blueRatio * 0.5;
            const expansionCost = simulationEngine ? 
                simulationEngine.expansionEnergyCost * expansionMultiplier : 
                30 * expansionMultiplier;
            
            const expansionCostRow = this.createInfoRow(
                '🔵 Expansion',
                `${expansionCost.toFixed(1)} energy`,
                '#3498db'
            );
            fungusSection.appendChild(expansionCostRow);
            
            // Calculate mushroom cost (Purple DNA)
            const purpleRatio = fungus.dna.purple / 100;
            const mushroomMultiplier = 1.0 - purpleRatio * 0.5;
            const mushroomCost = simulationEngine ?
                simulationEngine.mushroomEnergyCost * mushroomMultiplier :
                50 * mushroomMultiplier;
            
            const mushroomCostRow = this.createInfoRow(
                '🟣 Mushroom',
                `${mushroomCost.toFixed(1)} energy`,
                '#9b59b6'
            );
            fungusSection.appendChild(mushroomCostRow);
            
            // === ORGANISM ENERGY FLOW ===
            const orgFlowTitle = document.createElement('div');
            orgFlowTitle.textContent = '⚡ Organism Energy Flow';
            orgFlowTitle.style.cssText = `
                font-weight: 700;
                color: #2c3e50;
                margin-top: 12px;
                margin-bottom: 8px;
                font-size: 13px;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 4px;
            `;
            fungusSection.appendChild(orgFlowTitle);
            
            // Total gained
            const totalGained = fungus.getTotalEnergyGained();
            const totalGainRow = this.createInfoRow(
                'Total Gained',
                `+${totalGained.toFixed(2)}/frame`,
                '#27ae60'
            );
            fungusSection.appendChild(totalGainRow);
            
            // Total consumed
            const totalConsumed = fungus.getTotalEnergyConsumed();
            const totalConsumeRow = this.createInfoRow(
                'Total Consumed',
                `-${totalConsumed.toFixed(2)}/frame`,
                '#e74c3c'
            );
            fungusSection.appendChild(totalConsumeRow);
            
            // Net organism flow
            const netOrgFlow = fungus.getNetEnergyFlow();
            const netOrgColor = netOrgFlow > 0 ? '#27ae60' : netOrgFlow < 0 ? '#e74c3c' : '#95a5a6';
            const netOrgRow = this.createInfoRow(
                'Net Flow',
                `${netOrgFlow >= 0 ? '+' : ''}${netOrgFlow.toFixed(2)}/frame`,
                netOrgColor
            );
            netOrgRow.style.fontWeight = '700';
            netOrgRow.style.fontSize = '15px';
            fungusSection.appendChild(netOrgRow);
            
            // DNA Traits
            const dnaTitle = document.createElement('div');
            dnaTitle.textContent = 'DNA Traits:';
            dnaTitle.style.cssText = `
                font-weight: 700;
                color: #2c3e50;
                margin-top: 12px;
                margin-bottom: 8px;
                font-size: 13px;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 4px;
            `;
            fungusSection.appendChild(dnaTitle);
            
            // DNA bars for each trait
            const dnaTraits = [
                { name: 'Green (Photosyn.)', value: fungus.dna.green, color: '#27ae60' },
                { name: 'Red (Parasitism)', value: fungus.dna.red, color: '#e74c3c' },
                { name: 'Brown (Soil)', value: fungus.dna.brown, color: '#8b4513' },
                { name: 'Yellow (Metabol.)', value: fungus.dna.yellow, color: '#f1c40f' },
                { name: 'Pink (Storage)', value: fungus.dna.pink, color: '#ff69b4' },
                { name: 'Blue (Expansion)', value: fungus.dna.blue, color: '#3498db' },
                { name: 'Purple (Reprod.)', value: fungus.dna.purple, color: '#9b59b6' },
            ];
            
            dnaTraits.forEach(trait => {
                const traitBar = this.createDnaBar(trait.name, trait.value, trait.color);
                fungusSection.appendChild(traitBar);
            });
            
            sectionsContainer.appendChild(fungusSection);
        }
        
        content.appendChild(sectionsContainer);

        this.popupElement.appendChild(content);

        // Position popup near mouse cursor
        this.positionPopup(mouseX, mouseY);

        // Show popup
        this.popupElement.style.display = 'block';
        this.isVisible = true;
        
        // Mark as just opened to prevent immediate closing from the same click
        this.justOpened = true;
    }
    
    /**
     * Create a section header
     */
    private createSection(title: string): HTMLElement {
        const section = document.createElement('div');
        section.style.cssText = `
            margin: 0;
            padding: 10px;
            background: rgba(52, 152, 219, 0.08);
            border-radius: 8px;
            border-left: 4px solid #3498db;
            flex: 1;
            min-width: 250px;
        `;
        
        const header = document.createElement('h4');
        header.textContent = title;
        header.style.cssText = `
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 15px;
            font-weight: 700;
        `;
        
        section.appendChild(header);
        return section;
    }
    
    /**
     * Create a DNA trait bar
     */
    private createDnaBar(name: string, value: number, color: string): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = `
            margin: 6px 0;
        `;

        const labelRow = document.createElement('div');
        labelRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 3px;
        `;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.cssText = `
            color: #34495e;
            font-weight: 600;
        `;
        
        const valueSpan = document.createElement('span');
        valueSpan.textContent = value.toString();
        valueSpan.style.cssText = `
            color: ${color};
            font-weight: 700;
        `;
        
        labelRow.appendChild(nameSpan);
        labelRow.appendChild(valueSpan);

        const barBg = document.createElement('div');
        barBg.style.cssText = `
            width: 100%;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
        `;

        const barFill = document.createElement('div');
        barFill.style.cssText = `
            width: ${value}%;
            height: 100%;
            background: ${color};
            transition: width 0.3s ease;
        `;

        barBg.appendChild(barFill);
        container.appendChild(labelRow);
        container.appendChild(barBg);

        return container;
    }

    /**
     * Create an information row
     */
    private createInfoRow(label: string, value: string, valueColor: string): HTMLElement {
        const row = document.createElement('div');
        row.style.cssText = `
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label + ':';
        labelSpan.style.cssText = `
            font-weight: 600;
            color: #34495e;
            font-size: 14px;
        `;

        const valueSpan = document.createElement('span');
        valueSpan.textContent = value;
        valueSpan.style.cssText = `
            font-weight: 700;
            color: ${valueColor};
            font-size: 14px;
        `;

        row.appendChild(labelSpan);
        row.appendChild(valueSpan);

        return row;
    }

    /**
     * Create a progress bar showing fill ratio
     */
    private createProgressBar(fillRatio: number, labelText?: string): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = `
            margin: 15px 0 5px 0;
        `;

        const labelDiv = document.createElement('div');
        labelDiv.textContent = 'Fill Level';
        labelDiv.style.cssText = `
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 5px;
            font-weight: 600;
        `;

        const barBg = document.createElement('div');
        barBg.style.cssText = `
            width: 100%;
            height: 24px;
            background: #ecf0f1;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid #bdc3c7;
        `;

        const barFill = document.createElement('div');
        const percentage = labelText || `${(fillRatio * 100).toFixed(0)}%`;
        barFill.style.cssText = `
            width: ${fillRatio * 100}%;
            height: 100%;
            background: linear-gradient(90deg, ${this.getEnergyColor(fillRatio)}, ${this.getEnergyColor(fillRatio * 1.2)});
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        `;
        barFill.textContent = percentage;

        barBg.appendChild(barFill);
        container.appendChild(labelDiv);
        container.appendChild(barBg);

        return container;
    }

    /**
     * Get color based on energy level
     */
    private getEnergyColor(ratio: number): string {
        if (ratio < 0.33) return '#e74c3c'; // Red - low energy
        if (ratio < 0.66) return '#f39c12'; // Orange - medium energy
        return '#27ae60'; // Green - high energy
    }
    
    /**
     * Get color for energy source
     */
    private getSourceColor(source: string): string {
        switch (source) {
            case 'Photosynthesis': return '#27ae60'; // Green
            case 'Soil Absorption': return '#8b4513'; // Brown
            case 'Parasitism': return '#e74c3c'; // Red
            default: return '#95a5a6'; // Gray
        }
    }
    
    /**
     * Get color for energy consumption purpose
     */
    private getPurposeColor(purpose: string): string {
        switch (purpose) {
            case 'Metabolism': return '#f1c40f'; // Yellow
            case 'Expansion': return '#3498db'; // Blue
            case 'Reproduction': return '#9b59b6'; // Purple
            default: return '#95a5a6'; // Gray
        }
    }
    
    /**
     * Get label for energy type
     */
    private getEnergyTypeLabel(type: EnergyType): string {
        switch (type) {
            case EnergyType.SUN_UNIT: return '☀️ SUN';
            case EnergyType.SOIL_UNIT: return '🌱 SOIL';
            case EnergyType.NUTRITION_UNIT: return '⚡ NUTRITION';
            default: return 'UNKNOWN';
        }
    }

    /**
     * Position popup near mouse cursor, avoiding screen edges
     */
    private positionPopup(mouseX: number, mouseY: number): void {
        const padding = 20;
        const popup = this.popupElement;
        
        // Temporarily show to get dimensions
        popup.style.display = 'block';
        const rect = popup.getBoundingClientRect();
        
        let x = mouseX + padding;
        let y = mouseY + padding;

        // Avoid right edge
        if (x + rect.width > window.innerWidth) {
            x = mouseX - rect.width - padding;
        }

        // Avoid bottom edge
        if (y + rect.height > window.innerHeight) {
            y = mouseY - rect.height - padding;
        }

        // Ensure not off left edge
        if (x < padding) {
            x = padding;
        }

        // Ensure not off top edge
        if (y < padding) {
            y = padding;
        }

        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
    }

    /**
     * Hide the popup
     */
    public hide(): void {
        this.popupElement.style.display = 'none';
        this.isVisible = false;
    }
    
    /**
     * Setup click outside listener to close popup
     */
    private setupClickOutsideListener(): void {
        this.clickOutsideHandler = (event: MouseEvent) => {
            if (!this.isVisible) return;
            
            // Ignore clicks immediately after opening
            if (this.justOpened) {
                this.justOpened = false;
                return;
            }
            
            const target = event.target as Node;
            
            // Check if click is outside the popup
            if (!this.popupElement.contains(target)) {
                this.hide();
            }
        };
        
        // Add listener to document
        document.addEventListener('click', this.clickOutsideHandler!);
    }

    /**
     * Check if popup is currently visible
     */
    public getIsVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Toggle popup visibility
     */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        }
    }
}
