# � Mushroom Garden

A beautiful miniature toy-world diorama featuring a tile-based fungus simul

### 📊 Game Information Display
At the top of the screen:
- **🍄 Days Passed**: Total number of complete day/night cycles
- **☀️/🌙 Time of Day**: Current phase (Morning/Noon/Evening/Night/etc.)
- **☀️ Sun Energy**: Per-tile sun delivery rate (units/sec)
- **⏰ Cycle Progress**: Visual progress bar through day/night cycle
- **📊 Statistics**: Fungi count, cell count, spore count

### 💬 Interactive Information Panel
Click on any tile to view detailed information:
- **Tile Info**: Position, occupancy status, soil energy reserves
- **Cell Info** (if occupied):
  - Fungus ID and generation
  - DNA breakdown (all 7 traits with percentages)
  - Energy wallet (SUN, SOIL, NUTRITION units)
  - Energy capacity and fill ratio
  - **Energy Flow Analysis**:
    - Gained: Photosynthesis, Soil Absorption, Parasitism
    - Consumed: Metabolism, Expansion, Reproduction, Parasitism (victims)
  - Real-time rates displayed in units/sec
  - Color-coded by energy type

### Tile System
- **Square Grid**: Configurable grid size (default 20×20)
- **Soil Energy Storage**: Each tile stores SOIL_UNITs
- **Soil Generation**: Empty tiles generate 2 units/sec
- **Sun Energy Delivery**: Each tile receives 20 units/sec during day (per-tile, not global)
- **Occupancy State**: Empty (soil generation) or Occupied (cell present)
- **Visual Grid**: Black edge lines distinguish individual tiles-driven evolution, discrete energy systems, day-night cycles, professional 3D graphics, and interactive elements.

## 🎮 Features

### 🧬 Fungus Simulation System
- **DNA-Based Traits**: Each fungus has 7 DNA traits (0-100%) that determine behavior:
  - **🟢 Green**: Photosynthesis efficiency (sun energy absorption)
  - **🔴 Red**: Parasitism power (drain energy from enemies)
  - **🟤 Brown**: Soil absorption rate (extract energy from ground)
  - **🟡 Yellow**: Metabolic efficiency (lower energy consumption)
  - **🩷 Pink**: Energy storage capacity (larger energy wallet)
  - **🔵 Blue**: Expansion efficiency (cheaper cell growth)
  - **🟣 Purple**: Reproduction efficiency (cheaper mushroom creation)

- **Cell-Based Organisms**: 
  - Fungi grow by creating new cells on adjacent tiles
  - Cells share energy and resources within the same fungus
  - Each cell has independent energy acquisition and metabolism
  - Disconnected cells split into separate fungi

- **Discrete Energy System**:
  - Three energy types: **☀️ SUN**, **🌱 SOIL**, **⚡ NUTRITION**
  - Energy stored as discrete integer units (not continuous)
  - Cells convert SUN/SOIL → NUTRITION for survival
  - Accumulator pattern handles fractional rates smoothly

### 🔄 Energy Mechanics

#### Energy Types
1. **☀️ SUN_UNIT**: Absorbed from sunlight during day (photosynthesis)
2. **🌱 SOIL_UNIT**: Extracted from tile's soil energy
3. **⚡ NUTRITION_UNIT**: Usable energy for metabolism, growth, reproduction

#### Energy Acquisition
- **Photosynthesis** (Green DNA): 
  - Each tile receives 20 sun units/sec during day
  - Cell absorbs: `greenDNA% × 20 units/sec` from its tile
  - Empty tiles waste sun energy (not stored)
  
- **Soil Absorption** (Brown DNA):
  - Cell extracts: `brownDNA% × 10 units/sec` from tile
  - Depletes tile's soil energy reserves
  
- **Parasitism** (Red DNA):
  - Drains: `redDNA% × 20 units/sec` from EACH enemy neighbor
  - Multiple neighbors = multiplicative power!
  - 100% Red + 4 neighbors = 80 units/sec gained

#### Energy Conversion
- **1 SUN → 1 NUTRITION** (100% efficient, preferred pathway)
- **1 SOIL → 1 NUTRITION** (100% efficient, fallback)
- Cells prioritize converting SUN first, then SOIL

#### Energy Consumption
- **Metabolism**: Base 5 units/sec × efficiency × size multiplier
  - Yellow DNA reduces consumption (0% = full drain, 100% = 20% drain)
  - Larger fungi have higher per-cell metabolic costs
  - Uses accumulator pattern for smooth discrete consumption

### 🌱 Growth & Reproduction

#### Cell Expansion (Blue DNA)
- Cost: 400 NUTRITION units (reduced by Blue DNA up to 80%)
- Creates new cell on adjacent empty tile
- New cell starts with 50% of cost as initial energy
- Automatic when cell energy > 1.2× cost threshold

#### Mushroom Reproduction (Purple DNA)
- Cost: 500 NUTRITION units (reduced by Purple DNA up to 80%)
- Grows mushroom on cell (visual fruiting body)
- Mushroom matures over time (15% growth/sec)
- Releases 5 spores when mature with mutated DNA

#### Spores & Germination
- Spores scatter randomly within 10-tile radius
- 10-second lifetime before death
- Germinate on empty tiles to create new fungi
- DNA mutation during reproduction (15% strength)
- Each spore becomes independent organism

### 🎨 Graphics & Visuals
- **Miniature Diorama**: Cozy toy-world on a child's desk
  - Wooden desk surface with realistic wood materials
  - Raised garden box with walls
  - Board-game style tiles with visible gaps
  - Professional 3-point lighting (key, fill, rim lights)
  - High-quality soft shadows (2048×2048 resolution)
  - Physically-Based Rendering (PBR) materials
  - Tilt-shift depth-of-field effect for miniature photography look
  
- **Dynamic Lighting**: 
  - Day: Warm desk lamp with realistic shadows
  - Night: Cozy orange night-light with moonlight
  - Smooth transitions between day/night
  - Real-time shadow updates

### 📊 Game Information Display
At the top of the screen:
- **� Days Passed**: Total number of complete day/night cycles
- **☀️/🌙 Time of Day**: Current phase (Morning/Noon/Evening/Night/etc.)
- **☀️ Sun Energy**: Percentage of max sun emission (daytime only)
- **⏰ Cycle Progress**: Visual progress bar through day/night cycle

### Tile System
- **Square Grid**: Configurable grid size (default 20×20)
- **Energy Storage**: Each tile can store energy like a battery
- **Energy Generation**: Tiles generate energy automatically
- **Energy Transfer**: Tiles can give and receive energy
- **Occupancy State**: Tiles can be empty or occupied
- **Visual Grid**: Black edge lines distinguish individual tiles

### Day-Night Cycle ☀️🌙
- **Dynamic Time System**: Configurable day duration (10-120 seconds)
- **Day/Night Ratio**: Adjustable percentage of daytime vs nighttime (20%-80%)
- **Per-Tile Sun Energy Delivery**: 
  - Each tile receives independent sun energy (not a global pool)
  - Max 20 units/sec per tile at noon (sine curve)
  - Zero during night
  - Empty tiles waste sun energy (not stored)
  - Cells absorb sun based on Green DNA percentage
- **Visual Effects**: 
  - Sky color changes (bright cyan day → dark blue night)
  - Sun position moves across the sky
  - Dynamic lighting (warm yellow sun → cool blue moon)
- **Time Display**: Dawn 🌅 / Morning 🌞 / Noon ☀️ / Dusk 🌇 / Night 🌙

### Soil Energy System
- **Tile Generation**: Empty tiles generate 2 SOIL_UNITs/sec
- **Accumulator Pattern**: Converts fractional rates to discrete units
- **Cell Absorption**: Cells extract soil based on Brown DNA
- **Depletion**: Soil reserves decrease as cells absorb
- **No Regeneration**: Occupied tiles don't generate soil (cells block it)

### User Controls (Tabbed Interface)

#### Tab 1: Simulation Parameters
- **Base Metabolic Drain**: 5 units/sec (NUTRITION consumption)
- **Max Photosynthesis Rate**: 20 units/sec (SUN absorption at 100% Green)
- **Max Soil Absorption Rate**: 10 units/sec (SOIL extraction at 100% Brown)
- **Max Parasitism Rate**: 20 units/sec per neighbor (at 100% Red)
- **Expansion Energy Cost**: 400 NUTRITION units per new cell
- **Mushroom Energy Cost**: 500 NUTRITION units per mushroom
- **Mutation Strength**: 15% DNA change per generation

#### Tab 2: Day-Night Cycle
- **Full Day Duration**: 10-120 seconds (complete day+night cycle)
- **Day/Night Ratio**: 20%-80% (percentage that is daytime)
- **Max Sun Emission**: 20 units/sec per tile (peak at noon)

### 🖱️ Interactive Features
- **Tile Clicking**: Click any tile to see detailed information popup
  - **Tile Information**:
    - Position (x, y coordinates)
    - Status (Empty/Occupied)
    - Soil energy (current/max SOIL_UNITs)
  - **Cell Information** (if occupied):
    - Fungus ID and generation
    - DNA traits (Green, Red, Brown, Yellow, Pink, Blue, Purple)
    - Energy wallet breakdown (SUN, SOIL, NUTRITION)
    - Energy capacity from Pink DNA
    - **Energy Flow Analysis**:
      - Gained: Photosynthesis (+20.0), Soil Absorption (+10.0), Parasitism (+40.0)
      - Consumed: Metabolism (-5.0), Expansion (-400), Parasitism (-20.0 for victims)
    - Real-time rates in units/sec with color coding
    - Mushroom growth status (if present)
- **Right-click**: Close popup
- **Escape**: Also closes popup
- **Create Fungus**: Click empty tile to spawn new organism with random DNA

## 🎨 Visualization

### Color Coding
- **Empty Tiles**: Green shades (based on soil energy level)
- **Occupied Tiles**: Dynamic color based on cell's DNA dominance
  - Green-dominant: Green hues (photosynthesizers)
  - Red-dominant: Red hues (parasites)
  - Brown-dominant: Brown hues (decomposers)
  - Balanced: Mixed colors
- **Brightness**: Increases with cell energy level (emissive glow)
- **Mushrooms**: Purple/pink fruiting bodies when reproducing

### Visual Feedback
- **Height**: Tiles grow taller as they fill with energy (0.1 → 1.0)
- **Glow**: Emissive intensity increases with energy level
- **Depth-of-Field**: Tilt-shift effect keeps garden sharp, blurs foreground/background
- **Shadows**: Realistic soft shadows from tiles and walls
- **Materials**: Matte PBR materials for authentic toy appearance

## 🎮 Camera Controls

### Keyboard (WASD)
- **A**: Rotate camera LEFT around garden
- **D**: Rotate camera RIGHT around garden  
- **W**: Move camera CLOSER to garden
- **S**: Move camera FARTHER from garden

### Mouse
- **Scroll UP**: Move camera DOWN (closer to ground)
- **Scroll DOWN**: Move camera UP (higher in air)
- **Left-click tile**: Show tile information popup
- **Right-click**: Close popup

**Note**: Camera always looks at a point above the tiles for optimal viewing angle.

## 🚀 Running the Project

### Development Server
```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Build for Production
```bash
npm run build
```

## 📊 Stats Panel

Real-time statistics displayed:
- **Time of Day**: Current phase with emoji (Dawn/Morning/Noon/Dusk/Night)
- **Sun Energy**: Current per-tile sun delivery rate (units/sec)
- **Days Passed**: Complete day/night cycles since start
- **Fungi Count**: Number of independent fungal organisms
- **Cell Count**: Total living cells across all fungi
- **Spore Count**: Active spores waiting to germinate
- **Total Tile Energy**: Sum of all SOIL energy stored in tiles

## 🎛️ Control Panel

The control panel features **tabbed navigation** for organized access to simulation parameters.

### Tab 1: Simulation Parameters

#### Energy Rates (All in units/sec)
- **Base Metabolic Drain**: 5 (base NUTRITION consumption)
- **Max Photosynthesis Rate**: 20 (SUN absorption at 100% Green DNA)
- **Max Soil Absorption Rate**: 10 (SOIL extraction at 100% Brown DNA)
- **Max Parasitism Rate**: 20 per neighbor (at 100% Red DNA)

#### Growth & Reproduction Costs (NUTRITION units)
- **Expansion Energy Cost**: 400 (create new cell)
- **Mushroom Energy Cost**: 500 (grow fruiting body)

#### Evolution
- **Mutation Strength**: 15% (how much DNA changes per generation)

### Tab 2: Day-Night Cycle Settings

#### Cycle Duration
- Set full day duration (complete day + night cycle time)
- Info panel shows calculated day and night durations

#### Day/Night Balance
- Adjust what percentage of the cycle is daytime
- Example: 60% ratio = 60% day, 40% night

#### Sun Energy (Per-Tile Delivery)
- Set peak sun energy emission at noon (20 units/sec per tile)
- Each tile receives independent sun energy
- Cells absorb based on Green DNA percentage
- Empty tiles waste sun energy (not stored)

### Actions
- **🔄 Restart Garden**: Reset simulation with current parameters
- **↺ Reset to Defaults**: Restore all settings to initial values
- **🍄 Create Fungus**: Click empty tiles to spawn organisms

## 🧮 Formula Reference

### Cell Metabolism (Energy Consumption)
```typescript
// Yellow DNA provides efficiency
efficiency = 0.2 + (0.8 × (1 - yellowDNA/100))  // 20% to 100% drain
sizeMultiplier = 1.0 + (log(cellCount) × 0.35)  // Larger fungi cost more
drain = 5 × efficiency × sizeMultiplier  // units/sec
```

### Photosynthesis (Sun Energy Absorption)
```typescript
// Per-tile sun delivery
if (isDaytime) {
    dayProgress = timeInCycle / dayDuration  // 0 to 1
    sunAngle = dayProgress × π               // 0 to π
    sunEnergyPerTile = sin(sunAngle) × 20    // units/sec per tile
}

// Cell absorption (per tile, independent)
maxAbsorption = (greenDNA/100) × 20          // units/sec
actualAbsorption = min(maxAbsorption, sunEnergyPerTile)
```

### Soil Absorption (Ground Energy Extraction)
```typescript
maxAbsorption = (brownDNA/100) × 10          // units/sec
actualAbsorption = min(maxAbsorption, tile.soilEnergy)
```

### Parasitism (Energy Draining)
```typescript
// Drains from EACH enemy neighbor independently
drainPerNeighbor = (redDNA/100) × 20         // units/sec per neighbor
totalDrain = drainPerNeighbor × neighborCount

// Example: 100% Red + 3 neighbors = 60 units/sec total
```

### Energy Conversion
```typescript
// Pathway 1 (Preferred): Photosynthesis
1 SUN_UNIT → 1 NUTRITION_UNIT (100% efficient)

// Pathway 2 (Fallback): Decomposition
1 SOIL_UNIT → 1 NUTRITION_UNIT (100% efficient)
```

### Growth Costs (affected by DNA)
```typescript
// Expansion (Blue DNA)
baseCost = 400 NUTRITION_UNITS
costMultiplier = 1.0 - (blueDNA/100) × 0.8   // Up to 80% reduction
actualCost = baseCost × costMultiplier

// Reproduction (Purple DNA)
baseCost = 500 NUTRITION_UNITS
costMultiplier = 1.0 - (purpleDNA/100) × 0.8 // Up to 80% reduction
actualCost = baseCost × costMultiplier
```

### Energy Capacity (Pink DNA)
```typescript
baseCapacity = 1000 NUTRITION_UNITS
pinkBonus = (pinkDNA/100) × 1000             // Up to +1000 units
maxCapacity = baseCapacity + pinkBonus       // 1000-2000 units
```

### Tile Soil Generation
```typescript
// Only empty tiles generate soil
if (tile.isEmpty) {
    generation = 2 × deltaTime               // 2 SOIL_UNITs/sec
    tile.soilEnergy += generation
}
```

## 🔧 Technical Stack

- **TypeScript**: Type-safe game logic
- **Three.js**: 3D visualization
- **Vite**: Build tool and dev server

## 📁 Project Structure

```
src/
├── GameConfig.ts           # User-configurable simulation parameters
├── Tile.ts                 # Tile logic (soil energy storage)
├── Garden.ts               # Grid management and tile updates
├── Game.ts                 # Main game loop and coordination
├── GraphicsEngine.ts       # Complete 3D rendering engine
│                           # - Scene setup and management
│                           # - 3-point lighting system
│                           # - PBR materials
│                           # - Post-processing effects
│                           # - Camera controls
│                           # - Tile click detection
├── TilePopup.ts            # Detailed tile/cell information popup
├── GameInfoDisplay.ts      # Top-screen game statistics display
├── fungus-sim/
│   ├── Dna.ts              # DNA trait system and mutation
│   ├── Fungus.ts           # Fungal organism (collection of cells)
│   ├── Cell.ts             # Individual cell (energy, position, state)
│   ├── Energy.ts           # Discrete energy system (types, wallet, accumulator)
│   └── SimulationEngine.ts # Core simulation logic:
│                           # - Metabolism and survival
│                           # - Photosynthesis (sun absorption)
│                           # - Soil absorption
│                           # - Parasitism (energy draining)
│                           # - Energy conversion
│                           # - Growth and expansion
│                           # - Reproduction and spores
│                           # - Organism splitting
└── main.ts                 # Entry point + UI controls
```

## 🎨 Graphics Architecture

### Rendering Pipeline
1. **Scene Setup**: Diorama environment (desk, garden box, tiles)
2. **3-Point Lighting**: Key light (shadows) + Fill light + Rim light + Ambient
3. **PBR Materials**: MeshStandardMaterial with proper roughness/metalness
4. **Shadow Rendering**: PCFSoftShadowMap with optimized frustum
5. **RenderPass**: Base scene rendering
6. **BokehPass**: Depth-of-field blur for tilt-shift effect
7. **Final Output**: Miniature photography appearance

### Material Properties
- **Desk**: Roughness 0.8, Metalness 0.0 (matte wood)
- **Garden Box**: Roughness 0.7, Metalness 0.0 (wood)
- **Walls**: Roughness 0.6, Metalness 0.0 (painted wood)
- **Tiles**: Roughness 0.6-0.7 (dynamic), Metalness 0.0 (plastic/clay)

### Lighting Setup
**Day Mode:**
- Key light: 0.9-1.5 intensity (warm incandescent)
- Fill light: 0.35 intensity (cool window light)
- Rim light: 0.5 intensity (edge highlights)
- Ambient: 0.45 intensity

**Night Mode:**
- Key light: 0.35 intensity (warm orange night-light)
- Fill light: 0.2 intensity (cool moonlight)
- Rim light: 0.25 intensity
- Ambient: 0.3 intensity

### Post-Processing
- **Focus Distance**: 20 units (garden center)
- **Aperture**: 0.002 (wide depth-of-field for entire garden)
- **Max Blur**: 0.003 (subtle blur on foreground/background)

## 💡 Understanding the System

### Discrete Energy Architecture

**Why Discrete Units?**
- More realistic (like molecules or ATP in biology)
- Prevents floating-point accumulation errors
- Clear, countable energy transactions
- Better for game balance and tuning

**Accumulator Pattern:**
```typescript
// Fractional rates (e.g., 0.083 units/frame) accumulate
accumulator.add(0.083)  // Frame 1: 0.083
accumulator.add(0.083)  // Frame 2: 0.166
accumulator.add(0.083)  // Frame 3: 0.249
...
accumulator.add(0.083)  // Frame 12: 1.004
units = accumulator.extractUnits()  // Returns 1, keeps 0.004

// UI shows smooth continuous rate: 5.0 units/sec
// Actual transactions use discrete units: 1, 2, 3...
```

### Three Energy Systems Working Together

1. **Tile Soil Energy** (SOIL_UNITs)
   - Generated by empty tiles (2 units/sec)
   - Stored in tiles like a battery
   - Extracted by cells via Brown DNA
   - Depletes when absorbed
   - Not replenished while occupied

2. **Sun Energy** (SUN_UNITs per tile)
   - Delivered to each tile independently
   - 20 units/sec max at noon (sine curve)
   - Absorbed by cells via Green DNA
   - Wasted on empty tiles (not stored)
   - Zero at night

3. **Nutrition Energy** (NUTRITION_UNITs)
   - Converted from SUN or SOIL (1:1 ratio)
   - Usable for metabolism, growth, reproduction
   - Stored in cell's energy wallet
   - Shared between cells of same fungus
   - Lost when cell dies

### DNA-Driven Evolution

**Initial Population:**
- Random DNA on creation
- Wide variety of strategies

**Natural Selection:**
- Successful traits = more energy = more growth
- Parasites dominate in dense populations
- Photosynthesizers thrive in open spaces
- Decomposers survive on soil reserves

**Mutation & Adaptation:**
- 15% DNA change per generation
- Gradual drift toward optimal traits
- Different strategies for different niches
- Emergent ecosystem dynamics

### Energy Flow Example

**High-Performance Cell (Balanced DNA):**
```
Green: 80%, Red: 20%, Brown: 60%, Yellow: 70%
Pink: 50%, Blue: 40%, Purple: 30%

During Day (with 2 enemy neighbors):
  Photosynthesis: +16 SUN/sec (80% of 20)
  Soil Absorption: +6 SOIL/sec (60% of 10)
  Parasitism: +8 NUTRITION/sec (20% × 20 × 2)
  Conversion: 16 SUN → NUTRITION, 6 SOIL → NUTRITION
  Total Gained: +30 NUTRITION/sec
  
  Metabolism: -2 NUTRITION/sec (70% efficiency)
  
  Net: +28 NUTRITION/sec → rapid growth!

During Night (same neighbors):
  Photosynthesis: 0 (no sun)
  Soil Absorption: +6 SOIL/sec
  Parasitism: +8 NUTRITION/sec
  Conversion: 6 SOIL → NUTRITION
  Total Gained: +14 NUTRITION/sec
  
  Metabolism: -2 NUTRITION/sec
  
  Net: +12 NUTRITION/sec → slower but still growing
```

## 🎯 Gameplay Strategies

### Pure Photosynthesizer 🌿
```
DNA Focus: Green 100%, Yellow 80%, Pink 70%
Strategy: Maximum sun absorption + efficiency
Strengths: Dominates during long days, no competition needed
Weaknesses: Vulnerable at night, defenseless against parasites
Best in: Open spaces, long day cycles
```

### Aggressive Parasite 🦠
```
DNA Focus: Red 100%, Yellow 80%, Blue 60%
Strategy: Drain enemies, expand rapidly
Strengths: Multiplicative power with many neighbors
Weaknesses: Needs victims nearby, fails in isolation
Best in: Dense populations, competitive environments
```

### Resilient Decomposer 🍄
```
DNA Focus: Brown 100%, Yellow 90%, Pink 80%
Strategy: Live off soil reserves, high efficiency
Strengths: Works day and night, independent
Weaknesses: Slow growth, depletes tiles
Best in: Degraded areas, nighttime survival
```

### Balanced Generalist 🌸
```
DNA Focus: Green 60%, Red 40%, Brown 50%, Yellow 70%
Strategy: Multiple energy sources, adaptable
Strengths: Survives in varied conditions
Weaknesses: Not optimal in any niche
Best in: Changing environments, mixed strategies
```

### Rapid Expander 🚀
```
DNA Focus: Blue 100%, Purple 80%, Green 70%
Strategy: Low costs, fast reproduction, spread quickly
Strengths: Colonizes empty space rapidly
Weaknesses: Individual cells weaker, vulnerable
Best in: Empty gardens, early game
```

## 🧪 Experiments to Try

### Ecosystem Evolution
```
1. Create 4-5 fungi with different DNA strategies
2. Let them compete for 50+ days
3. Observe which strategies dominate
4. Watch mutations adapt to environment
```

### Predator-Prey Dynamics
```
1. Create pure photosynthesizer (Green 100%, Red 0%)
2. Let it spread across garden
3. Introduce parasite (Red 100%, Green 0%)
4. Watch population oscillations
```

### Day/Night Adaptation
```
Scenario A: Long Day (80% daytime)
- Photosynthesizers should dominate
- Green DNA becomes most valuable

Scenario B: Long Night (20% daytime)
- Decomposers and parasites thrive
- Brown and Red DNA more valuable
```

### Soil Depletion Crisis
```
1. Start with high soil energy tiles
2. Create many Brown-focused fungi
3. Watch soil reserves deplete
4. Observe strategy shift (Brown → Green/Red)
```

### Mutation Strength Test
```
Low Mutation (5%): 
- Traits stay stable across generations
- Original strategies persist

High Mutation (30%):
- Rapid trait drift
- Quick adaptation but less stable
```

## 🎨 Graphics Transformation Complete

The project features a professional 3D visualization:

1. ✅ **Graphics Engine Architecture**: Separated rendering logic into dedicated GraphicsEngine class
2. ✅ **Diorama Environment**: Created miniature world with desk, garden box, and walls
3. ✅ **Advanced Lighting**: Professional 3-point lighting with high-quality soft shadows
4. ✅ **PBR Materials**: Physically-based rendering for realistic toy/miniature appearance
5. ✅ **Post-Processing**: Tilt-shift depth-of-field for macro photography effect
6. ✅ **Dynamic Cell Visualization**: DNA-based coloring and energy-based glowing
7. ✅ **Mushroom Rendering**: Fruiting body visualization during reproduction

**Result**: A convincing miniature toy-world diorama featuring living fungal organisms!

## 🎮 Controls Summary

### Camera Movement
- **A/D Keys**: Rotate around garden
- **W/S Keys**: Move closer/farther
- **Mouse Wheel**: Adjust height

### Interaction
- **Left-click tile**: View detailed cell/tile information
- **Left-click empty tile**: Create new fungus with random DNA
- **Right-click**: Close popup

### UI
- **Tab Buttons**: Switch between settings panels
- **Sliders**: Adjust simulation parameters in real-time
- **Restart Button**: Reset simulation
- **Reset Button**: Restore all defaults

## 🔬 Observable Phenomena

### Competition & Cooperation
- Cells of same fungus share energy
- Disconnected cells split into separate fungi
- Parasites drain competitors
- Resource depletion affects strategy

### Emergent Behaviors
- Population waves (boom and bust cycles)
- Niche specialization (different strategies in different areas)
- Arms race (parasites vs efficiency)
- Spatial patterns (clustering, territory control)

### Visual Indicators
- **Green glow**: Photosynthesizing cells
- **Red glow**: Parasitic cells
- **Brown glow**: Decomposer cells
- **Bright cells**: High energy, ready to grow
- **Dim cells**: Low energy, struggling
- **Purple mushrooms**: Reproducing organisms

## 🐛 Debugging

Access the simulation in browser console:
```javascript
window.game                    // Main game instance
window.game.config             // View/modify configuration
window.game.garden             // Access the garden grid
window.game.getSimulation()    // Access simulation engine

// Get a specific tile
window.game.garden.getTile(5, 5)

// Get all fungi
window.game.getSimulation().getAllFungi()

// Get all cells
window.game.getSimulation().getAllCells()

// Create a test fungus with specific DNA
const sim = window.game.getSimulation()
const dna = sim.createTestDna(
    100,  // Green (photosynthesis)
    0,    // Red (parasitism)
    50,   // Brown (soil)
    80,   // Yellow (efficiency)
    50,   // Pink (capacity)
    40,   // Blue (expansion)
    30    // Purple (reproduction)
)
sim.createFungus(10, 10, dna)

// Modify a simulation parameter
sim.maxParasitismRate = 30  // Make parasitism stronger
```

## 🌟 Key Features Summary

✅ **Discrete Energy System** - Realistic unit-based energy transactions  
✅ **DNA-Driven Evolution** - 7 traits control behavior and strategy  
✅ **Emergent Ecosystems** - Competition, cooperation, natural selection  
✅ **Day-Night Cycles** - Dynamic sun energy delivery  
✅ **Per-Tile Resources** - Independent energy sources  
✅ **Organism Growth** - Cell expansion, fungal networks  
✅ **Reproduction & Mutation** - Spores with DNA variation  
✅ **Energy Flow Analysis** - Real-time detailed statistics  
✅ **Beautiful 3D Visuals** - Miniature diorama aesthetic  
✅ **Interactive UI** - Click tiles for detailed information  

## 🎓 Learning Opportunities

This simulation demonstrates:
- **Evolutionary Biology**: Natural selection, adaptation, fitness
- **Ecology**: Competition, niches, resource dynamics
- **Energy Systems**: Conversion, efficiency, flow
- **Emergence**: Complex patterns from simple rules
- **Game Design**: Balance, strategy depth, player agency
- **Software Architecture**: Modular design, separation of concerns
- **3D Graphics**: Rendering pipeline, materials, lighting

---

**Mushroom Garden** - Where evolution meets gameplay in a beautiful miniature world! 🍄✨
