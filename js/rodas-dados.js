const RODAS = {
  acolhimento: {
    nome: 'Acolhimento',
    desc: 'Para chegar, se apresentar e desabafar.',
    cor: '#7B4FC4',
    online: 12,
    mensagens: [
      { autora: 'Moderação', mod: true, texto: 'Bem-vinda à roda de Acolhimento 💜 Aqui você pode falar no seu tempo. Lembre-se: use só o apelido e não compartilhe dados pessoais.' },
      { autora: 'Girassol', texto: 'Hoje foi um dia difícil, mas consegui conversar com alguém de confiança.' },
      { autora: 'Lua', texto: 'Que bom, Girassol. Esse primeiro passo é muito importante.' },
      { autora: 'Maré', texto: 'Cheguei agora. Ainda não sei bem o que falar, mas é bom saber que tem gente aqui.' },
      { autora: 'Orquídea', texto: 'Seja bem-vinda, Maré! Pode só ler também, sem pressa.' },
    ],
  },
  recomecos: {
    nome: 'Recomeços',
    desc: 'Vida nova, rotina nova, conquistas do dia a dia.',
    cor: '#2E7D5B',
    online: 8,
    mensagens: [
      { autora: 'Moderação', mod: true, texto: 'Esta roda é para celebrar recomeços, dos grandes aos pequenos.' },
      { autora: 'Jasmim', texto: 'Consegui meu primeiro emprego depois de muito tempo! Estou muito feliz.' },
      { autora: 'Estrela', texto: 'Parabéns, Jasmim!! Você merece demais.' },
    ],
  },
  maternidade: {
    nome: 'Mães',
    desc: 'Cuidar dos filhos enquanto cuida de si.',
    cor: '#C2185B',
    online: 6,
    mensagens: [
      { autora: 'Moderação', mod: true, texto: 'Roda para mães trocarem experiências. Não compartilhe nomes ou escolas das crianças.' },
      { autora: 'Violeta', texto: 'Alguém tem dica de como explicar a separação para uma criança de 6 anos?' },
      { autora: 'Açucena', texto: 'Eu busquei ajuda de uma psicóloga da rede, ajudou muito a encontrar as palavras.' },
    ],
  },
  autoestima: {
    nome: 'Autoestima',
    desc: 'Se reconhecer, se cuidar, se gostar.',
    cor: '#B9553F',
    online: 9,
    mensagens: [
      { autora: 'Moderação', mod: true, texto: 'Que tal começar dizendo uma coisa que você gosta em você?' },
      { autora: 'Aurora', texto: 'Eu gosto de como eu não desisto, mesmo cansada.' },
    ],
  },
};

const APELIDOS = ['Girassol', 'Lua', 'Orquídea', 'Maré', 'Estrela', 'Jasmim', 'Aurora', 'Violeta', 'Açucena'];

if (!MODO_TESTE) {
  Object.values(RODAS).forEach((r) => {
    r.mensagens = r.mensagens.filter((m) => m.mod);
    r.online = null;
  });
}
