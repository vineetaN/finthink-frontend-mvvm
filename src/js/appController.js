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
  'ojs/ojmodule-element-utils',
  'ojs/ojknockouttemplateutils',
  'ojs/ojcorerouter',
  'ojs/ojmodulerouter-adapter',
  'ojs/ojknockoutrouteradapter',
  'ojs/ojurlparamadapter',
  'ojs/ojresponsiveutils',
  'ojs/ojresponsiveknockoututils',
  'ojs/ojarraytreedataprovider',
  'ojs/ojdrawerlayout',
  'ojs/ojmodule-element',
  'ojs/ojknockout',
  './utils/navigationService',
  './utils/sessionService',
  './services/notificationService'
],
  function (
  ko,
  Context,
  moduleUtils,
  KnockoutTemplateUtils,
  CoreRouter,
  ModuleRouterAdapter,
  KnockoutRouterAdapter,
  UrlParamAdapter,
  ResponsiveUtils,
  ResponsiveKnockoutUtils,
  ArrayTreeDataProvider,
  DrawerLayout,
  ModuleElement,
  ojKnockout,
  navigationService,
  sessionService,
   notificationService
) {
     function ControllerViewModel() {

      this.KnockoutTemplateUtils = KnockoutTemplateUtils;

      // Handle announcements sent when pages change, for Accessibility.
      this.manner = ko.observable('polite');
      this.message = ko.observable();
      announcementHandler = (event) => {
          this.message(event.detail.message);
          this.manner(event.detail.manner);
      };

      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);


      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const lgQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
      this.lgScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);

      // let navData = [
      //   { path: '', redirect: 'dashboard' },
      //   { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-bar-chart' } },
      //   { path: 'incidents', detail: { label: 'Incidents', iconClass: 'oj-ux-ico-fire' } },
      //   { path: 'customers', detail: { label: 'Customers', iconClass: 'oj-ux-ico-contact-group' } },
      //   { path: 'about', detail: { label: 'About', iconClass: 'oj-ux-ico-information-s' } }
      // ];


     let navData = [
  { path: '', redirect: 'login' },
  { path: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'register', detail: { label: 'Register', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'forgotPassword', detail: { label: 'Forgot Password' } },
  { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-bar-chart' } },
  { path: 'changePassword', detail: { label: 'Change Password' } },
  { path: 'cards', detail: { label: 'Cards', iconClass: 'oj-ux-ico-cc-card' } },
  { path: 'loans', detail: { label: 'Loans', iconClass: 'oj-ux-ico-money-stack' } },
  { path: 'transactions', detail: { label: 'Transactions', iconClass: 'oj-ux-ico-money-analytics' } },
  { path: 'notifications', detail: { label: 'Notifications', iconClass: 'oj-ux-ico-bell-ring-s' } },
  { path: 'billers', detail: { label: 'Bill Payments', iconClass: 'oj-ux-ico-newspaper' } },
  { path: 'customerSummary', detail: { label: 'Customer Summary', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'rewards', detail: { label: 'Rewards', iconClass: 'oj-ux-ico-gift' } },
  { path: 'rewardsWallet', detail: { label: 'Rewards Wallet', iconClass: 'oj-ux-ico-wallet' } },
  { path: 'beneficiaries', detail: { label: 'Beneficiaries', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'fundTransfer', detail: { label: 'Fund Transfer', iconClass: 'oj-ux-ico-transfer-money' } },
  { path: 'investments', detail: { label: 'Investments', iconClass: 'oj-ux-ico-bar-chart' } },
  { path: 'investmentDeposits', detail: { label: 'FD & RD', iconClass: 'oj-ux-ico-bar-chart' } },
  { path: 'mutualFunds', detail: { label: 'Mutual Funds', iconClass: 'oj-ux-ico-bar-chart' } },
  { path: 'adminInvestments', detail: { label: 'Investment Rates', iconClass: 'oj-ux-ico-settings' } },
  { path: 'adminRewards', detail: { label: 'Admin Rewards', iconClass: 'oj-ux-ico-settings' } }
];
      // Router setup
      let router = new CoreRouter(navData, {
        urlAdapter: new UrlParamAdapter()
      });
      router.sync();

      navigationService.initialize(router);

      this.moduleAdapter = new ModuleRouterAdapter(router);

      this.selection = new KnockoutRouterAdapter(router);

      // Setup the navDataProvider with the routes, excluding the first redirected
      // route.
     const publicNavData = [
  { path: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'register', detail: { label: 'Register', iconClass: 'oj-ux-ico-contact-group' } }
];

const authenticatedNavData = [
  { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-bar-chart' } },
 { path: 'cards', detail: { label: 'Cards', iconClass: 'oj-ux-ico-cc-card' } },
{ path: 'loans', detail: { label: 'Loans', iconClass: 'oj-ux-ico-money-stack' } },
{ path: 'transactions', detail: { label: 'Transactions', iconClass: 'oj-ux-ico-money-analytics' } },
{ path: 'notifications', detail: { label: 'Notifications', iconClass: 'oj-ux-ico-bell-ring-s' } },
{ path: 'billers', detail: { label: 'Bill Payments', iconClass: 'oj-ux-ico-newspaper' } },
  { path: 'customerSummary', detail: { label: 'Customer Summary', iconClass: 'oj-ux-ico-contact-group' } },
  {
    path: 'rewardsMenu',
    detail: { label: 'Rewards', iconClass: 'oj-ux-ico-gift' },
    children: [
      { path: 'rewards', detail: { label: 'Rewards Catalogue', iconClass: 'oj-ux-ico-gift' } },
      { path: 'rewardsWallet', detail: { label: 'Rewards Wallet', iconClass: 'oj-ux-ico-wallet' } }
    ]
  },
  { path: 'beneficiaries', detail: { label: 'Beneficiaries', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'fundTransfer', detail: { label: 'Fund Transfer', iconClass: 'oj-ux-ico-transfer-money' } },
  {
    path: 'investmentMenu',
    detail: { label: 'Investments', iconClass: 'oj-ux-ico-bar-chart' },
    children: [
      { path: 'investments', detail: { label: 'View Investments', iconClass: 'oj-ux-ico-bar-chart' } },
      { path: 'investmentDeposits', detail: { label: 'FD & RD', iconClass: 'oj-ux-ico-bar-chart' } },
      { path: 'mutualFunds', detail: { label: 'Mutual Funds', iconClass: 'oj-ux-ico-bar-chart' } }
    ]
  }
];

const adminNavData = [
  { path: 'adminRewards', detail: { label: 'Admin Rewards', iconClass: 'oj-ux-ico-settings' } },
  { path: 'adminInvestments', detail: { label: 'Investment Rates', iconClass: 'oj-ux-ico-settings' } }
];

this.isAuthenticated = sessionService.authenticated;

this.unreadNotificationCount = notificationService.unreadCount;

this.refreshUnreadNotificationCount = function () {
  if (!sessionService.isAuthenticated()) {
    notificationService.clearUnreadCount();
    return;
  }

  notificationService.getUnreadCount().catch(function () {
    // Keep the last known badge count if the request temporarily fails.
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

this.navDataProvider = ko.pureComputed(() => {
  const visibleNavData = sessionService.isAuthenticated()
    ? authenticatedNavData.concat(sessionService.isAdmin() ? adminNavData : [])
    : publicNavData;

  return new ArrayTreeDataProvider(visibleNavData, {
    keyAttributes: 'path'
  });
});

      // Drawer
      this.sideDrawerOn = ko.observable(false);

      // Close the menu when its display mode changes.
      this.lgScreen.subscribe(() => { this.sideDrawerOn(false) });

      // Open or close the menu from either menu icon.
      this.toggleDrawer = () => {
        this.sideDrawerOn(!this.sideDrawerOn());
      }

this.handleNavSelection = (event) => {
  const path = event.detail.value;

  if (!path || path === 'investmentMenu' || path === 'rewardsMenu') {
    return;
  }

  this.sideDrawerOn(false);
  navigationService.goTo(path);
};

this.goToNotifications = function () {
  navigationService.goTo('notifications');
};

this.handleUserMenuAction = function (event) {
  const selectedValue = event.detail.selectedValue;

  if (selectedValue === 'changePassword') {
    navigationService.goTo('changePassword');
    return;
  }

  if (selectedValue === 'out') {
    sessionService.clearSession();
    navigationService.goTo('login');
  }
};

      // Header
      // Application Name used in Branding Area
      this.appName = ko.observable("FinThink Bank");
      // User Info used in Global Navigation area
      this.userLogin = sessionService.username;

      // Footer
     this.footerLinks = [];
     }
     // release the application bootstrap busy state
     Context.getPageContext().getBusyContext().applicationBootstrapComplete();

     return new ControllerViewModel();
  }
);
