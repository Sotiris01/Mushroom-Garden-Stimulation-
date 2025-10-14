import { Fungus } from './Fungus';
import { Cell } from './Cell';
import { Dna } from './Dna';
import { Tile } from '../Tile';
import { Garden } from '../Garden';
import { GameConfig } from '../GameConfig';
import { EnergyType, EnergyWalletHelper } from './Energy';

/**
 * Spore - Temporary reproductive unit
 */
export interface Spore {
    x: number;
    y: number;
    dna: Dna;
    lifetime: number; // Time remaining before death
    parentFungusId: number;
}

/**
 * SimulationEngine - Manages the state and behavior of all fungus cells
 * 
 * Now uses discrete energy units instead of continuous values.
 * All rates are in units per second.
 * 
 * Handles all core simulation logic:
 * - Metabolism & survival
 * - Energy acquisition (photosynthesis, soil, parasitism)
 * - Energy management (storage, sharing)
 * - Cell death
 * - Growth & expansion
 * - Reproduction & spores
 */
export class SimulationEngine {
    private fungi: Map<number, Fungus> = new Map();
    private cells: Map<string, Cell> = new Map(); // Grid position -> Cell
    private spores: Spore[] = [];
    
    private garden: Garden;
    private config: GameConfig;
    
    // Simulation parameters (now public for modification)
    // All costs and rates are in discrete units
    public baseMetabolicDrain = 5; // Base NUTRITION_UNIT drain per second (scaled up 10x)
    public maxPhotosynthesisRate = 20; // Max SUN_UNITs absorbed per second (at 100% green)
    public maxSoilAbsorptionRate = 20; // Max SOIL_UNITs absorbed per second (at 100% brown)
    public maxParasitismRate = 10; // Max NUTRITION_UNITs drained from enemies per second (at 100% red)
    public expansionEnergyCost = 400; // NUTRITION_UNITs to create new cell (scaled up 10x)
    public mushroomEnergyCost = 500; // NUTRITION_UNITs to grow mushroom (scaled up 10x)
    public mushroomGrowthRate = 0.15; // Growth per second (unchanged - this is a ratio)
    public sporeLifetime = 10; // Seconds before spore dies
    public sporeScatterRadius = 10; // Tiles around mushroom
    public sporeCount = 5; // Number of spores per mushroom
    public energySharingRate = 100; // NUTRITION_UNITs transfer per second (scaled up 10x)
    public mutationStrength = 0.15; // How much DNA can mutate (0.0 to 1.0)
    
    constructor(garden: Garden, config: GameConfig) {
        this.garden = garden;
        this.config = config;
    }
    
    /**
     * Helper to create DNA with specific trait values (for testing)
     */
    public createTestDna(
        green: number,
        red: number,
        brown: number,
        yellow: number,
        pink: number,
        blue: number,
        purple: number
    ): Dna {
        return new Dna(green, red, brown, yellow, pink, blue, purple);
    }
    
    /**
     * Main update method called each frame
     * @param deltaTime Time elapsed since last frame (seconds)
     * @param sunEnergyPerTile Continuous sun energy delivered to each tile (units/sec)
     */
    public update(deltaTime: number, sunEnergyPerTile: number): void {
        // Reset energy tracking for all cells
        for (const cell of this.cells.values()) {
            cell.resetEnergyTracking();
        }
        
        // Update all cells
        for (const cell of this.cells.values()) {
            if (!cell.isAlive()) continue;
            
            // 1. Metabolism & Survival (Yellow DNA)
            this.applyMetabolism(cell, deltaTime);
            
            // 2. Energy Acquisition
            this.applyPhotosynthesis(cell, deltaTime, sunEnergyPerTile);
            this.applySoilAbsorption(cell, deltaTime);
            this.applyParasitism(cell, deltaTime);
            
            // 2b. Energy Conversion (convert raw energy to usable nutrition)
            this.applyEnergyConversion(cell);
            
            // 3. Mushroom growth (if applicable)
            if (cell.hasMushroom) {
                this.updateMushroom(cell, deltaTime);
            }
        }
        
        // 4. Automatic expansion and reproduction
        // Process in random order to avoid bias
        const cellsArray = Array.from(this.cells.values());
        for (let i = cellsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cellsArray[i], cellsArray[j]] = [cellsArray[j], cellsArray[i]];
        }
        
        for (const cell of cellsArray) {
            if (!cell.isAlive()) continue;
            
            const fungus = cell.fungus;
            
            // Calculate expansion cost (Blue DNA)
            const blueRatio = fungus.dna.blue / 100;
            const expansionCostMultiplier = 1.0 - blueRatio * 1.0; // Blue reduces cost by up to 80%
            const expansionCost = this.expansionEnergyCost * expansionCostMultiplier;
            
            // Calculate mushroom cost (Purple DNA)
            const purpleRatio = fungus.dna.purple / 100;
            const mushroomCostMultiplier = 1.0 - purpleRatio * 1.0; // Purple reduces cost by up to 80%
            const mushroomCost = this.mushroomEnergyCost * mushroomCostMultiplier;
            
            // Attempt expansion if cell has enough energy (1.2x cost threshold)
            if (cell.getEnergy() >= expansionCost * 1.2) {
                this.attemptExpansion(cell);
            }
            
            // Attempt reproduction (mushroom creation) if cell has high energy (1.2x cost threshold)
            // Only if cell doesn't already have a mushroom
            if (!cell.hasMushroom && cell.getEnergy() >= mushroomCost * 1.2) {
                this.attemptReproduction(cell);
            }
        }
        
        // 5. Energy sharing between cells
        this.performEnergySharing(deltaTime);
        
        // 6. Update spores
        this.updateSpores(deltaTime);
        
        // 7. Remove dead cells
        this.removeDeadCells();
        
        // 8. Split disconnected fungi
        this.splitDisconnectedFungi();
    }
    
    /**
     * Step 5: Metabolism & Survival (Yellow DNA)
     * Higher Yellow = lower energy drain (more efficient)
     * Metabolism scales with fungus size (larger fungi have higher per-cell costs)
     * Now uses discrete NUTRITION_UNITs with accumulator pattern
     */
    private applyMetabolism(cell: Cell, deltaTime: number): void {
        // Yellow DNA provides efficiency: 0 Yellow = full drain, 100 Yellow = minimal drain
        const yellowRatio = cell.fungus.dna.yellow / 100;
        const efficiency = 0.2 + (0.8 * (1 - yellowRatio)); // 20% to 100% drain
        
        // Scale metabolism by fungus size (larger organisms need more energy per cell)
        const cellCount = cell.fungus.getCellCount();
        const sizeMultiplier = 1.0 + (Math.log(cellCount) * 0.35); // More aggressive logarithmic scaling
        
        // Calculate drain in NUTRITION_UNITs (fractional)
        const drain = this.baseMetabolicDrain * efficiency * sizeMultiplier * deltaTime;
        
        // Store the continuous rate for UI display (per frame)
        cell.metabolismRateThisFrame = drain;
        
        // Add to accumulator and extract whole units
        cell.metabolismAccumulator.add(drain);
        const drainUnits = cell.metabolismAccumulator.extractUnits();
        
        if (drainUnits > 0) {
            cell.removeEnergyForPurpose(drainUnits, 'Metabolism', EnergyType.NUTRITION_UNIT);
        }
    }
    
    /**
     * Step 6: Photosynthesis (Green DNA)
     * Higher Green = more SUN_UNITs absorbed from tile's sun energy
     * Each tile receives independent sun energy - empty tiles waste it
     * Uses accumulator pattern for discrete unit extraction
     */
    private applyPhotosynthesis(cell: Cell, deltaTime: number, sunEnergyPerTile: number): void {
        if (sunEnergyPerTile <= 0) {
            cell.photosynthesisRateThisFrame = 0;
            return;
        }
        
        // Green DNA determines how much sun energy this cell can absorb from its tile
        const greenRatio = cell.fungus.dna.green / 100;
        const maxAbsorptionRate = greenRatio * this.maxPhotosynthesisRate; // units/sec
        
        // Actual absorption is limited by both cell's capacity and tile's sun delivery
        const absorptionRate = Math.min(maxAbsorptionRate, sunEnergyPerTile);
        const continuousAbsorption = absorptionRate * deltaTime;
        
        // Store continuous rate for UI display
        cell.photosynthesisRateThisFrame = absorptionRate;
        
        // Use accumulator to convert fractional absorption to discrete units
        cell.photosynthesisAccumulator.add(continuousAbsorption);
        const absorptionUnits = cell.photosynthesisAccumulator.extractUnits();
        
        if (absorptionUnits > 0) {
            cell.addEnergyFromSource(absorptionUnits, 'Photosynthesis', EnergyType.SUN_UNIT);
        }
    }
    
    /**
     * Step 6: Soil Absorption (Brown DNA)
     * Higher Brown = more SOIL_UNITs absorbed from tile
     * Now works with discrete units with accumulator pattern
     */
    private applySoilAbsorption(cell: Cell, deltaTime: number): void {
        const tile = this.garden.getTile(cell.x, cell.y);
        
        // Cannot absorb from tile if it has no energy
        if (!tile || tile.getTotalEnergy() <= 0) {
            cell.soilAbsorptionRateThisFrame = 0;
            return;
        }
        
        // Brown DNA determines soil absorption rate
        const brownRatio = cell.fungus.dna.brown / 100;
        const maxAbsorptionRate = brownRatio * this.maxSoilAbsorptionRate; // units/sec
        const maxAbsorption = maxAbsorptionRate * deltaTime;
        
        // Use accumulator for discrete unit extraction
        cell.soilAbsorptionAccumulator.add(maxAbsorption);
        const absorptionUnits = cell.soilAbsorptionAccumulator.extractUnits();
        
        // Initialize rate to 0 (will update if energy actually taken)
        cell.soilAbsorptionRateThisFrame = 0;
        
        if (absorptionUnits > 0) {
            // Try to remove SOIL_UNITs from tile
            const energyTaken = tile.removeEnergy(absorptionUnits, EnergyType.SOIL_UNIT);
            
            // Add to cell's wallet as SOIL_UNITs and update rate based on actual extraction
            if (energyTaken > 0) {
                cell.addEnergyFromSource(energyTaken, 'Soil Absorption', EnergyType.SOIL_UNIT);
                // Convert discrete units taken to continuous rate for UI display
                // Rate = units taken / deltaTime (to get units/sec)
                cell.soilAbsorptionRateThisFrame = energyTaken / deltaTime;
            }
        }
    }
    
    /**
     * Step 6: Parasitism (Red DNA)
     * Higher Red = more NUTRITION_UNITs drained from EACH neighboring cell of other fungi
     * 100% Red = 20 units/sec drained from EACH enemy neighbor
     * Uses accumulator pattern for smooth continuous extraction
     */
    private applyParasitism(cell: Cell, deltaTime: number): void {
        const redRatio = cell.fungus.dna.red / 100;
        if (redRatio <= 0) {
            cell.parasitismRateThisFrame = 0;
            return;
        }
        
        const neighbors = this.getAdjacentCells(cell);
        const nonRelatives = neighbors.filter(n => n.fungus.id !== cell.fungus.id);
        
        if (nonRelatives.length === 0) {
            cell.parasitismRateThisFrame = 0;
            return;
        }
        
        // Calculate drain rate PER neighbor (units/sec)
        // 100% Red = maxParasitismRate units/sec from EACH neighbor
        const drainRatePerNeighbor = redRatio * this.maxParasitismRate;
        const continuousDrainPerNeighbor = drainRatePerNeighbor * deltaTime;
        
        // Total energy gained = drainRate × number of neighbors
        let totalDrainedThisFrame = 0;
        
        // Drain from each neighbor independently
        for (const neighbor of nonRelatives) {
            // Use accumulator to convert fractional drain to discrete units
            cell.parasitismAccumulator.add(continuousDrainPerNeighbor);
            const drainUnits = cell.parasitismAccumulator.extractUnits();
            
            if (drainUnits > 0) {
                // Drain NUTRITION_UNITs from this specific victim
                const drained = neighbor.removeEnergyForPurpose(drainUnits, 'Parasitism', EnergyType.NUTRITION_UNIT);
                totalDrainedThisFrame += drained;
                
                // Parasite gains NUTRITION_UNITs
                if (drained > 0) {
                    cell.addEnergyFromSource(drained, 'Parasitism', EnergyType.NUTRITION_UNIT);
                }
            }
        }
        
        // Store continuous rate for smooth UI display
        // Total rate = drainRatePerNeighbor × number of neighbors
        cell.parasitismRateThisFrame = drainRatePerNeighbor * nonRelatives.length;
    }
    
    /**
     * Step 7: Energy Conversion
     * Cells convert raw energy into usable NUTRITION_UNITs
     * 
     * Two conversion pathways:
     * 1. Photosynthesis pathway: 1 SUN = 1 NUTRITION (direct conversion, efficient)
     * 2. Chemotroph pathway: 1 SOIL = 1 NUTRITION (fungus-like metabolism)
     * 
     * Cells will prefer converting SUN first, then SOIL if no SUN available
     */
    private applyEnergyConversion(cell: Cell): void {
        const wallet = cell.getEnergyWallet();
        const sunUnits = EnergyWalletHelper.get(wallet, EnergyType.SUN_UNIT);
        const soilUnits = EnergyWalletHelper.get(wallet, EnergyType.SOIL_UNIT);
        
        // Pathway 1: Photosynthesis (1 SUN = 1 NUTRITION)
        // Direct conversion - this is the primary energy pathway for plants
        if (sunUnits > 0) {
            // Convert all SUN energy to NUTRITION
            cell.removeEnergy(sunUnits, EnergyType.SUN_UNIT);
            cell.addEnergy(sunUnits, EnergyType.NUTRITION_UNIT);
            return; // Prefer photosynthesis pathway, exit early
        }
        
        // Pathway 2: Chemotroph/Decomposer (1 SOIL = 1 NUTRITION)
        // Fallback when no SUN available
        // Cells can consume soil directly to survive
        if (soilUnits > 0) {
            // Convert all SOIL energy to NUTRITION
            cell.removeEnergy(soilUnits, EnergyType.SOIL_UNIT);
            cell.addEnergy(soilUnits, EnergyType.NUTRITION_UNIT);
        }
    }
    
    /**
     * Step 5: Energy sharing between cells of same fungus
     * Full cells push surplus, starving cells pull emergency energy
     */
    private performEnergySharing(deltaTime: number): void {
        for (const cell of this.cells.values()) {
            if (!cell.isAlive()) continue;
            
            const neighbors = this.getAdjacentCells(cell).filter(n => n.fungus.id === cell.fungus.id);
            if (neighbors.length === 0) continue;
            
            const energyRatio = cell.getEnergyRatio();
            
            // Push surplus if very full (>90%)
            if (energyRatio > 0.9) {
                const surplus = cell.isFull();
                if (surplus > 0) {
                    const sharePerNeighbor = (surplus * 0.5) / neighbors.length;
                    for (const neighbor of neighbors) {
                        const transferred = Math.min(sharePerNeighbor, neighbor.getEnergyDeficit());
                        cell.removeEnergy(transferred);
                        neighbor.addEnergy(transferred);
                    }
                }
            }
            
            // Pull emergency energy if starving (<20%)
            if (energyRatio < 0.2) {
                const needed = cell.getEnergyDeficit();
                const pullRate = this.energySharingRate * deltaTime;
                const pullPerNeighbor = Math.min(pullRate, needed) / neighbors.length;
                
                for (const neighbor of neighbors) {
                    if (neighbor.getEnergyRatio() > 0.5) { // Only from healthy neighbors
                        const transferred = Math.min(pullPerNeighbor, neighbor.getEnergy() * 0.1);
                        neighbor.removeEnergy(transferred);
                        cell.addEnergy(transferred);
                    }
                }
            }
        }
    }
    
    /**
     * Step 7: Attempt cell expansion (Blue DNA)
     * Lower Blue cost = easier to expand
     */
    public attemptExpansion(cell: Cell): boolean {
        // Blue DNA reduces expansion cost: 0 Blue = full cost, 100 Blue = 20% cost (80% reduction)
        const blueRatio = cell.fungus.dna.blue / 100;
        const costMultiplier = 1.0 - blueRatio * 0.8; // 1.0x to 0.2x cost
        const actualCost = Math.floor(this.expansionEnergyCost * costMultiplier);
        
        // Check if cell has enough NUTRITION_UNITs
        const nutritionUnits = cell.getEnergyOfType(EnergyType.NUTRITION_UNIT);
        if (nutritionUnits < actualCost) return false;
        
        // Find empty adjacent tiles
        const emptyPositions = this.getEmptyAdjacentPositions(cell);
        if (emptyPositions.length === 0) return false;
        
        // Pick random empty position
        const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        
        // Pay energy cost in NUTRITION_UNITs
        cell.removeEnergyForPurpose(actualCost, 'Expansion', EnergyType.NUTRITION_UNIT);
        
        // Create new cell with some starting nutrition
        const startingEnergy = Math.floor(actualCost * 0.5);
        const newCell = new Cell(pos.x, pos.y, cell.fungus, startingEnergy);
        this.addCell(newCell);
        
        return true;
    }
    
    /**
     * Step 7: Attempt reproduction (Purple DNA)
     * Lower Purple cost = easier to reproduce
     * Now uses discrete NUTRITION_UNITs
     */
    public attemptReproduction(cell: Cell): boolean {
        if (cell.hasMushroom) return false; // Already has mushroom
        
        // Purple DNA reduces mushroom cost: 0 Purple = full cost, 100 Purple = 20% cost (80% reduction)
        const purpleRatio = cell.fungus.dna.purple / 100;
        const costMultiplier = 1.0 - purpleRatio * 0.8; // 1.0x to 0.2x cost
        const actualCost = Math.floor(this.mushroomEnergyCost * costMultiplier);
        
        // Check if cell has enough NUTRITION_UNITs
        const nutritionUnits = cell.getEnergyOfType(EnergyType.NUTRITION_UNIT);
        if (nutritionUnits < actualCost) return false;
        
        // Pay energy cost in NUTRITION_UNITs and start mushroom
        cell.removeEnergyForPurpose(actualCost, 'Reproduction', EnergyType.NUTRITION_UNIT);
        cell.startMushroom();
        
        return true;
    }
    
    /**
     * Update mushroom growth and release spores when mature
     */
    private updateMushroom(cell: Cell, deltaTime: number): void {
        if (!cell.hasMushroom) return;
        
        // Grow mushroom
        cell.growMushroom(this.mushroomGrowthRate * deltaTime);
        
        // Release spores when fully grown
        if (cell.isMushroomMature()) {
            this.releaseSpores(cell);
            cell.removeMushroom();
        }
    }
    
    /**
     * Step 8: Release spores from mature mushroom
     */
    private releaseSpores(cell: Cell): void {
        const mutatedDna = cell.fungus.dna.mutate(this.mutationStrength);
        
        for (let i = 0; i < this.sporeCount; i++) {
            // Random position within scatter radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.sporeScatterRadius;
            
            const x = Math.round(cell.x + Math.cos(angle) * distance);
            const y = Math.round(cell.y + Math.sin(angle) * distance);
            
            // Check if position is valid
            if (x < 0 || y < 0 || x >= this.config.gridSize || y >= this.config.gridSize) {
                continue;
            }
            
            this.spores.push({
                x,
                y,
                dna: mutatedDna,
                lifetime: this.sporeLifetime,
                parentFungusId: cell.fungus.id
            });
        }
    }
    
    /**
     * Step 8: Update all spores (germination or death)
     */
    private updateSpores(deltaTime: number): void {
        const remainingSpores: Spore[] = [];
        
        for (const spore of this.spores) {
            spore.lifetime -= deltaTime;
            
            // Check if spore should germinate
            const tile = this.garden.getTile(spore.x, spore.y);
            const existingCell = this.getCellAt(spore.x, spore.y);
            
            if (tile && !existingCell && spore.lifetime > 0) {
                // Germinate!
                this.germinateSpore(spore);
            } else if (spore.lifetime > 0) {
                // Keep spore alive if not germinated
                remainingSpores.push(spore);
            }
            // else: spore dies (expired or occupied tile)
        }
        
        this.spores = remainingSpores;
    }
    
    /**
     * Step 8: Germinate a spore into a new fungus
     */
    private germinateSpore(spore: Spore): void {
        // Create new fungus with mutated DNA
        const newFungus = new Fungus(spore.dna, 0); // Generation determined by DNA mutation history
        this.fungi.set(newFungus.id, newFungus);
        
        // Create first cell
        const firstCell = new Cell(spore.x, spore.y, newFungus, 50);
        this.addCell(firstCell);
    }
    
    /**
     * Remove all dead cells from simulation
     */
    private removeDeadCells(): void {
        const deadCells: Cell[] = [];
        
        for (const cell of this.cells.values()) {
            if (!cell.isAlive()) {
                deadCells.push(cell);
            }
        }
        
        for (const cell of deadCells) {
            this.removeCell(cell);
        }
        
        // Remove fungi with no cells
        const deadFungi: number[] = [];
        for (const [id, fungus] of this.fungi.entries()) {
            if (fungus.getCellCount() === 0) {
                deadFungi.push(id);
            }
        }
        
        for (const id of deadFungi) {
            this.fungi.delete(id);
        }
    }
    
    /**
     * Split disconnected fungi into separate organisms
     * When cells become separated (e.g., by cell death), they form new fungi with the same DNA
     */
    private splitDisconnectedFungi(): void {
        // Check each fungus for disconnected groups
        for (const fungus of this.fungi.values()) {
            const fungusCells = Array.from(this.cells.values()).filter(c => c.fungus.id === fungus.id);
            
            if (fungusCells.length <= 1) continue; // Single cell or empty, no need to check
            
            // Find connected groups using flood fill
            const visited = new Set<string>();
            const groups: Cell[][] = [];
            
            for (const startCell of fungusCells) {
                const key = startCell.getPositionKey();
                if (visited.has(key)) continue;
                
                // Flood fill to find connected group
                const group: Cell[] = [];
                const queue: Cell[] = [startCell];
                visited.add(key);
                
                while (queue.length > 0) {
                    const cell = queue.shift()!;
                    group.push(cell);
                    
                    // Check adjacent cells of the same fungus
                    const neighbors = this.getAdjacentCells(cell).filter(n => n.fungus.id === fungus.id);
                    for (const neighbor of neighbors) {
                        const neighborKey = neighbor.getPositionKey();
                        if (!visited.has(neighborKey)) {
                            visited.add(neighborKey);
                            queue.push(neighbor);
                        }
                    }
                }
                
                groups.push(group);
            }
            
            // If we found multiple disconnected groups, split them
            if (groups.length > 1) {
                // Keep the largest group with the original fungus
                groups.sort((a, b) => b.length - a.length);
                
                // Create new fungi for the smaller groups
                for (let i = 1; i < groups.length; i++) {
                    const newFungus = new Fungus(fungus.dna.clone(), fungus.generation);
                    this.fungi.set(newFungus.id, newFungus);
                    
                    // Transfer cells to new fungus by creating new cell instances
                    for (const oldCell of groups[i]) {
                        // Remove old cell
                        this.removeCell(oldCell);
                        
                        // Create new cell with same position and energy for the new fungus
                        const newCell = new Cell(oldCell.x, oldCell.y, newFungus, oldCell.getEnergy());
                        
                        // Transfer mushroom state if present
                        if (oldCell.hasMushroom) {
                            newCell.startMushroom();
                            newCell.mushroomGrowth = oldCell.mushroomGrowth;
                        }
                        
                        // Add new cell
                        this.addCell(newCell);
                    }
                }
            }
        }
    }
    
    /**
     * Add a cell to the simulation
     */
    public addCell(cell: Cell): void {
        const key = cell.getPositionKey();
        this.cells.set(key, cell);
        cell.fungus.addCell(cell);
        
        // Mark tile as occupied
        const tile = this.garden.getTile(cell.x, cell.y);
        if (tile) {
            tile.isEmpty = false;
        }
    }
    
    /**
     * Remove a cell from the simulation
     */
    public removeCell(cell: Cell): void {
        const key = cell.getPositionKey();
        this.cells.delete(key);
        cell.fungus.removeCell(cell);
        
        // Mark tile as empty
        const tile = this.garden.getTile(cell.x, cell.y);
        if (tile) {
            tile.isEmpty = true;
        }
    }
    
    /**
     * Get cell at position
     */
    public getCellAt(x: number, y: number): Cell | undefined {
        return this.cells.get(`${x},${y}`);
    }
    
    /**
     * Get all cells in simulation
     */
    public getAllCells(): Cell[] {
        return Array.from(this.cells.values());
    }
    
    /**
     * Get all fungi in simulation
     */
    public getAllFungi(): Fungus[] {
        return Array.from(this.fungi.values());
    }
    
    /**
     * Get all spores in simulation
     */
    public getAllSpores(): Spore[] {
        return [...this.spores];
    }
    
    /**
     * Create a new fungus at position
     */
    public createFungus(x: number, y: number, dna?: Dna): Fungus | null {
        const tile = this.garden.getTile(x, y);
        if (!tile || !tile.isEmpty) return null;
        
        const fungus = new Fungus(dna || new Dna(), 0);
        this.fungi.set(fungus.id, fungus);
        
        const firstCell = new Cell(x, y, fungus, 50);
        this.addCell(firstCell);
        
        return fungus;
    }
    
    /**
     * Get adjacent cells to a given cell
     */
    private getAdjacentCells(cell: Cell): Cell[] {
        const adjacent: Cell[] = [];
        const offsets = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal
            [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
        ];
        
        for (const [dx, dy] of offsets) {
            const neighbor = this.getCellAt(cell.x + dx, cell.y + dy);
            if (neighbor && neighbor.isAlive()) {
                adjacent.push(neighbor);
            }
        }
        
        return adjacent;
    }
    
    /**
     * Get empty adjacent positions
     */
    private getEmptyAdjacentPositions(cell: Cell): { x: number; y: number }[] {
        const empty: { x: number; y: number }[] = [];
        const offsets = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // Cardinal only for expansion
        ];
        
        for (const [dx, dy] of offsets) {
            const x = cell.x + dx;
            const y = cell.y + dy;
            
            if (x < 0 || y < 0 || x >= this.config.gridSize || y >= this.config.gridSize) {
                continue;
            }
            
            const tile = this.garden.getTile(x, y);
            if (tile && tile.isEmpty && !this.getCellAt(x, y)) {
                empty.push({ x, y });
            }
        }
        
        return empty;
    }
    
    /**
     * Clear all fungi and cells
     */
    public clear(): void {
        this.cells.clear();
        this.fungi.clear();
        this.spores = [];
        
        // Reset all tiles to empty
        for (const tile of this.garden.getAllTiles()) {
            tile.isEmpty = true;
        }
    }
}
