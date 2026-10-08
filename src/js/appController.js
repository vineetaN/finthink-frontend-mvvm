/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your application specific code will go here
 */
define([
  'knockout',
  'ojs/ojcontext',
  'ojs/ojknockouttemplateutils',
  'ojs/ojcorerouter',
  'ojs/ojmodulerouter-adapter',
  'ojs/ojknockoutrouteradapter',
  'ojs/ojurlparamadapter',
  'ojs/ojresponsiveutils',
  'ojs/ojresponsiveknockoututils',
  'ojs/ojarraytreedataprovider',
  './utils/navigationService',
  './utils/sessionService',
  './utils/authGuard',
  './config/roleRoutes',
    './services/notificationService',
  './services/authService',
  // side-effect imports (no parameter)
  'ojs/ojmodule-element',
  'ojs/ojknockout',
  'ojs/ojdrawerlayout',
  'ojs/ojdrawerpopup',
  'ojs/ojnavigationlist',
  'ojs/ojavatar',
  'ojs/ojmenu',
  'ojs/ojdialog',
  'ojs/ojbutton',
  'ojs/ojinputtext',
  'ojs/ojlabel',
  'ojs/ojtoolbar'
], function (
  ko,
  Context,
  KnockoutTemplateUtils,
  CoreRouter,
  ModuleRouterAdapter,
  KnockoutRouterAdapter,
  UrlParamAdapter,
  ResponsiveUtils,
  ResponsiveKnockoutUtils,
  ArrayTreeDataProvider,
  navigationService,
  sessionService,
  authGuard,
  roleRoutes,
  notificationService,
  authService
)  {
     function ControllerViewModel() {

      this.KnockoutTemplateUtils = KnockoutTemplateUtils;

      // Handle announcements sent when pages change, for Accessibility.
      this.manner = ko.observable('polite');
      this.message = ko.observable();
      const announcementHandler = (event) => {
          this.message(event.detail.message);
          this.manner(event.detail.manner);
      };

      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);


      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const lgQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
      this.lgScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);

      const navData = [
        { path: '', redirect: 'login' },
        { path: 'login' },
        { path: 'register' },
        { path: 'forgotPassword' },
        { path: 'unauthorized' }
      ].concat(roleRoutes.pages.map((page) => ({ path: page.path })));
      // Router setup
      let router = new CoreRouter(navData, {
        urlAdapter: new UrlParamAdapter()
      });
      navigationService.initialize(router);
      sessionService.setExpiryHandler(() => navigationService.goTo('login'));
      router.beforeStateChange.subscribe((args) => {
        const decision = authGuard.authorize(args.state);
        args.accept(decision.allowed ? Promise.resolve() : Promise.reject(new Error('Route access denied')));
        if (!decision.allowed) {
          window.setTimeout(() => navigationService.goTo(decision.redirect), 0);
        }
      });
      router.sync().catch(() => {});

      this.moduleAdapter = new ModuleRouterAdapter(router);

      this.selection = new KnockoutRouterAdapter(router);

      const navItem = (path) => {
        const page = roleRoutes.pages.find((entry) => entry.path === path);
        return { path, detail: { label: page.label, iconClass: page.iconClass } };
      };

      const customerNavData = [
        navItem('dashboard'),
        navItem('customerSummary'),
        navItem('transactions'),
        navItem('fundTransfer'),
        navItem('beneficiaries'),
        navItem('billers'),
        navItem('cards'),
        navItem('loans'),
        {
          path: 'investmentMenu',
          detail: { label: 'Investments', iconClass: 'oj-ux-ico-money-investment' },
          children: [
            navItem('investments'),
            navItem('investmentDeposits'),
            navItem('mutualFunds')
          ]
        },
        {
          path: 'rewardsMenu',
          detail: { label: 'Rewards', iconClass: 'oj-ux-ico-gift' },
          children: [navItem('rewards'), navItem('rewardsWallet')]
        }
      ];

      const adminNavData = roleRoutes.pages
       .filter((page) => page.roles.includes('ADMIN') && page.path !== 'changePassword')
        .map((page) => navItem(page.path));

      this.customerNavDataProvider = new ArrayTreeDataProvider(customerNavData, {
        keyAttributes: 'path'
      });
      this.adminNavDataProvider = new ArrayTreeDataProvider(adminNavData, {
        keyAttributes: 'path'
      });

      this.isAuthenticated = sessionService.authenticated;
      this.isCustomer = ko.pureComputed(() => sessionService.role() === 'CUSTOMER');
      this.isAdmin = ko.pureComputed(() => sessionService.role() === 'ADMIN');

      this.unreadNotificationCount = notificationService.unreadCount;

      this.refreshUnreadNotificationCount = function () {
        if (!sessionService.isAuthenticated()) {
          notificationService.clearUnreadCount();
          return;
        }

        notificationService.getUnreadCount().catch(function () {
          // Keep the last known count if this request temporarily fails.
        });
      };

      sessionService.authenticated.subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.refreshUnreadNotificationCount();
        } else {
          notificationService.clearUnreadCount();
        }
      });

      this.refreshUnreadNotificationCount();
      // Drawer
      this.sideDrawerOn = ko.observable(false);
      this.adminDrawerOn = ko.observable(false);

      // Close the menu when its display mode changes.
      this.lgScreen.subscribe(() => { this.sideDrawerOn(false); this.adminDrawerOn(false); });
      sessionService.role.subscribe(() => { this.sideDrawerOn(false); this.adminDrawerOn(false); });

      // Open or close the menu from either menu icon.
      this.toggleDrawer = () => {
        this.sideDrawerOn(!this.sideDrawerOn());
      }
      this.toggleAdminDrawer = () => {
        this.adminDrawerOn(!this.adminDrawerOn());
      };

      this.handleNavSelection = (event) => {
        const path = event.detail.value;

        if (!path || path === 'investmentMenu' || path === 'rewardsMenu') {
          return;
        }

        this.sideDrawerOn(false);
        this.adminDrawerOn(false);
        navigationService.goTo(path);
      };

      this.goToNotifications = () => {
        navigationService.goTo('notifications');
      };

      this.handleLogout = () => {
        sessionService.clearSession();
        navigationService.goTo('login');
      };

      this.handleUserMenuAction = (event) => {
        const selectedValue = event.detail.selectedValue;
        if (event.detail.selectedValue === 'out') {
          this.handleLogout();
        } else if (event.detail.selectedValue === 'changePassword') {
          this.openPasswordChange();
        }
      };

      this.passwordChangeStep = ko.observable('current');
      this.currentPassword = ko.observable('');
      this.passwordChangeOtp = ko.observable('');
      this.newPassword = ko.observable('');
      this.passwordChangeMessage = ko.observable('');
      this.passwordChangeError = ko.observable(false);
      this.passwordChangePending = ko.observable(false);

      this.openPasswordChange = () => {
        this.resetPasswordChange();
        document.getElementById('passwordChangeDialog').open();
      };
      this.closePasswordChange = () => {
        document.getElementById('passwordChangeDialog').close();
      };
      this.beforeClosePasswordChange = (event) => {
        if (this.passwordChangePending()) {
          event.preventDefault();
        }
      };
      this.resetPasswordChange = () => {
        this.passwordChangeStep('current');
        this.currentPassword('');
        this.passwordChangeOtp('');
        this.newPassword('');
        this.passwordChangeMessage('');
        this.passwordChangeError(false);
        this.passwordChangePending(false);
      };
      this.submitPasswordChange = () => {
        this.passwordChangeMessage('');
        this.passwordChangeError(false);

        if (this.passwordChangeStep() === 'current') {
          if (!this.currentPassword()) {
            this.passwordChangeError(true);
            this.passwordChangeMessage('Enter your current password.');
            return;
          }

          this.passwordChangePending(true);
          authService.initiatePasswordChange({
            currentPassword: this.currentPassword()
          }).then((response) => {
            this.passwordChangeStep('confirm');
            this.passwordChangeMessage(
              response.message || 'A verification code has been sent to your registered contact.'
            );
          }).catch((error) => {
            this.passwordChangeError(true);
            this.passwordChangeMessage(error.message || 'Could not request a verification code.');
          }).finally(() => {
            this.passwordChangePending(false);
          });
          return;
        }

        if (this.passwordChangeStep() !== 'confirm') {
          return;
        }
        if (!/^[0-9]{6}$/.test(this.passwordChangeOtp())) {
          this.passwordChangeError(true);
          this.passwordChangeMessage('Enter the six-digit verification code.');
          return;
        }
        if (this.newPassword().length < 8 || this.newPassword().length > 100) {
          this.passwordChangeError(true);
          this.passwordChangeMessage('Your new password must be between 8 and 100 characters.');
          return;
        }

        if (selectedValue === 'changePassword') {
          navigationService.goTo('changePassword');
        } else if (selectedValue === 'out') {
          this.handleLogout();
        }
      };
        this.passwordChangePending(true);
        authService.confirmPasswordChange({
          otp: this.passwordChangeOtp(),
          newPassword: this.newPassword()
        }).then((response) => {
          this.passwordChangeStep('complete');
          this.passwordChangeMessage(response.message || 'Your password has been changed.');
          this.currentPassword('');
          this.passwordChangeOtp('');
          this.newPassword('');
        }).catch((error) => {
          this.passwordChangeError(true);
          this.passwordChangeMessage(error.message || 'Could not change your password.');
        }).finally(() => {
          this.passwordChangePending(false);
        });
      };

      // Header
      // Application Name used in Branding Area
      this.appName = ko.observable("FinThink Bank");
      // User Info used in Global Navigation area
      this.userLogin = sessionService.username;
      this.userRole = sessionService.role;
      this.userInitials = ko.pureComputed(() =>
        (sessionService.username() || 'U').slice(0, 2).toUpperCase());
      this.accessDeniedMessage = ko.observable('');
      this.dismissAccessDenied = () => this.accessDeniedMessage('');
      window.addEventListener('access-denied', (event) => {
        this.accessDeniedMessage(event.detail.message || 'Access denied');
      });

      // Footer
     this.footerLinks = [];
     }
     // release the application bootstrap busy state
     Context.getPageContext().getBusyContext().applicationBootstrapComplete();

     return new ControllerViewModel();
  }
);
