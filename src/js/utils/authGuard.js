define([
  './sessionService',
  '../config/roleRoutes'
], function (sessionService, roleRoutes) {
  'use strict';

  // These UI checks improve navigation only; the backend must enforce roles on every API.
  function authorize(state) {
    var path = state && state.path;
    if (path === 'login' || path === 'register' || path === 'unauthorized') {
      return { allowed: true };
    }

    var page = roleRoutes.pages.find(function (item) {
      return item.path === path;
    });
    if (!page) {
      return { allowed: true };
    }

    if (!sessionService.isAuthenticated()) {
      return { allowed: false, redirect: 'login' };
    }
    if (page.roles.indexOf(sessionService.role()) === -1) {
      return { allowed: false, redirect: 'unauthorized' };
    }
    return { allowed: true };
  }

  function requireAuthentication() {
    return sessionService.isAuthenticated();
  }

  return {
    authorize: authorize,
    requireAuthentication: requireAuthentication
  };
});
