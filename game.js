// BADLAND-STYLE ENGINE USING MATTER.JS

// Core engine elements
import Matter from 'matter-js';

const { Engine, Render, Runner, World, Bodies, Body, Composite } = Matter;

const engine = Engine.create();
const world = engine.world;

// Create renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: false,
    background: '#2b2d42'
  }
});
Render.run(render);

const runner = Runner.create();
Runner.run(runner, engine);

// Parallax background layers
const backgroundLayers = [
  { speed: 0.2, color: '#0f0f1f', offset: 0 },
  { speed: 0.5, color: '#1f1f2f', offset: 0 },
  { speed: 0.8, color: '#2f2f4f', offset: 0 }
];

// Draw parallax background
function drawParallax(ctx, cameraX) {
  backgroundLayers.forEach(layer => {
    ctx.fillStyle = layer.color;
    const offsetX = -cameraX * layer.speed % render.options.width;
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i * render.options.width + offsetX, 0, render.options.width, render.options.height);
    }
  });
}

// Override render function for background
render.canvas.style.position = 'absolute';
render.canvas.style.zIndex = '0';

const foregroundCanvas = document.createElement('canvas');
foregroundCanvas.width = render.options.width;
foregroundCanvas.height = render.options.height;
foregroundCanvas.style.position = 'absolute';
foregroundCanvas.style.zIndex = '1';
document.body.appendChild(foregroundCanvas);
const foregroundCtx = foregroundCanvas.getContext('2d');

// Player
const player = Bodies.circle(100, 300, 20, { restitution: 0.4 });
World.add(world, player);

// Gravity and physics
engine.world.gravity.y = 1.0;

// Long level terrain generator
function generateTerrain(startX, segments = 20) {
  const chunkLength = 400;
  for (let i = 0; i < segments; i++) {
    const floor = Bodies.rectangle(startX + i * chunkLength, 590, chunkLength, 20, {
      isStatic: true,
      render: { fillStyle: '#4a4e69' }
    });

    const ceiling = Bodies.rectangle(startX + i * chunkLength, 10, chunkLength, 20, {
      isStatic: true,
      render: { fillStyle: '#4a4e69' }
    });

    const obstacle = Bodies.rectangle(startX + i * chunkLength + 200, 500 - Math.random() * 200, 40, 80, {
      isStatic: true,
      angle: Math.random() * 0.5 - 0.25,
      render: { fillStyle: '#9a8c98' }
    });

    World.add(world, [floor, ceiling, obstacle]);
  }
}

// Initial terrain
generateTerrain(0, 30);

// Camera follow and render loop
(function animate() {
  requestAnimationFrame(animate);

  const cameraX = player.position.x - 200;

  // Move camera view
  Render.lookAt(render, {
    min: { x: cameraX, y: 0 },
    max: { x: cameraX + render.options.width, y: render.options.height }
  });

  // Draw background
  foregroundCtx.clearRect(0, 0, render.options.width, render.options.height);
  drawParallax(foregroundCtx, cameraX);
})();

// Player controls
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    Body.applyForce(player, player.position, { x: 0, y: -0.03 });
  }
});
