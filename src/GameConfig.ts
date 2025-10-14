/**
 * GameConfig - User-modifiable settings for the entire game
 * All "fixed" numbers that control game behavior
 * Now uses discrete energy units instead of continuous values
 */
export class GameConfig {
    // Grid settings
    gridSize: number = 20;  // 20x20 grid (square)
    
    // Tile energy settings (scaled up 10x for discrete units)
    maxTileEnergy: number = 1000;  // Maximum SOIL_UNITs each tile can store
    
    // Energy generation settings (units per second)
    emptyTileEnergyRate: number = 10;   // SOIL_UNITs/sec when tile is empty
    occupiedTileEnergyRate: number = 5;  // SOIL_UNITs/sec when tile is occupied
    
    // Energy generation curve (slowdown as tile fills)
    // Formula: actualRate = baseRate × (1 - (currentEnergy / maxEnergy)^slowdownPower)
    generationSlowdownPower: number = 2.0; // Higher = faster slowdown as it fills
    
    // Day-Night Cycle settings
    dayDurationSeconds: number = 30;      // Duration of full day (day + night) in seconds
    dayNightRatio: number = 0.6;          // Ratio of day to full cycle (0.6 = 60% day, 40% night)
    maxSunEnergyEmission: number = 20;    // Maximum SUN_UNITs emitted per second at noon (scaled up 10x)
    
    // Simulation speed
    ticksPerSecond: number = 60;
    
    constructor() {
        // Default values set above
    }
    
    /**
     * Calculate actual energy generation rate based on current energy
     * Slows down as the tile approaches full capacity
     */
    calculateGenerationRate(currentEnergy: number, baseRate: number): number {
        const fillRatio = currentEnergy / this.maxTileEnergy;
        const slowdownFactor = Math.pow(fillRatio, this.generationSlowdownPower);
        return baseRate * (1 - slowdownFactor);
    }
    
    /**
     * Calculate sun energy emission based on time of day
     * Returns 0 during night, peaks at noon during day
     * Uses a smooth sine curve for realistic day progression
     */
    calculateSunEnergy(timeInCycle: number): number {
        const dayDuration = this.dayDurationSeconds * this.dayNightRatio;
        const nightDuration = this.dayDurationSeconds * (1 - this.dayNightRatio);
        
        // During day: use sine curve (0 at sunrise, peak at noon, 0 at sunset)
        if (timeInCycle < dayDuration) {
            const dayProgress = timeInCycle / dayDuration; // 0 to 1
            const sunAngle = dayProgress * Math.PI; // 0 to π
            return Math.sin(sunAngle) * this.maxSunEnergyEmission;
        }
        
        // During night: no sun energy
        return 0;
    }
    
    /**
     * Check if it's currently day or night
     */
    isDaytime(timeInCycle: number): boolean {
        const dayDuration = this.dayDurationSeconds * this.dayNightRatio;
        return timeInCycle < dayDuration;
    }
    
    /**
     * Get time of day as a string (for display)
     */
    getTimeOfDayString(timeInCycle: number): string {
        const dayDuration = this.dayDurationSeconds * this.dayNightRatio;
        
        if (timeInCycle < dayDuration) {
            const dayProgress = timeInCycle / dayDuration;
            if (dayProgress < 0.25) return "🌅 Dawn";
            if (dayProgress < 0.5) return "🌞 Morning";
            if (dayProgress < 0.75) return "☀️ Noon";
            return "🌇 Dusk";
        } else {
            return "🌙 Night";
        }
    }
}
