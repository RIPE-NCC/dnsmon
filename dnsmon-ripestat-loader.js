/**
 * Some require.js configurations
 */

requirejs.config({
    paths:{
        /* environment */
        "env": DNSMON_ENVIRONMENT_URL + "environment",
        "env.utils": DNSMON_ENVIRONMENT_URL + "utils",
        "env.config": DNSMON_ENVIRONMENT_URL + "config",
        "env.params-manager": DNSMON_ENVIRONMENT_URL + "ParamsManager",
        "env.history-manager": DNSMON_ENVIRONMENT_URL + "HistoryManager",

        "env.languages.en": DNSMON_ENVIRONMENT_URL + "languages/lang-en",

        /* libs */
        "lib.d3": DNSMON_LIB_URL + "d3.v3.amd",
        "lib.jquery": DNSMON_LIB_URL + "jquery.min",
        "lib.jquery-ui": DNSMON_LIB_URL + "jquery-ui.min",
        "lib.jquery.animate-textshadow": DNSMON_LIB_URL + "jquery.animate-textshadow.min",
        "lib.jquery.cookie": DNSMON_LIB_URL + "jquery.cookie",


        /* model */
        "model.cell": DNSMON_MODEL_URL + "Cell",
        "model.row": DNSMON_MODEL_URL + "Row",


        /* view */
        "view.main": DNSMON_VIEW_URL + "MainView",
        "view.control-panel": DNSMON_VIEW_URL + "ControlPanelView",
        "view.breadcrumbs": DNSMON_VIEW_URL + "BreadcrumbsView",
        "view.ordinal-axis": DNSMON_VIEW_URL + "OrdinalAxisView",
        "view.pop-up": DNSMON_VIEW_URL + "PopUpView",
        "view.template-manager": DNSMON_VIEW_URL + "TemplateManagerView",
        "view.time-axis": DNSMON_VIEW_URL + "TimeAxisView",
        "view.time-brusher": DNSMON_VIEW_URL + "TimeBrusherView",


        /* view.svg */
        "view.svg.chart": DNSMON_VIEW_URL + "svg/SvgChartView",
        "view.svg.container": DNSMON_VIEW_URL + "svg/SvgContainerView",
        "view.svg.time-axis": DNSMON_VIEW_URL + "svg/SvgTimeAxisView",
        "view.svg.ordinal-axis": DNSMON_VIEW_URL + "svg/SvgOrdinalAxisView",


        /* controller */
        "controller.gesture-manager": DNSMON_CONTROLLER_URL + "GesturesManager",
        "controller.time": DNSMON_CONTROLLER_URL + "TimeController",


        /* connector */
        "connector.facade": DNSMON_CONNECTOR_URL + "ConnectorFacade",
        "connector.aggregation-level": DNSMON_CONNECTOR_URL + "AggregationLevelConnector",
        "connector.anti-flood": DNSMON_CONNECTOR_URL + "AntiFloodConnector",
        "connector.filter": DNSMON_CONNECTOR_URL + "FilterConnector",
        "connector.filter": DNSMON_CONNECTOR_URL + "FilterConnector",


        /* connector.atlas */
        "connector.atlas.rest": DNSMON_CONNECTOR_URL + "atlas/RestConnectorAtlas",
        "connector.atlas.cache": DNSMON_CONNECTOR_URL + "atlas/CacheConnectorAtlas",
        "connector.atlas.error-handler": DNSMON_CONNECTOR_URL + "atlas/ErrorsHandlerConnectorAtlas",
        "connector.atlas.isolation-level": DNSMON_CONNECTOR_URL + "atlas/IsolationLevelConnectorAtlas",


        /* session */
        "session.facade": DNSMON_SESSION_URL + "SessionManager"
    }
//    shim:{
//        "lib.jquery-ui": {
//            deps: ["lib.jquery"]
//        },
//
//        "lib.jquery.cookie": {
//            deps: ["lib.jquery"]
//        }
//    }
});


define([

    "env.utils",
    "env.config",
    "env.languages.en",
    "env.params-manager",
    "view.main",
    "connector.facade",
    "session.facade"

], function(
    utils,
    config,
    language,
    paramsManager,
    MainView,
    ConnectorFacade,
    SessionFacade
    ){

    $.fn.dnsmon = function(data, widget_width) {

        var DNSmon = function(instance){
            var env, internalParams, mergedParams, emptyParamVector, instanceParams, queryParams, parentDom, on;

            /*
             * Load required stylesheets
             */
            utils.loadCss("//code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css");
            utils.loadCss(DNSMON_VIEW_URL + "css/dnsmon_style.css");

            /*
             * Access to the instance
             */
            instanceParams = instance.instanceParams;
            queryParams = instance.queryParams;
            parentDom = instance.domElement;

            //STUFF FOR THE DEMO
            window.grouping = utils.getUrlParam("grouping") == "true";
            window.dynamicHeight = utils.getUrlParam("dheight") == "true";

            /*
             * Convert params
             */
            if (queryParams){
                emptyParamVector = paramsManager.createInternalParamVector();
                internalParams = paramsManager.fromExternalToInternal(queryParams);
                mergedParams = paramsManager.mergeParams(emptyParamVector, internalParams);
            }

            /*
             * Init Dependency Injection Vector
             */
            env = {
                "widgetUrl": DNSMON_WIDGET_URL,
                "parentDom": parentDom, //HASH THIS
                "config": config,
                "params": mergedParams,
                "lang": language,
                "excludeErrors": config.excludeErrorsByDefault,
                "showFilter": config.showFilterDefaultValue,
                "timeWindowAligned": config.timeWindowAlignedByDefault,
                "timeEventsActive": config.timeEventsActiveByDefault
            };


            /*
             * Initialize Point of Access to Packages
             */
            env.mainView = new MainView(env); //Representation Facade
            env.connector = new ConnectorFacade(env); //Connector Facade
            env.session = new SessionFacade(env); //Session Facade
            env.mainView.init(parentDom, instanceParams);

            return {
                setParams: function(params){
                    var newParams;

                    newParams = paramsManager.fromExternalToInternal(params);
                    paramsManager.params = paramsManager.mergeParams(env.params, newParams);
                    env.mainView.redraw();
                }
            };

        };

        return DNSmon;
    }
});
