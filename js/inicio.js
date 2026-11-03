document.querySelectorAll('.js-quick-exit').forEach((botao) => {
  botao.addEventListener('click', () => {
    try { sessionStorage.clear(); } catch (e) { }
    window.location.replace('https://www.google.com.br');
  });
});

document.querySelectorAll('.js-carousel').forEach((carrossel) => {
  const slides = carrossel.querySelectorAll('.carousel__slide');
  const dots = carrossel.querySelectorAll('.carousel__dot');
  let atual = 0;

  function mostrar(indice) {
    atual = (indice + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== atual; });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === atual);
      if (i === atual) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  carrossel.querySelector('.js-prev').addEventListener('click', () => mostrar(atual - 1));
  carrossel.querySelector('.js-next').addEventListener('click', () => mostrar(atual + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => mostrar(i)));

  carrossel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
    if (e.key === 'ArrowRight') mostrar(atual + 1);
  });
});
