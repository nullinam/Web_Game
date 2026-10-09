import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(gameRoot, 'dist');
const builtPage = path.join(output, 'app.html');

if (!fs.existsSync(builtPage)) {
  throw new Error(`Vite output page was not found: ${builtPage}`);
}

fs.copyFileSync(builtPage, path.join(gameRoot, 'index.html'));
fs.cpSync(path.join(output, 'assets'), path.join(gameRoot, 'assets'), {
  recursive: true,
  force: true,
});

for (const name of fs.readdirSync(output)) {
  if (name === 'app.html' || name === 'assets') continue;
  const source = path.join(output, name);
  const destination = path.join(gameRoot, name);
  if (fs.statSync(source).isFile()) fs.copyFileSync(source, destination);
}
