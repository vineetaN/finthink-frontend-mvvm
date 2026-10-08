define([
  'knockout',
  '../services/loanService',
  '../services/accountService',
  '../utils/authGuard'
], function (ko, loanService, accountService, authGuard) {
  'use strict';

  function LoansViewModel() {
    const self = this;

    self.loans = ko.observableArray([]);
    self.isLoading = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.hasLoaded = ko.observable(false);

    self.selectedLoan = ko.observable(null);
    self.isDetailLoading = ko.observable(false);
    self.detailError = ko.observable('');

    self.repayments = ko.observableArray([]);
    self.isRepaymentsLoading = ko.observable(false);
    self.repaymentsError = ko.observable('');

    self.isAutoPayDialogOpen = ko.observable(false);
    self.autoPayAccounts = ko.observableArray([]);
    self.selectedAutoPayAccountId = ko.observable(null);
    self.isAutoPayAccountsLoading = ko.observable(false);
    self.autoPayAccountsError = ko.observable('');
    self.autoPaySelectionError = ko.observable('');

    self.autoPayStep = ko.observable('select');
    self.autoPayReview = ko.observable(null);

    self.autoPayAuthorizationId = ko.observable(null);
self.isSendingAutoPayOtp = ko.observable(false);
self.autoPayOtpError = ko.observable('');

self.autoPayOtp = ko.observable('');
self.isVerifyingAutoPayOtp = ko.observable(false);
self.autoPaySuccessMessage = ko.observable('');

self.autoPayResendSeconds = ko.observable(0);
self.isResendingAutoPayOtp = ko.observable(false);
self.autoPayResendMessage = ko.observable('');

let autoPayResendTimer = null;
self.clearAutoPayResendTimer = function () {
  if (autoPayResendTimer) {
    window.clearInterval(autoPayResendTimer);
    autoPayResendTimer = null;
  }

  self.autoPayResendSeconds(0);
};

self.startAutoPayResendTimer = function () {
  self.clearAutoPayResendTimer();
  self.autoPayResendSeconds(60);

  autoPayResendTimer = window.setInterval(function () {
    const remaining = self.autoPayResendSeconds();

    if (remaining <= 1) {
      self.clearAutoPayResendTimer();
      return;
    }

    self.autoPayResendSeconds(remaining - 1);
  }, 1000);
};

    self.selectedAutoPayAccount = ko.pureComputed(function () {
      const selectedId = self.selectedAutoPayAccountId();

      return self.autoPayAccounts().find(function (account) {
        return String(account.accountId) === String(selectedId);
      }) || null;
    });

    self.canContinueAutoPay = ko.pureComputed(function () {
      return self.selectedAutoPayAccount() !== null;
    });

    self.formatCurrency = function (amount) {
      if (amount === null || amount === undefined) {
        return '—';
      }

      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount);
    };

    self.formatDate = function (value) {
      if (!value) {
        return '—';
      }

      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium'
      }).format(new Date(value));
    };

    self.loadLoans = function () {
      self.isLoading(true);
      self.errorMessage('');

      return loanService.getLoans()
        .then(function (response) {
          self.loans(Array.isArray(response) ? response : []);
          self.hasLoaded(true);
        })
        .catch(function (error) {
          self.loans([]);
          self.errorMessage(
            error.message || 'We could not load your loans. Please try again.'
          );
        })
        .finally(function () {
          self.isLoading(false);
        });
    };

    self.loadRepayments = function (loanId) {
      self.isRepaymentsLoading(true);
      self.repaymentsError('');
      self.repayments([]);

      return loanService.getRepaymentSchedule(loanId)
        .then(function (response) {
          self.repayments(Array.isArray(response) ? response : []);
        })
        .catch(function (error) {
          self.repaymentsError(
            error.message || 'We could not load the repayment schedule.'
          );
        })
        .finally(function () {
          self.isRepaymentsLoading(false);
        });
    };

    self.openLoanDetails = function (loan) {
      self.isDetailLoading(true);
      self.detailError('');
      self.selectedLoan(null);
      self.repayments([]);

      return loanService.getLoan(loan.loanId)
        .then(function (response) {
          self.selectedLoan(response);
          self.loadRepayments(response.loanId);
          window.setTimeout(function () {
            var detailPanel = document.getElementById('loan-detail-panel');
            if (detailPanel) {
              detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 0);
        })
        .catch(function (error) {
          self.detailError(
            error.message || 'We could not load this loan.'
          );
        })
        .finally(function () {
          self.isDetailLoading(false);
        });
    };

    self.closeLoanDetails = function () {
      self.selectedLoan(null);
      self.detailError('');
      self.repayments([]);
      self.repaymentsError('');
      self.closeAutoPayDialog();
    };

    self.openAutoPayDialog = function () {
      const loan = self.selectedLoan();

      if (!loan) {
        return;
      }

      self.autoPayStep('select');
      self.autoPayReview(null);
      self.autoPaySelectionError('');
      self.autoPayAccountsError('');
      self.autoPayAccounts([]);
      self.selectedAutoPayAccountId(loan.autopayAccountId || null);
      self.isAutoPayAccountsLoading(true);
      self.isAutoPayDialogOpen(true);

      return accountService.getMyAccounts()
        .then(function (response) {
          const activeAccounts = Array.isArray(response)
            ? response.filter(function (account) {
                return account.status === 'ACTIVE';
              })
            : [];

          self.autoPayAccounts(activeAccounts);
        })
        .catch(function (error) {
          self.autoPayAccountsError(
            error.message || 'We could not load your accounts.'
          );
        })
        .finally(function () {
          self.isAutoPayAccountsLoading(false);
        });
    };

    self.closeAutoPayDialog = function () {
      self.isAutoPayDialogOpen(false);
      self.autoPayAccountsError('');
      self.autoPaySelectionError('');
      self.autoPayStep('select');
      self.autoPayReview(null);
      self.clearAutoPayResendTimer();
self.autoPayAuthorizationId(null);
self.autoPayOtp('');
self.autoPayOtpError('');
self.autoPayResendMessage('');
self.autoPaySuccessMessage('');
    };

    self.showAutoPayReview = function () {
      const loan = self.selectedLoan();
      const account = self.selectedAutoPayAccount();

      if (!loan || !account) {
        self.autoPaySelectionError(
          'Please select an account for EMI AutoPay.'
        );
        return;
      }

      self.autoPayReview({
        loanAccountNo: loan.loanAccountNo || '—',
        emiAmount: loan.emiAmount,
        accountType: account.accountType || 'Account',
        accountMasked: account.accountMasked || '—',
        availableBalance: account.availableBalance
      });

      self.autoPaySelectionError('');
      self.autoPayStep('review');
    };

    self.editAutoPaySelection = function () {
      self.autoPayReview(null);
      self.autoPayStep('select');
    };

    self.sendAutoPayOtp = function () {
  const loan = self.selectedLoan();
  const account = self.selectedAutoPayAccount();

  if (!loan || !account) {
    self.autoPayOtpError(
      'Your loan or selected account is unavailable. Please try again.'
    );
    return;
  }

  self.isSendingAutoPayOtp(true);
  self.autoPayOtpError('');

  return loanService.initiateAutoPay(loan.loanId, account.accountId)
    .then(function (response) {
      self.autoPayAuthorizationId(response.authorizationId);
self.autoPayOtp('');
self.autoPayResendMessage('');
self.autoPayStep('otp');
self.startAutoPayResendTimer();
    })
    .catch(function (error) {
      self.autoPayOtpError(
        error.message || 'We could not send the verification code. Please try again.'
      );
    })
    .finally(function () {
      self.isSendingAutoPayOtp(false);
    });
};


self.canVerifyAutoPayOtp = ko.pureComputed(function () {
  return /^\d{6}$/.test(self.autoPayOtp().trim());
});

self.verifyAutoPayOtp = function () {
  const loan = self.selectedLoan();
  const authorizationId = self.autoPayAuthorizationId();
  const otp = self.autoPayOtp().trim();

  if (!loan || !authorizationId) {
    self.autoPayOtpError(
      'Your AutoPay request is no longer available. Please start again.'
    );
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    self.autoPayOtpError('Enter the six-digit verification code.');
    return;
  }

  self.isVerifyingAutoPayOtp(true);
  self.autoPayOtpError('');

  return loanService.verifyAutoPayOtp(loan.loanId, authorizationId, otp)
    .then(function () {
      self.autoPaySuccessMessage(
        'EMI AutoPay has been enabled successfully.'
      );
      self.autoPayStep('success');
      self.loadLoans();
      self.openLoanDetails(loan);
    })
    .catch(function (error) {
      self.autoPayOtpError(
        error.message || 'The verification code is incorrect or expired.'
      );
    })
    .finally(function () {
      self.isVerifyingAutoPayOtp(false);
    });
};



self.resendAutoPayOtp = function () {
  const authorizationId = self.autoPayAuthorizationId();

  if (!authorizationId || self.autoPayResendSeconds() > 0) {
    return;
  }

  self.isResendingAutoPayOtp(true);
  self.autoPayOtpError('');
  self.autoPayResendMessage('');

  return loanService.resendAutoPayOtp(authorizationId)
    .then(function () {
      self.autoPayOtp('');
      self.autoPayResendMessage(
        'A new verification code has been sent successfully.'
      );
      self.startAutoPayResendTimer();
    })
    .catch(function (error) {
      self.autoPayOtpError(
        error.message || 'We could not resend the verification code.'
      );
    })
    .finally(function () {
      self.isResendingAutoPayOtp(false);
    });
};

    self.connected = function () {
      if (!authGuard.requireAuthentication()) {
        return;
      }

      self.loadLoans();
    };
  }

  return LoansViewModel;
});
