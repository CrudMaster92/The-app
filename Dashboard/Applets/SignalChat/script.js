const log = document.getElementById('chatLog');
const statusLine = document.getElementById('consoleStatus');
const form = document.getElementById('messageForm');
const input = document.getElementById('messageInput');

const seededMessages = [
  { author: 'system', text: 'Secure relay channel established. Handshake complete.', delay: 600 },
  { author: 'inbound', text: 'Alpha cell online. Requesting status sync.', delay: 1600 },
  { author: 'outbound', text: 'Command link steady. Confirming grid vector K-73.', delay: 2300 },
  { author: 'inbound', text: 'Grid vector K-73 confirmed. Signal strength 92%.', delay: 2000 },
  { author: 'system', text: 'Telemetry packets balanced. Ready for live directives.', delay: 1800 },
];

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function createEntry({ author, text, timestamp = formatTimestamp() }) {
  const entry = document.createElement('article');
  entry.className = `console__entry console__entry--${author}`;

  const stamp = document.createElement('span');
  stamp.className = 'console__stamp';
  stamp.textContent = `${author.toUpperCase()} • ${timestamp}`;

  const message = document.createElement('p');
  message.className = 'console__message';
  message.textContent = text;

  entry.append(stamp, message);
  return entry;
}

function appendMessage(payload) {
  if (!log) return;
  const entry = createEntry(payload);
  log.append(entry);
  log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  updateStatusLine(`${payload.author === 'outbound' ? 'Transmitted' : 'Received'} ${formatTimestamp()}`);
}

function updateStatusLine(text) {
  if (statusLine) {
    statusLine.textContent = text;
  }
}

function dispatchSeededMessages(index = 0) {
  if (index >= seededMessages.length) {
    updateStatusLine('Relay live — standing by for directives');
    return;
  }

  const packet = seededMessages[index];
  setTimeout(() => {
    appendMessage({ author: packet.author, text: packet.text });
    dispatchSeededMessages(index + 1);
  }, packet.delay);
}

function scheduleReply() {
  const responses = [
    'Copy that. Routing teams to safehouse echo.',
    'Affirmative. Drone uplink recalibrated.',
    'Acknowledged. Scrubbing trail and rotating codes.',
    'Received. Stand by for uplinked schematics.',
  ];
  const text = responses[Math.floor(Math.random() * responses.length)];
  const delay = 1400 + Math.random() * 1600;

  setTimeout(() => {
    appendMessage({ author: 'inbound', text });
  }, delay);
}

if (form && input) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;

    appendMessage({ author: 'outbound', text: value });
    input.value = '';
    updateStatusLine('Directive sent — awaiting response');
    scheduleReply();
  });
}

dispatchSeededMessages();
