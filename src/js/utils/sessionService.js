define(['knockout'], function (ko) {
  'use strict';

  var TOKEN_KEY = 'finthink.auth.token';
  var USERNAME_KEY = 'finthink.auth.username';

  var username = ko.observable(
    window.sessionStorage.getItem(USERNAME_KEY) || 'Guest'
  );

  var authenticated = ko.observable(
    Boolean(window.sessionStorage.getItem(TOKEN_KEY))
  );

  function saveSession(loginResponse) {
    if (!loginResponse || !loginResponse.token) {
      throw new Error('A valid authentication token is required.');
    }

    window.sessionStorage.setItem(TOKEN_KEY, loginResponse.token);
    window.sessionStorage.setItem(
      USERNAME_KEY,
      loginResponse.username || ''
    );

    username(loginResponse.username || 'Guest');
    authenticated(true);
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

  function getUsername() {
    return username();
  }

  function isAuthenticated() {
    return authenticated();
  }

  function clearSession() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USERNAME_KEY);

    username('Guest');
    authenticated(false);
  }

  return {
    username: username,
    authenticated: authenticated,
    saveSession: saveSession,
    getToken: getToken,
    getCustomerId: getCustomerId,
    isAdmin: isAdmin,
    getUsername: getUsername,
    isAuthenticated: isAuthenticated,
    clearSession: clearSession
  };
});
