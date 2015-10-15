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
        "dnsmon.env": DNSMON_ENVIRONMENT_URL + "environment",
        "dnsmon.env.utils": DNSMON_ENVIRONMENT_URL + "utils",
        "dnsmon.env.config": DNSMON_ENVIRONMENT_URL + "config",
        "dnsmon.env.params-manager": DNSMON_ENVIRONMENT_URL + "ParamsManager",
        "dnsmon.env.history-manager": DNSMON_ENVIRONMENT_URL + "HistoryManager",

        "dnsmon.env.languages.en": DNSMON_ENVIRONMENT_URL + "languages/lang-en",

        /* libs */
        "dnsmon.lib.d3": DNSMON_LIB_URL + "d3.v3.amd",
        "dnsmon.lib.jquery": (typeof DNSMON_JQUERY_GLOBAL_DECLARED_URL != 'undefined') ? DNSMON_JQUERY_GLOBAL_DECLARED_URL : DNSMON_LIB_URL + "jquery.min",

        "dnsmon.lib.jquery-ui": (typeof DNSMON_JQUERY_UI_GLOBAL_DECLARED_URL != 'undefined') ? DNSMON_JQUERY_UI_GLOBAL_DECLARED_URL : DNSMON_LIB_URL + "jquery-ui.min",
        "dnsmon.lib.jquery-ui.timepicker": DNSMON_LIB_URL + "jquery-ui.timepicker",

        "dnsmon.lib.jquery.cookie": DNSMON_LIB_URL + "jquery.cookie",
        "dnsmon.lib.date-format": DNSMON_LIB_URL + "dateFormat",
        "dnsmon.lib.atlas-traceroute-printer": DNSMON_LIB_URL + "atlas.traceroute",
        "dnsmon.lib.jquery-libs": DNSMON_LIB_URL + "libs-dist",
        "dnsmon.lib.jquery-libs-amd": DNSMON_LIB_URL + "jquery-libs-amd",

        /* model */
        "dnsmon.model.cell": DNSMON_MODEL_URL + "Cell",
        "dnsmon.model.row": DNSMON_MODEL_URL + "Row",


        /* view */
        "dnsmon.view.main": DNSMON_VIEW_URL + "MainView",
        "dnsmon.view.control-panel": DNSMON_VIEW_URL + "ControlPanelView",
        "dnsmon.view.full-screen": DNSMON_VIEW_URL + "FullScreenView",
        "dnsmon.view.breadcrumbs": DNSMON_VIEW_URL + "BreadcrumbsView",
        "dnsmon.view.ordinal-axis": DNSMON_VIEW_URL + "OrdinalAxisView",
        "dnsmon.view.pop-up": DNSMON_VIEW_URL + "PopUpView",
        "dnsmon.view.template-manager": DNSMON_VIEW_URL + "TemplateManagerView",
        "dnsmon.view.time-axis": DNSMON_VIEW_URL + "TimeAxisView",
        "dnsmon.view.time-overview": DNSMON_VIEW_URL + "TimeOverviewView",


        /* view.svg */
        "dnsmon.view.svg.chart": DNSMON_VIEW_URL + "svg/SvgChartView",
        "dnsmon.view.svg.container": DNSMON_VIEW_URL + "svg/SvgContainerView",
        "dnsmon.view.svg.time-axis": DNSMON_VIEW_URL + "svg/SvgTimeAxisView",
        "dnsmon.view.svg.ordinal-axis": DNSMON_VIEW_URL + "svg/SvgOrdinalAxisView",


        /* controller */
        "dnsmon.controller.gesture-manager": DNSMON_CONTROLLER_URL + "GesturesManager",
        "dnsmon.controller.time": DNSMON_CONTROLLER_URL + "TimeController",


        /* connector */
        "dnsmon.connector.facade": DNSMON_CONNECTOR_URL + "ConnectorFacade",
        "dnsmon.connector.aggregation-level": DNSMON_CONNECTOR_URL + "AggregationLevelConnector",
        "dnsmon.connector.anti-flood": DNSMON_CONNECTOR_URL + "AntiFloodConnector",
        "dnsmon.connector.filter": DNSMON_CONNECTOR_URL + "FilterConnector",
        "dnsmon.connector.log-connector": DNSMON_CONNECTOR_URL + "log/LogRestConnector",


        /* connector.atlas */
        "dnsmon.connector.atlas.rest": DNSMON_CONNECTOR_URL + "atlas/RestConnectorAtlas",
        "dnsmon.connector.atlas.cache": DNSMON_CONNECTOR_URL + "atlas/CacheConnectorAtlas",
        "dnsmon.connector.atlas.error-handler": DNSMON_CONNECTOR_URL + "atlas/ErrorsHandlerConnectorAtlas",
        "dnsmon.connector.atlas.isolation-level": DNSMON_CONNECTOR_URL + "atlas/IsolationLevelConnectorAtlas",


        /* session */
        "dnsmon.session.facade": DNSMON_SESSION_URL + "SessionManager"
    },
    shim:{
        "dnsmon.lib.jquery-ui": {
            deps: ["dnsmon.lib.jquery"]
        },

        "dnsmon.lib.jquery.cookie": {
            deps: ["dnsmon.lib.jquery"]
        },

        "dnsmon.lib.jquery-ui.timepicker": {
            deps: ["dnsmon.lib.jquery-ui"]
        }
    }
});



define([

    "dnsmon.env.utils",
    "dnsmon.env.config",
    "dnsmon.env.languages.en",
    "dnsmon.lib.jquery-libs-amd",
    "dnsmon.env.params-manager",
    "dnsmon.view.main",
    "dnsmon.connector.facade",
    "dnsmon.session.facade",
    "dnsmon.env.history-manager"

], function(
    utils,
    config,
    language,
    $,
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
            "version": "15.10.15.2",
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
            "fullScreenActive": ((instanceParams.hasOwnProperty("fullScreen")) ? instanceParams.fullScreen : config.fullScreenActiveByDefault),
            "colorRanges": ((instanceParams.hasOwnProperty("colorRanges")) ? instanceParams.colorRanges : null)
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

