define(['./apiClient'], function (apiClient) {
  'use strict';

  var base = '/banking-service/api/beneficiaries';

  return {
    list: function () { return apiClient.get(base); },
    get: function (id) { return apiClient.get(base + '/' + encodeURIComponent(id)); },
    create: function (payload) { return apiClient.post(base, payload); },
    setStatus: function (id, status) {
      return apiClient.patch(base + '/' + encodeURIComponent(id) + '/status', { status: status });
    }
  };
});
