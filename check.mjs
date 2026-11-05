// Outside uptime check for Selas and BTC Brain (owner request 05/11/2026; plan agreed between the BTC Brain and
// Selas sessions). Runs on GitHub Actions every few minutes and fails the job when anything is down, so GitHub
// e-mails the account that owns the workflow. It reads only public addresses and carries no secret.
// Checks inside each server are separate; this one covers the case where a whole server is unreachable.
//   node check.mjs          (Node 20+, no packages)
import { connect } from 'node:tls';

const DAY = 86400e3;
const get = async (url, opts = {}) => {
  const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'selas-uptime/1 (+https://getselas.com/)' }, ...opts });
  return { status: res.status, headers: res.headers, body: await res.text() };
};
const tlsDaysLeft = host => new Promise((ok, fail) => {
  const s = connect({ host, port: 443, servername: host, timeout: 15000 }, () => {
    const cert = s.getPeerCertificate(); s.end();
    s.authorized ? ok((Date.parse(cert.valid_to) - Date.now()) / DAY) : fail(Error(`certificate not trusted: ${s.authorizationError}`));
  });
  s.on('timeout', () => { s.destroy(); fail(Error('TLS timeout')); }); s.on('error', fail);
});

const checks = [
  // BTC Brain (droplet btc-brain behind Cloudflare)
  ['brain page', async () => { const r = await get('https://brain.getselas.com/'); return r.status === 200 && r.body.includes('BTC Brain') || `status ${r.status}`; }],
  ['brain data fresh', async () => {
    const r = await get(`https://brain.getselas.com/api/brain/live/v1/view?uptime=${Math.floor(Date.now() / 60e3)}`); if (r.status !== 200) return `status ${r.status}`;
    const v = JSON.parse(r.body), age = (Date.now() - Date.parse(v.at)) / 3600e3;   // recomputed hourly at :05
    return v.schemaVersion === 'btc-brain-public-view-v1' && age < 3 || `last reading ${age.toFixed(1)} h ago`;
  }],
  ['brain admin locked', async () => { const r = await get('https://brain.getselas.com/admin/'); return [302, 401, 403].includes(r.status) || `admin answered ${r.status}`; }],
  // Selas public site and pilot (pilot sits behind a password gate: 401 from outside means alive)
  ['getselas.com', async () => { const r = await get('https://getselas.com/'); return r.status === 200 && r.body.includes('<title>SELAS') || `status ${r.status}`; }],
  ['getselas.com FAQ', async () => { const r = await get('https://getselas.com/faq.html'); return r.status === 200 && r.body.includes('FAQPage') || `status ${r.status}`; }],
  ['pilot gate', async () => { const r = await get('https://pilot.getselas.com/'); return r.status === 401 && /basic/i.test(r.headers.get('www-authenticate') ?? '') || `status ${r.status}`; }],
  // Certificates: at least 14 days left
  ...['getselas.com', 'pilot.getselas.com', 'brain.getselas.com'].map(h => [`TLS ${h}`, async () => { const d = await tlsDaysLeft(h); return d >= 14 || `${d.toFixed(0)} days left`; }]),
];

let failed = 0;
for (const [name, run] of checks) {
  let res; try { res = await run(); } catch (e) { res = e.message; }
  if (res === true) console.log(`ok    ${name}`); else { failed++; console.log(`FAIL  ${name}: ${res}`); console.log(`::error title=${name}::${res}`); }
}
console.log(failed ? `${failed} of ${checks.length} checks failed` : `all ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
