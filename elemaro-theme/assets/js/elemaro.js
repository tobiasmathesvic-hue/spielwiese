/* Elemaro Theme – Skripte (ohne Abhängigkeiten)
   Jedes Modul wird einzeln initialisiert (querySelectorAll), dadurch funktionieren
   duplizierte, ausgeblendete oder umsortierte Module unabhängig voneinander. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Breite des vertikalen Scrollbalkens – für Scroll-Sperre und Vollbreiten-Berechnung */
  const scrollbarWidth = () => Math.max(0, window.innerWidth - root.clientWidth);

  /* Gemeinsamer, gedrosselter Scroll-/Resize-Loop */
  const tasks = [];
  let queued = false;
  const runTasks = () => { queued = false; tasks.forEach((fn) => fn()); };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(runTasks); } };
  const onFrame = (fn) => { tasks.push(fn); fn(); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  reduceMq.addEventListener?.('change', schedule);

  /* ---------- Header & mobiles Vollbildmenü ---------- */
  $$('[data-module="header"]').forEach((header) => {
    const toggle = header.querySelector('.menu-toggle');
    const nav = header.querySelector('.nav');
    const desktopMq = window.matchMedia('(min-width: 960px)');
    if (!toggle || !nav) return;

    const focusables = () => [toggle, ...$$('a[href]', nav)].filter((el) => el.offsetParent !== null || el === toggle);

    const setOpen = (open, returnFocus = true) => {
      if (open === nav.classList.contains('is-open')) return;
      if (open) root.style.setProperty('--sbw', scrollbarWidth() + 'px');
      nav.classList.toggle('is-open', open);
      header.classList.toggle('menu-open', open);
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      if (!open) {
        root.style.removeProperty('--sbw');
        if (returnFocus) toggle.focus();
      } else {
        const first = nav.querySelector('a[href]');
        window.setTimeout(() => first && first.focus({ preventScroll: true }), 80);
      }
    };

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false, false); });
    document.addEventListener('keydown', (e) => {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key === 'Tab') { /* Fokus im Menü halten */
        const list = focusables();
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    desktopMq.addEventListener?.('change', () => { if (desktopMq.matches) setOpen(false, false); });

    /* Header-Rand erst nach dem Scrollen; aktiver Abschnitt in der Navigation */
    const links = $$('.nav a[href*="#"]', header).filter((a) => !a.closest('.nav__cta-mobile'));
    const targets = links.map((a) => {
      const id = a.getAttribute('href').split('#')[1];
      return id ? document.getElementById(id) : null;
    });
    onFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      const probe = header.getBoundingClientRect().bottom + window.innerHeight * 0.25;
      let current = -1;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= probe) current = i; });
      links.forEach((a, i) => (i === current ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    });
  });

  /* ---------- Einblenden beim Scrollen (je Modul) ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMq.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Branchenvorschauen: scrollgekoppelter Kartenstapel ---------- */
  $$('[data-module="preview-stack"]').forEach((sec) => {
    const track = sec.querySelector('.pv__track');
    const stage = sec.querySelector('.pv__stage');
    const items = $$('.tpl', sec);
    const n = items.length;
    const header = document.querySelector('.site-header');
    if (!track || !stage || n < 2) return;
    const browsers = items.map((li) => li.querySelector('.browser'));
    const caps = items.map((li) => li.querySelector('.tpl__cap'));
    let stacked = false;
    let stageH = 0;
    let stepPx = 0;

    const reset = () => {
      track.style.height = '';
      items.forEach((li, i) => { li.style.zIndex = ''; browsers[i].style.transform = ''; browsers[i].style.opacity = ''; caps[i].style.opacity = ''; });
    };

    /* Stapel nur aktivieren, wenn die Bühne vollständig in den sichtbaren Bereich passt
       (kurze Bildschirme, Querformat) – sonst bleiben die Beispiele als normale Liste stehen. */
    const measure = () => {
      sec.classList.remove('is-stack');
      stacked = false;
      reset();
      if (reduceMq.matches) return;
      sec.classList.add('is-stack');
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      stageH = stage.offsetHeight;
      if (stageH > window.innerHeight - stickyTop - 12 || browsers[0].offsetWidth < 320) { sec.classList.remove('is-stack'); return; }
      stacked = true;
      stepPx = clamp(window.innerHeight * 0.5, 300, 520);
      track.style.height = stageH + (n - 1) * stepPx + 'px';
      items.forEach((li, i) => { li.style.zIndex = String(n - i); });
    };

    const render = () => {
      if (!stacked) return;
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const r = track.getBoundingClientRect();
      const range = Math.max(1, r.height - stageH);
      const p = clamp((stickyTop - r.top) / range) * (n - 1);
      items.forEach((li, i) => {
        const d = i - p;
        let tf;
        let op = 1;
        if (d <= 0) { /* vordere Karte dreht sich nach oben heraus */
          const t = ease(clamp(-d));
          tf = `translate3d(0, ${(-t * 62).toFixed(2)}%, ${(-t * 160).toFixed(1)}px) rotateX(${(t * 46).toFixed(2)}deg) rotateZ(${(-t * 3.2).toFixed(2)}deg) scale(${(1 - t * 0.1).toFixed(4)})`;
          op = 1 - ease(clamp((t - 0.45) / 0.55));
        } else { /* nachfolgende Karten liegen dahinter und drehen sich ein */
          const dd = Math.min(d, 2.2);
          const side = i % 2 ? 1 : -1;
          tf = `translate3d(0, ${(-dd * 20).toFixed(2)}px, ${(-dd * 40).toFixed(1)}px) rotateX(${(dd * 5).toFixed(2)}deg) rotateZ(${(side * dd * 1.4).toFixed(2)}deg) scale(${(1 - dd * 0.05).toFixed(4)})`;
          op = clamp(2.6 - d);
        }
        browsers[i].style.transform = tf;
        browsers[i].style.opacity = op.toFixed(3);
        caps[i].style.opacity = clamp(1 - Math.abs(d) * 2.4).toFixed(3);
      });
    };

    let lastW = 0;
    let lastH = 0;
    const remeasure = () => { measure(); render(); };
    onFrame(() => {
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) { lastW = window.innerWidth; lastH = window.innerHeight; measure(); }
      render();
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (!stacked || Math.abs(stage.offsetHeight - stageH) > 1) remeasure(); }).observe(stage);
    document.fonts?.ready.then(remeasure);
    window.addEventListener('load', remeasure);
    reduceMq.addEventListener?.('change', remeasure);
  });

  /* ---------- Preiskarte: von voller Bildschirmbreite auf Inhaltsbreite ---------- */
  $$('[data-module="pricing"]').forEach((sec) => {
    const slot = sec.querySelector('.pkg-slot');
    const card = sec.querySelector('.pkg');
    if (!slot || !card) return;
    onFrame(() => {
      if (reduceMq.matches) { card.style.setProperty('--p', '1'); card.style.setProperty('--bleed', '0px'); return; }
      const vw = root.clientWidth; /* ohne Scrollbalken */
      const vh = window.innerHeight;
      const cs = getComputedStyle(slot);
      const content = slot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const bleed = Math.max(0, (vw - content) / 2);
      const r = slot.getBoundingClientRect();
      const p = ease(clamp((vh - r.top) / (vh * 0.7)));
      card.style.setProperty('--p', p.toFixed(4));
      card.style.setProperty('--bleed', (bleed * (1 - p)).toFixed(2) + 'px');
    });
  });

  /* ---------- Formular ---------- */
  $$('[data-module="contact-form"]').forEach((sec) => {
    const wrap = sec.querySelector('.form-wrap');
    const card = sec.querySelector('.form-card');
    const form = sec.querySelector('form');
    if (!wrap || !card || !form) return;

    const open = (instant) => {
      if (instant) card.classList.add('is-instant');
      card.classList.add('is-open');
    };
    if (reduceMq.matches || !('IntersectionObserver' in window)) {
      open(true);
    } else {
      /* Beobachtet wird der nicht transformierte Wrapper; großzügiger Vorlauf unten */
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { open(false); io.disconnect(); }
      }, { rootMargin: '0px 0px 30% 0px' });
      io.observe(wrap);
      if (wrap.getBoundingClientRect().top < window.innerHeight * 1.3) open(false);
    }
    /* Tastaturfokus oder Hash-Sprung: sofort bedienbar, ohne Animation */
    card.addEventListener('focusin', () => open(true));
    if (location.hash === '#' + sec.id) open(true);

    const endpoint = (form.dataset.endpoint || '').trim();
    const demo = !endpoint;
    const badge = sec.querySelector('[data-demo-badge]');
    if (badge) badge.hidden = !demo;
    const status = form.querySelector('.form__status');
    const say = (msg, state) => { status.textContent = msg; status.dataset.state = state; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); say('Bitte prüfe die markierten Felder und bestätige den Datenschutz.', 'error'); return; }
      if (form.elements.website && form.elements.website.value) return; /* Honeypot */
      if (demo) {
        say('Demo-Modus: Dieses Formular ist noch nicht mit einem Versand verbunden. Es wurde nichts gesendet.', 'demo');
        return;
      }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      say('Wird gesendet …', 'demo');
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say('Danke! Deine Anfrage wurde gesendet.', 'ok');
      } catch (err) {
        say('Das Senden hat nicht geklappt. Bitte versuche es erneut oder schreibe uns direkt eine E-Mail.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
