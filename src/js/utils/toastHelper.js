define([], function () {
  'use strict';

  function createToast(toast, liveMessage) {
    var timer;
    return {
      show: function (message) {
        toast(message);
        liveMessage(message);
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { toast(''); }, 5000);
      },
      clear: function () { window.clearTimeout(timer); }
    };
  }

  return { create: createToast };
});