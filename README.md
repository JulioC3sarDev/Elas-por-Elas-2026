# Elas por Elas — Front-end

Tela inicial do protótipo, em HTML, CSS e JavaScript puros (sem framework).

## Estrutura

```
elas-por-elas/
├── index.html        # Tela inicial
├── css/style.css     # Estilos (cores e fontes do Figma em :root)
├── js/main.js        # Menu mobile, troca de idioma, FAQ
└── assets/img/       # Imagens exportadas do Figma
```

## Imagens para exportar do Figma

Salve em `assets/img/` com exatamente estes nomes:

| Arquivo | Onde aparece |
|---|---|
| `hero-punhos.png` | Ilustração dos punhos no topo |
| `icone-ajuda.png` | Card "Quero buscar ajuda" |
| `icone-voluntaria.png` | Card "Quero ser voluntária" (megafone) |
| `sobre-mulher.png` | Foto da seção "Somos uma organização..." |
| `mapa-mulher.png` | Ilustração da seção do mapa |
| `mao-simbolo.png` | Mão com símbolo feminino (FAQ) |

Exporte as ilustrações em PNG com fundo transparente, em 2x.

## Como rodar

Abra `index.html` no navegador, ou use a extensão Live Server do VS Code.

## Próximas telas

`login.html`, `cadastro.html`, `buscar.html` (formulário de busca),
`mapa.html`, `meu-apoio.html`.

Observação: a tela de cadastro do protótipo pede CPF e telefone, mas o documento
do projeto diz que esses dados não serão coletados (só nome, e-mail e senha).
Vale alinhar com a equipe antes de codar essa tela.

## Modo de teste (dados fictícios)

Todos os dados exibidos hoje (serviços, postos no mapa, voluntárias, conversas da
roda, denúncias e perfil do painel) são **fictícios**. A chave fica em `js/config.js`:

```js
const MODO_TESTE = true;        // true = mostra os dados fictícios
const BACKEND_CONECTADO = false; // true = login/cadastro enviados à API Spring
```

- `MODO_TESTE = true`: mostra os exemplos, o selo "Modo de teste" no canto da tela
  e o login entra direto no painel.
- `MODO_TESTE = false`: esconde todos os dados fictícios. As telas ficam vazias até
  o back-end enviar os dados reais.
