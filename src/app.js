const main = document.querySelector('#main');
const toast = document.querySelector('#toast');
let catalog;
let lessons = [];
let pastExams = [];
let currentView = 'home';
let activeTopic = null;
let questionTopicFilter = 'all';
let toastTimer;

const readProgress = () => {
  try { return JSON.parse(localStorage.getItem('proxima-progress-v1') || '{"completed":[]}'); }
  catch { return { completed: [] }; }
};
let progress = readProgress();
const saveProgress = () => {
  try { localStorage.setItem('proxima-progress-v1', JSON.stringify(progress)); }
  catch { showToast('Não foi possível salvar o progresso neste navegador.'); }
};
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const getPosition = () => catalog.positions[0];
const subjects = () => getPosition().subjects;
const allTopics = () => subjects().flatMap((subject) => subject.topics.map((topic) => ({ ...topic, subject })));
const getLesson = (topicId) => lessons.find((lesson) => lesson.topicId === topicId);
const isComplete = (id) => progress.completed.includes(id);
const percentDone = (subject) => Math.round(subject.topics.filter((topic) => isComplete(topic.id)).length / subject.topics.length * 100);
const datePt = (iso) => iso.split('-').reverse().join('/');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function setView(view) {
  currentView = view;
  activeTopic = null;
  document.querySelectorAll('[data-view]').forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle('is-active', selected);
    if (button.matches('.nav-item')) selected ? button.setAttribute('aria-current', 'page') : button.removeAttribute('aria-current');
  });
  render();
  main.focus({ preventScroll: true });
}

function subjectCard(subject) {
  const percent = percentDone(subject);
  return `<article class="subject-card">
    <div class="subject-top"><div><h3>${escapeHtml(subject.name)}</h3><p>${subject.questions} questões na prova · peso ${subject.weight}</p></div><span class="weight-pill">${percent}%</span></div>
    <div class="progress-line" role="progressbar" aria-label="Progresso em ${escapeHtml(subject.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="progress-fill" style="width:${percent}%"></div></div>
    <div class="subject-foot"><span>${subject.topics.filter((topic) => isComplete(topic.id)).length} de ${subject.topics.length} tópicos estudados</span><button class="subject-open" data-action="open-subject" data-subject="${escapeHtml(subject.id)}">Abrir tópicos →</button></div>
  </article>`;
}

function shellHeader(eyebrow, title, subtitle, right = '') {
  return `<div class="welcome-row"><div><div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${right}</div>`;
}

function homeView() {
  const position = getPosition();
  const topics = allTopics();
  const next = topics.find((topic) => getLesson(topic.id) && !isComplete(topic.id)) || topics.find((topic) => !isComplete(topic.id)) || topics[0];
  const done = topics.filter((topic) => isComplete(topic.id)).length;
  const date = datePt(catalog.exam.examDate);
  const select = `<button class="position-select" data-action="choose-position" aria-haspopup="dialog">${escapeHtml(position.name)} · ${escapeHtml(position.level)}⌄</button>`;
  return `${shellHeader('SUA PREPARAÇÃO · APARECIDA DE GOIÂNIA', 'Vamos avançar um tópico?', 'Trilha organizada para o cargo que você escolheu.', select)}
    <section class="hero"><div class="hero-copy"><div class="hero-kicker">PRÓXIMA SESSÃO · ${getLesson(next.id)?.durationMinutes || 15} MIN</div><h2 class="hero-title">${escapeHtml(next.title)}</h2><p class="hero-meta">${escapeHtml(next.subject.name)} · ${escapeHtml(next.reference)}</p></div><button class="primary-btn" data-action="study-topic" data-topic="${escapeHtml(next.id)}">${isComplete(next.id) ? 'Revisar tópico' : 'Começar a estudar'} →</button></section>
    <div class="overview-grid"><article class="stat-card"><div class="stat-label">SEU PROGRESSO</div><div class="stat-value">${done}/${topics.length}</div><div class="stat-note">tópicos estudados</div></article><article class="stat-card"><div class="stat-label">DATA DA PROVA*</div><div class="stat-value">${date.slice(0,5)}</div><div class="stat-note">prevista para ${date}</div></article><article class="stat-card"><div class="stat-label">SEU CARGO</div><div class="stat-value" style="font-size:15px">Auxiliar</div><div class="stat-note">Secretaria escolar</div></article></div>
    <div class="content-heading"><h2>Matérias do edital</h2><button class="text-button" data-view="edital">Ver conteúdo completo →</button></div>
    <div class="subject-list">${subjects().map(subjectCard).join('')}</div>
    <div class="callout">*Data prevista conforme o Edital de Abertura nº 01/2026. Consulte a página oficial para confirmar eventuais retificações. Este é um protótipo de estudos; progresso fica salvo somente neste navegador.</div>
    ${provenance()}`;
}

function topicRow(topic) {
  const done = isComplete(topic.id);
  return `<div class="topic-row"><div><strong>${escapeHtml(topic.title)} ${done ? '✓' : ''}</strong><small>${escapeHtml(topic.reference)}</small></div><button class="small-btn" data-action="study-topic" data-topic="${escapeHtml(topic.id)}">${done ? 'Revisar' : 'Abrir'}</button></div>`;
}

function editalView() {
  return `${shellHeader('SEU CONTEÚDO', 'Edital organizado por matéria', 'Os tópicos abaixo seguem o conteúdo programático do Anexo IV.')}
    <div class="callout" style="margin:0 0 15px">O conteúdo é uma estruturação dos itens do edital, não uma aula. Resumos e questões passam por curadoria antes de serem apresentados como material validado.</div>
    ${subjects().map((subject) => `<section class="section-card"><div class="subject-top"><div><h2 style="font:700 15px Manrope,sans-serif;margin:0">${escapeHtml(subject.name)}</h2><p style="font-size:10px;color:var(--muted);margin:5px 0 0">${subject.questions} questões · peso ${subject.weight} · ${subject.topics.length} tópicos</p></div><span class="weight-pill">${percentDone(subject)}% concluído</span></div><div class="topic-list">${subject.topics.map(topicRow).join('')}</div></section>`).join('')}
    ${provenance()}`;
}

function questionsView() {
  const allQuestions = lessons.flatMap((lesson) => lesson.questions.map((question, index) => ({ lesson, question, index })));
  if (!allQuestions.length) return `${shellHeader('PRÁTICA', 'Questões em preparação', 'As questões aparecem aqui quando houver conteúdo autoral revisado.')}${provenance()}`;
  const availableLessons = lessons.filter((lesson) => lesson.questions.length);
  const questions = questionTopicFilter === 'all' ? allQuestions : allQuestions.filter(({ lesson }) => lesson.topicId === questionTopicFilter);
  const lessonCount = new Set(questions.map(({ lesson }) => lesson.topicId)).size;
  const topicFilter = `<label class="question-filter">Filtrar por tópico<select id="question-topic-filter"><option value="all" ${questionTopicFilter === 'all' ? 'selected' : ''}>Todos os tópicos</option>${availableLessons.map((lesson) => {
    const topic = allTopics().find((item) => item.id === lesson.topicId);
    return `<option value="${escapeHtml(lesson.topicId)}" ${questionTopicFilter === lesson.topicId ? 'selected' : ''}>${escapeHtml(topic?.title || lesson.title)}</option>`;
  }).join('')}</select></label>`;
  const questionCards = questions.length ? `<div class="lesson-question-list">${questions.map(({ lesson, question, index }) => {
    const topic = allTopics().find((item) => item.id === lesson.topicId);
    return `<section class="section-card"><div class="eyebrow">${escapeHtml(topic?.subject.name || 'Conhecimentos específicos')} · ${escapeHtml(topic?.title || lesson.title)}</div>${renderLessonQuestion(question, index, lesson.sources)}</section>`;
  }).join('')}</div>` : '<div class="callout">Ainda não há questões autorais neste tópico.</div>';
  return `${shellHeader('PRÁTICA', 'Treine com questões autorais', 'Responda, confira o comentário e consulte as fontes.')}
    <div class="callout">${questions.length} questões exibidas${questionTopicFilter === 'all' ? ` em ${lessonCount} tópicos` : ''}. São questões inéditas de treino, não questões oficiais nem provas anteriores.</div>
    ${topicFilter}${questionCards}
    ${pastExamsView()}
    ${provenance()}`;
}

function pastExamsView() {
  if (!pastExams.length) return '';
  return `<section class="section-card past-exams"><div><div class="eyebrow">ARQUIVO DA BANCA</div><h2>Provas anteriores oficiais</h2><p>Os cadernos e gabaritos abrem no portal do Instituto Verbena/UFG. Os textos das questões permanecem nas fontes oficiais.</p></div>
    <div class="past-exam-list">${pastExams.map((exam) => `<article class="past-exam-card">
      <div class="past-exam-heading"><div><span class="past-exam-level">${escapeHtml(exam.level)}</span><h3>${escapeHtml(exam.title)}</h3><p>${escapeHtml(exam.contest)} · prova ${datePt(exam.examDate)}</p></div><span class="past-exam-id">${escapeHtml(exam.matchLabel)}</span></div>
      <p class="past-exam-summary">${escapeHtml(exam.summary)}</p>
      <ul class="past-exam-subjects">${exam.subjects.map((subject) => `<li><strong>${escapeHtml(subject.title)} · Q. ${escapeHtml(subject.range)}</strong><span>${escapeHtml(subject.match)}</span></li>`).join('')}</ul>
      <ul class="past-exam-notes">${exam.highlights.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}${exam.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
      <div class="past-exam-links"><a href="${escapeHtml(exam.paperUrl)}" target="_blank" rel="noreferrer">Abrir caderno (PDF) ↗</a><a href="${escapeHtml(exam.answerKeyUrl)}" target="_blank" rel="noreferrer">Gabarito final (PDF) ↗</a><a class="past-exam-listing" href="${escapeHtml(exam.listingUrl)}" target="_blank" rel="noreferrer">Página oficial do concurso</a></div>
    </article>`).join('')}</div>
  </section>`;
}

function videosView() {
  const videos = lessons.flatMap((lesson) => lesson.videos.map((video) => ({ lesson, video })));
  const lessonCount = new Set(videos.map(({ lesson }) => lesson.topicId)).size;
  const curated = videos.map(({ lesson, video }) => {
    const topic = allTopics().find((item) => item.id === lesson.topicId);
    return `<article class="video-card"><div class="eyebrow">${escapeHtml(topic?.title || lesson.title)}</div><h3>${escapeHtml(video.label)}</h3><p>${escapeHtml(video.channel)} · ${escapeHtml(video.duration)}</p><div class="video-card-actions"><button class="small-btn" data-action="study-topic" data-topic="${escapeHtml(lesson.topicId)}">Abrir aula no app</button><a href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">Assistir no YouTube ↗</a></div></article>`;
  }).join('');
  return `${shellHeader('APOIO EM VÍDEO', 'Aulas em vídeo selecionadas', 'Vídeos associados às aulas do cargo Auxiliar de Secretaria.')}
    <div class="callout" style="margin:0 0 16px">${videos.length} vídeos de terceiros em ${lessonCount} aulas. Os players só são carregados quando você pedir; o conteúdo pode mudar ou sair do ar. Confira a data e a aderência do vídeo às fontes oficiais antes de usar.</div>
    <div class="video-grid">${curated}</div>
    <div class="content-heading"><h2>Buscar outros temas no YouTube</h2></div>
    <div class="video-grid">${allTopics().filter((topic) => !getLesson(topic.id)?.videos?.length).map((topic) => `<article class="video-card"><h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.subject.name)}</p><button class="small-btn" data-action="search-video" data-topic="${escapeHtml(topic.id)}">Buscar vídeos ↗</button></article>`).join('')}</div>${provenance()}`;
}

function renderLessonVideos(videos = []) {
  if (!videos.length) return '';
  return `<section class="lesson-videos"><div><h3>Aulas em vídeo</h3><p>Seleção de terceiros para complementar o resumo. Confira o conteúdo com as fontes oficiais da aula.</p></div>
    <div class="lesson-video-grid">${videos.map((video) => `<article class="lesson-video-card" data-video-card>
      <div class="lesson-video-frame" data-video-frame><button class="video-load-button" type="button" data-action="load-youtube-video" data-video-id="${escapeHtml(video.id)}" data-video-title="${escapeHtml(video.title)}"><span aria-hidden="true">▶</span><strong>Carregar player</strong></button></div>
      <h4>${escapeHtml(video.label)}</h4><p>${escapeHtml(video.channel)} · ${escapeHtml(video.duration)}</p>
      <a href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">Abrir no YouTube ↗</a>
    </article>`).join('')}</div>
    <p class="video-disclaimer">O vídeo é hospedado por outro canal. Disponibilidade, anúncios, legendas e conteúdo são controlados pelo YouTube e pelo responsável pelo vídeo.</p>
  </section>`;
}

function renderLessonBlock(block) {
  const paragraphs = (block.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const bullets = block.bullets?.length ? `<ul>${block.bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : '';
  return `<section class="lesson-block"><h3>${escapeHtml(block.heading)}</h3>${paragraphs}${bullets}</section>`;
}

function renderLessonQuestion(question, index, sources) {
  const sourceLinks = question.sourceIds.map((id) => sources.find((source) => source.id === id)).filter(Boolean)
    .map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} · ${escapeHtml(source.reference)} ↗</a>`).join('');
  return `<form class="lesson-question-form" data-lesson-question data-correct-option="${escapeHtml(question.correctOptionId)}" data-explanation="${escapeHtml(question.explanation)}">
    <div class="quiz-label">Questão autoral ${index + 1} · prática</div><h3 class="lesson-question-title">${escapeHtml(question.prompt)}</h3>
    <div class="lesson-options">${question.options.map((option) => `<label class="quiz-option"><input type="radio" name="answer-${escapeHtml(question.id)}" value="${escapeHtml(option.id)}"><span>${escapeHtml(option.text)}</span></label>`).join('')}</div>
    <button class="small-btn" type="submit">Conferir resposta</button><div class="quiz-feedback" data-answer-feedback role="status" aria-live="polite"></div>
    <div class="lesson-source-links"><strong>Base legal:</strong> ${sourceLinks}</div>
  </form>`;
}

function topicDetail(topic) {
  const completed = isComplete(topic.id);
  const lesson = getLesson(topic.id);
  if (!lesson) {
    return `<section class="section-card"><button class="text-button" data-action="back-to-view">← Voltar ao conteúdo</button><div class="eyebrow" style="margin-top:16px">${escapeHtml(topic.subject.name)}</div><h2 class="quiz-title">${escapeHtml(topic.title)}</h2><p class="page-subtitle">Referência: ${escapeHtml(topic.reference)}</p><div class="callout">Este tópico está listado no edital. A aula/resumo e o banco de questões deste item ainda estão sendo preparados e revisados; não vou preencher essa lacuna com conteúdo inventado.</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px"><button class="primary-btn" data-action="toggle-complete" data-topic="${escapeHtml(topic.id)}">${completed ? 'Marcar como não estudado' : 'Marcar como estudado'}</button><button class="small-btn" data-action="search-video" data-topic="${escapeHtml(topic.id)}">Buscar no YouTube ↗</button></div></section>`;
  }
  const sources = lesson.sources || [];
  return `<section class="section-card lesson-card"><button class="text-button" data-action="back-to-view">← Voltar ao conteúdo</button>
    <div class="eyebrow" style="margin-top:16px">${escapeHtml(topic.subject.name)} · ${lesson.durationMinutes} MIN</div>
    <h2 class="quiz-title">${escapeHtml(lesson.title)}</h2><p class="page-subtitle">No edital: ${escapeHtml(topic.reference)}</p>
    <div class="lesson-review-note"><strong>${escapeHtml(lesson.reviewStatus)}</strong><span>Material autoral inicial; conferir atualizações legais e fazer revisão pedagógica antes do uso comercial.</span></div>
    ${lesson.blocks.map(renderLessonBlock).join('')}
    ${renderLessonVideos(lesson.videos)}
    <section class="lesson-practice"><h3>Pratique agora</h3><p>Questões autorais com gabarito comentado e referência legal.</p>${lesson.questions.map((question, index) => renderLessonQuestion(question, index, sources)).join('')}</section>
    <div class="lesson-sources"><h3>Fontes oficiais</h3>${sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.title)}</strong><span>${escapeHtml(source.reference)} ↗</span></a>`).join('')}</div>
    <div class="lesson-actions"><button class="primary-btn" data-action="toggle-complete" data-topic="${escapeHtml(topic.id)}">${completed ? 'Marcar como não estudado' : 'Marcar como estudado'}</button><button class="small-btn" data-action="search-video" data-topic="${escapeHtml(topic.id)}">Buscar no YouTube ↗</button></div>
  </section>`;
}

function provenance() {
  return `<p class="provenance">Fonte: <a href="${escapeHtml(catalog.exam.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(catalog.exam.notice)} · Instituto Verbena/UFG ↗</a></p>`;
}

function render() {
  if (!catalog) return;
  const topic = activeTopic && allTopics().find((item) => item.id === activeTopic);
  if (topic) main.innerHTML = topicDetail(topic) + provenance();
  else if (currentView === 'home') main.innerHTML = homeView();
  else if (currentView === 'edital') main.innerHTML = editalView();
  else if (currentView === 'questions') main.innerHTML = questionsView();
  else if (currentView === 'videos') main.innerHTML = videosView();
}

function choosePosition() {
  const options = catalog.comingSoonPositions.map((name) => `<li>${escapeHtml(name)} <span>Em preparação</span></li>`).join('');
  const dialog = document.createElement('dialog');
  dialog.className = 'position-dialog';
  dialog.innerHTML = `<form method="dialog"><div class="dialog-head"><div><div class="eyebrow">SELEÇÃO DE CARGO</div><h2>Escolha sua trilha</h2></div><button class="dialog-close" aria-label="Fechar">×</button></div><button class="position-option" value="selected"><strong>Auxiliar de Secretaria</strong><span>Trilha piloto disponível</span></button><div class="dialog-label">OUTROS CARGOS DESTE EDITAL</div><ul class="coming-list">${options}</ul></form>`;
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

function searchVideo(topicId) {
  const topic = allTopics().find((item) => item.id === topicId);
  if (!topic) return;
  const query = `${getPosition().name} ${topic.title} concurso Aparecida Goiânia`;
  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
}

document.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { setView(viewButton.dataset.view); return; }
  const action = event.target.closest('[data-action]');
  if (!action) return;
  if (action.dataset.action === 'choose-position') choosePosition();
  if (action.dataset.action === 'open-subject') setView('edital');
  if (action.dataset.action === 'study-topic') { activeTopic = action.dataset.topic; render(); main.focus({ preventScroll: true }); }
  if (action.dataset.action === 'search-video') searchVideo(action.dataset.topic);
  if (action.dataset.action === 'load-youtube-video') {
    const videoId = action.dataset.videoId;
    const frame = action.closest('[data-video-card]')?.querySelector('[data-video-frame]');
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '') || !frame) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    iframe.title = action.dataset.videoTitle || 'Vídeo do YouTube';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
  }
  if (action.dataset.action === 'toggle-complete') {
    const id = action.dataset.topic;
    progress.completed = isComplete(id) ? progress.completed.filter((item) => item !== id) : [...progress.completed, id];
    saveProgress(); render(); showToast(isComplete(id) ? 'Tópico marcado como estudado.' : 'Progresso atualizado.');
  }
  if (action.dataset.action === 'back-to-view') { activeTopic = null; render(); }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('#question-topic-filter')) {
    questionTopicFilter = event.target.value;
    render();
  }
});

document.addEventListener('submit', (event) => {
  const lessonForm = event.target.closest('[data-lesson-question]');
  if (lessonForm) {
    event.preventDefault();
    const selected = new FormData(lessonForm).get(`answer-${lessonForm.querySelector('input[type="radio"]')?.name.replace('answer-', '')}`);
    const feedback = lessonForm.querySelector('[data-answer-feedback]');
    if (!selected) { showToast('Escolha uma alternativa primeiro.'); return; }
    const correctOptionId = lessonForm.dataset.correctOption;
    const correctInput = [...lessonForm.querySelectorAll('input[type="radio"]')].find((input) => input.value === correctOptionId);
    const correctText = correctInput?.nextElementSibling?.textContent || '';
    const isCorrect = selected === correctOptionId;
    feedback.textContent = `${isCorrect ? 'Correto.' : `Ainda não. Gabarito: ${correctText}.`} ${lessonForm.dataset.explanation}`;
    feedback.classList.add('show');
    return;
  }
});

async function init() {
  try {
    const [catalogResponse, lessonsResponse, pastExamsResponse] = await Promise.all([fetch('./src/catalog.json'), fetch('./src/lessons.json'), fetch('./src/past-exams.json')]);
    if (!catalogResponse.ok) throw new Error(`Catálogo indisponível (${catalogResponse.status})`);
    if (!lessonsResponse.ok) throw new Error(`Aulas indisponíveis (${lessonsResponse.status})`);
    if (!pastExamsResponse.ok) throw new Error(`Provas anteriores indisponíveis (${pastExamsResponse.status})`);
    [catalog, lessons, pastExams] = await Promise.all([
      catalogResponse.json(),
      lessonsResponse.json().then((data) => data.lessons || []),
      pastExamsResponse.json().then((data) => data.exams || [])
    ]);
    document.querySelector('#official-link').href = catalog.exam.sourceUrl;
    setView('home');
  } catch (error) {
    main.innerHTML = `<section class="section-card"><h1 class="page-title">Não consegui carregar a trilha</h1><p class="page-subtitle">${escapeHtml(error.message)}. Atualize a página para tentar novamente.</p><button class="small-btn" onclick="location.reload()">Tentar novamente</button></section>`;
  }
}
init();
