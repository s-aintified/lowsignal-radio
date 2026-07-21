function loadIncome() { return Store.get('dashboard_income', []); }
function saveIncome(list) { Store.set('dashboard_income', list); }
function loadBills() { return Store.get('dashboard_bills', []); }
function saveBills(list) { Store.set('dashboard_bills', list); }

function advanceDate(isoDate, frequency) {
  const d = new Date(isoDate + 'T00:00:00');
  switch (frequency) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    default: return isoDate;
  }
  return d.toISOString().slice(0, 10);
}

function renderSummary() {
  const income = loadIncome();
  const bills = loadBills();
  const totalIncome = income.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
  const totalBills = bills.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const leftover = totalIncome - totalBills;

  const grid = document.getElementById('summary-grid');
  grid.innerHTML = `
    <div class="stat-box"><div class="label">Monthly income</div><div class="value">${formatMoney(totalIncome)}</div></div>
    <div class="stat-box"><div class="label">Monthly bills</div><div class="value">${formatMoney(totalBills)}</div></div>
    <div class="stat-box ${leftover >= 0 ? 'positive' : 'negative'}"><div class="label">Leftover</div><div class="value">${formatMoney(leftover)}</div></div>
  `;
}

function renderReminderBanner() {
  const bills = loadBills();
  const soon = bills.filter(b => daysUntil(b.dueDate) <= 3);
  const slot = document.getElementById('reminder-banner-slot');
  if (soon.length === 0) {
    slot.innerHTML = '';
    return;
  }
  const names = soon
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .map(b => `${b.name} (${dueBadge(daysUntil(b.dueDate)).label.replace(/^\S+\s/, '')})`)
    .join(', ');
  slot.innerHTML = `<div class="reminder-banner">🔔 <strong>Coming up:</strong>&nbsp; ${names}</div>`;
}

function renderIncomeList() {
  const list = document.getElementById('income-list');
  const income = loadIncome();
  if (income.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="emoji">🌱</span>No income sources yet. Add one above whenever you're ready.</div>`;
    return;
  }
  list.innerHTML = '';
  income.forEach(item => {
    const row = document.createElement('div');
    row.className = 'row-item';
    row.innerHTML = `
      <div class="row-main">
        <div class="row-title">${escapeHtml(item.name)}</div>
        <div class="row-meta">${formatMoney(item.amount)} · ${item.frequency}</div>
      </div>
      <div class="row-actions">
        <button class="btn-danger btn-sm" data-id="${item.id}" data-action="delete-income">🗑️ Remove</button>
      </div>
    `;
    list.appendChild(row);
  });
}

function renderBillList() {
  const list = document.getElementById('bill-list');
  const bills = loadBills().slice().sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
  if (bills.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="emoji">🧾</span>No bills yet. Add one above and we'll track when it's due.</div>`;
    return;
  }
  list.innerHTML = '';
  bills.forEach(bill => {
    const days = daysUntil(bill.dueDate);
    const badge = dueBadge(days);
    const row = document.createElement('div');
    row.className = 'row-item';
    row.innerHTML = `
      <div class="row-main">
        <div class="row-title">${escapeHtml(bill.name)} <span class="badge ${badge.cls}">${badge.label}</span></div>
        <div class="row-meta">${formatMoney(bill.amount)} · ${bill.category} · repeats ${bill.frequency} · due ${formatDateNice(bill.dueDate)}</div>
      </div>
      <div class="row-actions">
        <button class="btn-mint btn-sm" data-id="${bill.id}" data-action="mark-paid">✅ Mark paid</button>
        <button class="btn-danger btn-sm" data-id="${bill.id}" data-action="delete-bill">🗑️</button>
      </div>
    `;
    list.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAll() {
  renderReminderBanner();
  renderSummary();
  renderIncomeList();
  renderBillList();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bill-due').valueAsDate = new Date();

  document.getElementById('income-form').addEventListener('submit', e => {
    e.preventDefault();
    const income = loadIncome();
    income.push({
      id: uid(),
      name: document.getElementById('income-name').value.trim(),
      amount: document.getElementById('income-amount').value,
      frequency: document.getElementById('income-frequency').value
    });
    saveIncome(income);
    e.target.reset();
    document.getElementById('income-form-wrap').open = false;
    toast('Income saved 💛');
    renderAll();
  });

  document.getElementById('bill-form').addEventListener('submit', e => {
    e.preventDefault();
    const bills = loadBills();
    bills.push({
      id: uid(),
      name: document.getElementById('bill-name').value.trim(),
      amount: document.getElementById('bill-amount').value,
      dueDate: document.getElementById('bill-due').value,
      frequency: document.getElementById('bill-frequency').value,
      category: document.getElementById('bill-category').value
    });
    saveBills(bills);
    e.target.reset();
    document.getElementById('bill-due').valueAsDate = new Date();
    document.getElementById('bill-form-wrap').open = false;
    toast('Bill saved 🧾');
    renderAll();
  });

  document.getElementById('income-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-income"]');
    if (!btn) return;
    const id = btn.dataset.id;
    saveIncome(loadIncome().filter(i => i.id !== id));
    toast('Income removed');
    renderAll();
  });

  document.getElementById('bill-list').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'delete-bill') {
      saveBills(loadBills().filter(b => b.id !== id));
      toast('Bill removed');
      renderAll();
    } else if (btn.dataset.action === 'mark-paid') {
      const bills = loadBills();
      const bill = bills.find(b => b.id === id);
      if (bill) {
        if (bill.frequency === 'one-time') {
          saveBills(bills.filter(b => b.id !== id));
          toast(`${bill.name} paid & cleared ✨`);
        } else {
          bill.dueDate = advanceDate(bill.dueDate, bill.frequency);
          saveBills(bills);
          toast(`${bill.name} marked paid — next due ${formatDateNice(bill.dueDate)}`);
        }
        renderAll();
      }
    }
  });

  renderAll();
});
