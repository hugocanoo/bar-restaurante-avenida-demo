(function () {
  'use strict';
  var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Horario habitual (el que figura en su ficha de Google). Índice = Date.getDay()
  var HORARIO = {
    0: [[13.5, 16]],
    1: [[9, 11.5], [13.5, 16.25]],
    2: [],
    3: [],
    4: [[9, 11.5], [13.5, 16.25]],
    5: [[9, 11.5], [13.5, 16.25], [20.5, 24]],
    6: [[13.5, 16]]
  };
  var NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function ahoraEnMadrid() {
    var partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var d = {};
    partes.forEach(function (p) { d[p.type] = p.value; });
    var dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dia: dias[d.weekday], hora: (parseInt(d.hour, 10) % 24) + parseInt(d.minute, 10) / 60 };
  }
  function fmt(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function textoEstado(a) {
    var tramos = HORARIO[a.dia];
    for (var i = 0; i < tramos.length; i++) {
      if (a.hora >= tramos[i][0] && a.hora < tramos[i][1]) return 'Abierto ahora · hasta las ' + fmt(tramos[i][1] === 24 ? 24 : tramos[i][1]).replace('24:00', '24:00');
    }
    for (var i2 = 0; i2 < tramos.length; i2++) {
      if (a.hora < tramos[i2][0]) return 'Cerrado ahora · hoy abrimos a las ' + fmt(tramos[i2][0]);
    }
    for (var k = 1; k <= 7; k++) {
      var d = (a.dia + k) % 7;
      if (HORARIO[d].length) return 'Cerrado ahora · abrimos el ' + NOMBRES[d] + ' a las ' + fmt(HORARIO[d][0][0]);
    }
    return '';
  }

  try {
    var ahora = ahoraEnMadrid();
    document.querySelectorAll('[data-dia="' + ahora.dia + '"]').forEach(function (el) { el.classList.add('hoy'); });
    var estado = document.querySelector('.estado');
    if (estado) { estado.textContent = textoEstado(ahora); estado.hidden = false; }
  } catch (e) { /* sin horario dinámico: la tabla fija sigue ahí */ }

  // Revelado al bajar (solo esconde si el JS está vivo, ver <head>)
  var revelables = document.querySelectorAll('.revelar');
  if ('IntersectionObserver' in window && !menosMovimiento) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelables.forEach(function (el) { obs.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add('visible'); });
  }

  // Hero: zoom de entrada y parallax suave
  var fotoHero = document.querySelector('.hero-foto img');
  if (fotoHero && !menosMovimiento) {
    var idZoom = null, inicio = null;
    var pintar = function (escala, desp) {
      fotoHero.style.transform = 'translate3d(0,' + Math.round(desp) + 'px,0) scale(' + escala.toFixed(3) + ')';
    };
    var entrada = function (t) {
      if (inicio === null) inicio = t;
      var p = Math.min((t - inicio) / 3200, 1), s = 1 - Math.pow(1 - p, 3);
      pintar(1.24 - s * 0.14, 0);
      if (p < 1) idZoom = requestAnimationFrame(entrada);
    };
    pintar(1.24, 0);
    idZoom = requestAnimationFrame(entrada);
    window.addEventListener('scroll', function () {
      if (idZoom !== null) { cancelAnimationFrame(idZoom); idZoom = null; }
      pintar(1.1, Math.min(window.scrollY * 0.18, 28));
    }, { passive: true });
  }

  // Índice de la carta: marca la categoría que se está leyendo
  var enlaces = document.querySelectorAll('.indice-carta a');
  if (enlaces.length && 'IntersectionObserver' in window) {
    var cats = [];
    enlaces.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) cats.push({ a: a, s: s });
    });
    var obsCat = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cats.forEach(function (c) { c.a.classList.toggle('activa', c.s === e.target); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    cats.forEach(function (c) { obsCat.observe(c.s); });
  }

  // Galería: visor
  var visor = document.getElementById('visor');
  if (visor && visor.showModal) {
    var img = visor.querySelector('img'), pie = visor.querySelector('p');
    document.querySelectorAll('.mosaico button').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = b.querySelector('img');
        img.src = i.getAttribute('data-grande') || i.src;
        img.alt = i.alt; pie.textContent = i.alt;
        visor.showModal();
      });
    });
    visor.addEventListener('click', function (e) { if (e.target === visor || e.target.tagName === 'DIV') visor.close(); });
    visor.querySelector('.cerrar').addEventListener('click', function () { visor.close(); });
  }
})();
