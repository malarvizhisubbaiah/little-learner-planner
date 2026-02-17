/**
 * app.js — Little Learner Planner UX
 * Reads progress.json from the repo and GitHub Issues for lesson history.
 */

// ── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_REPO = 'microsoft/little-learner-planner';
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
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIssue = issuesData.find(issue => {
    const created = issue.created_at.split('T')[0];
    return created === todayStr;
  });

  if (todayIssue) {
    document.getElementById('today-plan').style.display = 'block';
    document.getElementById('today-plan').innerHTML = renderLessonCard(todayIssue, true);
  } else if (issuesData.length > 0) {
    // Show most recent plan
    document.getElementById('today-plan').style.display = 'block';
    document.getElementById('today-plan').innerHTML =
      `<div class="info-banner" style="background:#FFF3CD;border:1px solid #FFEAA7;border-radius:12px;padding:1rem;margin-bottom:1rem;text-align:center;">
        ⏰ No plan for today yet — showing the most recent lesson:
      </div>` +
      renderLessonCard(issuesData[0], true);
  } else {
    document.getElementById('today-empty').style.display = 'block';
  }
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

// ── Sample Plan Generator (offline) ─────────────────────────────────────────

function generateLocalPlan() {
  const plan = `
    <div class="lesson-card">
      <div class="lesson-header">
        <h2>📚 Sample Lesson — Fun with Letter S!</h2>
        <div class="lesson-meta">
          <span>📅 Today</span>
          <span>🎯 Focus: Phonics</span>
          <span>🔤 Letter: S</span>
        </div>
      </div>
      <div class="lesson-body">
        <div class="teaching-steps">
          <h3>Teaching Steps</h3>
          <ol>
            <li><strong>Letter Sounds</strong> — Learn the "S" sound (sssss like a snake!)</li>
            <li><strong>Counting</strong> — Count objects 1 to 5</li>
            <li><strong>Storytime</strong> — Read "The Very Hungry Caterpillar"</li>
          </ol>
        </div>

        <div class="activity phonics">
          <div class="activity-title"><span class="activity-label label-phonics">🔤 Phonics</span> Snake Sounds</div>
          <p class="scenario"><strong>Scenario:</strong> "Let's be sneaky snakes! Can you make the sssss sound?"</p>
          <p><strong>Activity:</strong> Slither around the room like a snake making the S sound. Find 3 things starting with S (sock, spoon, sofa).</p>
          <p class="answer"><strong>Answer:</strong> S says sssss</p>
        </div>

        <div class="activity maths">
          <div class="activity-title"><span class="activity-label label-maths">🔢 Maths</span> Count to 5</div>
          <p class="scenario"><strong>Scenario:</strong> "Let's count your fingers on one hand! Ready? 1... 2..."</p>
          <p><strong>Activity:</strong> Touch each finger as you count to 5. Then count 5 toys, 5 steps, 5 claps.</p>
          <p class="answer"><strong>Answer:</strong> 1, 2, 3, 4, 5</p>
        </div>

        <div class="activity reading">
          <div class="activity-title"><span class="activity-label label-reading">📖 Reading</span> Cover Clues</div>
          <p class="scenario"><strong>Scenario:</strong> "Look at this book cover! What do you think this story is about?"</p>
          <p><strong>Activity:</strong> Show "The Very Hungry Caterpillar" cover. Let your child guess. Read together and check!</p>
          <p class="answer"><strong>Answer:</strong> Predictions based on cover art</p>
        </div>

        <div class="activity game">
          <div class="activity-title"><span class="activity-label label-game">🎮 Game</span> I Spy Sounds</div>
          <p class="scenario"><strong>Scenario:</strong> "I spy with my little eye, something that starts with sssss!"</p>
          <p><strong>Activity:</strong> Take turns finding objects starting with the S sound. Give clues if stuck!</p>
          <p class="answer"><strong>Answer:</strong> Objects starting with S</p>
        </div>

        <div class="activity phonics">
          <div class="activity-title"><span class="activity-label label-phonics">🔤 Phonics</span> Sand Letter S</div>
          <p class="scenario"><strong>Scenario:</strong> "Let's draw a wiggly snake letter!"</p>
          <p><strong>Activity:</strong> Pour salt on a tray. Trace the letter S with your finger. Try 3 times!</p>
          <p class="answer"><strong>Answer:</strong> Tracing the letter S</p>
        </div>

        <div class="activity game">
          <div class="activity-title"><span class="activity-label label-game">🎵 Rhyme</span> Rhyme Chain</div>
          <p class="scenario"><strong>Scenario:</strong> "Cat! What rhymes with cat? Bat! What rhymes with bat?"</p>
          <p><strong>Activity:</strong> Take turns saying rhyming words. Silly made-up words are OK!</p>
          <p class="answer"><strong>Answer:</strong> Rhyming words (real and silly)</p>
        </div>

        <div class="worksheet-section">
          <h3>📝 Today's Worksheet</h3>
          <a href="https://www.k5learning.com/free-preschool-kindergarten-worksheets/letters-of-the-alphabet" target="_blank">
            Letter Tracing Worksheets — K5 Learning (Free) ↗
          </a>
        </div>
      </div>
    </div>`;

  document.getElementById('today-empty').style.display = 'none';
  document.getElementById('today-plan').style.display = 'block';
  document.getElementById('today-plan').innerHTML = plan;
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
