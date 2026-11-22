// js/dataset.js
// CSV loader, validation, preprocessing, and K‑Nearest Neighbor classifier

// Expected columns in the CSV file
const EXPECTED_HEADERS = [
  'id','signal_strength','latency','packet_loss','jitter','download_speed',
  'upload_speed','network_type','network_load','connection_status','failure_risk'
];

// Load raw CSV and return an array of objects (validated values)
window.loadNetworkData = async function() {
  try {
    const response = await fetch('data/network_data.csv');
    if (!response.ok) throw new Error('Failed to load CSV');
    let text = await response.text();
    // Remove UTF‑8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const lines = text.trim().split('\n');
    const header = lines[0].split(',');
    // Validate header
    const missing = EXPECTED_HEADERS.filter(h => !header.includes(h));
    if (missing.length) throw new Error('Missing columns: ' + missing.join(','));
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const rawCols = lines[i].split(',');
      if (rawCols.length !== header.length) continue; // skip malformed rows
      const rec = {};
      for (let j = 0; j < header.length; j++) {
        const key = header[j];
        let val = rawCols[j];
        // Detect missing values (empty string)
        if (val === '' || val === undefined) { rec = null; break; }
        // Numeric conversion for known fields
        if (['signal_strength','latency','packet_loss','jitter','download_speed','upload_speed','network_load'].includes(key)) {
          const num = parseFloat(val);
          if (isNaN(num)) { rec = null; break; }
          rec[key] = num;
        } else {
          rec[key] = val;
        }
      }
      if (rec) records.push(rec);
    }
    return records;
  } catch (e) {
    console.error('loadNetworkData error:', e);
    return [];
  }
};

// Prepare K‑NN model – normalize numeric features and encode network_type
window.prepareKNN = async function() {
  const raw = await window.loadNetworkData();
  if (!raw.length) { console.warn('No data for KNN'); return; }

  // Encode network_type to integer
  const typeSet = Array.from(new Set(raw.map(r => r.network_type)));
  const typeMap = {};
  typeSet.forEach((t,i) => { typeMap[t] = i; });

  const numericFeatures = ['signal_strength','latency','packet_loss','jitter','download_speed','upload_speed','network_load'];
  const mins = {};
  const maxs = {};
  numericFeatures.forEach(f => {
    const vals = raw.map(r => r[f]);
    mins[f] = Math.min(...vals);
    maxs[f] = Math.max(...vals);
  });

  // Normalise records and attach encoded type
  const normalized = raw.map(r => {
    const vec = numericFeatures.map(f => {
      const min = mins[f];
      const max = maxs[f];
      return (r[f] - min) / (max - min || 1); // avoid divide by zero
    });
    // Append encoded network_type as an additional dimension
    vec.push(typeMap[r.network_type]);
    return {features: vec, risk: r.failure_risk};
  });

  window.knnModel = {data: normalized, k: 5, mins, maxs, typeMap, numericFeatures};
};

// Euclidean distance between two feature vectors (same length)
function euclidean(a,b){
  let sum = 0;
  for(let i=0;i<a.length;i++){
    const d = a[i]-b[i];
    sum += d*d;
  }
  return Math.sqrt(sum);
}

// Predict risk for a new sample (object with same fields as CSV, network_type string)
window.predictRisk = function(sample){
  if (!window.knnModel) { console.warn('KNN model not prepared'); return null; }
  const {data,k,mins,maxs,typeMap,numericFeatures} = window.knnModel;
  // Build feature vector for the sample using same normalisation
  const vec = numericFeatures.map(f => {
    const min = mins[f];
    const max = maxs[f];
    const val = parseFloat(sample[f]);
    return (val - min) / (max - min || 1);
  });
  vec.push(typeMap[sample.network_type] ?? 0);

  // Compute distances to all records
  const distances = data.map(d => ({risk:d.risk, dist: euclidean(vec, d.features)}));
  distances.sort((a,b)=>a.dist-b.dist);
  const nearest = distances.slice(0,k);
  // Majority voting
  const vote = {};
  nearest.forEach(n=>{ vote[n.risk] = (vote[n.risk]||0)+1; });
  const sorted = Object.entries(vote).sort((a,b)=>b[1]-a[1]);
  return sorted[0][0];
};

// Initialise the model right after loading so other pages can use it
window.prepareKNN();
