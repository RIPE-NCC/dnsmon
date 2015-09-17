/**
 * Created by mcandela on 05/11/13.
 */

define([
    "dnsmon.env.utils",
    "dnsmon.lib.jquery-libs-amd"
], function(utils, $){

    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){
        var widgetUrl, config;

        widgetUrl = env.widgetUrl;
        config = env.config;

        this.loadingImage = '<img src="' + widgetUrl + 'view/img/loading.gif" class="loading-image"/> ';

        this.timeMargins = '<div class="time-margins"><div style="position: absolute; left: 0;"></div> <div style="position: absolute; right: 0;"></div></div>';

        this.controlPanel =
            '<div class="button-group control-panel">' +
                '<div class="legend-controller">' +
                '<select class="legend-controller-select" title="' + env.lang.viewSelectboxTitle + '"></select>' +
                '</div>' +
                '<div class="legend">' +
                '<div class="legend-pls">' +
                '<div class="legend-pls-item"><div class="pls-color"></div>&nbsp;&gt;&nbsp;<span class="pls-percentage"></span><span class="pls-unit"></span>&nbsp;</div>' +
                '<div class="legend-pls-item"><div class="pls-color"></div>&nbsp;&le;&nbsp;<span class="pls-percentage"></span><span class="pls-unit"></span>&nbsp;</div>' +
                '</div>' +
                '<div class="legend-agr-level">' +
                '</div>'
                +
                '</div>' +


                '<div class="button forward">' +
                '<img src="' + widgetUrl + 'view/img/dnsmon_forward_icon.png"/>' +
                '</div>' +

                '<div class="button right">' +
                '<img src="' + widgetUrl + 'view/img/right_icon.png"/>' +
                '</div>' +

                '<div class="button zoom-in">' +
                '<img src="' + widgetUrl + 'view/img/zoomin_icon.png"/>' +
                '</div>' +

                '<div class="button zoom-out">' +
                '<img src="' + widgetUrl + 'view/img/zoomout_icon.png"/>' +
                '</div>' +

                '<div class="button allrows">' +
                '<img src="' + widgetUrl + 'view/img/allrows_icon.png"/>' +
                '</div>' +

                '<div class="button left">' +
                '<img src="' + widgetUrl + 'view/img/left_icon.png"/>' +
                '</div>' +

                '<div class="button timepicker">' +
                '<img src="' + widgetUrl + 'view/img/calendar_icon.png"/>' +
                '</div>' +

                '<div class="button thresholds">' +
                '<img src="' + widgetUrl + 'view/img/thresholds_icon.png"/>' +
                '</div>' +

                '<div class="button keep-updated">' +
                '<img src="' + widgetUrl + 'view/img/keep_updated_icon.png"/>' +
                '</div>' +

                '<div class="button filters">' +
                '<img src="' + widgetUrl + 'view/img/filter_icon.png"/>' +
                '</div>' +

                '<div class="button full-screen">' +
                '<img src="' + widgetUrl + 'view/img/dnsmon_fullscreen_icon.png"/>' +
                '</div>' +


                '<div class="dnsmon-popup default-text">' +
                '</div>' +

                '</div>';

        this.timepickersPopup =
            '<div style="float: left;">' + env.lang.startDateLabel + ' <br/><input type="text" class="timepicker-start date-field" /></div>' +
                '<div style="position: absolute; top: 15px; left: 145px;"><img style="" src="' + widgetUrl + 'view/img/double_arrow.gif" /></div>' +
                '<div style="float: right;">' + env.lang.endDateLabel + ' <br/><input type="text" class="timepicker-stop date-field" /></div>';

        this.thresholdsPopup =
            '<div>' +
                '<div class="thresholds-internal-legend">' + '<div class="popup-pls-text"></div>' +
                '<div class="popup-pls-item"><div class="pls-color"></div>&nbsp;&gt;&nbsp;<input class="pls-percentage max-val" value="0"/>&nbsp;<span class="pls-unit"></span>&nbsp;</div>' +
                '<div class="popup-pls-item"><div class="pls-color"></div>&nbsp;&le;&nbsp;<input class="pls-percentage min-val" value="0"/>&nbsp;<span class="pls-unit"></span>&nbsp;</div>' +
                '</div>' +
                '<div class="popup-pls-apply">' + env.lang.pressToApply + '</div>' +
                '<div class="thresholds-slider"></div>' +
                '</div>';

        this.slidingMenu = '<div class="sliding-panel">' +
            '</div>';

        this.openTimeOverviewImage = '<img src="' + widgetUrl + 'view/img/open_time_overview.png" class="open-timeoverview-button"/>';

        this.getLastData = '<div>5h</div>' +
            '<div>1d</div>' +
            '<div>1w</div>' +
            '<div>1m</div>';


        this.extraDataPopup =
            '<div>' +
                '<div>' + env.lang.extraInfoDialogTextSample + ':' +
                '<div class="popup-raw-data"></div>' +
                '</div>' +

                '<div style="margin-top: 10px;">' + env.lang.extraInfoDialogTextOverview + ':' +
                '<div class="popup-overview-raw-data"></div>' +
                '</div>' +
                '<div class="popup-tabs">' +
                    '<ul>' +
                        '<li><a href="#tabs-1">' + env.lang.tab1Title + '</a></li>' +
                        '<li><a href="#tabs-2">' + env.lang.tab2Title + '</a></li>' +
                        '<li><a href="#tabs-3">' + env.lang.tab3Title + '</a></li>' +
                    '</ul>' +
                    '<div id="tabs-1">' +
                        '<div class="popup-dns-response"></div>' +
                    '</div>' +
                    '<div id="tabs-2">' +
                        '<div class="popup-traceroute"></div>' +
                    '</div>' +
                    '<div id="tabs-3">' +
                        '<div class="popup-hostnamebind-response"></div>' +
                    '</div>' +
                '</div>' +
                '</div>';

        this.dnsResponse =
            '<table class="dns-response-table" border="1">' +
                '<tr class="dns-response-top">' +
                '<td>' + env.lang.dnsResponsePrbId + ': <span class="dns-response-prbid"></span>' + '</td>' +
                '<td>' + env.lang.dnsResponseRt + ': <span class="dns-response-rt"></span>' + '</td>' +
                '<td>' + env.lang.dnsResponseDate + ': <span class="dns-response-date"></span>' + '</td>' +
                '</tr>' +
                '<tr class="dns-response-nsid-rd">' +
                '<td colspan = "3">' + env.lang.dnsResponseNsId + ': <span class="dns-response-nsid"></span></td>' +
                '</tr>' +
                '<tr class="dns-response-bottom">' +
                '<td colspan = "3"><span class="dns-response-plaintext"></span></td>' +
                '</tr>' +
            '</table>';

        this.hostBindResponse =
            '<table class="hostbind-response-table" border="1">' +
            '<tr class="hostbind-response-top">' +
            '<td>' + env.lang.hostBindResponsePrbId + ': <span class="hostbind-response-prbid"></span>' + '</td>' +
            '<td>' + env.lang.hostBindResponseRt + ': <span class="hostbind-response-rt"></span>' + '</td>' +
            '<td>' + env.lang.hostBindResponseDate + ': <span class="hostbind-response-date"></span>' + '</td>' +
            '</tr>' +
            '<tr class="hostbind-response-msmId-rd">' +
            '<td colspan = "3">' + env.lang.hostBindResponseMsmId + ': <span class="hostbind-response-msmId"></span></td>' +
            '</tr>' +
            '<tr class="hostbind-response-bottom">' +
            '<td colspan = "3"><span class="hostbind-response-plaintext"></span></td>' +
            '</tr>' +
            '</table>';

        this.tracerouteRensponse =
            '<div>' +
            '<div class="traceroute-title">' + env.lang.closestTracerouteLabel + '</div>' +
            '</div>';

        this.fullScreenThrobber = '<img class="full-screen-throbber" src="' + widgetUrl + 'view/img/full_screen_loader.gif"/>';

        this.filtersPopup =
            '<div>' +
                '<label>' + env.lang.filterSelectionTitle + '</label><br/>' +
                '<div class="filter-popup-item">' +
                  env.lang.excludeErrorsFilterLabel + '<input type="checkbox" class="exclude-errors" name="exclude-errors">' +
                '</div>' +

                '<div class="filter-popup-item">' +
                  '<span>' + env.lang.protocol3SelectionFilterLabel + ': ' +
                    '<select class="dnsmon-filter-3protocol">' +
                      '<option value="both">IPv4 and IPv6</option>' +
                      '<option value="4">IPv4 only</option>' +
                      '<option value="6">IPv6 only</option>' +
                    '</select>' +
                  '</span>' +
                '</div>' +

              '<div class="filter-popup-item">' +
              '<span>' + env.lang.protocol4SelectionFilterLabel + ': ' +
              '<select class="dnsmon-filter-4protocol">' +
                '<option value="udp">UDP</option>' +
                '<option value="tcp">TCP</option>' +
              '</select>' +
              '</span>' +
              '</div>' +

            '</div>';

        this.breadcrumbs = '<div class="stacked-title"></div>';

        this.overlayMessage = '<div class="dnsmon-message"></div>';


        /**
         * This method creates all the basic DOM elements needed to the widget
         *
         * @method createDom
         * @input {Object} parentDom A DOM element to be filled with the initial DOM of the widget
         * @input {Object} instanceParams A vector of initialisation parameter
         */

        this.createDom = function(parentDom, instanceParams){
            var containerDom, svgContainerDom, externalDom, timeMargins, timeOvervireContainerDom, bottomInfoSection;

            this.dom = {};

            /*
             * Set the DOM container
             */
            externalDom = $('<div></div>').addClass(config.domClasses.externalDom).css("border-width", config.style.externalBorderWidth);
            containerDom = $('<div></div>').addClass(config.domClasses.mainDom).css("margin", config.style.containerMargin);
            svgContainerDom = $('<div></div>').addClass(config.domClasses.svgContainerDom);
            timeOvervireContainerDom = $('<div></div>').addClass(config.domClasses.timeOvervireContainerDom);
            bottomInfoSection = $('<div>' + env.lang.bottomInfoSection + '</div>').addClass(config.domClasses.bottomInfoNoticeClass);
            timeMargins = $(this.timeMargins).css("top", config.style.controlPanelHeight);

            /*
             * Style the container
             */
            if (instanceParams.width < config.containerMinWidth){
                console.log("The minimum possible with is " + config.containerMinWidth);
                instanceParams.width = null;
            }

            externalDom.css("width", (instanceParams.width || config.containerWidthDefault) - (config.style.externalBorderWidth * 2));
            timeOvervireContainerDom.css("margin-left", config.labelWidth - config.timeOverviewMargins.left);

            containerDom.tooltip(
                {
                    tooltipClass: 'custom-jquery-ui-tooltip',
                    hide: {
                        effect: "fade",
                        duration: config.tooltipFade
                    }
                }
            );

            /*
             * Build DOM tree
             */
            containerDom.append(svgContainerDom);
            externalDom.append(containerDom);
            $(parentDom).append(externalDom);

            /*
             * Build DOM js vectors
             */
            env.mainDom = utils.encapsulateDom(containerDom);
            env.externalDom = utils.encapsulateDom(externalDom);

            this.dom.svgContainer = utils.encapsulateDom(svgContainerDom);

            env.mainDom.$.append(timeMargins);
            this.dom.timeMargins = utils.encapsulateDom(timeMargins);

            env.mainDom.$.append(timeOvervireContainerDom);
            this.dom.timeOverviewContainer = utils.encapsulateDom(timeOvervireContainerDom);

            env.mainDom.$.append(bottomInfoSection);
            this.dom.bottomInfoSection = utils.encapsulateDom(bottomInfoSection);

            this.dom.loadingImage = utils.encapsulateDom($(this.loadingImage));
            env.mainDom.$.append(this.dom.loadingImage.$);

            this.dom.message = utils.encapsulateDom($(this.overlayMessage));
            env.mainDom.$.append(this.dom.message.$);


            if (utils.getUrlParam("dnsmon_info") == "true" && window.atob){
                // - Christopher Amin (data-api), Massimo Candela (web tool), Andreas Strikos (deployment) - RIPE NCC
                bottomInfoSection.html("Version: " + env.version + window.atob("IC0gQ2hyaXN0b3BoZXIgQW1pbiAoZGF0YS1hcGkpLCBNYXNzaW1vIENhbmRlbGEgKHdlYiB0b29sKSwgQW5kcmVhcyBTdHJpa29zIChkZXBsb3ltZW50KSAtIFJJUEUgTkND"));
            }

        };

    };


    return TemplateManagerView;
});