(() => {
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduzir || !('IntersectionObserver' in window)) return;

  const SELETORES = [
    '.hero__text', '.hero__image', '.choice-card', '.about__inner', '.map-cta__content', '.map-cta__image',
    '.faq__image', '.faq__content', '.emergency__box', '.footer__box',
    '.welcome__box', '.path-card', '.section-title', '.carousel', '.feature', '.expect-card',
    '.fs-hero__inner', '.fs-urgent', '.fs-section-title', '.type-card', '.fs-card', '.fs-private', '.fs-submit',
    '.fs-count', '.fs-together__box',
    '.map-intro', '.map-app',
    '.vol-hero__box', '.vol-filters', '.vol-list__head', '.vol-how__grid li', '.vol-cta',
    '.chat-join__info', '.chat-join__form',
    '.auth__card',
    '.qs-hero__box', '.qs-why__grid > *', '.qs-title', '.qs-card', '.qs-limits__content', '.qs-limits__image',
    '.qs-values article', '.qs-team__box', '.qs-cta__card',
  ].join(',');

  const elementos = [...document.querySelectorAll(SELETORES)].filter((el) => !el.closest('[hidden]'));
  if (!elementos.length) return;

  document.documentElement.classList.add('anima');

  const grupos = new Map();
  elementos.forEach((el) => {
    const pai = el.parentElement;
    const ordem = grupos.get(pai) || 0;
    grupos.set(pai, ordem + 1);
    el.style.setProperty('--atraso', `${Math.min(ordem, 5) * 90}ms`);
    el.classList.add('revelar');
  });

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      el.classList.add('visivel');
      observador.unobserve(el);
      const atraso = parseInt(el.style.getPropertyValue('--atraso'), 10) || 0;
      setTimeout(() => {
        el.classList.remove('revelar', 'visivel');
        el.style.removeProperty('--atraso');
      }, 750 + atraso);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elementos.forEach((el) => observador.observe(el));
})();
