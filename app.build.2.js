({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    name: 'dnsmon/dnsmon-loader',

    paths:{
        /* environment */
        "dnsmon.env": "dnsmon/environment/environment",
        "dnsmon.env.utils": "dnsmon/environment/utils",
        "dnsmon.env.config": "empty:",
        "dnsmon.env.params-manager": "dnsmon/environment/ParamsManager",
        "dnsmon.env.history-manager": "dnsmon/environment/HistoryManager",

        "dnsmon.env.languages.en": "dnsmon/environment/languages/lang-en",

        /* libs */
        "dnsmon.lib.d3": "dnsmon/lib/d3.v3.amd",
        "dnsmon.lib.jquery": "dnsmon/lib/jquery.min",

        "dnsmon.lib.jquery-ui": "dnsmon/lib/jquery-ui.min",
        "dnsmon.lib.jquery-ui.timepicker": "dnsmon/lib/jquery-ui.timepicker",

        "dnsmon.lib.jquery.cookie": "dnsmon/lib/jquery.cookie",
        "dnsmon.lib.date-format": "dnsmon/lib/dateFormat",
        "dnsmon.lib.atlas-traceroute-printer": "dnsmon/lib/atlas.traceroute",
        "dnsmon.lib.jquery-libs": "dnsmon/lib/libs-dist",
        "dnsmon.lib.jquery-libs-amd": "dnsmon/lib/jquery-libs-amd",

        /* model */
        "dnsmon.model.cell": "dnsmon/model/Cell",
        "dnsmon.model.row": "dnsmon/model/Row",


        /* view */
        "dnsmon.view.main": "dnsmon/view/MainView",
        "dnsmon.view.control-panel": "dnsmon/view/ControlPanelView",
        "dnsmon.view.full-screen": "dnsmon/view/FullScreenView",
        "dnsmon.view.breadcrumbs": "dnsmon/view/BreadcrumbsView",
        "dnsmon.view.ordinal-axis": "dnsmon/view/OrdinalAxisView",
        "dnsmon.view.pop-up": "dnsmon/view/PopUpView",
        "dnsmon.view.template-manager": "dnsmon/view/TemplateManagerView",
        "dnsmon.view.time-axis": "dnsmon/view/TimeAxisView",
        "dnsmon.view.time-overview": "dnsmon/view/TimeOverviewView",


        /* view.svg */
        "dnsmon.view.svg.chart": "dnsmon/view/svg/SvgChartView",
        "dnsmon.view.svg.container": "dnsmon/view/svg/SvgContainerView",
        "dnsmon.view.svg.time-axis": "dnsmon/view/svg/SvgTimeAxisView",
        "dnsmon.view.svg.ordinal-axis": "dnsmon/view/svg/SvgOrdinalAxisView",


        /* controller */
        "dnsmon.controller.gesture-manager": "dnsmon/controller/GesturesManager",
        "dnsmon.controller.time": "dnsmon/controller/TimeController",


        /* connector */
        "dnsmon.connector.facade": "dnsmon/connector/ConnectorFacade",
        "dnsmon.connector.aggregation-level": "dnsmon/connector/AggregationLevelConnector",
        "dnsmon.connector.anti-flood": "dnsmon/connector/AntiFloodConnector",
        "dnsmon.connector.filter": "dnsmon/connector/FilterConnector",
        "dnsmon.connector.log-connector": "dnsmon/connector/log/LogRestConnector",


        /* connector.atlas */
        "dnsmon.connector.atlas.rest": "dnsmon/connector/atlas/RestConnectorAtlas",
        "dnsmon.connector.atlas.cache": "dnsmon/connector/atlas/CacheConnectorAtlas",
        "dnsmon.connector.atlas.error-handler": "dnsmon/connector/atlas/ErrorsHandlerConnectorAtlas",
        "dnsmon.connector.atlas.isolation-level": "dnsmon/connector/atlas/IsolationLevelConnectorAtlas",


        /* session */
        "dnsmon.session.facade": "dnsmon/session/SessionManager"
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
    },

    optimize: "uglify2",
    wrapShim: true,
    generateSourceMaps: true,
//                    optimizeCss: "standard",

    out: "dnsmon/dnsmon-dist.js"
//    out: function (text) {
//        document.getElementById('output').value = text;
//    }

})