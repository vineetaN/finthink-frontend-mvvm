define([
  'knockout',
  '../services/notificationService',
  '../utils/authGuard'
], function (ko, notificationService, authGuard) {
  'use strict';

  function NotificationsViewModel() {
    const self = this;

    self.notifications = ko.observableArray([]);
    self.unreadCount = notificationService.unreadCount;
    self.isLoading = ko.observable(false);
    self.isMarkingAllRead = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.actionError = ko.observable('');
    self.expandedNotificationId = ko.observable(null);
    self.currentPage = ko.observable(0);
    self.totalPages = ko.observable(0);
    self.totalRecords = ko.observable(0);

    self.formatDateTime = function (value) {
      if (!value) {
        return '—';
      }

      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value));
    };

    self.isUnread = function (notification) {
      return notification.isRead === 'N';
    };

    self.isExpanded = function (notification) {
      return String(self.expandedNotificationId()) ===
        String(notification.notificationId);
    };

    self.loadNotificationsPage = function (page) {
      if (self.isLoading() || page < 0) {
        return;
      }

      self.isLoading(true);
      self.errorMessage('');

      return Promise.all([
        notificationService.getNotificationsPage(page),
        notificationService.getUnreadCount()
      ])
        .then(function (responses) {
          const notificationPage = responses[0];
          self.notifications(
            Array.isArray(notificationPage.content)
              ? notificationPage.content
              : []
          );
          self.currentPage(notificationPage.number ?? page);
          self.totalPages(notificationPage.totalPages ?? 0);
          self.totalRecords(notificationPage.totalElements ?? 0);
          self.expandedNotificationId(null);
          self.unreadCount(responses[1].unreadCount || 0);
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not load your notifications.'
          );
        })
        .finally(function () {
          self.isLoading(false);
        });
    };

    self.loadNotifications = function () {
      return self.loadNotificationsPage(0);
    };

    self.goToPreviousPage = function () {
      if (self.currentPage() > 0) {
        return self.loadNotificationsPage(self.currentPage() - 1);
      }
    };

    self.goToNextPage = function () {
      if (self.currentPage() + 1 < self.totalPages()) {
        return self.loadNotificationsPage(self.currentPage() + 1);
      }
    };

    self.markAsRead = function (notification) {
      if (!self.isUnread(notification)) {
        return Promise.resolve();
      }

      self.actionError('');

      return notificationService.markAsRead(notification.notificationId)
        .then(function (updatedNotification) {
          notification.isRead = updatedNotification.isRead;
          self.notifications.valueHasMutated();
          self.unreadCount(Math.max(0, self.unreadCount() - 1));
        })
        .catch(function (error) {
          self.actionError(
            error.message || 'We could not mark this notification as read.'
          );
        });
    };

    self.toggleNotificationDetails = function (notification) {
      if (self.isExpanded(notification)) {
        self.expandedNotificationId(null);
        return;
      }

      self.expandedNotificationId(notification.notificationId);

      if (self.isUnread(notification)) {
        self.markAsRead(notification);
      }
    };

    self.markAllAsRead = function () {
      if (self.unreadCount() === 0) {
        return;
      }

      self.isMarkingAllRead(true);
      self.actionError('');

      return notificationService.markAllAsRead()
        .then(function () {
          self.notifications().forEach(function (notification) {
            notification.isRead = 'Y';
          });

          self.notifications.valueHasMutated();
          self.unreadCount(0);
        })
        .catch(function (error) {
          self.actionError(
            error.message || 'We could not mark all notifications as read.'
          );
        })
        .finally(function () {
          self.isMarkingAllRead(false);
        });
    };

    self.connected = function () {
      if (!authGuard.requireAuthentication()) {
        return;
      }

      self.loadNotifications();
    };
  }

  return NotificationsViewModel;
});
