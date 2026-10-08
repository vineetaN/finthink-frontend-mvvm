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

    var url = /^https?:\/\//i.test(path) ? path : apiConfig.apiGatewayBaseUrl + path;
    return fetch(url, fetchOptions)
      .then(function (response) {
        return parseResponse(response).then(function (body) {
          if (!response.ok) {
            if (response.status === 401 && requiresAuth) {
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

  function download(path, fileName) {
    var token = sessionService.getToken();

    if (!token) {
      return Promise.reject(
        new Error('Your session has expired. Please sign in again.')
      );
    }

    return fetch(apiConfig.apiGatewayBaseUrl + path, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return parseResponse(response).then(function (body) {
            if (response.status === 401 || response.status === 403) {
              sessionService.clearSession();
            }

            var error = new Error(
              body.message ||
              body.error ||
              'The statement could not be downloaded.'
            );

            error.status = response.status;
            throw error;
          });
        }

        return response.blob();
      })
      .then(function (pdfBlob) {
        var url = window.URL.createObjectURL(pdfBlob);
        var link = document.createElement('a');

        link.href = url;
        link.download = fileName || 'FinThink_Statement.pdf';

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(function () {
          window.URL.revokeObjectURL(url);
        }, 1000);
      });
  }

  return {
    get: function (path, options) {
      return request('GET', path, null, options);
    },

    download: download,

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
