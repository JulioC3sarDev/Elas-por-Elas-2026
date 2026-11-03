const form = document.querySelector('.js-search-form');
const selMunicipio = document.getElementById('municipio');
const inputBairro = document.getElementById('bairro');
const listaBairros = document.getElementById('lista-bairros');
const selDestino = document.getElementById('destino');
const secResultados = document.getElementById('resultados');
const listaResultados = document.querySelector('.js-results');
const resumo = document.querySelector('.js-summary');
const contador = document.querySelector('.js-count');
const erroMunicipio = document.getElementById('municipio-erro');

const municipios = [...new Set([...SERVICOS.map((s) => s.municipio), ...Object.keys(BAIRROS)])]
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));
municipios.forEach((m) => selMunicipio.add(new Option(m, m)));

contador.textContent = SERVICOS.length
  ? `${SERVICOS.length} serviços cadastrados em Pernambuco${MODO_TESTE ? ' (dados de exemplo)' : ''}`
  : 'Os serviços cadastrados aparecem aqui assim que o sistema estiver conectado.';

selMunicipio.addEventListener('change', () => {
  listaBairros.innerHTML = '';
  (BAIRROS[selMunicipio.value] || []).forEach((b) => listaBairros.appendChild(new Option(b)));
  if (selMunicipio.value) {
    selMunicipio.removeAttribute('aria-invalid');
    erroMunicipio.textContent = '';
  }
});

const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const formatarData = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

function buscar({ destino, municipio, bairro, tipos, modalidades }) {
  const bairroNorm = normalizar(bairro);

  const doMunicipio = SERVICOS.filter((s) =>
    s.municipio === municipio
    && (destino === 'TODOS' || s.tipoDestino === destino)
    && (tipos.length === 0 || s.servicos.some((t) => tipos.includes(t)))
    && (modalidades.length === 0 || s.modalidades.some((m) => modalidades.includes(m))));

  if (!bairroNorm) return { itens: doMunicipio, noBairro: null };

  const noBairro = doMunicipio.filter((s) => normalizar(s.bairro).includes(bairroNorm));
  const outros = doMunicipio.filter((s) => !noBairro.includes(s));
  return { itens: [...noBairro, ...outros], noBairro: noBairro.length };
}

function cardResultado(s) {
  const ehUnidade = s.tipoDestino === 'UNIDADE';
  const telLimpo = s.telefone.replace(/\D/g, '');
  const local = s.endereco
    ? `${escapar(s.endereco)} · ${escapar(s.bairro)}, ${escapar(s.municipio)}`
    : `Atendimento à distância · ${escapar(s.municipio)}`;
  const zap = s.modalidades.includes('WHATSAPP')
    ? `<a class="btn btn--outline result-card__zap" href="https://wa.me/55${telLimpo}" target="_blank" rel="noopener">WhatsApp</a>`
    : '';

  return `
    <article class="result-card ${ehUnidade ? 'result-card--unidade' : 'result-card--prof'}">
      <div class="result-card__top">
        <span class="result-card__type">${ehUnidade ? 'Serviço público' : 'Voluntária'}</span>
        <span class="result-card__verified">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          Verificado
        </span>
      </div>

      <h3 class="result-card__name">${escapar(s.nome)}</h3>
      <p class="result-card__place">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        ${local}
      </p>
      <p class="result-card__modes">${s.modalidades.map((m) => MODALIDADES[m]).join(' · ')}</p>

      <ul class="result-card__tags">
        ${s.servicos.map((t) => `<li>${escapar(TIPOS_SERVICO[t])}</li>`).join('')}
      </ul>

      <details class="result-card__details">
        <summary>Ver detalhes</summary>
        <dl>
          <dt>Sobre</dt><dd>${escapar(s.descricao)}</dd>
          ${s.registro ? `<dt>Registro profissional</dt><dd>${escapar(s.registro)}</dd>` : ''}
          <dt>Verificado em</dt><dd>${formatarData(s.verificadoEm)}</dd>
        </dl>
      </details>

      <div class="result-card__actions">
        <a class="btn btn--dark result-card__call" href="tel:${telLimpo}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>
          ${escapar(s.telefone)}
        </a>
        ${zap}
      </div>
    </article>`;
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  if (!selMunicipio.value) {
    selMunicipio.setAttribute('aria-invalid', 'true');
    erroMunicipio.textContent = 'Escolha um município para buscar.';
    selMunicipio.scrollIntoView({ behavior: 'smooth', block: 'center' });
    selMunicipio.focus({ preventScroll: true });
    return;
  }

  const dados = new FormData(form);
  const tipos = dados.getAll('categoria').flatMap((c) => CATEGORIAS[c]);

  const filtros = {
    destino: selDestino.value,
    municipio: selMunicipio.value,
    bairro: inputBairro.value,
    tipos,
    modalidades: dados.getAll('modalidade'),
  };

  const { itens, noBairro } = buscar(filtros);

  let texto = `${itens.length} ${itens.length === 1 ? 'resultado' : 'resultados'} em ${filtros.municipio}`;
  if (filtros.bairro.trim() && itens.length) {
    texto += noBairro
      ? ` · ${noBairro} no bairro ${filtros.bairro.trim()}, mostrados primeiro`
      : ` · nenhum no bairro ${filtros.bairro.trim()}, mostrando o restante do município`;
  }
  resumo.textContent = texto;

  listaResultados.innerHTML = itens.length
    ? itens.map(cardResultado).join('')
    : `<div class="results__empty">
         <h3>Não encontramos serviços com esses filtros.</h3>
         <p>Tente tirar alguns filtros ou escolher outro município. Você também pode ligar para o
            <a href="tel:180"><strong>180</strong></a>, que orienta sobre a rede de apoio da sua cidade.</p>
       </div>`;

  secResultados.hidden = false;
  document.getElementById('resultados-titulo').focus({ preventScroll: true });
  secResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
