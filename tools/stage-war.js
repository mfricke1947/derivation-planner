// Copies the compiled widgets (a GWT "war" folder) for packaging, leaving out WEB-INF (server-side GWT files, not needed by the desktop app) and OS junk.
// Usage: node tools/stage-war.js [source-war] [destination]
//   source defaults to $DERIVER_WAR, else the snapshot in this repository (widgets/war), else the sibling Stegeman project's war/
//   destination defaults to build/war (what package.json's extraResources bundles into the app)
// To refresh the snapshot from the live Stegeman build:  node tools/stage-war.js <path to Stegeman war> widgets/war
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const sibling = path.join(root, '../Stegeman/ProofsPublicCopy/ProofsPublic/war');
const snapshot = path.join(root, 'widgets', 'war');
const src = path.resolve(process.argv[2] || process.env.DERIVER_WAR || (fs.existsSync(path.join(snapshot, 'Proofs.html')) ? snapshot : sibling));
const dst = path.resolve(process.argv[3] || path.join(root, 'build', 'war'));
if (!fs.existsSync(path.join(src, 'Proofs.html'))) { console.error('Not a war folder:', src); process.exit(1); }
if (src === dst) { console.error('Source and destination are the same:', src); process.exit(1); }
fs.rmSync(dst, { recursive: true, force: true });
let files = 0, bytes = 0;
fs.cpSync(src, dst, { recursive: true, filter: (s) => {
  const rel = path.relative(src, s);
  if (rel === 'WEB-INF' || path.basename(s) === '.DS_Store' || s.endsWith('.icloud')) return false;
  if (fs.statSync(s).isFile()) { files++; bytes += fs.statSync(s).size; }
  return true;
} });
console.log(`Staged ${files} files, ${(bytes / 1e6).toFixed(1)} MB: ${src} -> ${dst}`);
