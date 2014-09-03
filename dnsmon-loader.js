/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 9/20/13
 * Time: 11:01 AM
 * To change this template use File | Settings | File Templates.
 */


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
        "lib.jquery": (typeof DNSMON_JQUERY_GLOBAL_DECLARED_URL != 'undefined') ? DNSMON_JQUERY_GLOBAL_DECLARED_URL : DNSMON_LIB_URL + "jquery.min",

        "lib.jquery-ui": (typeof DNSMON_JQUERY_UI_GLOBAL_DECLARED_URL != 'undefined') ? DNSMON_JQUERY_UI_GLOBAL_DECLARED_URL : DNSMON_LIB_URL + "jquery-ui.min",
        "lib.jquery-ui.timepicker": DNSMON_LIB_URL + "jquery-ui.timepicker",

        "lib.jquery.cookie": DNSMON_LIB_URL + "jquery.cookie",
        "lib.date-format": DNSMON_LIB_URL + "dateFormat",
        "lib.atlas-traceroute-printer": DNSMON_LIB_URL + "atlas.traceroute",


        /* model */
        "model.cell": DNSMON_MODEL_URL + "Cell",
        "model.row": DNSMON_MODEL_URL + "Row",


        /* view */
        "view.main": DNSMON_VIEW_URL + "MainView",
        "view.control-panel": DNSMON_VIEW_URL + "ControlPanelView",
        "view.full-screen": DNSMON_VIEW_URL + "FullScreenView",
        "view.breadcrumbs": DNSMON_VIEW_URL + "BreadcrumbsView",
        "view.ordinal-axis": DNSMON_VIEW_URL + "OrdinalAxisView",
        "view.pop-up": DNSMON_VIEW_URL + "PopUpView",
        "view.template-manager": DNSMON_VIEW_URL + "TemplateManagerView",
        "view.time-axis": DNSMON_VIEW_URL + "TimeAxisView",
        "view.time-overview": DNSMON_VIEW_URL + "TimeOverviewView",


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
        "connector.log-connector": DNSMON_CONNECTOR_URL + "log/LogRestConnector",


        /* connector.atlas */
        "connector.atlas.rest": DNSMON_CONNECTOR_URL + "atlas/RestConnectorAtlas",
        "connector.atlas.cache": DNSMON_CONNECTOR_URL + "atlas/CacheConnectorAtlas",
        "connector.atlas.error-handler": DNSMON_CONNECTOR_URL + "atlas/ErrorsHandlerConnectorAtlas",
        "connector.atlas.isolation-level": DNSMON_CONNECTOR_URL + "atlas/IsolationLevelConnectorAtlas",


        /* session */
        "session.facade": DNSMON_SESSION_URL + "SessionManager"
    },
    shim:{
        "lib.jquery-ui": {
            deps: ["lib.jquery"]
        },

        "lib.jquery.cookie": {
            deps: ["lib.jquery"]
        },

        "lib.jquery-ui.timepicker": {
            deps: ["lib.jquery-ui"]
        }
    }
});



define([

    "env.utils",
    "env.config",
    "env.languages.en",
    "env.params-manager",
    "view.main",
    "connector.facade",
    "session.facade",
    "env.history-manager",
    "lib.jquery",
    "lib.jquery-ui"

], function(
    utils,
    config,
    language,
    paramsManager,
    MainView,
    ConnectorFacade,
    SessionFacade,
    HistoryManager
    ){

    var DNSmon = function(instance){
        var env, internalParams, mergedParams, emptyParamVector, instanceParams, queryParams, parentDom, stylesLoaded,
            cssListenerInterval, cssListenerTimeout, cssListener;

        /*
         * Load required stylesheets
         */
        stylesLoaded = document.styleSheets.length;
        utils.loadCss(DNSMON_VIEW_URL + "css/dnsmon_style.css");
        utils.loadCss("https://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css");

        /*
         * Access to the instance
         */
        instanceParams = instance.instanceParams;
        queryParams = instance.queryParams;
        parentDom = instance.domElement;

        // STUFF FOR THE DEMO
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
            "version": "14.9.3.2",
            "widgetUrl": DNSMON_WIDGET_URL,
            "parentDom": parentDom, //HASH THIS
            "document": utils.encapsulateDom($(document)),
            "config": config,
            "params": mergedParams,
            "lang": language,
            "maxHeight": ((instanceParams.hasOwnProperty("maxHeight")) ? instanceParams.maxHeight : Math.max($(document).height(), config.chartMaxHeight)),
            "minHeight": ((instanceParams.hasOwnProperty("minHeight")) ? instanceParams.minHeight : config.chartMinHeight),
            "callbacks": {
                change: ((instanceParams.hasOwnProperty("change")) ? [instanceParams.change] : []),
                load: ((instanceParams.hasOwnProperty("load")) ? [instanceParams.load] : [])
            },

            "showFilter":  ((instanceParams.hasOwnProperty("showFilter")) ? instanceParams.showFilter : config.showFilterDefaultValue),
            "debugMode": ((instanceParams.hasOwnProperty("debugMode")) ? instanceParams.debugMode : (utils.getUrlParam('debug_mode') == 'true')),
            "activeKeys": ((instanceParams.hasOwnProperty("activeKeys")) ? instanceParams.activeKeys : config.activeKeysByDefault),
            "activeMouseZoom": ((instanceParams.hasOwnProperty("activeMouseZoom")) ? instanceParams.activeMouseZoom : config.activeMouseZoomByDefault),
            "activeGestures": ((instanceParams.hasOwnProperty("activeGestures")) ? instanceParams.activeGestures : config.activeGesturesByDefault),
            "localCacheActive": ((instanceParams.hasOwnProperty("localCacheActive")) ? instanceParams.localCacheActive : config.localCacheActiveByDefault),
            "grouping": ((instanceParams.hasOwnProperty("grouping")) ? instanceParams.grouping : config.groupingByDefault),
            "timeEventsActive": config.timeEventsActiveByDefault,
            "isUpdatedPeriodicallyActive": ((instanceParams.hasOwnProperty("autoUpdate")) ? instanceParams.autoUpdate : config.autoUpdateActiveByDefault),
            "fullScreenActive": ((instanceParams.hasOwnProperty("fullScreen")) ? instanceParams.fullScreen : config.fullScreenActiveByDefault)
        };


        /*
         * Initialize Point of Access to Packages
         */
        env.mainView = new MainView(env); //Representation Facade
        env.connector = new ConnectorFacade(env); //Connector Facade
        env.session = new SessionFacade(env); //Session Facade
        env.history = new HistoryManager(env); //History Manager


        /*
         * Check if stylesheets are loaded
         */
        cssListenerInterval = 50; //50 ms
        cssListenerTimeout = 10000; // 10 secs
        cssListener = setInterval(function(){

            if(document.styleSheets.length >= stylesLoaded + 2){

                clearInterval(cssListener);
                utils.logErrors(env.connector.persistError); //Persist errors
                env.mainView.init(parentDom, instanceParams);

            }else{
                if (cssListenerTimeout <= 0){
                    clearInterval(cssListener);
                    console.log("It is not possible to load stylesheets.");
                }
                cssListenerTimeout -= cssListenerInterval;
            }
        }, cssListenerInterval);


        /**
         * A set of methods exposed outside
         */
        return {

            setParams: function(params){
                var newParams;

                newParams = paramsManager.fromExternalToInternal(params);
                env.params = paramsManager.mergeParams(env.params, newParams);
                env.mainView.redraw();
            },

            on: function(type, callback){
                if (!env.callbacks[type]){
                    env.callbacks[type] = [];
                }
                env.callbacks[type].push(callback);
            },

            off: function(type){
                env.callbacks[type] = [];
            },

            getParams: function(){
                return paramsManager.fromInternalToExternal(env.params);
            },

            getEnvironment: function(){
                return env;
            }

        };

    };

    return DNSmon;
});

