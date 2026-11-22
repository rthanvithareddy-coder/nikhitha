// js/main.js
// Handles global UI helpers: sidebar toggle, theme, dashboard health score, latest prediction, and home page latency chart.

document.addEventListener('DOMContentLoaded', async () => {
  const body = document.body;
  const sidebar = document.querySelector('.sidebar');

  // Mobile menu button
  if (!document.querySelector('.mobile-menu-btn')) {
    const btn = document.createElement('button');
    btn.className = 'mobile-menu-btn';
    btn.textContent = 'Menu';
    btn.addEventListener('click', () => sidebar?.classList.toggle('open'));
    document.body.appendChild(btn);
  }

  // Theme handling (persisted)
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    const saved = localStorage.getItem('theme') || 'dark';
    body.classList.toggle('dark-theme', saved === 'dark');
    body.classList.toggle('light-theme', saved === 'light');
    themeSelect.value = saved;
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      body.classList.toggle('dark-theme', theme === 'dark');
      body.classList.toggle('light-theme', theme === 'light');
      localStorage.setItem('theme', theme);
    });
  }

  // Dashboard-only widgets
  const healthScoreElem = document.getElementById('health-score');
  const latestPredElem = document.getElementById('latest-prediction');
  if (healthScoreElem) {
    const data = await window.loadNetworkData();
    if (data.length) {
      const avgSignal = data.reduce((sum, d) => sum + d.signal_strength, 0) / data.length;
      healthScoreElem.textContent = avgSignal.toFixed(1) + '%';
    }
  }
  if (latestPredElem) {
    const stored = localStorage.getItem('predictionData');
    if (stored) {
      try {
        const pred = JSON.parse(stored);
        latestPredElem.textContent = `${pred.time} – ${pred.reason}`;
      } catch (_) {
        localStorage.removeItem('predictionData');
      }
    }
  }

  // Home page latency chart only
  if (!document.getElementById('health-score')) return;
  const latencyCanvas = document.getElementById('latencyChart');
  if (latencyCanvas && typeof Chart !== 'undefined') {
    const data = await window.loadNetworkData();
    if (!data.length) return;
    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    const latencyVals = data.map(d => d.latency);
    const ctx = latencyCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Latency (ms)',
          data: latencyVals,
          borderColor: '#ffb84d',
          backgroundColor: 'rgba(255,184,77,0.2)',
          fill: true,
          tension: 0.3,
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  }
});
