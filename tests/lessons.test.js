import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../src/', import.meta.url);
const catalog = JSON.parse(await readFile(fileURLToPath(new URL('catalog.json', root)), 'utf8'));
const lessons = JSON.parse(await readFile(fileURLToPath(new URL('lessons.json', root)), 'utf8'));
const topics = new Set(catalog.positions.flatMap((position) => position.subjects.flatMap((subject) => subject.topics.map((topic) => topic.id))));

test('aula publicada liga-se a um tópico válido e mantém revisão identificada', () => {
  assert.ok(lessons.lessons.length > 0);
  for (const lesson of lessons.lessons) {
    assert.ok(topics.has(lesson.topicId), `tópico não existe: ${lesson.topicId}`);
    assert.ok(lesson.title && lesson.durationMinutes > 0);
    assert.ok(lesson.reviewStatus, `status de revisão ausente em ${lesson.topicId}`);
    assert.ok(lesson.blocks.length > 0);
  }
});

test('questões da aula têm alternativas únicas, gabarito válido e explicação com fonte', () => {
  const lesson = lessons.lessons.find(({ topicId }) => topicId === 'esp-lgpd');
  assert.ok(lesson, 'aula piloto de LAI e LGPD ausente');
  assert.ok(lesson.questions.length >= 4);
  const sourceIds = new Set(lesson.sources.map(({ id }) => id));
  for (const question of lesson.questions) {
    const optionIds = question.options.map(({ id }) => id);
    assert.equal(new Set(optionIds).size, optionIds.length, `alternativas repetidas em ${question.id}`);
    assert.ok(optionIds.includes(question.correctOptionId), `gabarito inválido em ${question.id}`);
    assert.ok(question.explanation, `explicação ausente em ${question.id}`);
    assert.ok(question.sourceIds.length > 0, `fonte ausente em ${question.id}`);
    for (const id of question.sourceIds) assert.ok(sourceIds.has(id), `fonte ${id} ausente`);
  }
  for (const source of lesson.sources) assert.match(source.url, /^https:\/\//);
});

test('banco autoral cobre os tópicos específicos priorizados e todas as questões têm fonte', () => {
  const expectedTopics = ['esp-etica', 'esp-educacao', 'esp-atendimento', 'esp-rotinas', 'esp-protocolo', 'esp-lgpd', 'esp-redacao', 'esp-lei-organica'];
  for (const topicId of expectedTopics) {
    const lesson = lessons.lessons.find((item) => item.topicId === topicId);
    assert.ok(lesson, `aula de prática ausente para ${topicId}`);
    assert.ok(lesson.questions.length >= 2, `menos de duas questões em ${topicId}`);
    const sources = new Set(lesson.sources.map(({ id }) => id));
    for (const question of lesson.questions) {
      assert.ok(question.sourceIds?.length, `fonte ausente em ${question.id}`);
      for (const sourceId of question.sourceIds) assert.ok(sources.has(sourceId), `fonte ${sourceId} ausente em ${question.id}`);
      assert.equal(question.options.length, 4, `esperadas quatro alternativas em ${question.id}`);
      assert.ok(question.explanation, `comentário ausente em ${question.id}`);
    }
  }
});

test('cada aula publicada tem ao menos um vídeo do YouTube com ID e link válidos', () => {
  assert.equal(lessons.lessons.length, 8);
  let videoCount = 0;
  for (const lesson of lessons.lessons) {
    assert.ok(lesson.videos?.length, `vídeo ausente em ${lesson.topicId}`);
    for (const video of lesson.videos) {
      videoCount += 1;
      assert.match(video.id, /^[A-Za-z0-9_-]{11}$/, `ID inválido em ${lesson.topicId}`);
      assert.equal(video.url, `https://www.youtube.com/watch?v=${video.id}`);
      assert.ok(video.title && video.channel && video.duration);
    }
  }
  const redacao = lessons.lessons.find(({ topicId }) => topicId === 'esp-redacao');
  assert.ok(redacao?.videos?.length >= 2, 'esperados vídeos separados de redação oficial e informática');
  assert.ok(videoCount >= 10, 'esperados 10 vídeos cobrindo os tópicos específicos');
});
