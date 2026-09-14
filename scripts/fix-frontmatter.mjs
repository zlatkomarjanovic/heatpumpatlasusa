// Fix trailing commas after quoted scalars in content frontmatter.
// YAML block mappings do not use commas, and a comma after a closing quote
// starts a flow context, which js-yaml rejects as a mapping indentation error.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = walk('src/content');
let fixedCount = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  const frontmatter = match[1];
  const lines = frontmatter.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // A quoted scalar followed by a comma and nothing else is always invalid here.
    const cleaned = line.replace(/(["'])\s*,\s*$/u, '$1');
    if (cleaned !== line) {
      lines[i] = cleaned;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, src.replace(frontmatter, lines.join('\n')), 'utf8');
    fixedCount += 1;
    console.log('fixed', file);
  }
}

console.log('total fixed:', fixedCount);
console.log('--- revalidate ---');
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    console.log('NO FRONTMATTER', file);
    continue;
  }
  try {
    yaml.load(match[1]);
    console.log('OK  ', file);
  } catch (error) {
    console.log('FAIL', file, '::', String(error.message).split('\n')[0]);
  }
}