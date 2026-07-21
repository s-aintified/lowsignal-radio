function loadEntries() { return Store.get('dashboard_diary', []); }
function saveEntries(list) { Store.set('dashboard_diary', list); }

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let selectedMood = '';

function renderEntries() {
  const list = document.getElementById('entry-list');
  const search = document.getElementById('search-box').value.trim().toLowerCase();
  const moodFilter = document.getElementById('mood-filter').value;

  let entries = loadEntries().slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (moodFilter) entries = entries.filter(e => e.mood === moodFilter);
  if (search) {
    entries = entries.filter(e =>
      (e.title || '').toLowerCase().includes(search) ||
      (e.body || '').toLowerCase().includes(search) ||
      (e.tags || []).some(t => t.toLowerCase().includes(search))
    );
  }

  if (entries.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="emoji">📝</span>No entries yet. Whenever you're ready, write your first one above.</div>`;
    return;
  }

  list.innerHTML = '';
  entries.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    const tagsHtml = (entry.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('');
    card.innerHTML = `
      <div class="entry-head">
        <div><span class="entry-mood">${entry.mood || '📝'}</span> <span class="entry-date">${formatDateNice(entry.date)}</span></div>
        <div class="row-actions">
          <button class="btn-danger btn-sm" data-id="${entry.id}" data-action="delete-entry">🗑️ Delete</button>
        </div>
      </div>
      ${entry.title ? `<div class="entry-title">${escapeHtml(entry.title)}</div>` : ''}
      ${entry.body ? `<div class="entry-body">${escapeHtml(entry.body)}</div>` : ''}
      ${tagsHtml ? `<div class="entry-tags">${tagsHtml}</div>` : ''}
    `;
    list.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mood-picker').addEventListener('click', e => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;
    const isSame = selectedMood === btn.dataset.mood;
    selectedMood = isSame ? '' : btn.dataset.mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.setAttribute('aria-pressed', b === btn && !isSame));
  });

  document.getElementById('entry-form').addEventListener('submit', e => {
    e.preventDefault();
    const entries = loadEntries();
    const tagsRaw = document.getElementById('entry-tags').value.trim();
    entries.push({
      id: uid(),
      date: new Date().toISOString(),
      mood: selectedMood,
      title: document.getElementById('entry-title').value.trim(),
      body: document.getElementById('entry-body').value.trim(),
      tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    });
    saveEntries(entries);
    e.target.reset();
    selectedMood = '';
    document.querySelectorAll('.mood-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
    toast('Entry saved 💜');
    renderEntries();
  });

  document.getElementById('entry-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-entry"]');
    if (!btn) return;
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    saveEntries(loadEntries().filter(entry => entry.id !== btn.dataset.id));
    toast('Entry deleted');
    renderEntries();
  });

  document.getElementById('search-box').addEventListener('input', renderEntries);
  document.getElementById('mood-filter').addEventListener('change', renderEntries);

  renderEntries();
});
