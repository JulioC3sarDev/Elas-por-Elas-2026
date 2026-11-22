const CHAVE_SESSAO = 'elas.sessao';

// A sessão fica em sessionStorage para que a "Saída rápida" (sessionStorage.clear) também encerre o acesso.
const Sessao = {
  obter() {
    try {
      const s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO));
      if (s && s.expiraEm > Date.now()) return s;
    } catch (e) { /* sessão inválida */ }
    this.limpar();
    return null;
  },
  salvar(auth) {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({
      token: auth.token,
      usuaria: auth.usuaria,
      expiraEm: Date.now() + auth.expiraEmMinutos * 60000,
    }));
  },
  limpar() {
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) { /* ignorado */ }
  },
  token() {
    const s = this.obter();
    return s ? s.token : null;
  },
};

function usuariaLogada() {
  const s = Sessao.obter();
  return s ? s.usuaria : null;
}

class ApiErro extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function api(caminho, { metodo = 'GET', corpo, autenticada = false } = {}) {
  const headers = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  const token = Sessao.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch (e) {
    throw new ApiErro(0, 'Não foi possível conectar ao servidor. Tente novamente em instantes.');
  }

  if (resposta.status === 401 && autenticada) {
    Sessao.limpar();
    window.location.replace('login.html');
    throw new ApiErro(401, 'Sua sessão expirou. Entre novamente.');
  }

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const detalhe = dados && (dados.details || dados.error);
    throw new ApiErro(resposta.status, detalhe || 'Não foi possível concluir a operação.');
  }
  return dados;
}

const apenasData = (iso) => (iso ? iso.slice(0, 10) : null);
const primeiraCidade = (cidadeUf) => (cidadeUf || '').split(',')[0].trim();
const conhecidas = (lista, tabela) => (lista || []).filter((v) => v in tabela);

const CATEGORIA_POR_SERVICO = [
  ['DELEGACIA', 'DELEGACIA'],
  ['SAUDE_MULHER', 'SAUDE'],
  ['JURIDICO', 'DEFENSORIA'],
  ['ASSISTENCIA_SOCIAL', 'ASSISTENCIA'],
];

function categoriaDaUnidade(u, codigos) {
  if (u.categoria in CATEGORIAS_POSTO) return u.categoria;
  const achada = CATEGORIA_POR_SERVICO.find(([codigo]) => codigos.includes(codigo));
  return achada ? achada[1] : 'CENTRO_REFERENCIA';
}

function adaptarUnidade(u) {
  const servicos = u.servicos.map((s) => s.codigo);
  const modalidades = conhecidas(u.modalidades, MODALIDADES);
  return {
    id: u.id,
    tipoDestino: 'UNIDADE',
    nome: u.nome,
    municipio: u.cidade,
    bairro: u.bairro || '',
    endereco: u.endereco || 'Endereço não informado',
    telefone: u.telefone || '',
    descricao: u.descricao || '',
    servicos,
    verificadoEm: apenasData(u.verificadoEm || u.criadoEm),
    modalidades: modalidades.length ? modalidades : ['PRESENCIAL', 'TELEFONE'],
    categoriaPosto: categoriaDaUnidade(u, servicos),
    lat: u.latitude == null ? null : Number(u.latitude),
    lng: u.longitude == null ? null : Number(u.longitude),
    horario: u.horarioFuncionamento || 'Consulte por telefone',
  };
}

function adaptarProfissional(p) {
  const area = p.area in AREAS ? p.area : 'OUTRA';
  return {
    id: p.id,
    tipoDestino: 'PROFISSIONAL',
    nome: p.nome,
    municipio: primeiraCidade(p.cidadeUf),
    bairro: p.bairro || '',
    endereco: p.endereco || null,
    telefone: p.telefone || '',
    registro: p.registroProfissional || null,
    descricao: p.biografia || '',
    servicos: p.servicos.map((s) => s.codigo),
    verificadoEm: apenasData(p.verificadoEm),
    modalidades: conhecidas(p.modalidades, MODALIDADES),
    area,
    profissao: p.profissao || AREAS[area].nome,
    disponibilidade: p.disponibilidade || 'A combinar',
    bio: p.biografia || '',
    status: p.status,
    disponivel: p.ativa,
  };
}

async function carregarServicos() {
  SERVICOS.length = 0;
  const [unidades, profissionais] = await Promise.all([api('/unidades'), api('/profissionais')]);
  SERVICOS.push(...unidades.map(adaptarUnidade), ...profissionais.map(adaptarProfissional));
}

function carregarScript(src) {
  const el = document.createElement('script');
  el.src = src;
  document.body.appendChild(el);
}

function avisarErro(mensagem) {
  const aviso = document.createElement('div');
  aviso.className = 'results__empty';
  aviso.setAttribute('role', 'alert');
  aviso.innerHTML = `<h3>Não foi possível carregar os dados.</h3><p></p>`;
  aviso.querySelector('p').textContent = mensagem;
  const destino = document.querySelector('main') || document.body;
  destino.prepend(aviso);
}

const MEU_APOIO = new Map();

async function carregarMeuApoio() {
  MEU_APOIO.clear();
  if (!Sessao.token()) return [];
  const itens = await api('/meu-apoio');
  itens.forEach((i) => MEU_APOIO.set(i.unidadeId || i.profissionalId, i.id));
  return itens;
}

const SALVAR_ROTULO = 'Salvar em Meu apoio';
const SALVO_ROTULO = 'Salvo em Meu apoio';

function botaoSalvar(item) {
  if (!BACKEND_CONECTADO || MODO_TESTE) return '';
  const salvo = MEU_APOIO.has(item.id);
  return `<button type="button" class="save-btn js-save" data-id="${item.id}" data-tipo="${item.tipoDestino}" aria-pressed="${salvo}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    <span>${salvo ? SALVO_ROTULO : SALVAR_ROTULO}</span></button>`;
}

function marcarSalvo(id, salvo) {
  document.querySelectorAll(`.js-save[data-id="${id}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', salvo);
    b.querySelector('span').textContent = salvo ? SALVO_ROTULO : SALVAR_ROTULO;
  });
}

async function alternarSalvo(botao) {
  if (!Sessao.obter()) {
    const voltar = `${location.pathname.split('/').pop()}${location.search}`;
    window.location.href = `login.html?voltar=${encodeURIComponent(voltar)}`;
    return;
  }
  const { id, tipo } = botao.dataset;
  const rotulo = botao.querySelector('span');
  botao.disabled = true;
  try {
    if (MEU_APOIO.has(id)) {
      await api(`/meu-apoio/${MEU_APOIO.get(id)}`, { metodo: 'DELETE', autenticada: true });
      MEU_APOIO.delete(id);
    } else {
      const item = await api('/meu-apoio', {
        metodo: 'POST',
        corpo: tipo === 'UNIDADE' ? { unidadeId: id } : { profissionalId: id },
        autenticada: true,
      });
      MEU_APOIO.set(id, item.id);
    }
    marcarSalvo(id, MEU_APOIO.has(id));
  } catch (e) {
    if (e.status === 401) return;
    const antes = rotulo.textContent;
    rotulo.textContent = 'Não foi possível salvar. Tente de novo.';
    setTimeout(() => { rotulo.textContent = antes; }, 3000);
  } finally {
    botao.disabled = false;
  }
}

document.addEventListener('click', (e) => {
  const botao = e.target.closest('.js-save');
  if (botao) alternarSalvo(botao);
});

// Páginas públicas: busca os dados no servidor antes de executar o script da página.
async function iniciarComDados(src) {
  if (BACKEND_CONECTADO && !MODO_TESTE) {
    try {
      await carregarServicos();
    } catch (e) {
      avisarErro(e.message);
    }
    try {
      await carregarMeuApoio();
    } catch (e) { /* a página funciona sem os favoritos */ }
  }
  carregarScript(src);
}

document.querySelectorAll('.js-logout').forEach((el) => {
  el.addEventListener('click', () => Sessao.limpar());
});

let PERFIL_API = null;

function adaptarMeuPerfil(p) {
  const perfil = adaptarProfissional(p);
  perfil.verificadoEm = apenasData(p.verificadoEm);
  perfil.disponibilidade = p.disponibilidade || '';
  perfil.endereco = p.endereco || null;
  return perfil;
}

function corpoPerfil(perfil) {
  return {
    registroProfissional: perfil.registro,
    biografia: perfil.bio,
    cidadeUf: perfil.municipio ? `${perfil.municipio}, PE` : null,
    telefone: perfil.telefone,
    area: perfil.area,
    profissao: perfil.profissao,
    bairro: perfil.bairro,
    endereco: perfil.endereco,
    modalidades: perfil.modalidades,
    disponibilidade: perfil.disponibilidade,
    servicoCodigos: perfil.servicos,
  };
}

const salvarPerfil = (perfil) => api('/profissionais/me', { metodo: 'PUT', corpo: corpoPerfil(perfil), autenticada: true });
const definirDisponibilidade = (disponivel) =>
  api('/profissionais/me/disponibilidade', { metodo: 'PATCH', corpo: { disponivel }, autenticada: true });
const desativarMeuPerfil = () => api('/profissionais/me', { metodo: 'DELETE', autenticada: true });

// Painel: exige sessão e carrega o perfil da voluntária antes de executar o script da página.
async function iniciarPainel(src) {
  if (!BACKEND_CONECTADO || MODO_TESTE) {
    carregarScript(src);
    return;
  }
  if (!Sessao.obter()) {
    window.location.replace('login.html');
    return;
  }
  if (usuariaLogada().role === 'USER') {
    window.location.replace('meu-apoio.html');
    return;
  }
  try {
    PERFIL_API = adaptarMeuPerfil(await api('/profissionais/me', { autenticada: true }));
    carregarScript(src);
  } catch (e) {
    if (e.status === 401) return;
    avisarErro(e.status === 404
      ? 'Esta conta não tem um perfil de voluntária. Faça o cadastro de voluntária para usar o painel.'
      : e.message);
  }
}
