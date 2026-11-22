// js/recovery.js
// Smart Recovery Control Center – uses latest K‑NN prediction to drive UI.
// Shows animated stages: Analysis → Diagnosis → Risk Assessment → Recommendation → Verification.

document.addEventListener('DOMContentLoaded', async () => {
  const stageAnalysis = document.getElementById('stage-analysis');
  const stageDiagnosis = document.getElementById('stage-diagnosis');
  const stageAssessment = document.getElementById('stage-assessment');
  const stageRecommendation = document.getElementById('stage-recommendation');
  const stageVerification = document.getElementById('stage-verification');
  const recommendationEl = document.getElementById('recommendation-text');
  const verificationEl = document.getElementById('verification-status');

  // Utility to add a simple fade‑in class (defined in CSS via animation)
  const activate = (el, delay) => setTimeout(() => el.classList.add('active'), delay);

  // Step 1 – Analysis (gather metrics). We'll reuse the latest sample from dataset.
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let sample = {};
  if (conn) {
    sample = {
      signal_strength: (conn.downlink || 0) * 10,
      latency: conn.rtt || 0,
      packet_loss: 0,
      jitter: 0,
      download_speed: conn.downlink || 0,
      upload_speed: conn.upload || 0,
      network_load: 0,
      network_type: conn.effectiveType || 'unknown'
    };
  } else {
    const data = await window.loadNetworkData();
    sample = data[data.length - 1] || {};
  }

  // Show analysis info (quick summary inside the card)
  stageAnalysis.querySelector('p').textContent = `Signal ${sample.signal_strength}% | Latency ${sample.latency} ms`;

  // Activate stages sequentially (1 s each for demo purposes)
  activate(stageAnalysis, 0);
  activate(stageDiagnosis, 1200);
  activate(stageAssessment, 2400);
  activate(stageRecommendation, 3600);
  activate(stageVerification, 4800);

  // Step 2 – Diagnosis (run K‑NN prediction)
  const predictedRisk = window.predictRisk(sample);
  stageDiagnosis.querySelector('p').textContent = `Predicted risk: ${predictedRisk || 'unknown'}`;

  // Step 3 – Risk Assessment (determine numeric confidence)
  const {data, k, mins, maxs, typeMap, numericFeatures} = window.knnModel || {};
  let confidence = 0;
  if (predictedRisk && data) {
    const vec = numericFeatures.map(f => {
      const min = mins[f];
      const max = maxs[f];
      const val = parseFloat(sample[f]);
      return (val - min) / (max - min || 1);
    });
    vec.push(typeMap[sample.network_type] ?? 0);
    const distances = data.map(d => ({risk:d.risk, dist: Math.hypot(...vec.map((v,i)=>v-d.features[i])) }));
    distances.sort((a,b)=>a.dist-b.dist);
    const nearest = distances.slice(0,k);
    const same = nearest.filter(n=>n.risk===predictedRisk).length;
    confidence = Math.round((same/k)*100);
  }
  stageAssessment.querySelector('p').textContent = `Confidence: ${confidence}%`;

  // Step 4 – Recommendation based on risk
  const recMap = {
    Low: 'Network health is good – no action required.',
    Medium: 'Connection quality is degrading – re‑check the link or consider a stronger network.',
    High: 'Network is unstable – manually reconnect or move to a location with better coverage.'
  };
  const recommendation = recMap[predictedRisk] || 'Unable to determine recommendation.';
  recommendationEl.textContent = recommendation;

  // Step 5 – Verification (simulated – we just state the recommendation was shown)
  verificationEl.textContent = `Displayed recommendation to user – please follow the advice.`;

  // Render a quick health radar chart (signal, latency, packet loss, load)
  const healthCanvas = document.getElementById('healthChart').getContext('2d');
  const radarData = {
    labels: ['Signal', 'Latency', 'Packet Loss', 'Load'],
    datasets: [{
      label: 'Current Health',
      data: [sample.signal_strength, sample.latency, sample.packet_loss*100, sample.network_load],
      backgroundColor: 'rgba(30,144,255,0.2)',
      borderColor: '#1e90ff',
      pointBackgroundColor: '#1e90ff'
    }]
  };
  new Chart(healthCanvas, {
    type: 'radar',
    data: radarData,
    options: {scale: {ticks: {beginAtZero:true}}}
  });
});

// Shows suggested recovery steps based on stored prediction data

document.addEventListener('DOMContentLoaded', () => {
  const stepsUl = document.getElementById('recovery-steps');
  if (!stepsUl) return;

  const pred = localStorage.getItem('predictionData');
  if (!pred) {
    stepsUl.innerHTML = '<li>No prediction data available. Visit Prediction page first.</li>';
    return;
  }
  const { reason } = JSON.parse(pred);

  const steps = [];
  if (reason.includes('Low signal')) {
    steps.push('Switch to a stronger Wi‑Fi network or move closer to the router.');
    steps.push('Restart the mobile data modem.');
    steps.push('Disable background apps that may drain signal.');
  } else if (reason.includes('Moderate')) {
    steps.push('Monitor signal for further drops.');
    steps.push('Consider resetting network settings.');
  } else {
    steps.push('No immediate action required.');
  }

  stepsUl.innerHTML = steps.map(s => `<li>${s}</li>`).join('');
});
