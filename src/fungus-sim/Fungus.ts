import { Dna } from './Dna';
import { Cell } from './Cell';

/**
 * Fungus - A high-level organism composed of multiple cells
 * 
 * Acts as a container/manager for a colony of cells.
 * Holds the master DNA that all cells in this fungus share.
 */
export class Fungus {
    // Unique identifier for this fungus
    public readonly id: number;
    
    // Master DNA shared by all cells
    public readonly dna: Dna;
    
    // All cells that belong to this fungus
    private cells: Map<string, Cell> = new Map();
    
    // Generation counter (for tracking lineage)
    public readonly generation: number;
    
    // Static counter for unique IDs
    private static nextId: number = 0;
    
    constructor(dna: Dna, generation: number = 0) {
        this.id = Fungus.nextId++;
        this.dna = dna;
        this.generation = generation;
    }
    
    /**
     * Add a cell to this fungus
     */
    public addCell(cell: Cell): void {
        const key = cell.getPositionKey();
        this.cells.set(key, cell);
    }
    
    /**
     * Remove a cell from this fungus
     */
    public removeCell(cell: Cell): void {
        const key = cell.getPositionKey();
        this.cells.delete(key);
    }
    
    /**
     * Get a cell at a specific position
     */
    public getCellAt(x: number, y: number): Cell | undefined {
        return this.cells.get(`${x},${y}`);
    }
    
    /**
     * Get all cells belonging to this fungus
     */
    public getAllCells(): Cell[] {
        return Array.from(this.cells.values());
    }
    
    /**
     * Get the number of cells in this fungus
     */
    public getCellCount(): number {
        return this.cells.size;
    }
    
    /**
     * Check if this fungus is still alive (has at least one living cell)
     */
    public isAlive(): boolean {
        return this.getAllCells().some(cell => cell.isAlive());
    }
    
    /**
     * Get total energy across all cells
     */
    public getTotalEnergy(): number {
        return this.getAllCells().reduce((sum, cell) => sum + cell.getEnergy(), 0);
    }
    
    /**
     * Get average energy per cell
     */
    public getAverageEnergy(): number {
        const cells = this.getAllCells();
        if (cells.length === 0) return 0;
        return this.getTotalEnergy() / cells.length;
    }
    
    /**
     * Get total energy gained by all cells this frame
     */
    public getTotalEnergyGained(): number {
        return this.getAllCells().reduce((sum, cell) => {
            let cellTotal = 0;
            cell.energyGainedThisFrame.forEach(amount => cellTotal += amount);
            return sum + cellTotal;
        }, 0);
    }
    
    /**
     * Get total energy consumed by all cells this frame
     */
    public getTotalEnergyConsumed(): number {
        return this.getAllCells().reduce((sum, cell) => {
            let cellTotal = 0;
            cell.energyConsumedThisFrame.forEach(amount => cellTotal += amount);
            return sum + cellTotal;
        }, 0);
    }
    
    /**
     * Get net energy flow (gain - consumption)
     */
    public getNetEnergyFlow(): number {
        return this.getTotalEnergyGained() - this.getTotalEnergyConsumed();
    }
    
    /**
     * Remove all dead cells
     * @returns Number of cells removed
     */
    public removeDeadCells(): number {
        const deadCells = this.getAllCells().filter(cell => !cell.isAlive());
        deadCells.forEach(cell => this.removeCell(cell));
        return deadCells.length;
    }
    
    /**
     * Get color representation based on DNA
     */
    public getColor(): [number, number, number] {
        return this.dna.getDominantColor();
    }
    
    /**
     * Create a child fungus with mutated DNA
     */
    public createOffspring(mutationStrength: number = 0.1): Fungus {
        const mutatedDna = this.dna.mutate(mutationStrength);
        return new Fungus(mutatedDna, this.generation + 1);
    }
    
    /**
     * Get string representation
     */
    public toString(): string {
        return `Fungus[ID:${this.id} Gen:${this.generation} Cells:${this.getCellCount()} ${this.dna.toString()}]`;
    }
}
