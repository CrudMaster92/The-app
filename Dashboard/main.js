const starCanvas = document.getElementById('starfield');
const ctx = starCanvas.getContext('2d');
const stars = [];
const STAR_COUNT = 180;
let animationFrame;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  starCanvas.width = starCanvas.clientWidth * ratio;
  starCanvas.height = starCanvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createStars() {
  stars.length = 0;
  const width = starCanvas.clientWidth;
  const height = starCanvas.clientHeight;
  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      depth: Math.random() * 1.2 + 0.2,
      velocity: Math.random() * 0.6 + 0.2,
    });
  }
}

function drawStarfield() {
  const width = starCanvas.clientWidth;
  const height = starCanvas.clientHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';

  stars.forEach((star) => {
    const size = (1.4 - star.depth) * 2.2;
    const x = star.x + Math.sin(performance.now() / 900 + star.depth) * 4;
    const y = star.y + star.velocity * 1.8;

    ctx.globalAlpha = Math.min(1, 0.4 + (1 - star.depth));
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    star.y = y;
    if (star.y > height + 4) {
      star.y = -4;
      star.x = Math.random() * width;
      star.depth = Math.random() * 1.2 + 0.2;
      star.velocity = Math.random() * 0.6 + 0.2;
    }
  });

  ctx.globalAlpha = 1;
  animationFrame = requestAnimationFrame(drawStarfield);
}

function initStarfield() {
  resizeCanvas();
  createStars();
  cancelAnimationFrame(animationFrame);
  drawStarfield();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars();
});

initStarfield();

// Cracktro sound generator
let audioCtx;
let arpeggioTimer;
let bassTimer;
let soundEnabled = false;

function createNoiseBuffer(context) {
  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startSoundtrack() {
  if (soundEnabled) return;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const master = audioCtx.createGain();
  master.gain.value = 0.18;
  master.connect(audioCtx.destination);

  // Lead arpeggio voice
  const lead = audioCtx.createOscillator();
  lead.type = 'square';
  const leadGain = audioCtx.createGain();
  leadGain.gain.value = 0.12;
  lead.connect(leadGain).connect(master);
  lead.start();

  const arpeggio = [440, 554.37, 659.25, 880, 659.25, 554.37];
  let step = 0;
  arpeggioTimer = setInterval(() => {
    const now = audioCtx.currentTime;
    const target = arpeggio[step % arpeggio.length];
    lead.frequency.exponentialRampToValueAtTime(target, now + 0.1);
    leadGain.gain.cancelScheduledValues(now);
    leadGain.gain.setValueAtTime(0.02, now);
    leadGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    leadGain.gain.linearRampToValueAtTime(0.04, now + 0.18);
    step += 1;
  }, 180);

  // Bass pulse
  const bass = audioCtx.createOscillator();
  bass.type = 'sawtooth';
  const bassGain = audioCtx.createGain();
  bassGain.gain.value = 0.05;
  bass.connect(bassGain).connect(master);
  bass.start();

  const bassPattern = [110, 110, 164.81, 110, 82.41, 123.47];
  let bassStep = 0;
  bassTimer = setInterval(() => {
    const now = audioCtx.currentTime;
    const freq = bassPattern[bassStep % bassPattern.length];
    bass.frequency.setValueAtTime(freq, now);
    bassGain.gain.cancelScheduledValues(now);
    bassGain.gain.setValueAtTime(0.01, now);
    bassGain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    bassGain.gain.linearRampToValueAtTime(0.02, now + 0.22);
    bassStep += 1;
  }, 220);

  // Noise hi-hats
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(audioCtx);
  noiseSource.loop = true;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 4000;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.05;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
  noiseSource.start();

  const pulse = () => {
    const now = audioCtx.currentTime;
    noiseGain.gain.cancelScheduledValues(now);
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.02);
    noiseGain.gain.linearRampToValueAtTime(0.005, now + 0.08);
  };
  const hatInterval = setInterval(pulse, 150);

  soundEnabled = true;
  document.getElementById('soundToggle').textContent = 'Sound Enabled';
  document.getElementById('soundToggle').classList.add('is-active');

  const cleanup = () => {
    clearInterval(arpeggioTimer);
    clearInterval(bassTimer);
    clearInterval(hatInterval);
  };

  window.addEventListener(
    'pagehide',
    () => {
      cleanup();
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    },
    { once: true }
  );
}

const toggle = document.getElementById('soundToggle');
if (toggle) {
  toggle.addEventListener('click', async () => {
    if (!audioCtx) {
      startSoundtrack();
    } else if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  });
}

// Text pulse effect
const statusEl = document.querySelector('.status');
if (statusEl) {
  let visible = true;
  setInterval(() => {
    visible = !visible;
    statusEl.style.opacity = visible ? '1' : '0.45';
  }, 900);
}
