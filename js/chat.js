const SUGESTOES = ['Brisa', 'Margarida', 'Lótus', 'Hortênsia', 'Camélia', 'Íris', 'Dália', 'Gardênia', 'Acácia', 'Magnólia'];

const RESPOSTAS = [
  'Obrigada por dividir isso com a gente 💜',
  'Estou com você. Leva o tempo que precisar.',
  'Você foi muito forte em falar sobre isso.',
  'Passei por algo parecido. Fica mais leve com o tempo, prometo.',
  'Você não está sozinha nessa.',
];

const telaEntrada = document.querySelector('.js-join');
const formEntrada = document.querySelector('.js-join-form');
const inputApelido = document.getElementById('apelido');
const checkConcordo = document.getElementById('concordo');
const boxSugestoes = document.querySelector('.js-suggest');

const app = document.querySelector('.js-app');
const listaSalas = document.querySelector('.js-rooms');
const listaMsgs = document.querySelector('.js-messages');
const tituloSala = document.querySelector('.js-room-title');
const descSala = document.querySelector('.js-room-desc');
const digitando = document.querySelector('.js-typing');
const nomeDigitando = document.querySelector('.js-typing-name');
const alerta = document.querySelector('.js-alert');
const composer = document.querySelector('.js-composer');
const campoMsg = document.getElementById('mensagem');
const dialogRegras = document.querySelector('.js-rules-dialog');

let apelido = '';

let salaAtual = 'acolhimento';

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const CORES = ['#7B4FC4', '#2E7D5B', '#C2185B', '#B9553F', '#2F6FB0', '#8E44AD'];
function corDe(nome) {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length];
}

const DADOS_PESSOAIS = [
  /\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
  /\b(rua|r\.|av\.?|avenida|travessa|tv\.|estrada|rodovia)\s+\S+/i,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
];
const RISCO_VIDA = /(me matar|suic[ií]d|tirar (a )?minha vida|n[aã]o quero mais viver|acabar com tudo|me machucar)/i;
const PERIGO_AGORA = /(estou em perigo|ele est[aá] aqui|vai me bater|me ameaçou agora|socorro)/i;

function mostrarAlerta(html, tipo = 'aviso') {
  alerta.className = `chat-alert js-alert chat-alert--${tipo}`;
  alerta.innerHTML = `${html}<button type="button" class="chat-alert__close" aria-label="Fechar aviso">×</button>`;
  alerta.hidden = false;
}
alerta.addEventListener('click', (e) => {
  if (e.target.closest('.chat-alert__close')) alerta.hidden = true;
});

function sugerirApelidos() {
  boxSugestoes.innerHTML = '';
  [...SUGESTOES].sort(() => Math.random() - 0.5).slice(0, 5).forEach((nome) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-suggest__item';
    b.textContent = nome;
    b.addEventListener('click', () => {
      inputApelido.value = nome;
      document.getElementById('apelido-erro').textContent = '';
      inputApelido.removeAttribute('aria-invalid');
    });
    boxSugestoes.appendChild(b);
  });
}
sugerirApelidos();

formEntrada.addEventListener('submit', (e) => {
  e.preventDefault();
  const valor = inputApelido.value.trim();
  let ok = true;

  const erroApelido = document.getElementById('apelido-erro');
  if (valor.length < 2) {
    erroApelido.textContent = 'Escolha um apelido com pelo menos 2 letras.';
    ok = false;
  } else if (DADOS_PESSOAIS.some((r) => r.test(valor)) || /\d{4,}/.test(valor)) {
    erroApelido.textContent = 'O apelido não pode ter telefone, e-mail ou números longos.';
    ok = false;
  } else if (APELIDOS.some((n) => n.toLowerCase() === valor.toLowerCase()) || /modera/i.test(valor)) {
    erroApelido.textContent = 'Esse apelido já está em uso na roda. Escolha outro.';
    ok = false;
  } else {
    erroApelido.textContent = '';
  }
  inputApelido.setAttribute('aria-invalid', erroApelido.textContent ? 'true' : 'false');

  const erroConcordo = document.getElementById('concordo-erro');
  erroConcordo.textContent = checkConcordo.checked ? '' : 'Para entrar, confirme que leu os combinados.';
  if (!checkConcordo.checked) ok = false;

  if (!ok) {
    (erroApelido.textContent ? inputApelido : checkConcordo).focus();
    return;
  }

  apelido = valor;
  document.querySelector('.js-me').textContent = apelido;
  telaEntrada.hidden = true;
  app.hidden = false;
  desenharSalas();
  abrirSala('acolhimento');
  campoMsg.focus();
});

function desenharSalas() {
  listaSalas.innerHTML = Object.entries(RODAS).map(([id, s]) => `
    <li>
      <button type="button" class="chat-room${id === salaAtual ? ' is-active' : ''}" data-sala="${id}" style="--room:${s.cor}"
              ${id === salaAtual ? 'aria-current="true"' : ''}>
        <span class="chat-room__dot"></span>
        <span class="chat-room__body">
          <strong>${s.nome}</strong>
          ${s.online ? `<small>${s.online} online</small>` : ''}
        </span>
      </button>
    </li>`).join('');
}

listaSalas.addEventListener('click', (e) => {
  const b = e.target.closest('.chat-room');
  if (b) abrirSala(b.dataset.sala);
});

function abrirSala(id) {
  salaAtual = id;
  const sala = RODAS[id];
  tituloSala.textContent = sala.nome;
  descSala.textContent = sala.desc;
  alerta.hidden = true;
  desenharSalas();
  listaMsgs.innerHTML = '';
  sala.mensagens.forEach((m) => adicionarMensagem(m, false));
  rolarParaFim();
}

function adicionarMensagem(m, guardar = true) {
  if (guardar) RODAS[salaAtual].mensagens.push(m);
  const minha = Boolean(m.minha);
  const li = document.createElement('li');
  li.className = `chat-msg${minha ? ' chat-msg--me' : ''}${m.mod ? ' chat-msg--mod' : ''}`;
  const cor = m.mod ? '#4A1D7E' : corDe(m.autora);
  li.innerHTML = `
    <span class="chat-msg__avatar" style="--av:${cor}" aria-hidden="true">${m.mod ? '★' : escapar(m.autora[0].toUpperCase())}</span>
    <div class="chat-msg__bubble">
      <span class="chat-msg__name">${m.mod ? 'Moderação Elas por Elas' : escapar(minha ? `${m.autora} (você)` : m.autora)}</span>
      <p>${escapar(m.texto)}</p>
      <span class="chat-msg__meta">
        <time>${m.hora || agora()}</time>
        ${!minha && !m.mod ? `
          <button type="button" class="chat-msg__act js-support" aria-pressed="false">💜 Apoiar</button>
          <button type="button" class="chat-msg__act js-report">Denunciar</button>` : ''}
      </span>
    </div>`;
  listaMsgs.appendChild(li);
  if (!m.hora) m.hora = li.querySelector('time').textContent;
}

function rolarParaFim() {
  listaMsgs.scrollTop = listaMsgs.scrollHeight;
}

listaMsgs.addEventListener('click', (e) => {
  const apoio = e.target.closest('.js-support');
  if (apoio) {
    const ativo = apoio.getAttribute('aria-pressed') === 'true';
    apoio.setAttribute('aria-pressed', !ativo);
    apoio.textContent = ativo ? '💜 Apoiar' : '💜 Apoiado';
  }
  const den = e.target.closest('.js-report');
  if (den) {
    const bolha = den.closest('.chat-msg__bubble');
    bolha.innerHTML = '<p class="chat-msg__hidden">Mensagem ocultada para você. A moderação vai revisar.</p>';
  }
});

document.querySelector('.js-quick').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) enviar(b.textContent);
});

campoMsg.addEventListener('input', () => {
  campoMsg.style.height = 'auto';
  campoMsg.style.height = `${Math.min(campoMsg.scrollHeight, 140)}px`;
});
campoMsg.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

composer.addEventListener('submit', (e) => {
  e.preventDefault();
  enviar(campoMsg.value);
});

function enviar(textoBruto) {
  const texto = textoBruto.trim();
  if (!texto) return;

  if (DADOS_PESSOAIS.some((r) => r.test(texto))) {
    mostrarAlerta('<strong>Por segurança, não envie telefone, e-mail, CPF ou endereço na roda.</strong> Edite a mensagem e tente de novo.');
    campoMsg.focus();
    return;
  }

  adicionarMensagem({ autora: apelido, texto, minha: true });
  campoMsg.value = '';
  campoMsg.style.height = 'auto';
  alerta.hidden = true;
  rolarParaFim();

  if (PERIGO_AGORA.test(texto)) {
    mostrarAlerta('<strong>Se você está em perigo agora, ligue <a href="tel:190">190</a>.</strong> Se puder, use a Saída rápida no canto da tela.', 'urgente');
    responder('Moderação', 'Estamos aqui com você. Se estiver em perigo agora, ligue 190. Sua segurança vem primeiro.', true);
    return;
  }
  if (RISCO_VIDA.test(texto)) {
    mostrarAlerta('<strong>Você não precisa passar por isso sozinha.</strong> Ligue <a href="tel:188">188</a> (CVV), 24h e gratuito. Em perigo, ligue <a href="tel:190">190</a>.', 'urgente');
    responder('Moderação', 'Obrigada por confiar na roda. O que você sente importa. Por favor, ligue 188 (CVV) agora: é gratuito e funciona 24h. Estamos aqui.', true);
    return;
  }

  if (!MODO_TESTE) return;
  const quem = APELIDOS[Math.floor(Math.random() * APELIDOS.length)];
  const fala = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
  responder(quem, fala, false);
}

function responder(autora, texto, mod) {
  const sala = salaAtual;
  nomeDigitando.textContent = mod ? 'A moderação' : autora;
  digitando.hidden = false;
  setTimeout(() => {
    digitando.hidden = true;
    if (salaAtual !== sala) { RODAS[sala].mensagens.push({ autora, texto, mod, hora: agora() }); return; }
    adicionarMensagem({ autora, texto, mod });
    rolarParaFim();
  }, mod ? 900 : 1600);
}

document.querySelector('.js-open-rules').addEventListener('click', () => dialogRegras.showModal());
dialogRegras.addEventListener('click', (e) => {
  if (e.target.closest('.js-close-rules') || e.target === dialogRegras) dialogRegras.close();
});

document.querySelector('.js-leave').addEventListener('click', () => {
  window.location.replace('inicio.html');
});
