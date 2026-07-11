(function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  function closeMenu(returnFocus) {
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('nav-open');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var isOpen = toggle.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('nav-open', isOpen);
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu(false);
    });
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
      closeMenu(true);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeMenu();
  });
})();
