define(['./apiClient'], function (apiClient) {
  'use strict';

  var AUTH_OPTIONS = {
    requiresAuth: false
  };

  return {
    sendRegistrationOtp: function (email) {
      return apiClient.post(
        '/identification-service/auth/registrationOtp',
        { email: email },
        AUTH_OPTIONS
      );
    },

    register: function (payload) {
      return apiClient.post(
        '/identification-service/auth/userRegistration',
        payload,
        AUTH_OPTIONS
      );
    },

    login: function (payload) {
      return apiClient.post(
        '/identification-service/auth/userLogin',
        payload,
        AUTH_OPTIONS
      );
    },

    verifyOtp: function (payload) {
      return apiClient.post(
        '/identification-service/auth/userLogin',
        payload,
        AUTH_OPTIONS
      );
    },
    startPasswordChange: function (currentPassword) {
  return apiClient.post(
    '/identification-service/account/password/change/initiate',
    { currentPassword: currentPassword }
  );
},


forgotPassword: function (username) {
  return apiClient.post(
    '/identification-service/auth/forgotPassword',
    { username: username },
    AUTH_OPTIONS
  );
},

resetPassword: function (username, otp, newPassword) {
  return apiClient.post(
    '/identification-service/auth/changePassword',
    {
      username: username,
      otp: otp,
      newPassword: newPassword
    },
    AUTH_OPTIONS
  );
} ,

confirmPasswordChange: function (otp, newPassword) {
  return apiClient.post(
    '/identification-service/account/password/change/confirm',
    {
      otp: otp,
      newPassword: newPassword
    }
  );
}
  };
});
