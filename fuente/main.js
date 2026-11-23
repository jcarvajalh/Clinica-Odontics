/* Odontics — demo conceptual · interacciones */
(function () {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Idioma ES / EN ---------- */
  const titles = {
    es: 'Diseño de sonrisa y carillas cerámicas en Sabaneta | Odontics',
    en: 'Ceramic Veneers in Medellín, Colombia | Odontics Dental Clinic'
  };
  function setLang(lang) {
    root.lang = lang;
    root.dataset.lang = lang;
    const bt = document.body.dataset[lang === 'es' ? 'titleEs' : 'titleEn'];
    document.title = bt || titles[lang];
    document.querySelectorAll('[data-set-lang]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    store.set('odontics-lang', lang);
  }
  const urlLang = new URLSearchParams(location.search).get('lang');
  setLang(urlLang === 'en' || urlLang === 'es' ? urlLang : (store.get('odontics-lang') || 'es'));
  document.querySelectorAll('[data-set-lang]').forEach(b =>
    b.addEventListener('click', () => setLang(b.dataset.setLang)));

  /* ---------- Marcas de contenido de ejemplo ---------- */
  const phBtn = document.querySelector('[data-ph-toggle]');
  phBtn && phBtn.addEventListener('click', () => {
    const hidden = document.body.classList.toggle('hide-ph');
    phBtn.setAttribute('aria-pressed', String(!hidden));
    phBtn.textContent = hidden ? 'Mostrar marcas' : 'Ocultar marcas';
  });

  /* ---------- Navegación: tono claro/oscuro según sección ---------- */
  const nav = document.querySelector('[data-nav]');
  const darkSections = [...document.querySelectorAll('.hero, .tour, .foot, .t-hero, .t-cta')];
  function navTone() {
    const y = nav.getBoundingClientRect().top + nav.offsetHeight / 2;
    const onDark = darkSections.some(s => {
      const r = s.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
    nav.classList.toggle('is-light', !onDark);
    nav.classList.toggle('is-scrolled', scrollY > 24);
  }
  addEventListener('scroll', navTone, { passive: true });
  navTone();

  const burger = document.querySelector('[data-burger]');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Revelado al hacer scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: .15 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Tratamientos: carrusel con tarjeta activa ---------- */
  const track = document.querySelector('[data-rail-track]');
  if (track) {
    const cards = [...track.querySelectorAll('[data-card]')];
    const prev = document.querySelector('[data-rail-prev]');
    const next = document.querySelector('[data-rail-next]');
    const bar = document.querySelector('[data-rail-bar]');
    const cur = document.querySelector('[data-rail-cur]');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const setActive = card => cards.forEach(c => c.classList.toggle('is-active', c === card));
    const step = () => cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 12);
    const firstVisible = () => {
      const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      const left = track.getBoundingClientRect().left + pad;
      let best = cards[0], d = Infinity;
      cards.forEach(c => { const dd = Math.abs(c.getBoundingClientRect().left - left); if (dd < d) { d = dd; best = c; } });
      return best;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const k = max > 0 ? track.scrollLeft / max : 0;
      const w = Math.max(track.clientWidth / track.scrollWidth, .12);
      bar.style.setProperty('--w', (w * 100) + '%');
      bar.style.setProperty('--x', (k * (1 / w - 1) * 100) + '%');
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      const first = firstVisible();
      cur.textContent = String(cards.indexOf(first) + 1).padStart(2, '0');
      if (!fine.matches) setActive(first);
    };
    cards.forEach(c => {
      c.addEventListener('mouseenter', () => { if (fine.matches) setActive(c); });
      c.addEventListener('focusin', () => setActive(c));
    });
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });

    // Arrastre libre con el cursor (en táctil ya se desliza de forma nativa)
    let drag = null, dragged = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, lx: e.clientX, t: performance.now(), v: 0 }; dragged = false;
    });
    addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!dragged && Math.abs(dx) > 5) { dragged = true; track.classList.add('is-dragging'); }
      if (!dragged) return;
      const now = performance.now();
      drag.v = (e.clientX - drag.lx) / Math.max(now - drag.t, 1); drag.lx = e.clientX; drag.t = now;
      track.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
      if (!drag) return;
      const v = performance.now() - drag.t < 80 ? drag.v : 0; drag = null;
      if (!dragged) return;
      // pequeña inercia y luego vuelve a encajar en la tarjeta más cercana
      track.scrollBy({ left: -v * 220, behavior: 'smooth' });
      setTimeout(() => track.classList.remove('is-dragging'), 380);
    };
    addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
    track.addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    track.addEventListener('dragstart', e => e.preventDefault());
    addEventListener('resize', update);
    update();
  }

  /* ---------- Reseñas de Google (contenido de ejemplo) ---------- */
  const mq = document.querySelector('[data-marquee-track]');
  if (mq) {
    const A = '../assets/avatars/';
    const G = '<svg class="rcard__g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
    const b = (es, en) => `<span data-l="es">${es}</span><span data-l="en">${en}</span>`;
    const R = [
      { n: 'Valentina Restrepo', a: 'w44.jpg', s: 5, d: b('hace 2 semanas', '2 weeks ago'), m: b('Local Guide · 18 reseñas', 'Local Guide · 18 reviews'), v: 'quote',
        t: 'Me hice carillas cerámicas con la Dra. Elizeth y el resultado es justo lo que buscaba: natural, nada de dientes “de comercial”. Me mostraron el diseño antes de empezar.' },
      { n: 'Andrés Gómez', a: 'm32.jpg', s: 5, d: b('hace 1 mes', '1 month ago'), m: b('6 reseñas', '6 reviews'), v: 'fit',
        t: 'Excelente atención desde la valoración. Puntuales y muy claros con los costos.' },
      { n: 'Sarah Mitchell', a: 'w68.jpg', s: 5, d: b('hace 3 semanas', '3 weeks ago'), m: 'Houston, TX · 4 reviews',
        t: 'Flew in from Houston for veneers. Everything was done in 6 days — my smile looks like me, just better.' },
      { n: 'Camila Ospina', a: 'w21.jpg', s: 5, d: b('hace 5 días', '5 days ago'), m: b('Local Guide · 41 reseñas', 'Local Guide · 41 reviews'), v: 'photo', p: '../assets/sonrisa.jpg', pl: b('Foto de la reseña', 'Review photo'),
        t: 'Mi diseño de sonrisa quedó hermoso. ¡Gracias a todo el equipo! 🤍' },
      { n: 'Juliana Pérez', a: 'w33.jpg', s: 5, d: b('hace 2 meses', '2 months ago'), m: b('3 reseñas', '3 reviews'), v: 'fit',
        t: 'Llevo mi ortodoncia aquí y las cuotas son súper accesibles. ¡Recomendados!' },
      { n: 'Mateus Oliveira', a: 'm46.jpg', s: 5, d: b('hace 1 mes', '1 month ago'), m: 'São Paulo · 9 avaliações', v: 'accent',
        t: 'Vim do Brasil só para o tratamento e valeu cada centavo. Equipe muito atenciosa!' },
      { n: 'Daniel Carter', a: 'm75.jpg', s: 5, d: b('hace 2 semanas', '2 weeks ago'), m: 'Miami, FL · Local Guide', v: 'quote dark',
        t: 'Honestly the best dental experience I’ve had anywhere. Bilingual coordinator on WhatsApp the whole time and a written warranty.' },
      { n: 'Luisa F. Arango', a: 'w57.jpg', s: 5, d: b('hace 3 meses', '3 months ago'), m: b('12 reseñas', '12 reviews'),
        t: 'Me daba miedo la sensibilidad, pero fueron súper cuidadosos. Quedé varios tonos más blanca.' },
      { n: 'Santiago Vélez', a: 'm11.jpg', s: 4, d: b('hace 1 mes', '1 month ago'), m: b('2 reseñas', '2 reviews'), v: 'fit',
        t: 'Muy buen trabajo con mi endodoncia, cero dolor. Solo esperé un poco en recepción.' },
      { n: 'Emily Rodríguez', a: 'w90.jpg', s: 5, d: b('hace 1 semana', '1 week ago'), m: 'Toronto · 7 reviews', v: 'photo', p: '../assets/carillas.jpg', pl: b('Foto de la reseña', 'Review photo'),
        t: 'Ceramic veneers done in Sabaneta. Couldn’t be happier!' },
      { n: 'Carlos Mejía', a: 'm52.jpg', s: 5, d: b('hace 4 meses', '4 months ago'), m: b('Local Guide · 27 reseñas', 'Local Guide · 27 reviews'), v: 'fit',
        t: 'La sede es muy bonita y queda cerquita de El Poblado. 10/10.' },
      { n: 'Natalia Zuluaga', a: 'w12.jpg', s: 5, d: b('hace 3 semanas', '3 weeks ago'), m: b('8 reseñas', '8 reviews'),
        t: 'Me hice microdiseño y quedó súper natural. Pequeños cambios, gran diferencia.' }
    ];
    // Columnas de distinto ancho; algunas con una tarjeta alta, otras con dos apiladas
    const cols = [['l', 0], ['s', 1, 4], ['m', 3], ['m', 2, 8], ['l', 6], ['s', 10, 11], ['m', 9], ['m', 5, 7]];
    const card = r => {
      const v = (r.v || '').split(' ').filter(Boolean).map(x => 'rcard--' + x).join(' ');
      const stars = '★'.repeat(r.s) + (r.s < 5 ? `<span class="off">${'★'.repeat(5 - r.s)}</span>` : '');
      return `<article class="rcard ${v}">
        <header class="rcard__head"><img class="rcard__av" src="${A + r.a}" alt="" loading="lazy" width="42" height="42">
          <span class="rcard__who"><b class="rcard__name">${r.n}</b><span class="rcard__meta">${r.m}</span></span>${G}</header>
        <div class="rcard__rate"><span class="stars" aria-label="${r.s} / 5">${stars}</span><span>${r.d}</span><span class="rcard__ok">${b('Verificada', 'Verified')}</span></div>
        ${r.p ? `<figure class="rcard__photo"><img src="${r.p}" alt="" loading="lazy"><span>${r.pl}</span></figure>` : ''}
        <p class="rcard__text">${r.t}</p>
      </article>`;
    };
    const group = cols.map(([w, ...ids]) => `<div class="rcol rcol--${w}">${ids.map(i => card(R[i])).join('')}</div>`).join('');
    mq.innerHTML = `<div class="marquee__group">${group}</div><div class="marquee__group" aria-hidden="true">${group}</div>`;
    mq.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button').forEach(el => el.tabIndex = -1);

    // Movimiento continuo + arrastre libre con inercia
    const host = mq.parentElement;
    const speed = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 36; // px/s
    let x = 0, v = 0, last = performance.now(), hover = false, md = null, moved = false;
    const tick = now => {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      if (!md) {
        if (Math.abs(v) > 8) { x += v * dt; v *= Math.pow(.03, dt); }
        else { v = 0; if (!hover) x -= speed * dt; }
      }
      const h = mq.firstElementChild.offsetWidth;
      if (h) { x %= h; if (x > 0) x -= h; }
      mq.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    host.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    host.addEventListener('pointerleave', () => { hover = false; });
    host.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      md = { x: e.clientX, x0: x, lx: e.clientX, t: performance.now() }; moved = false; v = 0;
    });
    addEventListener('pointermove', e => {
      if (!md) return;
      const dx = e.clientX - md.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; host.classList.add('is-dragging'); }
      if (!moved) return;
      const now = performance.now();
      v = (e.clientX - md.lx) / Math.max((now - md.t) / 1000, .001); md.lx = e.clientX; md.t = now;
      x = md.x0 + dx;
    });
    const endM = () => {
      if (!md) return;
      if (performance.now() - md.t > 80) v = 0;
      v = Math.max(-2200, Math.min(2200, v));
      md = null; host.classList.remove('is-dragging');
    };
    addEventListener('pointerup', endM); addEventListener('pointercancel', endM);
    host.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    host.addEventListener('dragstart', e => e.preventDefault());
  }

  /* ---------- Antes / después ---------- */
  const ba = document.querySelector('[data-ba]');
  if (ba) {
  const range = ba.querySelector('.ba__range');
  const setPos = v => ba.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => setPos(range.value));

  const cases = [
    { before: '../assets/caso1-antes.jpg', after: '../assets/caso1-despues.jpg', ratio: '1200 / 566',
      t: ['Carillas cerámicas', 'Ceramic veneers'], p: '10', d: ['2 semanas', '2 weeks'],
      o: ['Color uniforme y proporción', 'Even colour and proportion'] },
    { before: '../assets/caso2-antes.jpg', after: '../assets/caso2-despues.jpg', ratio: '1360 / 760',
      t: ['Diseño de sonrisa', 'Smile design'], p: '8', d: ['10 días', '10 days'],
      o: ['Sonrisa más amplia y luminosa', 'Wider, brighter smile'] }
  ];
  const bil = (es, en) => `<span data-l="es">${es}</span><span data-l="en">${en}</span>`;
  document.querySelectorAll('[data-case]').forEach(tab => tab.addEventListener('click', () => {
    const c = cases[+tab.dataset.case];
    document.querySelectorAll('[data-case]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    ba.classList.remove('is-swapping'); void ba.offsetWidth; ba.classList.add('is-swapping');
    ba.querySelector('[data-before]').src = c.before;
    ba.querySelector('[data-after]').src = c.after;
    if (matchMedia('(min-width: 601px)').matches) ba.style.aspectRatio = c.ratio;
    range.value = 50; setPos(50);
    const f = n => document.querySelector(`[data-case-field="${n}"]`);
    f('t').innerHTML = bil(...c.t); f('p').textContent = c.p;
    f('d').innerHTML = bil(...c.d); f('o').innerHTML = bil(...c.o);
  }));
  // Pequeña invitación a interactuar cuando el slider entra en pantalla
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; hint.disconnect();
      let t0; const dur = 1600;
      const step = ts => {
        t0 = t0 || ts; const k = Math.min((ts - t0) / dur, 1);
        const v = 50 + Math.sin(k * Math.PI * 2) * 22; setPos(v); range.value = v;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .6 });
    hint.observe(ba);
  }

  }

  /* ---------- Agenda inteligente → WhatsApp ---------- */
  const form = document.querySelector('[data-form]');
  if (form) {
  const F = form.elements;
  const intlField = form.querySelector('[data-intl-only]');
  const syncOrigin = () => {
    const intl = F.origin.value === 'intl';
    intlField.hidden = !intl;
  };
  form.querySelectorAll('input[name="origin"]').forEach(r => r.addEventListener('change', syncOrigin));
  syncOrigin();

  // Las rutas del hero preseleccionan el flujo
  document.querySelectorAll('[data-route]').forEach(a => a.addEventListener('click', () => {
    const intl = a.dataset.route === 'intl';
    form.querySelector(`input[name="origin"][value="${intl ? 'intl' : 'local'}"]`).checked = true;
    form.querySelector(`input[name="service"][value="${intl ? 'turismo' : 'valoracion'}"]`).checked = true;
    syncOrigin();
  }));
  form.querySelectorAll('input[name="service"]').forEach(r => r.addEventListener('change', () => {
    if (r.checked && r.value === 'turismo') {
      form.querySelector('input[name="origin"][value="intl"]').checked = true; syncOrigin();
    }
  }));

  const labels = {
    valoracion: ['una valoración', 'an assessment'],
    carillas: ['carillas / diseño de sonrisa', 'veneers / smile design'],
    ortodoncia: ['ortodoncia', 'orthodontics'],
    turismo: ['turismo dental', 'dental tourism'],
    otro: ['otro tratamiento', 'another treatment']
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = F.fullname.value.trim();
    if (!name) { F.fullname.classList.add('is-error'); F.fullname.focus(); return; }
    F.fullname.classList.remove('is-error');
    const en = root.dataset.lang === 'en' ? 1 : 0;
    const svc = labels[F.service.value][en];
    const intl = F.origin.value === 'intl';
    const country = F.country.value.trim();
    const when = F.when.value.trim();
    const msg = en
      ? `Hi Odontics! I'm ${name}${intl && country ? ` from ${country}` : ''}. I'm interested in ${svc}.${when ? ` Best time for me: ${when}.` : ''}`
      : `¡Hola, Odontics! Soy ${name}${intl && country ? ` y escribo desde ${country}` : ''}. Me interesa ${svc}.${when ? ` Me queda bien: ${when}.` : ''}`;
    window.open('https://wa.me/573007668469?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
  F.fullname.addEventListener('input', () => F.fullname.classList.remove('is-error'));
  }
})();
