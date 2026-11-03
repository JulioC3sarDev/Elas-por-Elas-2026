const POSTOS = SERVICOS.filter((s) => s.lat && s.lng);
const CENTRO_RECIFE = [-8.0476, -34.8770];

const lista = document.querySelector('.js-list');
const contador = document.querySelector('.js-count');
const inputBusca = document.getElementById('busca-posto');
const selMunicipio = document.getElementById('municipio-mapa');
const boxFiltros = document.querySelector('.map-filters');
const btnLocalizar = document.querySelector('.js-locate');
const statusLocal = document.querySelector('.js-locate-status');
const legenda = document.querySelector('.js-legend');

let posicaoUsuaria = null;
let marcadorUsuaria = null;
let categoriaAtiva = '';
let selecionadoId = null;

const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

function distanciaKm([lat1, lng1], [lat2, lng2]) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const formatarKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`);

const ICONES = {
  DELEGACIA: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  CENTRO_REFERENCIA: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  DEFENSORIA: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7 2 14a3 3 0 0 0 6 0Z"/><path d="m19 7-3 7a3 3 0 0 0 6 0Z"/>',
  SAUDE: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  ASSISTENCIA: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
};
const svg = (cat) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[cat]}</svg>`;

const mapa = L.map('mapa', { zoomControl: false, scrollWheelZoom: true }).setView(CENTRO_RECIFE, 12);
L.control.zoom({ position: 'bottomright' }).addTo(mapa);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(mapa);

function iconePino(cat, ativo = false) {
  const cor = CATEGORIAS_POSTO[cat].cor;
  return L.divIcon({
    className: '',
    html: `<span class="map-pin${ativo ? ' is-active' : ''}" style="--pin:${cor}">${svg(cat)}</span>`,
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
  });
}

function htmlPopup(p) {
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  return `
    <div class="map-popup">
      <span class="map-popup__cat" style="--pin:${CATEGORIAS_POSTO[p.categoriaPosto].cor}">${CATEGORIAS_POSTO[p.categoriaPosto].nome}</span>
      <strong>${escapar(p.nome)}</strong>
      <span>${escapar(p.endereco)} · ${escapar(p.bairro)}</span>
      <span class="map-popup__hours">${escapar(p.horario)}</span>
      <div class="map-popup__actions">
        <a href="tel:${p.telefone.replace(/\D/g, '')}">Ligar</a>
        <a href="${rota}" target="_blank" rel="noopener">Como chegar</a>
      </div>
    </div>`;
}

const marcadores = new Map();
POSTOS.forEach((p) => {
  const m = L.marker([p.lat, p.lng], { icon: iconePino(p.categoriaPosto), title: p.nome, alt: p.nome })
    .bindPopup(htmlPopup(p), { maxWidth: 260 })
    .on('click', () => selecionar(p.id, false));
  marcadores.set(p.id, m);
});

Object.entries(CATEGORIAS_POSTO).forEach(([cat, { nome, cor }]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'map-filter';
  b.dataset.cat = cat;
  b.setAttribute('aria-pressed', 'false');
  b.style.setProperty('--pin', cor);
  b.innerHTML = `<span class="map-filter__dot"></span>${nome}`;
  boxFiltros.appendChild(b);

  legenda.insertAdjacentHTML('beforeend', `<span><i style="--pin:${cor}"></i>${nome}</span>`);
});

boxFiltros.addEventListener('click', (e) => {
  const botao = e.target.closest('.map-filter');
  if (!botao) return;
  categoriaAtiva = botao.dataset.cat;
  boxFiltros.querySelectorAll('.map-filter').forEach((b) => {
    const ativo = b === botao;
    b.classList.toggle('is-active', ativo);
    b.setAttribute('aria-pressed', ativo);
  });
  atualizar(true);
});

[...new Set(POSTOS.map((p) => p.municipio))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  .forEach((m) => selMunicipio.add(new Option(m, m)));

inputBusca.addEventListener('input', () => atualizar(false));
selMunicipio.addEventListener('change', () => atualizar(true));

function postosFiltrados() {
  const termo = normalizar(inputBusca.value);
  const itens = POSTOS.filter((p) =>
    (!categoriaAtiva || p.categoriaPosto === categoriaAtiva)
    && (!selMunicipio.value || p.municipio === selMunicipio.value)
    && (!termo || normalizar(`${p.nome} ${p.bairro} ${p.municipio}`).includes(termo)));

  const referencia = posicaoUsuaria || [mapa.getCenter().lat, mapa.getCenter().lng];
  return itens
    .map((p) => ({ ...p, km: distanciaKm(referencia, [p.lat, p.lng]) }))
    .sort((a, b) => a.km - b.km);
}

function atualizar(enquadrar) {
  const itens = postosFiltrados();
  const ids = new Set(itens.map((p) => p.id));

  marcadores.forEach((m, id) => {
    if (ids.has(id)) m.addTo(mapa); else m.remove();
  });

  contador.textContent = `${itens.length} ${itens.length === 1 ? 'posto' : 'postos'}`;

  lista.innerHTML = itens.length ? itens.map((p) => `
    <li>
      <button type="button" class="map-item${p.id === selecionadoId ? ' is-selected' : ''}" data-id="${p.id}">
        <span class="map-item__icon" style="--pin:${CATEGORIAS_POSTO[p.categoriaPosto].cor}">${svg(p.categoriaPosto)}</span>
        <span class="map-item__body">
          <span class="map-item__cat">${CATEGORIAS_POSTO[p.categoriaPosto].nome}</span>
          <strong>${escapar(p.nome)}</strong>
          <span class="map-item__addr">${escapar(p.endereco)} · ${escapar(p.bairro)}, ${escapar(p.municipio)}</span>
          <span class="map-item__meta">
            <span>${escapar(p.horario)}</span>
            ${posicaoUsuaria ? `<span class="map-item__km">${formatarKm(p.km)}</span>` : ''}
          </span>
        </span>
      </button>
      <div class="map-item__actions">
        <a href="tel:${p.telefone.replace(/\D/g, '')}" class="map-action">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>
          ${escapar(p.telefone)}
        </a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener" class="map-action map-action--route">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>
          Como chegar
        </a>
      </div>
    </li>`).join('')
    : `<li class="map-empty">Nenhum posto encontrado com esses filtros.<br>
         Para orientação, ligue <a href="tel:180"><strong>180</strong></a>.</li>`;

  if (enquadrar && itens.length) {
    const alvo = selMunicipio.value ? itens : itens.slice(0, 5);
    const pontos = alvo.map((p) => [p.lat, p.lng]);
    if (posicaoUsuaria) pontos.push(posicaoUsuaria);
    mapa.fitBounds(pontos, { padding: [48, 48], maxZoom: 15 });
  }
}

lista.addEventListener('click', (e) => {
  const item = e.target.closest('.map-item');
  if (item) selecionar(Number(item.dataset.id), true);
});

function selecionar(id, voar) {
  if (selecionadoId && marcadores.has(selecionadoId)) {
    const antigo = POSTOS.find((p) => p.id === selecionadoId);
    marcadores.get(selecionadoId).setIcon(iconePino(antigo.categoriaPosto));
  }
  selecionadoId = id;
  const p = POSTOS.find((x) => x.id === id);
  const m = marcadores.get(id);
  m.setIcon(iconePino(p.categoriaPosto, true));
  if (voar) {
    mapa.flyTo([p.lat, p.lng], 15, { duration: 0.6 });
    m.openPopup();
  }
  lista.querySelectorAll('.map-item').forEach((el) =>
    el.classList.toggle('is-selected', Number(el.dataset.id) === id));
  const ativo = lista.querySelector('.map-item.is-selected');
  if (ativo && !voar) ativo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

btnLocalizar.addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    statusLocal.textContent = 'Seu navegador não permite usar a localização. Escolha o município acima.';
    return;
  }
  statusLocal.textContent = 'Buscando sua localização…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      posicaoUsuaria = [pos.coords.latitude, pos.coords.longitude];
      if (marcadorUsuaria) marcadorUsuaria.remove();
      marcadorUsuaria = L.marker(posicaoUsuaria, {
        icon: L.divIcon({ className: '', html: '<span class="map-me"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        title: 'Você está aqui',
      }).addTo(mapa).bindTooltip('Você está aqui');
      selMunicipio.value = '';
      statusLocal.textContent = 'Mostrando os postos mais perto de você.';
      atualizar(true);
    },
    () => {
      statusLocal.textContent = 'Não foi possível usar sua localização. Escolha o município acima.';
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
});

mapa.on('moveend', () => { if (!posicaoUsuaria) atualizar(false); });

atualizar(false);
