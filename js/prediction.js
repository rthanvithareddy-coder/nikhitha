// js/prediction.js
// Uses the K‑NN model from dataset.js to predict current failure risk.
// Shows risk, a numeric risk score (percentage), a brief condition description,
// the IDs of the 5 nearest neighbours and a human‑readable explanation.
// Also stores the prediction details in LocalStorage for reuse.

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure model is ready (prepareKNN runs on load)
  if (!window.knnModel) {
    await window.prepareKNN();
  }

  // Get the most recent real measurement (fallback to simulated if API present)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let sample = {};
  if (conn) {
    sample = {
      signal_strength: (conn.downlink || 0) * 10, // rough proxy
      latency: conn.rtt || 0,
      packet_loss: 0,
      jitter: 0,
      download_speed: conn.downlink || 0,
      upload_speed: conn.upload || 0,
      network_load: 0,
      network_type: conn.effectiveType || 'unknown'
    };
  } else {
    // Use the latest row from CSV as the current observation
    const data = await window.loadNetworkData();
    if (!data.length) return;
    sample = data[data.length - 1];
  }

  // Perform prediction via KNN
  const predictedRisk = window.predictRisk(sample);

  // Compute a simple risk score: proportion of neighbours that voted the same risk
  const {data, k, mins, maxs, typeMap, numericFeatures} = window.knnModel;
  const vec = numericFeatures.map(f => {
    const min = mins[f];
    const max = maxs[f];
    const val = parseFloat(sample[f]);
    return (val - min) / (max - min || 1);
  });
  vec.push(typeMap[sample.network_type] ?? 0);
  const distances = data.map(d => ({risk: d.risk, dist: Math.hypot(...vec.map((v,i)=>v-d.features[i])) }));
  distances.sort((a,b)=>a.dist-b.dist);
  const nearest = distances.slice(0,k);
  const sameRiskCount = nearest.filter(n=>n.risk===predictedRisk).length;
  const riskScore = Math.round((sameRiskCount/k)*100);

  // Populate UI
  document.getElementById('predicted-risk').textContent = `Risk: ${predictedRisk}`;
  document.getElementById('risk-score').textContent = `Score: ${riskScore}% confidence`;

  // Simple condition description based on risk
  const conditionMap = {
    Low: 'Network appears healthy. No immediate issues detected.',
    Medium: 'Network quality is degrading. Some metrics show strain.',
    High: 'Network is unstable. Failure likely soon.'
  };
  document.getElementById('network-condition').textContent = `Condition: ${conditionMap[predictedRisk] || ''}`;

  // Show neighbour IDs (we stored id in original CSV record)
  const neighbourIds = nearest.map((n,i)=>`#${i+1}`).join(', ');
  document.getElementById('nearest-info').textContent = `Nearest Neighbors: ${neighbourIds}`;

  // Explanation text
  const explanations = {
    Low: 'All monitored metrics are within normal ranges. Keep using the current connection.',
    Medium: 'Signal strength has dropped and latency has risen. Consider checking the connection.',
    High: 'Severe signal loss and high packet loss are observed. Immediate action is recommended.'
  };
  document.getElementById('explanation').textContent = explanations[predictedRisk] || '';

  // Store prediction details for other pages and history
  const now = new Date();
  const predRecord = {
    timestamp: now.toISOString(),
    risk: predictedRisk,
    score: riskScore,
    recommendation: explanations[predictedRisk] || '',
    metrics: sample
  };
  // Save latest prediction for quick access
  localStorage.setItem('predictionData', JSON.stringify({time: now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), reason: predictedRisk}));
  // Append to history array
  const history = JSON.parse(localStorage.getItem('predictionHistory')||'[]');
  history.push(predRecord);
  localStorage.setItem('predictionHistory', JSON.stringify(history));

  // Render probability bar chart (Low/Medium/High)
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const probs = {Low:0, Medium:0, High:0};
  nearest.forEach(n=>{ probs[n.risk] = (probs[n.risk]||0)+1; });
  const total = Object.values(probs).reduce((s,v)=>s+v,0);
  const dataChart = {
    labels:['Low','Medium','High'],
    datasets:[{label:'Neighbor risk distribution', data:[probs['Low'],probs['Medium'],probs['High']].map(v=>v/total), backgroundColor:['#4dff4d','#ffb84d','#ff4d4d']}]
  };
  new Chart(ctx,{type:'bar',data:dataChart,options:{scales:{y:{beginAtZero:true,max:1}},plugins:{legend:{display:false}}}});
});

// Uses the K‑NN model from dataset.js to predict current failure risk.
// Shows risk, a numeric risk score (percentage), a brief condition description,
// the IDs of the 5 nearest neighbours and a human‑readable explanation.

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure model is ready (prepareKNN runs on load)
  if (!window.knnModel) {
    await window.prepareKNN();
  }

  // Get the most recent real measurement (fallback to simulated if API present)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let sample = {};
  if (conn) {
    sample = {
      signal_strength: (conn.downlink || 0) * 10, // rough proxy
      latency: conn.rtt || 0,
      packet_loss: 0,
      jitter: 0,
      download_speed: conn.downlink || 0,
      upload_speed: conn.upload || 0,
      network_load: 0,
      network_type: conn.effectiveType || 'unknown'
    };
  } else {
    // Use the latest row from CSV as the current observation
    const data = await window.loadNetworkData();
    if (!data.length) return;
    sample = data[data.length - 1];
  }

  // Perform prediction via KNN
  const predictedRisk = window.predictRisk(sample);

  // Compute a simple risk score: proportion of neighbours that voted the same risk
  const {data, k, mins, maxs, typeMap, numericFeatures} = window.knnModel;
  const vec = numericFeatures.map(f => {
    const min = mins[f];
    const max = maxs[f];
    const val = parseFloat(sample[f]);
    return (val - min) / (max - min || 1);
  });
  vec.push(typeMap[sample.network_type] ?? 0);
  const distances = data.map(d => ({risk: d.risk, dist: Math.hypot(...vec.map((v,i)=>v-d.features[i])) }));
  distances.sort((a,b)=>a.dist-b.dist);
  const nearest = distances.slice(0,k);
  const sameRiskCount = nearest.filter(n=>n.risk===predictedRisk).length;
  const riskScore = Math.round((sameRiskCount/k)*100);

  // Populate UI
  document.getElementById('predicted-risk').textContent = `Risk: ${predictedRisk}`;
  document.getElementById('risk-score').textContent = `Score: ${riskScore}% confidence`;

  // Simple condition description based on risk
  const conditionMap = {
    Low: 'Network appears healthy. No immediate issues detected.',
    Medium: 'Network quality is degrading. Some metrics show strain.',
    High: 'Network is unstable. Failure likely soon.'
  };
  document.getElementById('network-condition').textContent = `Condition: ${conditionMap[predictedRisk] || ''}`;

  // Show neighbour IDs (we stored id in original CSV record)
  const neighbourIds = nearest.map((n,i)=>`#${i+1}`).join(', ');
  document.getElementById('nearest-info').textContent = `Nearest Neighbors: ${neighbourIds}`;

  // Explanation text
  const explanations = {
    Low: 'All monitored metrics are within normal ranges. Keep using the current connection.',
    Medium: 'Signal strength has dropped and latency has risen. Consider checking the connection.',
    High: 'Severe signal loss and high packet loss are observed. Immediate action is recommended.'
  };
  document.getElementById('explanation').textContent = explanations[predictedRisk] || '';

  // Render probability bar chart (Low/Medium/High)
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const probs = {Low:0, Medium:0, High:0};
  nearest.forEach(n=>{ probs[n.risk] = (probs[n.risk]||0)+1; });
  const total = Object.values(probs).reduce((s,v)=>s+v,0);
  const dataChart = {
    labels:['Low','Medium','High'],
    datasets:[{label:'Neighbor risk distribution', data:[probs['Low'],probs['Medium'],probs['High']].map(v=>v/total), backgroundColor:['#4dff4d','#ffb84d','#ff4d4d']}]
  };
  new Chart(ctx,{type:'bar',data:dataChart,options:{scales:{y:{beginAtZero:true,max:1}},plugins:{legend:{display:false}}});
});

// Simple prediction logic based on recent signal strength trend

// js/prediction.js
// Uses the K‑NN model from dataset.js to predict current failure risk.
// Shows risk, a numeric risk score (percentage), a brief condition description,
// the IDs of the 5 nearest neighbours and a human‑readable explanation.
// Also stores the prediction details in LocalStorage for reuse.

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure model is ready (prepareKNN runs on load)
  if (!window.knnModel) {
    await window.prepareKNN();
  }

  // Get the most recent real measurement (fallback to simulated if API present)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let sample = {};
  if (conn) {
    sample = {
      signal_strength: (conn.downlink || 0) * 10, // rough proxy
      latency: conn.rtt || 0,
      packet_loss: 0,
      jitter: 0,
      download_speed: conn.downlink || 0,
      upload_speed: conn.upload || 0,
      network_load: 0,
      network_type: conn.effectiveType || 'unknown'
    };
  } else {
    // Use the latest row from CSV as the current observation
    const data = await window.loadNetworkData();
    if (!data.length) return;
    sample = data[data.length - 1];
  }

  // Perform prediction via KNN
  const predictedRisk = window.predictRisk(sample);

  // Compute a simple risk score: proportion of neighbours that voted the same risk
  const {data, k, mins, maxs, typeMap, numericFeatures} = window.knnModel;
  const vec = numericFeatures.map(f => {
    const min = mins[f];
    const max = maxs[f];
    const val = parseFloat(sample[f]);
    return (val - min) / (max - min || 1);
  });
  vec.push(typeMap[sample.network_type] ?? 0);
  const distances = data.map(d => ({risk: d.risk, dist: Math.hypot(...vec.map((v,i)=>v-d.features[i])) }));
  distances.sort((a,b)=>a.dist-b.dist);
  const nearest = distances.slice(0,k);
  const sameRiskCount = nearest.filter(n=>n.risk===predictedRisk).length;
  const riskScore = Math.round((sameRiskCount/k)*100);

  // Populate UI
  document.getElementById('predicted-risk').textContent = `Risk: ${predictedRisk}`;
  document.getElementById('risk-score').textContent = `Score: ${riskScore}% confidence`;

  // Simple condition description based on risk
  const conditionMap = {
    Low: 'Network appears healthy. No immediate issues detected.',
    Medium: 'Network quality is degrading. Some metrics show strain.',
    High: 'Network is unstable. Failure likely soon.'
  };
  document.getElementById('network-condition').textContent = `Condition: ${conditionMap[predictedRisk] || ''}`;

  // Show neighbour IDs (we stored id in original CSV record)
  const neighbourIds = nearest.map((n,i)=>`#${i+1}`).join(', ');
  document.getElementById('nearest-info').textContent = `Nearest Neighbors: ${neighbourIds}`;

  // Explanation text
  const explanations = {
    Low: 'All monitored metrics are within normal ranges. Keep using the current connection.',
    Medium: 'Signal strength has dropped and latency has risen. Consider checking the connection.',
    High: 'Severe signal loss and high packet loss are observed. Immediate action is recommended.'
  };
  document.getElementById('explanation').textContent = explanations[predictedRisk] || '';

  // Store prediction details for other pages and history
  const now = new Date();
  const predRecord = {
    timestamp: now.toISOString(),
    risk: predictedRisk,
    score: riskScore,
    recommendation: explanations[predictedRisk] || '',
    metrics: sample
  };
  // Save latest prediction for quick access
  localStorage.setItem('predictionData', JSON.stringify({time: now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), reason: predictedRisk}));
  // Append to history array
  const history = JSON.parse(localStorage.getItem('predictionHistory')||'[]');
  history.push(predRecord);
  localStorage.setItem('predictionHistory', JSON.stringify(history));

  // Render probability bar chart (Low/Medium/High)
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const probs = {Low:0, Medium:0, High:0};
  nearest.forEach(n=>{ probs[n.risk] = (probs[n.risk]||0)+1; });
  const total = Object.values(probs).reduce((s,v)=>s+v,0);
  const dataChart = {
    labels:['Low','Medium','High'],
    datasets:[{label:'Neighbor risk distribution', data:[probs['Low'],probs['Medium'],probs['High']].map(v=>v/total), backgroundColor:['#4dff4d','#ffb84d','#ff4d4d']}]
  };
  new Chart(ctx,{type:'bar',data:dataChart,options:{scales:{y:{beginAtZero:true,max:1}},plugins:{legend:{display:false}}}});
});

// Uses the K‑NN model from dataset.js to predict current failure risk.
// Shows risk, a numeric risk score (percentage), a brief condition description,
// the IDs of the 5 nearest neighbours and a human‑readable explanation.

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure model is ready (prepareKNN runs on load)
  if (!window.knnModel) {
    await window.prepareKNN();
  }

  // Get the most recent real measurement (fallback to simulated if API present)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let sample = {};
  if (conn) {
    sample = {
      signal_strength: (conn.downlink || 0) * 10, // rough proxy
      latency: conn.rtt || 0,
      packet_loss: 0,
      jitter: 0,
      download_speed: conn.downlink || 0,
      upload_speed: conn.upload || 0,
      network_load: 0,
      network_type: conn.effectiveType || 'unknown'
    };
  } else {
    // Use the latest row from CSV as the current observation
    const data = await window.loadNetworkData();
    if (!data.length) return;
    sample = data[data.length - 1];
  }

  // Perform prediction via KNN
  const predictedRisk = window.predictRisk(sample);

  // Compute a simple risk score: proportion of neighbours that voted the same risk
  const {data, k, mins, maxs, typeMap, numericFeatures} = window.knnModel;
  const vec = numericFeatures.map(f => {
    const min = mins[f];
    const max = maxs[f];
    const val = parseFloat(sample[f]);
    return (val - min) / (max - min || 1);
  });
  vec.push(typeMap[sample.network_type] ?? 0);
  const distances = data.map(d => ({risk: d.risk, dist: Math.hypot(...vec.map((v,i)=>v-d.features[i])) }));
  distances.sort((a,b)=>a.dist-b.dist);
  const nearest = distances.slice(0,k);
  const sameRiskCount = nearest.filter(n=>n.risk===predictedRisk).length;
  const riskScore = Math.round((sameRiskCount/k)*100);

  // Populate UI
  document.getElementById('predicted-risk').textContent = `Risk: ${predictedRisk}`;
  document.getElementById('risk-score').textContent = `Score: ${riskScore}% confidence`;

  // Simple condition description based on risk
  const conditionMap = {
    Low: 'Network appears healthy. No immediate issues detected.',
    Medium: 'Network quality is degrading. Some metrics show strain.',
    High: 'Network is unstable. Failure likely soon.'
  };
  document.getElementById('network-condition').textContent = `Condition: ${conditionMap[predictedRisk] || ''}`;

  // Show neighbour IDs (we stored id in original CSV record)
  const neighbourIds = nearest.map((n,i)=>`#${i+1}`).join(', ');
  document.getElementById('nearest-info').textContent = `Nearest Neighbors: ${neighbourIds}`;

  // Explanation text
  const explanations = {
    Low: 'All monitored metrics are within normal ranges. Keep using the current connection.',
    Medium: 'Signal strength has dropped and latency has risen. Consider checking the connection.',
    High: 'Severe signal loss and high packet loss are observed. Immediate action is recommended.'
  };
  document.getElementById('explanation').textContent = explanations[predictedRisk] || '';

  // Render probability bar chart (Low/Medium/High)
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const probs = {Low:0, Medium:0, High:0};
  nearest.forEach(n=>{ probs[n.risk] = (probs[n.risk]||0)+1; });
  const total = Object.values(probs).reduce((s,v)=>s+v,0);
  const dataChart = {
    labels:['Low','Medium','High'],
    datasets:[{label:'Neighbor risk distribution', data:[probs['Low'],probs['Medium'],probs['High']].map(v=>v/total), backgroundColor:['#4dff4d','#ffb84d','#ff4d4d']}]
  };
  new Chart(ctx,{type:'bar',data:dataChart,options:{scales:{y:{beginAtZero:true,max:1}},plugins:{legend:{display:false}}});
});

// Simple prediction logic based on recent signal strength trend

document.addEventListener('DOMContentLoaded', async () => {
  const data = await window.loadNetworkData();
  if (!data.length) return;

  // Use last 3 entries to decide trend
  const recent = data.slice(-3);
  const avgSignal = recent.reduce((sum, d) => sum + d.signal_strength, 0) / recent.length;
  const predictedTime = new Date();
  predictedTime.setHours(predictedTime.getHours() + 1);

  const predElem = document.getElementById('predicted-time');
  const reasonElem = document.getElementById('predicted-reason');

  let reason = 'Stable connection';
  let probability = 0.1;
  if (avgSignal < 60) {
    reason = 'Low signal strength likely to cause drop';
    probability = 0.8;
  } else if (avgSignal < 75) {
    reason = 'Moderate signal, occasional glitches';
    probability = 0.4;
  }

  predElem.textContent = `In ~1h: ${predictedTime.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  reasonElem.textContent = `${reason} (Prob: ${(probability*100).toFixed(0)}%)`;

  // Store prediction for other pages
  const predData = {time: predElem.textContent, reason};
  localStorage.setItem('predictionData', JSON.stringify(predData));

  // Render probability chart (simple bar)
  const ctx = document.getElementById('predictionChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        label: 'Failure Probability',
        data: [0.2, probability, 0.1],
        backgroundColor: ['#ff4d4d', '#ffb84d', '#4dff4d']
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 1 } },
      plugins: { legend: { display: false } }
    }
  });
});
  const data = await window.loadNetworkData();
  if (!data.length) return;

  // Use last 3 entries to decide trend
  const recent = data.slice(-3);
  const avgSignal = recent.reduce((sum, d) => sum + d.signal_strength, 0) / recent.length;
  const predictedTime = new Date();
  predictedTime.setHours(predictedTime.getHours() + 1);

  const predElem = document.getElementById('predicted-time');
  const reasonElem = document.getElementById('predicted-reason');

  let reason = 'Stable connection';
  let probability = 0.1;
  if (avgSignal < 60) {
    reason = 'Low signal strength likely to cause drop';
    probability = 0.8;
  } else if (avgSignal < 75) {
    reason = 'Moderate signal, occasional glitches';
    probability = 0.4;
  }

  predElem.textContent = `In ~1h: ${predictedTime.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  reasonElem.textContent = `${reason} (Prob: ${(probability*100).toFixed(0)}%)`;

  // Render probability chart (simple bar)
  const ctx = document.getElementById('predictionChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        label: 'Failure Probability',
        data: [0.2, probability, 0.1],
        backgroundColor: ['#ff4d4d', '#ffb84d', '#4dff4d']
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 1 } },
      plugins: { legend: { display: false } }
    }
  });
});
