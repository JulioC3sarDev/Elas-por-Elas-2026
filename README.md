# Elas por Elas

## Como testar

1. Abra a pasta no **VS Code**.
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito no `index.html` e escolha **Open with Live Server**.

O site abre em `http://127.0.0.1:5500` e atualiza sozinho a cada alteração salva.

> O mapa e as fontes vêm da internet, então é preciso estar conectado.

## Modo de teste

Todos os dados exibidos são **fictícios**. A chave fica em `js/config.js`:

```js
const MODO_TESTE = true;
const BACKEND_CONECTADO = false;
```
