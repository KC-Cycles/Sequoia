// If the app code fails to load, say so instead of leaving the placeholder up.
setTimeout(function () {
  if (!document.getElementById('today-title')) {
    var h = document.querySelector('#view-today h1');
    if (h) h.textContent = 'Sequoia did not load. Close it and open it again.';
  }
}, 6000);
