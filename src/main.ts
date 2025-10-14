import { Game } from './Game';
import { Dna } from './fungus-sim/Dna';

// Create game instance
const game = new Game();

// Expose to window for debugging
declare global {
    interface Window {
        game: Game;
    }
}
window.game = game;

// Connect UI controls to game config
function setupControls() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate clicked tab
            button.classList.add('active');
            document.getElementById(targetTab!)?.classList.add('active');
        });
    });
    
    // Grid Size
    const gridSizeSlider = document.getElementById('ctrl-grid-size') as HTMLInputElement;
    const gridSizeValue = document.getElementById('val-grid-size')!;
    
    gridSizeSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        gridSizeValue.textContent = value.toString();
        game.config.gridSize = value;
    });
    
    // Max Energy
    const maxEnergySlider = document.getElementById('ctrl-max-energy') as HTMLInputElement;
    const maxEnergyValue = document.getElementById('val-max-energy')!;
    
    maxEnergySlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        maxEnergyValue.textContent = value.toString();
        game.config.maxTileEnergy = value;
    });
    
    // Empty Tile Rate
    const emptyRateSlider = document.getElementById('ctrl-empty-rate') as HTMLInputElement;
    const emptyRateValue = document.getElementById('val-empty-rate')!;
    
    emptyRateSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        emptyRateValue.textContent = value.toFixed(1);
        game.config.emptyTileEnergyRate = value;
    });
    
    // Occupied Tile Rate
    const occupiedRateSlider = document.getElementById('ctrl-occupied-rate') as HTMLInputElement;
    const occupiedRateValue = document.getElementById('val-occupied-rate')!;
    
    occupiedRateSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        occupiedRateValue.textContent = value.toFixed(1);
        game.config.occupiedTileEnergyRate = value;
    });
    
    // Slowdown Power
    const slowdownSlider = document.getElementById('ctrl-slowdown') as HTMLInputElement;
    const slowdownValue = document.getElementById('val-slowdown')!;
    
    slowdownSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        slowdownValue.textContent = value.toFixed(1);
        game.config.generationSlowdownPower = value;
    });
    
    // Day Duration
    const dayDurationSlider = document.getElementById('ctrl-day-duration') as HTMLInputElement;
    const dayDurationValue = document.getElementById('val-day-duration')!;
    
    dayDurationSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        dayDurationValue.textContent = value.toString();
        game.config.dayDurationSeconds = value;
        updateDayNightInfo();
    });
    
    // Day/Night Ratio
    const dayRatioSlider = document.getElementById('ctrl-day-ratio') as HTMLInputElement;
    const dayRatioValue = document.getElementById('val-day-ratio')!;
    
    dayRatioSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        dayRatioValue.textContent = `${Math.round(value * 100)}%`;
        game.config.dayNightRatio = value;
        updateDayNightInfo();
    });
    
    // Sun Emission
    const sunEmissionSlider = document.getElementById('ctrl-sun-emission') as HTMLInputElement;
    const sunEmissionValue = document.getElementById('val-sun-emission')!;
    
    sunEmissionSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        sunEmissionValue.textContent = value.toFixed(1);
        game.config.maxSunEnergyEmission = value;
    });
    
    // Restart Button
    const restartButton = document.getElementById('btn-restart')!;
    restartButton.addEventListener('click', () => {
        game.restart();
    });
    
    // Reset Config Button
    const resetButton = document.getElementById('btn-reset-config')!;
    resetButton.addEventListener('click', () => {
        // Reset to defaults
        game.config = new (game.config.constructor as any)();
        
        // Update UI - Grid & Energy Tab
        gridSizeSlider.value = game.config.gridSize.toString();
        gridSizeValue.textContent = game.config.gridSize.toString();
        
        maxEnergySlider.value = game.config.maxTileEnergy.toString();
        maxEnergyValue.textContent = game.config.maxTileEnergy.toString();
        
        emptyRateSlider.value = game.config.emptyTileEnergyRate.toString();
        emptyRateValue.textContent = game.config.emptyTileEnergyRate.toFixed(1);
        
        occupiedRateSlider.value = game.config.occupiedTileEnergyRate.toString();
        occupiedRateValue.textContent = game.config.occupiedTileEnergyRate.toFixed(1);
        
        slowdownSlider.value = game.config.generationSlowdownPower.toString();
        slowdownValue.textContent = game.config.generationSlowdownPower.toFixed(1);
        
        // Update UI - Day-Night Tab
        dayDurationSlider.value = game.config.dayDurationSeconds.toString();
        dayDurationValue.textContent = game.config.dayDurationSeconds.toString();
        
        dayRatioSlider.value = game.config.dayNightRatio.toString();
        dayRatioValue.textContent = `${Math.round(game.config.dayNightRatio * 100)}%`;
        
        sunEmissionSlider.value = game.config.maxSunEnergyEmission.toString();
        sunEmissionValue.textContent = game.config.maxSunEnergyEmission.toFixed(1);
        
        updateDayNightInfo();
        
        // Restart with new config
        game.restart();
    });
    
    // === SIMULATION TAB CONTROLS ===
    
    const simulationEngine = game.getSimulation();
    
    // Metabolism Drain
    const metabolismSlider = document.getElementById('ctrl-metabolism-drain') as HTMLInputElement;
    const metabolismValue = document.getElementById('val-metabolism-drain')!;
    metabolismSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        metabolismValue.textContent = value.toFixed(1);
        simulationEngine.baseMetabolicDrain = value;
    });
    
    // Energy Sharing Rate
    const sharingRateSlider = document.getElementById('ctrl-sharing-rate') as HTMLInputElement;
    const sharingRateValue = document.getElementById('val-sharing-rate')!;
    sharingRateSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        sharingRateValue.textContent = value.toFixed(0);
        simulationEngine.energySharingRate = value;
    });
    
    // Max Photosynthesis Rate
    const photosynthesisSlider = document.getElementById('ctrl-photosynthesis-rate') as HTMLInputElement;
    const photosynthesisValue = document.getElementById('val-photosynthesis-rate')!;
    photosynthesisSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        photosynthesisValue.textContent = value.toFixed(1);
        simulationEngine.maxPhotosynthesisRate = value;
    });
    
    // Max Soil Absorption Rate
    const soilRateSlider = document.getElementById('ctrl-soil-rate') as HTMLInputElement;
    const soilRateValue = document.getElementById('val-soil-rate')!;
    soilRateSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        soilRateValue.textContent = value.toFixed(1);
        simulationEngine.maxSoilAbsorptionRate = value;
    });
    
    // Max Parasitism Rate
    const parasitismSlider = document.getElementById('ctrl-parasitism-rate') as HTMLInputElement;
    const parasitismValue = document.getElementById('val-parasitism-rate')!;
    parasitismSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        parasitismValue.textContent = value.toFixed(1);
        simulationEngine.maxParasitismRate = value;
    });
    
    // Expansion Cost
    const expansionCostSlider = document.getElementById('ctrl-expansion-cost') as HTMLInputElement;
    const expansionCostValue = document.getElementById('val-expansion-cost')!;
    expansionCostSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        expansionCostValue.textContent = value.toFixed(0);
        simulationEngine.expansionEnergyCost = value;
    });
    
    // Mushroom Cost
    const mushroomCostSlider = document.getElementById('ctrl-mushroom-cost') as HTMLInputElement;
    const mushroomCostValue = document.getElementById('val-mushroom-cost')!;
    mushroomCostSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        mushroomCostValue.textContent = value.toFixed(0);
        simulationEngine.mushroomEnergyCost = value;
    });
    
    // Mushroom Growth Rate
    const mushroomGrowthSlider = document.getElementById('ctrl-mushroom-growth') as HTMLInputElement;
    const mushroomGrowthValue = document.getElementById('val-mushroom-growth')!;
    mushroomGrowthSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        mushroomGrowthValue.textContent = value.toFixed(2);
        simulationEngine.mushroomGrowthRate = value;
    });
    
    // Spore Count
    const sporeCountSlider = document.getElementById('ctrl-spore-count') as HTMLInputElement;
    const sporeCountValue = document.getElementById('val-spore-count')!;
    sporeCountSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        sporeCountValue.textContent = value.toString();
        simulationEngine.sporeCount = value;
    });
    
    // Spore Radius
    const sporeRadiusSlider = document.getElementById('ctrl-spore-radius') as HTMLInputElement;
    const sporeRadiusValue = document.getElementById('val-spore-radius')!;
    sporeRadiusSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        sporeRadiusValue.textContent = value.toString();
        simulationEngine.sporeScatterRadius = value;
    });
    
    // Spore Lifetime
    const sporeLifetimeSlider = document.getElementById('ctrl-spore-lifetime') as HTMLInputElement;
    const sporeLifetimeValue = document.getElementById('val-spore-lifetime')!;
    sporeLifetimeSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        sporeLifetimeValue.textContent = value.toString();
        simulationEngine.sporeLifetime = value;
    });
    
    // Mutation Strength
    const mutationStrengthSlider = document.getElementById('ctrl-mutation-strength') as HTMLInputElement;
    const mutationStrengthValue = document.getElementById('val-mutation-strength')!;
    mutationStrengthSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        mutationStrengthValue.textContent = `${Math.round(value * 100)}%`;
        simulationEngine.mutationStrength = value;
    });
    
    // Total DNA Points
    const totalDnaPointsSlider = document.getElementById('ctrl-total-dna-points') as HTMLInputElement;
    const totalDnaPointsValue = document.getElementById('val-total-dna-points')!;
    totalDnaPointsSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        totalDnaPointsValue.textContent = value.toString();
        Dna.TOTAL_POINTS = value;
        // Update the New Fungi tab display
        if (typeof updateDnaTotal === 'function') {
            updateDnaTotal();
        }
    });
    
    // Reset Simulation Parameters
    const resetSimulationButton = document.getElementById('btn-reset-simulation')!;
    resetSimulationButton.addEventListener('click', () => {
        // Reset to default values
        simulationEngine.baseMetabolicDrain = 0.5;
        simulationEngine.energySharingRate = 10;
        simulationEngine.maxPhotosynthesisRate = 2.0;
        simulationEngine.maxSoilAbsorptionRate = 2.0;
        simulationEngine.maxParasitismRate = 1.0;
        simulationEngine.expansionEnergyCost = 30;
        simulationEngine.mushroomEnergyCost = 40;
        simulationEngine.mushroomGrowthRate = 0.2;
        simulationEngine.sporeCount = 5;
        simulationEngine.sporeScatterRadius = 3;
        simulationEngine.sporeLifetime = 10;
        simulationEngine.mutationStrength = 0.15;
        Dna.TOTAL_POINTS = 100;
        
        // Update UI
        metabolismSlider.value = '0.5';
        metabolismValue.textContent = '0.5';
        
        sharingRateSlider.value = '10';
        sharingRateValue.textContent = '10';
        
        photosynthesisSlider.value = '2.0';
        photosynthesisValue.textContent = '2.0';
        
        soilRateSlider.value = '2.0';
        soilRateValue.textContent = '2.0';
        
        parasitismSlider.value = '1.0';
        parasitismValue.textContent = '1.0';
        
        expansionCostSlider.value = '30';
        expansionCostValue.textContent = '30';
        
        mushroomCostSlider.value = '40';
        mushroomCostValue.textContent = '40';
        
        mushroomGrowthSlider.value = '0.2';
        mushroomGrowthValue.textContent = '0.20';
        
        sporeCountSlider.value = '5';
        sporeCountValue.textContent = '5';
        
        sporeRadiusSlider.value = '3';
        sporeRadiusValue.textContent = '3';
        
        sporeLifetimeSlider.value = '10';
        sporeLifetimeValue.textContent = '10';
        
        mutationStrengthSlider.value = '0.15';
        mutationStrengthValue.textContent = '15%';
        
        totalDnaPointsSlider.value = '100';
        totalDnaPointsValue.textContent = '100';
        
        // Update the New Fungi tab display
        if (typeof updateDnaTotal === 'function') {
            updateDnaTotal();
        }
    });
    
    // === FUNGI TAB CONTROLS ===
    
    // DNA Sliders
    const dnaSliders = {
        green: document.getElementById('ctrl-dna-green') as HTMLInputElement,
        red: document.getElementById('ctrl-dna-red') as HTMLInputElement,
        brown: document.getElementById('ctrl-dna-brown') as HTMLInputElement,
        yellow: document.getElementById('ctrl-dna-yellow') as HTMLInputElement,
        pink: document.getElementById('ctrl-dna-pink') as HTMLInputElement,
        blue: document.getElementById('ctrl-dna-blue') as HTMLInputElement,
        purple: document.getElementById('ctrl-dna-purple') as HTMLInputElement,
    };
    
    const dnaValues = {
        green: document.getElementById('val-dna-green')!,
        red: document.getElementById('val-dna-red')!,
        brown: document.getElementById('val-dna-brown')!,
        yellow: document.getElementById('val-dna-yellow')!,
        pink: document.getElementById('val-dna-pink')!,
        blue: document.getElementById('val-dna-blue')!,
        purple: document.getElementById('val-dna-purple')!,
    };
    
    const dnaTotalDisplay = document.getElementById('dna-total')!;
    
    // Track if we're currently normalizing to prevent infinite loops
    let isNormalizing = false;
    
    // Normalize DNA values to always sum to 100
    function normalizeDna(changedTrait: string) {
        if (isNormalizing) return;
        isNormalizing = true;
        
        const traits = ['green', 'red', 'brown', 'yellow', 'pink', 'blue', 'purple'];
        const newValue = parseInt(dnaSliders[changedTrait as keyof typeof dnaSliders].value);
        
        // Get all other traits
        const otherTraits = traits.filter(t => t !== changedTrait);
        
        // Calculate how much to distribute among other traits
        const remainingPoints = Dna.TOTAL_POINTS - newValue;
        
        // Get current sum of other traits
        let otherSum = 0;
        otherTraits.forEach(trait => {
            otherSum += parseInt(dnaSliders[trait as keyof typeof dnaSliders].value);
        });
        
        // Distribute remaining points proportionally
        if (otherSum > 0) {
            otherTraits.forEach(trait => {
                const currentValue = parseInt(dnaSliders[trait as keyof typeof dnaSliders].value);
                const ratio = currentValue / otherSum;
                const newTraitValue = Math.max(0, Math.round(remainingPoints * ratio));
                
                dnaSliders[trait as keyof typeof dnaSliders].value = newTraitValue.toString();
                dnaValues[trait as keyof typeof dnaValues].textContent = newTraitValue.toString();
            });
        } else {
            // If all other traits are 0, distribute evenly
            const perTrait = Math.floor(remainingPoints / otherTraits.length);
            let distributed = 0;
            
            otherTraits.forEach((trait, index) => {
                const value = (index === otherTraits.length - 1) 
                    ? remainingPoints - distributed  // Last trait gets remainder
                    : perTrait;
                
                dnaSliders[trait as keyof typeof dnaSliders].value = value.toString();
                dnaValues[trait as keyof typeof dnaValues].textContent = value.toString();
                distributed += value;
            });
        }
        
        updateDnaTotal();
        isNormalizing = false;
    }
    
    // Update DNA total
    function updateDnaTotal() {
        const total = 
            parseInt(dnaSliders.green.value) +
            parseInt(dnaSliders.red.value) +
            parseInt(dnaSliders.brown.value) +
            parseInt(dnaSliders.yellow.value) +
            parseInt(dnaSliders.pink.value) +
            parseInt(dnaSliders.blue.value) +
            parseInt(dnaSliders.purple.value);
        
        dnaTotalDisplay.textContent = total.toString();
        
        // Update max value display
        const dnaTotalMaxDisplay = document.getElementById('dna-total-max');
        if (dnaTotalMaxDisplay) {
            dnaTotalMaxDisplay.textContent = Dna.TOTAL_POINTS.toString();
        }
        
        // Color code based on total
        if (total === Dna.TOTAL_POINTS) {
            dnaTotalDisplay.style.color = '#2ecc71'; // Green
        } else if (total < Dna.TOTAL_POINTS) {
            dnaTotalDisplay.style.color = '#f39c12'; // Orange
        } else {
            dnaTotalDisplay.style.color = '#e74c3c'; // Red
        }
    }
    
    // Add listeners to all DNA sliders with auto-normalization
    Object.entries(dnaSliders).forEach(([trait, slider]) => {
        slider.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            dnaValues[trait as keyof typeof dnaValues].textContent = value.toString();
            normalizeDna(trait);
        });
    });
    
    // Spawn fungus button
    let spawnMode = false;
    const spawnButton = document.getElementById('btn-spawn-fungus')!;
    
    spawnButton.addEventListener('click', () => {
        spawnMode = !spawnMode;
        
        if (spawnMode) {
            spawnButton.textContent = '❌ Cancel Spawn';
            spawnButton.style.backgroundColor = '#e74c3c';
        } else {
            spawnButton.textContent = '🍄 Spawn Fungus (Click Tile)';
            spawnButton.style.backgroundColor = '#9b59b6';
        }
    });
    
    // Handle tile clicks for spawning
    window.addEventListener('click', (event) => {
        if (!spawnMode) return;
        
        // Create DNA (auto-normalized, so always 100)
        const dna = new Dna(
            parseInt(dnaSliders.green.value),
            parseInt(dnaSliders.red.value),
            parseInt(dnaSliders.brown.value),
            parseInt(dnaSliders.yellow.value),
            parseInt(dnaSliders.pink.value),
            parseInt(dnaSliders.blue.value),
            parseInt(dnaSliders.purple.value)
        );
        
        // Spawn at random position
        const gridSize = game.config.gridSize;
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        
        game.getSimulation().createFungus(x, y, dna);
        
        // Exit spawn mode
        spawnMode = false;
        spawnButton.textContent = '🍄 Spawn Fungus (Click Tile)';
        spawnButton.style.backgroundColor = '#9b59b6';
    });
    
    // Preset buttons
    document.getElementById('btn-preset-photosynthesis')!.addEventListener('click', () => {
        // Photosynthesis: 100 green, 10 red, 10 brown, rest distributed
        const remaining = Dna.TOTAL_POINTS - 100 - 10 - 10;
        const perTrait = Math.floor(remaining / 4);
        const lastTrait = remaining - (perTrait * 3);
        setDnaPreset(100, 10, 10, perTrait, perTrait, perTrait, lastTrait);
    });
    
    document.getElementById('btn-preset-parasite')!.addEventListener('click', () => {
        // Parasite: 100 red, 10 green, 10 brown, rest distributed
        const remaining = Dna.TOTAL_POINTS - 10 - 100 - 10;
        const perTrait = Math.floor(remaining / 4);
        const lastTrait = remaining - (perTrait * 3);
        setDnaPreset(10, 100, 10, perTrait, perTrait, perTrait, lastTrait);
    });
    
    document.getElementById('btn-preset-soil')!.addEventListener('click', () => {
        // Soil: 100 brown, 10 green, 10 red, rest distributed
        const remaining = Dna.TOTAL_POINTS - 10 - 10 - 100;
        const perTrait = Math.floor(remaining / 4);
        const lastTrait = remaining - (perTrait * 3);
        setDnaPreset(10, 10, 100, perTrait, perTrait, perTrait, lastTrait);
    });
    
    document.getElementById('btn-preset-balanced')!.addEventListener('click', () => {
        // Balanced: distribute evenly across all traits
        const perTrait = Math.floor(Dna.TOTAL_POINTS / 7);
        const lastTrait = Dna.TOTAL_POINTS - (perTrait * 6);
        setDnaPreset(perTrait, perTrait, perTrait, perTrait, perTrait, perTrait, lastTrait);
    });
    
    function setDnaPreset(green: number, red: number, brown: number, yellow: number, pink: number, blue: number, purple: number) {
        dnaSliders.green.value = green.toString();
        dnaSliders.red.value = red.toString();
        dnaSliders.brown.value = brown.toString();
        dnaSliders.yellow.value = yellow.toString();
        dnaSliders.pink.value = pink.toString();
        dnaSliders.blue.value = blue.toString();
        dnaSliders.purple.value = purple.toString();
        
        dnaValues.green.textContent = green.toString();
        dnaValues.red.textContent = red.toString();
        dnaValues.brown.textContent = brown.toString();
        dnaValues.yellow.textContent = yellow.toString();
        dnaValues.pink.textContent = pink.toString();
        dnaValues.blue.textContent = blue.toString();
        dnaValues.purple.textContent = purple.toString();
        
        updateDnaTotal();
    }
    
    // Clear all fungi button
    document.getElementById('btn-clear-fungi')!.addEventListener('click', () => {
        if (confirm('⚠️ Clear all fungi from the garden?')) {
            game.getSimulation().clear();
        }
    });
    
    // Initialize DNA total
    updateDnaTotal();
}

// Update day/night info display
function updateDayNightInfo() {
    const dayDuration = game.config.dayDurationSeconds * game.config.dayNightRatio;
    const nightDuration = game.config.dayDurationSeconds * (1 - game.config.dayNightRatio);
    
    document.getElementById('info-day-duration')!.textContent = `${dayDuration.toFixed(1)}s`;
    document.getElementById('info-night-duration')!.textContent = `${nightDuration.toFixed(1)}s`;
}

// Update stats display
function updateStats() {
    const totalEnergy = game.garden.getTotalEnergy();
    const allTiles = game.garden.getAllTiles();
    const emptyTiles = allTiles.filter(t => t.isEmpty).length;
    const occupiedTiles = allTiles.filter(t => !t.isEmpty).length;
    const avgEnergy = totalEnergy / allTiles.length;
    
    // Calculate current sun energy
    const sunEnergy = game.config.calculateSunEnergy(game.timeInCycle);
    const timeOfDay = game.config.getTimeOfDayString(game.timeInCycle);
    
    document.getElementById('stat-time-of-day')!.textContent = timeOfDay;
    document.getElementById('stat-sun-energy')!.textContent = sunEnergy.toFixed(2);
    document.getElementById('stat-total-energy')!.textContent = totalEnergy.toFixed(1);
    document.getElementById('stat-empty-tiles')!.textContent = emptyTiles.toString();
    document.getElementById('stat-occupied-tiles')!.textContent = occupiedTiles.toString();
    document.getElementById('stat-avg-energy')!.textContent = avgEnergy.toFixed(2);
    
    // Update fungi stats
    const simulation = game.getSimulation();
    const allFungi = simulation.getAllFungi();
    const allCells = simulation.getAllCells();
    const allSpores = simulation.getAllSpores();
    const mushroomCount = allCells.filter(cell => cell.hasMushroom).length;
    
    document.getElementById('fungi-count')!.textContent = allFungi.length.toString();
    document.getElementById('cell-count')!.textContent = allCells.length.toString();
    document.getElementById('mushroom-count')!.textContent = mushroomCount.toString();
    document.getElementById('spore-count')!.textContent = allSpores.length.toString();
    
    requestAnimationFrame(updateStats);
}

// Initialize
setupControls();
updateDayNightInfo();
updateStats();

// Time Speed Controls
const speedButtons = document.querySelectorAll('.speed-btn');
const speedDisplay = document.getElementById('speed-display')!;

speedButtons.forEach(button => {
    button.addEventListener('click', () => {
        const speed = parseFloat((button as HTMLElement).dataset.speed || '1');
        game.setTimeSpeed(speed);
        
        // Update active state
        speedButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update display
        if (speed === 0) {
            speedDisplay.textContent = 'PAUSED';
            speedDisplay.style.color = '#e74c3c';
        } else {
            speedDisplay.textContent = `${speed.toFixed(1)}x`;
            speedDisplay.style.color = speed > 1 ? '#2ecc71' : speed < 1 ? '#f39c12' : '#3498db';
        }
    });
});

console.log('🌱 Energy Garden initialized!');
console.log('Use window.game to access the game instance');
