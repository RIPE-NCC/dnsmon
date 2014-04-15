YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "AggregationLevelConnector",
        "AntiFloodConnector",
        "BreadcrumbsView",
        "CacheConnectorAtlas",
        "Cell",
        "Connector",
        "ConnectorFacade",
        "ControlPanelView",
        "ErrorsHandlerConnectorAtlas",
        "FullScreenView",
        "GesturesManager",
        "HistoryManager",
        "IsolationLevelConnectorAtlas",
        "MainView",
        "ParamsManager",
        "PopUpView",
        "Row",
        "SessionManager",
        "SvgChartView",
        "SvgContainerView",
        "SvgOrdinalAxisView",
        "SvgTimeAxisView",
        "TemplateManagerView",
        "TimeController",
        "TimeOverviewView"
    ],
    "modules": [
        "connector",
        "connector.Atlas",
        "controller",
        "environment",
        "model",
        "session",
        "view",
        "view.svg"
    ],
    "allModules": [
        {
            "displayName": "connector",
            "name": "connector",
            "description": "AggregationLevelConnector introduces in the query all the information related to the aggregation level.\nIt provides a transparent layer between the tool and the data implementing all the logic\nabout the data aggregation."
        },
        {
            "displayName": "connector.Atlas",
            "name": "connector.Atlas",
            "description": "CacheConnectorAtlas is the cache level dedicated to the atlas data-api for DNSMON.\nIt provides a bottom-up incremental cache and top-down decremental queries."
        },
        {
            "displayName": "controller",
            "name": "controller",
            "description": "GesturesManager provides all the features handling user gestures/interactions."
        },
        {
            "displayName": "environment",
            "name": "environment",
            "description": "HistoryManager provides all the functions to manage the history and the back/forward browser interactions."
        },
        {
            "displayName": "model",
            "name": "model",
            "description": "Cell is the model object for a cell."
        },
        {
            "displayName": "session",
            "name": "session",
            "description": "SessionManager is the layer providing all the functions to manage the session.\nIt provides a transparent layer for the tool to store and retrieve parameters.\nThe persistence can be provided (or not) by cookies or with any other possible server interaction."
        },
        {
            "displayName": "view",
            "name": "view",
            "description": "BreadcrumbsView is the view component for the breadcrumbs function"
        },
        {
            "displayName": "view.svg",
            "name": "view.svg",
            "description": "SvgChartView is the view component representing the chart in SVG terms"
        }
    ]
} };
});