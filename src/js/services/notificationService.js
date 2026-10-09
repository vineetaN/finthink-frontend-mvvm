define(['knockout', './apiClient'], function (ko, apiClient) {
  'use strict';

  var unreadCount = ko.observable(0);

  function getNotifications() {
    return apiClient.get(
      '/notification-service/api/notifications/me'
    );
  }

  function getNotificationsPage(page) {
    return apiClient.get(
      '/notification-service/api/notifications/me/page?page=' +
      encodeURIComponent(page)
    );
  }

  function getUnreadCount() {
    return apiClient.get(
      '/notification-service/api/notifications/me/unread-count'
    ).then(function (response) {
      unreadCount(response.unreadCount || 0);
      return response;
    });
  }

  function markAsRead(notificationId) {
    return apiClient.put(
      '/notification-service/api/notifications/' +
      notificationId +
      '/read'
    );
  }

  function markAllAsRead() {
    return apiClient.put(
      '/notification-service/api/notifications/read-all'
    );
  }

  function clearUnreadCount() {
    unreadCount(0);
  }

  return {
    unreadCount: unreadCount,
    getNotifications: getNotifications,
    getNotificationsPage: getNotificationsPage,
    getUnreadCount: getUnreadCount,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    clearUnreadCount: clearUnreadCount
  };
});
