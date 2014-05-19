/**
 * Created by mcandela on 20/11/13.
 */

define([
    "env.utils",
    "env.params-manager",
    "view.full-screen",
    "lib.jquery-ui.timepicker"
], function(utils, paramsManager, FullScreenView){

    /**
     * ControlPanelView is the view component managing the representation of the control panel
     *
     * @class ControlPanelView
     * @constructor
     * @module view
     */

    var ControlPanelView = function(env){
        var container, chart, thresholdsPopup, legendColors, legendPercentages, legendUnit, config, lang, templateManager,
            disabledOpacity, normalOpacity, filtersPopup, extraDataPopup, dnsResponseDom, tracerouteDom,
            autoUpdateButton, slidingMenu, insideSubMenu, slidingMenuOpened, fullScreenButton;

        config = env.config;
        lang = env.lang;
        container = env.container;
        chart = container.chart;
        templateManager = env.mainView.templateManager;

        disabledOpacity = config.style.disabledControllerOpacity;
        normalOpacity = config.style.normalControllerOpacity;
        this.dom = $(templateManager.controlPanel);


        /**
         * This method updates the width of this view
         *
         * @method updateWidth
         */

        this.updateWidth = function(){
            var margin;

            margin = 9;
            this.dom.css("width", env.container.chart.width() - margin + "px");
        };


        /**
         * This method renders this view
         *
         * @method render
         * @input {Object} parentDom The parent DOM where this view should be drawn
         */

        this.render = function(parentDom){
            var $this, datepickers;

            $this = this;
            parentDom.$.prepend($this.dom);
            this.dom.css("margin-left", config.labelWidth);

            this.fullScreenView = new FullScreenView(env);

            datepickers = $(templateManager.timepickersPopup);
            filtersPopup = $(templateManager.filtersPopup);
            thresholdsPopup = $(templateManager.thresholdsPopup);
            extraDataPopup = $(templateManager.extraDataPopup);
            dnsResponseDom = $(templateManager.dnsResponse);
            tracerouteDom = $(templateManager.tracerouteRensponse);
            slidingMenu = $(templateManager.slidingMenu);

            autoUpdateButton = this.dom.find(".keep-updated");
            fullScreenButton = this.dom.find(".full-screen");

            this.dialogPopUp = this.dom.find(".dnsmon-popup");

            this.legend = this.dom.find(".legend");
            this.aggregationLevelLegend = this.dom.find(".legend-agr-level");

            this.updatePeriodically = {
                "dom": autoUpdateButton,
                "icon": autoUpdateButton.find("img")
            };

            this.fullScreenButton = {
                "dom": fullScreenButton,
                "icon": fullScreenButton.find("img")
            };

            this.aggregationLevelLegend.html(lang.aggregationLevelLabel + env.aggregationLabel);

            this.viewSelect = this.dom.find(".legend-controller-select");



            this.thresholdsPopup = {
                "dom": thresholdsPopup,
                "slider": thresholdsPopup.find(".thresholds-slider"),
                "legendPercentages": thresholdsPopup.find(".pls-percentage"),
                "legendUnit": thresholdsPopup.find(".pls-unit"),
                "legendColors": thresholdsPopup.find(".pls-color"),
                "description": thresholdsPopup.find(".popup-pls-text"),
                "messageApply": thresholdsPopup.find(".popup-pls-apply")
            };

            this.extraDataPopup = {
                "dom": extraDataPopup,
                "rawUrl": extraDataPopup.find(".popup-raw-data"),
                "overviewRawUrl": extraDataPopup.find(".popup-overview-raw-data"),
                "dnsResponse":extraDataPopup.find(".popup-dns-response"),
                "traceroutePlace":extraDataPopup.find(".popup-traceroute"),

                "dnsResponseDom": dnsResponseDom,
                "tracerouteDom": tracerouteDom
            };

            this.filtersPopup = {
                "dom": filtersPopup,
                "excludeErrorsCheck": filtersPopup.find(".exclude-errors")
            };

            this.datepickers = {
                "dom": datepickers
            };

            legendColors = $this.legend.find(".pls-color");
            legendUnit = $this.legend.find(".pls-unit");
            legendPercentages = $this.legend.find(".pls-percentage");

            legendColors.last().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[0]));
            legendColors.first().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[1] + config.colorSeparationOffset)); // Greater than

            this.thresholdsPopup.legendPercentages.last().val(env.mainView.colorDomainBreakPoints[0]);
            this.thresholdsPopup.legendPercentages.first().val(env.mainView.colorDomainBreakPoints[1]);

            this.thresholdsPopup.legendColors.last().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[0]));
            this.thresholdsPopup.legendColors.first().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[1] + config.colorSeparationOffset)); // Greater than


            this.dialogPopUp.dialog({
                resizable: false,
                modal: true,
                hide: 200,
                autoOpen: false,
                show: 100,
                open: function(){
                    $('.ui-dialog').addClass('default-text');
                },
                close: function(){
                    $('.ui-dialog').removeClass('default-text');
                }
            });

            this.initButtonEventHandlers();
        };


        /**
         * This method creates sliding menus
         *
         * @method bindSlidingMenu
         * @input {Object} callerButton The DOM element where to attach the sliding menu
         * @input {Object} menuItemsHtml The DOM to draw inside the sliding menu
         * @input {Number} height The height of the menu
         * @input {String} cssClass The class to be applied to the sliding menu
         * @input {Function} callback The callback to be called on click
         */

        this.bindSlidingMenu = function(callerButton, menuItemsHtml, height, cssClass, callback){
            var timerHide;

            if (insideSubMenu == null){
                env.mainDom.$.append(slidingMenu); // Append the sub menu dom
                slidingMenuOpened = false;
                insideSubMenu = false;

                slidingMenu
                    .on("mouseenter", function(){
                        insideSubMenu = true;
                    })
                    .on("mouseleave", function(evt){
                        insideSubMenu = false;
                        if ($(evt.target).attr('class') == slidingMenu.attr('class')){
                            hideSubMenu();
                        }
                    });
            }

            function hideSubMenu(){
                if (insideSubMenu == false){
                    slidingMenu
                        .removeClass(cssClass)
                        .off("click")
                        .hide()
                        .css({
                            height: "0"
                        });
                    slidingMenuOpened = false;
                    env.mainDom.$.tooltip("enable");
                }
            };

            callerButton
                .on("mouseenter",
                function(){
                    if (slidingMenuOpened == false){
                        clearTimeout(timerHide);
                        slidingMenuOpened = true;
                        slidingMenu.html(menuItemsHtml);

                        slidingMenu
                            .on("click", callback)
                            .addClass(cssClass)
                            .css({
                                left: callerButton.position().left,
                                top: callerButton.position().top + 20
                            })
                            .show()
                            .animate({
                                height: height
                            }, 300);

                        env.mainDom.$.tooltip("disable");
                    }
                })
                .on("mouseleave", function(){
                    clearTimeout(timerHide);
                    timerHide = setTimeout(hideSubMenu, 1000);
                });


        };


        /**
         * This method populates the view selectbox with all the options
         *
         * @method loadPossibleView
         */

        this.loadPossibleView = function(){
            var queryType;
            queryType = env.params.type;

            this.removeAllViews();

            switch(queryType){
                case "probes":
                    this.addPossibleView(lang.packetLossLabel, "pls");
                    this.addPossibleView(lang.responseTimeLabel, "rtt");
                    this.addPossibleView(lang.relativeResponseTimeLabel, "relative-rtt");
                    break;

                case "servers":
                    this.addPossibleView(lang.packetLossLabel, "pls");
                    this.addPossibleView(lang.responseTimeLabel, "rtt");
                    this.addPossibleView(lang.relativeResponseTimeLabel, "relative-rtt");
                    break;

                case "instances":
                    this.addPossibleView(lang.numberProbesLabel, "prb");
                    this.addPossibleView(lang.responseTimeLabel, "rtt");
                    this.addPossibleView(lang.relativeResponseTimeLabel, "relative-rtt");
                    break;
            }
        };


        /**
         * This method manages the auto-update function. It is an indirection for keepUpdated in MainView but it manages
         * the menu and the feedback for the user
         *
         * @method keepUpdatedActive
         * @input {Boolean} active If true the auto-update function will be activated
         */

        this.keepUpdatedActive = function(active){
            if(env.isOngoing){ // Is the measurement ongoing?
                if (!active){
                    env.mainView.showMessage(lang.keepUpdatedNotActive);
                    this.updatePeriodically.icon.attr("src", env.widgetUrl + 'view/img/keep_updated_icon.png');
                }else{
                    env.mainView.showMessage(lang.keepUpdatedActive);
                    this.updatePeriodically.icon.attr("src", env.widgetUrl + 'view/img/keep_updated_icon_move2.png');
                }

                env.isUpdatedPeriodicallyActive = active;
                env.mainView.timeController.keepUpdated(active);
            }
        };


        /**
         * This method manages all the auto-start functions
         *
         * @method _initAutoStartFunctions
         * @private
         */

        this._initAutoStartFunctions = function(){
            var $this;

            $this = this;

            env.mainView.on("load", function(){

                if (env.isUpdatedPeriodicallyActive){
                    $this.keepUpdatedActive(true); // Start the auto-update function
                }

                if (env.fullScreenActive){
                    $this.fullScreenView.fullScreenMode(true); // Start the full-screen
                }

            });
        };


        /**
         * This method creates all the listeners for the controllers
         *
         * @method initButtonEventHandlers
         */

        this.initButtonEventHandlers = function(){
            var timeController, manualZoomFactor, $this;

            timeController = env.mainView.timeController;
            manualZoomFactor = config.manualZoomFactor;
            $this = this;

            this._initAutoStartFunctions();

            this.updatePeriodicallyButton = this.updatePeriodically.dom
                .attr("title", lang.keepUpdatedTitle)
                .css("opacity", disabledOpacity)
                .on("click", function(){
                    env.isUpdatedPeriodicallyActive = !env.isUpdatedPeriodicallyActive;
                    $this.keepUpdatedActive(env.isUpdatedPeriodicallyActive);
                });


            this.zoomInButton = this.dom
                .find(".zoom-in")
                .attr("title", lang.zoomInTitle)
                .on("click", function(){
                    if (env.isZoomableIn){
                        timeController.zoomIn.call(timeController, manualZoomFactor);
                    }
                });

            this.zoomOutButton = this.dom
                .find(".zoom-out")
                .attr("title", lang.zoomOutTitle)
                .on("click", function(){
                    if (env.isZoomableOut){
                        timeController.zoomOut.call(timeController, manualZoomFactor);
                    }
                });

            this.leftButton = this.dom
                .find(".left")
                .attr("title", lang.shiftLeftTitle)
                .on("click", function(){
                    if (env.isTranslableLeft){
                        timeController.shiftLeft.call(timeController);
                    }
                });

            this.rightButton = this.dom
                .find(".right")
                .attr("title", lang.shiftRightTitle)
                .on("click", function(){
                    if (env.isTranslableRight){
                        timeController.shiftRight.call(timeController);
                    }
                });

            this.fullScreenButton.dom
                .attr("title", lang.fullScreenTitle)
                .on("click", function(){
                    env.fullScreenActive = !env.fullScreenActive; // Toggle full screen
                    $this.setFullScreen(env.fullScreenActive);
                });

            this.forwardButton = this.dom
                .find(".forward")
                .attr("title", lang.forwardTitle)
                .on("click", function(){
                    timeController.getNewData.call(timeController, null);
                });

            this.bindSlidingMenu(this.forwardButton, $(templateManager.getLastData), 90, 'get-last-data-sliding-panel', function(evt){
                var value;

                value = paramsManager.convertRemoteToLocalTimeWindow($(evt.target).text());

                timeController.getNewData.call(timeController, value);
            });


            this.datepickerButton = this.dom
                .find(".timepicker")
                .attr("title", lang.changeTimeWindowTitle)
                .on("click", function(){

                    $this.dialogPopUp.html($this.datepickers.dom);
                    $this.dialogPopUp.dialog("open");

                    $this.datepickers.start = $this.dialogPopUp.find(".timepicker-start");
                    $this.datepickers.stop = $this.dialogPopUp.find(".timepicker-stop");

                    $this.datepickers.start.datetimepicker({
                        minDate: utils.localDateToUTCDate(env.measurementStartTime),
                        maxDate: utils.localDateToUTCDate(env.measurementEndTime),
                        dateFormat: "yy-mm-dd",
                        beforeShow: function(){
                            $('#ui-datepicker-div').addClass('default-text');
                        },
                        onClose: function(){
                            $('#ui-datepicker-div').removeClass('default-text');
                        }
                    });

                    $this.datepickers.stop.datetimepicker({
                        minDate: utils.localDateToUTCDate(env.measurementStartTime),
                        maxDate: utils.localDateToUTCDate(env.measurementEndTime),
                        dateFormat: "yy-mm-dd",
                        beforeShow: function(){
                            $('#ui-datepicker-div').addClass('default-text');
                        },
                        onClose: function(){
                            $('#ui-datepicker-div').removeClass('default-text');
                        }
                    });

                    $this.datepickers.start.datepicker("setDate", utils.localDateToUTCDate(env.params.startDate));
                    $this.datepickers.stop.datepicker("setDate", utils.localDateToUTCDate(env.params.endDate));


                    $this.dialogPopUp.dialog({
                        title: lang.changeTimeWindowTitle,
                        width: 380,
                        height: 140,
                        buttons: {
                            "Cancel": function() {
                                $(this).dialog("close");
                            },

                            "Apply": function() {
                                env.params.startDate = utils.UTCDateToLocalDate($this.datepickers.start.datetimepicker('getDate'));
                                env.params.endDate = utils.UTCDateToLocalDate($this.datepickers.stop.datetimepicker('getDate'));
                                env.mainView.updateXDomain(true);
                                $(this).dialog("close");
                            }
                        },
                        beforeClose: function() {
                            $this.datepickers.start.datepicker("destroy");
                            $this.datepickers.stop.datepicker("destroy");
                        }
                    });

                });

            this.thresholdsButton = this.dom
                .find(".thresholds,.legend-pls") // Both button and legend are clickable STAT-511
                .attr("title", lang.changeColorsRangeTitle)
                .on("click", function(){
                    var thresholdsRanges;

                    $this.dialogPopUp.dialog("open");

                    thresholdsRanges = $this._getThresholdsRanges();
                    $this.dialogPopUp.html($this.thresholdsPopup.dom);

                    $this.dialogPopUp.dialog({
                        title: lang.changeColorsRangeTitle,
                        width: 460,
                        height: 220,
                        buttons: {

                            "Default": function(){
                                var newColorScale, showFilter;

                                showFilter = env.session.getValue('show-filter');

                                newColorScale = utils.computeColorScale(config.normalColorScales[showFilter]);
                                env.mainView.updateOnlyColors(newColorScale.valueRange);
                                $this.updateLegend(newColorScale.valueRange[2], newColorScale.valueRange[3]);
                                env.history.update();
                                $(this).dialog("close");
                            },

                            "Close": function() {
                                $(this).dialog("close");
                            }
                        }
                    });

                    $this.thresholdsPopup.description.html(lang.thresholdsDescritions[env.session.getValue('show-filter')]);

                    $this.thresholdsPopup.slider.show();
                    $this.thresholdsPopup.messageApply.hide();

                    $this.thresholdsPopup
                        .slider
                        .slider({
                            range: true,
                            min: thresholdsRanges[0],
                            max: thresholdsRanges[1],
                            values: env.mainView.colorDomainBreakPoints,
                            stop: function(){
                                env.history.update();
                            },
                            slide: function(event, ui) {
                                var newValuesRange;

                                $this.updateLegend(ui.values[0], ui.values[1]);

                                newValuesRange = [
                                    thresholdsRanges[0],
                                    ui.values[0],
                                    ui.values[0],
                                    ui.values[1],
                                    thresholdsRanges[1]
                                ];
                                env.mainView.updateOnlyColors(newValuesRange);
                            }
                        });

                    $this.thresholdsPopup.legendPercentages
                        .off('keydown')
                        .off('change')
                        .on('keydown', function(evt){
                            var unicode;

                            evt.stopPropagation();
                            unicode = (evt.which) ? evt.which : evt.keyCode;
                            if (!(unicode > 31 && (unicode < 48 || unicode > 57) && (unicode < 96 || unicode > 105))) {
                                $this.thresholdsPopup.slider.hide();
                                $this.thresholdsPopup.messageApply.show();
                            }
                        })
                        .on('change keyup', function(evt){
                            var max, min, valueMax, valueMin, values, slider, parent, unicode;
                            evt.stopPropagation();

                            unicode = (evt.which) ? evt.which : evt.keyCode;

                            if (!unicode || unicode == 13){

                                $this.thresholdsPopup.messageApply.hide();
                                slider = $this.thresholdsPopup.slider;

                                slider.show();

                                max = slider.slider('option', 'max');
                                min = slider.slider('option', 'min');

                                parent = $this.thresholdsPopup.dom;

                                values = [parseFloat(parent.find('.min-val').val()), parseFloat(parent.find('.max-val').val())];

                                valueMin = (utils.isNumber(values[0]) && values[0] < max && values[0] > min) ? parseFloat(values[0]) : parseFloat(min);
                                valueMax = (utils.isNumber(values[1]) && values[1] < max && values[1] > min) ? parseFloat(values[1]) : parseFloat(max);


                                if (valueMax < valueMin){ // Don't invert the boundaries
                                    if (valueMax == parseFloat($(this).val())){ // Give to the user a feedback related to what is changed in the last interaction
                                        valueMax = valueMin;
                                    }else{
                                        valueMin = valueMax;
                                    }

                                }

                                slider.slider("values", 1, valueMin);
                                $this.thresholdsPopup.legendPercentages.last().val(valueMin);

                                slider.slider("values", 0, valueMax);
                                $this.thresholdsPopup.legendPercentages.first().val(valueMax);

                                $this.updateLegend(valueMin, valueMax);
                                env.mainView.updateOnlyColors([min, valueMin, valueMin, valueMax, max]);
                            }
                        });
                });

            this.allRowsButton = this.dom
                .find(".allrows")
                .attr("title", lang.allRowsTitle)
                .css("opacity", disabledOpacity)
                .on("click", function(){
                    if (env.params.selectedRows.length != 0){

                        env.params.selectedRows = [];
                        env.params.filterProbes = false;
                        env.mainView.redraw();
                    }
                });

            this.filterSelection = this.dom
                .find(".filters")
                .attr("title", lang.filterSelectionTitle)
                .on("click", function(){

                    $this.dialogPopUp.dialog("open");
                    $this.dialogPopUp.html($this.filtersPopup.dom);

                    $this.dialogPopUp.dialog({
                        title: lang.filtersPopupTitle,
                        width: 300,
                        height: 140,
                        buttons: {
                            "Close": function() {
                                $(this).dialog("close");
                            }
                        }
                    });

                    $this.filtersPopup
                        .excludeErrorsCheck
                        .off("click")
                        .attr('checked', (env.session.getValue('exclude-errors') == 'true'))
                        .on("click", function(){
                            env.session.saveValue('exclude-errors', $(this).is(":checked"));
                            env.mainView.redraw();
                        });

                });

            this.viewSelect
                .on("change", function(){
                    env.session.saveValue("show-filter", $(this).val());
                    env.mainView.redraw();
                });
        };


        /**
         * This method returns the ranges for the colors thresholds
         *
         * @method _getThresholdsRanges
         * @private
         * @return {Array} An array composed of two integers
         */

        this._getThresholdsRanges = function(){
            var showFilter;

            showFilter = env.session.getValue('show-filter');
            switch(showFilter){
                case "pls":
                    return [0, 100];
                    break;

                case "rtt":
                    return [0, 5000];
                    break;

                case "relative-rtt":
                    return [0, 1000];
                    break;

                case "prb":
                    return [0, 5000];
                    break;
            }
        };


        /**
         * This method manages the full screen mode. It is an indirection for fullScreenMode in FullScreenView
         * but it manages the menu and the feedback for the user
         *
         * @method setFullScreen
         * @return {Boolean} fullScreen If true the full screen will be activated
         */

        this.setFullScreen = function(fullScreen){
            var icon;

            icon = (fullScreen) ? 'view/img/dnsmon_smallscreen_icon.png' : 'view/img/dnsmon_fullscreen_icon.png';

            this.fullScreenButton.icon.attr("src", env.widgetUrl + icon);
            this.fullScreenView.fullScreenMode(fullScreen);
        };


        /**
         * This method updates the status of all the items in the menu (e.g. if a button is clickable or not)
         *
         * @method update
         */

        this.update = function(){
            this.allRowsButton.css("opacity", (env.params.selectedRows.length == 0) ? disabledOpacity : normalOpacity);
            this.rightButton.css("opacity", (env.isTranslableRight == false) ? disabledOpacity : normalOpacity);
            this.leftButton.css("opacity", (env.isTranslableLeft == false) ? disabledOpacity : normalOpacity);
            this.zoomInButton.css("opacity", (env.isZoomableIn == false) ? disabledOpacity : normalOpacity);
            this.zoomOutButton.css("opacity", (env.isZoomableOut == false) ? disabledOpacity : normalOpacity);

            this.updatePeriodicallyButton.css("opacity", (env.isOngoing == false) ? disabledOpacity : normalOpacity);


            this.updateAggregationLevelLegend(lang.aggregationLevelLabel + ': ' + env.aggregationLabel);

            this.updateLegend(env.mainView.colorDomainBreakPoints[0], env.mainView.colorDomainBreakPoints[1]);

            this.loadPossibleView();
        };


        /**
         * This method updates the color thresholds with the new values
         *
         * @method updateLegend
         * @input {Number} firstValue An integer for the first threshold
         * @input {Number} secondValue An integer for the second threshold
         */

        this.updateLegend = function(firstValue, secondValue){
            var firstUnit, secondUnit, showFilter, realFirstValue, realSecondValue, realFirstUnit, realSecondUnit;

            showFilter = env.session.getValue('show-filter');

            realFirstValue = firstValue;
            realSecondValue = secondValue;

            switch(showFilter){
                case "pls":
                    realFirstUnit = "%";
                    realSecondUnit = "%";
                    firstUnit = realFirstUnit;
                    secondUnit = realSecondUnit;
                    break;

                case "rtt":
                    if (firstValue >= 1000){
                        firstValue = (firstValue/1000).toFixed(1);
                        realFirstUnit = "ms";
                        firstUnit = "s";
                    }else{
                        realFirstUnit = "ms";
                        firstUnit = "ms";
                    }

                    if (secondValue >= 1000){
                        secondValue = (secondValue/1000).toFixed(1);
                        realSecondUnit = "ms";
                        secondUnit = "s";
                    }else{
                        realSecondUnit = "ms";
                        secondUnit = "ms";
                    }

                    break;

                case "relative-rtt":
                    realFirstUnit = "%";
                    realSecondUnit = "%";
                    firstUnit = realFirstUnit;
                    secondUnit = realSecondUnit;
                    break;

                case "prb":
                    firstUnit = "#p";
                    secondUnit = "#p";
                    break;
            }

            legendPercentages.last().html(firstValue);
            legendPercentages.first().html(secondValue);

            legendUnit.last().html(firstUnit);
            legendUnit.first().html(secondUnit);

            this.thresholdsPopup.legendPercentages.last().val(realFirstValue);
            this.thresholdsPopup.legendPercentages.first().val(realSecondValue);

            this.thresholdsPopup.legendUnit.last().html(realFirstUnit);
            this.thresholdsPopup.legendUnit.first().html(realSecondUnit);
        };


        /**
         * This method updates the data resolution legend
         *
         * @method updateAggregationLevelLegend
         * @input {String} newLabel The new legend
         */

        this.updateAggregationLevelLegend = function(newLabel){
            var domElement;
            domElement = this.aggregationLevelLegend;

            if (domElement.text() != newLabel){
                domElement
                    .html(newLabel)
                    .attr("title", lang.aggregationLevelTitle)
                    .toggleClass("updated");

                setTimeout(function(){
                    domElement.toggleClass("updated");
                }, config.aggregationLegendUpdatedDuration);
            }

        };


        /**
         * This method appends an option for the selectobox fo the views
         *
         * @method addPossibleView
         * @input {String} label The name of the view
         * @input {String} value The value/key of the view
         */

        this.addPossibleView = function(label, value){
            var checked, showFilter;

            showFilter = env.session.getValue('show-filter');

            checked = (value == showFilter) ? 'selected="selected"' : '' ;
            this.viewSelect.append('<option value="' + value + '" ' + checked + '>' + label + '</option>');
        };


        /**
         * This method removes all the options of the selectobox fo the views
         *
         * @method removeAllViews
         */

        this.removeAllViews = function(){
            this.viewSelect.html("");
        };


        /**
         * This method renders a dialog box with all the information related to a cell
         *
         * @method showExtraInfoDialog
         * @input {Object} cell A cell object
         */

        this.showExtraInfoDialog = function(cell){
            var overviewUrls, sampleUrls, parentOverview, parentSample, linkText, linkUrl, linkCurrent, urlItem,
                htmlDnsResponse, dnsResponsePlace, traceroutePlace, tracerouteArea, tracerouteDom, dataItem,
                dialogHeight, textareaWidth;

            overviewUrls = env.connector.getDataUrls(cell);
            sampleUrls = env.connector.getCellDataUrls(cell);

            dialogHeight = 210;

            this.dialogPopUp.dialog({
                title: lang.extraInfoDialogTitle,
                width: 500,
                height: dialogHeight,
                buttons: {
                    "Close": function() {
                        var $this;

                        $this = $(this);

                        $this.removeClass("resized-dialog-traceroute");
                        $this.dialog("option", "resizable", false);
                        $this.dialog("close");
                    }
                }
            });

            this.dialogPopUp.dialog("open");
            this.dialogPopUp.html(this.extraDataPopup.dom);

            parentOverview = this.extraDataPopup.overviewRawUrl;
            parentSample = this.extraDataPopup.rawUrl;

            parentOverview.html('');
            parentSample.html('');

            for (var n=0,length=sampleUrls.length; n<length; n++){
                urlItem = sampleUrls[n];
                linkUrl = urlItem.url;
                linkText = urlItem.label;
                linkCurrent = urlItem.current;

                if (env.retrievedAggregationLevel != 0 || linkCurrent){
                    parentSample.append('<a target="_blank" href="' + linkUrl + '" title="' + linkText + '">' + linkText + ((linkCurrent) ? ' (current)' : '') + '</a> ');
                }
            }

            for (var n=0,length=overviewUrls.length; n<length; n++){
                urlItem = overviewUrls[n];
                linkUrl = urlItem.url;
                linkText = urlItem.label;
                linkCurrent = urlItem.current;
                if (env.retrievedAggregationLevel != 0 || linkCurrent){
                    parentOverview.append('<a target="_blank" href="' + linkUrl + '" title="' + linkText + '">' + linkText + ((linkCurrent) ? ' (current)' : '') + '</a> ');
                }
            }

            dnsResponsePlace = this.extraDataPopup.dnsResponse;
            dnsResponsePlace.html("").removeClass('dns-response-error');

            traceroutePlace = this.extraDataPopup.traceroutePlace;
            traceroutePlace.html("");

            this.dialogPopUp.dialog("option", "resizable", false);

            if (env.retrievedAggregationLevel == 0){ // If native resolution

                env.connector.getNativeDnsResult(cell, function(data){ // Show the DNS response

                    for (var n=0,length=data.length; n<length; n++){
                        dataItem = data[n];

                        dialogHeight += 30;
                        this.dialogPopUp.dialog({height: dialogHeight}); //Enlarge the dialog to fit in the dns response
                        htmlDnsResponse = this.extraDataPopup.dnsResponseDom.clone();

                        htmlDnsResponse.find(".dns-response-prbid").html(dataItem.probeId);
                        htmlDnsResponse.find(".dns-response-rt").html(dataItem.responseTime);
                        htmlDnsResponse.find(".dns-response-date").html(utils.dateToString(dataItem.date));

                        if (dataItem.nsId){
                            htmlDnsResponse.find(".dns-response-nsid").html(dataItem.nsId);
                        }else{
                            htmlDnsResponse.find(".dns-response-nsid-rd").hide();
                        }

                        if (dataItem.response && dataItem.response != ''){
                            htmlDnsResponse.find(".dns-response-plaintext").html(dataItem.response);
                        }

                        if (dataItem.error){
                            htmlDnsResponse.find(".dns-response-plaintext").addClass("dns-response-error").html('[' + dataItem.error.type + '] ' + dataItem.error.message);
                        }

                        dnsResponsePlace.append(htmlDnsResponse);
                    }

                }, this);


                env.connector.getClosestTraceroutes(cell, function(data){ // Show the closest Traceroutes

                    if (data.length > 0){
                        dialogHeight += 150;
                        this.dialogPopUp.dialog({ height: dialogHeight }); //Enlarge the dialog to fit in the traceroutes

                        tracerouteDom = this.extraDataPopup.tracerouteDom.clone();

                        traceroutePlace.append(tracerouteDom);

                        if (data.length >= 2){
                            this.dialogPopUp.dialog("option", "resizable", true);
                            this.dialogPopUp.dialog({
                                resize: function(event, ui){
                                    if (ui.size.width > textareaWidth * 2){
                                        $(this).addClass("resized-dialog-traceroute");
                                    }else{
                                        $(this).removeClass("resized-dialog-traceroute");
                                    }
                                }
                            });

                        }else{
                            this.dialogPopUp.dialog("option", "resizable", false);
                        }

                        for (var n=0,length=data.length; n<length; n++){

                            dataItem = data[n];

                            tracerouteArea = $('<div class="textarea"></div>').tooltip(
                                {
                                    tooltipClass: 'custom-jquery-ui-tooltip',
                                    hide: {
                                        effect: "fade",
                                        duration: config.tooltipFade
                                    }
                                });
//                            tracerouteArea.text('>>>' + utils.dateToString(dataItem.date) + '\n' + dataItem.response);

                            tracerouteArea.html(dataItem);
                            tracerouteDom.append(tracerouteArea);
                            textareaWidth = tracerouteArea.width();
                        }

                    }
                }, this);
            }

        };


    };

    return ControlPanelView;
});