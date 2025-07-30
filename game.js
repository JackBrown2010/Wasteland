import Matter from 'https://esm.sh/matter-js@0.19.0';

const { Engine, Render, World, Bodies, Body, Events, Vector } = Matter;

class PhysicsFlightGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.livesElement = document.getElementById('lives');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Level selection system
        this.currentWeek = 1;
        this.currentDay = 1;
        this.currentTimeOfDay = 'dawn';
        this.levelProgress = this.loadProgress();
        
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameRunning = false;
        this.scrollSpeed = 2;
        this.scrollOffset = 0;
        
        this.jumpCooldown = 0;
        this.jumpForce = 0.025; // Increased force for more responsive flight
        this.isHolding = false;
        this.flyForce = 0.002; // Smoother, gradual force
        this.maxFlySpeed = -3; // Maximum upward velocity
        
        this.obstacles = []; // Initialize obstacles array
        
        this.setupCanvas();
        this.initPhysics();
        this.createPlayer();
        this.setupControls();
        this.setupLevelSystem();
        this.createLevelSelectionUI();
    }
    
    loadProgress() {
        const saved = localStorage.getItem('physicsFlightProgress');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveProgress() {
        localStorage.setItem('physicsFlightProgress', JSON.stringify(this.levelProgress));
    }
    
    setupLevelSystem() {
        // 48 levels organized as 3 weeks × 4 days × 4 times
        this.levelDatabase = this.generateLevelDatabase();
        
        // Initialize obstacles array
        this.obstacles = [];
    }
    
    generateLevelDatabase() {
        const levels = [];
        
        // Generate 48 unique levels
        for (let week = 1; week <= 3; week++) {
            for (let day = 1; day <= 4; day++) {
                for (let timeIndex = 0; timeIndex < 4; timeIndex++) {
                    const timeOfDay = ['dawn', 'noon', 'dusk', 'night'][timeIndex];
                    const levelNumber = (week - 1) * 16 + (day - 1) * 4 + timeIndex + 1;
                    
                    levels.push({
                        id: levelNumber,
                        week: week,
                        day: day,
                        timeOfDay: timeOfDay,
                        name: `Week ${week} Day ${day} ${timeOfDay}`,
                        obstacles: this.generateLevelObstacles(levelNumber),
                        scrollSpeed: 2 + (levelNumber * 0.15),
                        background: this.getBackgroundForTime(timeOfDay),
                        difficulty: Math.min(5, Math.floor(levelNumber / 8) + 1)
                    });
                }
            }
        }
        
        return levels;
    }
    
    generateLevelObstacles(levelNumber) {
        const levelLayouts = {
            1: [
                { 
                    type: 'handdrawn_wall', 
                    path: [
                        [350, 50], [380, 30], [400, 40], [420, 60], [410, 80],
                        [390, 95], [370, 90], [355, 75], [350, 60], [350, 50]
                    ],
                    fill: '#000000'
                },
                { 
                    type: 'handdrawn_wall', 
                    path: [
                        [580, 450], [600, 420], [620, 440], [610, 480], [590, 500],
                        [570, 490], [555, 470], [565, 450], [580, 450]
                    ],
                    fill: '#000000'
                },
                { 
                    type: 'handdrawn_laser', 
                    start: [800, 150], 
                    end: [800, 350], 
                    width: 5
                },
                { 
                    type: 'handdrawn_cave', 
                    path: [
                        [950, 80], [980, 60], [1050, 70], [1080, 90], [1070, 120],
                        [1050, 150], [1020, 160], [990, 155], [960, 140], [950, 110], [950, 80]
                    ],
                    fill: '#000000'
                }
            ],
            2: [
                {
                    type: 'handdrawn_mountain',
                    path: [
                        [420, 180], [450, 160], [480, 140], [510, 130], [540, 140],
                        [570, 160], [590, 180], [600, 210], [590, 240], [570, 260],
                        [540, 270], [510, 280], [480, 270], [450, 260], [430, 240],
                        [420, 210], [420, 180]
                    ],
                    fill: '#000000'
                },
                {
                    type: 'handdrawn_saw',
                    x: 680, y: 320, radius: 35,
                    blade_path: [
                        [680, 285], [703, 292], [714, 315], [707, 338], [684, 345],
                        [661, 338], [650, 315], [657, 292], [680, 285]
                    ]
                },
                {
                    type: 'handdrawn_wall',
                    path: [
                        [830, 400], [850, 390], [870, 410], [880, 440], [870, 470],
                        [850, 490], [830, 500], [810, 490], [800, 470], [800, 440],
                        [810, 410], [830, 400]
                    ],
                    fill: '#000000'
                },
                {
                    type: 'handdrawn_laser',
                    start: [1050, 100], end: [1050, 320], width: 5
                }
            ],
            3: [
                {
                    type: 'handdrawn_plasma_field',
                    boundary_path: [
                        [470, 200], [530, 190], [570, 210], [590, 250], [580, 290],
                        [550, 310], [520, 320], [480, 310], [450, 290], [450, 250],
                        [470, 200]
                    ],
                    energy_lines: true
                },
                {
                    type: 'handdrawn_ruined_wall',
                    path: [
                        [680, 80], [720, 60], [760, 70], [780, 90], [790, 120],
                        [785, 150], [770, 170], [740, 180], [710, 175], [690, 165],
                        [680, 140], [680, 110], [680, 80]
                    ],
                    fill: '#000000',
                    cracks: true
                },
                {
                    type: 'handdrawn_tornado',
                    spiral: {
                        x: 920, y: 400, 
                        outer_radius: 30, inner_radius: 10, 
                        turns: 5
                    }
                },
                {
                    type: 'handdrawn_laser',
                    start: [1120, 180], end: [1120, 400], width: 5
                }
            ],
            4: [
                {
                    type: 'handdrawn_spike_cluster',
                    spines: [
                        [[380, 160], [420, 150], [440, 170], [425, 190], [395, 200], [380, 180]],
                        [[400, 130], [440, 120], [460, 140], [445, 160], [415, 170], [400, 150]],
                        [[360, 190], [400, 180], [420, 200], [405, 220], [375, 230], [360, 210]]
                    ]
                },
                {
                    type: 'handdrawn_laser',
                    start: [620, 250], end: [620, 470], width: 5
                },
                {
                    type: 'handdrawn_crystal',
                    vertices: [
                        [820, 130], [840, 110], [860, 120], [870, 150], [850, 170],
                        [830, 165], [810, 145], [820, 130]
                    ],
                    glow: true
                },
                {
                    type: 'handdrawn_hazard_wall',
                    path: [
                        [1000, 420], [1030, 410], [1060, 430], [1040, 460],
                        [1020, 480], [990, 490], [960, 470], [950, 440], [970, 420],
                        [1000, 420]
                    ],
                    spikes: [
                        [980, 445], [995, 440], [1010, 445], [1025, 440]
                    ]
                }
            ],
            5: [
                {
                    type: 'handdrawn_saw',
                    x: 470, y: 220, radius: 40,
                    blade_path: [
                        [470, 180], [499, 188], [512, 218], [504, 248], [475, 256],
                        [446, 248], [433, 218], [441, 188], [470, 180]
                    ]
                },
                {
                    type: 'handdrawn_spike_wall',
                    base_path: [
                        [660, 300], [720, 280], [760, 290], [780, 320], [770, 350],
                        [740, 370], [710, 380], [680, 370], [660, 350], [665, 320],
                        [675, 300], [690, 300]
                    ],
                    spike_count: 8
                },
                {
                    type: 'handdrawn_laser',
                    start: [870, 220], end: [870, 440], width: 5
                },
                {
                    type: 'handdrawn_plasma_vortex',
                    center: [1070, 320],
                    arms: 3,
                    swirl_radius: 60
                }
            ],
            6: [
                {
                    type: 'handdrawn_missile',
                    body_path: [
                        [490, 240], [525, 235], [560, 240], [570, 245], [565, 250],
                        [550, 252], [520, 250], [495, 248], [490, 245], [490, 240]
                    ],
                    fins: [
                        [525, 232], [535, 235], [535, 240], [525, 238],
                        [525, 252], [515, 250], [515, 245], [525, 247]
                    ]
                },
                {
                    type: 'handdrawn_wall',
                    path: [
                        [700, 120], [730, 100], [760, 110], [780, 130], [770, 160],
                        [750, 180], [730, 185], [710, 180], [690, 160], [700, 130],
                        [700, 120]
                    ],
                    fill: '#000000'
                },
                {
                    type: 'handdrawn_saw',
                    x: 930, y: 390, radius: 35,
                    blade_path: [
                        [930, 355], [957, 362], [970, 392], [962, 422], [933, 430],
                        [904, 422], [891, 392], [899, 362], [930, 355]
                    ]
                },
                {
                    type: 'handdrawn_laser',
                    start: [1140, 180], end: [1140, 420], width: 5
                }
            ],
            7: [
                {
                    type: 'handdrawn_plasma_snake',
                    chain: [[460, 180], [480, 200], [520, 220], [570, 235], [610, 250]],
                    width: 30,
                    animated: true
                },
                {
                    type: 'handdrawn_spike_wall',
                    base_path: [
                        [690, 300], [720, 280], [760, 290], [780, 320], [770, 350],
                        [740, 370], [710, 380], [680, 370], [660, 350], [665, 320],
                        [675, 300], [690, 300]
                    ],
                    spike_count: 8
                },
                {
                    type: 'handdrawn_missile',
                    body_path: [
                        [930, 270], [965, 265], [1000, 270], [1010, 275], [1005, 280],
                        [990, 282], [960, 280], [935, 278], [930, 275], [930, 270]
                    ],
                    fins: [
                        [965, 262], [975, 265], [975, 270], [965, 268],
                        [965, 282], [955, 280], [955, 275], [965, 277]
                    ]
                },
                {
                    type: 'handdrawn_laser',
                    start: [1180, 130], end: [1180, 350], width: 5
                }
            ],
            8: [
                {
                    type: 'handdrawn_saw',
                    x: 450, y: 200, radius: 45,
                    blade_path: [
                        [450, 155], [483, 164], [498, 200], [489, 236], [455, 245],
                        [421, 236], [406, 200], [415, 164], [450, 155]
                    ]
                },
                {
                    type: 'handdrawn_saw',
                    x: 660, y: 440, radius: 40,
                    blade_path: [
                        [660, 400], [691, 408], [704, 440], [696, 472], [660, 480],
                        [624, 472], [611, 440], [619, 408], [660, 400]
                    ]
                },
                {
                    type: 'handdrawn_spike_wall',
                    base_path: [
                        [840, 280], [870, 260], [900, 270], [920, 300], [910, 330],
                        [880, 350], [850, 340], [830, 320], [840, 290], [840, 280]
                    ],
                    spike_count: 6
                },
                {
                    type: 'handdrawn_missile',
                    body_path: [
                        [1040, 240], [1075, 235], [1110, 240], [1120, 245], [1115, 250],
                        [1100, 252], [1070, 250], [1045, 248], [1040, 245], [1040, 240]
                    ],
                    fins: [
                        [1075, 232], [1085, 235], [1085, 240], [1075, 238],
                        [1075, 252], [1065, 250], [1065, 245], [1075, 247]
                    ]
                }
            ]
        };
        
        // Generate remaining levels using pattern variation
        const completeLayouts = {};
        for (let i = 1; i <= 48; i++) {
            const baseLevel = ((i - 1) % 8) + 1;
            const layout = levelLayouts[baseLevel] || levelLayouts[1];
            
            completeLayouts[i] = layout.map((obstacle, idx) => {
                const shiftedObstacle = {...obstacle};
                
                // Handle different obstacle types
                if (obstacle.path) {
                    shiftedObstacle.path = obstacle.path.map(([x, y]) => [x + (i-1)*100, y]);
                }
                if (obstacle.start) {
                    shiftedObstacle.start = [obstacle.start[0] + (i-1)*100, obstacle.start[1]];
                }
                if (obstacle.end) {
                    shiftedObstacle.end = [obstacle.end[0] + (i-1)*100, obstacle.end[1]];
                }
                if (obstacle.x !== undefined) {
                    shiftedObstacle.x = obstacle.x + (i-1)*100;
                }
                if (obstacle.center) {
                    shiftedObstacle.center = [obstacle.center[0] + (i-1)*100, obstacle.center[1]];
                }
                if (obstacle.spiral) {
                    shiftedObstacle.spiral = {...obstacle.spiral};
                    shiftedObstacle.spiral.x = obstacle.spiral.x + (i-1)*100;
                }
                if (obstacle.chain) {
                    shiftedObstacle.chain = obstacle.chain.map(([x, y]) => [x + (i-1)*100, y]);
                }
                if (obstacle.spines) {
                    shiftedObstacle.spines = obstacle.spines.map(spine => 
                        spine.map(([x, y]) => [x + (i-1)*100, y])
                    );
                }
                if (obstacle.base_path) {
                    shiftedObstacle.base_path = obstacle.base_path.map(([x, y]) => [x + (i-1)*100, y]);
                }
                if (obstacle.body_path) {
                    shiftedObstacle.body_path = obstacle.body_path.map(([x, y]) => [x + (i-1)*100, y]);
                }
                if (obstacle.fins) {
                    shiftedObstacle.fins = obstacle.fins.map(([x, y]) => [x + (i-1)*100, y]);
                }
                if (obstacle.vertices) {
                    shiftedObstacle.vertices = obstacle.vertices.map(([x, y]) => [x + (i-1)*100, y]);
                }
                
                return shiftedObstacle;
            });
        }
        
        return completeLayouts[levelNumber] || [];
    }
    
    getBackgroundForTime(timeOfDay) {
        const backgrounds = {
            dawn: 'linear-gradient(180deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)',
            noon: 'linear-gradient(180deg, #00c6ff 0%, #0072ff 50%, #00c6ff 100%)',
            dusk: 'linear-gradient(180deg, #ff7b00 0%, #ff006a 50%, #8a00ff 100%)',
            night: 'linear-gradient(180deg, #001122 0%, #003355 50%, #001122 100%)'
        };
        return backgrounds[timeOfDay];
    }
    
    createLevelSelectionUI() {
        // Create level selection overlay
        const levelSelect = document.createElement('div');
        levelSelect.id = 'levelSelect';
        levelSelect.innerHTML = `
            <div class="level-select-container">
                <h1>Select Level</h1>
                <div class="week-selector">
                    <button class="week-btn active" data-week="1">Week 1</button>
                    <button class="week-btn" data-week="2">Week 2</button>
                    <button class="week-btn" data-week="3">Week 3</button>
                </div>
                <div class="day-selector">
                    <button class="day-btn active" data-day="1">Day 1</button>
                    <button class="day-btn" data-day="2">Day 2</button>
                    <button class="day-btn" data-day="3">Day 3</button>
                    <button class="day-btn" data-day="4">Day 4</button>
                </div>
                <div class="level-grid">
                    <button class="level-btn dawn" data-time="dawn">Dawn</button>
                    <button class="level-btn noon" data-time="noon">Noon</button>
                    <button class="level-btn dusk" data-time="dusk">Dusk</button>
                    <button class="level-btn night" data-time="night">Night</button>
                </div>
                <button class="back-btn">Back to Game</button>
            </div>
        `;
        
        const styles = document.createElement('style');
        styles.textContent = `
            #levelSelect {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                font-family: 'Space Mono', monospace;
            }
            
            .level-select-container {
                background: #111;
                border: 2px solid #333;
                border-radius: 10px;
                padding: 40px;
                text-align: center;
                color: white;
                max-width: 600px;
                width: 90%;
            }
            
            .level-select-container h1 {
                margin-bottom: 30px;
                color: #00ff88;
            }
            
            .week-selector, .day-selector {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .week-btn, .day-btn, .level-btn {
                background: #222;
                border: 1px solid #444;
                color: #ccc;
                padding: 10px 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-radius: 5px;
            }
            
            .week-btn.active, .day-btn.active, .level-btn:hover {
                background: #007acc;
                color: white;
                border-color: #007acc;
            }
            
            .level-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin: 30px 0;
            }
            
            .level-btn {
                padding: 20px;
                font-size: 16px;
                position: relative;
                overflow: hidden;
            }
            
            .level-btn.dawn { background: linear-gradient(135deg, #ff6b6b, #ffd93d); }
            .level-btn.noon { background: linear-gradient(135deg, #00c6ff, #0072ff); }
            .level-btn.dusk { background: linear-gradient(135deg, #ff7b00, #ff006a); }
            .level-btn.night { background: linear-gradient(135deg, #001122, #003355); }
            
            .level-btn.completed::after {
                content: "✓";
                position: absolute;
                top: 5px;
                right: 10px;
                color: #00ff88;
                font-size: 20px;
            }
            
            .level-btn.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .back-btn {
                background: #007acc;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                cursor: pointer;
                border-radius: 5px;
                margin-top: 20px;
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(levelSelect);
        
        // Event listeners
        levelSelect.addEventListener('click', (e) => {
            if (e.target.classList.contains('week-btn')) {
                this.currentWeek = parseInt(e.target.dataset.week);
                this.updateLevelButtons();
            }
            
            if (e.target.classList.contains('day-btn')) {
                this.currentDay = parseInt(e.target.dataset.day);
                this.updateLevelButtons();
            }
            
            if (e.target.classList.contains('level-btn')) {
                const timeOfDay = e.target.dataset.time;
                this.loadLevel(this.currentWeek, this.currentDay, timeOfDay);
            }
            
            if (e.target.classList.contains('back-btn')) {
                levelSelect.style.display = 'none';
            }
        });
        
        this.levelSelectUI = levelSelect;
        this.updateLevelButtons();
    }
    
    updateLevelButtons() {
        const buttons = this.levelSelectUI.querySelectorAll('.week-btn, .day-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        this.levelSelectUI.querySelector(`[data-week="${this.currentWeek}"]`).classList.add('active');
        this.levelSelectUI.querySelector(`[data-day="${this.currentDay}"]`).classList.add('active');
        
        // Update level button states - sequential unlock only
        const levelButtons = this.levelSelectUI.querySelectorAll('.level-btn');
        levelButtons.forEach(btn => {
            const timeOfDay = btn.dataset.time;
            const levelId = (this.currentWeek - 1) * 16 + (this.currentDay - 1) * 4 + 
                           ['dawn', 'noon', 'dusk', 'night'].indexOf(timeOfDay) + 1;
            
            btn.classList.remove('completed', 'locked');
            
            if (this.levelProgress[levelId]) {
                btn.classList.add('completed');
            } else if (levelId > 1 && !this.levelProgress[levelId - 1]) {
                btn.classList.add('locked');
            }
        });
    }
    
    loadLevel(week, day, timeOfDay) {
        const levelId = (week - 1) * 16 + (day - 1) * 4 + ['dawn', 'noon', 'dusk', 'night'].indexOf(timeOfDay) + 1;
        const levelData = this.levelDatabase[levelId - 1];
        
        if (!levelData) return;
        
        // Check if level is locked (sequential unlock only)
        if (levelId > 1 && !this.levelProgress[levelId - 1]) {
            return;
        }
        
        this.levelSelectUI.style.display = 'none';
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        
        // Update UI
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.levelElement.textContent = `${levelData.name}`;
        this.livesElement.textContent = `Lives: ${this.lives}`;
        
        // Set background
        this.canvas.style.background = levelData.background;
        
        // Reset player
        Body.setPosition(this.player, { x: 150, y: 300 });
        Body.setVelocity(this.player, { x: 0, y: 0 });
        
        // Load level obstacles from pre-defined set
        this.loadLevelObstacles(levelData.obstacles);
        
        // Set current level reference
        this.currentLevel = levelId;
        
        // Start the level immediately
        this.gameRunning = true;
    }
    
    loadLevelObstacles(obstacleData) {
        // Clear existing obstacles
        this.obstacles.forEach(obstacle => {
            World.remove(this.world, obstacle.body);
        });
        this.obstacles = [];
        
        // Add new hand-drawn obstacles
        obstacleData.forEach(data => {
            if (data && data.type) { // Ensure data exists
                this.createHandDrawnObstacle(data);
            }
        });
    }
    
    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }
    
    initPhysics() {
        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // Disable gravity initially - we'll apply custom gravity to player
        this.engine.world.gravity.y = 0;
        
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: 800,
                height: 600,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: false,
                showVelocity: false
            }
        });
        
        Render.run(this.render);
        
        // Custom update loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    createPlayer() {
        this.player = Bodies.circle(150, 300, 20, {
            render: {
                fillStyle: '#000000',
                strokeStyle: '#111111',
                lineWidth: 2
            },
            frictionAir: 0.02,
            restitution: 0.3
        });
        
        World.add(this.world, this.player);
    }
    
    setupControls() {
        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isHolding = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.isHolding = false;
        });

        this.canvas.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            this.isHolding = false;
        });

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isHolding = true;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isHolding = false;
        });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isHolding = false;
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.isHolding = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.isHolding = false;
            }
        });

        // Add level select button
        const levelSelectBtn = document.createElement('button');
        levelSelectBtn.textContent = 'Select Level';
        levelSelectBtn.className = 'level-select-btn';
        levelSelectBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: #007acc;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10;
        `;
        
        levelSelectBtn.addEventListener('click', () => {
            this.levelSelectUI.style.display = 'flex';
            this.gameRunning = false;
        });
        
        document.getElementById('gameContainer').appendChild(levelSelectBtn);
    }
    
    jump() {
        // Remove old jump function - replaced by continuous flying
    }
    
    startGame() {
        this.gameRunning = true;
        this.setupCollisionDetection();
    }
    
    setupCollisionDetection() {
        Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            
            pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                
                if (bodyA === this.player || bodyB === this.player) {
                    const otherBody = bodyA === this.player ? bodyB : bodyA;
                    const obstacle = this.obstacles.find(obs => obs.body === otherBody);
                    
                    if (obstacle) {
                        this.handleCollision(obstacle);
                    }
                }
            });
        });
    }
    
    handleCollision(obstacle) {
        if (['laser', 'saw', 'plasma', 'spikewall', 'missile'].includes(obstacle.type)) {
            this.loseLife();
        }
    }
    
    loseLife() {
        this.lives--;
        this.livesElement.textContent = `Lives: ${this.lives}`;
        
        // Reset player position
        Body.setPosition(this.player, { x: 150, y: 300 });
        Body.setVelocity(this.player, { x: 0, y: 0 });
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Mark level as completed if player made progress
        if (this.currentLevel && this.score > 0) {
            this.levelProgress[this.currentLevel] = true;
            this.saveProgress();
        }
        
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
    }
    
    restart() {
        if (this.currentLevel) {
            const levelData = this.levelDatabase[this.currentLevel - 1];
            this.loadLevel(levelData.week, levelData.day, levelData.timeOfDay);
        } else {
            this.levelSelectUI.style.display = 'flex';
        }
    }
    
    animate(currentTime) {
        // Remove random obstacle generation - levels use pre-defined obstacles only
        if (this.gameRunning) {
            // Handle jump cooldown
            if (this.jumpCooldown > 0) this.jumpCooldown--;
            
            const deltaTime = currentTime - this.lastTime;
            
            // Apply gentle gravity
            Body.applyForce(this.player, this.player.position, { x: 0, y: 0.0005 });
            
            // Apply flying force when holding
            if (this.isHolding) {
                // Eased flying - gradual force application
                const currentVelocity = this.player.velocity.y;
                
                // Only apply force if not at max upward velocity
                if (currentVelocity > this.maxFlySpeed) {
                    // Calculate eased force based on current velocity
                    const velocityDiff = currentVelocity - this.maxFlySpeed;
                    const easedForce = this.flyForce * Math.min(1, velocityDiff / 2);
                    
                    Body.applyForce(this.player, this.player.position, { x: 0, y: -easedForce });
                }
            }
            
            // Update scroll offset
            this.scrollOffset += this.scrollSpeed;
            
            // Move obstacles left (simulate scrolling)
            this.obstacles.forEach(obstacle => {
                const currentX = obstacle.body.position.x;
                Body.setPosition(obstacle.body, { 
                    x: currentX - this.scrollSpeed, 
                    y: obstacle.body.position.y 
                });
                
                // Spin saws
                if (obstacle.spinning) {
                    Body.setAngle(obstacle.body, obstacle.body.angle + 0.1);
                }
                
                // Animate plasma fields
                if (obstacle.animated && obstacle.type === 'plasma') {
                    const time = currentTime * 0.003;
                    const offsetY = Math.sin(time + obstacle.body.position.x * 0.01) * 3;
                    Body.setPosition(obstacle.body, {
                        x: obstacle.body.position.x,
                        y: obstacle.body.position.y + offsetY
                    });
                }

                // Oscillate spike walls
                if (obstacle.type === 'spikewall') {
                    const time = currentTime * 0.001;
                    const offsetX = Math.sin(time + obstacle.body.position.y * 0.02) * 8;
                    Body.setPosition(obstacle.body, {
                        x: obstacle.body.position.x + offsetX,
                        y: obstacle.body.position.y
                    });
                }
                
                // Remove obstacles that are off-screen
                if (currentX < -100) {
                    World.remove(this.world, obstacle.body);
                }
            });
            
            // Remove off-screen obstacles from array
            this.obstacles = this.obstacles.filter(obstacle => 
                obstacle.body.position.x > -100
            );
            
            // Check if player is off-screen
            if (this.player.position.y > 650 || this.player.position.y < -50) {
                this.loseLife();
            }
            
            // Update score
            this.score += Math.floor(this.scrollSpeed);
            this.scoreElement.textContent = `Score: ${this.score}`;
            
            // Level completion based on fixed level length
            // Levels have fixed obstacle sets, no infinite generation
            
            // Level progression
            const newLevel = Math.floor(this.score / 1000) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.levelElement.textContent = `Level: ${this.level}`;
                this.scrollSpeed = Math.min(this.scrollSpeed + 0.5, 8);
            }
        }
        
        Engine.update(this.engine, 16.67);
        this.lastTime = currentTime;
        requestAnimationFrame(this.animate);
    }
    
    createHandDrawnObstacle(data) {
        let body;
        
        const createBodyFromPath = (path, isStatic = true, isSensor = false) => {
            if (!path || !Array.isArray(path)) return null; // Guard clause
            
            const vertices = path.map(([x, y]) => ({ x, y }));
            return Bodies.fromVertices(
                vertices[0].x,
                vertices[0].y,
                [vertices],
                {
                    isStatic: isStatic,
                    isSensor: isSensor,
                    render: {
                        fillStyle: '#000000',
                        strokeStyle: '#000000',
                        lineWidth: 2
                    }
                }
            );
        };
        
        switch (data.type) {
            case 'handdrawn_wall':
            case 'handdrawn_cave':
            case 'handdrawn_mountain':
            case 'handdrawn_ruined_wall':
            case 'handdrawn_hazard_wall':
                if (data.path) {
                    body = createBodyFromPath(data.path);
                }
                break;
                
            case 'handdrawn_crystal':
                if (data.vertices) {
                    body = createBodyFromPath(data.vertices);
                }
                break;
                
            case 'handdrawn_spike_cluster':
                if (data.spines) {
                    data.spines.forEach(spine => {
                        if (spine && Array.isArray(spine)) {
                            const spikeBody = createBodyFromPath(spine);
                            if (spikeBody) {
                                World.add(this.world, spikeBody);
                                this.obstacles.push({
                                    body: spikeBody,
                                    type: 'spike_wing',
                                    originalX: spine[0]?.[0] || 0,
                                    animated: true
                                });
                            }
                        }
                    });
                }
                return;
                
            case 'handdrawn_spike_wall':
                if (data.base_path) {
                    body = createBodyFromPath(data.base_path);
                }
                break;
                
            case 'handdrawn_saw':
                if (data.blade_path) {
                    body = createBodyFromPath(data.blade_path);
                    if (body) {
                        Body.setStatic(body, true);
                        this.obstacles.push({
                            body: body,
                            type: 'handdrawn_saw',
                            originalX: data.x || 0,
                            spinning: true,
                            animated: true
                        });
                        return;
                    }
                }
                break;
                
            case 'handdrawn_laser':
                if (data.start && data.end) {
                    const distance = Math.sqrt(
                        Math.pow(data.end[0] - data.start[0], 2) + 
                        Math.pow(data.end[1] - data.start[1], 2)
                    );
                    
                    body = Bodies.rectangle(
                        data.start[0] + (data.end[0] - data.start[0]) / 2,
                        data.start[1] + (data.end[1] - data.start[1]) / 2,
                        data.width || 5,
                        distance,
                        {
                            isStatic: true,
                            isSensor: true,
                            render: {
                                fillStyle: '#000000'
                            }
                        }
                    );
                }
                break;
                
            case 'handdrawn_plasma_field':
            case 'handdrawn_plasma_snake':
                const pathToUse = data.boundary_path || data.chain;
                if (pathToUse) {
                    body = createBodyFromPath(pathToUse, true, true);
                    if (body) body.isSensor = true;
                }
                break;
                
            case 'handdrawn_tornado':
                if (data.spiral) {
                    body = createBodyFromPath([
                        [data.spiral.x - data.spiral.outer_radius, data.spiral.y - data.spiral.outer_radius],
                        [data.spiral.x + data.spiral.outer_radius, data.spiral.y - data.spiral.outer_radius],
                        [data.spiral.x + data.spiral.outer_radius, data.spiral.y + data.spiral.outer_radius],
                        [data.spiral.x - data.spiral.outer_radius, data.spiral.y + data.spiral.outer_radius],
                    ], true);
                }
                break;
                
            case 'handdrawn_missile':
                if (data.body_path) {
                    body = createBodyFromPath(data.body_path);
                    if (data.fins) {
                        const finBody = createBodyFromPath(data.fins);
                        if (finBody) {
                            World.add(this.world, finBody);
                            this.obstacles.push({
                                body: finBody,
                                type: 'missile_fin',
                                originalX: data.fins[0]?.[0] || 0
                            });
                        }
                    }
                }
                break;
        }
        
        if (body) {
            World.add(this.world, body);
            this.obstacles.push({
                body: body,
                type: data.type.replace('handdrawn_', ''),
                originalX: body.position.x,
                spinning: data.type === 'handdrawn_saw',
                animated: data.type.includes('plasma') || 
                         data.type.includes('spike') || 
                         data.type.includes('tornado')
            });
        }
    }

    createSawTexture(radius) {
        const canvas = document.createElement('canvas');
        const size = radius * 2.5;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Create metallic saw blade
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.7, '#cc4400');
        gradient.addColorStop(1, '#ff6600');
        
        // Outer blade
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Saw teeth pattern
        const teethCount = 16;
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        for (let i = 0; i < teethCount; i++) {
            const angle = (i / teethCount) * Math.PI * 2;
            const innerRadius = radius * 0.85;
            const outerRadius = radius;
            
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * innerRadius,
                centerY + Math.sin(angle) * innerRadius
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * outerRadius,
                centerY + Math.sin(angle) * outerRadius
            );
            ctx.stroke();
        }
        
        // Center hole
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        
        // Center bolt
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#666';
        ctx.fill();
        
        return canvas.toDataURL();
    }

    createLaserTexture(height) {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Laser beam with glow
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#ff0044');
        gradient.addColorStop(0.5, '#ff2266');
        gradient.addColorStop(1, '#ff0044');
        
        // White glow around laser
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, 0, 4, height);
        
        // Core laser beam
        ctx.shadowBlur = 0;
        ctx.fillStyle = gradient;
        ctx.fillRect(2, 0, 6, height);
        
        // Create emitters that align perfectly with laser
        const emitter = document.createElement('canvas');
        const emitterSize = 40;
        emitter.width = emitterSize * 2;
        emitter.height = emitterSize;
        const emitterCtx = emitter.getContext('2d');
        
        // Emitter body - horizontal orientation
        const emitterGradient = emitterCtx.createLinearGradient(0, 0, emitterSize * 2, 0);
        emitterGradient.addColorStop(0, '#333');
        emitterGradient.addColorStop(0.5, '#666');
        emitterGradient.addColorStop(1, '#333');
        
        emitterCtx.fillStyle = emitterGradient;
        emitterCtx.fillRect(0, 5, emitterSize * 2, 30);
        
        // Emitter details
        emitterCtx.fillStyle = '#888';
        emitterCtx.fillRect(5, 10, 15, 20);
        emitterCtx.fillRect(emitterSize * 2 - 20, 10, 15, 20);
        
        // Laser emitter cap - centered horizontally
        const capX = emitterSize;
        emitterCtx.fillStyle = '#ff0044';
        emitterCtx.shadowBlur = 15;
        emitterCtx.shadowColor = '#ff0044';
        emitterCtx.beginPath();
        emitterCtx.arc(capX, 20, 8, 0, Math.PI * 2);
        emitterCtx.fill();
        
        // Combine textures with proper alignment
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 80;
        finalCanvas.height = height + 80;
        const finalCtx = finalCanvas.getContext('2d');
        
        // Draw top emitter - rotated 90 degrees counterclockwise
        finalCtx.save();
        finalCtx.translate(40, 0);
        finalCtx.rotate(-Math.PI / 2);
        finalCtx.drawImage(emitter, 0, 0, emitterSize * 2, emitterSize, 0, 0, emitterSize * 2, emitterSize);
        finalCtx.restore();
        
        // Draw bottom emitter - rotated 90 degrees clockwise
        finalCtx.save();
        finalCtx.translate(40, height + 80);
        finalCtx.rotate(Math.PI / 2);
        finalCtx.drawImage(emitter, 0, 0, emitterSize * 2, emitterSize, 0, 0, emitterSize * 2, emitterSize);
        finalCtx.restore();
        
        // Draw laser beam - centered horizontally
        finalCtx.shadowBlur = 25;
        finalCtx.shadowColor = '#ffffff';
        finalCtx.drawImage(canvas, 35, 40);
        
        return finalCanvas.toDataURL();
    }

    createPlasmaFieldTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Plasma field with animated feel
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(0, 150, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(100, 0, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 100, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Energy particles
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 2 + Math.random() * 4;
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return canvas.toDataURL();
    }

    createSpikeWallTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Metallic base
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(0.5, '#666');
        gradient.addColorStop(1, '#444');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Spikes
        const spikeCount = Math.floor(height / 30);
        for (let i = 0; i < spikeCount; i++) {
            const y = i * 30;
            
            // Spike gradient
            const spikeGradient = ctx.createLinearGradient(0, y, width, y);
            spikeGradient.addColorStop(0, '#aa3333');
            spikeGradient.addColorStop(0.5, '#cc4444');
            spikeGradient.addColorStop(1, '#aa3333');
            
            ctx.fillStyle = spikeGradient;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width/2, y - 15);
            ctx.lineTo(width, y);
            ctx.closePath();
            ctx.fill();
            
            // Spike highlight
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        return canvas.toDataURL();
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new PhysicsFlightGame();
});
