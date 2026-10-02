define([], function () {
  'use strict';

  var router;

  function initialize(appRouter) {
    router = appRouter;
  }

  function goTo(path) {
    if (!router) {
      return Promise.reject(new Error('Navigation is not initialized.'));
    }

    return router.go({ path: path });
  }

  return {
    initialize: initialize,
    goTo: goTo
  };
});