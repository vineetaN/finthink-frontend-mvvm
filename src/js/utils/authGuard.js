define([
  './sessionService',
  './navigationService'
], function (sessionService, navigationService) {
  'use strict';

  function requireAuthentication() {
    if (sessionService.isAuthenticated()) {
      return true;
    }

    navigationService.goTo('login');
    return false;
  }

  return {
    requireAuthentication: requireAuthentication
  };
});