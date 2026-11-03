const MODO_TESTE = false;

const BACKEND_CONECTADO = false;

document.addEventListener('DOMContentLoaded', () => {
  if (MODO_TESTE) {
    const selo = document.createElement('div');
    selo.className = 'test-badge';
    selo.setAttribute('role', 'note');
    selo.innerHTML = '<strong>Modo de teste</strong> · dados fictícios';
    document.body.appendChild(selo);
  } else {
    document.querySelectorAll('.demo-note, .map-demo, .chat-demo').forEach((el) => { el.hidden = true; });
  }
});
