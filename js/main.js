const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
  const aberto = menu.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', aberto);
  menuToggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
});

const ano = document.getElementById('ano');
if (ano) ano.textContent = new Date().getFullYear();

const perguntas = document.querySelectorAll('.faq__item');
perguntas.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      perguntas.forEach((outro) => { if (outro !== item) outro.open = false; });
    }
  });
});
