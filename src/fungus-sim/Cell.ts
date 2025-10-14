import { Fungus } from './Fungus';
import { EnergyWallet, EnergyWalletHelper, EnergyType, EnergyAccumulator } from './Energy';

/**
 * Cell - The fundamental building block of a fungus organism
 * 
 * Each cell is an autonomous unit that occupies a single grid tile.
 * It has its own energy wallet that stores discrete units of different energy types.
 * It shares DNA with its parent fungus.
 */
export class Cell {
    // Position on the grid
    public readonly x: number;
    public readonly y: number;
    
    // Reference to parent fungus (for accessing DNA)
    public readonly fungus: Fungus;
    
    // Energy state (discrete units)
    private energyWallet: EnergyWallet;
    private maxEnergyCapacity: number = 1000; // Total units across all types, calculated from Pink DNA
    
    // Accumulators for fractional energy rates
    public metabolismAccumulator: EnergyAccumulator = new EnergyAccumulator();
    public soilAbsorptionAccumulator: EnergyAccumulator = new EnergyAccumulator();
    public photosynthesisAccumulator: EnergyAccumulator = new EnergyAccumulator();
    public parasitismAccumulator: EnergyAccumulator = new EnergyAccumulator();
    
    // Continuous rates for UI display (units per frame)
    public metabolismRateThisFrame: number = 0;
    public soilAbsorptionRateThisFrame: number = 0;
    public photosynthesisRateThisFrame: number = 0;
    public parasitismRateThisFrame: number = 0;
    
    // Energy flow tracking (for display) - now tracks by type
    public energyGainedThisFrame: Map<EnergyType, number> = new Map();
    public energyConsumedThisFrame: Map<EnergyType, number> = new Map();
    public energyGainBreakdown: { [key: string]: Map<EnergyType, number> } = {}; // Breakdown by source and type
    public energyConsumeBreakdown: { [key: string]: Map<EnergyType, number> } = {}; // Breakdown by use and type
    
    // Cell state
    private alive: boolean = true;
    
    // Mushroom state (for reproduction) - public for graphics access
    public hasMushroom: boolean = false;
    public mushroomGrowth: number = 0; // 0 to 1
    
    constructor(x: number, y: number, fungus: Fungus, initialEnergy: number = 50) {
        this.x = x;
        this.y = y;
        this.fungus = fungus;
        
        // Initialize energy wallet
        this.energyWallet = EnergyWalletHelper.createEmpty();
        
        // Calculate max energy capacity based on Pink DNA
        this.updateMaxEnergy();
        
        // Set initial energy as NUTRITION_UNIT (clamped to max)
        const initial = Math.min(Math.floor(initialEnergy), this.maxEnergyCapacity);
        EnergyWalletHelper.set(this.energyWallet, EnergyType.NUTRITION_UNIT, initial);
    }
    
    /**
     * Update max energy capacity based on Pink DNA trait
     * Now represents total units across all types
     */
    private updateMaxEnergy(): void {
        // Pink DNA directly determines energy storage capacity
        // Range: 300 (if Pink=0) to 3000 (if Pink=100)
        // Scaled up 10x from old system for discrete units
        const pinkRatio = this.fungus.dna.pink / 100;
        this.maxEnergyCapacity = 300 + (pinkRatio * 2700);
    }
    
    /**
     * Get current total energy level (all types combined)
     */
    public getEnergy(): number {
        return EnergyWalletHelper.getTotalUnits(this.energyWallet);
    }
    
    /**
     * Get energy of a specific type
     */
    public getEnergyOfType(type: EnergyType): number {
        return EnergyWalletHelper.get(this.energyWallet, type);
    }
    
    /**
     * Get the energy wallet (for direct access)
     */
    public getEnergyWallet(): EnergyWallet {
        return this.energyWallet;
    }
    
    /**
     * Get maximum energy capacity (total units across all types)
     */
    public getMaxEnergy(): number {
        return this.maxEnergyCapacity;
    }
    
    /**
     * Get energy fill ratio (0.0 to 1.0)
     */
    public getEnergyRatio(): number {
        const total = this.getEnergy();
        return total / this.maxEnergyCapacity;
    }
    
    /**
     * Add energy units to this cell
     * @param amount Number of units to add
     * @param type Type of energy to add
     * @returns Amount actually added (may be less if at max capacity)
     */
    public addEnergy(amount: number, type: EnergyType = EnergyType.NUTRITION_UNIT): number {
        const actualAdded = EnergyWalletHelper.add(this.energyWallet, type, amount, this.maxEnergyCapacity);
        
        // Track energy gain by type
        const currentGain = this.energyGainedThisFrame.get(type) || 0;
        this.energyGainedThisFrame.set(type, currentGain + actualAdded);
        
        return actualAdded;
    }
    
    /**
     * Add energy with source tracking
     */
    public addEnergyFromSource(amount: number, source: string, type: EnergyType = EnergyType.NUTRITION_UNIT): number {
        const actualAdded = this.addEnergy(amount, type);
        
        // Track by source and type
        if (!this.energyGainBreakdown[source]) {
            this.energyGainBreakdown[source] = new Map<EnergyType, number>();
        }
        const currentSourceGain = this.energyGainBreakdown[source].get(type) || 0;
        this.energyGainBreakdown[source].set(type, currentSourceGain + actualAdded);
        
        return actualAdded;
    }
    
    /**
     * Remove energy units from this cell
     * @param amount Number of units to remove
     * @param type Type of energy to remove (defaults to NUTRITION_UNIT)
     * @returns Amount actually removed (may be less if insufficient energy)
     */
    public removeEnergy(amount: number, type: EnergyType = EnergyType.NUTRITION_UNIT): number {
        const actualRemoved = EnergyWalletHelper.remove(this.energyWallet, type, amount);
        
        // Track energy consumption by type
        const currentConsume = this.energyConsumedThisFrame.get(type) || 0;
        this.energyConsumedThisFrame.set(type, currentConsume + actualRemoved);
        
        // Check for death - if all energy types are depleted
        if (this.getEnergy() === 0) {
            this.die();
        }
        
        return actualRemoved;
    }
    
    /**
     * Remove energy with purpose tracking
     */
    public removeEnergyForPurpose(amount: number, purpose: string, type: EnergyType = EnergyType.NUTRITION_UNIT): number {
        const actualRemoved = this.removeEnergy(amount, type);
        
        // Track by purpose and type
        if (!this.energyConsumeBreakdown[purpose]) {
            this.energyConsumeBreakdown[purpose] = new Map<EnergyType, number>();
        }
        const currentPurposeConsume = this.energyConsumeBreakdown[purpose].get(type) || 0;
        this.energyConsumeBreakdown[purpose].set(type, currentPurposeConsume + actualRemoved);
        
        return actualRemoved;
    }
    
    /**
     * Reset energy flow tracking (call each frame)
     */
    public resetEnergyTracking(): void {
        this.energyGainedThisFrame.clear();
        this.energyConsumedThisFrame.clear();
        this.energyGainBreakdown = {};
        this.energyConsumeBreakdown = {};
    }
    
    /**
     * Set energy directly (used for energy transfers)
     * Note: This is deprecated in favor of wallet-based operations
     */
    public setEnergy(amount: number, type: EnergyType = EnergyType.NUTRITION_UNIT): void {
        // Clear the wallet and set specified amount
        EnergyWalletHelper.set(this.energyWallet, type, Math.min(amount, this.maxEnergyCapacity));
        
        if (this.getEnergy() === 0) {
            this.die();
        }
    }
    
    /**
     * Check if cell is alive
     */
    public isAlive(): boolean {
        return this.alive;
    }
    
    /**
     * Kill this cell
     */
    public die(): void {
        this.alive = false;
        // Clear all energy
        this.energyWallet.clear();
        this.energyWallet = EnergyWalletHelper.createEmpty();
    }
    
    /**
     * Check if cell is at maximum energy capacity and return overflow
     */
    public isFull(): number {
        const total = this.getEnergy();
        return total >= this.maxEnergyCapacity ? total - this.maxEnergyCapacity : 0;
    }
    
    /**
     * Check how much energy capacity is remaining
     */
    public getEnergyDeficit(): number {
        return this.maxEnergyCapacity - this.getEnergy();
    }
    
    /**
     * Check if cell has a mushroom growing
     */
    public hasMush(): boolean {
        return this.hasMushroom;
    }
    
    /**
     * Get mushroom growth progress (0.0 to 1.0)
     */
    public getMushroomGrowth(): number {
        return this.mushroomGrowth;
    }
    
    /**
     * Start growing a mushroom
     */
    public startMushroom(): void {
        this.hasMushroom = true;
        this.mushroomGrowth = 0;
    }
    
    /**
     * Update mushroom growth
     * @param amount - Growth amount to add (0.0 to 1.0)
     */
    public growMushroom(amount: number): void {
        if (this.hasMushroom) {
            this.mushroomGrowth = Math.min(1.0, this.mushroomGrowth + amount);
        }
    }
    
    /**
     * Check if mushroom is fully grown
     */
    public isMushroomMature(): boolean {
        return this.hasMushroom && this.mushroomGrowth >= 1.0;
    }
    
    /**
     * Remove mushroom (after spore release)
     */
    public removeMushroom(): void {
        this.hasMushroom = false;
        this.mushroomGrowth = 0;
    }
    
    /**
     * Get position as string key for maps
     */
    public getPositionKey(): string {
        return `${this.x},${this.y}`;
    }
    
    /**
     * Get string representation
     */
    public toString(): string {
        const total = this.getEnergy();
        return `Cell(${this.x},${this.y}) E:${total}/${this.maxEnergyCapacity} ${this.alive ? 'Alive' : 'Dead'}`;
    }
}
