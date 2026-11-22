// js/monitor.js
// Handles real‑time (or simulated) network metrics, analysis and reset.

(() => {
  if (window.__linkPulseMonitorLoaded) return;
  window.__linkPulseMonitorLoaded = true;

  document.addEventListener('DOMContentLoaded', async () => {
    const simCheckbox = document.getElementById('sim-checkbox');
    const profileSelect = document.getElementById('profile-select');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetBtn = document.getElementById('reset-btn');

    if (!simCheckbox || !profileSelect || !analyzeBtn || !resetBtn) return;

    // Enable/disable profile selector based on simulation mode
    simCheckbox.addEventListener('change', () => {
      profileSelect.disabled = !simCheckbox.checked;
      if (!simCheckbox.checked) {
        // When leaving simulation, reload real data
        loadAndRender();
      }
    });

    // Pre‑defined simulated profiles
    const simulatedProfiles = {
      stable: {signal: 80, latency: 30, packet_loss: 0.01, jitter: 3, dl: 50, ul: 20, load: 20},
      degraded: {signal: 55, latency: 80, packet_loss: 0.12, jitter: 15, dl: 15, ul: 5, load: 55},
      unstable: {signal: 30, latency: 150, packet_loss: 0.45, jitter: 45, dl: 5, ul: 2, load: 80}
    };

    // Helper to render charts (signal, packet loss, latency)
    const renderCharts = (data, labelPrefix = '') => {
      const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
      const signalCanvas = document.getElementById('signalChart');
      const packetCanvas = document.getElementById('packetChart');
      const latencyCanvas = document.getElementById('latencyChart');

      if (typeof Chart === 'undefined') return;

      if (signalCanvas) {
        new Chart(signalCanvas.getContext('2d'), {
          type: 'line',
          data: {labels, datasets:[{label: `${labelPrefix}Signal (%)`, data: data.map(d=>d.signal_strength), borderColor:'#1e90ff', backgroundColor:'rgba(30,144,255,0.2)', fill:true, tension:0.3}]},
          options:{scales:{y:{min:0,max:100}},plugins:{legend:{display:false}}}
        });
      }
      if (packetCanvas) {
        new Chart(packetCanvas.getContext('2d'), {
          type: 'line',
          data: {labels, datasets:[{label: `${labelPrefix}Packet loss`, data: data.map(d=>d.packet_loss), borderColor:'#ff4d4d', backgroundColor:'rgba(255,77,77,0.2)', fill:true, tension:0.3}]},
          options:{scales:{y:{min:0,max:1}},plugins:{legend:{display:false}}}
        });
      }
      if (latencyCanvas) {
        new Chart(latencyCanvas.getContext('2d'), {
          type: 'line',
          data: {labels, datasets:[{label: `${labelPrefix}Latency (ms)`, data: data.map(d=>d.latency), borderColor:'#4dff4d', backgroundColor:'rgba(77,255,77,0.2)', fill:true, tension:0.3}]},
          options:{scales:{y:{beginAtZero:true}},plugins:{legend:{display:false}}}
        });
      }
    };

    const updateMetrics = (sample) => {
      if (!sample) return;
      const values = {
        'status-text': `Status: ${sample.connection_status || (simCheckbox.checked ? 'Simulated' : 'Live')}`,
        'signal-text': `Signal Strength: ${sample.signal_strength}%`,
        'latency-text': `Latency: ${sample.latency} ms`,
        'packet-text': `Packet Loss: ${sample.packet_loss * 100}%`,
        'jitter-text': `Jitter: ${sample.jitter} ms`,
        'dl-text': `Download Speed: ${sample.download_speed} Mbps`,
        'ul-text': `Upload Speed: ${sample.upload_speed} Mbps`,
        'load-text': `Network Load: ${sample.network_load}%`
      };
      Object.entries(values).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
      });
    };

    const loadAndRender = async () => {
      let data;
      if (simCheckbox.checked) {
        const profile = simulatedProfiles[profileSelect.value];
        const now = Date.now();
        data = Array.from({length:20}, (_,i)=>({
          timestamp: new Date(now - (20-i)*60000).toISOString(),
          signal_strength: profile.signal,
          latency: profile.latency,
          packet_loss: profile.packet_loss,
          jitter: profile.jitter,
          download_speed: profile.dl,
          upload_speed: profile.ul,
          network_type: 'Simulated',
          network_load: profile.load,
          connection_status: 'Simulated',
          failure_risk: 'Simulated'
        }));
      } else {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
          const now = new Date();
          data = [{
            timestamp: now.toISOString(),
            signal_strength: (conn.downlink || 0) * 10,
            latency: conn.rtt || 0,
            packet_loss: 0,
            jitter: 0,
            download_speed: conn.downlink || 0,
            upload_speed: conn.upload || 0,
            network_type: conn.effectiveType || 'unknown',
            network_load: 0,
            connection_status: conn.saveData ? 'Metered' : 'Unmetered',
            failure_risk: 'N/A'
          }];
        } else {
          data = await window.loadNetworkData();
        }
      }
      if (!data || !data.length) return;
      renderCharts(data);
      updateMetrics(data[data.length - 1]);
    };

    analyzeBtn.addEventListener('click', async () => {
      await loadAndRender();
      alert('Analysis complete. Values shown are ' + (simCheckbox.checked ? 'simulated' : 'real') + '.');
    });

    resetBtn.addEventListener('click', () => {
      simCheckbox.checked = false;
      profileSelect.disabled = true;
      loadAndRender();
    });

    loadAndRender();
  });
})();
