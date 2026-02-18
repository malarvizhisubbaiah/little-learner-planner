/**
 * app.js — Little Learner Planner UX
 * Reads progress.json from the repo and GitHub Issues for lesson history.
 */

// ── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_REPO = 'malarvizhisubbaiah/little-learner-planner';
const PHONICS_ORDER = ['S','A','T','P','I','N','M','D','G','O','C','K','E','U','R','H','B','F','L','J','V','W','X','Y','Z','Q'];

const MATHS_MILESTONES = [
  { id: 'counting-1-to-5', label: 'Counting 1–5' },
  { id: 'counting-1-to-10', label: 'Counting 1–10' },
  { id: 'number-recognition-1-3', label: 'Numbers 1–3' },
  { id: 'number-recognition-4-6', label: 'Numbers 4–6' },
  { id: 'shapes-circle-square', label: 'Circle & Square' },
  { id: 'shapes-triangle-rectangle', label: 'Triangle & Rectangle' },
  { id: 'sorting-by-color', label: 'Sorting by Color' },
  { id: 'sorting-by-size', label: 'Sorting by Size' },
  { id: 'patterns-ABAB', label: 'Patterns (ABAB)' },
  { id: 'more-or-less', label: 'More or Less' },
  { id: 'addition-with-objects-to-3', label: 'Addition to 3' },
  { id: 'addition-with-objects-to-5', label: 'Addition to 5' },
  { id: 'finger-counting', label: 'Finger Counting' },
  { id: 'measurement-with-blocks', label: 'Measuring' },
];

const READING_MILESTONES = [
  { id: 'book-handling', label: 'Book Handling' },
  { id: 'cover-prediction', label: 'Cover Predictions' },
  { id: 'name-recognition', label: 'Name Recognition' },
  { id: 'picture-walk', label: 'Picture Walk' },
  { id: 'who-what-where-questions', label: 'Comprehension Q&A' },
  { id: 'story-retelling', label: 'Story Retelling' },
  { id: 'rhyming-in-stories', label: 'Rhyming Words' },
  { id: 'connect-story-to-life', label: 'Story Connections' },
];

let progressData = null;
let issuesData = [];
let currentFilter = 'all';

// ── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const repo = getRepo();
  if (!repo) {
    document.getElementById('config-banner').style.display = 'block';
    hideLoading();
    return;
  }
  await Promise.all([loadProgress(repo), loadIssues(repo)]);
  render();
}

function getRepo() {
  return localStorage.getItem('llp-repo') || DEFAULT_REPO;
}

function saveConfig() {
  const input = document.getElementById('repo-input').value.trim();
  if (input && input.includes('/')) {
    localStorage.setItem('llp-repo', input);
    location.reload();
  }
}

// ── Data Loading ────────────────────────────────────────────────────────────

async function loadProgress(repo) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/progress.json`);
    if (!res.ok) {
      // Try master branch
      const res2 = await fetch(`https://raw.githubusercontent.com/${repo}/master/progress.json`);
      if (res2.ok) progressData = await res2.json();
    } else {
      progressData = await res.json();
    }
  } catch (e) {
    console.warn('Could not load progress.json:', e);
  }
}

async function loadIssues(repo) {
  try {
    const [owner, name] = repo.split('/');
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}/issues?labels=lesson-plan&state=all&per_page=50&sort=created&direction=desc`);
    if (res.ok) {
      issuesData = await res.json();
    }
  } catch (e) {
    console.warn('Could not load issues:', e);
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────

function render() {
  hideLoading();
  renderToday();
  renderHistory();
  renderProgress();
}

function hideLoading() {
  document.querySelectorAll('.loading').forEach(el => el.style.display = 'none');
}

// ── Today's Plan ────────────────────────────────────────────────────────────

function renderToday() {
  if (issuesData.length === 0) {
    document.getElementById('today-empty').style.display = 'block';
    return;
  }

  // Always show the most recent lesson plan
  const latest = issuesData[0];
  const createdDate = new Date(latest.created_at).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = createdDate === todayStr;

  document.getElementById('today-plan').style.display = 'block';
  let banner = '';
  if (!isToday) {
    banner = `<div class="info-banner" style="background:#FFF3CD;border:1px solid #FFEAA7;border-radius:12px;padding:1rem;margin-bottom:1rem;text-align:center;">
      ⏰ Today's plan hasn't been generated yet — showing the most recent lesson.
      <br><a href="https://github.com/${getRepo()}/actions/workflows/daily-lesson.yml" target="_blank" style="color:#6C63FF;font-weight:600;">▶️ Generate Next Plan</a>
    </div>`;
  }
  document.getElementById('today-plan').innerHTML = banner + renderLessonCard(latest, true);

  // Show "Generate Next Plan" button below the card
  document.getElementById('today-plan').innerHTML += `
    <div style="text-align:center;margin-top:1rem;">
      <a href="https://github.com/${getRepo()}/actions/workflows/daily-lesson.yml" target="_blank" class="btn-primary" style="display:inline-block;text-decoration:none;">
        🚀 Generate Next Day's Plan
      </a>
      <p style="font-size:0.8rem;color:#888;margin-top:0.5rem;">Click "Run workflow" on GitHub to create the next lesson</p>
    </div>`;
}

function renderLessonCard(issue, expanded = false) {
  const labels = issue.labels.map(l => l.name);
  const focus = labels.find(l => ['phonics', 'maths', 'reading'].includes(l)) || '';
  const dayMatch = issue.title.match(/Day (\d+)/);
  const dayNum = dayMatch ? dayMatch[1] : '?';
  const date = new Date(issue.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const bodyHtml = markdownToHtml(issue.body || '');

  return `
    <div class="lesson-card">
      <div class="lesson-header">
        <h2>📚 Day ${dayNum} — Lesson Plan</h2>
        <div class="lesson-meta">
          <span>📅 ${date}</span>
          <span>🎯 Focus: ${focus}</span>
          ${issue.title.match(/Letter: (\w)/) ? `<span>🔤 Letter: ${issue.title.match(/Letter: (\w)/)[1]}</span>` : ''}
        </div>
      </div>
      <div class="lesson-body">${bodyHtml}</div>
    </div>`;
}

// ── History ─────────────────────────────────────────────────────────────────

function renderHistory() {
  const container = document.getElementById('history-list');

  if (issuesData.length === 0 && (!progressData || progressData.history.length === 0)) {
    document.getElementById('history-empty').style.display = 'block';
    return;
  }

  // Use issues as primary source, fallback to progress.json history
  const items = issuesData.length > 0 ? issuesData : [];

  container.innerHTML = items
    .filter(issue => {
      if (currentFilter === 'all') return true;
      return issue.labels.some(l => l.name === currentFilter);
    })
    .map(issue => {
      const labels = issue.labels.map(l => l.name);
      const focus = labels.find(l => ['phonics', 'maths', 'reading'].includes(l)) || '';
      const dayMatch = issue.title.match(/Day (\d+)/);
      const dayNum = dayMatch ? dayMatch[1] : '?';
      const date = new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return `
        <div class="history-item" onclick="openIssue('${issue.html_url}')">
          <div class="history-day">${dayNum}</div>
          <div class="history-info">
            <h4>${issue.title.replace(/📚\s*/, '')}</h4>
            <p>${date}</p>
          </div>
          <div class="history-tags">
            ${focus ? `<span class="tag tag-${focus}">${focus}</span>` : ''}
          </div>
        </div>`;
    })
    .join('');

  // If using progress.json as fallback
  if (items.length === 0 && progressData && progressData.history.length > 0) {
    container.innerHTML = progressData.history
      .slice()
      .reverse()
      .filter(h => currentFilter === 'all' || h.focus === currentFilter)
      .map(h => `
        <div class="history-item">
          <div class="history-day">${h.day}</div>
          <div class="history-info">
            <h4>Day ${h.day} — Focus: ${h.focus} | Letter: ${h.letter}</h4>
            <p>${h.date} · Book: ${h.book}</p>
          </div>
          <div class="history-tags">
            <span class="tag tag-${h.focus}">${h.focus}</span>
          </div>
        </div>`)
      .join('');
  }
}

function filterHistory(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(filter) || (filter === 'all' && btn.textContent === 'All'));
  });
  renderHistory();
}

function openIssue(url) {
  window.open(url, '_blank');
}

// ── Progress ────────────────────────────────────────────────────────────────

function renderProgress() {
  if (!progressData) {
    // Show empty progress from defaults
    renderLetters([]);
    renderStats(0, 0, 0, 0);
    renderTopics('maths-topics', MATHS_MILESTONES, []);
    renderTopics('reading-topics', READING_MILESTONES, []);
    renderStreak([]);
    return;
  }

  const p = progressData;

  // Letters
  renderLetters(p.phonics.letters_covered);

  // Stats
  const total = p.history.length;
  const phonics = p.history.filter(h => h.focus === 'phonics').length;
  const maths = p.history.filter(h => h.focus === 'maths').length;
  const reading = p.history.filter(h => h.focus === 'reading').length;
  renderStats(total, phonics, maths, reading);

  // Topics
  renderTopics('maths-topics', MATHS_MILESTONES, p.maths.topics_covered);
  renderTopics('reading-topics', READING_MILESTONES, p.reading.topics_covered);

  // Streak
  renderStreak(p.history);
}

function renderLetters(covered) {
  const container = document.getElementById('letters-progress');
  container.innerHTML = PHONICS_ORDER.map(letter => {
    const isCovered = covered.includes(letter);
    return `<div class="letter-cell ${isCovered ? 'covered' : ''}">${letter}</div>`;
  }).join('');

  const pct = Math.round((covered.length / PHONICS_ORDER.length) * 100);
  document.getElementById('letters-bar').style.width = `${pct}%`;
  document.getElementById('letters-count').textContent = `${covered.length} of ${PHONICS_ORDER.length} letters (${pct}%)`;
}

function renderStats(total, phonics, maths, reading) {
  document.getElementById('total-lessons').textContent = total;
  document.getElementById('phonics-lessons').textContent = phonics;
  document.getElementById('maths-lessons').textContent = maths;
  document.getElementById('reading-lessons').textContent = reading;
}

function renderTopics(containerId, milestones, covered) {
  const container = document.getElementById(containerId);
  container.innerHTML = milestones.map(m => {
    const done = covered.includes(m.id);
    return `
      <div class="topic-item">
        <div class="topic-check ${done ? 'done' : 'pending'}">${done ? '✅' : '⬜'}</div>
        <span>${m.label}</span>
      </div>`;
  }).join('');
}

function renderStreak(history) {
  const container = document.getElementById('streak-calendar');
  const today = new Date();
  const days = [];

  // Show last 28 days (4 weeks)
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isActive = history.some(h => h.date === dateStr);
    const isToday = i === 0;
    days.push(`<div class="streak-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}">${d.getDate()}</div>`);
  }

  // Day labels
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const header = dayLabels.map(d => `<div class="streak-day" style="font-weight:700;background:none;">${d}</div>`).join('');

  container.innerHTML = header + days.join('');
}

// ── Tab Switching ───────────────────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ── Minimal Markdown to HTML ────────────────────────────────────────────────

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
