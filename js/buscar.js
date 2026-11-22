const ARVORE = {
  inicio: 'perigo',
  perguntas: {
    perigo: {
      texto: 'Você está em perigo agora ou com medo de que algo aconteça hoje?',
      ajuda: 'Se a resposta for sim, a primeira coisa é a sua segurança.',
      sim: 'emergencia',
      nao: 'violencia',
    },
    violencia: {
      texto: 'Você está passando ou já passou por alguma situação de violência?',
      ajuda: 'Pode ser física, psicológica, sexual, patrimonial (controle do seu dinheiro ou dos seus objetos) ou moral (humilhações e ofensas).',
      sim: 'ocorrencia',
      nao: 'direitos',
    },
    ocorrencia: {
      texto: 'Você quer registrar uma ocorrência ou pedir uma medida protetiva?',
      ajuda: 'A medida protetiva é uma ordem da Justiça que obriga a pessoa a ficar longe de você.',
      sim: 'delegacia',
      nao: 'acolhimento',
    },
    acolhimento: {
      texto: 'Você gostaria de ter alguém para conversar e te orientar sobre os próximos passos?',
      ajuda: 'Os centros de referência acolhem e orientam, sem obrigar você a denunciar.',
      sim: 'centro',
      nao: 'direitos',
    },
    direitos: {
      texto: 'Você tem dúvidas sobre seus direitos, como divórcio, guarda dos filhos ou pensão?',
      ajuda: 'Advogadas e a Defensoria Pública orientam de graça.',
      sim: 'juridico',
      nao: 'emocional',
    },
    emocional: {
      texto: 'Você sente que precisa de apoio para lidar com o que está sentindo?',
      ajuda: 'Tristeza, ansiedade, medo ou cansaço que não passam também merecem cuidado.',
      sim: 'psicologico',
      nao: 'renda',
    },
    renda: {
      texto: 'Você precisa de ajuda com renda, benefícios sociais ou moradia?',
      ajuda: 'Programas como o Bolsa Família e o aluguel social podem ajudar.',
      sim: 'social',
      nao: 'saude',
    },
    saude: {
      texto: 'Você precisa de cuidados de saúde, como consulta, exames ou saúde sexual?',
      ajuda: 'Há serviços de saúde voltados para mulheres na rede pública.',
      sim: 'saudeMulher',
      nao: 'trabalho',
    },
    trabalho: {
      texto: 'Você gostaria de apoio para conseguir trabalho ou voltar ao mercado?',
      ajuda: 'Voluntárias ajudam com currículo e preparação para entrevistas.',
      sim: 'carreira',
      nao: 'geral',
    },
  },
  resultados: {
    emergencia: {
      titulo: 'Sua segurança vem primeiro',
      servico: 'delegacia da mulher',
      texto: 'Ligue agora para o 190. Se puder, vá para um lugar seguro ou peça ajuda a alguém de confiança. Depois, a delegacia da mulher pode registrar a ocorrência e pedir uma medida protetiva.',
      tipos: ['DELEGACIA'],
      urgente: true,
    },
    delegacia: {
      titulo: 'Delegacia especializada',
      texto: 'A delegacia da mulher registra a ocorrência e pede a medida protetiva. A Defensoria Pública e advogadas voluntárias podem te acompanhar de graça.',
      tipos: ['DELEGACIA', 'JURIDICO'],
    },
    centro: {
      titulo: 'Centro de referência da mulher',
      texto: 'Um lugar para ser ouvida e orientada, com apoio psicológico, social e jurídico, no seu tempo e sem obrigação de denunciar.',
      tipos: ['VIOLENCIA_DOMESTICA', 'PSICOLOGICO'],
      excluir: ['DELEGACIA'],
    },
    juridico: {
      titulo: 'Orientação jurídica',
      texto: 'A Defensoria Pública e advogadas voluntárias explicam seus direitos e os próximos passos, sem custo.',
      tipos: ['JURIDICO'],
      excluir: ['DELEGACIA'],
    },
    psicologico: {
      titulo: 'Apoio psicológico',
      texto: 'Psicólogas da rede e voluntárias oferecem escuta e acompanhamento gratuitos.',
      tipos: ['PSICOLOGICO'],
    },
    social: {
      titulo: 'Assistência social',
      texto: 'O CRAS e assistentes sociais ajudam a acessar benefícios, programas de renda e moradia.',
      tipos: ['ASSISTENCIA_SOCIAL', 'APOIO_FINANCEIRO'],
    },
    saudeMulher: {
      titulo: 'Saúde da mulher',
      texto: 'Serviços de saúde e profissionais voluntárias orientam sobre consultas, exames e cuidados.',
      tipos: ['SAUDE_MULHER'],
    },
    carreira: {
      titulo: 'Orientação profissional',
      texto: 'Voluntárias ajudam com currículo, entrevistas e a volta ao mercado de trabalho.',
      tipos: ['ORIENTACAO_PROFISSIONAL'],
    },
    geral: {
      titulo: 'Acolhimento e orientação',
      texto: 'Pelas suas respostas, um bom começo é uma conversa de orientação. O 180 atende 24 horas, de graça, e os serviços abaixo também podem te ouvir.',
      tipos: ['PSICOLOGICO', 'ASSISTENCIA_SOCIAL', 'JURIDICO'],
      excluir: ['DELEGACIA'],
    },
  },
};

const MAIOR_CAMINHO = 9;

const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const formatarData = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

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
        ${botaoSalvar(s)}
      </div>
    </article>`;
}

const telaPergunta = document.querySelector('.js-pergunta');
const telaResultado = document.querySelector('.js-resultado');
const numeroPergunta = document.querySelector('.js-numero');
const barra = document.querySelector('.js-barra');
const textoPergunta = document.querySelector('.js-texto');
const ajudaPergunta = document.querySelector('.js-ajuda');
const btnVoltar = document.querySelector('.js-voltar');
const btnRecomecar = document.querySelectorAll('.js-recomecar');

const form = document.querySelector('.js-search-form');
const selMunicipio = document.getElementById('municipio');
const inputBairro = document.getElementById('bairro');
const listaBairros = document.getElementById('lista-bairros');
const erroMunicipio = document.getElementById('municipio-erro');
const secResultados = document.getElementById('resultados');
const listaResultados = document.querySelector('.js-results');
const resumo = document.querySelector('.js-summary');

let historico = [];
let resultadoAtual = null;

const municipios = [...new Set([...SERVICOS.map((s) => s.municipio), ...Object.keys(BAIRROS)])]
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));
municipios.forEach((m) => selMunicipio.add(new Option(m, m)));

selMunicipio.addEventListener('change', () => {
  listaBairros.innerHTML = '';
  (BAIRROS[selMunicipio.value] || []).forEach((b) => listaBairros.appendChild(new Option(b)));
  if (selMunicipio.value) {
    selMunicipio.removeAttribute('aria-invalid');
    erroMunicipio.textContent = '';
  }
});

function mostrarPergunta(id) {
  const p = ARVORE.perguntas[id];
  const numero = historico.length + 1;
  telaResultado.hidden = true;
  secResultados.hidden = true;
  telaPergunta.hidden = false;
  numeroPergunta.textContent = `Pergunta ${numero}`;
  barra.style.width = `${Math.min(numero / MAIOR_CAMINHO, 1) * 100}%`;
  textoPergunta.textContent = p.texto;
  ajudaPergunta.textContent = p.ajuda || '';
  btnVoltar.hidden = historico.length === 0;
  telaPergunta.dataset.atual = id;
  telaPergunta.classList.remove('is-trocando');
  void telaPergunta.offsetWidth;
  telaPergunta.classList.add('is-trocando');
  textoPergunta.focus({ preventScroll: true });
}

function mostrarResultado(id) {
  const r = ARVORE.resultados[id];
  resultadoAtual = r;
  telaPergunta.hidden = true;
  telaResultado.hidden = false;
  telaResultado.classList.toggle('is-urgente', Boolean(r.urgente));
  telaResultado.querySelector('.js-res-titulo').textContent = r.titulo;
  telaResultado.querySelector('.js-res-texto').textContent = r.texto;
  telaResultado.querySelector('.js-res-sos').hidden = !r.urgente;
  telaResultado.querySelector('.js-res-titulo').focus({ preventScroll: true });
  telaResultado.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function responder(resposta) {
  const atual = telaPergunta.dataset.atual;
  const proximo = ARVORE.perguntas[atual][resposta];
  historico.push(atual);
  if (ARVORE.perguntas[proximo]) mostrarPergunta(proximo);
  else mostrarResultado(proximo);
}

document.querySelectorAll('[data-resposta]').forEach((b) => {
  b.addEventListener('click', () => responder(b.dataset.resposta));
});

btnVoltar.addEventListener('click', () => {
  const anterior = historico.pop();
  if (anterior) mostrarPergunta(anterior);
});

document.querySelector('.js-res-voltar').addEventListener('click', () => {
  const anterior = historico.pop();
  if (anterior) mostrarPergunta(anterior);
});

btnRecomecar.forEach((b) => b.addEventListener('click', () => {
  historico = [];
  resultadoAtual = null;
  mostrarPergunta(ARVORE.inicio);
  document.querySelector('.tree').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  if (!selMunicipio.value) {
    selMunicipio.setAttribute('aria-invalid', 'true');
    erroMunicipio.textContent = 'Escolha um município para ver os serviços.';
    selMunicipio.focus();
    return;
  }

  const r = resultadoAtual;
  const bairroNorm = normalizar(inputBairro.value);
  const doMunicipio = SERVICOS.filter((s) =>
    s.municipio === selMunicipio.value
    && s.servicos.some((t) => r.tipos.includes(t))
    && !(r.excluir || []).some((t) => s.servicos.includes(t)));

  let itens = doMunicipio;
  let noBairro = null;
  if (bairroNorm) {
    const perto = doMunicipio.filter((s) => normalizar(s.bairro).includes(bairroNorm));
    itens = [...perto, ...doMunicipio.filter((s) => !perto.includes(s))];
    noBairro = perto.length;
  }

  let texto = `${itens.length} ${itens.length === 1 ? 'serviço' : 'serviços'} de ${r.servico || r.titulo.toLowerCase()} em ${selMunicipio.value}`;
  if (inputBairro.value.trim() && itens.length) {
    texto += noBairro
      ? ` · ${noBairro} no bairro ${inputBairro.value.trim()}, mostrados primeiro`
      : ` · nenhum no bairro ${inputBairro.value.trim()}, mostrando o restante do município`;
  }
  resumo.textContent = texto;

  listaResultados.innerHTML = itens.length
    ? itens.map(cardResultado).join('')
    : `<div class="results__empty">
         <h3>Ainda não encontramos esse serviço na sua cidade.</h3>
         <p>Ligue para o <a href="tel:180"><strong>180</strong></a>: a Central de Atendimento à Mulher orienta sobre a rede de apoio do seu município, 24 horas e de graça.</p>
       </div>`;

  secResultados.hidden = false;
  document.getElementById('resultados-titulo').focus({ preventScroll: true });
  secResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

mostrarPergunta(ARVORE.inicio);
