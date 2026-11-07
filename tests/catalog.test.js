import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const catalogUrl = new URL('../src/catalog.json', import.meta.url);
const catalog = JSON.parse(await readFile(fileURLToPath(catalogUrl), 'utf8'));

test('catálogo piloto identifica o edital e o cargo corretamente', () => {
  assert.equal(catalog.exam.id, 'aparecida-educacao-2026');
  assert.equal(catalog.positions[0].id, 'auxiliar-secretaria');
  assert.equal(catalog.positions[0].requirements, 'Ensino médio completo e curso de Informática Básica');
  assert.equal(catalog.positions[0].immediateVacancies, 121);
  assert.equal(catalog.positions[0].reserveList, 605);
});

test('distribuição da prova de Auxiliar soma 40 questões', () => {
  const subjects = catalog.positions[0].subjects;
  assert.deepEqual(subjects.map(({ questions, weight }) => [questions, weight]), [
    [10, 4], [3, 2], [2, 2], [25, 2]
  ]);
  assert.equal(subjects.reduce((sum, subject) => sum + subject.questions, 0), 40);
});

test('cada disciplina e tópico mantém referência ao conteúdo do edital', () => {
  for (const subject of catalog.positions[0].subjects) {
    assert.ok(subject.id && subject.name && subject.topics.length > 0);
    for (const topic of subject.topics) {
      assert.ok(topic.id && topic.title && topic.reference, `referência ausente em ${subject.name}`);
    }
  }
});
