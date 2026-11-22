// js/history.js
// Load data, render past failures chart and event log table

document.addEventListener('DOMContentLoaded', async () => {
  const data = await window.loadNetworkData();
  if (!data.length) return;

  // Past failures chart – for demo, treat latency > 55 as a failure event
  const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
  const failures = data.map(d => d.latency > 55 ? 1 : 0);

  const ctx = document.getElementById('historyChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Failure Events',
        data: failures,
        backgroundColor: '#ff4d4d'
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 1, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } }
    }
  });

  // Populate event log table with entries where failure detected (latency > 55)
  const tbody = document.querySelector('#event-table tbody');
  data.forEach(d => {
    if (d.latency > 55) {
      const tr = document.createElement('tr');
      const timeTd = document.createElement('td');
      timeTd.textContent = d.timestamp;
      const eventTd = document.createElement('td');
      eventTd.textContent = 'High latency detected';
      const detailTd = document.createElement('td');
      detailTd.textContent = `Latency ${d.latency}ms`;
      tr.appendChild(timeTd);
      tr.appendChild(eventTd);
      tr.appendChild(detailTd);
      tbody.appendChild(tr);
    }
  });
});
