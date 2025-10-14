import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { Garden } from './Garden';
import { GameConfig } from './GameConfig';
import { Tile } from './Tile';
import { TilePopup } from './TilePopup';
import { SimulationEngine } from './fungus-sim/SimulationEngine';
import { Cell } from './fungus-sim/Cell';
import { Spore } from './fungus-sim/SimulationEngine';

/**
 * GraphicsEngine - Dedicated rendering and visual effects engine
 * Handles all Three.js scene setup, lighting, materials, and rendering
 * Separated from game logic for better organization
 */
export class GraphicsEngine {
    // Core Three.js components
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    
    // Camera control state
    private cameraAngle: number = Math.PI / 4; // Rotation angle around center (radians)
    private cameraDistance: number = 20; // Distance from center (W/S movement)
    private cameraHeight: number = 10; // Height above ground (mouse wheel)
    private readonly lookAtHeight: number = 2; // Height to look at (above tiles, creates angle)
    private readonly rotationSpeed: number = 0.05; // Radians per frame for A/D (faster)
    private readonly moveSpeed: number = 0.8; // Units per frame for W/S (faster)
    private readonly heightSpeed: number = 1.5; // Units per wheel tick (faster)
    private readonly minHeight: number = 5; // Minimum camera height
    private readonly maxHeight: number = 50; // Maximum camera height
    private readonly minDistance: number = 10; // Minimum distance from center
    private readonly maxDistance: number = 60; // Maximum distance from center
    private keyState: { [key: string]: boolean } = {}; // Track pressed keys
    
    // Post-processing
    private composer!: EffectComposer;
    private bokehPass!: BokehPass;
    
    // Lighting
    private ambientLight!: THREE.AmbientLight;
    private sunLight!: THREE.DirectionalLight;
    private fillLight!: THREE.DirectionalLight; // Additional fill light for softer shadows
    private rimLight!: THREE.PointLight; // Rim light for depth and definition
    
    // Visual elements
    private tileMeshes: Map<string, THREE.Mesh> = new Map();
    private cellMeshes: Map<string, THREE.Mesh> = new Map(); // Fungus cell visuals
    private bridgeMeshes: Map<string, THREE.Mesh> = new Map(); // Bridges connecting cells of same fungus
    private mushroomMeshes: Map<string, THREE.Group> = new Map(); // Mushroom visuals
    private sporeMeshes: Map<number, THREE.Mesh> = new Map(); // Spore visuals (indexed by position in spore array)
    private gridHelper: THREE.GridHelper | null = null;
    private tilePopup: TilePopup;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private simulationEngine: any; // Reference to simulation engine for cell lookup
    private hoveredFungusId: number | null = null; // Track which fungus is being hovered
    
    // Diorama environment elements
    private deskSurface: THREE.Mesh | null = null;
    private gardenBox: THREE.Mesh | null = null;
    private gardenBoxWalls: THREE.Group | null = null;
    
    // References (not owned by GraphicsEngine)
    private config: GameConfig;
    private garden: Garden;
    
    constructor(config: GameConfig, garden: Garden) {
        this.config = config;
        this.garden = garden;
        
        // Initialize scene
        this.scene = new THREE.Scene();
        // Soft pastel background for child's room atmosphere
        this.scene.background = new THREE.Color(0xd4e4f7); // Light blue, like a cozy room
        
        // Add subtle fog for depth and miniature effect
        this.scene.fog = new THREE.Fog(0xd4e4f7, 30, 80);
        
        // Initialize camera - positioned for miniature/diorama view
        this.camera = new THREE.PerspectiveCamera(
            45, // Narrower FOV for more natural miniature view
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(20, 18, 20); // Higher angle for desk view
        this.camera.lookAt(0, 0, 0);
        
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Enable shadows for realistic miniature look
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
        
        // Tone mapping for better color reproduction
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        document.getElementById('app')?.appendChild(this.renderer.domElement);
        
        // Initialize tile popup
        this.tilePopup = new TilePopup();
        
        // Setup custom keyboard and mouse controls
        this.setupCameraControls();
        
        // Setup click handler for tiles
        this.setupTileClickHandler();
        
        // Setup hover handler for fungus highlighting
        this.setupFungusHoverHandler();
        
        // Setup lighting system
        this.setupLighting();
        
        // Setup post-processing effects
        this.setupPostProcessing();
        
        // Create diorama environment
        this.createDioramaEnvironment();
        
        // Create initial visual elements
        this.createTileMeshes();
        this.createGridHelper();
        
        // Update initial camera position
        this.updateCameraPosition();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Setup custom camera controls
     * A/D: Rotate around center
     * W/S: Move closer/farther from center
     * Mouse wheel: Adjust height above ground
     */
    private setupCameraControls(): void {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                this.keyState[key] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                this.keyState[key] = false;
            }
        });
        
        // Mouse wheel for height control (reversed)
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Scroll up = decrease height (down), scroll down = increase height (up)
            if (e.deltaY < 0) {
                this.cameraHeight = Math.max(this.minHeight, this.cameraHeight - this.heightSpeed);
            } else {
                this.cameraHeight = Math.min(this.maxHeight, this.cameraHeight + this.heightSpeed);
            }
            
            this.updateCameraPosition();
        }, { passive: false });
    }
    
    /**
     * Update camera position based on current angle, distance, and height
     * Camera looks at a point above the tiles to create an angled view
     */
    private updateCameraPosition(): void {
        // Calculate position on a circle around the center
        const x = Math.cos(this.cameraAngle) * this.cameraDistance;
        const z = Math.sin(this.cameraAngle) * this.cameraDistance;
        
        this.camera.position.set(x, this.cameraHeight, z);
        
        // Look at a point above the ground (at tile height) to create an angle
        this.camera.lookAt(0, this.lookAtHeight, 0);
    }
    
    /**
     * Update camera controls (called every frame)
     */
    private updateCameraControls(): void {
        let needsUpdate = false;
        
        // A/D: Rotate around center
        if (this.keyState['a']) {
            this.cameraAngle += this.rotationSpeed;
            needsUpdate = true;
        }
        if (this.keyState['d']) {
            this.cameraAngle -= this.rotationSpeed;
            needsUpdate = true;
        }
        
        // W/S: Move closer/farther from center
        if (this.keyState['w']) {
            this.cameraDistance = Math.max(this.minDistance, this.cameraDistance - this.moveSpeed);
            needsUpdate = true;
        }
        if (this.keyState['s']) {
            this.cameraDistance = Math.min(this.maxDistance, this.cameraDistance + this.moveSpeed);
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            this.updateCameraPosition();
        }
    }
    
    /**
     * Setup hover handler for fungus highlighting
     */
    private setupFungusHoverHandler(): void {
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Check for intersections with cell meshes (including children of groups)
            const cellMeshArray = Array.from(this.cellMeshes.values());
            const intersects = this.raycaster.intersectObjects(cellMeshArray, true); // true = recursive
            
            if (intersects.length > 0 && this.simulationEngine) {
                // Find which cell was hovered - need to get the parent group
                const hoveredObject = intersects[0].object;
                const hoveredGroup = hoveredObject.parent || hoveredObject;
                
                for (const [key, mesh] of this.cellMeshes.entries()) {
                    if (mesh === hoveredGroup) {
                        const [x, y] = key.split(',').map(Number);
                        const cell = this.simulationEngine.getCellAt(x, y);
                        
                        if (cell && cell.fungus.id !== this.hoveredFungusId) {
                            this.hoveredFungusId = cell.fungus.id;
                            this.updateFungusHighlight();
                        }
                        return;
                    }
                }
            } else {
                // No cell hovered, clear highlight
                if (this.hoveredFungusId !== null) {
                    this.hoveredFungusId = null;
                    this.updateFungusHighlight();
                }
            }
        });
    }
    
    /**
     * Update visual highlighting for the hovered fungus
     */
    private updateFungusHighlight(): void {
        if (!this.simulationEngine) return;
        
        const allCells = this.simulationEngine.getAllCells();
        
        allCells.forEach((cell: Cell) => {
            const key = `${cell.x},${cell.y}`;
            const mesh = this.cellMeshes.get(key);
            if (!mesh) return;
            
            const material = mesh.material as THREE.MeshStandardMaterial;
            const [r, g, b] = cell.fungus.dna.getDominantColor();
            const color = new THREE.Color(r, g, b);
            
            if (this.hoveredFungusId === cell.fungus.id) {
                // Highlight this fungus - brighter and more emissive
                material.emissiveIntensity = Math.min(cell.getEnergyRatio() * 0.5 + 0.4, 1.0);
                material.roughness = 0.3; // Shinier
            } else {
                // Normal appearance
                material.emissiveIntensity = cell.getEnergyRatio() * 0.5;
                material.roughness = 0.6;
            }
        });
        
        // Update all bridges - highlight hovered fungus bridges, reset others
        this.updateAllBridgesHighlight();
    }
    
    /**
     * Update all bridges to highlight or reset based on hovered fungus
     */
    private updateAllBridgesHighlight(): void {
        if (!this.simulationEngine) return;
        
        const allCells = this.simulationEngine.getAllCells();
        
        // Track which bridges we've already updated
        const updatedBridges = new Set<string>();
        
        allCells.forEach((cell: Cell) => {
            // Check East, North, and diagonal directions to match bridge creation logic
            const neighbors = [
                { x: cell.x + 1, y: cell.y },     // East
                { x: cell.x, y: cell.y + 1 },     // North
                { x: cell.x + 1, y: cell.y + 1 }, // North-East (diagonal)
                { x: cell.x - 1, y: cell.y + 1 }, // North-West (diagonal)
            ];
            
            neighbors.forEach(neighborPos => {
                const neighbor = this.simulationEngine.getCellAt(neighborPos.x, neighborPos.y);
                if (neighbor && neighbor.fungus.id === cell.fungus.id) {
                    // Generate bridge key (sorted)
                    const key1 = `${cell.x},${cell.y}`;
                    const key2 = `${neighbor.x},${neighbor.y}`;
                    const bridgeKey = key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
                    
                    // Skip if already updated
                    if (updatedBridges.has(bridgeKey)) return;
                    updatedBridges.add(bridgeKey);
                    
                    const mesh = this.bridgeMeshes.get(bridgeKey);
                    if (mesh) {
                        const material = mesh.material as THREE.MeshStandardMaterial;
                        const baseIntensity = (cell.getEnergyRatio() + neighbor.getEnergyRatio()) / 2 * 0.3;
                        
                        // Highlight if this bridge belongs to the hovered fungus
                        if (this.hoveredFungusId !== null && cell.fungus.id === this.hoveredFungusId) {
                            material.emissiveIntensity = Math.min(baseIntensity + 0.4, 1.0);
                            material.roughness = 0.4;
                        } else {
                            material.emissiveIntensity = baseIntensity;
                            material.roughness = 0.7;
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Setup click handler for tiles to show popup
     */
    private setupTileClickHandler(): void {
        this.renderer.domElement.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Get all tile meshes as an array
            const tileMeshArray = Array.from(this.tileMeshes.values());
            
            // Check for intersections
            const intersects = this.raycaster.intersectObjects(tileMeshArray, false);
            
            if (intersects.length > 0) {
                // Find which tile was clicked
                const clickedMesh = intersects[0].object as THREE.Mesh;
                
                for (const [key, mesh] of this.tileMeshes.entries()) {
                    if (mesh === clickedMesh) {
                        const [x, y] = key.split(',').map(Number);
                        const tile = this.garden.getTile(x, y);
                        
                        if (tile) {
                            // Check if there's a cell at this position
                            const cell = this.simulationEngine?.getCellAt(x, y);
                            
                            // Show popup at mouse position
                            this.tilePopup.show(tile, this.config, event.clientX, event.clientY, cell, 0.016, this.simulationEngine);
                        }
                        break;
                    }
                }
            }
        });
        
        // Close popup when clicking outside
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.tilePopup.hide();
        });
    }
    
    /**
     * Setup the complete lighting system for the diorama
     * Implements a 3-point lighting setup for realistic miniature appearance
     */
    private setupLighting(): void {
        // 1. AMBIENT LIGHT - Base fill light for the room
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
        
        // 2. KEY LIGHT (Main Desk Lamp) - Primary directional light
        this.sunLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
        this.sunLight.position.set(15, 20, 10);
        this.sunLight.castShadow = true;
        
        // High-quality shadow configuration
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 5;
        this.sunLight.shadow.camera.far = 50;
        
        // Optimize shadow frustum to cover the garden area tightly
        const shadowSize = this.config.gridSize * 0.7;
        this.sunLight.shadow.camera.left = -shadowSize;
        this.sunLight.shadow.camera.right = shadowSize;
        this.sunLight.shadow.camera.top = shadowSize;
        this.sunLight.shadow.camera.bottom = -shadowSize;
        
        // Fine-tune shadow quality
        this.sunLight.shadow.bias = -0.0005; // Reduce shadow acne
        this.sunLight.shadow.normalBias = 0.02; // Additional acne prevention
        this.sunLight.shadow.radius = 2; // Soft shadow edges
        
        this.scene.add(this.sunLight);
        
        // 3. FILL LIGHT - Softer secondary light to reduce harsh shadows
        this.fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.3); // Cool blue-white
        this.fillLight.position.set(-10, 15, -5);
        // Fill light doesn't cast shadows (performance + aesthetics)
        this.fillLight.castShadow = false;
        this.scene.add(this.fillLight);
        
        // 4. RIM LIGHT - Point light for edge definition and depth
        this.rimLight = new THREE.PointLight(0xffffff, 0.4, 50); // Soft white
        this.rimLight.position.set(-8, 12, 8);
        this.rimLight.castShadow = false; // Keep performance reasonable
        this.scene.add(this.rimLight);
    }
    
    /**
     * Setup post-processing effects for tilt-shift miniature appearance
     * Uses EffectComposer with BokehPass for depth-of-field
     */
    private setupPostProcessing(): void {
        // Create effect composer
        this.composer = new EffectComposer(this.renderer);
        
        // Add render pass (base scene rendering)
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add Bokeh (Depth of Field) pass for tilt-shift effect
        // This creates the characteristic miniature/macro photography look
        // Adjusted for wider depth-of-field: entire garden stays sharp
        this.bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 15.0,      // Focus distance - at garden center depth
            aperture: 0.0005,  // Smaller aperture = less blur, wider depth of field
            maxblur: 0.01,   // Reduced maximum blur for subtle effect
        });
        
        this.composer.addPass(this.bokehPass);
    }
    
    /**
     * Create the diorama environment - desk surface and garden box
     */
    private createDioramaEnvironment(): void {
        // Create wooden desk surface
        this.createDeskSurface();
        
        // Create the garden box that holds the tiles
        this.createGardenBox();
    }
    
    /**
     * Create a large wooden desk surface as the background
     * Using PBR materials for realistic wood appearance
     */
    private createDeskSurface(): void {
        const deskSize = this.config.gridSize * 3; // Much larger than garden
        const deskThickness = 2;
        
        const geometry = new THREE.BoxGeometry(deskSize, deskThickness, deskSize);
        
        // PBR wood material - matte, non-metallic
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Saddle brown
            roughness: 0.8, // Matte wood finish
            metalness: 0.0, // Wood is not metallic
        });
        
        this.deskSurface = new THREE.Mesh(geometry, material);
        
        // Position desk below the garden
        this.deskSurface.position.set(0, -deskThickness / 2 - 0.5, 0);
        
        // Desk receives shadows but doesn't cast them
        this.deskSurface.receiveShadow = true;
        this.deskSurface.castShadow = false;
        
        this.scene.add(this.deskSurface);
    }
    
    /**
     * Create the raised garden box with walls
     * Using PBR materials for realistic painted wood toy appearance
     */
    private createGardenBox(): void {
        const boxSize = this.config.gridSize + 0.4; // Slightly larger than tiles
        const boxDepth = 0.3; // Depth of the box base
        const wallHeight = 0.2; // Height of walls above base
        const wallThickness = 0.15;
        
        // Create the base of the garden box - dark wood
        const baseGeometry = new THREE.BoxGeometry(boxSize, boxDepth, boxSize);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B4423, // Dark wood brown
            roughness: 0.7, // Slightly rough wood
            metalness: 0.0, // Non-metallic
        });
        
        this.gardenBox = new THREE.Mesh(baseGeometry, baseMaterial);
        this.gardenBox.position.set(0, -boxDepth / 2, 0);
        
        // Garden box receives and casts shadows
        this.gardenBox.receiveShadow = true;
        this.gardenBox.castShadow = true;
        
        this.scene.add(this.gardenBox);
        
        // Create walls around the garden box - painted wood
        this.gardenBoxWalls = new THREE.Group();
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B6914, // Goldenrod brown (lighter wood)
            roughness: 0.6, // Semi-matte painted wood
            metalness: 0.0, // Non-metallic
        });
        
        // North wall (positive Z)
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(boxSize + wallThickness * 2, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, boxSize / 2 + wallThickness / 2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.gardenBoxWalls.add(northWall);
        
        // South wall (negative Z)
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(boxSize + wallThickness * 2, wallHeight, wallThickness),
            wallMaterial
        );
        southWall.position.set(0, wallHeight / 2, -boxSize / 2 - wallThickness / 2);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        this.gardenBoxWalls.add(southWall);
        
        // East wall (positive X)
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, boxSize),
            wallMaterial
        );
        eastWall.position.set(boxSize / 2 + wallThickness / 2, wallHeight / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.gardenBoxWalls.add(eastWall);
        
        // West wall (negative X)
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, boxSize),
            wallMaterial
        );
        westWall.position.set(-boxSize / 2 - wallThickness / 2, wallHeight / 2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        this.gardenBoxWalls.add(westWall);
        
        this.scene.add(this.gardenBoxWalls);
    }
    
    /**
     * Create 3D meshes for all tiles in the garden
     * Tiles are slightly raised and have distinct borders for board-game feel
     * Using PBR materials for realistic painted plastic/clay toy appearance
     */
    private createTileMeshes(): void {
        const tileSize = 0.95; // Slightly smaller to show gaps between tiles
        const baseTileHeight = 0.1;
        const tileGap = 0.05; // Gap between tiles for board-game look
        
        for (let x = 0; x < this.config.gridSize; x++) {
            for (let y = 0; y < this.config.gridSize; y++) {
                const tile = this.garden.getTile(x, y);
                if (!tile) continue;
                
                // Create tile with slightly beveled edges
                const geometry = new THREE.BoxGeometry(tileSize, baseTileHeight, tileSize);
                
                // PBR material - matte painted plastic/clay toy appearance
                const material = new THREE.MeshStandardMaterial({
                    color: 0x2ecc71,
                    roughness: 0.7, // Matte finish like painted toys
                    metalness: 0.0, // Plastic/clay is not metallic
                    emissive: 0x000000,
                    emissiveIntensity: 0,
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                
                // Add darker edge lines with higher opacity for board-game feel
                const edges = new THREE.EdgesGeometry(geometry);
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x1a1a1a, // Darker edges
                    linewidth: 2,
                    transparent: true,
                    opacity: 0.6, // More visible
                });
                const edgeLines = new THREE.LineSegments(edges, lineMaterial);
                mesh.add(edgeLines);
                
                // Position tile (centered grid at origin, with small gaps)
                const offsetX = x - this.config.gridSize / 2 + 0.5;
                const offsetZ = y - this.config.gridSize / 2 + 0.5;
                mesh.position.set(offsetX, baseTileHeight / 2 + 0.05, offsetZ); // Slightly raised above base
                
                // Enable shadow casting and receiving
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                this.scene.add(mesh);
                this.tileMeshes.set(`${x},${y}`, mesh);
            }
        }
    }
    
    /**
     * Create the grid helper for visual reference
     * Now positioned on the garden box base
     */
    private createGridHelper(): void {
        this.gridHelper = new THREE.GridHelper(
            this.config.gridSize,
            this.config.gridSize,
            0x4a3520,  // Darker brown for grid
            0x3a2510   // Even darker brown
        );
        this.gridHelper.position.y = 0.01; // Just above garden box base
        this.scene.add(this.gridHelper);
    }
    
    /**
     * Update visual appearance of a single tile based on its energy state
     * Using PBR material properties for realistic toy appearance
     */
    private updateTileVisual(tile: Tile): void {
        const mesh = this.tileMeshes.get(`${tile.x},${tile.y}`);
        if (!mesh) return;
        
        const material = mesh.material as THREE.MeshStandardMaterial;
        const fillRatio = tile.getFillRatio(this.config.maxTileEnergy);
        
        // Color based on energy level and occupancy
        if (tile.isEmpty) {
            // Empty tiles: green to cyan based on energy
            const color = new THREE.Color();
            color.setHSL(0.4 - fillRatio * 0.15, 0.7, 0.3 + fillRatio * 0.4);
            material.color.copy(color);
            material.emissive.copy(color);
            material.emissiveIntensity = fillRatio * 0.3; // Reduced for PBR (more subtle glow)
        } else {
            // Occupied tiles: orange to red based on energy
            const color = new THREE.Color();
            color.setHSL(0.1 - fillRatio * 0.1, 0.8, 0.4 + fillRatio * 0.3);
            material.color.copy(color);
            material.emissive.copy(color);
            material.emissiveIntensity = fillRatio * 0.2; // Reduced for PBR
        }
        
        // Adjust roughness based on energy - fuller tiles are slightly smoother
        material.roughness = 0.7 - fillRatio * 0.1; // 0.7 to 0.6
        
        // Height scaling based on energy level
        const baseHeight = 0.01;
        const maxHeight = 0.1;
        const targetHeight = baseHeight + (maxHeight - baseHeight) * fillRatio * 0.1;
        
        mesh.scale.y = targetHeight / baseHeight;
        mesh.position.y = targetHeight / 2 + 0.05; // Keep raised above base
    }
    
    /**
     * Update lighting based on day/night cycle
     * Day = desk lamp on (3-point lighting), Night = desk lamp off with soft night-light
     */
    public updateLighting(timeInCycle: number, sunEnergy: number): void {
        const isDaytime = this.config.isDaytime(timeInCycle);
        
        if (isDaytime) {
            // ===== DAYTIME: DESK LAMP SYSTEM ON =====
            
            // KEY LIGHT (Main desk lamp) - Strong, warm light
            const sunIntensity = (sunEnergy / this.config.maxSunEnergyEmission);
            this.sunLight.intensity = 0.9 + sunIntensity * 0.6; // 0.9 to 1.5
            this.sunLight.color.setHex(0xfff4e6); // Warm incandescent
            this.sunLight.position.set(15, 20, 10); // Fixed lamp position
            
            // FILL LIGHT - Soft secondary light (simulates room bounce light)
            this.fillLight.intensity = 0.35; // Gentle fill
            this.fillLight.color.setHex(0xe6f0ff); // Cool blue-white (window light)
            
            // RIM LIGHT - Edge definition
            this.rimLight.intensity = 0.5; // Noticeable edges
            this.rimLight.color.setHex(0xffffff); // Pure white
            
            // AMBIENT - Bright room lighting
            this.ambientLight.intensity = 0.45;
            this.ambientLight.color.setHex(0xffffff);
            
            // Daytime room background - soft pastel blue
            const bgColor = new THREE.Color(0xd4e4f7);
            this.scene.background = bgColor;
            if (this.scene.fog) {
                (this.scene.fog as THREE.Fog).color.copy(bgColor);
            }
            
        } else {
            // ===== NIGHTTIME: DESK LAMP OFF, NIGHT-LIGHT ON =====
            
            // KEY LIGHT becomes night-light - dim, warm glow (brighter than before)
            this.sunLight.intensity = 0.50; // Increased from 0.15
            this.sunLight.color.setHex(0xffa040); // Warm orange
            this.sunLight.position.set(-10, 8, -10); // Night-light location
            
            // FILL LIGHT - Subtle cool ambient (brighter)
            this.fillLight.intensity = 0.2; // Increased from 0.08
            this.fillLight.color.setHex(0x6080ff); // Lighter blue moonlight
            
            // RIM LIGHT - Visible edge definition (brighter)
            this.rimLight.intensity = 0.25; // Increased from 0.1
            this.rimLight.color.setHex(0x8888ff); // Lighter blue
            
            // AMBIENT - Brighter night visibility
            this.ambientLight.intensity = 0.3; // Increased from 0.12
            this.ambientLight.color.setHex(0x9999ee); // Lighter blue tint for night
            
            // Night background - dark blue but not black (lighter)
            const bgColor = new THREE.Color(0x2a2a4e); // Lighter than 0x1a1a2e
            this.scene.background = bgColor;
            if (this.scene.fog) {
                (this.scene.fog as THREE.Fog).color.copy(bgColor);
            }
        }
    }
    
    /**
     * Update all tile visuals based on current garden state
     * Optimized: Only update tiles with significant energy changes
     */
    public updateTileVisuals(): void {
        this.garden.getAllTiles().forEach(tile => {
            // Only update if tile energy changed significantly (>1% of max)
            const mesh = this.tileMeshes.get(`${tile.x},${tile.y}`);
            if (!mesh) return;
            
            const currentFillRatio = tile.getFillRatio(this.config.maxTileEnergy);
            const lastFillRatio = (mesh.userData.lastFillRatio as number) || 0;
            
            // Update if change is significant or occupancy changed
            if (Math.abs(currentFillRatio - lastFillRatio) > 0.01 || 
                mesh.userData.wasEmpty !== tile.isEmpty) {
                this.updateTileVisual(tile);
                mesh.userData.lastFillRatio = currentFillRatio;
                mesh.userData.wasEmpty = tile.isEmpty;
            }
        });
    }
    
    /**
     * Render the scene with post-processing effects
     */
    public render(): void {
        this.updateCameraControls();
        this.composer.render();
    }
    
    /**
     * Handle window resize events
     */
    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Clear and recreate all tile meshes (used when garden is restarted)
     */
    public recreateTileMeshes(newGarden: Garden): void {
        // Clear existing meshes
        this.tileMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.tileMeshes.clear();
        
        // Update garden reference
        this.garden = newGarden;
        
        // Create new meshes
        this.createTileMeshes();
    }
    
    /**
     * Cleanup resources
     */
    public dispose(): void {
        // Dispose of all tile meshes
        this.tileMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.tileMeshes.clear();
        
        // Dispose of grid helper
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
            this.gridHelper.geometry.dispose();
            (this.gridHelper.material as THREE.Material).dispose();
        }
        
        // Dispose of diorama elements
        if (this.deskSurface) {
            this.scene.remove(this.deskSurface);
            this.deskSurface.geometry.dispose();
            (this.deskSurface.material as THREE.Material).dispose();
        }
        
        if (this.gardenBox) {
            this.scene.remove(this.gardenBox);
            this.gardenBox.geometry.dispose();
            (this.gardenBox.material as THREE.Material).dispose();
        }
        
        if (this.gardenBoxWalls) {
            this.gardenBoxWalls.children.forEach(wall => {
                const mesh = wall as THREE.Mesh;
                mesh.geometry.dispose();
                (mesh.material as THREE.Material).dispose();
            });
            this.scene.remove(this.gardenBoxWalls);
        }
        
        // Dispose of renderer
        this.renderer.dispose();
        
        // Dispose of cell visuals
        this.disposeCellVisuals();
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
    }
    
    // ===== CELL VISUALIZATION METHODS =====
    
    /**
     * Update all cell visuals based on simulation state
     */
    public updateCellVisuals(simulation: SimulationEngine): void {
        // Store reference to simulation engine for cell lookup
        this.simulationEngine = simulation;
        
        const allCells = simulation.getAllCells();
        const allSpores = simulation.getAllSpores();
        
        // Track which cells and spores still exist
        const existingCellKeys = new Set<string>();
        const existingSporIndices = new Set<number>();
        
        // Update or create cell meshes
        allCells.forEach(cell => {
            const key = `${cell.x},${cell.y}`;
            existingCellKeys.add(key);
            
            if (this.cellMeshes.has(key)) {
                // Update existing cell
                this.updateCellMesh(cell);
            } else {
                // Create new cell
                this.createCellMesh(cell);
            }
            
            // Handle mushroom visuals
            if (cell.hasMushroom) {
                if (!this.mushroomMeshes.has(key)) {
                    this.createMushroomMesh(cell);
                } else {
                    this.updateMushroomMesh(cell);
                }
            } else {
                // Remove mushroom if it existed
                if (this.mushroomMeshes.has(key)) {
                    this.removeMushroomMesh(key);
                }
            }
        });
        
        // Update or create spore meshes
        allSpores.forEach((spore: Spore, index: number) => {
            existingSporIndices.add(index);
            
            if (this.sporeMeshes.has(index)) {
                this.updateSporeMesh(spore, index);
            } else {
                this.createSporeMesh(spore, index);
            }
        });
        
        // Remove cell meshes that no longer exist
        this.cellMeshes.forEach((mesh, key) => {
            if (!existingCellKeys.has(key)) {
                this.removeCellMesh(key);
            }
        });
        
        // Remove spore meshes that no longer exist
        this.sporeMeshes.forEach((mesh, index) => {
            if (!existingSporIndices.has(index)) {
                this.removeSporeMesh(index);
            }
        });
        
        // Update bridges connecting cells of same fungus
        this.updateBridges(simulation);
    }
    
    /**
     * Create a mesh for a fungus cell
     */
    private createCellMesh(cell: Cell): void {
        const key = `${cell.x},${cell.y}`;
        
        // Create a group to combine cylinder body with rounded top
        const group = new THREE.Group();
        
        const [r, g, b] = cell.fungus.dna.getDominantColor();
        const color = new THREE.Color(r, g, b);
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: cell.getEnergyRatio() * 0.5, // Glow based on energy
            metalness: 0.1,
            roughness: 0.6,
        });
        
        // Cylinder body (reduced segments for performance)
        const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12, 1, true); // Open on top
        const bodyMesh = new THREE.Mesh(bodyGeometry, material);
        bodyMesh.position.y = -0.1; // Position lower
        group.add(bodyMesh);
        
        // Rounded top (hemisphere)
        const topGeometry = new THREE.SphereGeometry(0.35, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); // Half sphere
        const topMesh = new THREE.Mesh(topGeometry, material);
        topMesh.position.y = 0.05; // Position at top
        group.add(topMesh);
        
        // Position above the tile
        group.position.set(cell.x - this.config.gridSize / 2 + 0.5, 0.4, cell.y - this.config.gridSize / 2 + 0.5);
        
        group.castShadow = true;
        group.receiveShadow = true;
        
        this.scene.add(group);
        this.cellMeshes.set(key, group as any);
    }
    
    /**
     * Update an existing cell mesh
     */
    private updateCellMesh(cell: Cell): void {
        const key = `${cell.x},${cell.y}`;
        const group = this.cellMeshes.get(key) as any as THREE.Group;
        
        if (!group) return;
        
        // Update both body and top materials
        group.children.forEach(child => {
            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;
            const [r, g, b] = cell.fungus.dna.getDominantColor();
            const color = new THREE.Color(r, g, b);
            
            // Update color and glow based on current state
            material.color.copy(color);
            material.emissive.copy(color);
            
            // Maintain highlight if this fungus is hovered
            if (this.hoveredFungusId === cell.fungus.id) {
                material.emissiveIntensity = Math.min(cell.getEnergyRatio() * 0.5 + 0.4, 1.0);
                material.roughness = 0.3;
            } else {
                material.emissiveIntensity = cell.getEnergyRatio() * 0.5;
                material.roughness = 0.6;
            }
        });
    }
    
    /**
     * Remove a cell mesh
     */
    private removeCellMesh(key: string): void {
        const group = this.cellMeshes.get(key) as any as THREE.Group;
        if (!group) return;
        
        this.scene.remove(group);
        group.children.forEach(child => {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.cellMeshes.delete(key);
    }
    
    /**
     * Create a mushroom mesh on a cell
     */
    private createMushroomMesh(cell: Cell): void {
        const key = `${cell.x},${cell.y}`;
        const group = new THREE.Group();
        
        // Add randomness to mushroom dimensions (±20% variation)
        const sizeVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const capRadiusVariation = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
        const stemRadiusVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
        
        // Mushroom stem (cylinder) - with random size variation
        const stemRadius = 0.25 * stemRadiusVariation;
        const stemHeight = 2.0 * sizeVariation;
        const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5e6d3,
            roughness: 0.8,
            metalness: 0.0,
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = stemHeight / 2;
        stem.castShadow = true;
        group.add(stem);
        
        // Mushroom cap (sphere) - with random radius variation
        const capRadius = 1.2 * capRadiusVariation;
        const capGeometry = new THREE.SphereGeometry(capRadius, 16, 12);
        const [r, g, b] = cell.fungus.dna.getDominantColor();
        const capColor = new THREE.Color(r, g, b);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: capColor,
            roughness: 0.7,
            metalness: 0.1,
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = stemHeight;
        cap.scale.y = 0.5; // Flatten more for wider appearance
        cap.castShadow = true;
        group.add(cap);
        
        // Position above the cell
        group.position.set(
            cell.x - this.config.gridSize / 2 + 0.5,
            0.4,
            cell.y - this.config.gridSize / 2 + 0.5
        );
        
        // Scale based on growth
        group.scale.setScalar(cell.mushroomGrowth);
        
        this.scene.add(group);
        this.mushroomMeshes.set(key, group);
    }
    
    /**
     * Update mushroom mesh scale based on growth
     */
    private updateMushroomMesh(cell: Cell): void {
        const key = `${cell.x},${cell.y}`;
        const group = this.mushroomMeshes.get(key);
        
        if (!group) return;
        
        // Update scale based on growth (0-1)
        group.scale.setScalar(cell.mushroomGrowth);
    }
    
    /**
     * Remove a mushroom mesh
     */
    private removeMushroomMesh(key: string): void {
        const group = this.mushroomMeshes.get(key);
        if (!group) return;
        
        this.scene.remove(group);
        group.children.forEach(child => {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.mushroomMeshes.delete(key);
    }
    
    /**
     * Create a spore mesh
     */
    private createSporeMesh(spore: Spore, index: number): void {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const color = new THREE.Color().setRGB(...spore.dna.getDominantColor());
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            metalness: 0.2,
            roughness: 0.4,
            transparent: true,
            opacity: 0.7,
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            spore.x - this.config.gridSize / 2 + 0.5,
            0.8, // Float above ground
            spore.y - this.config.gridSize / 2 + 0.5
        );
        
        this.scene.add(mesh);
        this.sporeMeshes.set(index, mesh);
    }
    
    /**
     * Update spore mesh (fade out as lifetime decreases)
     */
    private updateSporeMesh(spore: Spore, index: number): void {
        const mesh = this.sporeMeshes.get(index);
        if (!mesh) return;
        
        const material = mesh.material as THREE.MeshStandardMaterial;
        // Fade out based on remaining lifetime
        material.opacity = spore.lifetime / 10.0 * 0.7;
        
        // Gentle bobbing motion
        mesh.position.y = 0.8 + Math.sin(Date.now() * 0.003 + index) * 0.1;
    }
    
    /**
     * Remove a spore mesh
     */
    private removeSporeMesh(index: number): void {
        const mesh = this.sporeMeshes.get(index);
        if (!mesh) return;
        
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.sporeMeshes.delete(index);
    }
    
    /**
     * Update bridges connecting cells of the same fungus
     * Optimized to only recreate when cell network changes
     */
    private updateBridges(simulation: SimulationEngine): void {
        const allCells = simulation.getAllCells();
        
        // Track which bridges should exist
        const requiredBridges = new Set<string>();
        
        // Group cells by fungus ID
        const fungiCells = new Map<number, Cell[]>();
        allCells.forEach(cell => {
            const fungusId = cell.fungus.id;
            if (!fungiCells.has(fungusId)) {
                fungiCells.set(fungusId, []);
            }
            fungiCells.get(fungusId)!.push(cell);
        });
        
        // For each fungus, check which bridges should exist
        fungiCells.forEach((cells, fungusId) => {
            cells.forEach(cell => {
                // Check East, North, and diagonal directions to avoid duplicates
                // Only check half the neighbors (right and up directions) to avoid creating duplicate bridges
                const neighbors = [
                    { x: cell.x + 1, y: cell.y },     // East
                    { x: cell.x, y: cell.y + 1 },     // North
                    { x: cell.x + 1, y: cell.y + 1 }, // North-East (diagonal)
                    { x: cell.x - 1, y: cell.y + 1 }, // North-West (diagonal)
                ];
                
                neighbors.forEach(neighborPos => {
                    const neighbor = simulation.getCellAt(neighborPos.x, neighborPos.y);
                    if (neighbor && neighbor.fungus.id === fungusId) {
                        // Generate bridge key (sorted)
                        const key1 = `${cell.x},${cell.y}`;
                        const key2 = `${neighbor.x},${neighbor.y}`;
                        const bridgeKey = key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
                        requiredBridges.add(bridgeKey);
                        
                        // Create bridge if it doesn't exist
                        if (!this.bridgeMeshes.has(bridgeKey)) {
                            this.createBridge(cell, neighbor);
                        } else {
                            // Update existing bridge glow based on energy
                            this.updateBridge(bridgeKey, cell, neighbor);
                        }
                    }
                });
            });
        });
        
        // Remove bridges that shouldn't exist anymore
        const bridgesToRemove: string[] = [];
        this.bridgeMeshes.forEach((mesh, key) => {
            if (!requiredBridges.has(key)) {
                bridgesToRemove.push(key);
            }
        });
        
        bridgesToRemove.forEach(key => {
            const mesh = this.bridgeMeshes.get(key);
            if (mesh) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                (mesh.material as THREE.Material).dispose();
                this.bridgeMeshes.delete(key);
            }
        });
    }
    
    /**
     * Update an existing bridge's glow based on connected cells' energy and hover state
     */
    private updateBridge(bridgeKey: string, cell1: Cell, cell2: Cell): void {
        const mesh = this.bridgeMeshes.get(bridgeKey);
        if (!mesh) return;
        
        const material = mesh.material as THREE.MeshStandardMaterial;
        const baseIntensity = (cell1.getEnergyRatio() + cell2.getEnergyRatio()) / 2 * 0.3;
        
        // Highlight if this bridge belongs to the hovered fungus
        if (this.hoveredFungusId !== null && cell1.fungus.id === this.hoveredFungusId) {
            material.emissiveIntensity = Math.min(baseIntensity + 0.4, 1.0);
            material.roughness = 0.4;
        } else {
            material.emissiveIntensity = baseIntensity;
            material.roughness = 0.7;
        }
    }
    
    /**
     * Create a bridge (horizontal cylinder) connecting two adjacent cells
     */
    private createBridge(cell1: Cell, cell2: Cell): void {
        // Calculate positions
        const pos1 = new THREE.Vector3(
            cell1.x - this.config.gridSize / 2 + 0.5,
            0.4, // Same height as cells
            cell1.y - this.config.gridSize / 2 + 0.5
        );
        const pos2 = new THREE.Vector3(
            cell2.x - this.config.gridSize / 2 + 0.5,
            0.4,
            cell2.y - this.config.gridSize / 2 + 0.5
        );
        
        // Calculate distance and direction
        const direction = new THREE.Vector3().subVectors(pos2, pos1);
        const distance = direction.length();
        
        // Make bridge longer by extending it slightly beyond cell centers
        const extendedDistance = distance * 1.3; // 30% longer
        
        // Calculate radius based on cell energy - wider on the side with more energy
        const energy1 = cell1.getEnergyRatio();
        const energy2 = cell2.getEnergyRatio();
        const baseRadius = 0.15;
        
        // Radius variation based on average energy and energy difference
        const avgEnergy = (energy1 + energy2) / 2;
        const energyDiff = Math.abs(energy2 - energy1);
        const radiusVariation = 0.2 + (avgEnergy * 0.3) + (energyDiff * 0.2); // 0.2 to 0.7 based on energy levels
        
        // Top radius corresponds to cell2 (end), bottom to cell1 (start)
        const radiusTop = baseRadius + (energy2 * radiusVariation);
        const radiusBottom = baseRadius + (energy1 * radiusVariation);
        
        // Create tapered cylinder as bridge - wider on side with more energy
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, extendedDistance, 8);
        const [r, g, b] = cell1.fungus.dna.getDominantColor();
        const color = new THREE.Color(r, g, b);
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: (cell1.getEnergyRatio() + cell2.getEnergyRatio()) / 2 * 0.3, // Average energy glow
            metalness: 0.1,
            roughness: 0.7,
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Flatten the bridge in the Y direction (make it wider but not taller)
        mesh.scale.set(1, 0.6, 1); // Scale Y to 60% to make it flatter
        
        // Position at midpoint
        mesh.position.copy(pos1).add(direction.multiplyScalar(0.5));
        
        // Rotate to connect the two cells
        // Default cylinder is vertical (Y-axis), need to align with connection direction
        const axis = new THREE.Vector3(0, 1, 0).cross(direction.normalize());
        const angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(direction.normalize()));
        
        if (axis.length() > 0.001) {
            mesh.quaternion.setFromAxisAngle(axis.normalize(), angle);
        } else if (direction.y < 0) {
            mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
        }
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.scene.add(mesh);
        
        // Store with unique key (sorted to avoid duplicates)
        const key1 = `${cell1.x},${cell1.y}`;
        const key2 = `${cell2.x},${cell2.y}`;
        const bridgeKey = key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
        this.bridgeMeshes.set(bridgeKey, mesh);
    }
    
    /**
     * Dispose all cell-related visuals
     */
    private disposeCellVisuals(): void {
        // Dispose cell meshes
        this.cellMeshes.forEach((mesh, key) => {
            this.removeCellMesh(key);
        });
        
        // Dispose bridge meshes
        this.bridgeMeshes.forEach((mesh, key) => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.bridgeMeshes.clear();
        
        // Dispose mushroom meshes
        this.mushroomMeshes.forEach((group, key) => {
            this.removeMushroomMesh(key);
        });
        
        // Dispose spore meshes
        this.sporeMeshes.forEach((mesh, index) => {
            this.removeSporeMesh(index);
        });
    }
}
