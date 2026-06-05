/* ============================================================
   UI logic: nav, scroll reveals, stat counters, ember overlay,
   and project cards (resume scrolls + GitHub vault).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Project data (resume + github.com/DOOMSDAY1009) ---------- */
  var PROJECTS = [
    {
      icon: '🍇', title: 'DeepAgroNet — Grape Leaf Disease Detection',
      lang: 'PyTorch',
      desc: 'A Flask web app that classifies grape-leaf diseases with a MobileNetV2 transfer-learning model — high-confidence predictions across four disease classes. Adds Grad-CAM explainability and OpenCV lesion segmentation to compute severity and recommend fungicide dosage.',
      tags: ['PyTorch', 'Flask', 'OpenCV', 'Grad-CAM'],
      repo: 'https://github.com/DOOMSDAY1009/DeepAgroNet'
    },
    {
      icon: '🫁', title: 'Pneumonia Detection (CNN)',
      lang: 'TensorFlow',
      desc: 'Automated detection from chest X-ray images using transfer learning and CNN architectures. Evaluated with AUC and recall, reaching high accuracy to enable faster diagnosis.',
      tags: ['TensorFlow', 'CNN', 'Transfer Learning'],
      repo: 'https://github.com/DOOMSDAY1009/Pneumonia-Detection'
    },
    {
      icon: '☁️', title: 'Cloud Cost Optimizer',
      lang: 'Terraform',
      desc: 'Infrastructure-as-code tooling (HCL/Terraform) to provision and optimize cloud resources — taming spend with reproducible, declarative infrastructure.',
      tags: ['Terraform', 'IaC', 'Cloud', 'DevOps'],
      repo: 'https://github.com/DOOMSDAY1009/Cloud-Cost-Optimizer'
    },
    {
      icon: '✂️', title: 'Self-Pruning Neural Network',
      lang: 'Python',
      desc: 'Research-flavored deep-learning project exploring networks that prune their own weights — shrinking models while preserving accuracy.',
      tags: ['Python', 'Deep Learning', 'Model Pruning'],
      repo: 'https://github.com/DOOMSDAY1009/Self-Pruning-Neural-Network'
    },
    {
      icon: '🛒', title: 'E-commerce Customer Purchase Behavior',
      lang: 'Python',
      desc: 'Predictive analytics on customer purchase behavior — uncovering demand patterns and modeling intent to inform smarter commerce decisions.',
      tags: ['Python', 'Pandas', 'ML', 'Analytics'],
      repo: 'https://github.com/DOOMSDAY1009/E-commerce-Customer-Purchase-Behavior'
    },
    {
      icon: '⚖️', title: 'Smart Legal Petition Platform',
      lang: 'Java',
      desc: 'Digitizes filing of Public Interest Litigations (PILs) — a web platform backed by MySQL with secure JDBC connectivity for SQL operations and legal-data management.',
      tags: ['Java', 'JDBC', 'MySQL'],
      repo: 'https://github.com/DOOMSDAY1009/Smart-Legal-Petition-Platform'
    },
    {
      icon: '🛍️', title: 'Shop — Storefront',
      lang: 'TypeScript',
      desc: 'A TypeScript storefront experiment — modern, typed front-end engineering for an e-commerce flow.',
      tags: ['TypeScript', 'Frontend'],
      repo: 'https://github.com/DOOMSDAY1009/shop'
    },
    {
      icon: '🎓', title: 'Staff & Students Portal',
      lang: 'CSS',
      desc: 'A unified web view of all students and faculty members, with browsable profiles across the institution.',
      tags: ['Web', 'CSS', 'Profiles'],
      repo: 'https://github.com/DOOMSDAY1009/Web-Page-For-Staff-and-Students'
    },
    {
      icon: '🛰️', title: 'OES Spectroscopy Pipeline',
      lang: 'Python · IIT Jodhpur',
      desc: 'A modular computational pipeline transforming raw Optical Emission Spectroscopy data into actionable intelligence for real-time industrial process control — tuned to balance speed with analytical precision.',
      tags: ['Python', 'Signal Processing', 'Research'],
      repo: 'https://github.com/DOOMSDAY1009'
    }
  ];

  function renderProjects() {
    var grid = document.getElementById('projects-grid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < PROJECTS.length; i++) {
      var p = PROJECTS[i];
      var tags = '';
      for (var t = 0; t < p.tags.length; t++) tags += '<span>' + p.tags[t] + '</span>';
      html +=
        '<article class="project-card reveal">' +
          '<div class="pc-top"><span class="pc-icon">' + p.icon + '</span>' +
          '<span class="pc-lang">' + p.lang + '</span></div>' +
          '<h3>' + p.title + '</h3>' +
          '<p>' + p.desc + '</p>' +
          '<div class="pc-tags">' + tags + '</div>' +
          '<div class="pc-links"><a href="' + p.repo + '" target="_blank" rel="noopener">View on GitHub ↗</a></div>' +
        '</article>';
    }
    grid.innerHTML = html;
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
          if (en.target.querySelector('.stat-num') || en.target.classList.contains('about-stats')) {
            animateStats(en.target);
          }
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Stat counters ---------- */
  function animateStats(scope) {
    var nums = scope.querySelectorAll('.stat-num');
    nums.forEach(function (el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var target = parseFloat(el.dataset.target);
      var dec = parseInt(el.dataset.decimals || '0', 10);
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var prog = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - prog, 3);
        var val = target * eased;
        el.textContent = dec ? val.toFixed(dec) : Math.floor(val).toLocaleString();
        if (prog < 1) requestAnimationFrame(step);
        else el.textContent = dec ? target.toFixed(dec) : target.toLocaleString();
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
    if (toggle && links) {
      toggle.addEventListener('click', function () { links.classList.toggle('open'); });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') links.classList.remove('open');
      });
    }
  }

  /* ---------- CSS ember overlay ---------- */
  function initEmbers() {
    var layer = document.getElementById('ember-overlay');
    if (!layer) return;
    var count = window.innerWidth < 768 ? 18 : 40;
    for (var i = 0; i < count; i++) {
      var e = document.createElement('span');
      e.className = 'ember';
      var size = 2 + Math.random() * 4;
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.width = e.style.height = size + 'px';
      e.style.animationDuration = (6 + Math.random() * 10) + 's';
      e.style.animationDelay = (Math.random() * 12) + 's';
      e.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
      layer.appendChild(e);
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    document.getElementById('year').textContent = '2026';
    renderProjects();
    initReveal();
    initNav();
    initEmbers();
    // Safety net: if WebGL never signals ready, hide loader anyway.
    setTimeout(function () {
      var l = document.getElementById('loader');
      if (l && !l.classList.contains('hide')) l.classList.add('hide');
    }, 4500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
