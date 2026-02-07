const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const launchButton = document.getElementById("launch");
const sysStatus = document.getElementById("sys-status");
const coreStatus = document.getElementById("core-status");
const syncStatus = document.getElementById("sync-status");
const scroll = document.getElementById("scroll");

const scrollText =
  "GREETS TO ALL DEMOSCENE LEGENDS ✦ BRINGING PIXEL CHAOS TO THE MODERN AGE ✦ NEON RELIC CREW 2024 ✦ PRESS PLAY AND ENJOY THE RIDE ✦ ";

let width = 0;
let height = 0;
let stars = [];
let shards = [];
let startTime = 0;
let playing = false;
let audioContext = null;
let bassGain = null;
let leadGain = null;
let percussionGain = null;
let animationId = null;

const palette = ["#ff49f1", "#20d6ff", "#8c52ff", "#39ffb6"];

const resize = () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  stars = Array.from({ length: 220 }, () => createStar());
  shards = Array.from({ length: 28 }, () => createShard());
};

const createStar = () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  z: Math.random() * 0.9 + 0.1,
  radius: Math.random() * 2 + 0.5,
  hue: palette[Math.floor(Math.random() * palette.length)],
});

const createShard = () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  angle: Math.random() * Math.PI * 2,
  speed: Math.random() * 0.8 + 0.3,
  width: Math.random() * 20 + 10,
  height: Math.random() * 120 + 40,
  color: palette[Math.floor(Math.random() * palette.length)],
});

const drawStars = (time) => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  stars.forEach((star) => {
    const speed = 0.25 + star.z * 0.8;
    star.y += speed;
    if (star.y > height + 10) {
      star.y = -10;
      star.x = Math.random() * width;
    }
    ctx.fillStyle = star.hue;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius + Math.sin(time * 0.002) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

const drawRasterBars = (time) => {
  const barCount = 9;
  for (let i = 0; i < barCount; i += 1) {
    const amplitude = 30 + i * 6;
    const y = height * 0.3 + i * 22 + Math.sin(time * 0.002 + i) * amplitude;
    const gradient = ctx.createLinearGradient(0, y, width, y);
    gradient.addColorStop(0, "rgba(255, 73, 241, 0)");
    gradient.addColorStop(0.5, "rgba(32, 214, 255, 0.55)");
    gradient.addColorStop(1, "rgba(255, 73, 241, 0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

const drawShards = (time) => {
  ctx.save();
  ctx.globalAlpha = 0.4;
  shards.forEach((shard) => {
    shard.angle += 0.002 + shard.speed * 0.001;
    shard.y += shard.speed * 0.8;
    if (shard.y > height + 200) {
      shard.y = -200;
      shard.x = Math.random() * width;
    }
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.angle);
    ctx.fillStyle = shard.color;
    ctx.fillRect(-shard.width / 2, -shard.height / 2, shard.width, shard.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  ctx.restore();
};

const drawEnergyRing = (time) => {
  const radius = Math.min(width, height) * 0.22;
  const pulse = 1 + Math.sin(time * 0.004) * 0.06;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.strokeStyle = "rgba(57, 255, 182, 0.7)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 25;
  ctx.shadowColor = "rgba(57, 255, 182, 0.8)";
  ctx.beginPath();
  ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 73, 241, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawWaveform = (time) => {
  const centerY = height * 0.72;
  ctx.save();
  ctx.beginPath();
  for (let x = 0; x <= width; x += 12) {
    const amp = 18 + Math.sin(time * 0.002 + x * 0.01) * 12;
    const y = centerY + Math.sin(time * 0.004 + x * 0.05) * amp;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(140, 82, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(140, 82, 255, 0.8)";
  ctx.stroke();
  ctx.restore();
};

const render = (time) => {
  if (!startTime) {
    startTime = time;
  }
  const elapsed = time - startTime;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(3, 1, 15, 0.25)";
  ctx.fillRect(0, 0, width, height);

  drawStars(elapsed);
  drawShards(elapsed);
  drawRasterBars(elapsed);
  drawEnergyRing(elapsed);
  drawWaveform(elapsed);

  animationId = requestAnimationFrame(render);
};

const setStatus = (system, core, sync) => {
  sysStatus.textContent = system;
  coreStatus.textContent = core;
  syncStatus.textContent = sync;
};

const updateScrollText = () => {
  scroll.innerHTML = `<span>${scrollText.repeat(2)}</span>`;
};

const scheduleSequence = (ctx, gain, notes, startAt) => {
  notes.forEach((note, index) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = note.type;
    osc.frequency.value = note.freq;
    const start = startAt + index * note.length;
    env.gain.setValueAtTime(0.001, start);
    env.gain.exponentialRampToValueAtTime(note.volume, start + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, start + note.length - 0.02);
    osc.connect(env);
    env.connect(gain);
    osc.start(start);
    osc.stop(start + note.length);
  });
};

const buildAudio = () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  bassGain = audioContext.createGain();
  leadGain = audioContext.createGain();
  percussionGain = audioContext.createGain();

  bassGain.gain.value = 0.12;
  leadGain.gain.value = 0.08;
  percussionGain.gain.value = 0.1;

  const master = audioContext.createGain();
  master.gain.value = 0.8;
  bassGain.connect(master);
  leadGain.connect(master);
  percussionGain.connect(master);
  master.connect(audioContext.destination);

  const bassNotes = [
    { freq: 110, length: 0.3, volume: 0.4, type: "sawtooth" },
    { freq: 98, length: 0.3, volume: 0.38, type: "sawtooth" },
    { freq: 123, length: 0.3, volume: 0.42, type: "sawtooth" },
    { freq: 130.8, length: 0.3, volume: 0.42, type: "sawtooth" },
  ];

  const leadNotes = [
    { freq: 523.25, length: 0.2, volume: 0.28, type: "triangle" },
    { freq: 659.25, length: 0.2, volume: 0.28, type: "triangle" },
    { freq: 783.99, length: 0.2, volume: 0.3, type: "triangle" },
    { freq: 659.25, length: 0.2, volume: 0.28, type: "triangle" },
    { freq: 622.25, length: 0.2, volume: 0.25, type: "triangle" },
    { freq: 523.25, length: 0.2, volume: 0.25, type: "triangle" },
  ];

  const percussion = [
    { freq: 180, length: 0.12, volume: 0.3, type: "square" },
    { freq: 120, length: 0.12, volume: 0.26, type: "square" },
    { freq: 160, length: 0.12, volume: 0.28, type: "square" },
    { freq: 90, length: 0.12, volume: 0.22, type: "square" },
  ];

  let loopStart = audioContext.currentTime + 0.05;
  const loopLength = 2.4;

  const loop = () => {
    scheduleSequence(audioContext, bassGain, bassNotes, loopStart);
    scheduleSequence(audioContext, leadGain, leadNotes, loopStart + 0.1);
    scheduleSequence(audioContext, percussionGain, percussion, loopStart + 0.05);
    loopStart += loopLength;
    if (playing) {
      setTimeout(loop, (loopLength - 0.1) * 1000);
    }
  };

  loop();
};

const launch = async () => {
  if (playing) {
    return;
  }
  playing = true;
  setStatus("ARMED", "BOOTING", "CALIBRATING");

  launchButton.classList.add("hidden");
  updateScrollText();

  try {
    await buildAudio();
  } catch (error) {
    console.error("Audio init failed", error);
  }

  setTimeout(() => setStatus("ONLINE", "SYNCED", "100%"), 1200);
  startTime = 0;
  animationId = requestAnimationFrame(render);
};

launchButton.addEventListener("click", launch);
window.addEventListener("resize", resize);
resize();
updateScrollText();
if (animationId) {
  cancelAnimationFrame(animationId);
}
render(0);
