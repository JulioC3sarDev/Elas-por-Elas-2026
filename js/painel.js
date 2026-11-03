const PERFIL_VAZIO = {
  nome: '', profissao: '', registro: '', area: 'PSICOLOGIA', bio: '', servicos: [], modalidades: [],
  disponibilidade: '', telefone: '', municipio: 'Recife', bairro: '', endereco: null, verificadoEm: null,
};
const base = SERVICOS.find((s) => s.id === 8) || PERFIL_VAZIO;
const perfil = { ...base, servicos: [...base.servicos], modalidades: [...base.modalidades], disponivel: true };

const STATUS = (!MODO_TESTE || new URLSearchParams(location.search).get('status') === 'analise') ? 'EM_ANALISE' : 'APROVADO';

const $ = (sel) => document.querySelector(sel);
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const formatarData = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
const primeiroNome = (n) => n.replace(/\(.*?\)/g, '').trim().split(/\s+/)[0] || 'voluntária';
const iniciais = (n) => {
  const p = n.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'V';
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

const dialog = $('.js-dialog');
const dialogBody = $('.js-dialog-body');
function abrirJanela(html) {
  dialogBody.innerHTML = `<button type="button" class="vol-dialog__close js-close" aria-label="Fechar">×</button>${html}`;
  dialog.showModal();
}
dialog.addEventListener('click', (e) => {
  if (e.target.closest('.js-close') || e.target === dialog) dialog.close();
});

function atualizarCabecalho() {
  $('.js-user-name').textContent = primeiroNome(perfil.nome);
  $('.js-user-first').textContent = primeiroNome(perfil.nome);
  $('.js-user-initials').textContent = iniciais(perfil.nome);
}

const ABAS = ['inicio', 'perfil', 'rodas', 'moderacao', 'materiais', 'conta'];
function mostrarAba() {
  const aba = ABAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';
  ABAS.forEach((a) => { document.getElementById(`tab-${a}`).hidden = a !== aba; });
  document.querySelectorAll('.pn-nav__link').forEach((l) => {
    const ativo = l.dataset.tab === aba;
    l.classList.toggle('is-active', ativo);
    if (ativo) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
  });
  const nav = document.querySelector('.pn-nav');
  const ativa = nav.querySelector('.is-active');
  if (ativa && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = ativa.offsetLeft - 16;
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', mostrarAba);

function desenharStatus() {
  const box = $('.js-status');
  if (STATUS === 'EM_ANALISE') {
    box.className = 'pn-status pn-status--wait js-status';
    box.innerHTML = `
      <span class="pn-status__icon" aria-hidden="true">⏳</span>
      <div><strong>Seu cadastro está em análise.</strong>
      <p>A equipe está verificando seu registro profissional. Enquanto isso, complete seu perfil. Ele só aparece para as mulheres depois da aprovação.</p></div>`;
  } else {
    box.className = 'pn-status pn-status--ok js-status';
    box.innerHTML = `
      <span class="pn-status__icon" aria-hidden="true">✓</span>
      <div><strong>Perfil verificado e publicado.</strong>
      <p>Registro ${escapar(perfil.registro)} verificado em ${formatarData(perfil.verificadoEm)}.</p></div>`;
  }
}

const switchDisp = $('.js-available');
switchDisp.addEventListener('change', () => {
  perfil.disponivel = switchDisp.checked;
  $('.js-available-label').textContent = perfil.disponivel ? 'Aceitando novos contatos' : 'Em pausa';
  $('.js-available-hint').textContent = perfil.disponivel
    ? 'Seu perfil aparece na busca e na rede de voluntárias.'
    : 'Seu perfil não aparece na busca enquanto estiver em pausa.';
  desenharPrevia();
});

function itensPerfil() {
  return [
    { ok: perfil.bio && perfil.bio.length >= 60, txt: 'Apresentação com pelo menos 60 caracteres' },
    { ok: perfil.servicos.length > 0, txt: 'Como você pode ajudar' },
    { ok: perfil.modalidades.length > 0, txt: 'Formas de atendimento' },
    { ok: Boolean(perfil.disponibilidade), txt: 'Dias e horários' },
    { ok: Boolean(perfil.telefone), txt: 'Telefone de contato' },
  ];
}

function desenharProgresso() {
  const itens = itensPerfil();
  const pct = Math.round((itens.filter((i) => i.ok).length / itens.length) * 100);
  $('.js-progress-bar').style.width = `${pct}%`;
  $('.pn-progress').setAttribute('aria-valuenow', pct);
  $('.js-progress-label').textContent = pct === 100 ? 'Perfil completo!' : `${pct}% preenchido`;
  $('.js-checklist').innerHTML = itens.map((i) =>
    `<li class="${i.ok ? 'is-ok' : ''}">${i.txt}</li>`).join('');
}

const form = $('.js-profile-form');
const campos = {
  nome: $('#p-nome'), profissao: $('#p-prof'), registro: $('#p-reg'), bio: $('#p-bio'),
  disponibilidade: $('#p-disp'), telefone: $('#p-tel'), municipio: $('#p-mun'),
  bairro: $('#p-bairro'), endereco: $('#p-end'),
};

Object.keys(BAIRROS).forEach((m) => campos.municipio.add(new Option(m, m)));

$('.js-services').innerHTML = Object.entries(TIPOS_SERVICO)
  .filter(([v]) => v !== 'DELEGACIA')
  .map(([v, nome]) => `<label class="check"><input type="checkbox" name="servicos" value="${v}"><span>${nome}</span></label>`)
  .join('');

$('.js-modes').innerHTML = Object.entries(MODALIDADES)
  .map(([v, nome]) => `<label class="fs-chip"><input type="checkbox" name="modalidades" value="${v}"><span>${nome}</span></label>`)
  .join('');

function preencherForm() {
  Object.entries(campos).forEach(([k, el]) => { el.value = perfil[k] || ''; });
  form.querySelectorAll('[name=servicos]').forEach((c) => { c.checked = perfil.servicos.includes(c.value); });
  form.querySelectorAll('[name=modalidades]').forEach((c) => { c.checked = perfil.modalidades.includes(c.value); });
  $('.js-bio-count').textContent = campos.bio.value.length;
  mostrarEndereco();
}

function lerForm() {
  ['nome', 'bio', 'disponibilidade', 'telefone', 'municipio', 'bairro', 'endereco']
    .forEach((k) => { perfil[k] = campos[k].value.trim(); });
  perfil.servicos = [...form.querySelectorAll('[name=servicos]:checked')].map((c) => c.value);
  perfil.modalidades = [...form.querySelectorAll('[name=modalidades]:checked')].map((c) => c.value);
  if (!perfil.endereco) perfil.endereco = null;
}

function mostrarEndereco() {
  const presencial = form.querySelector('[name=modalidades][value=PRESENCIAL]').checked;
  $('.js-address-field').hidden = !presencial;
}

form.addEventListener('input', () => {
  $('.js-bio-count').textContent = campos.bio.value.length;
  $('.js-saved').textContent = '';
  mostrarEndereco();
  lerForm();
  desenharPrevia();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  lerForm();
  if (!perfil.nome) {
    $('.js-saved').textContent = 'Informe o nome de exibição.';
    campos.nome.focus();
    return;
  }
  desenharProgresso();
  atualizarCabecalho();
  $('.js-saved').textContent = 'Alterações salvas ✓';
});

function desenharPrevia() {
  const area = AREAS[perfil.area];
  const mods = perfil.modalidades.map((m) => `<li>${MODALIDADES[m]}</li>`).join('');
  $('.js-preview').innerHTML = `
    ${perfil.disponivel ? '' : '<p class="pn-preview__paused">Em pausa: este card não aparece na busca agora.</p>'}
    <article class="vol-card${perfil.disponivel ? '' : ' is-paused'}" style="--area:${area.cor}">
      <div class="vol-card__top">
        <span class="vol-avatar" aria-hidden="true">${iniciais(perfil.nome || '?')}</span>
        <div class="vol-card__who">
          <h3 class="vol-card__name">${escapar(perfil.nome || 'Seu nome')}</h3>
          <p class="vol-card__prof">${escapar(perfil.profissao)}${perfil.registro ? ` · ${escapar(perfil.registro)}` : ''}</p>
        </div>
      </div>
      <p class="vol-card__bio">${escapar(perfil.bio || 'Escreva uma apresentação curta e acolhedora.')}</p>
      ${mods ? `<ul class="vol-card__mods">${mods}</ul>` : ''}
      <p class="vol-card__meta">
        <span>${escapar(perfil.municipio)}${perfil.bairro ? ` · ${escapar(perfil.bairro)}` : ''}</span>
        <span>${escapar(perfil.disponibilidade || 'Dias e horários')}</span>
      </p>
    </article>`;
}

const DENUNCIAS = !MODO_TESTE ? [] : [
  { id: 1, roda: 'Acolhimento', apelido: 'Participante 23', hora: '21:48', motivo: 'Pedido de contato pessoal',
    texto: 'Me chama no privado que eu te explico melhor, passa seu número.' },
  { id: 2, roda: 'Mães', apelido: 'Participante 41', hora: '21:30', motivo: 'Julgamento',
    texto: 'Você está exagerando, isso não é violência.' },
  { id: 3, roda: 'Recomeços', apelido: 'Participante 7', hora: '20:12', motivo: 'Propaganda',
    texto: 'Conheçam meu curso para mudar de vida, link na bio!' },
];

const ALERTA_RISCO = !MODO_TESTE ? null : {
  roda: 'Acolhimento', hora: '22:05',
  texto: 'Uma mensagem com sinal de risco à vida recebeu a resposta automática com o 188 (CVV). Acompanhe a conversa com acolhimento.',
};

const TURNOS = [
  { dia: 'Segunda', hora: '19h às 21h', vagas: 2, ocupadas: 1, minha: false },
  { dia: 'Terça', hora: '19h às 21h', vagas: 2, ocupadas: 2, minha: true },
  { dia: 'Quarta', hora: '12h às 14h', vagas: 2, ocupadas: 0, minha: false },
  { dia: 'Quinta', hora: '19h às 21h', vagas: 2, ocupadas: 1, minha: false },
  { dia: 'Sábado', hora: '10h às 12h', vagas: 2, ocupadas: 1, minha: false },
];
if (!MODO_TESTE) TURNOS.forEach((t) => { t.ocupadas = 0; t.minha = false; });

function pendentes() { return DENUNCIAS.filter((d) => !d.decisao).length; }

function desenharModeracao() {
  const n = pendentes();
  $('.js-pending').textContent = n;
  $('.js-badge').textContent = n || '';
  $('.js-pending-label').textContent = `${n} ${n === 1 ? 'pendente' : 'pendentes'}`;

  const meu = TURNOS.find((t) => t.minha);
  $('.js-next-shift').textContent = meu ? `Seu próximo turno: ${meu.dia}, ${meu.hora}.` : 'Você ainda não tem turno nesta semana.';

  $('.js-risk').hidden = !ALERTA_RISCO;
  if (ALERTA_RISCO) $('.js-risk').innerHTML = `
    <span class="pn-alert-risk__icon" aria-hidden="true">!</span>
    <div><strong>Alerta de risco · ${ALERTA_RISCO.roda} · ${ALERTA_RISCO.hora}</strong>
    <p>${ALERTA_RISCO.texto}</p></div>
    <a href="#rodas" class="btn btn--dark js-go-risk">Abrir roda</a>`;

  $('.js-reports').innerHTML = !DENUNCIAS.length
    ? '<li class="pn-empty">Nenhuma denúncia para revisar. 💜</li>'
    : DENUNCIAS.map((d) => `
    <li class="pn-report${d.decisao ? ' is-done' : ''}">
      <div class="pn-report__head">
        <span class="pn-report__reason">${escapar(d.motivo)}</span>
        <span class="pn-report__where">Roda ${escapar(d.roda)} · ${escapar(d.apelido)} · ${d.hora}</span>
      </div>
      <blockquote class="pn-report__msg">${escapar(d.texto)}</blockquote>
      ${d.decisao
    ? `<p class="pn-report__result">${d.decisao}</p>`
    : `<div class="pn-report__actions">
           <button type="button" class="btn btn--coral" data-acao="remover" data-id="${d.id}">Remover mensagem</button>
           <button type="button" class="btn btn--outline" data-acao="bloquear" data-id="${d.id}">Remover e pausar participante</button>
           <button type="button" class="pn-report__keep" data-acao="manter" data-id="${d.id}">Manter (não viola os combinados)</button>
         </div>`}
    </li>`).join('');

  $('.js-shifts').innerHTML = TURNOS.map((t, i) => {
    const cheio = t.ocupadas >= t.vagas && !t.minha;
    return `
      <li class="pn-shift${t.minha ? ' is-mine' : ''}">
        <span class="pn-shift__day">${t.dia}</span>
        <span class="pn-shift__time">${t.hora}</span>
        <span class="pn-shift__slots">${t.ocupadas}/${t.vagas} moderadoras</span>
        <button type="button" class="pn-shift__btn" data-turno="${i}" ${cheio ? 'disabled' : ''}>
          ${t.minha ? 'Sair do turno' : cheio ? 'Completo' : 'Assumir turno'}
        </button>
      </li>`;
  }).join('');
}

$('.js-reports').addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao]');
  if (!b) return;
  const d = DENUNCIAS.find((x) => x.id === Number(b.dataset.id));
  d.decisao = {
    remover: '✓ Mensagem removida da roda.',
    bloquear: '✓ Mensagem removida. A participante ficará 24 horas sem poder enviar mensagens.',
    manter: '✓ Mensagem mantida. A denúncia foi arquivada.',
  }[b.dataset.acao];
  desenharModeracao();
});

$('.js-shifts').addEventListener('click', (e) => {
  const b = e.target.closest('[data-turno]');
  if (!b) return;
  const t = TURNOS[Number(b.dataset.turno)];
  t.minha = !t.minha;
  t.ocupadas += t.minha ? 1 : -1;
  desenharModeracao();
});

const MATERIAIS = [
  {
    titulo: 'Primeiro acolhimento',
    resumo: 'Como receber o primeiro contato com escuta e respeito.',
    cor: '#7B4FC4',
    conteudo: `
      <ul>
        <li><strong>Escute sem julgar</strong> e acredite no que ela conta.</li>
        <li><strong>Não peça detalhes</strong> do que aconteceu. Ela fala o que quiser, quando quiser.</li>
        <li><strong>Pergunte se ela está segura agora</strong> e se este é um bom momento para conversar.</li>
        <li><strong>Combine uma forma segura de contato</strong>: horários, se pode receber mensagens, se alguém tem acesso ao celular dela.</li>
        <li><strong>Respeite as decisões dela</strong>, mesmo que sejam diferentes do que você faria.</li>
        <li><strong>Não prometa o que não pode cumprir.</strong></li>
      </ul>`,
  },
  {
    titulo: 'Encaminhar para a rede',
    resumo: 'Qual serviço indicar em cada situação.',
    cor: '#2F6FB0',
    conteudo: `
      <ul>
        <li><strong>190 · Polícia Militar:</strong> perigo imediato.</li>
        <li><strong>180 · Central de Atendimento à Mulher:</strong> orientação e denúncia, 24h e gratuito.</li>
        <li><strong>Delegacia da Mulher:</strong> registro de ocorrência e pedido de medidas protetivas.</li>
        <li><strong>Centro de referência da mulher:</strong> acompanhamento psicológico, social e jurídico.</li>
        <li><strong>Defensoria Pública:</strong> assistência jurídica gratuita.</li>
        <li><strong>CRAS / CREAS:</strong> benefícios e proteção social.</li>
        <li><strong>192 · SAMU:</strong> emergência de saúde.</li>
        <li><strong>188 · CVV:</strong> apoio emocional, 24h.</li>
      </ul>
      <p>Use a busca do Elas por Elas para encontrar o endereço do serviço mais perto dela.</p>`,
  },
  {
    titulo: 'Código de conduta',
    resumo: 'Compromissos de toda voluntária da rede.',
    cor: '#B9553F',
    conteudo: `
      <ul>
        <li><strong>O atendimento é gratuito.</strong> Não cobre nem ofereça serviços pagos depois.</li>
        <li><strong>Sigilo:</strong> não compartilhe nada do que ela contar, nem com outras voluntárias.</li>
        <li><strong>Não registre relatos na plataforma.</strong> O Elas por Elas não guarda histórias.</li>
        <li><strong>Atue dentro da sua profissão</strong> e siga o código de ética do seu conselho.</li>
        <li><strong>Não leve conversas da roda para o privado.</strong></li>
      </ul>`,
  },
  {
    titulo: 'Moderar a roda',
    resumo: 'O que remover e como agir em alertas.',
    cor: '#2E7D5B',
    conteudo: `
      <p><strong>Remova mensagens com:</strong></p>
      <ul>
        <li>dados pessoais (telefone, endereço, nomes de outras pessoas);</li>
        <li>pedidos de contato privado;</li>
        <li>julgamentos ou culpa sobre a experiência de outra mulher;</li>
        <li>propaganda, vendas ou links;</li>
        <li>conteúdo violento ou ofensivo.</li>
      </ul>
      <p><strong>Em alertas de risco:</strong> responda com acolhimento, reforce o 188 (CVV) e, em perigo, o 190. Nunca tente resolver sozinha pelo privado.</p>`,
  },
  {
    titulo: 'Cuidando de quem cuida',
    resumo: 'Seu bem-estar também importa.',
    cor: '#C2185B',
    conteudo: `
      <ul>
        <li>Defina quantos atendimentos você consegue manter por semana.</li>
        <li>Use o botão de disponibilidade para fazer pausas sem culpa.</li>
        <li>Converse com colegas da sua área sobre casos difíceis, sem identificar ninguém.</li>
        <li>Se perceber cansaço intenso, procure apoio para você também.</li>
      </ul>`,
  },
];

$('.js-materials').innerHTML = MATERIAIS.map((m, i) => `
  <button type="button" class="pn-material" style="--mat:${m.cor}" data-mat="${i}">
    <span class="pn-material__bar"></span>
    <strong>${m.titulo}</strong>
    <span>${m.resumo}</span>
    <span class="pn-material__open">Ler guia →</span>
  </button>`).join('');

$('.js-materials').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mat]');
  if (!b) return;
  const m = MATERIAIS[Number(b.dataset.mat)];
  abrirJanela(`<h2 id="dlg-title" class="vol-dialog__name">${m.titulo}</h2><div class="pn-guide">${m.conteudo}</div>`);
});

$('.js-pass-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const nova = $('#c-nova').value;
  const msg = $('.js-pass-msg');
  if (!$('#c-atual').value) msg.textContent = 'Digite a senha atual.';
  else if (nova.length < 8 || !/[a-zA-Z]/.test(nova) || !/\d/.test(nova)) msg.textContent = 'A nova senha precisa de 8 caracteres, com letras e números.';
  else { msg.textContent = 'Senha alterada ✓'; e.target.reset(); }
});

$('.js-delete').addEventListener('click', () => {
  abrirJanela(`
    <h2 id="dlg-title" class="vol-dialog__name">Excluir sua conta?</h2>
    <p>Seu perfil sai da rede na hora e seus dados são apagados. Essa ação não pode ser desfeita.</p>
    <div class="vol-card__actions">
      <button type="button" class="btn btn--outline vol-btn js-close">Cancelar</button>
      <a href="index.html" class="btn btn--coral vol-btn">Excluir conta</a>
    </div>`);
});

if (MODO_TESTE) RODAS.acolhimento.mensagens.push(
  { autora: 'Maré', texto: 'Tem dias que eu penso em acabar com tudo.', risco: true, hora: '22:05' },
  { autora: 'Moderação', mod: true, auto: true, hora: '22:05',
    texto: 'Obrigada por confiar na roda. O que você sente importa. Por favor, ligue 188 (CVV): é gratuito e funciona 24h. Estamos aqui.' },
);

let rodaAtual = 'acolhimento';
const pausadas = new Set();

const listaRodas = $('.js-live-rooms');
const listaMsgsLive = $('.js-live-msgs');
const campoMod = $('#msg-mod');

const horaAgora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const CORES_AV = ['#7B4FC4', '#2E7D5B', '#C2185B', '#B9553F', '#2F6FB0', '#8E44AD'];
function corAvatar(nome) {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CORES_AV[h % CORES_AV.length];
}

function riscosAbertos(id) {
  return RODAS[id].mensagens.filter((m) => m.risco && !m.acompanhado && !m.removida).length;
}

function desenharRodasLive() {
  listaRodas.innerHTML = Object.entries(RODAS)
    .map(([id, r]) => {
      const n = riscosAbertos(id);
      return `
        <li>
          <button type="button" class="chat-room${id === rodaAtual ? ' is-active' : ''}" data-roda="${id}" style="--room:${r.cor}"
                  ${id === rodaAtual ? 'aria-current="true"' : ''}>
            <span class="chat-room__dot"></span>
            <span class="chat-room__body"><strong>${r.nome}</strong>${r.online ? `<small>${r.online} online</small>` : ''}</span>
            ${n ? `<span class="pn-live__flag" title="${n} sinal de risco">!</span>` : ''}
          </button>
        </li>`;
    }).join('');
}

function htmlMensagemLive(m, i) {
  if (m.mod) {
    return `
      <li class="chat-msg chat-msg--mod">
        <span class="chat-msg__avatar" aria-hidden="true">★</span>
        <div class="chat-msg__bubble">
          <span class="chat-msg__name">Moderação Elas por Elas${m.auto ? ' · resposta automática' : m.minha ? ' · você' : ''}</span>
          <p>${escapar(m.texto)}</p>
          <span class="chat-msg__meta"><time>${m.hora || ''}</time></span>
        </div>
      </li>`;
  }
  const pausada = pausadas.has(m.autora);
  return `
    <li class="chat-msg pn-live__msg${m.risco && !m.acompanhado ? ' is-risk' : ''}${m.removida ? ' is-removed' : ''}">
      <span class="chat-msg__avatar" style="--av:${corAvatar(m.autora)}" aria-hidden="true">${escapar(m.autora[0])}</span>
      <div class="chat-msg__bubble">
        <span class="chat-msg__name">${escapar(m.autora)}${pausada ? ' <em class="pn-live__paused">pausada 24h</em>' : ''}</span>
        ${m.risco && !m.acompanhado && !m.removida ? '<span class="pn-live__risk-tag">Sinal de risco</span>' : ''}
        <p>${m.removida ? 'Mensagem removida pela moderação.' : escapar(m.texto)}</p>
        <span class="chat-msg__meta">
          <time>${m.hora || ''}</time>
          ${m.removida ? '' : `
            ${m.risco && !m.acompanhado ? `<button type="button" class="chat-msg__act" data-acao="acompanhar" data-i="${i}">Marcar como acompanhado</button>` : ''}
            <button type="button" class="chat-msg__act" data-acao="remover" data-i="${i}">Remover</button>
            ${pausada ? '' : `<button type="button" class="chat-msg__act" data-acao="pausar" data-i="${i}">Pausar participante</button>`}`}
        </span>
      </div>
    </li>`;
}

function abrirRodaLive(id) {
  rodaAtual = id;
  const r = RODAS[id];
  $('.js-live-title').textContent = r.nome;
  $('.js-live-desc').textContent = r.online ? `${r.desc} · ${r.online} participantes online` : r.desc;
  listaMsgsLive.innerHTML = r.mensagens.map(htmlMensagemLive).join('');
  listaMsgsLive.scrollTop = listaMsgsLive.scrollHeight;
  desenharRodasLive();
}

listaRodas.addEventListener('click', (e) => {
  const b = e.target.closest('[data-roda]');
  if (b) abrirRodaLive(b.dataset.roda);
});

listaMsgsLive.addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao]');
  if (!b) return;
  const m = RODAS[rodaAtual].mensagens[Number(b.dataset.i)];
  if (b.dataset.acao === 'remover') m.removida = true;
  if (b.dataset.acao === 'acompanhar') m.acompanhado = true;
  if (b.dataset.acao === 'pausar') {
    pausadas.add(m.autora);
    m.removida = true;
  }
  const topo = listaMsgsLive.scrollTop;
  abrirRodaLive(rodaAtual);
  listaMsgsLive.scrollTop = topo;
});

$('.pn-live__templates').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tpl]');
  if (!b) return;
  campoMod.value = b.dataset.tpl;
  campoMod.focus();
});

campoMod.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $('.js-live-form').requestSubmit();
  }
});

$('.js-live-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = campoMod.value.trim();
  if (!texto) return;
  RODAS[rodaAtual].mensagens.push({ autora: 'Moderação', mod: true, minha: true, texto, hora: horaAgora() });
  campoMod.value = '';
  abrirRodaLive(rodaAtual);
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.js-go-risk')) abrirRodaLive('acolhimento');
});

atualizarCabecalho();
desenharStatus();
desenharProgresso();
preencherForm();
desenharPrevia();
desenharModeracao();
abrirRodaLive('acolhimento');
mostrarAba();
