const { Engine, Render, World, Bodies, Body, Runner } = Matter;

// Engine setup
const engine = Engine.create();
const world = engine.world;

// Canvas size
const width = window.innerWidth;
const height = window.innerHeight;

// Renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width,
    height,
    wireframes: false,
    background: 'transparent'
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Parallax background effect
const parallax = document.getElementById("parallax");
let scrollX = 0;
function updateParallax() {
  parallax.style.backgroundPositionX = `${-scrollX * 0.5}px`;
}

// Create player
const player = Bodies.circle(150, height / 2, 30, {
  inertia: Infinity,
  frictionAir: 0.02,
  render: { fillStyle: '#ffcc00' }
});
World.add(world, player);

// Ground
World.add(world, [
  Bodies.rectangle(1000, height - 50, 2000, 100, {
    isStatic: true,
    render: { fillStyle: '#333' }
  }),
  Bodies.rectangle(1500, height / 2 + 150, 300, 50, {
    isStatic: true,
    angle: Math.PI * 0.1,
    render: { fillStyle: '#555' }
  })
]);

// Camera follow
(function cameraLoop() {
  const offsetX = player.position.x - width / 2;

  render.bounds.min.x = offsetX;
  render.bounds.max.x = offsetX + width;

  render.options.width = width;
  render.options.height = height;

  render.lookAt(player);

  scrollX = offsetX;
  updateParallax();

  requestAnimationFrame(cameraLoop);
})();
