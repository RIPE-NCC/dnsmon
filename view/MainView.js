/**
 * Copyright (c) 2013 RIPE NCC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


define([
    "dnsmon.env.utils",
    "dnsmon.lib.jquery-libs-amd",
    "dnsmon.lib.d3",
    "dnsmon.view.template-manager",
    "dnsmon.view.time-overview",
    "dnsmon.view.svg.container",
    "dnsmon.view.pop-up",
    "dnsmon.view.breadcrumbs",
    "dnsmon.view.control-panel",
    "dnsmon.controller.time",
    "dnsmon.view.svg.time-axis",
    "dnsmon.view.svg.ordinal-axis",
    "dnsmon.env.params-manager"
], function(utils, $, d3, TemplateManagerView, TimeOverviewView,
            SvgContainerView, PopUpView, BreadcrumbsView,
            ControlPanelView, TimeController, SvgTimeAxisView, SvgOrdinalAxisView, paramsManager){

    /**
     * MainView is a mandatory view component in charge of initialising and coordinating the whole
     * representation layer
     *
     * @class MainView
     * @constructor
     * @module view
     */

    var MainView = function(env){
        var representedTimeWindowInSeconds, loadingImageDom, config, $this, oldStartDate, oldEndDate, d3Cells;

        config = env.config;
        $this = this;


        /**
         * This method initializes the representation layer
         *
         * @method init
         * @input {Object} mainDom A dom element where to place the widget
         * @input {Object} instanceParam A vector of parameter to initialise the widget
         */

        this.init = function(mainDom, instanceParam){
            /*
             * Create the dom elements needed
             */
            this.templateManager = new TemplateManagerView(env);
            this.templateManager.createDom(mainDom, instanceParam);
            this.defaultDimensions = {width: instanceParam.width, height: instanceParam.height};

            env.container = new SvgContainerView(
                this.templateManager.dom.svgContainer,
                {
                    left: config.labelWidth,
                    right: config.chartMargins.right,
                    top: config.chartMargins.top,
                    bottom: config.chartMargins.bottom
                }, {
                    trackerPadding: config.trackerPadding,
                    animationDuration: config.zoomAnimationDuration,
                    maxHeight: env.maxHeight - config.style.controlPanelHeight - config.style.timeOverviewHeight - config.style.breadCrumbsHeight - (config.style.containerMargin * 2),
                    minHeight: env.minHeight - config.style.controlPanelHeight - config.style.timeOverviewHeight - config.style.breadCrumbsHeight - (config.style.containerMargin * 2)
                });

            /*
             * Instantiate all components
             */
            this.timeController = new TimeController(env);
            this.popUp = new PopUpView(env);
            this.controlPanel = new ControlPanelView(env);
            this.breadcrumbs = new BreadcrumbsView(env);

            this.timeOverview = new TimeOverviewView(
                {
                    margins: config.timeOverviewMargins,
                    verticalLabels: true,
                    hideIfLessThanSeconds: config.hideTimeOverviewWhenLessThanSeconds,
                    granularityLevels: config.brusherBucketLevelsMinutes,
                    width: env.container.chart.width() + config.timeOverviewMargins.left,
                    height: config.style.timeOverviewHeight
                },

                {
                    end: function(startDate, endDate, points){
                        env.params.startDate = startDate;
                        env.params.endDate = endDate;

                        if (env.isUpdatedPeriodicallyActive){ // Disable the auto refresh function if active
                            $this.controlPanel.keepUpdatedActive(false);
                        }

                        env.mainView.updateXDomain(true);
                        env.container.chart.updateBoundaries(points);
                    },

                    interaction: function(startDate, endDate, points){
                        env.params.startDate = startDate;
                        env.params.endDate = endDate;
                        env.mainView.updateXDomain(false);
                        env.container.chart.updateBoundaries(points);
                    },

                    change: function(startDate, endDate, points){
                        env.container.chart.updateBoundaries(points);
                    },

                    init: function(startDate, endDate, points){
                        env.container.chart.updateBoundaries(points);
                    }

                });

            /*
             * Push elements in the update list
             */
            env.container.updateList.push({
                update: function(){
                    var newWidth;

                    newWidth = env.container.chart.width();

                    this.templateManager.dom.timeOverviewContainer.$.width(newWidth + config.timeOverviewMargins.left);
                    this.timeOverview.width(newWidth + config.timeOverviewMargins.left);
                },
                context: this});

            env.container.updateList.push({
                update: this.controlPanel.updateWidth,
                context: this.controlPanel
            });


            /*
             * Mouse tracking globally visible (to optimize)
             */
            env.mouse = {};
            env.mainDom.$.on("mousemove", function(evt){
                var offset = $(this).offset();
                env.mouse = {x: evt.pageX - offset.left, y: evt.pageY - offset.top};
            });

            this.loadingImage(true);
            env.connector.retrieveData(this.firstDraw, this); // Get the data and start the visualization
        };


        /**
         * This method computes the best height, related to the number of rows, for the chart
         *
         * @method _computeWidgetBestHeight
         * @private
         * @return {Number} The height
         */

        this._computeWidgetBestHeight = function(){
            var height;

            height = (this.defaultDimensions.height - config.style.timeOverviewHeight - config.style.controlPanelHeight - config.style.breadCrumbsHeight - (config.style.containerMargin * 2) ) || env.container.chart.computeBestHeight(this.rows.length);
            return height;
        };


        /**
         * This method draws the chart
         *
         * @method firstDraw
         * @input {Object} A data-set
         */

        this.firstDraw = function(data){

            utils.log("Visualization starts", env.debugMode);
            this.rows = data.rows;

            /*
             * Set dimensions of the elements based on data
             */
            env.container.height(this._computeWidgetBestHeight());

            this._initAxis(data);
            this._render(data);
            this.timeController.init();
            this.timeOverview.init(this.templateManager.dom.timeOverviewContainer.plain, [env.measurementStartTime, env.measurementEndTime], [env.params.startDate, env.params.endDate]);
            this.controlPanel.render(env.mainDom);
            this.breadcrumbs.init();

            this.timeController.updateStatus();
            this.controlPanel.update();

            this.setTimeMargins(data.startDate, data.endDate);

            utils.callCallbacks(env.callbacks["load"], paramsManager.fromInternalToExternal(env.params));

            this.loadingImage(false);

            if (env.params.type == "probes"){
                this.breadcrumbs.enrichLabel(data.group.id, data.group.label, "probes");
                this.breadcrumbs.enrichLabel(data.root.id, data.root.label, "servers");
            } else if (env.params.type == "servers"){
                this.breadcrumbs.enrichLabel(data.group.id, data.group.label, "servers");
            }



            utils.log("Visualization ends", env.debugMode);
        };


        /**
         * This method computes and applies the actual color scale
         *
         * @method updateColorScales
         */

        this.updateColorScales = function(){
            var rangeInSession, showFilter, internalColorScale, initialRange, sessionKey;

            showFilter = env.showFilter;
            sessionKey = "color_range_" + showFilter;

            if (!this.normalColorScales){
                this.normalColorScales = config.normalColorScales;
                this.selectionColorScales = config.selectionColorScales;
            }

            this.colorDomainAndRange = utils.computeColorScale(this.normalColorScales[showFilter]);
            this.selectionColorDomainAndRange = utils.computeColorScale(this.selectionColorScales[showFilter]);

            // Set the actual range from the embedding code
            if (env.colorRanges && env.colorRanges[showFilter] && env.colorRanges[showFilter].length == 2){
                this.colorDomainAndRange.valueRange[1] = env.colorRanges[showFilter][0];
                this.colorDomainAndRange.valueRange[2] = env.colorRanges[showFilter][0];
                this.colorDomainAndRange.valueRange[3] = env.colorRanges[showFilter][1];

                initialRange = utils.join(this.colorDomainAndRange.valueRange, "-");
                env.session.setInitialisationValues(sessionKey, initialRange);
            }

            // Get the actual range from the session
            rangeInSession = env.session.getValue(sessionKey);

            // Apply the range in session
            if (rangeInSession){
                rangeInSession = $.map(rangeInSession.split("-"), parseFloat);
                this._applyRange(rangeInSession);
            }else{
                // Save the current range
                env.session.saveValue(sessionKey,  utils.join(this.colorDomainAndRange.valueRange, "-"));

            }

            internalColorScale = this._addOffsetToColorScale(this.colorDomainAndRange.valueRange);

            this.color = d3.scale.linear().domain(internalColorScale).range(this.colorDomainAndRange.colorRange);
            this.selectionColor = d3.scale.linear().domain(internalColorScale).range(this.selectionColorDomainAndRange.colorRange);

            //Compute the breakpoints
            this.colorDomainBreakPoints = [this.colorDomainAndRange.valueRange[2], this.colorDomainAndRange.valueRange[3]];
        };


        /**
         * This method introduces some offsets in the ranges in order to preserve the consistency with the legend
         *
         * @method _addOffsetToColorScale
         * @private
         * @input {Array} colorScale A color scale expressed as an array of values
         */

        this._addOffsetToColorScale = function(colorScale){
            return [ colorScale[0], colorScale[1], colorScale[2] + config.colorSeparationOffset, colorScale[3], colorScale[4] ];
        };


        /**
         * This method applies a new range to the color scales
         *
         * @method _applyRange
         * @private
         * @input {Array} newValuesRange A color range expressed as an array of values
         */

        this._applyRange = function(newValuesRange){
            // Update the normal color range fot this visualization type
            this.colorDomainAndRange.valueRange = newValuesRange;

            // Update the selection color range fot this visualization type
            this.selectionColorDomainAndRange.valueRange = newValuesRange;
        };


        /**
         * This method changes the color of the cells without executing a complete redraw
         *
         * @method updateOnlyColors
         * @input {Array} newValuesRange A color range expressed as an array of values
         */

        this.updateOnlyColors = function(newValuesRange){
            var $this, showFilter, internalRange;

            $this = this;

            showFilter = env.showFilter;

            this._applyRange(newValuesRange);

            internalRange = this._addOffsetToColorScale(this.colorDomainAndRange.valueRange);

            // Compute the new color scales
            this.color = d3.scale.linear().domain(internalRange).range(this.colorDomainAndRange.colorRange);
            this.selectionColor = d3.scale.linear().domain(internalRange).range(this.selectionColorDomainAndRange.colorRange);

            // Save the current range
            env.session.saveValue("color_range_" + showFilter,  utils.join(this.colorDomainAndRange.valueRange, "-"));

            this.colorDomainBreakPoints = [this.colorDomainAndRange.valueRange[2], this.colorDomainAndRange.valueRange[3]];


            d3Cells.style("fill", $this.getCellColor);
        };


        /**
         * This method initialises the svg axis of the chart
         *
         * @method _initAxis
         * @private
         * @input {Object} data A data-set
         */

        this._initAxis = function(data){
            var $this, yRowsToDomainAndMagnets;

            $this = this;
            yRowsToDomainAndMagnets = this.rowsCharacterization(this.rows);

            this.xDomain = function(){
                return [env.params.startDate, env.params.endDate];
            };

            this.xRange = function(){
                return [0, env.container.chart.width()];
            };


            this.yDomain = function(){
                return yRowsToDomainAndMagnets.domain;
            };

            this.yRange = function(){
                return [0, env.container.chart.height()];
            };

            this.updateColorScales();

            this.xAxis = new SvgTimeAxisView(env.container, {domain: this.xDomain, range: this.xRange, orient: "bottom", offset: config.xSeparationOffset});
            this.yAxis = new SvgOrdinalAxisView(env.container,
                {
                    domain: this.yDomain,
                    range: this.yRange,
                    orient: "left",
                    offset: config.ySeparationOffset,
                    magnetValues: yRowsToDomainAndMagnets.magnets,
                    descriptions: yRowsToDomainAndMagnets.descriptions,
                    groups: yRowsToDomainAndMagnets.groups,
                    displayGroupBlocks: env.grouping
                });

            this.yAxis.onMouseOver(function(evt){
                $this.selectRow(true, $(this).attr("magnet"));
            });

            this.yAxis.onMouseOut(function(evt){
                $this.selectRow(false, $(this).attr("magnet"));
            });

        };


        /**
         * This method allows to register listeners
         *
         * @method on
         * @input {String} eventType An event type
         * @input {Function} callback A callback
         */

        this.on = function(eventType, callback){
            env.callbacks[eventType].push(callback);
        };


        /**
         * This method redraws completely the chart
         *
         * @method redraw
         * @input {Function} callback A callback triggered after the redraw
         * @input {Object} context The context of the callback
         */

        this.redraw = function(callback, context){
            var context = context || this;

            this.updateColorScales();
            this.loadingImage(true);

            this.selectColumn(false);
            this.selectRow(false);

            env.connector.retrieveData(function(data){
                this.update(data);

                this.loadingImage(false);

                if (callback != null){
                    callback.call(context, data);
                }
            }, this);
        };


        /**
         * This method selects a column of the chart
         *
         * @method selectColumn
         * @input {Boolean} selected True if selected
         * @input {Number} position The x position of the selection
         * @input {Number} width The width of the selection
         */

        this.selectColumn = function(selected, position, width){
            var verticalSelectorPadding, halfVerticalSelectorPadding;

            clearTimeout(this._selectColumnTimer);

            this._selectColumnTimer = setTimeout(function(){

                if (selected && env.timeEventsActive){

                    verticalSelectorPadding = config.style.verticalSelectorPadding;
                    halfVerticalSelectorPadding = verticalSelectorPadding / 2;
                    width += verticalSelectorPadding;

                    if (env.retrievedAggregationLevel == 0){ // Center the vertical selector for the native resolution
                        position += (width / 2); // Center it on an half of the cell
                        width = 1;
                    }

                    env.container.chart.chartSelectorVertical
                        .attr("transform", "translate(" + (position - halfVerticalSelectorPadding) + ", " + 0 + ")")
                        .style("stroke-width", ((width == 1) ? "1px" : config.style.selectorRectStokeWidth))
                        .style("display", "block")
                        .attr("width", width);
                }else{
                    env.container.svg
                        .select("." + config.domClasses.chartSelectorVertical)
                        .style("display", "none");
                }

            }, ((selected) ? config.selectRowColumnTimer : 0));

        };


        /**
         * This method selects a row of the chart starting from a label
         *
         * @method _selectLabel
         * @private
         * @input {Boolean} selected True if selected
         * @input {String} rowId The ID of a row
         */

        this._selectLabel = function(selected, rowId){
            var $this = this;

            if (env.timeEventsActive){
                if ($this._previousSelectedYLabel){
                    $this._previousSelectedYLabel
                        .css("font-size", config.style.axisLabelsFontSizeDefault)
                        .css("font-weight", "normal");
                }

                if (selected){
                    env.mainDom.$.find('text').each(function(){
                        var label = $(this);
                        if ((label.attr("magnet") == rowId)){

                            label
                                .css("font-size", config.style.axisLabelsFontSizeSelected)
                                .css("font-weight", "bold");

                            $this._previousSelectedYLabel = label;
                        }
                    });
                }
            }
        };


        /**
         * This method selects a row of the chart
         *
         * @method selectRow
         * @input {Boolean} selected True if selected
         * @input {String} rowId The ID of a row
         */

        this.selectRow = function(selected, rowId){
            var $this, chartSvg;

            $this = this;
            clearTimeout(this._selectRowTimer);

            this._selectRowTimer = setTimeout(function(){
                $this._selectLabel(selected, rowId);

                chartSvg = env.container.chart.svg;

                if (selected  && env.timeEventsActive){

                    if (!env.lowProfile){

                        chartSvg
                            .selectAll(".cell")
                            .each(function(){
                                var cell, cellClasses;
                                cell = d3.select(this);
                                cellClasses = cell.attr("class").split(" ");

                                if (cellClasses[2] != "origin" + rowId){

                                    cell
                                        .transition()
                                        .duration(((selected) ? config.hoverTransitionDuration : 0))
                                        .style({
                                            "opacity": config.cellUnselectedOpacity
                                        });

                                }else{

                                    cell
                                        .style({
                                            "opacity": 1,
                                            "stroke": "#616161",
                                            "stroke-width": "1px"
                                        });

                                }

                            });

                    } else {

                        if ($this._previusoSelectedRowCells){
                            $this._previusoSelectedRowCells
                                .style("stroke-width", "0px");
                        }

                        $this._previusoSelectedRowCells = chartSvg
                            .selectAll(".origin" + rowId)
                            .style("stroke", "#616161")
                            .style("stroke-width", "1px");
                    }

                }else{

                    if (!env.lowProfile){
                        chartSvg
                            .selectAll(".cell")
                            .style("opacity", "1")
                            .style("stroke-width", "0px");
                    }else{
                        if ($this._previusoSelectedRowCells){
                            $this._previusoSelectedRowCells
                                .style("stroke-width", "0px");
                        }
                    }

                    delete $this._previusoSelectedRowCells;
                }
            }, (selected) ? config.selectRowColumnTimer : 0);

        };


        /**
         * This method returns the values of the selected cell related to the current type of visualisation
         *
         * @method getCellValue
         * @input {Object} cellData The d3 cell data object
         * @return {String} The value
         */

        this.getCellValue = function(cellData){
            var value, showFilter, excludeErrors;

            showFilter = env.showFilter;
            excludeErrors = (env.session.getValue('exclude-errors') == 'true'); // ...SessionManager manages only strings

            switch(showFilter){
                case 'pls':
                    value = ((excludeErrors) ? cellData.getNumberCorrectResponses() : cellData.getPacketLoss());
                    break;

                case 'rtt':
                    value = cellData.getResponseTime();
                    break;

                case 'relative-rtt':
                    value = cellData.getRelativeResponseTime();
                    break;
            }

            return value;
        };


        /**
         * This method shows or hides the throbber image
         *
         * @method loadingImage
         * @input {Boolean} isVisible True if visible
         */

        this.loadingImage = function(isVisible){
            var moveLoadingImage, mouseCoords;

            loadingImageDom = this.templateManager.dom.loadingImage.$;
            mouseCoords = env.mouse;
            moveLoadingImage = this._moveLoadingImage;

            if (isVisible){
                loadingImageDom
                    .css({
                        "left": mouseCoords.x,
                        "top": mouseCoords.y
                    })
                    .show();
                env.document.$.on("mousemove", moveLoadingImage);
            }else{
                loadingImageDom.hide();
                env.document.$.off("mousemove", moveLoadingImage);
            }
        };


        /**
         * This method moves the throbber image in order to follow the cursor
         *
         * @method _moveLoadingImage
         * @private
         * @input {Object} evt A JavaScript event
         */

        this._moveLoadingImage = function(evt){
            var mouseCoords;

            mouseCoords = env.mouse;

            loadingImageDom
                .css({
                    "left": mouseCoords.x,
                    "top": mouseCoords.y
                });
        };


        /**
         * This method updates the time domain
         *
         * @method updateXDomain
         * @input {Object} pullData If true a new data-set will be requested
         */

        this.updateXDomain = function(pullData){
            var chart, elementIndex, shakeIterations, shakeDuration, shakeTransform, shakingElementsReduction;

            chart = env.container.chart;

            if (env.params.startDate < env.measurementStartTime || env.params.endDate > env.measurementEndTime){ // Check the boundaries
                return false;
            }

            this.xAxis.setDomain(function(){
                return [env.params.startDate, env.params.endDate];
            });

            this.timeOverview.updateSelection([env.params.startDate, env.params.endDate]);

            if (!chart.hidden){
                if (env.lowProfile == true || !config.shakeActive) {
                    chart.dom.$.fadeTo(config.redrawFadeOut, 0.4);
                    chart.hidden = true;
                }else{

                    shakeTransform = function(d){
                        var x, y;

                        x = d.optional.xPosition + Math.floor(Math.random() * config.shakeTuner);
                        y = d.optional.yPosition + Math.floor(Math.random() * config.shakeTuner);

                        return "translate(" + x + "," + y + ")";
                    };

                    elementIndex = 0;
                    shakeIterations = 5;
                    shakingElementsReduction = (d3Cells.length < 40) ? 1 : 4;
                    shakeDuration = config.shakeDuration/shakeIterations;

                    d3Cells
                        .each(function(d){
                            var that = this;
                            if (elementIndex % shakingElementsReduction == 0){
                                for (var n=5; n>0; n--){
                                    setTimeout(
                                        function(){
                                            d3.select(that)
                                                .attr("transform", shakeTransform);
                                        },
                                        shakeDuration * n
                                    );
                                }
                            }
                            elementIndex++;
                        });

                }
            }

            if (pullData){
                this.redraw();
            }
        };


        /**
         * This support method lists all the steps for a complete redraw
         *
         * @method _render
         * @private
         * @input {Object} data A data-set
         */

        this._render = function(data){
            this.xAxis.render();
            this.yAxis.render();
            this._setLowProfile(data);
            this._renderCells(data);

            env.history.init();
        };


        /**
         * This support method draws all the cell
         *
         * @method _renderCells
         * @private
         * @input {Object} data A data-set
         */

        this._renderCells = function(data){
            var cellsTransform, cellWidth, cellHeight, rect, $this, cellClass, transformSet, orderingFunction, pxToSec,
                cellTranslateLeft, cellsSVG;

            $this = this;

            cellTranslateLeft = (env.retrievedAggregationLevel == 0) ? (config.cellsMinWidth / 2) : 0;

            representedTimeWindowInSeconds = env.timeWindowSeconds;

            orderingFunction = function(d){
                return d.row.id + "-" + d.group + "-" + d.time;
            };

            cellsTransform = function(d) {
                d.selected = false;
                d.optional.xPosition = $this.xAxis.scale(d.time) - cellTranslateLeft;
                d.optional.xPosition = (d.optional.xPosition < 0) ? 0 : d.optional.xPosition; // OPTIMISATION: don't call Math.max
                d.optional.yPosition = $this.yAxis.scale(d.row.label);
                return "translate(" + d.optional.xPosition + "," + d.optional.yPosition + ")";
            };

            cellClass = function(d){
                return 'cell time_' + d.time.getTime() + ' origin' + d.row.id;
            };

            pxToSec = (env.container.chart.width() / env.timeWindowSeconds);

            cellsSVG = env.container.chart.svg.selectAll("rect.cell");

            cellWidth = function(cellData){
                var cellWidth;

                if (cellData.endTime){
                    cellWidth = (pxToSec * ((cellData.endTime - cellData.time)/1000)) - config.xCellsMargin;
                }else{
                    cellWidth = (pxToSec * (env.samplingFrequency/100) * config.nativeCellWidthFrequencyPercentage) - config.xCellsMargin;
                }

                if (cellWidth < config.cellsMinWidth){
                    cellWidth = config.cellsMinWidth;
                }
                return cellWidth;
            };


            cellHeight = function(d){

                if (window.dynamicHeight == true && d.getPacketLoss() > 66 && d.getPacketLoss() < 99){
                    var height = $this.yAxis.scale.rangeBand() * config.yCellsMargin;
                    return Math.min(d.respondingTime, height);
                }
                return $this.yAxis.scale.rangeBand() - ($this.yAxis.scale.rangeBand() * config.yCellsMargin);
            };


            this.cellWidth = cellWidth;

            d3Cells = cellsSVG
                .data(data.cells, orderingFunction);

            d3Cells
                .exit()
                .on('click', null)
                .on('mousemove', null)
                .on('mouseenter', null)
                .on('mouseout', null)
                .remove();

            d3Cells
                .enter()
                .append("rect")
                .attr("class", cellClass)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("y", 0)
                .style("fill", $this.getCellColor)
                .style("cursor", config.style.selectionCursor)
                .on("mousemove", function(d){

                    if ($this._mouseEntered != true){ // To improve performance

                        /*
                         * The block under (repetition of the mousenter) tries to avoid bugs in some browser that sometimes skip the mouseenter event
                         */
                        var xPosition, columnWidth;

                        columnWidth = parseFloat(d3.select(this).attr("width"));
                        xPosition = d.optional.xPosition;

                        $this.selectRow(true, d.row.id);
                        $this.selectColumn(true, xPosition, columnWidth);
                        $this._mouseEntered = true;

                    }else{

                        if (env.timeEventsActive){
                            var mouseCursor, mouseCursorFormatted;
                            mouseCursor = d3.mouse(env.container.dom.plain);
                            mouseCursorFormatted = {x: mouseCursor[0], y: mouseCursor[1]};
                            $this.popUp.show(d, mouseCursorFormatted);
                        }
                    }
                })
                .on("mouseenter", function(d){

                    if (env.timeEventsActive){
                        var xPosition, columnWidth;

                        columnWidth = parseFloat(d3.select(this).attr("width"));
                        xPosition = d.optional.xPosition;

                        $this.popUp.hide();
                        $this.selectRow(true, d.row.id);
                        $this.selectColumn(true, xPosition, columnWidth);
                        $this._mouseEntered = true;
                    }

                })
                .on("mouseout", function(d){

                    if (env.timeEventsActive){
                        $this.popUp.hide();

                        $this.selectRow(false, d.row.id);
                        $this.selectColumn(false);

                        $this._mouseEntered = false;
                    }
                });


            if (this.drawn && env.lowProfile == false && this.previosNumberOfCells > d3Cells[0].length){
                transformSet = d3Cells
                    .transition()
                    .duration(config.zoomAnimationDuration)
                    .attr("width", cellWidth)
                    .attr("height", cellHeight)
                    .attr("transform", cellsTransform)
                    .style("stroke-width", "0px")
                    .delay(config.zoomAnimationDelay)
                    .style("fill", $this.getCellColor);
            }else{
                d3Cells
                    .attr("width", cellWidth)
                    .attr("height", cellHeight)
                    .attr("transform", cellsTransform)
                    .style("stroke-width", "0px")
                    .style("fill", $this.getCellColor);
            }

            this.previosNumberOfCells = d3Cells[0].length;

            this.drawn = true;

            utils.log("Number of cell displayed: " + data.cells.length, env.debugMode);

//            delete this.d3Cells;
        };


        /**
         * This method computes the color of a given cell
         *
         * @method getCellColor
         * @input {Object} cell A cell object
         */

        this.getCellColor = function(cell){
            var value, color;

            value = $this.getCellValue(cell);

            if (value != null){
                color = $this.color(value);
            }else{
                color = config.style.noRttAvailableColor;
            }

            return color;
        };


        /**
         * This method computes the color of a given cell when it is selected
         *
         * @method getSelectedCellColor
         * @input {Object} cell A cell object
         */

        this.getSelectedCellColor = function(cell){
            var value, color;

            value = $this.getCellValue(cell);

            if (value != null){
                color = $this.selectionColor(value);
            }else{
                color = config.style.noRttAvailableSelectionColor;
            }

            return color;
        };


        /**
         * This method updates the chart applying the new data-set
         *
         * @method update
         * @input {Object} data A data-set
         */

        this.update = function(data){
            utils.log("Visualization update starts", env.debugMode);
            var yRowsToDomainAndMagnets;

            this.rows = data.rows;

            env.timeEventsActive = true;

            this.timeController.updateStatus();
            this.controlPanel.update();
            env.history.update();

            env.container.height(this._computeWidgetBestHeight());

            this.setTimeMargins(data.startDate, data.endDate);

            yRowsToDomainAndMagnets = this.rowsCharacterization(this.rows);

            this.xAxis.setDomain(function(){
                return [env.params.startDate, env.params.endDate];
            });

            this.yAxis.setDomain(
                function(){
                    return yRowsToDomainAndMagnets.domain;
                },
                yRowsToDomainAndMagnets.magnets,
                yRowsToDomainAndMagnets.descriptions,
                yRowsToDomainAndMagnets.groups
            );

            this._setLowProfile(data);
            this._renderCells(data);

            if (env.container.chart.hidden == true){
                env.container.chart.dom.$.fadeTo(config.redrawFadeIn, 1);
                env.container.chart.hidden = false;
            }

            this.timeOverview.update([env.measurementStartTime, env.measurementEndTime], [env.params.startDate, env.params.endDate]);

            utils.callCallbacks(env.callbacks["change"], paramsManager.fromInternalToExternal(env.params)); // Call all the "change" callbacks

            utils.log("Visualization update ends", env.debugMode);
        };


        /**
         * This method sets the right profile mode related to the data-set dimension
         *
         * @method _setLowProfile
         * @private
         * @input {Object} data A data-set
         */

        this._setLowProfile = function(data){
            var lowProfileLimitations;
            lowProfileLimitations = config.lowProfileLimitations;

            env.lowProfile = (config.forceLowProfile) || (lowProfileLimitations.numerOfCells < data.cells.length);
        };


        /**
         * This method computes all the information of the y-axis items
         *
         * @method rowsCharacterization
         * @input {Object} data A data-set of rows
         * @return {Object} A map of characterizations (i.e. domain, magnets, descriptions, groups)
         */

        this.rowsCharacterization = function(list){
            var domain, magnets, domainElement, idParsed, descriptions, groups;
            domain = [];
            magnets = {};
            descriptions = {};
            groups = {};

            list = list.sort(function(a, b) {

                if (a.group != ""){
                    a = a.group + "-" + a.internalOrder;
                    b = b.group + "-" + b.internalOrder;
                }else{
                    a = parseInt(a.id);
                    b = parseInt(b.id);
                }
                return a < b ? -1 : a > b ? 1 : 0;
            });


            for (var n=0,length=list.length; n<length; n++){
                domainElement = list[n];
                if (domainElement.label){
                    domain.push(domainElement.label);
                    idParsed = domainElement.label.replace(" ", "_");
                    magnets[idParsed] = domainElement.id;
                    descriptions[idParsed] = domainElement.description;
                    groups[idParsed] = domainElement.group;
                }
            }
            return {
                domain: domain,
                magnets: magnets,
                descriptions: descriptions,
                groups: groups
            };
        };


        /**
         * This method shows a textual message to the user
         *
         * @method showMessage
         * @input {String} text The message
         */

        this.showMessage = function(text){
            if (text == ''){
                this.templateManager.dom.message.$.hide();
            }else{
                this.templateManager.dom.message.$.html(text).show().fadeOut(config.messagesFadeOutSeconds);
            }
        };


        /**
         * This method applies new margins to the current time window
         *
         * @method setTimeMargins
         * @input {Date} start The start date
         * @input {Date} end The end date
         */

        this.setTimeMargins = function(start, end){
            var timeMarginsContainer, timeMargins, startDateDiv, endDateDiv;

            timeMarginsContainer = this.templateManager.dom.timeMargins.$;
            timeMargins = timeMarginsContainer.children();

            startDateDiv = timeMargins.first();
            endDateDiv = timeMargins.last();

            if (oldStartDate != start) {

                startDateDiv.html(env.lang.fromTimeRange + ' ' + utils.dateToStringShort(start));
                startDateDiv.toggleClass("updated");
                setTimeout(function () {startDateDiv.toggleClass("updated");}, config.aggregationLegendUpdatedDuration);

            }
            if (oldEndDate != end){

                if (!env.isUpdatedPeriodicallyActive){
                    endDateDiv.html(env.lang.toTimeRange + ' ' + utils.dateToStringShort(end) + " UTC");
                }else{
                    endDateDiv.html(env.lang.lastUpdateAt + ' ' + utils.dateToStringShort(env.lastUpdate) + " UTC");
                }
                endDateDiv.toggleClass("updated");
                setTimeout(function(){endDateDiv.toggleClass("updated");}, config.aggregationLegendUpdatedDuration);

            }

            oldStartDate = start;
            oldEndDate = end;
        };

    };

    return MainView;
});