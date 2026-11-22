const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const lista = document.querySelector('.js-lista');
const contador = document.querySelector('.js-count');

let salvos = [];

function textoVazio(titulo, corpo) {
  return `<div class="results__empty"><h3>${titulo}</h3><p>${corpo}</p></div>`;
}

function cardSalvo(item) {
  const alvoId = item.unidadeId || item.profissionalId;
  const s = SERVICOS.find((x) => x.id === alvoId);
  const ehUnidade = Boolean(item.unidadeId);
  const nome = escapar(s ? s.nome : (item.unidadeNome || item.profissionalNome));
  const telLimpo = s ? s.telefone.replace(/\D/g, '') : '';

  const local = s
    ? (s.endereco
      ? `${escapar(s.endereco)} · ${escapar(s.bairro)}, ${escapar(s.municipio)}`
      : `Atendimento à distância · ${escapar(s.municipio)}`)
    : '';

  return `
    <article class="result-card ${ehUnidade ? 'result-card--unidade' : 'result-card--prof'}" data-item="${item.id}">
      <div class="result-card__top">
        <span class="result-card__type">${ehUnidade ? 'Serviço público' : 'Voluntária'}</span>
      </div>
      <h3 class="result-card__name">${nome}</h3>
      ${s ? `
        <p class="result-card__place">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${local}
        </p>
        <p class="result-card__modes">${s.modalidades.map((m) => MODALIDADES[m]).join(' · ')}</p>`
    : '<p class="apoio-aviso">Este contato não está disponível no momento. Você pode removê-lo da sua lista.</p>'}
      <div class="result-card__actions">
        ${s && telLimpo ? `<a class="btn btn--dark result-card__call" href="tel:${telLimpo}">${escapar(s.telefone)}</a>` : ''}
        <button type="button" class="save-btn js-remover" data-item="${item.id}">Remover de Meu apoio</button>
      </div>
    </article>`;
}

function desenhar() {
  contador.textContent = `${salvos.length} ${salvos.length === 1 ? 'item salvo' : 'itens salvos'}`;
  lista.innerHTML = salvos.length
    ? salvos.map(cardSalvo).join('')
    : textoVazio(
      'Você ainda não salvou nada.',
      'Ao buscar, toque em <strong>Salvar em Meu apoio</strong> para guardar serviços e voluntárias aqui. '
      + '<a href="buscar.html">Buscar apoio</a> · <a href="mapa.html">Ver mapa</a>',
    );
}

lista.addEventListener('click', async (e) => {
  const botao = e.target.closest('.js-remover');
  if (!botao) return;
  botao.disabled = true;
  try {
    await api(`/meu-apoio/${botao.dataset.item}`, { metodo: 'DELETE', autenticada: true });
    salvos = salvos.filter((i) => i.id !== botao.dataset.item);
    desenhar();
  } catch (erro) {
    if (erro.status === 401) return;
    botao.disabled = false;
    botao.textContent = 'Não foi possível remover. Tente de novo.';
  }
});

async function iniciar() {
  const usuaria = usuariaLogada();
  if (!usuaria) {
    window.location.replace('login.html?voltar=meu-apoio.html');
    return;
  }
  document.querySelector('.js-nome').textContent = usuaria.nome.split(' ')[0];

  try {
    await carregarServicos();
    salvos = await api('/meu-apoio', { autenticada: true });
    desenhar();
  } catch (erro) {
    if (erro.status === 401) return;
    lista.innerHTML = textoVazio('Não foi possível carregar sua lista.', escapar(erro.message));
  } finally {
    lista.removeAttribute('aria-busy');
  }
}

if (!BACKEND_CONECTADO) {
  lista.innerHTML = textoVazio('Meu apoio ainda não está disponível.', 'O sistema não está conectado ao servidor.');
  lista.removeAttribute('aria-busy');
} else {
  iniciar();
}
