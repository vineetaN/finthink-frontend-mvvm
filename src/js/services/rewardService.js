define(['./apiClient'], function (apiClient) {
  'use strict';

  var base = '/banking-service/api/rewards';
  var adminBase = '/banking-service/admin/rewards';

  return {
    list: function () { return apiClient.get(base); },
    get: function (id) { return apiClient.get(base + '/' + encodeURIComponent(id)); },
    wallet: function () { return apiClient.get(base + '/wallet'); },
    redeem: function (id, accountId) {
      return apiClient.post(base + '/' + encodeURIComponent(id) + '/redeem',
        accountId == null ? {} : { accountId: Number(accountId) });
    },
    listAdmin: function () { return apiClient.get(adminBase); },
    create: function (payload) { return apiClient.post(adminBase, payload); },
    update: function (id, payload) {
      return apiClient.put(adminBase + '/' + encodeURIComponent(id), payload);
    },
    setStatus: function (id, status) {
      return apiClient.patch(adminBase + '/' + encodeURIComponent(id) + '/status', { status: status });
    }
  };
});
