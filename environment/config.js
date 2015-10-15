
define([], function(){

    /**
     * Configuration file
     */

    return {
        containerWidthDefault: 880,
        containerHeightDefault: 400,

        containerMinWidth: 880,

        chartMaxHeight: 900,
        chartMinHeight: 500,

        chartMargins: {top: 20, bottom: 70, right: 5},
        timeOverviewMargins:  {top: 0, right: 0, bottom: 70, left: 20},

        maxNumberOfCells: 20000,

        slideProportion: 1/5,
        zoomProportion: 1/20,
        virtualZoomFactor: 1/8,

        xCellsMargin: 0.5,
        yCellsMargin: 0.1,

        maxYLabelLength: 15,

        cellsMinWidth: 4,
        cellsMaxWidth: 500,

        cellsMinHeight: 20,
        cellsMaxHeight: 30,

        trackerPadding: 20, // Describes the amount of pixels around the chart considered belonging the chart
        nativeCellWidthFrequencyPercentage: 60, // A percentage of the native sampling frequency
        visibleCellsHeight: 3,
        shakeActive: false,
        shakeTuner: 2,  // Higher values stronger shakes, more fun and more cpu usage

        cellUnselectedOpacity: 0.7,

        xSeparationOffset: 0,
        ySeparationOffset: 0.4,

        manualZoomFactor: 4,

        //defaultTimeFrameMinutes: 3600,
        antiFloodTimer: 500,
        tooltipFade: 700,
        redrawFadeIn: 100, // redrawFadeIn + redrawFadeOut should be less or equal than antiFloodTimer
        redrawFadeOut: 400, // redrawFadeIn + redrawFadeOut should be less or equal than antiFloodTimer
        shakeDuration: 400, // Should be less than antiFloodTimer
        forceLowProfile: false,
        minimumTimeWindowSeconds: 3600 * 2,
        excludeErrorsByDefault: true,
        historyInUrl: true,
        historyInUrlAtInitialisation: false,
        allowPermalinks: true,
        allRowsZoomingOut: false,
        useLocalPersistenceForSettings: true,
        localPersistenceValidityTimeMinutes: 24 * 60 * 120, // ~ 4 months
        timeEventsActiveByDefault: true,
        timeWindowAlignedByDefault: false,
        popupDelay: 200,
        messagesFadeOutSeconds: 6000,
        zoomAnimationDuration: 400,
        zoomAnimationDelay: 0,
        selectRowColumnTimer: 400,
        hoverTransitionDuration: 0,
        reconnectionInterval: 10000,
        connectionTimeout: 10000,
        selectionWithdrawalDuration: 1000,
        aggregationLegendUpdatedDuration: 3000,

        tracerouteSurrounding: 1, // How many traceroute on the left and right of the selected sample?
        nsidSurrounding: 1,

        localCacheActiveByDefault: true,
        activeKeysByDefault: true,
        activeMouseZoomByDefault: true,
        activeGesturesByDefault: true,
        autoUpdateActiveByDefault: false,
        fullScreenActiveByDefault: false,
        timeOverviewOpenedByDefaultInFullScreen: false,
        groupingByDefault: true,

        persistLog: false,
        persistErrors: false,
        storageLogRestApiUrl: 'http://wbr3.webrobotics.net/log.php',
        storageErrorRestApiUrl: 'http://wbr3.webrobotics.net/log.php',
        logAppTag: 'dnsmon',

        updateEverySeconds: 190,
        sensibilityFactorDuringSelection: 2,
        mouseWheelSensibility: 0, // Increase this number to reduce the sensibility
        colorSeparationOffset: 0.0001,

        labelWidth: 110,

        showFilterDefaultValue: 'pls',
        packetLossTimeoutMilliseconds: 5000,

        hideTimeOverviewWhenLessThanSeconds: 60 * 60 * 24, //1 day
        brusherBucketLevelsMinutes: {
            "day": 43200 * 0.5, //0.5 month
            "week": 43200 * 5, //5 months
            "month": (43200 * 12 * 1), //1 year,
            "months": (43200 * 12 * 3), //1 year,
            "year": (43200 * 12 * 6) //1 year (6 months view)
        },


        normalColorScales: {
            "pls": [
                {colorRange: ["#38B000", "#38B000"], valueRange: [0, 66]},
                {colorRange: ["#FAB669", "red"], valueRange: [66, 99]},
                {colorRange: ["red"], valueRange: [100]}
            ],

            "rtt": [
                {colorRange: ["#38B000", "#38B000"], valueRange: [0, 60]},
                {colorRange: ["#FAB669", "red"], valueRange: [60, 250]},
                {colorRange: ["red"], valueRange: [5000]}
            ],

            "relative-rtt": [
                {colorRange: ["#38B000", "#38B000"], valueRange: [0, 125]},
                {colorRange: ["#FAB669", "red"], valueRange: [125, 200]},
                {colorRange: ["red"], valueRange: [1000]}
            ],

            "prb": [
                {colorRange: ["#38B000", "#38B000"], valueRange: [0, 66]},
                {colorRange: ["#FAB669", "red"], valueRange: [66, 99]},
                {colorRange: ["red"], valueRange: [100]}
            ]

        },

        selectionColorScales: {
            "pls": [
                {colorRange: ["#6171C7", "#6171C7"], valueRange: [0, 66]},
                {colorRange: ["#B0D2FF", "#02295C"], valueRange: [66, 99]},
                {colorRange: ["#02295C"], valueRange: [100]}
            ],

            "rtt": [
                {colorRange: ["#6171C7", "#6171C7"], valueRange: [0, 66]},
                {colorRange: ["#B0D2FF", "#02295C"], valueRange: [66, 99]},
                {colorRange: ["#02295C"], valueRange: [5000]}
            ],

            "relative-rtt": [
                {colorRange: ["#6171C7", "#6171C7"], valueRange: [0, 125]},
                {colorRange: ["#B0D2FF", "#02295C"], valueRange: [125, 200]},
                {colorRange: ["#02295C"], valueRange: [1000]}
            ],

            "prb": [
                {colorRange: ["#6171C7", "#6171C7"], valueRange: [0, 66]},
                {colorRange: ["#B0D2FF", "#02295C"], valueRange: [66, 99]},
                {colorRange: ["#02295C"], valueRange: [100]}
            ]

        },


        style: {
            selectionCursor: "crosshair",
            axisLabelsFontSizeDefault: "10px",
            axisLabelsFontSizeSelected: "10px",
            selectorRectColor: "#687B87",
            noRttAvailableColor: "#BDBDBD",
            noRttAvailableSelectionColor: "#BAC5D1",
            noSelectableAreaColor: "#C0C0C0",
            selectorRectStokeWidth: "2px",
            chartBackground: "white",
            verticalSelectorPadding: 2,
            disabledControllerOpacity: 0.3,
            normalControllerOpacity: 1,
            popUpFontSize: 10,
            fullScreenMargin: 15,
            containerMargin: 5,

            timeOverviewHeight: 97,
            controlPanelHeight: 30,
            breadCrumbsHeight: 10,
            externalBorderWidth: 1,

            fullScreenZIndex: 99,
            fullScreenBackground: "#2E2E2E"
        },

        domClasses:{
            externalDom: "dnsmon-external",
            mainDom: "dnsmon-container",
            svgContainerDom: "dnsmon-container-svg",
            chartDom: "dnsmon-chart",
            chartSelectorOrizontal: "selector-orizontal",
            chartSelectorVertical: "selector-vertical",
            timeOvervireContainerDom: "time-overview-external-container",
            bottomInfoNoticeClass: "bottom-info-section"
        },

        lowProfileLimitations: {
            numerOfCells: 2500
        },

        defaultLang: this.defaultLang
    };
});
