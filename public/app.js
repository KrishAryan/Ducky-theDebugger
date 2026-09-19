const sampleCode = `var userName = "Krish";
var age = 20;

if(age == 20){
console.log("Hello " + userName)
}

function calculateScore(a, b) {
const total = a + b;
}

console.log(calculateScore(10, 20));`;

const state = {
  currentRoast: 'Quack. Show me the code and try not to make this worse.',
  isSubmitting: false
};

const codeInput = document.getElementById('codeInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const speechBubble = document.getElementById('speechBubble');
const fixedCodeBlock = document.getElementById('fixedCodeBlock');
const issuesList = document.getElementById('issuesList');
const duckBtn = document.getElementById('duckBtn');
const replayBtn = document.getElementById('replayBtn');
const copyFixBtn = document.getElementById('copyFixBtn');
const lineCount = document.getElementById('lineCount');
const statLines = document.getElementById('statLines');
const statIssues = document.getElementById('statIssues');
const statFixes = document.getElementById('statFixes');

function updateLineCount() {
  const lines = (codeInput.value || '').split(/\r?\n/).length;
  lineCount.textContent = String(lines);
  statLines.textContent = String(lines);
}

function setButtonLoading(isLoading) {
  state.isSubmitting = isLoading;
  analyzeBtn.disabled = isLoading;
  analyzeBtn.textContent = isLoading ? '🦆 Duck is investigating...' : 'Talk to the Duck 🐥';
}

function setSpeechBubble(message) {
  speechBubble.textContent = message;
  speechBubble.classList.remove('bubble-animate');
  void speechBubble.offsetWidth;
  speechBubble.classList.add('bubble-animate');
}

function renderIssues(issues = []) {
  if (!issues.length) {
    issuesList.innerHTML = `
      <div class="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm text-emerald-200">
        No glaring issues found. The duck is suspicious but impressed.
      </div>
    `;
    return;
  }

  issuesList.innerHTML = issues
    .map(
      (issue) => `
        <article class="issue-card rounded-xl border border-slate-700 bg-slate-950 p-3">
          <div class="mb-2 flex items-center justify-between gap-3">
            <h4 class="font-semibold text-slate-100">${escapeHtml(issue.type)}</h4>
            <span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${getSeverityClasses(issue.severity)}">${escapeHtml(issue.severity)}</span>
          </div>
          <p class="text-sm text-slate-300">${escapeHtml(issue.message)}</p>
          <p class="mt-2 text-xs italic text-amber-200">Duck: "${escapeHtml(issue.roast)}"</p>
        </article>
      `
    )
    .join('');
}

function getSeverityClasses(severity) {
  const map = {
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
    info: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  };

  return map[severity] || 'border-slate-500/30 bg-slate-500/10 text-slate-200';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateStats(stats = {}) {
  const lines = Number(stats.lines) || 0;
  const issuesFound = Number(stats.issuesFound) || 0;
  const fixes = Number(stats.fixes) || 0;

  statLines.textContent = String(lines);
  statIssues.textContent = String(issuesFound);
  statFixes.textContent = String(fixes);
}

function getEnglishVoice() {
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => /en/i.test(voice.lang) && /us|uk|au|gb/i.test(voice.lang));
  return preferred || voices.find((voice) => /en/i.test(voice.lang)) || voices[0] || null;
}

function speakRoast(message) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  const voice = getEnglishVoice();

  if (voice) {
    utterance.voice = voice;
  }

  utterance.pitch = 1.4;
  utterance.rate = 1.05;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

function triggerDuckAnimation() {
  duckBtn.classList.remove('duck-bounce', 'duck-shake');
  void duckBtn.offsetWidth;
  duckBtn.classList.add('duck-bounce', 'duck-shake');

  const roastPool = [
    'QUACK! That variable naming offended my ancestors.',
    'Quack quack. I have seen cleaner code written on a calculator.',
    'QUACK! Please stop using == like it\'s still 2012.',
    'Your code has more red flags than a Formula 1 race.',
    'I am a duck and even I know this function needs a return.',
    'That semicolon didn\'t disappear. You simply forgot to give it a home.',
    'Congratulations. You invented a new programming language called GuessScript.',
    'This code works approximately as well as a toaster connected to Wi-Fi.',
    'Your variable name is so vague that even Google needs clarification.',
    'I asked for JavaScript. You gave me emotional damage.'
  ];

  const roast = roastPool[Math.floor(Math.random() * roastPool.length)];
  state.currentRoast = roast;
  setSpeechBubble(roast);
  speakRoast(roast);
}

async function analyzeCurrentCode() {
  const payload = codeInput.value;

  if (!payload.trim()) {
    setSpeechBubble('Quack. I need code. Not your confidence.');
    fixedCodeBlock.textContent = '// Your dramatically improved code will appear here.';
    renderIssues([]);
    updateStats({ lines: 0, issuesFound: 0, fixes: 0 });
    return;
  }

  setButtonLoading(true);

  try {
    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: payload })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'The duck failed to investigate the code.');
    }

    const { roast, issues, fixedCode, stats } = data;
    state.currentRoast = roast;
    setSpeechBubble(roast);
    fixedCodeBlock.textContent = fixedCode || '// The duck couldn\'t find a safe fix for this one.';
    renderIssues(issues || []);
    updateStats(stats || {});
    speakRoast(roast);
  } catch (error) {
    console.error(error);
    setSpeechBubble('🦆 The duck slipped on a semicolon.');
    fixedCodeBlock.textContent = '// The duck couldn\'t fix that. Try a smaller snippet.';
    renderIssues([]);
    updateStats({ lines: (codeInput.value || '').split(/\r?\n/).length, issuesFound: 0, fixes: 0 });
    const extra = error.message || 'Something went wrong while analyzing the code.';
    speechBubble.textContent = `🦆 The duck slipped on a semicolon. ${extra}`;
  } finally {
    setButtonLoading(false);
  }
}

async function copyFix() {
  const text = fixedCodeBlock.textContent.trim();
  if (!text || text.includes('dramatically improved code')) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    const previous = copyFixBtn.textContent;
    copyFixBtn.textContent = 'Copied ✓';
    setTimeout(() => {
      copyFixBtn.textContent = previous;
    }, 1400);
  } catch (error) {
    console.error('Clipboard copy failed:', error);
  }
}

function handleClear() {
  codeInput.value = '';
  updateLineCount();
  fixedCodeBlock.textContent = '// Your dramatically improved code will appear here.';
  renderIssues([]);
  setSpeechBubble('Quack. Show me the code and try not to make this worse.');
  state.currentRoast = 'Quack. Show me the code and try not to make this worse.';
  updateStats({ lines: 0, issuesFound: 0, fixes: 0 });
}

analyzeBtn.addEventListener('click', analyzeCurrentCode);
clearBtn.addEventListener('click', handleClear);
copyFixBtn.addEventListener('click', copyFix);
replayBtn.addEventListener('click', () => {
  if (state.currentRoast) {
    speakRoast(state.currentRoast);
  }
});
duckBtn.addEventListener('click', triggerDuckAnimation);
codeInput.addEventListener('input', updateLineCount);

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {};
}

codeInput.value = sampleCode;
updateLineCount();
updateStats({ lines: 12, issuesFound: 4, fixes: 3 });
renderIssues([
  {
    type: 'var detected',
    severity: 'warning',
    message: 'Use const or let instead of var.',
    roast: 'var? In this economy?'
  },
  {
    type: 'Loose Equality',
    severity: 'warning',
    message: 'Use === instead of ==, and !== instead of !=.',
    roast: 'Your comparison has commitment issues.'
  },
  {
    type: 'Missing semicolon',
    severity: 'warning',
    message: 'Add semicolons to complete statements and avoid sloppy endings.',
    roast: 'That semicolon went missing under suspicious circumstances.'
  },
  {
    type: 'Missing return',
    severity: 'error',
    message: 'Function calculateScore calculates a value but never returns it.',
    roast: 'You calculated the answer and then ghosted it.'
  }
]);
fixedCodeBlock.textContent = `const userName = "Krish";
const age = 20;

if (age === 20) {
  console.log("Hello " + userName);
}

function calculateScore(a, b) {
  const total = a + b;
  return total;
}

console.log(calculateScore(10, 20));`;
setSpeechBubble('Quack. Show me the code and try not to make this worse.');

analyzeCurrentCode();
