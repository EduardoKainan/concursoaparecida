import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = await readFile(fileURLToPath(new URL('../src/app.js', import.meta.url)), 'utf8');

test('aula carrega o player YouTube-nocookie só após ação explícita', () => {
  assert.match(app, /youtube-nocookie\.com\/embed\//);
  assert.match(app, /load-youtube-video/);
  assert.match(app, /strict-origin-when-cross-origin/);
});
