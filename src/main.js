import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACTS = {
  fact:    '0x054928acd6F6817e5AEFc532E8291290bC26140A',
  dispute: '0x59682430f784c97b8Afd0B440806317865d25EC9',
  rwa:     '0xB4014E2498F053D8e2E7223f15c072B5326d50a0',
  rep:     '0x8076B583367B2cDa75cB1D5e2F1b6773081398b8',
};

let readClient, writeClient, userAddress;
let currentTab = 'fact';

document.querySelector('#app').innerHTML = `
<div style="background:#0a0a0f;min-height:100vh;color:#e2e8f0;font-family:system-ui,sans-serif;">

  <!-- Header -->
  <div style="background:#111827;border-bottom:1px solid #1f2937;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:#7c3aed;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:white;">GL</div>
      <span style="font-size:18px;font-weight:600;">GenLayer AI Suite</span>
      <span style="background:#1e1b2e;color:#a78bfa;font-size:12px;padding:2px 10px;border-radius:20px;">Testnet</span>
    </div>
    <button id="connectBtn" onclick="window.connectWallet()" style="background:#7c3aed;color:white;padding:8px 20px;border-radius:8px;font-weight:600;cursor:pointer;border:none;font-size:14px;">Connect Wallet</button>
  </div>

  <!-- Tabs -->
  <div style="padding:24px 24px 0;display:flex;gap:8px;max-width:900px;margin:0 auto;flex-wrap:wrap;">
    <button class="tab" data-tab="fact" onclick="window.switchTab('fact',this)" style="background:#7c3aed;color:white;padding:8px 16px;border-radius:8px;font-weight:500;font-size:14px;cursor:pointer;border:none;">🔍 Fact Checker</button>
    <button class="tab" data-tab="dispute" onclick="window.switchTab('dispute',this)" style="background:#1e1b2e;color:#94a3b8;padding:8px 16px;border-radius:8px;font-weight:500;font-size:14px;cursor:pointer;border:none;">⚖️ Dispute Resolver</button>
    <button class="tab" data-tab="rwa" onclick="window.switchTab('rwa',this)" style="background:#1e1b2e;color:#94a3b8;padding:8px 16px;border-radius:8px;font-weight:500;font-size:14px;cursor:pointer;border:none;">🏢 RWA Due Diligence</button>
    <button class="tab" data-tab="rep" onclick="window.switchTab('rep',this)" style="background:#1e1b2e;color:#94a3b8;padding:8px 16px;border-radius:8px;font-weight:500;font-size:14px;cursor:pointer;border:none;">🛡️ Reputation Scorer</button>
  </div>

  <!-- Main content -->
  <div style="max-width:900px;margin:0 auto;padding:20px 24px;">

    <!-- Fact Checker -->
    <div id="tab-fact" style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
      <h2 style="font-size:20px;font-weight:600;margin:0 0 4px;">On-Chain Fact Checker</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Submit any claim and get a tamper-proof AI verdict stored permanently on-chain.</p>
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Claim to verify</label>
      <input id="fact-claim" placeholder="e.g. The Earth is the third planet from the Sun" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
      <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="window.submitClaim()" style="background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;border:none;">Submit Claim</button>
        <button onclick="window.readFact()" style="background:#1f2937;color:#94a3b8;padding:10px 20px;border-radius:8px;cursor:pointer;border:none;">Load Results</button>
      </div>
      <div id="fact-result"></div>
    </div>

    <!-- Dispute Resolver -->
    <div id="tab-dispute" style="display:none;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
      <h2 style="font-size:20px;font-weight:600;margin:0 0 4px;">AI Dispute Resolver</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Submit both sides. AI validators reach consensus on a binding ruling stored on-chain.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Dispute Title</label>
          <input id="d-title" placeholder="e.g. Freelancer Payment Dispute" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
        </div>
        <div>
          <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Party A Name</label>
          <input id="d-a-name" placeholder="e.g. Alice (Client)" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
        </div>
      </div>
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Party A Argument</label>
      <textarea id="d-a-arg" rows="2" placeholder="Party A's side..." style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;resize:vertical;margin-bottom:12px;"></textarea>
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Party B Name</label>
      <input id="d-b-name" placeholder="e.g. Bob (Freelancer)" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;margin-bottom:12px;" />
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Party B Argument</label>
      <textarea id="d-b-arg" rows="2" placeholder="Party B's side..." style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;resize:vertical;margin-bottom:16px;"></textarea>
      <button onclick="window.submitDispute()" style="background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;border:none;">Submit Dispute</button>
      <div id="dispute-result"></div>
    </div>

    <!-- RWA -->
    <div id="tab-rwa" style="display:none;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
      <h2 style="font-size:20px;font-weight:600;margin:0 0 4px;">RWA Due Diligence Agent</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">AI-powered tokenization evaluation. Get ELIGIBLE / CONDITIONAL / NOT_ELIGIBLE verdict.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Asset Type</label>
          <input id="rwa-type" placeholder="e.g. Real Estate" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
        </div>
        <div>
          <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Asset Name</label>
          <input id="rwa-name" placeholder="e.g. Manhattan Office Building" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
        </div>
        <div>
          <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Location</label>
          <input id="rwa-location" placeholder="e.g. New York City, USA" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
        </div>
        <div>
          <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Claimed Value (USD)</label>
          <input id="rwa-value" placeholder="e.g. 5000000" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;" />
        </div>
      </div>
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Description</label>
      <textarea id="rwa-desc" rows="2" placeholder="Describe the asset..." style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;resize:vertical;margin-bottom:12px;"></textarea>
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Documentation Summary</label>
      <textarea id="rwa-docs" rows="2" placeholder="Title deed, appraisals, permits..." style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;resize:vertical;margin-bottom:16px;"></textarea>
      <button onclick="window.submitRWA()" style="background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;border:none;">Analyze Asset</button>
      <div id="rwa-result"></div>
    </div>

    <!-- Reputation -->
    <div id="tab-rep" style="display:none;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
      <h2 style="font-size:20px;font-weight:600;margin:0 0 4px;">Wallet Reputation Scorer</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Trustless on-chain reputation scoring. TRUSTED / NEUTRAL / SUSPICIOUS.</p>
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">Wallet Address</label>
      <input id="rep-wallet" placeholder="0x..." style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;margin-bottom:12px;" />
      <label style="font-size:13px;color:#94a3b8;display:block;margin-bottom:6px;">On-chain Activity Description</label>
      <textarea id="rep-activity" rows="3" placeholder="Describe wallet's DeFi activity, governance participation, history..." style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:14px;outline:none;resize:vertical;margin-bottom:16px;"></textarea>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="window.submitReputation()" style="background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;border:none;">Score Address</button>
        <button onclick="window.loadRepScores()" style="background:#1f2937;color:#94a3b8;padding:10px 20px;border-radius:8px;cursor:pointer;border:none;">Load Results</button>
      </div>
      <div id="rep-result"></div>
    </div>

    <!-- Recent verdicts -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;margin-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;font-weight:600;margin:0;">Recent On-Chain Verdicts</h3>
        <button onclick="window.loadRecent()" style="background:#1f2937;color:#94a3b8;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer;border:none;">↺ Refresh</button>
      </div>
      <div id="recent-list"><p style="color:#4b5563;font-size:14px;margin:0;">Connect wallet to load...</p></div>
    </div>
  </div>
</div>
`;

// Helpers
function badge(v) {
  if (!v) return '';
  const val = v.toUpperCase();
  const green = ['TRUE','APPROVED','TRUSTED','ELIGIBLE'];
  const red = ['FALSE','REJECTED','SUSPICIOUS','NOT_ELIGIBLE'];
  const color = green.includes(val) ? '#4ade80' : red.includes(val) ? '#f87171' : '#d6d3d1';
  const bg = green.includes(val) ? '#052e16' : red.includes(val) ? '#450a0a' : '#1c1917';
  return `<span style="background:${bg};color:${color};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;">${val}</span>`;
}

function loading(id) {
  document.getElementById(id).innerHTML = `<div style="margin-top:16px;display:flex;align-items:center;gap:10px;color:#94a3b8;font-size:14px;"><div style="width:18px;height:18px;border:2px solid #374151;border-top-color:#7c3aed;border-radius:50%;animation:spin 0.8s linear infinite;"></div>Waiting for AI consensus on-chain...</div>`;
}

function result(id, html) {
  document.getElementById(id).innerHTML = `<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin-top:16px;">${html}</div>`;
}

function txSent(id, hash) {
  result(id, `✅ Transaction sent!<br><span style="color:#a78bfa;font-size:12px;word-break:break-all;">${hash}</span><br><span style="color:#94a3b8;font-size:13px;margin-top:8px;display:block;">Finalization takes ~1 minute. Use Load Results to check.</span>`);
}

// Add spin animation
const style = document.createElement('style');
style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(style);

// Tab switching
window.switchTab = function(tab, btn) {
  ['fact','dispute','rwa','rep'].forEach(t => {
    document.getElementById('tab-' + t).style.display = 'none';
  });
  document.querySelectorAll('.tab').forEach(b => {
    b.style.background = '#1e1b2e';
    b.style.color = '#94a3b8';
  });
  document.getElementById('tab-' + tab).style.display = 'block';
  btn.style.background = '#7c3aed';
  btn.style.color = 'white';
  currentTab = tab;
};

// Connect wallet
window.connectWallet = async function() {
  if (!window.ethereum) { alert('Please install MetaMask!'); return; }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];

    readClient = createClient({ chain: studionet });
    writeClient = createClient({
      chain: studionet,
      account: userAddress,
      provider: window.ethereum,
    });

    const btn = document.getElementById('connectBtn');
    btn.textContent = userAddress.slice(0,6) + '...' + userAddress.slice(-4);
    btn.style.background = '#052e16';
    btn.style.color = '#4ade80';

    loadRecent();
  } catch(e) { alert('Connection failed: ' + e.message); }
};

// Fact Checker
window.submitClaim = async function() {
  if (!writeClient) { alert('Connect wallet first!'); return; }
  const claim = document.getElementById('fact-claim').value.trim();
  if (!claim) { alert('Enter a claim!'); return; }
  loading('fact-result');
  try {
    await writeClient.connect('studionet');
    const hash = await writeClient.writeContract({
      address: CONTRACTS.fact,
      functionName: 'check_claim',
      args: [claim],
      value: 0n,
    });
    txSent('fact-result', hash);
  } catch(e) { result('fact-result', '❌ ' + e.message); }
};

window.readFact = async function() {
  if (!readClient) { readClient = createClient({ chain: studionet }); }
  loading('fact-result');
  try {
    const data = await readClient.readContract({
      address: CONTRACTS.fact,
      functionName: 'get_all_claims',
      args: [],
    });
    const claims = typeof data === 'string' ? JSON.parse(data) : data;
    let html = '<p style="font-size:13px;color:#94a3b8;margin:0 0 12px;">On-chain fact-check results:</p>';
    const vals = Object.values(claims);
    if (vals.length === 0) { html += '<p style="color:#4b5563;font-size:14px;">No claims yet.</p>'; }
    vals.slice(-5).forEach(item => {
      if (!item.claim) return;
      const r = item.result || {};
      html += `<div style="padding:10px;background:#1a1a2e;border-radius:6px;margin-bottom:8px;">
        <p style="font-size:13px;color:#e2e8f0;margin:0 0 6px;">"${item.claim}"</p>
        <div style="display:flex;align-items:center;gap:8px;">${badge(r.verdict)}<span style="font-size:12px;color:#94a3b8;">${r.explanation||''}</span></div>
      </div>`;
    });
    result('fact-result', html);
  } catch(e) { result('fact-result', '❌ ' + e.message); }
};

// Dispute Resolver
window.submitDispute = async function() {
  if (!writeClient) { alert('Connect wallet first!'); return; }
  const title = document.getElementById('d-title').value.trim();
  const aName = document.getElementById('d-a-name').value.trim();
  const aArg = document.getElementById('d-a-arg').value.trim();
  const bName = document.getElementById('d-b-name').value.trim();
  const bArg = document.getElementById('d-b-arg').value.trim();
  if (!title||!aName||!aArg||!bName||!bArg) { alert('Fill all fields!'); return; }
  loading('dispute-result');
  try {
    await writeClient.connect('studionet');
    const hash = await writeClient.writeContract({
      address: CONTRACTS.dispute,
      functionName: 'submit_dispute',
      args: [title, aName, aArg, bName, bArg],
      value: 0n,
    });
    txSent('dispute-result', hash);
  } catch(e) { result('dispute-result', '❌ ' + e.message); }
};

// RWA
window.submitRWA = async function() {
  if (!writeClient) { alert('Connect wallet first!'); return; }
  const args = [
    document.getElementById('rwa-type').value.trim(),
    document.getElementById('rwa-name').value.trim(),
    document.getElementById('rwa-location').value.trim(),
    document.getElementById('rwa-value').value.trim(),
    document.getElementById('rwa-desc').value.trim(),
    document.getElementById('rwa-docs').value.trim(),
  ];
  if (args.some(a => !a)) { alert('Fill all fields!'); return; }
  loading('rwa-result');
  try {
    await writeClient.connect('studionet');
    const hash = await writeClient.writeContract({
      address: CONTRACTS.rwa,
      functionName: 'analyze_asset',
      args,
      value: 0n,
    });
    txSent('rwa-result', hash);
  } catch(e) { result('rwa-result', '❌ ' + e.message); }
};

// Reputation
window.submitReputation = async function() {
  if (!writeClient) { alert('Connect wallet first!'); return; }
  const wallet = document.getElementById('rep-wallet').value.trim();
  const activity = document.getElementById('rep-activity').value.trim();
  if (!wallet||!activity) { alert('Fill all fields!'); return; }
  loading('rep-result');
  try {
    await writeClient.connect('studionet');
    const hash = await writeClient.writeContract({
      address: CONTRACTS.rep,
      functionName: 'score_address',
      args: [wallet, activity],
      value: 0n,
    });
    txSent('rep-result', hash);
  } catch(e) { result('rep-result', '❌ ' + e.message); }
};

window.loadRepScores = async function() {
  if (!readClient) { readClient = createClient({ chain: studionet }); }
  loading('rep-result');
  try {
    const data = await readClient.readContract({
      address: CONTRACTS.rep,
      functionName: 'get_all_scores',
      args: [],
    });
    const scores = typeof data === 'string' ? JSON.parse(data) : data;
    let html = '<p style="font-size:13px;color:#94a3b8;margin:0 0 12px;">On-chain reputation scores:</p>';
    const vals = Object.values(scores);
    if (vals.length === 0) { html += '<p style="color:#4b5563;font-size:14px;">No scores yet.</p>'; }
    vals.slice(-5).forEach(item => {
      if (!item.wallet) return;
      const r = item.result || {};
      html += `<div style="padding:10px;background:#1a1a2e;border-radius:6px;margin-bottom:8px;">
        <p style="font-size:13px;color:#a78bfa;margin:0 0 6px;">${item.wallet.slice(0,10)}...${item.wallet.slice(-6)}</p>
        <div style="display:flex;align-items:center;gap:8px;">${badge(r.score)}<span style="font-size:12px;color:#94a3b8;">${r.reasoning||''}</span></div>
      </div>`;
    });
    result('rep-result', html);
  } catch(e) { result('rep-result', '❌ ' + e.message); }
};

// Recent verdicts
window.loadRecent = async function() {
  if (!readClient) { readClient = createClient({ chain: studionet }); }
  const el = document.getElementById('recent-list');
  el.innerHTML = '<p style="color:#4b5563;font-size:14px;margin:0;">Loading...</p>';
  try {
    const [factData, repData] = await Promise.all([
      readClient.readContract({ address: CONTRACTS.fact, functionName: 'get_all_claims', args: [] }),
      readClient.readContract({ address: CONTRACTS.rep, functionName: 'get_all_scores', args: [] }),
    ]);
    let html = '';
    try {
      const claims = typeof factData === 'string' ? JSON.parse(factData) : factData;
      Object.values(claims).slice(-3).forEach(item => {
        if (!item.claim) return;
        const r = item.result || {};
        html += `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#0f172a;border-radius:6px;margin-bottom:6px;">
          <span style="font-size:11px;background:#1e1b2e;color:#a78bfa;padding:2px 8px;border-radius:4px;white-space:nowrap;">FACT</span>
          ${badge(r.verdict)}
          <span style="font-size:13px;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.claim}</span>
        </div>`;
      });
    } catch(e) {}
    try {
      const scores = typeof repData === 'string' ? JSON.parse(repData) : repData;
      Object.values(scores).slice(-3).forEach(item => {
        if (!item.wallet) return;
        const r = item.result || {};
        html += `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#0f172a;border-radius:6px;margin-bottom:6px;">
          <span style="font-size:11px;background:#1e1b2e;color:#a78bfa;padding:2px 8px;border-radius:4px;white-space:nowrap;">REPUTATION</span>
          ${badge(r.score)}
          <span style="font-size:13px;color:#e2e8f0;">${item.wallet.slice(0,10)}...${item.wallet.slice(-6)}</span>
        </div>`;
      });
    } catch(e) {}
    el.innerHTML = html || '<p style="color:#4b5563;font-size:14px;margin:0;">No verdicts yet.</p>';
  } catch(e) {
    el.innerHTML = '<p style="color:#4b5563;font-size:14px;margin:0;">Could not load verdicts.</p>';
  }
};

// Auto-load on start
readClient = createClient({ chain: studionet });
window.loadRecent();
