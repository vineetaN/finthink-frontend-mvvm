define([], function () {
  'use strict';

  return function (id) {
    // Let Knockout add conditional sections before measuring their position.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        var section = document.getElementById(id);
        if (!section || !section.getClientRects().length) return;
        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  };
});
