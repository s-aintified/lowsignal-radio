const sheetURL = 'https://docs.google.com/spreadsheets/d/1ycfipQTU9ffFt-wwjnNjezL6XSO0eMSmaReiZh-I7VQ/gviz/tq?tqx=out:json';

fetch(sheetURL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;
    const feed = document.getElementById('rumor-feed');
    feed.innerHTML = '';
    rows.reverse().forEach(row => {
      const alias = row.c[1] ? row.c[1].v : 'Anonymous'; // skip timestamp
      const message = row.c[2] ? row.c[2].v : '';
      if (message.trim()) {
        const div = document.createElement('div');
        div.innerHTML = `<p><strong>🎙️ ${alias}</strong>: ${message}</p>`;
        feed.appendChild(div);
      }
    });
  });
