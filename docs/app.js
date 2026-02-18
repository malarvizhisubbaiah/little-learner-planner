/**
 * app.js — Little Learner Planner
 * Simple: show current plan → mark done → generate next
 */

const REPO = 'malarvizhisubbaiah/little-learner-planner';
const API = `https://api.github.com/repos/${REPO}`;

let issuesData = [];

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
    const res = await fetch(`${API}/issues?labels=lesson-plan&state=all&per_page=50&sort=created&direction=desc`, { headers: authHeaders() });
    if (res.ok) issuesData = await res.json();
  } catch (e) { console.warn('Could not load issues:', e); }
  render();
}

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
      <p style="font-size:0.75rem;color:#666;margin-bottom:0.5rem;">Create one at <a href="https://github.com/settings/tokens/new?scopes=repo&description=Little+Learner+Planner" target="_blank">github.com/settings/tokens</a> with <code>repo</code> scope.</p>
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

async function markDoneAndGenerate(issueNumber) {
  const token = getToken();
  if (!token) { alert('Please enter your GitHub token first.'); return; }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Marking done...';

  try {
    await fetch(`${API}/issues/${issueNumber}`, {
      method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed' }),
    });

    btn.textContent = '⏳ Generating next plan...';

    await fetch(`${API}/actions/workflows/daily-lesson.yml/dispatches`, {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });

    btn.textContent = '✅ Done! Refreshing in 20s...';
    btn.style.background = '#48BB78';
    setTimeout(() => location.reload(), 20000);
  } catch (e) {
    btn.textContent = '❌ Error — try again';
    btn.disabled = false;
    console.error(e);
  }
}

async function generateNextPlan() {
  const token = getToken();
  if (!token) { alert('Please enter your GitHub token first.'); return; }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  try {
    await fetch(`${API}/actions/workflows/daily-lesson.yml/dispatches`, {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });

    btn.textContent = '✅ Generating! Refreshing in 20s...';
    btn.style.background = '#48BB78';
    setTimeout(() => location.reload(), 20000);
  } catch (e) {
    btn.textContent = '❌ Error — try again';
    btn.disabled = false;
    console.error(e);
  }
}

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
