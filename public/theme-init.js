// Apply saved theme before paint to prevent flash of wrong mode.
// Kept as a pre-bundle script so a strict CSP can drop script-src 'unsafe-inline'.
(function () {
  var theme;
  try { theme = localStorage.getItem('fc_theme'); } catch (e) {}
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#09090b';
    document.body.style.color = '#fafafa';
  }
})();
