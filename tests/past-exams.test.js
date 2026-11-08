import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dataUrl = new URL('../src/past-exams.json', import.meta.url);
const data = JSON.parse(await readFile(fileURLToPath(dataUrl), 'utf8'));

test('provas anteriores têm caderno, gabarito final e página oficial', () => {
  assert.ok(data.exams.length >= 2);
  for (const exam of data.exams) {
    assert.ok(exam.id && exam.title && exam.contest && exam.level);
    for (const key of ['paperUrl', 'answerKeyUrl', 'listingUrl']) {
      const url = new URL(exam[key]);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.hostname, 'sistemas.institutoverbena.ufg.br');
    }
    assert.ok(exam.subjects.length > 0);
  }
});

test('catálogo diferencia proximidade do cargo e limitações de correspondência', () => {
  const medium = data.exams.find(({ id }) => id === 'secretario-escolar-valparaiso-2025');
  const exactTitle = data.exams.find(({ id }) => id === 'auxiliar-secretaria-escolar-inhumas-2023');
  assert.ok(medium?.subjects.some(({ title }) => /conhecimentos específicos/i.test(title)));
  assert.ok(exactTitle?.notes.some((note) => /fundamental|específicos/i.test(note)));
});
