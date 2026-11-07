const main = document.querySelector('#main');
const toast = document.querySelector('#toast');
let catalog;
let currentView = 'home';
let activeTopic = null;
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
  const next = topics.find((topic) => !isComplete(topic.id)) || topics[0];
  const done = topics.filter((topic) => isComplete(topic.id)).length;
  const date = datePt(catalog.exam.examDate);
  const select = `<button class="position-select" data-action="choose-position" aria-haspopup="dialog">${escapeHtml(position.name)} · ${escapeHtml(position.level)}⌄</button>`;
  return `${shellHeader('SUA PREPARAÇÃO · APARECIDA DE GOIÂNIA', 'Vamos avançar um tópico?', 'Trilha organizada para o cargo que você escolheu.', select)}
    <section class="hero"><div class="hero-copy"><div class="hero-kicker">PRÓXIMA SESSÃO · 15 MIN</div><h2 class="hero-title">${escapeHtml(next.title)}</h2><p class="hero-meta">${escapeHtml(next.subject.name)} · ${escapeHtml(next.reference)}</p></div><button class="primary-btn" data-action="study-topic" data-topic="${escapeHtml(next.id)}">${isComplete(next.id) ? 'Revisar tópico' : 'Começar a estudar'} →</button></section>
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
  return `${shellHeader('PRÁTICA', 'Uma questão para aquecer', 'Treine o conteúdo e veja a referência depois de responder.')}
    <section class="section-card quiz-card"><div class="quiz-label">Questão demonstrativa · autoria própria</div><h2 class="quiz-title">Qual tópico aparece no conteúdo específico do cargo de Auxiliar de Secretaria?</h2>
      <form id="quiz-form"><label class="quiz-option"><input type="radio" name="answer" value="a"><span>Didática da História e uso de fontes históricas.</span></label><label class="quiz-option"><input type="radio" name="answer" value="b"><span>Protocolo, tramitação, arquivologia e documentos escolares.</span></label><label class="quiz-option"><input type="radio" name="answer" value="c"><span>Fundamentos de anatomia aplicados à Educação Física.</span></label><button class="primary-btn" type="submit" style="margin-top:9px">Conferir resposta</button></form><div id="quiz-feedback" class="quiz-feedback" role="status"></div>
      <p class="provenance">Este item é apenas uma demonstração de interação. Não é questão de prova anterior nem questão oficial da banca. Ainda precisa de revisão pedagógica antes de uso comercial.</p>
    </section>${provenance()}`;
}

function videosView() {
  return `${shellHeader('APOIO EM VÍDEO', 'Encontre uma aula para o tópico', 'A busca abre o YouTube com o assunto e o cargo selecionados.')}
    <div class="callout" style="margin:0 0 16px">Os resultados vêm do YouTube e podem mudar. Ainda não há curadoria ou validação editorial desses vídeos; confira canal, conteúdo e atualidade antes de estudar.</div>
    <div class="video-grid">${allTopics().map((topic) => `<article class="video-card"><h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.subject.name)}</p><button class="small-btn" data-action="search-video" data-topic="${escapeHtml(topic.id)}">Buscar vídeos ↗</button></article>`).join('')}</div>${provenance()}`;
}

function topicDetail(topic) {
  const completed = isComplete(topic.id);
  return `<section class="section-card"><button class="text-button" data-action="back-to-view">← Voltar ao conteúdo</button><div class="eyebrow" style="margin-top:16px">${escapeHtml(topic.subject.name)}</div><h2 class="quiz-title">${escapeHtml(topic.title)}</h2><p class="page-subtitle">Referência: ${escapeHtml(topic.reference)}</p><div class="callout">Este tópico está listado no edital. A aula/resumo e o banco de questões deste item ainda estão sendo preparados e revisados; não vou preencher essa lacuna com conteúdo inventado.</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px"><button class="primary-btn" data-action="toggle-complete" data-topic="${escapeHtml(topic.id)}">${completed ? 'Marcar como não estudado' : 'Marcar como estudado'}</button><button class="small-btn" data-action="search-video" data-topic="${escapeHtml(topic.id)}">Buscar no YouTube ↗</button></div></section>`;
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
  if (action.dataset.action === 'toggle-complete') {
    const id = action.dataset.topic;
    progress.completed = isComplete(id) ? progress.completed.filter((item) => item !== id) : [...progress.completed, id];
    saveProgress(); render(); showToast(isComplete(id) ? 'Tópico marcado como estudado.' : 'Progresso atualizado.');
  }
  if (action.dataset.action === 'back-to-view') { activeTopic = null; render(); }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'quiz-form') return;
  event.preventDefault();
  const selected = new FormData(event.target).get('answer');
  const feedback = document.querySelector('#quiz-feedback');
  if (!selected) { showToast('Escolha uma alternativa primeiro.'); return; }
  feedback.textContent = selected === 'b'
    ? 'Isso mesmo. O item 4 do Anexo IV inclui protocolo, tramitação, arquivologia e documentos escolares.'
    : 'Não é essa. Revise o item 4 do Anexo IV, que trata de protocolo, tramitação, arquivologia e documentos escolares.';
  feedback.classList.add('show');
});

async function init() {
  try {
    const response = await fetch('./src/catalog.json');
    if (!response.ok) throw new Error(`Catálogo indisponível (${response.status})`);
    catalog = await response.json();
    document.querySelector('#official-link').href = catalog.exam.sourceUrl;
    setView('home');
  } catch (error) {
    main.innerHTML = `<section class="section-card"><h1 class="page-title">Não consegui carregar a trilha</h1><p class="page-subtitle">${escapeHtml(error.message)}. Atualize a página para tentar novamente.</p><button class="small-btn" onclick="location.reload()">Tentar novamente</button></section>`;
  }
}
init();
