import * as THREE from 'three';
import { Garden } from './Garden';
import { GameConfig } from './GameConfig';
import { GraphicsEngine } from './GraphicsEngine';
import { GameInfoDisplay } from './GameInfoDisplay';
import { SimulationEngine } from './fungus-sim/SimulationEngine';
import { Dna } from './fungus-sim/Dna';

/**
 * Game - Main game controller
 * Handles game logic, state management, and coordinates with GraphicsEngine for visuals
 * Sun energy is now delivered per-tile, not as a global pool
 */
export class Game {
    public config: GameConfig;
    public garden: Garden;
    private graphicsEngine: GraphicsEngine;
    private gameInfoDisplay: GameInfoDisplay;
    private simulationEngine: SimulationEngine;
    
    private clock: THREE.Clock;
    private lastDeltaTime: number = 0.016; // Track last deltaTime (default ~60fps)
    
    // Day-night cycle
    public timeInCycle: number = 0; // Current time within day-night cycle
    
    // Time speed control
    public timeSpeed: number = 1.0; // Multiplier for simulation speed (0 = pause, 0.5 = half speed, 2 = double speed, etc.)
    
    constructor() {
        this.config = new GameConfig();
        this.garden = new Garden(this.config);
        this.clock = new THREE.Clock();
        
        // Initialize graphics engine
        this.graphicsEngine = new GraphicsEngine(this.config, this.garden);
        
        // Initialize game info display
        this.gameInfoDisplay = new GameInfoDisplay();
        
        // Initialize simulation engine
        this.simulationEngine = new SimulationEngine(this.garden, this.config);
        
        // Create initial test fungi for demonstration
        this.createInitialFungi();
        
        // Start animation loop
        this.animate();
    }
    
    /**
     * Create initial test fungi for demonstration
     */
    private createInitialFungi(): void {
        // Photosynthesis build: 100 green, 10 red, 10 brown, rest distributed
        const remaining1 = Dna.TOTAL_POINTS - 100 - 10 - 10;
        const perTrait1 = Math.floor(remaining1 / 4);
        const lastTrait1 = remaining1 - (perTrait1 * 3);
        const greenDna = this.simulationEngine.createTestDna(100, 10, 10, perTrait1, perTrait1, perTrait1, lastTrait1);
        this.simulationEngine.createFungus(10, 10, greenDna);
        
        // Parasite build: 100 red, 10 green, 10 brown, rest distributed
        const remaining2 = Dna.TOTAL_POINTS - 10 - 100 - 10;
        const perTrait2 = Math.floor(remaining2 / 4);
        const lastTrait2 = remaining2 - (perTrait2 * 3);
        const redDna = this.simulationEngine.createTestDna(10, 100, 10, perTrait2, perTrait2, perTrait2, lastTrait2);
        this.simulationEngine.createFungus(15, 15, redDna);
        
        // Soil build: 100 brown, 10 green, 10 red, rest distributed
        const remaining3 = Dna.TOTAL_POINTS - 10 - 10 - 100;
        const perTrait3 = Math.floor(remaining3 / 4);
        const lastTrait3 = remaining3 - (perTrait3 * 3);
        const brownDna = this.simulationEngine.createTestDna(10, 10, 100, perTrait3, perTrait3, perTrait3, lastTrait3);
        this.simulationEngine.createFungus(5, 5, brownDna);
    }
    
    /**
     * Main animation loop
     */
    private animate(): void {
        requestAnimationFrame(() => this.animate());
        
        const rawDeltaTime = this.clock.getDelta();
        const deltaTime = rawDeltaTime * this.timeSpeed; // Apply time speed multiplier
        this.lastDeltaTime = deltaTime; // Store for access by other systems
        
        // Update day-night cycle time (only if not paused)
        if (this.timeSpeed > 0) {
            this.timeInCycle += deltaTime;
            if (this.timeInCycle >= this.config.dayDurationSeconds) {
                this.timeInCycle -= this.config.dayDurationSeconds;
            }
        }
        
        // Calculate current sun energy per tile (units per second per tile)
        const sunEnergyPerTile = this.config.calculateSunEnergy(this.timeInCycle);
        
        // Update simulation (fungus cells) - only if not paused
        if (this.timeSpeed > 0) {
            // Sun energy is delivered per tile, not globally
            // Each tile receives sun energy independently
            this.simulationEngine.update(deltaTime, sunEnergyPerTile);
        }
        
        // Calculate sun energy for lighting (continuous value for visuals)
        const sunEnergyForLighting = this.config.calculateSunEnergy(this.timeInCycle);
        
        // Update game logic (tile energy) - only if not paused
        if (this.timeSpeed > 0) {
            this.garden.update(deltaTime, sunEnergyForLighting);
        }
        
        // Update game info display
        this.gameInfoDisplay.update(this.timeInCycle, this.config, deltaTime);
        
        // Update graphics based on simulation state
        this.graphicsEngine.updateCellVisuals(this.simulationEngine);
        this.graphicsEngine.updateLighting(this.timeInCycle, sunEnergyForLighting);
        this.graphicsEngine.updateTileVisuals();
        this.graphicsEngine.render();
    }
    
    /**
     * Restart the garden with current config
     */
    public restart(): void {
        // Create new garden
        this.garden = new Garden(this.config);
        
        // Reset simulation engine
        this.simulationEngine = new SimulationEngine(this.garden, this.config);
        
        // Reset game info display
        this.gameInfoDisplay.resetDays();
        this.timeInCycle = 0;
        
        // Update graphics engine with new garden
        this.graphicsEngine.recreateTileMeshes(this.garden);
    }
    
    /**
     * Get simulation engine for external access
     */
    public getSimulation(): SimulationEngine {
        return this.simulationEngine;
    }
    
    /**
     * Get last frame's delta time
     */
    public getLastDeltaTime(): number {
        return this.lastDeltaTime;
    }
    
    /**
     * Set time speed multiplier
     */
    public setTimeSpeed(speed: number): void {
        this.timeSpeed = Math.max(0, speed); // Ensure non-negative
    }
    
    /**
     * Get current time speed
     */
    public getTimeSpeed(): number {
        return this.timeSpeed;
    }
}
