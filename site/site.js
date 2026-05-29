/* ════════════════════════════════════════════════════════════
   Korvia — site.js
   Injecte le nav + footer partagés, gère le bilinguisme FR/EN
   (persisté), le menu mobile, l'accordéon FAQ, et l'état actif
   de la sidebar docs. Vanilla, aucune dépendance.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── SVG icons ─────────────────────────────────────────────
  var ICON = {
    arrow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    check: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    burger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    spark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>',
  };

  // ── Nav links (label FR / EN / href) ──────────────────────
  var NAV = [
    { id: 'fonctionnalites', fr: 'Fonctionnalités', en: 'Features',  href: 'fonctionnalites.html' },
    { id: 'tarifs',          fr: 'Tarifs',          en: 'Pricing',   href: 'tarifs.html' },
    { id: 'fondateurs',      fr: 'Fondateurs',      en: 'Founders',  href: 'fondateurs.html' },
    { id: 'docs',            fr: 'Documentation',   en: 'Docs',      href: 'docs.html' },
    { id: 'blogue',          fr: 'Blogue',          en: 'Blog',      href: 'blogue.html' },
    { id: 'a-propos',        fr: 'À propos',        en: 'About',     href: 'a-propos.html' },
  ];

  function navHTML(active) {
    var links = NAV.map(function (n) {
      return '<a class="nav-link' + (n.id === active ? ' active' : '') +
        '" href="' + n.href + '" data-en="' + n.en + '">' + n.fr + '</a>';
    }).join('');
    var mlinks = NAV.map(function (n) {
      return '<a href="' + n.href + '" data-en="' + n.en + '">' + n.fr + '</a>';
    }).join('');
    return '' +
      '<nav class="nav"><div class="nav-inner">' +
        '<a class="brand" href="index.html" aria-label="Korvia accueil">' +
          '<span class="brand-mark">K</span>' +
          '<span class="brand-name">Korv<em>i</em>a</span>' +
        '</a>' +
        '<div class="nav-links">' + links + '</div>' +
        '<div class="nav-right">' +
          '<div class="lang-toggle" role="group" aria-label="Langue">' +
            '<button data-lang="fr">FR</button>' +
            '<button data-lang="en">EN</button>' +
          '</div>' +
          '<a class="btn btn-ghost btn-sm" href="contact.html" data-en="Sign in">Se connecter</a>' +
          '<a class="btn btn-primary btn-sm" href="contact.html" data-en="Free trial">Essai gratuit</a>' +
          '<button class="nav-burger" aria-label="Menu">' + ICON.burger + '</button>' +
        '</div>' +
      '</div></nav>' +
      '<div class="mobile-menu">' + mlinks +
        '<a href="contact.html" data-en="Sign in">Se connecter</a>' +
        '<a class="btn btn-primary" style="margin-top:16px" href="contact.html" data-en="Free trial">Essai gratuit</a>' +
      '</div>';
  }

  function footerHTML() {
    var col = function (titleFr, titleEn, items) {
      return '<div><h4 data-en="' + titleEn + '">' + titleFr + '</h4>' +
        items.map(function (i) {
          return '<a href="' + i.href + '" data-en="' + i.en + '">' + i.fr + '</a>';
        }).join('') + '</div>';
    };
    return '<footer class="footer"><div class="wrap">' +
      '<div class="footer-grid">' +
        '<div>' +
          '<a class="brand" href="index.html"><span class="brand-mark">K</span>' +
          '<span class="brand-name">Korv<em>i</em>a</span></a>' +
          '<p style="margin-top:16px;max-width:280px;font-size:15px;color:oklch(74% 0.014 78)" ' +
          'data-en="The maintenance software built for Quebec SMBs. Made in Saint-Hyacinthe.">' +
          'Le logiciel de maintenance pensé pour les PME du Québec. Conçu à Saint-Hyacinthe.</p>' +
        '</div>' +
        col('Produit', 'Product', [
          { fr: 'Fonctionnalités', en: 'Features', href: 'fonctionnalites.html' },
          { fr: 'Tarifs', en: 'Pricing', href: 'tarifs.html' },
          { fr: 'Application mobile', en: 'Mobile app', href: 'fonctionnalites.html#mobile' },
          { fr: 'Nouveautés', en: "What's new", href: 'blogue.html' },
        ]) +
        col('Ressources', 'Resources', [
          { fr: 'Documentation', en: 'Documentation', href: 'docs.html' },
          { fr: 'Référence API', en: 'API reference', href: 'api.html' },
          { fr: 'FAQ', en: 'FAQ', href: 'faq.html' },
          { fr: 'Blogue', en: 'Blog', href: 'blogue.html' },
        ]) +
        col('Entreprise', 'Company', [
          { fr: 'À propos', en: 'About', href: 'a-propos.html' },
          { fr: 'Contact', en: 'Contact', href: 'contact.html' },
          { fr: 'Demander une démo', en: 'Book a demo', href: 'contact.html' },
          { fr: 'Carrières', en: 'Careers', href: 'a-propos.html#carrieres' },
        ]) +
        col('Légal', 'Legal', [
          { fr: 'Confidentialité', en: 'Privacy', href: '#' },
          { fr: 'Conditions', en: 'Terms', href: '#' },
          { fr: 'Hébergé au Canada', en: 'Hosted in Canada', href: '#' },
          { fr: 'Statut', en: 'Status', href: '#' },
        ]) +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>© 2026 Korvia technologies inc. · Saint-Hyacinthe, QC</span>' +
        '<span data-en="Built with care in Quebec.">Conçu avec soin au Québec.</span>' +
      '</div>' +
    '</div></footer>';
  }

  // ── i18n ──────────────────────────────────────────────────
  var frStore = new WeakMap();
  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!frStore.has(el)) frStore.set(el, el.innerHTML);
      el.innerHTML = (lang === 'en') ? el.getAttribute('data-en') : frStore.get(el);
    });
    // placeholders
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (!el.__frph) el.__frph = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', lang === 'en' ? el.getAttribute('data-en-ph') : el.__frph);
    });
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    try { localStorage.setItem('korvia-lang', lang); } catch (e) {}
  }

  function getLang() {
    try { return localStorage.getItem('korvia-lang') || 'fr'; } catch (e) { return 'fr'; }
  }

  // ── Mount ─────────────────────────────────────────────────
  function mount() {
    var active = document.body.getAttribute('data-page') || '';
    var navMount = document.getElementById('nav-mount');
    if (navMount) navMount.innerHTML = navHTML(active);
    var footMount = document.getElementById('footer-mount');
    if (footMount) footMount.innerHTML = footerHTML();

    // lang toggle
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });

    // mobile menu
    var burger = document.querySelector('.nav-burger');
    var mm = document.querySelector('.mobile-menu');
    if (burger && mm) burger.addEventListener('click', function () { mm.classList.toggle('open'); });

    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var wasOpen = item.classList.contains('open');
        // close siblings within same group
        var group = item.parentElement;
        group.querySelectorAll('.faq-item.open').forEach(function (o) { if (o !== item) o.classList.remove('open'); });
        item.classList.toggle('open', !wasOpen);
      });
    });

    // docs sidebar scroll-spy
    var docLinks = document.querySelectorAll('.docs-link[href^="#"]');
    if (docLinks.length) {
      var sections = [].map.call(docLinks, function (l) {
        return document.getElementById(l.getAttribute('href').slice(1));
      }).filter(Boolean);
      var spy = function () {
        var y = window.scrollY + 120;
        var cur = sections[0];
        sections.forEach(function (s) { if (s.offsetTop <= y) cur = s; });
        docLinks.forEach(function (l) {
          l.classList.toggle('active', cur && l.getAttribute('href') === '#' + cur.id);
        });
      };
      window.addEventListener('scroll', spy, { passive: true });
      spy();
    }

    applyLang(getLang());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.KORVIA = { applyLang: applyLang, ICON: ICON };
})();
