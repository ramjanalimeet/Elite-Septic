import { cp, mkdir, readdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const entries = [
  'index.html', 'mirror.js', 'assets', 'leads', 'about', 'accessibility-statement', 'blog',
  'bookings', 'contact', 'cookie-policy', 'jasper-tx', 'lufkin-tx',
  'privacy-policy', 'service-areas', 'services', 'terms-of-use',
  'wp-content', 'wp-includes'
];

// Validate sources before replacing the previous build.
for (const entry of entries) await stat(path.join(root, entry));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of entries) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}

let count = 0;
async function validate(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await validate(filename);
    else {
      const relative = path.relative(output, filename);
      if (entry.name === 'index.html' && !relative.startsWith('leads' + path.sep)) {
        const page = await readFile(filename, 'utf8');
        if (!page.includes('href="/assets/site-scale.css"')) {
          await writeFile(filename, page.replace('</head>', '<link rel="stylesheet" href="/assets/site-scale.css"></head>'));
        }
      }
      if ((await stat(filename)).size > 25 * 1024 * 1024) {
        throw new Error(`Cloudflare's 25 MiB asset limit exceeded: ${filename}`);
      }
      count++;
    }
  }
}
await validate(output);
console.log(`Built ${count} website files in dist/`);
