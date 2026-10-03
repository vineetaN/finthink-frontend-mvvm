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
  'ojs/ojarraydataprovider',
  'ojs/ojdrawerpopup',
  'ojs/ojmodule-element',
  'ojs/ojknockout',
  'ojs/ojnavigationlist',
  'ojs/ojavatar',
  'ojs/ojmenu',
  'ojs/ojbutton',
  'ojs/ojtoolbar',
  './utils/navigationService',
  './utils/sessionService',
  './utils/authGuard',
  './config/roleRoutes'
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
  ArrayDataProvider,
  DrawerPopup,
  ModuleElement,
  ojKnockout,
  ojNavigationList,
  ojAvatar,
  ojMenu,
  ojButton,
  ojToolbar,
  navigationService,
  sessionService,
  authGuard,
  roleRoutes
) {
  function ControllerViewModel() {
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;
    this.manner = ko.observable('polite');
    this.message = ko.observable();
    this.accessDeniedMessage = ko.observable('');

    document.getElementById('globalBody').addEventListener('announce', (event) => {
      this.message(event.detail.message);
      this.manner(event.detail.manner);
    }, false);
    window.addEventListener('access-denied', (event) => {
      this.accessDeniedMessage(event.detail.message || 'Access denied');
    });

    var smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
    this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    var mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
    this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

    var routes = [
      { path: '', redirect: 'login' },
      { path: 'login', detail: { label: 'Login' } },
      { path: 'register', detail: { label: 'Register' } },
      { path: 'unauthorized', detail: { label: 'Unauthorized' } }
    ].concat(roleRoutes.pages.map(function (page) {
      return {
        path: page.path,
        detail: { label: page.label, iconClass: page.iconClass, roles: page.roles }
      };

      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);


      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

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
  { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-bar-chart' } },
  { path: 'customerSummary', detail: { label: 'Customer Summary', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'rewards', detail: { label: 'Rewards', iconClass: 'oj-ux-ico-gift' } },
  { path: 'rewardsWallet', detail: { label: 'Rewards Wallet', iconClass: 'oj-ux-ico-wallet' } },
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
  { path: 'customerSummary', detail: { label: 'Customer Summary', iconClass: 'oj-ux-ico-contact-group' } },
  { path: 'rewards', detail: { label: 'Rewards', iconClass: 'oj-ux-ico-gift' } },
  { path: 'rewardsWallet', detail: { label: 'Rewards Wallet', iconClass: 'oj-ux-ico-wallet' } }
];

const adminNavData = [
  { path: 'adminRewards', detail: { label: 'Admin Rewards', iconClass: 'oj-ux-ico-settings' } }
];

this.isAuthenticated = sessionService.authenticated;

this.navDataProvider = ko.pureComputed(() => {
  const visibleNavData = sessionService.isAuthenticated()
    ? authenticatedNavData.concat(sessionService.isAdmin() ? adminNavData : [])
    : publicNavData;

  return new ArrayDataProvider(visibleNavData, {
    keyAttributes: 'path'
  });
});

      // Drawer
      this.sideDrawerOn = ko.observable(false);

      // Close drawer on medium and larger screens
      this.mdScreen.subscribe(() => { this.sideDrawerOn(false) });

      // Called by navigation drawer toggle button and after selection of nav drawer item
      this.toggleDrawer = () => {
        this.sideDrawerOn(!this.sideDrawerOn());
    }));

    var router = new CoreRouter(routes, { urlAdapter: new UrlParamAdapter() });
    navigationService.initialize(router);
    sessionService.setExpiryHandler(function () {
      navigationService.goTo('login');
    });
    router.beforeStateChange.subscribe(function (args) {
      var decision = authGuard.authorize(args.state);
      args.accept(decision.allowed);
      if (!decision.allowed) {
        window.setTimeout(function () {
          navigationService.goTo(decision.redirect);
        }, 0);
      }
    });
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);
    this.selection = new KnockoutRouterAdapter(router);
    this.isAuthenticated = sessionService.authenticated;
    this.userLogin = sessionService.username;
    this.userRole = sessionService.role;
    this.userInitials = ko.pureComputed(function () {
      return (sessionService.username() || 'U').slice(0, 2).toUpperCase();
    });
    this.navDataProvider = ko.pureComputed(function () {
      var role = sessionService.role();
      var items = roleRoutes.pages.filter(function (page) {
        return page.roles.indexOf(role) !== -1;
      }).map(function (page) {
        return { path: page.path, detail: { label: page.label, iconClass: page.iconClass } };
      });
      return new ArrayDataProvider(items, { keyAttributes: 'path' });
    });

    this.sideDrawerOn = ko.observable(false);
    this.mdScreen.subscribe(() => { this.sideDrawerOn(false); });
    this.toggleDrawer = () => { this.sideDrawerOn(!this.sideDrawerOn()); };
    this.handleNavClick = () => { this.sideDrawerOn(false); };
    this.handleLogout = function () {
      sessionService.clearSession();
      navigationService.goTo('login');
    };
    this.handleUserMenuAction = function (event) {
      if (event.detail.selectedValue === 'out') {
        this.handleLogout();
      }
    }.bind(this);
    this.dismissAccessDenied = () => { this.accessDeniedMessage(''); };
    this.appName = ko.observable('FinThink Bank');
    this.footerLinks = [];
  }

  Context.getPageContext().getBusyContext().applicationBootstrapComplete();
  return new ControllerViewModel();
});
