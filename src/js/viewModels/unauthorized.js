define([], function () {
  'use strict';

  function UnauthorizedViewModel() {
    this.title = 'Access restricted';
    this.connected = function () {
      document.title = 'Unauthorized | FinThink Bank';
    };
  }

  return UnauthorizedViewModel;
});