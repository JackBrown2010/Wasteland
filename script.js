const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Create engine with lower gravity
const engine = Engine.create();
engine.gravity.y = 0.4; // Lower than default 1.0

const world = engine.world;

const width = window.innerWidth;
const height = window.innerHeight;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width,
    height,
    wireframes: false,
    background: 'transparent',
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Player character
const player = Bodies.circle(300, height / 2, 25, {
  render: {
    fillStyle: 'yellow'
  },
  frictionAir: 0.05
});

World.add(world, player);

// Floor and ceiling
World.add(world, [
  Bodies.rectangle(width, height + 25, 5000, 50, { isStatic: true }),
  Bodies.rectangle(width, -25, 5000, 50, { isStatic: true })
]);

// Obstacle example
for (let i = 600; i < 5000; i += 800) {
  World.add(world, Bodies.rectangle(i, height - 100, 50, 200, {
    isStatic: true,
    render: { fillStyle: '#444' }
  }));
}

// Input and control
let flying = false;

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') flying = true;
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') flying = false;
});

// Parallax background
const bg = document.getElementById('parallax');

// Camera scroll
let cameraX = 0;
const scrollSpeed = 2;

// Game loop
Events.on(engine, 'beforeUpdate', () => {
  if (flying) {
    Body.applyForce(player, player.position, { x: 0, y: -0.005 }); // Increased lift
  }

// Constant forward movement
Body.setVelocity(player, {
  x: scrollSpeed,
  y: player.velocity.y
});

  
  // Autoscroll view
  cameraX += scrollSpeed;
  render.bounds.min.x = cameraX;
  render.bounds.max.x = cameraX + width;

  render.bounds.min.y = 0;
  render.bounds.max.y = height;

  render.options.hasBounds = true;

  // Move background
  bg.style.transform = `translateX(${-cameraX * 0.3}px)`;
});
