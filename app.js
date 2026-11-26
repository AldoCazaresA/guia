let chapters = window.GUIDE_DATA || [];

const $ = (selector) => document.querySelector(selector);
const el = (name, className, text) => { const node = document.createElement(name); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const chapterUrl = (id) => `#chapter-${id}`;

function getProgress() { try { return new Set(JSON.parse(localStorage.getItem('key-terms-complete') || '[]')); } catch { return new Set(); } }
function saveProgress(done) { try { localStorage.setItem('key-terms-complete', JSON.stringify([...done])); } catch { /* storage unavailable */ } }
function updateProgress() { const done = getProgress(); $('#progressText').textContent = `${done.size} / ${chapters.length}`; $('#progressFill').style.width = `${(done.size / chapters.length) * 100}%`; }

function buildSidebar() {
  const nav = $('#chapterNav'); nav.replaceChildren();
  chapters.forEach((chapter) => {
    const link = el('a', 'chapter-link'); link.href = chapterUrl(chapter.id); link.dataset.chapter = chapter.id;
    link.append(el('span', 'chapter-no', String(chapter.id).padStart(2, '0')), el('span', '', chapter.title)); nav.append(link);
  });
}

function setActiveLink(id) { document.querySelectorAll('.chapter-link').forEach((link) => link.classList.toggle('active', Number(link.dataset.chapter) === id)); }
function showHome() {
  setActiveLink(0); const main = $('#main'); main.replaceChildren(); const wrap = el('section', 'welcome');
  wrap.append(el('p', 'tag', 'Business communication · Study guide'), el('h1', '', 'Key Terms & Concepts'), el('p', 'intro', 'A 19-chapter reference for reviewing the essential vocabulary and concepts. Choose a chapter to study its terms and definitions, then test yourself with the practice quiz.'));
  const grid = el('div', 'chapter-grid'); chapters.forEach((chapter) => { const link = el('a', 'card'); link.href = chapterUrl(chapter.id); link.append(el('div', 'card-no', `CHAPTER ${String(chapter.id).padStart(2, '0')}`), el('div', 'card-title', chapter.title)); grid.append(link); });
  wrap.append(grid); main.append(wrap);
}

function showChapter(id) {
  const chapter = chapters.find((item) => item.id === id); if (!chapter) return showHome();
  const done = getProgress(); done.add(id); saveProgress(done); updateProgress(); setActiveLink(id);
  const main = $('#main'); main.replaceChildren(); const header = el('div', 'chapter-head'); header.append(el('div', 'chapter-number', String(id).padStart(2, '0'))); const heading = el('div'); heading.append(el('h1', '', chapter.title), el('p', '', `${chapter.vocab.length} key terms and concepts`)); header.append(heading); main.append(header);
  const section = el('section', 'section'); section.append(el('h2', 'section-title', 'Key vocabulary'));
  const box = el('div', 'box'); const table = el('table', 'terms'); const head = el('thead'); const headerRow = el('tr'); headerRow.append(el('th', '', 'Term'), el('th', '', 'Definition')); head.append(headerRow); const body = el('tbody');
  chapter.vocab.forEach((item) => { const row = el('tr'); row.append(el('td', '', item.word), el('td', '', item.definition)); body.append(row); }); table.append(head, body); box.append(table); section.append(box); main.append(section);
  const actions = el('div', 'chapter-actions'); const previous = chapters.find((item) => item.id === id - 1); const next = chapters.find((item) => item.id === id + 1); const quiz = el('a', 'button primary', 'Practice this chapter'); quiz.href = `#quiz=${id}`; actions.append(previous ? Object.assign(el('a', 'button', '← Previous'), { href: chapterUrl(previous.id) }) : el('span'), quiz, next ? Object.assign(el('a', 'button', 'Next →'), { href: chapterUrl(next.id) }) : el('span')); main.append(actions);
}

const shuffle = (list) => [...list].sort(() => Math.random() - .5);
function showQuiz(initialChapter) {
  setActiveLink(0); const main = $('#main'); main.replaceChildren();
  const setup = el('section', 'quiz-setup'); setup.append(el('p', 'tag', 'Practice'), el('h1', 'quiz-title', 'Vocabulary Quiz'), el('p', 'intro', 'Choose a chapter or mix all chapters. Each question asks you to identify the matching definition.'));
  const settings = el('div', 'quiz-settings'); const allLabel = el('label'); const all = Object.assign(el('input'), { type: 'radio', name: 'scope', checked: !initialChapter, value: 'all' }); allLabel.append(all, document.createTextNode(' All chapters')); settings.append(allLabel);
  chapters.forEach((chapter) => { const label = el('label'); const input = Object.assign(el('input'), { type: 'radio', name: 'scope', value: chapter.id, checked: chapter.id === initialChapter }); label.append(input, document.createTextNode(` Chapter ${chapter.id}: ${chapter.title}`)); settings.append(label); }); setup.append(settings);
  const countLabel = el('label', 'tag', 'Questions: '); const count = el('select', 'button'); [5, 10, 15, 20].forEach((amount) => { const option = el('option', '', amount); option.value = amount; if (amount === 10) option.selected = true; count.append(option); }); const allConcepts = el('option', '', 'All concepts in selected chapters'); allConcepts.value = 'all'; count.append(allConcepts); countLabel.append(count); setup.append(countLabel, document.createElement('br')); const start = el('button', 'button primary', 'Start quiz'); start.type = 'button'; start.style.marginTop = '18px'; start.addEventListener('click', () => { const scope = document.querySelector('input[name="scope"]:checked').value; const selected = scope === 'all' ? null : Number(scope); const pool = (selected ? chapters.filter((chapter) => chapter.id === selected) : chapters).flatMap((chapter) => chapter.vocab.map((item) => ({ ...item, chapter }))); const amount = count.value === 'all' ? pool.length : Number(count.value); runQuiz(shuffle(pool).slice(0, amount), pool); }); setup.append(start); main.append(setup);
}

function runQuiz(questions, pool) {
  let index = 0, score = 0, answered = false; const main = $('#main');
  const render = () => { answered = false; const question = questions[index]; main.replaceChildren(); const wrap = el('section', 'quiz-question'); wrap.append(el('p', 'question-meta', `Question ${index + 1} of ${questions.length} · Score: ${score}`), el('h1', 'quiz-title', 'Which term matches this definition?'), el('div', 'definition', question.definition)); const options = el('div', 'options'); const distractors = shuffle(pool.filter((item) => item.word !== question.word)).slice(0, 3); shuffle([question, ...distractors]).forEach((item) => { const button = el('button', 'option', item.word); button.type = 'button'; button.addEventListener('click', () => { if (answered) return; answered = true; const correct = item.word === question.word; if (correct) { score++; button.classList.add('correct'); } else { button.classList.add('wrong'); [...options.children].find((node) => node.textContent === question.word).classList.add('correct'); } [...options.children].forEach((node) => node.disabled = true); next.disabled = false; }); options.append(button); }); wrap.append(options); const next = el('button', 'button quiz-next', index + 1 === questions.length ? 'See results' : 'Next question'); next.disabled = true; next.addEventListener('click', () => { if (index + 1 === questions.length) results(); else { index++; render(); } }); wrap.append(next); main.append(wrap); };
  const results = () => { main.replaceChildren(); const result = el('section', 'quiz-question'); result.append(el('p', 'tag', 'Quiz complete'), el('h1', 'quiz-title', `${score} / ${questions.length}`), el('p', 'result', score === questions.length ? 'Excellent — a perfect score.' : 'Review the terms you missed and try another quiz.'), Object.assign(el('a', 'button primary', 'New quiz'), { href: '#quiz' })); main.append(result); }; render();
}

function route() { const hash = location.hash.slice(1); $('#sidebar').classList.remove('open'); if (hash === 'home' || !hash) return showHome(); if (hash.startsWith('chapter-')) return showChapter(Number(hash.replace('chapter-', ''))); if (hash.startsWith('quiz')) { const match = hash.match(/^quiz=(\d+)$/); return showQuiz(match ? Number(match[1]) : null); } showHome(); }
function initTheme() { let stored = 'light'; try { stored = localStorage.getItem('key-terms-theme') || 'light'; } catch { /* storage unavailable */ } if (stored === 'dark') document.documentElement.dataset.theme = 'dark'; $('#themeButton').addEventListener('click', () => { const dark = document.documentElement.dataset.theme === 'dark'; document.documentElement.dataset.theme = dark ? '' : 'dark'; try { localStorage.setItem('key-terms-theme', dark ? 'light' : 'dark'); } catch { /* storage unavailable */ } }); }

function init() { initTheme(); $('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open')); if (!chapters.length) { $('#main').replaceChildren(el('div', 'error', 'Could not load the study guide data. Make sure data.js is in the same folder as index.html.')); return; } buildSidebar(); updateProgress(); route(); window.addEventListener('hashchange', route); }
init();
