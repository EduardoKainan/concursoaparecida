import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

test('Vercel publica o diretório criado pelo build', () => {
  assert.equal(vercelConfig.outputDirectory, 'dist');
  assert.equal(vercelConfig.buildCommand, 'npm run build');
});
