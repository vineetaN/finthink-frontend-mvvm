define([
  '../config/apiConfig',
  '../utils/sessionService'
], function (apiConfig, sessionService) {
  'use strict';

  function parseResponse(response) {
    return response.json().catch(function () {
      return {};
    });
  }

  function request(method, path, payload, options) {
    options = options || {};

    var requiresAuth = options.requiresAuth !== false;
    var headers = {
      'Content-Type': 'application/json'
    };

    if (requiresAuth) {
      var token = sessionService.getToken();

      if (!token) {
        sessionService.expireSession();
        return Promise.reject(
          new Error('Your session has expired. Please sign in again.')
        );
      }

      headers.Authorization = 'Bearer ' + token;
    }

    var fetchOptions = {
      method: method,
      headers: headers
    };

    if (payload !== undefined && payload !== null) {
      fetchOptions.body = JSON.stringify(payload);
    }

    return fetch(apiConfig.apiGatewayBaseUrl + path, fetchOptions)
      .then(function (response) {
        return parseResponse(response).then(function (body) {
          if (!response.ok) {
            if (response.status === 401) {
              sessionService.expireSession();
            } else if (response.status === 403) {
              window.dispatchEvent(new CustomEvent('access-denied', {
                detail: { message: 'Access denied' }
              }));
            }

            var requestError = new Error(
  body.message ||
  body.error ||
  body.detail ||
  'The request could not be completed.'
);

requestError.status = response.status;
requestError.body = body;

throw requestError;
          }

          return body;
        });
      });
  }

  return {
    get: function (path, options) {
      return request('GET', path, null, options);
    },

    post: function (path, payload, options) {
      return request('POST', path, payload, options);
    },

    put: function (path, payload, options) {
      return request('PUT', path, payload, options);
    },

    patch: function (path, payload, options) {
      return request('PATCH', path, payload, options);
    },

    remove: function (path, options) {
      return request('DELETE', path, null, options);
    }
  };
});
