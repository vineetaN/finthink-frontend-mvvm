define([], function () {
  'use strict';

  return function (pageTitle) {
    return function PlaceholderPageViewModel() {
      this.title = pageTitle;
      this.connected = function () {
        document.title = pageTitle + ' | FinThink Bank';
      };
    };
  };
});