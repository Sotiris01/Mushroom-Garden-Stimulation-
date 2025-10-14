import { Tile } from './Tile';
import { GameConfig } from './GameConfig';
import { EnergyType } from './fungus-sim/Energy';

/**
 * Garden - The main grid of tiles
 * Manages the square grid and tile energy generation using discrete units
 */
export class Garden {
    public readonly config: GameConfig;
    public readonly tiles: Tile[][];
    public readonly size: number;
    
    constructor(config: GameConfig) {
        this.config = config;
        this.size = config.gridSize;
        
        // Create 2D grid of tiles
        this.tiles = [];
        for (let x = 0; x < this.size; x++) {
            this.tiles[x] = [];
            for (let y = 0; y < this.size; y++) {
                this.tiles[x][y] = new Tile(x, y);
            }
        }
    }
    
    /**
     * Get a tile at specific coordinates
     */
    getTile(x: number, y: number): Tile | null {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return null;
        }
        return this.tiles[x][y];
    }
    
    /**
     * Update all tiles - generate energy based on occupancy and current level
     * Uses accumulator pattern to convert continuous rates to discrete units
     */
    update(deltaTime: number, sunEnergy: number = 0): void {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.tiles[x][y];
                this.updateTileEnergy(tile, deltaTime, sunEnergy);
            }
        }
    }
    
    /**
     * Update energy generation for a single tile using accumulator pattern
     */
    private updateTileEnergy(tile: Tile, deltaTime: number, sunEnergy: number = 0): void {
        // Determine base generation rate based on occupancy (units per second)
        const baseRate = tile.isEmpty 
            ? this.config.emptyTileEnergyRate 
            : this.config.occupiedTileEnergyRate;
        
        // Calculate actual rate with slowdown curve
        const currentSoilUnits = tile.getTotalEnergy();
        const actualRate = this.config.calculateGenerationRate(currentSoilUnits, baseRate);
        
        // Add fractional energy to accumulator
        const fractionalEnergy = actualRate * deltaTime;
        tile.soilEnergyAccumulator.add(fractionalEnergy);
        
        // Extract whole units from accumulator and add to tile
        const wholeUnits = tile.soilEnergyAccumulator.extractUnits();
        if (wholeUnits > 0) {
            tile.addEnergy(wholeUnits, this.config.maxTileEnergy, EnergyType.SOIL_UNIT);
        }
    }
    
    /**
     * Get all tiles in the garden (flat array)
     */
    getAllTiles(): Tile[] {
        const allTiles: Tile[] = [];
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                allTiles.push(this.tiles[x][y]);
            }
        }
        return allTiles;
    }
    
    /**
     * Get neighboring tiles (4-directional)
     */
    getNeighbors(x: number, y: number): Tile[] {
        const neighbors: Tile[] = [];
        const directions = [
            { dx: -1, dy: 0 },  // Left
            { dx: 1, dy: 0 },   // Right
            { dx: 0, dy: -1 },  // Up
            { dx: 0, dy: 1 }    // Down
        ];
        
        for (const dir of directions) {
            const tile = this.getTile(x + dir.dx, y + dir.dy);
            if (tile) {
                neighbors.push(tile);
            }
        }
        
        return neighbors;
    }
    
    /**
     * Get total energy in the garden (all types, all tiles)
     */
    getTotalEnergy(): number {
        let total = 0;
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                total += this.tiles[x][y].getTotalEnergy();
            }
        }
        return total;
    }
}
