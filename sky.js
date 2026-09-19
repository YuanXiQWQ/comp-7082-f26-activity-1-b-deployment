/**
 * sky.js
 * Animated background for the weather app: a day/night gradient sky, sun/moon,
 * drifting clouds, and rain and snow particles.
 * Draws within the element with the id "sky".
 *
 * Exported function: setScene(kind, isNight)
 *   kind    - weather type, usually OpenWeatherMap's weather[0].main.
 *   isNight - whether it is night.
 * Called from app.js: import { setScene } from './sky.js';
 */

/* ---------- Colours ---------- */

/**
 * Gradient colours per weather type, one set for day and one for night,
 * in the form ['top colour', 'bottom colour'].
 */
const SKY_COLOURS = {
  Clear: {day: ['#2F7FD1', '#A6D8F5'], night: ['#04081A', '#17295C']},
  Clouds: {day: ['#6F86A6', '#C2CFDD'], night: ['#080E1C', '#26344E']},
  Rain: {day: ['#39485A', '#6F8194'], night: ['#05080F', '#1C2634']},
  Snow: {day: ['#5F7288', '#A9B9C9'], night: ['#070D1A', '#243347']}
};
const SUN_MOON_COLOURS = {day: '#FFF4CD', night: '#E9EEFB'};
const CLOUD_COLOURS = '#FFFFFF';

const CLOUD_COUNT = 3;
const RAIN_COUNT = 60;
const SNOW_COUNT = 45;

let canvas = null;
let ctx = null;
let frameId = 0;
let lastTime = 0;
let kind = 'Clouds';
let night = false;
let clouds = [];
let particles = [];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Match the canvas bitmap to its CSS size and device pixel ratio.
 */
function sizeCanvas() {
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  ctx.scale(ratio, ratio);
}

/**
 * Create the clouds for the current weather.
 */
function buildClouds() {
  clouds = [];

  if (kind === 'Clear') return;

  for (let i = 0; i < CLOUD_COUNT; i += 1) {
    clouds.push({
      x: Math.random() * canvas.clientWidth * 0.5,
      y: Math.random() * canvas.clientHeight * 0.9,
      size: 40 + Math.random() * 10,
      speed: 30
    });
  }
}

/**
 * Create the rain or snow particles for the current weather.
 */
function buildParticles() {
  particles = [];

  if (kind !== 'Rain' && kind !== 'Snow') return;

  const count = kind === 'Rain' ? RAIN_COUNT : SNOW_COUNT;

  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      speed: kind === 'Rain' ? 1000 + Math.random() * 1000 : 100 + Math.random() * 100,
      size: kind === 'Rain' ? 10 + Math.random() * 10 : 2 + Math.random() * 2
    });
  }
}

/**
 * Rebuild the clouds and particles.
 */
function buildScene() {
  buildClouds();
  buildParticles();
}

/**
 * Draw the day or night sky.
 */
function drawSky() {
  const colours = SKY_COLOURS[kind][night ? 'night' : 'day'];
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight);

  gradient.addColorStop(0, colours[0]);
  gradient.addColorStop(1, colours[1]);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

/**
 * Draw the sun during the day and the moon at night.
 */
function drawSunOrMoon() {
  const x = canvas.clientWidth * 0.8;
  const y = canvas.clientHeight * 0.2;
  const radius = Math.max(14, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.1);

  ctx.fillStyle = night ? SUN_MOON_COLOURS.night : SUN_MOON_COLOURS.day;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw and move the clouds.
 *
 * @param {number} dt Seconds since the previous frame.
 */
function drawClouds(dt) {
  ctx.fillStyle = CLOUD_COLOURS;

  for (let i = 0; i < clouds.length; i += 1) {
    const cloud = clouds[i];

    if (!reducedMotion) {
      cloud.x += cloud.speed * dt;
      if (cloud.x - cloud.size * 2 > canvas.clientWidth) {
        cloud.x = -cloud.size * 2;
      }
    }

    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cloud.x - cloud.size, cloud.y + cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cloud.x + cloud.size, cloud.y + cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw and move the rain or snow.
 *
 * @param {number} dt Seconds since the previous frame.
 */
function drawParticles(dt) {
  if (kind === 'Rain') {
    ctx.strokeStyle = 'rgba(214,232,255,0.65)';
    ctx.lineWidth = 1;
  } else if (kind === 'Snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
  } else {
    return;
  }

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];

    if (!reducedMotion) {
      particle.y += particle.speed * dt;
      if (particle.y > canvas.clientHeight + 20) {
        particle.y = -20;
        particle.x = Math.random() * canvas.clientWidth;
      }
    }

    if (kind === 'Rain') {
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x, particle.y + particle.size);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw one frame of the sky.
 *
 * @param {number} dt Seconds since the previous frame.
 */
function draw(dt) {
  drawSky();
  drawSunOrMoon();
  drawClouds(dt);
  drawParticles(dt);
}

/**
 * Run the animation loop.
 *
 * @param {number} now Current timestamp in milliseconds.
 */
function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);

  lastTime = now;
  draw(dt);
  frameId = requestAnimationFrame(animate);
}

/**
 * Start the animation loop.
 */
function start() {
  if (reducedMotion) {
    draw(0);
    return;
  }

  if (frameId) return;

  lastTime = performance.now();
  frameId = requestAnimationFrame(animate);
}

/**
 * Resize the canvas and redraw the scene.
 */
function handleResize() {
  sizeCanvas();
  buildScene();
  draw(0);
}

/**
 * Switch the sky's weather and time of day.
 *
 * @param {string} nextKind Weather type.
 * @param {boolean} isNight Whether it is night.
 */
export function setScene(nextKind, isNight) {
  kind = nextKind;
  night = isNight === true;

  if (!canvas) {
    canvas = document.getElementById('sky');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    sizeCanvas();
    window.addEventListener('resize', handleResize);
  }

  buildScene();

  if (reducedMotion || frameId) {
    draw(0);
  } else {
    start();
  }
}

setScene('Clouds', false);
