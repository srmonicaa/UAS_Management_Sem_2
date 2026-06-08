const bank = window.QUESTION_BANK;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const subjectSelect = $('#subjectSelect');
const countSelect = $('#countSelect');
const shuffleToggle = $('#shuffleToggle');
const instantToggle = $('#instantToggle');
const setup = $('#setup');
const quiz = $('#quiz');
const review = $('#review');
const resultDialog = $('#resultDialog');

const state = {
  pool: [],
  subjectLabel: '',
  current: 0,
  answers: {},
  revealed: {},
  score: 0,
  instant: true,
};

function flattenSubjects() {
  return bank.subjects.flatMap(subject => subject.questions.map(q => ({ ...q, subjectId: subject.id, subjectTitle: subject.title, subjectCode: subject.code })));
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function init() {
  const total = bank.subjects.reduce((sum, s) => sum + s.count, 0);
  $('#totalQuestions').textContent = total;
  $('#totalSubjects').textContent = bank.subjects.length;

  subjectSelect.innerHTML = `<option value="all">Semua mata kuliah (${total} soal)</option>` +
    bank.subjects.map(s => `<option value="${s.id}">${s.code} — ${s.title} (${s.count} soal)</option>`).join('');

  renderCountOptions();
  renderSubjectCards();
  bindEvents();
  applySavedTheme();
}

function currentPoolSize() {
  if (subjectSelect.value === 'all') return flattenSubjects().length;
  const selected = bank.subjects.find(s => s.id === subjectSelect.value);
  return selected ? selected.count : 0;
}

function renderCountOptions() {
  const max = currentPoolSize();
  const presets = [10, 20, 50, 100].filter(n => n < max);
  countSelect.innerHTML = presets.map(n => `<option value="${n}">${n} soal</option>`).join('') +
    `<option value="all">Semua (${max} soal)</option>`;
  if (max >= 20) countSelect.value = '20';
  else if (max >= 10) countSelect.value = '10';
  else countSelect.value = 'all';
}

function renderSubjectCards() {
  $('#subjectCards').innerHTML = bank.subjects.map(s => `
    <div class="subject-card">
      <strong>${s.code} — ${s.title}</strong>
      <span>${s.count} soal • sumber: ${s.sourceFile}</span>
    </div>
  `).join('');
}

function bindEvents() {
  subjectSelect.addEventListener('change', renderCountOptions);
  $('#startBtn').addEventListener('click', startQuiz);
  $('#backBtn').addEventListener('click', backToSetup);
  $('#nextBtn').addEventListener('click', nextQuestion);
  $('#prevBtn').addEventListener('click', prevQuestion);
  $('#hintBtn').addEventListener('click', revealAnswer);
  $('#reviewBtn').addEventListener('click', openReview);
  $('#closeReviewBtn').addEventListener('click', () => review.classList.add('hidden'));
  $('#searchInput').addEventListener('input', renderReviewList);
  $('#restartBtn').addEventListener('click', () => { resultDialog.close(); startQuiz(); });
  $('#closeDialogBtn').addEventListener('click', () => resultDialog.close());
  $('#themeToggle').addEventListener('click', toggleTheme);
}

function getSelectedPool() {
  if (subjectSelect.value === 'all') {
    state.subjectLabel = 'Semua mata kuliah';
    return flattenSubjects();
  }
  const subject = bank.subjects.find(s => s.id === subjectSelect.value);
  state.subjectLabel = `${subject.code} — ${subject.title}`;
  return subject.questions.map(q => ({ ...q, subjectId: subject.id, subjectTitle: subject.title, subjectCode: subject.code }));
}

function startQuiz() {
  let pool = getSelectedPool();
  if (shuffleToggle.checked) pool = shuffleArray(pool);
  const count = countSelect.value === 'all' ? pool.length : Number(countSelect.value);
  state.pool = pool.slice(0, count);
  state.current = 0;
  state.answers = {};
  state.revealed = {};
  state.score = 0;
  state.instant = instantToggle.checked;

  setup.classList.add('hidden');
  review.classList.add('hidden');
  quiz.classList.remove('hidden');
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToSetup() {
  quiz.classList.add('hidden');
  setup.classList.remove('hidden');
  window.scrollTo({ top: setup.offsetTop - 20, behavior: 'smooth' });
}

function renderQuestion() {
  const q = state.pool[state.current];
  const answered = state.answers[q.id];
  const revealed = state.revealed[q.id];
  const hasKnownAnswer = Boolean(q.answer);
  const progress = ((state.current + 1) / state.pool.length) * 100;

  $('#progressBar').style.width = `${progress}%`;
  $('#scoreText').textContent = `${state.score}/${Object.keys(state.answers).length}`;
  $('#questionCounter').textContent = `Soal ${state.current + 1} dari ${state.pool.length}`;
  $('#sourceBadge').textContent = `${q.subjectCode || ''} • No. ${q.number}`;
  $('#questionText').textContent = q.question;

  $('#options').innerHTML = q.options.map(opt => {
    const isSelected = answered === opt.label;
    const isCorrect = hasKnownAnswer && opt.label === q.answer;
    let cls = 'option-btn';
    if (answered || revealed) {
      if (isCorrect) cls += ' highlight-answer';
      if (answered && isSelected && isCorrect) cls += ' correct';
      if (answered && isSelected && !isCorrect) cls += ' wrong';
    }
    const optText = opt.text || '(teks opsi tidak terbaca pada PDF)';
    return `<button class="${cls}" data-label="${opt.label}" type="button" ${answered ? 'disabled' : ''}>
      <span class="option-label">${opt.label}</span>
      <span class="option-text">${escapeHTML(optText)}</span>
    </button>`;
  }).join('');

  $$('.option-btn').forEach(btn => btn.addEventListener('click', () => selectAnswer(btn.dataset.label)));

  renderFeedback(q, answered, revealed);
  $('#prevBtn').disabled = state.current === 0;
  $('#nextBtn').textContent = state.current === state.pool.length - 1 ? 'Selesai' : 'Berikutnya';
}

function selectAnswer(label) {
  const q = state.pool[state.current];
  if (state.answers[q.id]) return;
  state.answers[q.id] = label;
  if (q.answer && label === q.answer) state.score += 1;
  if (state.instant) state.revealed[q.id] = true;
  renderQuestion();
}

function revealAnswer() {
  const q = state.pool[state.current];
  state.revealed[q.id] = true;
  renderQuestion();
}

function renderFeedback(q, answered, revealed) {
  const box = $('#feedback');
  box.className = 'feedback hidden';
  box.innerHTML = '';
  if (!answered && !revealed) return;

  if (!q.answer) {
    box.className = 'feedback note';
    box.innerHTML = `<strong>Kunci tidak berupa opsi A–D.</strong><br>${escapeHTML(q.answerText || 'Pada PDF, kunci jawaban tidak terbaca sebagai pilihan A–D.')}`;
    return;
  }

  const correctOpt = q.options.find(o => o.label === q.answer);
  const answerLabel = `${q.answer}. ${correctOpt ? correctOpt.text : (q.answerText || '')}`;

  if (answered) {
    const isCorrect = answered === q.answer;
    box.className = `feedback ${isCorrect ? 'good' : 'bad'}`;
    box.innerHTML = `<strong>${isCorrect ? 'Benar!' : 'Salah.'}</strong><br>Jawaban benar: <mark>${escapeHTML(answerLabel)}</mark><br><small>Sumber kunci: ${escapeHTML(q.keySource || 'PDF')}</small>`;
  } else if (revealed) {
    box.className = 'feedback note';
    box.innerHTML = `<strong>Highlight kuning dibuka.</strong><br>Jawaban: <mark>${escapeHTML(answerLabel)}</mark><br><small>Sumber kunci: ${escapeHTML(q.keySource || 'PDF')}</small>`;
  }
}

function nextQuestion() {
  if (state.current === state.pool.length - 1) {
    showResult();
    return;
  }
  state.current += 1;
  renderQuestion();
  window.scrollTo({ top: quiz.offsetTop - 16, behavior: 'smooth' });
}

function prevQuestion() {
  if (state.current === 0) return;
  state.current -= 1;
  renderQuestion();
  window.scrollTo({ top: quiz.offsetTop - 16, behavior: 'smooth' });
}

function showResult() {
  const answered = Object.keys(state.answers).length;
  const percent = answered ? Math.round((state.score / answered) * 100) : 0;
  $('#resultTitle').textContent = `Skor ${state.score}/${answered}`;
  $('#resultSummary').textContent = `Nilai sementara kamu ${percent}. Dari ${state.pool.length} soal, ${answered} sudah dijawab.`;
  resultDialog.showModal();
}

function openReview() {
  renderReviewList();
  review.classList.remove('hidden');
  window.scrollTo({ top: review.offsetTop - 16, behavior: 'smooth' });
}

function renderReviewList() {
  const query = ($('#searchInput').value || '').toLowerCase().trim();
  const items = flattenSubjects().filter(q => {
    const text = `${q.subjectCode} ${q.subjectTitle} ${q.question} ${q.answerText}`.toLowerCase();
    return !query || text.includes(query);
  }).slice(0, 80);

  $('#reviewList').innerHTML = items.map(q => {
    const answer = q.answer
      ? `${q.answer}. ${(q.options.find(o => o.label === q.answer) || {}).text || q.answerText}`
      : (q.answerText || 'Kunci tidak tersedia sebagai opsi A–D');
    return `<article class="review-item">
      <strong>${q.subjectCode} — Soal ${q.number}</strong>
      <p>${escapeHTML(q.question)}</p>
      <span class="review-answer">${escapeHTML(answer)}</span>
    </article>`;
  }).join('') || '<p>Tidak ada soal yang cocok.</p>';
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[ch]));
}

function applySavedTheme() {
  const saved = localStorage.getItem('exam-theme');
  if (saved === 'dark') document.body.classList.add('dark');
  $('#themeToggle').textContent = document.body.classList.contains('dark') ? 'Mode Terang' : 'Mode Gelap';
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('exam-theme', dark ? 'dark' : 'light');
  $('#themeToggle').textContent = dark ? 'Mode Terang' : 'Mode Gelap';
}

init();
