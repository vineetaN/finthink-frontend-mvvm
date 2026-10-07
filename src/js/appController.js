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
  // side-effect imports (no parameter)
  'ojs/ojmodule-element',
  'ojs/ojknockout',
  'ojs/ojdrawerlayout',
  'ojs/ojdrawerpopup',
  'ojs/ojnavigationlist',
  'ojs/ojavatar',
  'ojs/ojmenu',
  'ojs/ojbutton',
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
  roleRoutes
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
        { path: 'rewardsMenu', detail: { label: 'Rewards', iconClass: 'oj-ux-ico-gift' },
          children: [navItem('rewards'), navItem('rewardsWallet')] },
        navItem('beneficiaries'),
        navItem('fundTransfer'),
        { path: 'investmentMenu', detail: { label: 'Investments', iconClass: 'oj-ux-ico-bar-chart' },
          children: [navItem('investments'), navItem('investmentDeposits'), navItem('mutualFunds')] }
      ];
      const adminNavData = roleRoutes.pages.filter((page) => page.roles.includes('ADMIN'))
        .map((page) => navItem(page.path));
      this.customerNavDataProvider = new ArrayTreeDataProvider(customerNavData, { keyAttributes: 'path' });
      this.adminNavDataProvider = new ArrayTreeDataProvider(adminNavData, { keyAttributes: 'path' });
      this.isAuthenticated = sessionService.authenticated;
      this.isCustomer = ko.pureComputed(() => sessionService.role() === 'CUSTOMER');
      this.isAdmin = ko.pureComputed(() => sessionService.role() === 'ADMIN');

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
      }

      this.handleLogout = () => {
        sessionService.clearSession();
        navigationService.goTo('login');
      };

      this.handleUserMenuAction = (event) => {
  // Reset Password is a menu placeholder until its page is connected.
  if (event.detail.selectedValue !== 'out') {
    return;
  }

  this.handleLogout();
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
