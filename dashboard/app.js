/* Shared helpers used across index.html, finance.html, diary.html */

const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toast(message) {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

function formatMoney(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toMonthly(amount, frequency) {
  const n = Number(amount) || 0;
  switch (frequency) {
    case 'weekly': return n * 4.345;
    case 'biweekly': return n * 2.1725;
    case 'yearly': return n / 12;
    case 'one-time': return 0;
    case 'monthly':
    default: return n;
  }
}

function daysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(isoDate + 'T00:00:00');
  return Math.round((due - today) / 86400000);
}

function formatDateNice(isoDate) {
  const d = isoDate.length <= 10 ? new Date(isoDate + 'T00:00:00') : new Date(isoDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dueBadge(days) {
  if (days < 0) return { cls: 'badge-overdue', label: `⚠️ ${Math.abs(days)}d overdue` };
  if (days === 0) return { cls: 'badge-soon', label: '🔔 Due today' };
  if (days <= 3) return { cls: 'badge-soon', label: `🔔 Due in ${days}d` };
  if (days <= 7) return { cls: 'badge-week', label: `📅 Due in ${days}d` };
  return { cls: 'badge-later', label: `📅 Due in ${days}d` };
}

/* ---- Theme + calm mode (shared across every page) ---- */
(function initPreferences() {
  const theme = Store.get('dashboard_theme', 'light');
  document.documentElement.setAttribute('data-theme', theme);

  const calm = Store.get('dashboard_calm', false);
  if (calm) document.body.classList.add('calm-mode');

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.toggle('calm-mode', calm);

    const themeBtn = document.getElementById('theme-toggle');
    const calmBtn = document.getElementById('calm-toggle');

    function syncThemeIcon() {
      const t = document.documentElement.getAttribute('data-theme');
      if (themeBtn) themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    }
    function syncCalmIcon() {
      if (calmBtn) calmBtn.setAttribute('aria-pressed', document.body.classList.contains('calm-mode'));
    }

    syncThemeIcon();
    syncCalmIcon();

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        Store.set('dashboard_theme', next);
        syncThemeIcon();
      });
    }

    if (calmBtn) {
      calmBtn.addEventListener('click', () => {
        const isCalm = document.body.classList.toggle('calm-mode');
        Store.set('dashboard_calm', isCalm);
        syncCalmIcon();
        toast(isCalm ? 'Calm mode on — motion reduced 🎐' : 'Calm mode off');
      });
    }

    // Highlight active nav link
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      if (a.getAttribute('href') === here) a.classList.add('active');
    });
  });
})();
