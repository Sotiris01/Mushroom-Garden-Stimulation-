/**
 * DNA - Genetic code for a fungus organism
 * 
 * Manages a distribution of 100 points across seven color-based traits.
 * Each trait influences specific behaviors of the fungus cells.
 */
export class Dna {
    // Total points that DNA must sum to (configurable)
    public static TOTAL_POINTS = 250;
    
    // Maximum points allowed in a single trait
    public static MAX_TRAIT_VALUE = 100;
    
    // DNA Traits (color-based)
    public green: number;   // Photosynthesis efficiency (energy from sun)
    public red: number;     // Parasitism strength (drain from other fungi)
    public brown: number;   // Soil absorption rate (energy from tile)
    public yellow: number;  // Metabolism efficiency (survival, lower drain)
    public pink: number;    // Energy storage capacity (battery size)
    public blue: number;    // Expansion efficiency (cost to grow new cells)
    public purple: number;  // Reproduction efficiency (cost to create mushrooms/spores)
    
    constructor(
        green: number = 15,
        red: number = 10,
        brown: number = 15,
        yellow: number = 15,
        pink: number = 15,
        blue: number = 15,
        purple: number = 15
    ) {
        this.green = green;
        this.red = red;
        this.brown = brown;
        this.yellow = yellow;
        this.pink = pink;
        this.blue = blue;
        this.purple = purple;
        
        // Normalize to ensure total is exactly 100
        this.normalize();
    }
    
    /**
     * Normalize all trait values to sum to exactly TOTAL_POINTS
     * Also enforces MAX_TRAIT_VALUE cap on individual traits
     */
    private normalize(): void {
        const total = this.green + this.red + this.brown + this.yellow + 
                     this.pink + this.blue + this.purple;
        
        if (total === 0) {
            // If all zeros, distribute evenly
            const perTrait = Math.min(Dna.TOTAL_POINTS / 7, Dna.MAX_TRAIT_VALUE);
            this.green = this.red = this.brown = this.yellow = 
            this.pink = this.blue = this.purple = perTrait;
        } else if (total !== Dna.TOTAL_POINTS) {
            // Scale proportionally to reach TOTAL_POINTS
            const scale = Dna.TOTAL_POINTS / total;
            this.green = Math.round(this.green * scale);
            this.red = Math.round(this.red * scale);
            this.brown = Math.round(this.brown * scale);
            this.yellow = Math.round(this.yellow * scale);
            this.pink = Math.round(this.pink * scale);
            this.blue = Math.round(this.blue * scale);
            this.purple = Math.round(this.purple * scale);
            
            // Enforce cap on each trait
            this.green = Math.min(this.green, Dna.MAX_TRAIT_VALUE);
            this.red = Math.min(this.red, Dna.MAX_TRAIT_VALUE);
            this.brown = Math.min(this.brown, Dna.MAX_TRAIT_VALUE);
            this.yellow = Math.min(this.yellow, Dna.MAX_TRAIT_VALUE);
            this.pink = Math.min(this.pink, Dna.MAX_TRAIT_VALUE);
            this.blue = Math.min(this.blue, Dna.MAX_TRAIT_VALUE);
            this.purple = Math.min(this.purple, Dna.MAX_TRAIT_VALUE);
            
            // Recalculate total after capping
            const cappedTotal = this.green + this.red + this.brown + this.yellow + 
                              this.pink + this.blue + this.purple;
            const diff = Dna.TOTAL_POINTS - cappedTotal;
            
            if (diff !== 0) {
                // Distribute the difference to traits that are below the cap
                // Sort traits by value (ascending) to fill lowest first
                const traits = [
                    { name: 'green', value: this.green },
                    { name: 'red', value: this.red },
                    { name: 'brown', value: this.brown },
                    { name: 'yellow', value: this.yellow },
                    { name: 'pink', value: this.pink },
                    { name: 'blue', value: this.blue },
                    { name: 'purple', value: this.purple }
                ];
                traits.sort((a, b) => a.value - b.value);
                
                let remaining = diff;
                for (const trait of traits) {
                    if (remaining === 0) break;
                    
                    const currentValue = this.getTraitValue(trait.name);
                    const availableSpace = Dna.MAX_TRAIT_VALUE - currentValue;
                    const toAdd = Math.min(Math.abs(remaining), availableSpace) * Math.sign(remaining);
                    
                    this.setTraitValue(trait.name, currentValue + toAdd);
                    remaining -= toAdd;
                }
            }
        }
    }
    
    /**
     * Helper to get trait value by name
     */
    private getTraitValue(name: string): number {
        switch(name) {
            case 'green': return this.green;
            case 'red': return this.red;
            case 'brown': return this.brown;
            case 'yellow': return this.yellow;
            case 'pink': return this.pink;
            case 'blue': return this.blue;
            case 'purple': return this.purple;
            default: return 0;
        }
    }
    
    /**
     * Helper to set trait value by name
     */
    private setTraitValue(name: string, value: number): void {
        switch(name) {
            case 'green': this.green = value; break;
            case 'red': this.red = value; break;
            case 'brown': this.brown = value; break;
            case 'yellow': this.yellow = value; break;
            case 'pink': this.pink = value; break;
            case 'blue': this.blue = value; break;
            case 'purple': this.purple = value; break;
        }
    }
    
    /**
     * Create a mutated copy of this DNA for offspring
     * Applies small random changes while maintaining TOTAL_POINTS total
     * Also enforces MAX_TRAIT_VALUE cap on individual traits
     * 
     * @param mutationStrength - How much variation (0.0 to 1.0, default 0.1)
     * @returns A new mutated DNA instance
     */
    public mutate(mutationStrength: number = 0.1): Dna {
        const maxChange = Math.floor(Dna.TOTAL_POINTS * mutationStrength);
        
        // Create array of current traits
        const traits = [
            this.green,
            this.red,
            this.brown,
            this.yellow,
            this.pink,
            this.blue,
            this.purple
        ];
        
        // Apply mutations by transferring points between random traits
        const numMutations = Math.floor(Math.random() * 3) + 1; // 1-3 mutations
        
        for (let i = 0; i < numMutations; i++) {
            // Pick two different random traits
            const fromIndex = Math.floor(Math.random() * 7);
            let toIndex = Math.floor(Math.random() * 7);
            while (toIndex === fromIndex) {
                toIndex = Math.floor(Math.random() * 7);
            }
            
            // Check if target trait is already at max
            if (traits[toIndex] >= Dna.MAX_TRAIT_VALUE) continue;
            
            // Transfer a random amount of points
            const transferAmount = Math.floor(Math.random() * maxChange) + 1;
            const actualTransfer = Math.min(
                transferAmount, 
                traits[fromIndex],
                Dna.MAX_TRAIT_VALUE - traits[toIndex] // Don't exceed cap
            );
            
            traits[fromIndex] -= actualTransfer;
            traits[toIndex] += actualTransfer;
        }
        
        // Create new DNA with mutated values
        return new Dna(
            traits[0], // green
            traits[1], // red
            traits[2], // brown
            traits[3], // yellow
            traits[4], // pink
            traits[5], // blue
            traits[6]  // purple
        );
    }
    
    /**
     * Create a clone of this DNA (exact copy)
     */
    public clone(): Dna {
        return new Dna(
            this.green,
            this.red,
            this.brown,
            this.yellow,
            this.pink,
            this.blue,
            this.purple
        );
    }
    
    /**
     * Get a color representation of this DNA's dominant traits
     * Returns RGB color based on weighted trait values
     */
    public getDominantColor(): [number, number, number] {
        // Map DNA traits to RGB components
        const r = (this.red + this.pink) / 2;
        const g = (this.green + this.yellow) / 2;
        const b = (this.blue + this.purple + this.brown) / 3;
        
        // Normalize to 0-255 range
        const total = r + g + b;
        const scale = 255 / total;
        
        return [
            Math.floor(r * scale) / 255,
            Math.floor(g * scale) / 255,
            Math.floor(b * scale) / 255
        ];
    }
    
    /**
     * Get total points (should always be 100)
     */
    public getTotal(): number {
        return this.green + this.red + this.brown + this.yellow + 
               this.pink + this.blue + this.purple;
    }
    
    /**
     * Get a string representation of the DNA
     */
    public toString(): string {
        return `DNA[G:${this.green} R:${this.red} B:${this.brown} Y:${this.yellow} P:${this.pink} Bl:${this.blue} Pu:${this.purple}] = ${this.getTotal()}`;
    }
}
