define(['../config/apiConfig', 'text!../data/rewardMock.json', './apiClient'], function (config, fixtureText, apiClient) {
  'use strict';

  var fixture = JSON.parse(fixtureText);
  var mockRewards = fixture.map(function (item) { return Object.assign({}, item); });

  function mapRewardResponse(raw) {
    raw = raw || {};
    return {
      rewardId: raw.rewardId,
      rewardName: String(raw.rewardName || ''),
      rewardType: String(raw.rewardType || '').toUpperCase(),
      pointsRequired: Number(raw.pointsRequired),
      rewardValue: Number(raw.rewardValue),
      status: String(raw.status || '').toUpperCase(),
      startDate: raw.startDate || '',
      endDate: raw.endDate || ''
    };
  }

  function buildPayload(form) {
    return {
      rewardName: String(form.rewardName || '').trim(),
      rewardType: String(form.rewardType || '').toUpperCase(),
      pointsRequired: Number(form.pointsRequired),
      rewardValue: Number(form.rewardValue),
      startDate: String(form.startDate || '').slice(0, 10),
      endDate: String(form.endDate || '').slice(0, 10)
    };
  }

  function list() {
    if (config.useMockRewardData) return Promise.resolve(mockRewards.map(mapRewardResponse));
    return apiClient.get(config.rewardEndpoint).then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('Invalid reward list response.');
      return rows.map(mapRewardResponse);
    });
  }

  function create(form) {
    var payload = buildPayload(form);
    if (!config.useMockRewardData) return apiClient.post(config.rewardEndpoint, payload);
    var nextId = mockRewards.reduce(function (id, item) { return Math.max(id, Number(item.rewardId)); }, 7000) + 1;
    var created = Object.assign({ rewardId: nextId }, payload, { status: 'ACTIVE' });
    mockRewards.push(created);
    return Promise.resolve(mapRewardResponse(created));
  }

  function update(rewardId, form) {
    var payload = buildPayload(form);
    if (!config.useMockRewardData) return apiClient.put(config.rewardEndpoint + '/' + encodeURIComponent(rewardId), payload);
    var item = mockRewards.find(function (row) { return row.rewardId === rewardId; });
    if (!item) return Promise.reject(new Error('Reward not found.'));
    Object.assign(item, payload);
    return Promise.resolve(mapRewardResponse(item));
  }

  function updateStatus(rewardId, status) {
    var payload = {};
    payload[config.rewardStatusField] = status;
    if (!config.useMockRewardData) return apiClient.patch(config.rewardEndpoint + '/' + encodeURIComponent(rewardId) + '/status', payload);
    var item = mockRewards.find(function (row) { return row.rewardId === rewardId; });
    if (!item) return Promise.reject(new Error('Reward not found.'));
    item.status = status;
    return Promise.resolve(mapRewardResponse(item));
  }

  return { list: list, create: create, update: update, updateStatus: updateStatus,
    mapRewardResponse: mapRewardResponse, buildPayload: buildPayload };
});
