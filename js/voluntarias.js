const VOLUNTARIAS = SERVICOS.filter((s) => s.tipoDestino === 'PROFISSIONAL');

const grid = document.querySelector('.js-grid');
const contador = document.querySelector('.js-count');
const boxAreas = document.querySelector('.js-areas-filter');
const inputBusca = document.getElementById('busca-vol');
const selMunicipio = document.getElementById('municipio-vol');
const selModalidade = document.getElementById('modalidade-vol');
const dialog = document.querySelector('.js-dialog');
const dialogBody = document.querySelector('.js-dialog-body');

let areaAtiva = '';

const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const formatarData = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
const soDigitos = (t) => t.replace(/\D/g, '');

function iniciais(nome) {
  const partes = nome.replace(/\(.*?\)/g, '').trim().split(/\s+/);
  return (partes[0][0] + (partes[partes.length - 1][0] || '')).toUpperCase();
}

const ICONES_MOD = {
  PRESENCIAL: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  ONLINE: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>',
  TELEFONE: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  WHATSAPP: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
};
const iconeMod = (m) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES_MOD[m]}</svg>`;

document.querySelector('.js-total').textContent = VOLUNTARIAS.length;
document.querySelector('.js-areas').textContent = new Set(VOLUNTARIAS.map((v) => v.area)).size;

Object.entries(AREAS).forEach(([area, { nome, cor }]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'vol-area';
  b.dataset.area = area;
  b.setAttribute('aria-pressed', 'false');
  b.style.setProperty('--area', cor);
  b.innerHTML = `<span class="map-filter__dot" style="--pin:${cor}"></span>${nome}`;
  boxAreas.appendChild(b);
});

[...new Set(VOLUNTARIAS.map((v) => v.municipio))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  .forEach((m) => selMunicipio.add(new Option(m, m)));
Object.entries(MODALIDADES).forEach(([valor, nome]) => selModalidade.add(new Option(nome, valor)));

boxAreas.addEventListener('click', (e) => {
  const botao = e.target.closest('.vol-area');
  if (!botao) return;
  areaAtiva = botao.dataset.area;
  boxAreas.querySelectorAll('.vol-area').forEach((b) => {
    b.classList.toggle('is-active', b === botao);
    b.setAttribute('aria-pressed', b === botao);
  });
  desenhar();
});
inputBusca.addEventListener('input', desenhar);
selMunicipio.addEventListener('change', desenhar);
selModalidade.addEventListener('change', desenhar);

function botoesContato(v) {
  const zap = v.modalidades.includes('WHATSAPP')
    ? `<a class="btn btn--dark vol-btn" href="https://wa.me/55${soDigitos(v.telefone)}" target="_blank" rel="noopener">
         ${iconeMod('WHATSAPP')} WhatsApp</a>`
    : '';
  const ligar = `<a class="btn ${zap ? 'btn--outline' : 'btn--dark'} vol-btn" href="tel:${soDigitos(v.telefone)}">
       ${iconeMod('TELEFONE')} Ligar</a>`;
  return zap + ligar;
}

function card(v) {
  const area = AREAS[v.area];
  return `
    <article class="vol-card" style="--area:${area.cor}">
      <div class="vol-card__top">
        <span class="vol-avatar" aria-hidden="true">${iniciais(v.nome)}</span>
        <div class="vol-card__who">
          <h3 class="vol-card__name">${escapar(v.nome)}</h3>
          <p class="vol-card__prof">${escapar(v.profissao)}${v.registro ? ` · ${escapar(v.registro)}` : ''}</p>
        </div>
        <span class="vol-card__verified" title="Verificado em ${formatarData(v.verificadoEm)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span class="sr-only">Verificada</span>
        </span>
      </div>

      <p class="vol-card__bio">${escapar(v.bio)}</p>

      <ul class="vol-card__mods" aria-label="Formas de atendimento">
        ${v.modalidades.map((m) => `<li>${iconeMod(m)}${MODALIDADES[m]}</li>`).join('')}
      </ul>

      <p class="vol-card__meta">
        <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${escapar(v.municipio)}</span>
        <span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${escapar(v.disponibilidade)}</span>
      </p>

      <div class="vol-card__actions">
        <button type="button" class="vol-card__more" data-id="${v.id}">Ver perfil</button>
        ${botoesContato(v)}
      </div>
    </article>`;
}

function desenhar() {
  const termo = normalizar(inputBusca.value);
  const itens = VOLUNTARIAS.filter((v) =>
    (!areaAtiva || v.area === areaAtiva)
    && (!selMunicipio.value || v.municipio === selMunicipio.value)
    && (!selModalidade.value || v.modalidades.includes(selModalidade.value))
    && (!termo || normalizar(`${v.nome} ${v.profissao} ${v.bio} ${v.servicos.map((t) => TIPOS_SERVICO[t]).join(' ')}`).includes(termo)));

  contador.textContent = `${itens.length} ${itens.length === 1 ? 'profissional' : 'profissionais'}`;
  grid.innerHTML = itens.length
    ? itens.map(card).join('')
    : VOLUNTARIAS.length === 0
      ? `<div class="results__empty">
           <h3>Ainda não há voluntárias publicadas.</h3>
           <p>Para orientação imediata, ligue <a href="tel:180"><strong>180</strong></a>.</p>
         </div>`
      : `<div class="results__empty">
         <h3>Nenhuma profissional com esses filtros.</h3>
         <p>Tente outra área ou forma de atendimento. Para orientação imediata, ligue
            <a href="tel:180"><strong>180</strong></a>.</p>
       </div>`;
}

grid.addEventListener('click', (e) => {
  const botao = e.target.closest('.vol-card__more');
  if (!botao) return;
  const v = VOLUNTARIAS.find((x) => x.id === Number(botao.dataset.id));
  const area = AREAS[v.area];

  dialogBody.style.setProperty('--area', area.cor);
  dialogBody.innerHTML = `
    <button type="button" class="vol-dialog__close js-close" aria-label="Fechar perfil">×</button>
    <div class="vol-card__top">
      <span class="vol-avatar vol-avatar--lg" aria-hidden="true">${iniciais(v.nome)}</span>
      <div>
        <span class="vol-dialog__area">${area.nome}</span>
        <h2 id="perfil-nome" class="vol-dialog__name">${escapar(v.nome)}</h2>
        <p class="vol-card__prof">${escapar(v.profissao)}${v.registro ? ` · ${escapar(v.registro)}` : ''}</p>
      </div>
    </div>

    <p class="vol-dialog__verified">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
      Registro verificado pela equipe em ${formatarData(v.verificadoEm)}
    </p>

    <h3>Sobre</h3>
    <p>${escapar(v.bio)}</p>

    <h3>Como pode te ajudar</h3>
    <ul class="result-card__tags">${v.servicos.map((t) => `<li>${escapar(TIPOS_SERVICO[t])}</li>`).join('')}</ul>

    <div class="vol-dialog__grid">
      <div><h3>Atendimento</h3><ul class="vol-card__mods">${v.modalidades.map((m) => `<li>${iconeMod(m)}${MODALIDADES[m]}</li>`).join('')}</ul></div>
      <div><h3>Disponibilidade</h3><p>${escapar(v.disponibilidade)}</p></div>
      <div><h3>Onde</h3><p>${escapar(v.endereco || 'Atendimento à distância')} · ${escapar(v.municipio)}</p></div>
    </div>

    <div class="vol-dialog__tips">
      <strong>Antes do primeiro contato</strong>
      <ul>
        <li>Diga que encontrou a profissional pelo Elas por Elas.</li>
        <li>Você não precisa contar sua história logo de início.</li>
        <li>O atendimento é gratuito. Ninguém pode cobrar por ele.</li>
      </ul>
    </div>

    <div class="vol-card__actions">${botoesContato(v)}</div>

    <button type="button" class="vol-dialog__report js-report">Algo errado com este perfil? Avisar a equipe</button>
    <p class="vol-dialog__report-msg js-report-msg" role="status" aria-live="polite"></p>`;

  dialog.showModal();
});

dialog.addEventListener('click', (e) => {
  if (e.target.closest('.js-close') || e.target === dialog) dialog.close();
  if (e.target.closest('.js-report')) {
    dialog.querySelector('.js-report-msg').textContent = 'Obrigada por avisar. A equipe vai revisar este perfil.';
  }
});

desenhar();
