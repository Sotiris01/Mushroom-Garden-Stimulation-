/**
 * Energy.ts - Central definition of energy types and storage for the simulation
 * 
 * This module defines a discrete, quantized energy system with multiple distinct
 * types of energy units instead of a continuous single-resource model.
 */

/**
 * Enumeration of all energy types available in the simulation
 */
export enum EnergyType {
    SUN_UNIT = 'SUN_UNIT',           // Energy from photosynthesis/sunlight
    SOIL_UNIT = 'SOIL_UNIT',         // Energy from soil nutrients
    NUTRITION_UNIT = 'NUTRITION_UNIT' // Refined energy created by cells (converted from sun+soil)
}

/**
 * Type definition for an energy wallet that can hold multiple energy types
 * Maps each energy type to an integer quantity
 */
export type EnergyWallet = Map<EnergyType, number>;

/**
 * Helper functions for working with energy wallets
 */
export class EnergyWalletHelper {
    /**
     * Create a new empty energy wallet
     */
    static createEmpty(): EnergyWallet {
        const wallet = new Map<EnergyType, number>();
        wallet.set(EnergyType.SUN_UNIT, 0);
        wallet.set(EnergyType.SOIL_UNIT, 0);
        wallet.set(EnergyType.NUTRITION_UNIT, 0);
        return wallet;
    }

    /**
     * Get the amount of a specific energy type in a wallet
     */
    static get(wallet: EnergyWallet, type: EnergyType): number {
        return wallet.get(type) || 0;
    }

    /**
     * Set the amount of a specific energy type in a wallet
     */
    static set(wallet: EnergyWallet, type: EnergyType, amount: number): void {
        wallet.set(type, Math.max(0, Math.floor(amount)));
    }

    /**
     * Add units to a wallet, returns actual amount added (respecting capacity)
     */
    static add(wallet: EnergyWallet, type: EnergyType, amount: number, maxCapacity?: number): number {
        const current = this.get(wallet, type);
        const toAdd = Math.floor(amount);
        
        if (maxCapacity !== undefined) {
            const totalUnits = this.getTotalUnits(wallet);
            const available = maxCapacity - totalUnits;
            const actualAdd = Math.min(toAdd, available);
            wallet.set(type, current + actualAdd);
            return actualAdd;
        } else {
            wallet.set(type, current + toAdd);
            return toAdd;
        }
    }

    /**
     * Remove units from a wallet, returns actual amount removed
     */
    static remove(wallet: EnergyWallet, type: EnergyType, amount: number): number {
        const current = this.get(wallet, type);
        const toRemove = Math.floor(amount);
        const actualRemove = Math.min(toRemove, current);
        wallet.set(type, current - actualRemove);
        return actualRemove;
    }

    /**
     * Check if wallet has at least the specified amount of a type
     */
    static has(wallet: EnergyWallet, type: EnergyType, amount: number): boolean {
        return this.get(wallet, type) >= Math.floor(amount);
    }

    /**
     * Get total number of units across all types
     */
    static getTotalUnits(wallet: EnergyWallet): number {
        let total = 0;
        wallet.forEach(amount => total += amount);
        return total;
    }

    /**
     * Transfer units from one wallet to another
     * Returns actual amount transferred
     */
    static transfer(
        fromWallet: EnergyWallet, 
        toWallet: EnergyWallet, 
        type: EnergyType, 
        amount: number,
        toMaxCapacity?: number
    ): number {
        const removed = this.remove(fromWallet, type, amount);
        const added = this.add(toWallet, type, removed, toMaxCapacity);
        
        // If we couldn't add all that was removed, return the excess
        if (added < removed) {
            this.add(fromWallet, type, removed - added);
        }
        
        return added;
    }

    /**
     * Clone a wallet
     */
    static clone(wallet: EnergyWallet): EnergyWallet {
        const newWallet = new Map<EnergyType, number>();
        wallet.forEach((amount, type) => newWallet.set(type, amount));
        return newWallet;
    }

    /**
     * Convert wallet to a plain object for serialization
     */
    static toObject(wallet: EnergyWallet): Record<string, number> {
        const obj: Record<string, number> = {};
        wallet.forEach((amount, type) => {
            obj[type] = amount;
        });
        return obj;
    }

    /**
     * Create wallet from a plain object
     */
    static fromObject(obj: Record<string, number>): EnergyWallet {
        const wallet = this.createEmpty();
        Object.entries(obj).forEach(([type, amount]) => {
            if (Object.values(EnergyType).includes(type as EnergyType)) {
                wallet.set(type as EnergyType, Math.floor(amount));
            }
        });
        return wallet;
    }
}

/**
 * Energy accumulator for converting continuous rates to discrete units
 */
export class EnergyAccumulator {
    private value: number = 0;

    /**
     * Add fractional energy to the accumulator
     */
    add(amount: number): void {
        this.value += amount;
    }

    /**
     * Extract whole units and return them, keeping the fractional remainder
     * @returns Number of whole units accumulated
     */
    extractUnits(): number {
        const units = Math.floor(this.value);
        this.value -= units;
        return units;
    }

    /**
     * Get current accumulator value (for debugging)
     */
    getValue(): number {
        return this.value;
    }

    /**
     * Reset the accumulator
     */
    reset(): void {
        this.value = 0;
    }
}
