import { EnergyWallet, EnergyWalletHelper, EnergyType, EnergyAccumulator } from './fungus-sim/Energy';

/**
 * Tile - Represents a single pocket/tile in the garden grid
 * Each tile can store, generate, give, and receive energy
 * Now uses discrete energy units instead of continuous values
 */
export class Tile {
    // Position in grid
    public readonly x: number;
    public readonly y: number;
    
    // Energy storage (discrete units)
    public energyWallet: EnergyWallet;
    
    // Accumulator for converting continuous soil generation to discrete units
    public soilEnergyAccumulator: EnergyAccumulator;
    
    // Occupancy state
    public isEmpty: boolean = true;
    public occupiedBy: string | null = null; // ID of entity occupying this tile
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.energyWallet = EnergyWalletHelper.createEmpty();
        this.soilEnergyAccumulator = new EnergyAccumulator();
    }
    
    /**
     * Legacy property for backwards compatibility during migration
     * Returns total SOIL_UNIT count
     */
    get energy(): number {
        return EnergyWalletHelper.get(this.energyWallet, EnergyType.SOIL_UNIT);
    }
    
    /**
     * Legacy setter for backwards compatibility during migration
     */
    set energy(value: number) {
        EnergyWalletHelper.set(this.energyWallet, EnergyType.SOIL_UNIT, value);
    }
    
    /**
     * Add energy units to this tile (up to max capacity)
     * @param amount Number of units to add
     * @param maxCapacity Maximum total units across all types
     * @param type Type of energy to add (defaults to SOIL_UNIT)
     * @returns Amount of energy actually added
     */
    addEnergy(amount: number, maxCapacity: number, type: EnergyType = EnergyType.SOIL_UNIT): number {
        const totalUnits = EnergyWalletHelper.getTotalUnits(this.energyWallet);
        const availableSpace = maxCapacity - totalUnits;
        const actualAmount = Math.min(Math.floor(amount), availableSpace);
        
        if (actualAmount > 0) {
            EnergyWalletHelper.add(this.energyWallet, type, actualAmount);
        }
        
        return actualAmount;
    }
    
    /**
     * Remove energy units from this tile
     * @param amount Number of units to remove
     * @param type Type of energy to remove (defaults to SOIL_UNIT)
     * @returns Amount of energy actually removed
     */
    removeEnergy(amount: number, type: EnergyType = EnergyType.SOIL_UNIT): number {
        return EnergyWalletHelper.remove(this.energyWallet, type, amount);
    }
    
    /**
     * Transfer energy to another tile
     * @param targetTile Target tile to transfer to
     * @param amount Number of units to transfer
     * @param maxCapacity Maximum capacity of target tile
     * @param type Type of energy to transfer (defaults to SOIL_UNIT)
     * @returns Amount of energy actually transferred
     */
    transferEnergyTo(targetTile: Tile, amount: number, maxCapacity: number, type: EnergyType = EnergyType.SOIL_UNIT): number {
        return EnergyWalletHelper.transfer(
            this.energyWallet,
            targetTile.energyWallet,
            type,
            amount,
            maxCapacity
        );
    }
    
    /**
     * Set the occupancy state of this tile
     */
    setOccupied(entityId: string | null): void {
        if (entityId === null) {
            this.isEmpty = true;
            this.occupiedBy = null;
        } else {
            this.isEmpty = false;
            this.occupiedBy = entityId;
        }
    }
    
    /**
     * Get fill percentage (0-1) for a specific energy type
     */
    getFillRatio(maxCapacity: number, type?: EnergyType): number {
        if (type) {
            const amount = EnergyWalletHelper.get(this.energyWallet, type);
            return amount / maxCapacity;
        } else {
            const totalUnits = EnergyWalletHelper.getTotalUnits(this.energyWallet);
            return totalUnits / maxCapacity;
        }
    }
    
    /**
     * Get total units across all energy types
     */
    getTotalEnergy(): number {
        return EnergyWalletHelper.getTotalUnits(this.energyWallet);
    }
}
