define(['knockout'], function (ko) {
  'use strict';

  var TOKEN_KEY = 'finthink.auth.token';
  var expiryTimer = null;
  var expiryHandler = null;
  var username = ko.observable('Guest');
  var role = ko.observable('');
  var authenticated = ko.observable(false);

  function decodeClaims(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }
    try {
      var payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      payload += '='.repeat((4 - payload.length % 4) % 4);
      var binary = window.atob(payload);
      var bytes = new Uint8Array(binary.length);
      for (var index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      var payloadClaims = JSON.parse(new TextDecoder().decode(bytes));
      return { sub: payloadClaims.sub, role: payloadClaims.role, exp: payloadClaims.exp };
    } catch (error) {
      return null;
    }
  }

  function clearExpiryTimer() {
    if (expiryTimer !== null) {
      window.clearTimeout(expiryTimer);
      expiryTimer = null;
    }
  }

  function refreshSessionState() {
    var claims = decodeClaims(window.sessionStorage.getItem(TOKEN_KEY));
    if (!claims || !claims.exp || claims.exp * 1000 <= Date.now()) {
      clearExpiryTimer();
      window.sessionStorage.removeItem(TOKEN_KEY);
      username('Guest');
      role('');
      authenticated(false);
      return null;
    }
    username(claims.sub || 'User');
    role(claims.role || '');
    authenticated(true);
    clearExpiryTimer();
    expiryTimer = window.setTimeout(expireSession, claims.exp * 1000 - Date.now());
    return claims;
  }

  function expireSession() {
    clearSession();
    if (typeof expiryHandler === 'function') {
      expiryHandler();
    }
  }

  function setExpiryHandler(handler) {
    expiryHandler = handler;
  }

  refreshSessionState();

  function saveSession(loginResponse) {
    if (!loginResponse || !loginResponse.token) {
      throw new Error('A valid authentication token is required.');
    }

    window.sessionStorage.setItem(TOKEN_KEY, loginResponse.token);
    if (!refreshSessionState()) {
      throw new Error('The sign-in token is invalid or expired.');
    }
  }

  function getToken() {
    return window.sessionStorage.getItem(TOKEN_KEY);
  }

  function getClaims() {
    var token = getToken();
    if (!token) return null;
    try {
      var part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(part));
    } catch (error) {
      return null;
    }
  }

  function getCustomerId() {
    var claims = getClaims();
    var id = claims && Number(claims.customerId);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  function isAdmin() {
    var claims = getClaims();
    return !!claims && String(claims.role).toUpperCase() === 'ADMIN';
  }
  
  function getClaim() {
    var claims = decodeClaims(getToken());
    return claims && claims.exp * 1000 > Date.now() ? claims : null;
  }
  function getUsername() {
    return username();
  }

  function isAuthenticated() {
    return authenticated();
  }

  function clearSession() {
    clearExpiryTimer();
    window.sessionStorage.removeItem(TOKEN_KEY);
    username('Guest');
    role('');
    authenticated(false);
  }

  return {
    username: username,
    authenticated: authenticated,
    role: role,
    saveSession: saveSession,
    getToken: getToken,
    getCustomerId: getCustomerId,
    isAdmin: isAdmin,
    getClaims: getClaim,
    getUsername: getUsername,
    isAuthenticated: isAuthenticated,
    clearSession: clearSession,
    expireSession: expireSession,
    setExpiryHandler: setExpiryHandler
  };
});
