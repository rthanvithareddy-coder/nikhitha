// js/settings.js
// Handles Settings page interactions: refresh interval, theme (delegated to main.js), and CSV export.

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('refresh-interval');
  const exportBtn = document.getElementById('export-btn');

  // Initialize refresh interval from localStorage
  const savedInterval = localStorage.getItem('refreshInterval') || '5';
  intervalInput.value = savedInterval;

  // When user changes interval, store it
  intervalInput.addEventListener('change', (e) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    intervalInput.value = val;
    localStorage.setItem('refreshInterval', String(val));
  });

  // Export CSV data
  exportBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('data/network_data.csv');
      if (!response.ok) throw new Error('Failed to fetch CSV');
      const csvText = await response.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'network_data_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
      alert('Unable to export data.');
    }
  });
});
