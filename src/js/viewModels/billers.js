define([
  'knockout',
  '../services/billerService',
  '../services/accountService',
  '../utils/authGuard'
], function (ko, billerService, accountService, authGuard) {
  'use strict';

  function BillersViewModel() {
    var self = this;

    self.billers = ko.observableArray([]);
    self.isLoading = ko.observable(false);
    self.hasLoaded = ko.observable(false);
    self.errorMessage = ko.observable('');

    self.paymentHistory = ko.observableArray([]);
self.isLoadingPaymentHistory = ko.observable(false);
self.paymentHistoryError = ko.observable('');

self.paymentHistoryPage = ko.observable(0);
self.paymentHistoryTotalPages = ko.observable(0);
self.paymentHistoryTotalRecords = ko.observable(0);

    self.archivedBillers = ko.observableArray([]);
self.isLoadingArchived = ko.observable(false);
self.archivedError = ko.observable('');
self.archiveSuccess = ko.observable('');
self.isRestoringBiller = ko.observable(false);

self.billerToPermanentlyDelete = ko.observable(null);
self.isPermanentlyDeleting = ko.observable(false);
self.permanentDeleteError = ko.observable('');

    self.showAddForm = ko.observable(false);
    self.isSaving = ko.observable(false);
    self.addError = ko.observable('');
    self.addSuccess = ko.observable('');

    self.billerToDelete = ko.observable(null);
self.isDeleting = ko.observable(false);
self.deleteError = ko.observable('');

    self.billerName = ko.observable('');
    self.category = ko.observable('');
    self.consumerNumber = ko.observable('');
    self.nickname = ko.observable('');

    self.openInfoSection = ko.observable('');

self.toggleInfoSection = function (section) {
  self.openInfoSection(
    self.openInfoSection() === section ? '' : section
  );
};

    self.canSaveBiller = ko.pureComputed(function () {
      return !self.isSaving() &&
        self.billerName().trim() &&
        self.category().trim() &&
        self.consumerNumber().trim();
    });

    self.loadBillers = function () {
      self.isLoading(true);
      self.errorMessage('');

      return billerService.getMyBillers()
        .then(function (response) {
          self.billers(Array.isArray(response) ? response : []);
          self.hasLoaded(true);
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not load your billers.'
          );
        })
        .finally(function () {
          self.isLoading(false);
        });
    };


self.fetchPaymentHistoryPage = function (page) {
  if (self.isLoadingPaymentHistory() || page < 0) {
    return;
  }

  self.isLoadingPaymentHistory(true);
  self.paymentHistoryError('');

  return billerService.getPaymentHistoryPage(page)
    .then(function (response) {
      self.paymentHistory(
        Array.isArray(response.content) ? response.content : []
      );
      self.paymentHistoryPage(response.number ?? page);
      self.paymentHistoryTotalPages(response.totalPages ?? 0);
      self.paymentHistoryTotalRecords(response.totalElements ?? 0);
    })
    .catch(function (error) {
      self.paymentHistoryError(
        error.message || 'We could not load your bill payments.'
      );
    })
    .finally(function () {
      self.isLoadingPaymentHistory(false);
    });
};

self.loadPaymentHistory = function () {
  return self.fetchPaymentHistoryPage(0);
};

self.goToPreviousPaymentPage = function () {
  if (self.paymentHistoryPage() > 0) {
    return self.fetchPaymentHistoryPage(self.paymentHistoryPage() - 1);
  }
};

self.goToNextPaymentPage = function () {
  if (self.paymentHistoryPage() + 1 < self.paymentHistoryTotalPages()) {
    return self.fetchPaymentHistoryPage(self.paymentHistoryPage() + 1);
  }
};

    self.openAddForm = function () {
      self.addError('');
      self.addSuccess('');
      self.showAddForm(true);
    };

    self.closeAddForm = function () {
      if (!self.isSaving()) {
        self.showAddForm(false);
        self.addError('');
      }
    };

    self.saveBiller = function () {
      if (!self.canSaveBiller()) {
        return false;
      }

      self.isSaving(true);
      self.addError('');
      self.addSuccess('');

      billerService.addBiller({
        billerName: self.billerName().trim(),
        category: self.category().trim(),
        consumerNumber: self.consumerNumber().trim(),
        nickname: self.nickname().trim()
      })
        .then(function () {
          self.billerName('');
          self.category('');
          self.consumerNumber('');
          self.nickname('');
          self.showAddForm(false);
          self.addSuccess('Biller added successfully.');
          return Promise.all([
  self.loadBillers(),
  self.loadArchivedBillers()
]);
        })
        .catch(function (error) {
          self.addError(error.message || 'We could not add this biller.');
        })
        .finally(function () {
          self.isSaving(false);
        });

      return false;
    };


    self.askDeleteBiller = function (biller) {
  self.deleteError('');
  self.addSuccess('');
  self.billerToDelete(biller);
};

self.cancelDeleteBiller = function () {
  if (!self.isDeleting()) {
    self.billerToDelete(null);
    self.deleteError('');
  }
};

self.confirmDeleteBiller = function () {
  var biller = self.billerToDelete();

  if (!biller || self.isDeleting()) {
    return;
  }

  self.isDeleting(true);
  self.deleteError('');

  billerService.deleteBiller(biller.billerId)
    .then(function () {
      self.billerToDelete(null);
      self.addSuccess('Biller removed from your saved billers.');
      return Promise.all([
  self.loadBillers(),
  self.loadArchivedBillers()
]);
    })
    .catch(function (error) {
      self.deleteError(error.message || 'We could not remove this biller.');
    })
    .finally(function () {
      self.isDeleting(false);
    });
};

self.paymentBiller = ko.observable(null);
self.paymentStep = ko.observable('form');
self.paymentAccounts = ko.observableArray([]);
self.isLoadingPaymentAccounts = ko.observable(false);
self.paymentError = ko.observable('');
self.paymentAccountId = ko.observable('');
self.paymentAmount = ko.observable('');
self.paymentDescription = ko.observable('');

self.paymentAuthorizationId = ko.observable('');
self.paymentOtp = ko.observable('');
self.isSendingPaymentOtp = ko.observable(false);
self.isVerifyingPayment = ko.observable(false);
self.paymentResult = ko.observable(null);


self.paymentResendSeconds = ko.observable(0);
self.paymentResendMessage = ko.observable('');
self.isResendingPaymentOtp = ko.observable(false);

var paymentResendTimer = null;

function stopPaymentResendTimer() {
  if (paymentResendTimer) {
    window.clearInterval(paymentResendTimer);
    paymentResendTimer = null;
  }
}

function startPaymentResendTimer() {
  stopPaymentResendTimer();

  var availableAt = Date.now() + 60000;
  self.paymentResendSeconds(60);

  paymentResendTimer = window.setInterval(function () {
    var remaining = Math.max(
      0,
      Math.ceil((availableAt - Date.now()) / 1000)
    );

    self.paymentResendSeconds(remaining);

    if (remaining === 0) {
      stopPaymentResendTimer();
    }
  }, 250);
}

self.paymentAccount = ko.pureComputed(function () {
  return self.paymentAccounts().find(function (account) {
    return String(account.accountId) === String(self.paymentAccountId());
  }) || null;
});

self.formatCurrency = function (amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Number(amount) || 0);
};


self.formatPaymentDate = function (value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

self.canReviewPayment = ko.pureComputed(function () {
  var account = self.paymentAccount();
  var amountText = self.paymentAmount().trim();
  var amount = Number(amountText);

  return account &&
    /^\d+(\.\d{1,2})?$/.test(amountText) &&
    amount > 0 &&
    amount <= Number(account.availableBalance) &&
    !self.isLoadingPaymentAccounts();
});

self.openPayBiller = function (biller) {
  self.paymentBiller(biller);
  self.paymentStep('form');
  self.paymentAccountId('');
  self.paymentAmount('');
  self.paymentDescription('');
  self.paymentError('');
  self.paymentAuthorizationId('');
self.paymentOtp('');
self.paymentResult(null);
  self.paymentAccounts([]);
  self.isLoadingPaymentAccounts(true);
  stopPaymentResendTimer();
self.paymentResendSeconds(0);
self.paymentResendMessage('');

  accountService.getMyAccounts()
    .then(function (response) {
      var accounts = Array.isArray(response) ? response.filter(function (account) {
        return account.status === 'ACTIVE';
      }) : [];

      self.paymentAccounts(accounts);

      if (accounts.length === 1) {
        self.paymentAccountId(accounts[0].accountId);
      }
    })
    .catch(function (error) {
      self.paymentError(error.message || 'We could not load your accounts.');
    })
    .finally(function () {
      self.isLoadingPaymentAccounts(false);
    });
};

self.closePayBiller = function () {
  if (self.isSendingPaymentOtp() ||
      self.isResendingPaymentOtp() ||
      self.isVerifyingPayment()) {
    return;
  }

  stopPaymentResendTimer();
  self.paymentBiller(null);
  self.paymentError('');
};

self.reviewPayment = function () {
  if (!self.canReviewPayment()) {
    self.paymentError('Choose an account and enter an amount within its available balance.');
    return;
  }

  self.paymentError('');
  self.paymentStep('review');
};

self.editPayment = function () {
  self.paymentStep('form');
};


self.sendPaymentOtp = function () {
  var biller = self.paymentBiller();
  var account = self.paymentAccount();

  if (!biller || !account || !self.canReviewPayment() ||
      self.isSendingPaymentOtp()) {
    return;
  }

  self.isSendingPaymentOtp(true);
  self.paymentError('');

  billerService.initiatePayment(biller.billerId, {
    accountId: account.accountId,
    amount: Number(self.paymentAmount()),
    description: self.paymentDescription().trim()
  })
    .then(function (response) {
      if (!response || !response.authorizationId) {
        throw new Error('The verification request was incomplete. Please try again.');
      }

      self.paymentAuthorizationId(response.authorizationId);
      self.paymentResendMessage('');
startPaymentResendTimer();
      self.paymentOtp('');
      self.paymentStep('otp');
    })
    .catch(function (error) {
      self.paymentError(error.message || 'We could not send your verification code.');
    })
    .finally(function () {
      self.isSendingPaymentOtp(false);
    });
};

self.resendPaymentOtp = function () {
  if (!self.paymentAuthorizationId() ||
      self.paymentStep() !== 'otp' ||
      self.paymentResendSeconds() > 0 ||
      self.isResendingPaymentOtp()) {
    return;
  }

  self.isResendingPaymentOtp(true);
  self.paymentError('');
  self.paymentResendMessage('');

  billerService.resendPaymentOtp(self.paymentAuthorizationId())
    .then(function () {
      self.paymentOtp('');
      self.paymentResendMessage('A new OTP was sent successfully.');
      startPaymentResendTimer();
    })
    .catch(function (error) {
      self.paymentError(error.message || 'We could not resend the OTP.');
    })
    .finally(function () {
      self.isResendingPaymentOtp(false);
    });
};

self.verifyPaymentOtp = function () {
  var biller = self.paymentBiller();
  var otp = self.paymentOtp().trim();

  if (!biller || !self.paymentAuthorizationId() ||
      !/^\d{6}$/.test(otp) || self.isVerifyingPayment()) {
    return;
  }

  self.isVerifyingPayment(true);
  self.paymentError('');

  billerService.verifyPayment(
    biller.billerId,
    self.paymentAuthorizationId(),
    otp
  )
    .then(function (response) {
      stopPaymentResendTimer();
      self.paymentResult(response);
      self.paymentStep('success');
      self.loadPaymentHistory();
    })
    .catch(function (error) {
      self.paymentError(error.message || 'The payment could not be completed.');
    })
    .finally(function () {
      self.isVerifyingPayment(false);
    });
};

self.disconnected = function () {
  stopPaymentResendTimer();
};


self.loadArchivedBillers = function () {
  self.isLoadingArchived(true);
  self.archivedError('');

  return billerService.getArchivedBillers()
    .then(function (response) {
      self.archivedBillers(Array.isArray(response) ? response : []);
    })
    .catch(function (error) {
      self.archivedError(
        error.message || 'We could not load your archived billers.'
      );
    })
    .finally(function () {
      self.isLoadingArchived(false);
    });
};

self.restoreArchivedBiller = function (biller) {
  if (self.isRestoringBiller()) {
    return;
  }

  self.isRestoringBiller(true);
  self.archivedError('');
  self.archiveSuccess('');

  billerService.restoreBiller(biller.billerId)
    .then(function () {
      self.archiveSuccess('Biller restored to your saved billers.');
      return Promise.all([
        self.loadBillers(),
        self.loadArchivedBillers()
      ]);
    })
    .catch(function (error) {
      self.archivedError(
        error.message || 'We could not restore this biller.'
      );
    })
    .finally(function () {
      self.isRestoringBiller(false);
    });
};


self.askPermanentDelete = function (biller) {
  if (biller.hasPayments !== false) {
  return;
}
  self.permanentDeleteError('');
  self.archiveSuccess('');
  self.billerToPermanentlyDelete(biller);
};

self.cancelPermanentDelete = function () {
  if (!self.isPermanentlyDeleting()) {
    self.billerToPermanentlyDelete(null);
    self.permanentDeleteError('');
  }
};

self.confirmPermanentDelete = function () {
  var biller = self.billerToPermanentlyDelete();

  if (!biller || self.isPermanentlyDeleting()) {
    return;
  }

  self.isPermanentlyDeleting(true);
  self.permanentDeleteError('');

  billerService.permanentlyDeleteBiller(biller.billerId)
    .then(function () {
      self.billerToPermanentlyDelete(null);
      self.archiveSuccess('Archived biller permanently deleted.');
      return self.loadArchivedBillers();
    })
    .catch(function (error) {
      self.permanentDeleteError(
        error.status === 409
          ? 'This biller has payment history and must remain archived.'
          : (error.message || 'We could not permanently delete this biller.')
      );
    })
    .finally(function () {
      self.isPermanentlyDeleting(false);
    });
};
    self.connected = function () {
  if (authGuard.requireAuthentication()) {
    self.loadBillers();
    self.loadArchivedBillers();
    self.loadPaymentHistory();
  }
};
  }

  return BillersViewModel;
});
