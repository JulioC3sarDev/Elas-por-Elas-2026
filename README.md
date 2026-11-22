# Elas por Elas

## Como testar

1. Abra a pasta no **VS Code**.
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito no `index.html` e escolha **Open with Live Server**.

## Integração com o back-end

Com `BACKEND_CONECTADO = true` e `API_URL` em `js/config.js`, o site usa a API (`../elas-por-elas`):

1. Suba o banco e a API conforme o README do back-end (porta `8080`).
2. Abra o front com o Live Server na porta `5500` (a API libera essa origem via CORS; para outra, ajuste `CORS_ALLOWED_ORIGINS`).

Conectado à API: busca, mapa e voluntárias (`GET /unidades`, `GET /profissionais`), login, cadastro de voluntária e de usuária comum, **Meu apoio** e o painel (perfil, pausa e exclusão do perfil). A sessão (JWT) fica em `sessionStorage`, então a saída rápida também encerra o acesso.

### Usuária comum e Meu apoio

- `html/cadastro-usuaria.html` cria a conta (`POST /auth/cadastro`, papel `USER`); nome, e-mail e senha são obrigatórios, o município é opcional.
- Com a conta, os cards da busca, do mapa e das voluntárias mostram **Salvar em Meu apoio** (`POST`/`DELETE /meu-apoio`). Sem login, o botão leva ao login e volta para a mesma página.
- `html/meu-apoio.html` lista e remove o que foi salvo. Contas `USER` são enviadas para essa página no lugar do painel da voluntária.
- Os botões de salvar só aparecem com `BACKEND_CONECTADO = true`.

Continuam simulados: rodas/chat, moderação, materiais e troca de senha.
Unidades sem latitude/longitude não aparecem no mapa. Voluntárias só aparecem depois de verificadas por um ADMIN.

## Modo de teste

Com `BACKEND_CONECTADO = false`, todos os dados exibidos são **fictícios** (`MODO_TESTE = true`). A chave fica em `js/config.js`:

```js
const MODO_TESTE = true;
const BACKEND_CONECTADO = false;
const API_URL = 'http://localhost:8080/api/v1';
```
