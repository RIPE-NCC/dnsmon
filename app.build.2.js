({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    name: 'dnsmon-loader',

    paths:{
        /* environment */
        "dnsmon.env": "environment/environment",
        "dnsmon.env.utils": "environment/utils",
        "dnsmon.env.config": "empty:",
        "dnsmon.env.params-manager": "environment/ParamsManager",
        "dnsmon.env.history-manager": "environment/HistoryManager",

        "dnsmon.env.languages.en": "environment/languages/lang-en",

        /* libs */
        "dnsmon.lib.d3": "lib/d3.v3.amd",
        "dnsmon.lib.jquery": "lib/jquery.min",

        "dnsmon.lib.jquery-ui": "lib/jquery-ui.min",
        "dnsmon.lib.jquery-ui.timepicker": "lib/jquery-ui.timepicker",

        "dnsmon.lib.jquery.cookie": "lib/jquery.cookie",
        "dnsmon.lib.date-format": "lib/dateFormat",
        "dnsmon.lib.atlas-traceroute-printer": "lib/atlas.traceroute",
        "dnsmon.lib.jquery-libs": "lib/libs-dist",
        "dnsmon.lib.jquery-libs-amd": "lib/jquery-libs-amd",

        /* model */
        "dnsmon.model.cell": "model/Cell",
        "dnsmon.model.row": "model/Row",


        /* view */
        "dnsmon.view.main": "view/MainView",
        "dnsmon.view.control-panel": "view/ControlPanelView",
        "dnsmon.view.full-screen": "view/FullScreenView",
        "dnsmon.view.breadcrumbs": "view/BreadcrumbsView",
        "dnsmon.view.ordinal-axis": "view/OrdinalAxisView",
        "dnsmon.view.pop-up": "view/PopUpView",
        "dnsmon.view.template-manager": "view/TemplateManagerView",
        "dnsmon.view.time-axis": "view/TimeAxisView",
        "dnsmon.view.time-overview": "view/TimeOverviewView",


        /* view.svg */
        "dnsmon.view.svg.chart": "view/svg/SvgChartView",
        "dnsmon.view.svg.container": "view/svg/SvgContainerView",
        "dnsmon.view.svg.time-axis": "view/svg/SvgTimeAxisView",
        "dnsmon.view.svg.ordinal-axis": "view/svg/SvgOrdinalAxisView",


        /* controller */
        "dnsmon.controller.gesture-manager": "controller/GesturesManager",
        "dnsmon.controller.time": "controller/TimeController",


        /* connector */
        "dnsmon.connector.facade": "connector/ConnectorFacade",
        "dnsmon.connector.aggregation-level": "connector/AggregationLevelConnector",
        "dnsmon.connector.anti-flood": "connector/AntiFloodConnector",
        "dnsmon.connector.filter": "connector/FilterConnector",
        "dnsmon.connector.log-connector": "connector/log/LogRestConnector",


        /* connector.atlas */
        "dnsmon.connector.atlas.rest": "connector/atlas/RestConnectorAtlas",
        "dnsmon.connector.atlas.cache": "connector/atlas/CacheConnectorAtlas",
        "dnsmon.connector.atlas.error-handler": "connector/atlas/ErrorsHandlerConnectorAtlas",
        "dnsmon.connector.atlas.isolation-level": "connector/atlas/IsolationLevelConnectorAtlas",


        /* session */
        "dnsmon.session.facade": "session/SessionManager"
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

    out: "dnsmon-dist.js"
})