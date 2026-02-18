/**
 * app.js — Little Learner Planner
 * Tabs: Today (current plan) | History (past plans) | Progress (roadmap)
 */

const REPO = 'malarvizhisubbaiah/little-learner-planner';
const API = `https://api.github.com/repos/${REPO}`;

const LETTER_ORDER = 'S A T P I N M D G O C K E U R H B F L J V W X Y Z Q'.split(' ');
const MATHS_TOPICS = [
  'counting-1-to-5','counting-1-to-10','number-recognition-1-3','number-recognition-4-6',
  'number-recognition-7-10','shapes-circle-square','shapes-triangle-rectangle','shape-hunt',
  'sorting-by-color','sorting-by-size','sorting-by-shape','patterns-ABAB','patterns-AABB',
  'big-small-comparison','tall-short-comparison','more-or-less','ordering-by-size',
  'addition-with-objects-to-3','addition-with-objects-to-5','subtraction-with-objects',
  'number-bonds-to-5','story-problems','counting-to-15','counting-to-20',
  'finger-counting','measurement-with-blocks','number-writing-1-5','number-writing-6-10'
];
const READING_TOPICS = [
  'book-handling','turning-pages','point-to-words','cover-prediction','name-recognition',
  'find-letters-in-name','print-awareness','story-retelling','who-what-where-questions',
  'picture-walk','predict-what-happens-next','connect-story-to-life','new-vocabulary-words',
  'picture-dictionary','retell-with-toys','make-a-book','rhyming-in-stories',
  'repetition-in-stories','favorite-book-revisit','feelings-in-stories'
];

let issuesData = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('visibilitychange', () => { if (!document.hidden) init(); });

function getToken() { return localStorage.getItem('llp-token') || ''; }

function saveToken() {
  const t = document.getElementById('token-input').value.trim();
  if (t) { localStorage.setItem('llp-token', t); location.reload(); }
}

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `token ${t}`, 'Accept': 'application/vnd.github+json' } : { 'Accept': 'application/vnd.github+json' };
}

async function init() {
  try {
    const res = await fetch(`${API}/issues?labels=lesson-plan&state=all&per_page=100&sort=created&direction=desc`, { headers: authHeaders() });
    if (res.ok) issuesData = await res.json();
  } catch (e) { console.warn('Could not load issues:', e); }
  render();
}

// ── Tab Switching ─────────────────────────────────────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`#tab-${tab}`).classList.add('active');
  event.target.classList.add('active');

  if (tab === 'history') renderHistory();
  if (tab === 'progress') renderProgress();
}

// ── Today Tab ─────────────────────────────────────────────────────────────

function render() {
  document.querySelectorAll('.loading').forEach(el => el.style.display = 'none');

  if (issuesData.length === 0) {
    document.getElementById('today-empty').style.display = 'block';
    return;
  }

  const openIssue = issuesData.find(i => i.state === 'open');
  const latest = openIssue || issuesData[0];
  const isDone = latest.state === 'closed';

  const container = document.getElementById('today-plan');
  container.style.display = 'block';
  container.innerHTML = renderCard(latest) + renderButtons(latest, isDone);
}

function renderCard(issue) {
  const labels = issue.labels.map(l => l.name);
  const focus = labels.find(l => ['phonics', 'maths', 'reading'].includes(l)) || '';
  const dayNum = (issue.title.match(/Day (\d+)/) || [,'?'])[1];
  const date = new Date(issue.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const letterMatch = issue.title.match(/Letter: (\w)/);
  const status = issue.state === 'closed'
    ? '<span style="background:#C6F6D5;color:#276749;padding:2px 10px;border-radius:12px;font-size:0.85rem;">✅ Done</span>'
    : '<span style="background:#FED7E2;color:#97266D;padding:2px 10px;border-radius:12px;font-size:0.85rem;">📌 Current</span>';

  return `
    <div class="lesson-card">
      <div class="lesson-header">
        <h2>📚 Day ${dayNum} — Lesson Plan ${status}</h2>
        <div class="lesson-meta">
          <span>📅 ${date}</span>
          <span>🎯 Focus: ${focus}</span>
          ${letterMatch ? `<span>🔤 Letter: ${letterMatch[1]}</span>` : ''}
        </div>
      </div>
      <div class="lesson-body">${markdownToHtml(issue.body || '')}</div>
    </div>`;
}

function renderButtons(issue, isDone) {
  const hasToken = !!getToken();
  const tokenBox = !hasToken ? `
    <div style="margin-top:1rem;padding:1rem;background:#FFF3CD;border-radius:12px;border:1px solid #FFEAA7;text-align:left;max-width:500px;margin-left:auto;margin-right:auto;">
      <p style="font-size:0.85rem;margin-bottom:0.5rem;">🔑 <strong>One-time setup:</strong> Enter a GitHub token to enable buttons.</p>
      <p style="font-size:0.75rem;color:#666;margin-bottom:0.5rem;">Create a <strong>Classic</strong> token at <a href="https://github.com/settings/tokens/new?scopes=repo&description=Little+Learner+Planner" target="_blank">github.com/settings/tokens</a> → select <code>repo</code> scope → Generate.</p>
      <div style="display:flex;gap:0.5rem;">
        <input type="password" id="token-input" placeholder="ghp_xxxxxxxxxxxx" style="flex:1;padding:0.4rem 0.75rem;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;">
        <button onclick="saveToken()" style="padding:0.4rem 1rem;background:#6C63FF;color:white;border:none;border-radius:8px;cursor:pointer;">Save</button>
      </div>
    </div>` : '';

  if (isDone) {
    return `<div style="text-align:center;margin-top:1.5rem;">
      <button onclick="generateNextPlan()" class="btn-primary" style="font-size:1.1rem;padding:0.75rem 2rem;">
        🚀 Generate Plan
      </button>${tokenBox}
    </div>`;
  }

  return `<div style="text-align:center;margin-top:1.5rem;">
    <button onclick="markDoneAndGenerate(${issue.number})" class="btn-primary" style="font-size:1.1rem;padding:0.75rem 2rem;background:linear-gradient(135deg,#48BB78,#38A169);">
      ✅ Done — Generate Next Plan
    </button>${tokenBox}
  </div>`;
}

// ── History Tab ───────────────────────────────────────────────────────────

function renderHistory() {
  const container = document.getElementById('history-list');
  // Sort oldest first to show journey in order
  const sorted = [...issuesData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const filtered = currentFilter === 'all' ? sorted : sorted.filter(i => i.labels.some(l => l.name === currentFilter));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><h2>No history yet</h2><p>Complete your first lesson to see it here!</p></div>';
    return;
  }

  container.innerHTML = filtered.map(issue => {
    const labels = issue.labels.map(l => l.name);
    const focus = labels.find(l => ['phonics', 'maths', 'reading'].includes(l)) || '';
    const dayNum = (issue.title.match(/Day (\d+)/) || [,'?'])[1];
    const letterMatch = issue.title.match(/Letter: (\w)/);
    const date = new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isDone = issue.state === 'closed';
    const statusIcon = isDone ? '✅' : '📌';

    return `
      <div class="history-item" onclick="openModal(${issue.number})">
        <div class="history-day">${dayNum}</div>
        <div class="history-info">
          <h4>${statusIcon} ${focus.charAt(0).toUpperCase() + focus.slice(1)} ${letterMatch ? `· Letter ${letterMatch[1]}` : ''}</h4>
          <p>${date} ${isDone ? '· Completed' : '· In Progress'}</p>
        </div>
        <div class="history-tags">
          <span class="tag tag-${focus}">${focus}</span>
        </div>
      </div>`;
  }).join('');
}

function filterHistory(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderHistory();
}

function openModal(issueNumber) {
  const issue = issuesData.find(i => i.number === issueNumber);
  if (!issue) return;
  document.getElementById('modal-body').innerHTML = `<div style="padding:1.5rem;">${renderCard(issue).replace('lesson-card','lesson-card modal-card')}</div>`;
  document.getElementById('plan-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('plan-modal').style.display = 'none';
}

// ── Progress Tab ──────────────────────────────────────────────────────────

function renderProgress() {
  const container = document.getElementById('progress-content');
  const closed = issuesData.filter(i => i.state === 'closed');
  const totalDays = issuesData.length;
  const doneDays = closed.length;

  // Parse what's been covered from issue titles/labels
  const lettersCovered = new Set();
  const mathsDone = new Set();
  const readingDone = new Set();
  const booksSeen = new Set();

  issuesData.forEach(issue => {
    const letterMatch = issue.title.match(/Letter: (\w)/);
    if (letterMatch && issue.state === 'closed') lettersCovered.add(letterMatch[1]);

    // Parse body for covered topics
    const body = issue.body || '';
    MATHS_TOPICS.forEach(t => {
      if (body.toLowerCase().includes(t.replace(/-/g, ' ').toLowerCase())) mathsDone.add(t);
    });
    READING_TOPICS.forEach(t => {
      if (body.toLowerCase().includes(t.replace(/-/g, ' ').toLowerCase())) readingDone.add(t);
    });
    // Extract book
    const bookMatch = body.match(/Today's Book\n\*\*\[(.+?)\]/);
    if (bookMatch) booksSeen.add(bookMatch[1]);
  });

  const nextLetterIdx = LETTER_ORDER.findIndex(l => !lettersCovered.has(l));
  const nextLetter = nextLetterIdx >= 0 ? LETTER_ORDER[nextLetterIdx] : '🎉 All done!';

  container.innerHTML = `
    <!-- Stats Overview -->
    <div class="progress-grid">
      <div class="progress-card">
        <h3>📅 Overall</h3>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-number">${doneDays}</span>
            <span class="stat-label">Days Done</span>
          </div>
          <div class="stat">
            <span class="stat-number">${totalDays}</span>
            <span class="stat-label">Plans Created</span>
          </div>
        </div>
      </div>
      <div class="progress-card">
        <h3>📖 Books Read</h3>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-number">${booksSeen.size}</span>
            <span class="stat-label">Books</span>
          </div>
          <div class="stat">
            <span class="stat-number">${20 - booksSeen.size}</span>
            <span class="stat-label">Remaining</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Phonics Letter Grid -->
    <div class="progress-card" style="margin-bottom:1rem;">
      <h3>🔤 Phonics — Letter Progress</h3>
      <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:0.75rem;">Next letter: <strong>${nextLetter}</strong></p>
      <div class="letter-grid">
        ${LETTER_ORDER.map(l => `<div class="letter-cell ${lettersCovered.has(l) ? 'covered' : ''}">${l}</div>`).join('')}
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width:${(lettersCovered.size / 26 * 100).toFixed(0)}%"></div>
      </div>
      <p class="progress-text">${lettersCovered.size} of 26 letters covered (${(lettersCovered.size / 26 * 100).toFixed(0)}%)</p>
    </div>

    <!-- Maths Topics -->
    <div class="progress-card" style="margin-bottom:1rem;">
      <h3>🔢 Maths Topics</h3>
      <div class="progress-bar-container" style="margin-bottom:0.5rem;">
        <div class="progress-bar" style="width:${(mathsDone.size / MATHS_TOPICS.length * 100).toFixed(0)}%;background:linear-gradient(90deg,#4ECDC4,#2ECC71)"></div>
      </div>
      <p class="progress-text" style="margin-bottom:0.75rem;">${mathsDone.size} of ${MATHS_TOPICS.length} topics covered</p>
      <div class="topic-list">
        ${MATHS_TOPICS.map(t => {
          const done = mathsDone.has(t);
          const label = t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return `<div class="topic-item">
            <div class="topic-check ${done ? 'done' : 'pending'}">${done ? '✅' : '⬜'}</div>
            <span>${label}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Reading Topics -->
    <div class="progress-card" style="margin-bottom:1rem;">
      <h3>📖 Reading Skills</h3>
      <div class="progress-bar-container" style="margin-bottom:0.5rem;">
        <div class="progress-bar" style="width:${(readingDone.size / READING_TOPICS.length * 100).toFixed(0)}%;background:linear-gradient(90deg,#FFB347,#FF6B6B)"></div>
      </div>
      <p class="progress-text" style="margin-bottom:0.75rem;">${readingDone.size} of ${READING_TOPICS.length} skills covered</p>
      <div class="topic-list">
        ${READING_TOPICS.map(t => {
          const done = readingDone.has(t);
          const label = t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return `<div class="topic-item">
            <div class="topic-check ${done ? 'done' : 'pending'}">${done ? '✅' : '⬜'}</div>
            <span>${label}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- What's Coming Next -->
    <div class="progress-card">
      <h3>🔮 What's Coming Next</h3>
      <div class="topic-list">
        ${buildUpcoming(lettersCovered, mathsDone, readingDone)}
      </div>
    </div>
  `;
}

function buildUpcoming(lettersCovered, mathsDone, readingDone) {
  const items = [];
  const nextLetters = LETTER_ORDER.filter(l => !lettersCovered.has(l)).slice(0, 5);
  if (nextLetters.length) items.push(`<div class="topic-item"><div class="topic-check pending">🔤</div><span>Letters coming up: <strong>${nextLetters.join(', ')}</strong></span></div>`);

  const nextMaths = MATHS_TOPICS.filter(t => !mathsDone.has(t)).slice(0, 3);
  nextMaths.forEach(t => {
    items.push(`<div class="topic-item"><div class="topic-check pending">🔢</div><span>${t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>`);
  });

  const nextReading = READING_TOPICS.filter(t => !readingDone.has(t)).slice(0, 3);
  nextReading.forEach(t => {
    items.push(`<div class="topic-item"><div class="topic-check pending">📖</div><span>${t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>`);
  });

  return items.length ? items.join('') : '<p style="color:var(--text-light);">🎉 All topics covered!</p>';
}

// ── Actions ───────────────────────────────────────────────────────────────

async function markDoneAndGenerate(issueNumber) {
  const token = getToken();
  if (!token) { alert('Please enter your GitHub token first (yellow box below).'); return; }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Marking done...';

  try {
    const closeRes = await fetch(`${API}/issues/${issueNumber}`, {
      method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed' }),
    });
    if (!closeRes.ok) throw new Error('Failed to close issue: ' + closeRes.status);

    btn.textContent = '⏳ Triggering next plan...';

    const triggerRes = await fetch(`${API}/actions/workflows/daily-lesson.yml/dispatches`, {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });
    if (!triggerRes.ok) throw new Error('Failed to trigger workflow: ' + triggerRes.status);

    btn.textContent = '⏳ Generating plan...';
    await pollForNewIssue(issueNumber, btn);

  } catch (e) {
    btn.textContent = '❌ ' + e.message;
    btn.disabled = false;
    console.error(e);
  }
}

async function generateNextPlan() {
  const token = getToken();
  if (!token) { alert('Please enter your GitHub token first (yellow box below).'); return; }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Triggering plan...';

  try {
    const triggerRes = await fetch(`${API}/actions/workflows/daily-lesson.yml/dispatches`, {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });
    if (!triggerRes.ok) throw new Error('Failed to trigger workflow: ' + triggerRes.status);

    btn.textContent = '⏳ Generating plan...';
    await pollForNewIssue(0, btn);

  } catch (e) {
    btn.textContent = '❌ ' + e.message;
    btn.disabled = false;
    console.error(e);
  }
}

async function pollForNewIssue(oldIssueNumber, btn) {
  for (let i = 0; i < 12; i++) {
    btn.textContent = `⏳ Generating plan... (${(i + 1) * 5}s)`;
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await fetch(`${API}/issues?labels=lesson-plan&state=open&per_page=1&sort=created&direction=desc`, { headers: authHeaders() });
      if (res.ok) {
        const issues = await res.json();
        if (issues.length > 0 && issues[0].number !== oldIssueNumber) {
          btn.textContent = '✅ New plan ready!';
          btn.style.background = '#48BB78';
          setTimeout(() => location.reload(), 1000);
          return;
        }
      }
    } catch (e) { /* keep polling */ }
  }
  btn.textContent = '⏳ Still generating... reloading';
  setTimeout(() => location.reload(), 2000);
}

// ── Markdown to HTML ──────────────────────────────────────────────────────

function markdownToHtml(md) {
  return md
    .replace(/^#### (.+)$/gm, '<div class="activity"><div class="activity-title">$1</div>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*\[(.+?)\]\((.+?)\)\*\*/g, '<a href="$2" target="_blank"><strong>$1</strong></a>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n/g, '<br>');
}
