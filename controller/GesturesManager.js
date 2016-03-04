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
    "dnsmon.lib.d3"
], function(utils, $, d3){

    /**
     * GesturesManager provides all the features handling user gestures/interactions.
     *
     * @class GesturesManager
     * @constructor
     * @module controller
     */

    var GesturesManager =  function(env){
        var $this, config, mouseWheelSensibility, eventsAttachedOn;

        $this = this;
        config = env.config;
        mouseWheelSensibility = config.mouseWheelSensibility;

        this.alreadyInit = false;
        this.eventsList = {};
        this.eventsList.scrollDown = [];
        this.eventsList.scrollUp = [];
        this.eventsList.scrollLeft = [];
        this.eventsList.scrollRight = [];

        env.timeEventsActive = true;


        /**
         * Attach a callback to a gesture
         *
         * @method on
         * @param {String} evt An event id
         * @param {Function} callback A callback
         * @param {Object} context The context of the callback
         */

        this.on = function(evt, func, context){

            if (!this.alreadyInit) {
                this._init();
                this.alreadyInit = true;
            }

            this.eventsList[evt].push({
                bindedFunction: func,
                context: context
            });

        };


        /**
         * Initialise all the events related to the mouse wheel
         *
         * @method _initMouseWheel
         * @private
         */

        this._initMouseWheel = function(){
            env.container.chart.dom.$.on('DOMMouseScroll mousewheel', function (evt) {
                var list, element, newYDomain, wheelDelta, characherization;

                evt.preventDefault();

                if (mouseWheelSensibility != 0){
                    mouseWheelSensibility--;
                    return false;
                }else{
                    mouseWheelSensibility = config.mouseWheelSensibility;
                }

                list = [];

                if (env.timeEventsActive ==  true){

                    if (env.isUpdatedPeriodicallyActive){ // Disable the auto refresh function if active
                        env.mainView.controlPanel.keepUpdatedActive(false);
                    }

                    wheelDelta = evt.originalEvent.detail || -(evt.originalEvent.wheelDelta/120);

                    if (wheelDelta < 0) { //alternative options for wheelData: wheelDeltaX & wheelDeltaY

                        list = $this.eventsList.scrollDown;

                    }else{

                        if (config.allRowsZoomingOut && $this.rowsSubSelection){ // It is possible to get all the rows before to zoom out, check config.allRowsZoomingOut

                            $this.rowsSubSelection = false;
                            env.timeEventsActive = false;
                            env.params.selectedRows = [];
                            characherization = env.mainView.rowsCharacterization(env.mainView.rows);
                            newYDomain = characherization.domain;
                            env.mainView.yAxis.setDomain(function(){return newYDomain;});
                            env.mainView.redraw();

                        }else{
                            list = $this.eventsList.scrollUp;
                        }

                    }

                    for (var n=0,length=list.length; n<length; n++){
                        element = list[n];
                        element.bindedFunction.call(element.context, wheelDelta);
                    }

                }
                return false;
            });

        };


        /**
         * Initialise all the events related to the keyboard
         *
         * @method _initKeyEvents
         * @private
         */

        this._initKeyEvents = function(){
            eventsAttachedOn.$.keydown(function(evt){
                var list, element, key;

                if (env.timeEventsActive ==  true){
                    key = (evt.which) ? evt.which : evt.keyCode;
                    switch(key){
                        case 37: //Left
                            list = $this.eventsList.scrollLeft;
                            break;

                        case 39: //Right
                            list = $this.eventsList.scrollRight;
                            break;
                    }

                    if (list){
                        evt.preventDefault();

                        for (var n=0,length=list.length; n<length; n++){
                            element = list[n];
                            element.bindedFunction.call(element.context);
                        }
                    }
                }

            });
        };


        /**
         * Initialise all the events
         *
         * @method _init
         * @private
         */

        this._init = function(){
            eventsAttachedOn = env.document;
            env.timeEventsActive = true;

            if (env.activeMouseZoom) {
                this._initMouseWheel();
            }

            if(env.activeKeys){
                this._initKeyEvents();
            }

            if (env.activeGestures){
                this._initializeSelectionTool();
            }

            this._initializeActiveLabels();
            this._initializeRemoveRowsFunction();
        };


        /**
         * Initialise the function to remove rows
         *
         * @method _initializeRemoveRowsFunction
         * @private
         */

        this._initializeRemoveRowsFunction = function(){

            eventsAttachedOn.$.on("keydown", function(evt){
                var key;

                key = (evt.which) ? evt.which : evt.keyCode;
                if (evt.shiftKey || key == 16) { // Shift
                    env.rowRemotionOngoing = true;
                    env.mainView.showMessage(env.lang.clickToRemoveRow);
                    d3.selectAll(".y text").attr("class", "removable");
                }
            });

            eventsAttachedOn.$.on("keyup", function(evt){
                if (env.rowRemotionOngoing){ // Shift
                    env.rowRemotionOngoing = false;
                    d3.selectAll(".y text").attr("class", null);
                }
            });
        };


        /**
         * This method removes a row from the scene.
         *
         * @method _removeRowFromSelection
         * @private
         * @input {Object} rowSelection The selected row in a jQuery format
         */

        this._removeRowFromSelection = function(rowSelection){
            var rowMagnet;

            rowMagnet = rowSelection.attr("magnet");

            if (env.params.selectedRows.length == 0){
                env.params.selectedRows = $.map(env.connector.getRows(), function(item){ return item.id; }); // Get all rows
            }

            env.params.filterProbes = true;
            env.params.selectedRows = utils.removeSubArray(env.params.selectedRows, [rowMagnet]);
            env.mainView.redraw();
        };


        /**
         * This method executes the default click behaviour of a label on the y-axis.
         *
         * @method _executeRowAction
         * @private
         * @input {Object} rowSelection The selected row in a jQuery format
         */

        this._executeRowAction = function(rowSelection){
            var queryType, triggerAction, rowMagnet, rowObject;

            triggerAction = false;
            queryType = env.params.type;
            rowMagnet = rowSelection.attr("magnet");
            rowObject = env.connector.getRowById(rowMagnet);

            switch (queryType) {

                case "probes":
                    //if (!env.params.isUdm) {
                        window.open(env.connector.getProbesPageUrl(rowMagnet, env.params), "_blank");
                    //}
                    break;

                case "servers":
                    if (rowObject.cells.length > 0) {
                        env.params.type = "probes";
                        env.params.root = env.params.group;
                        env.params.group = rowMagnet;
                        env.params.filterProbes = false;
                        env.params.selectedRows = [];
                        triggerAction = true;
                    } else {
                        env.mainView.showMessage(env.lang.noDataForRow);
                    }
                    break;
            }

            if (triggerAction == true) {
                env.mainView.breadcrumbs.addLevel(rowSelection.text());
                env.mainView.redraw();
            }

        };


        /**
         * Initialise labels on the y-axis
         *
         * @method _initializeActiveLabels
         * @private
         */

        this._initializeActiveLabels = function(){
            env.mainView.yAxis.onClick(function(evt){
                var selectedRow;

                selectedRow = $(this);

                if (!env.rowRemotionOngoing) {

                    $this._executeRowAction(selectedRow);

                }else{

                    $this._removeRowFromSelection(selectedRow);

                }
            });
        };




        /**
         * Initialise the selection tool
         *
         * @method _initializeSelectionTool
         * @private
         */

        this._initializeSelectionTool = function(){
            var svg, body, selectionRect, endCoords, trackerDomElement, container, params, chart, selectedCells,
                removeSelectionWithFeedback, coords, startCoords, currentElement, coordsMousemove, finalStartCoords,
                finalEndCoords, removeRect, startSelection, stopSelection,
                getNormalCellColor, getSelectedCellColor, updateSelectionTimes, selectedRectsBoundingBox,
                updateSelectionNormal, updateSelectionLowProfile, dragStarted, selectionTooltipStart, selectionTooltipStop;

            container = env.container;
            params = env.params;
            chart = container.chart;
            svg = chart.svg;
            body = d3.select("body");


            trackerDomElement = svg;

            selectedRectsBoundingBox = {min: {x: Infinity, y: Infinity}, max: {x: -1, y: -1}}; //Reset the selection boundaries

            trackerDomElement.style("cursor", config.style.selectionCursor);


            // This function removes the selection providing a feedback for the user
            removeSelectionWithFeedback = function(event){

                if (event.target.nodeName != 'rect' && event.target.nodeName != 'svg'){

                    if (selectionRect){ //Remove the low profile selection rect
                        selectionRect
                            .transition()
                            .duration(config.selectionWithdrawalDuration)
                            .attr("width", "0")
                            .attr("height", "0")
                            .remove();
                    }

                    selectionTooltipStart.remove();
                    selectionTooltipStop.remove();

                    if(selectedCells && env.lowProfile == false){ //Remove the selected rectangles
                        selectedCells
                            .transition()
                            .duration(config.selectionWithdrawalDuration)
                            .style("fill", getNormalCellColor);
                    }

                    currentElement = null;

                    env.timeEventsActive = true;

                    body.classed("stat-noselect", false); //Remove the non-selection from all the dom
                    eventsAttachedOn.$.off("mouseup.selection").off("keyup.selection"); // Remove useless listeners
                    document.onselectstart = function(){return true;}; //Remove the cursor hack
                    trackerDomElement.on("mousemove", null);// .on("mouseup", null); //Remove the selection events
                }
            };


            // This function provides the selection feature in the low-profile mode
            updateSelectionLowProfile = function(){
                var chartHeight, chartWidth, x, y, width, height, tooltipsOffset, dates, startDateString, endDateString,
                    tooltipWidth;

                if (currentElement == null) return;

                coordsMousemove = d3.mouse(currentElement);

                chartHeight = chart.height();
                chartWidth = chart.width();

                tooltipsOffset = 3;

                // The following lines bound the selection inside the chart
                coordsMousemove[0] = (coordsMousemove[0] > 0) ? coordsMousemove[0] : 1 ;
                coordsMousemove[0] = (coordsMousemove[0] < chartWidth) ? coordsMousemove[0] : chartWidth ;

                coordsMousemove[1] = (coordsMousemove[1] > 0) ? coordsMousemove[1] : 1 ;
                coordsMousemove[1] = (coordsMousemove[1] < chartHeight) ? coordsMousemove[1] : chartHeight ;

                endCoords = {x: ((coordsMousemove[0] > 0) ? coordsMousemove[0] : 1 ), y: coordsMousemove[1]};
                dragStarted = true;

                x = Math.min(startCoords.x, endCoords.x);
                y = Math.min(startCoords.y, endCoords.y);
                width = Math.abs(startCoords.x - endCoords.x);
                height = Math.abs(startCoords.y - endCoords.y);

                dates = $this._computeSubDomains(startCoords, endCoords);

                startDateString = utils.dateToString(dates[0][0]);
                endDateString = utils.dateToString(dates[0][1]);

                tooltipWidth = (startDateString.length * 8); // Where 8 is the base width of a char in the tooltip (don't retrieve it for performance purposes)

                selectionTooltipStart
                    .css({
                        "position": "absolute",
                        "left": x + chart.margin.left - tooltipsOffset - selectionTooltipStart.outerWidth(),
                        "top": y + chart.margin.top - tooltipsOffset - selectionTooltipStart.outerHeight(),
                        "width": tooltipWidth
                    })
                    .text(startDateString)
                    .show();

                selectionTooltipStop
                    .css({
                        "position": "absolute",
                        "left": x + width + chart.margin.left + tooltipsOffset,
                        "top": y + height + chart.margin.top + tooltipsOffset,
                        "width": tooltipWidth
                    })
                    .text(endDateString)
                    .show();

                selectionRect.attr({
                    "x": x, //Update the selection rectangle in low profile mode
                    "y": y,
                    "width": width,
                    "height": height
                }).style("fill-opacity", function(){
                    return (env.lowProfile == true) ? 0.5 : 0.2;
                });
            };


            // This function provides the selection feature in the normal mode
            updateSelectionNormal = function(){
                var selectionVertices, allCells;

                updateSelectionTimes--;

                if (currentElement != null && updateSelectionTimes == 0) {

                    allCells = env.container.chart.svg.selectAll("rect.cell");

                    updateSelectionLowProfile();

                    dragStarted = true;

                    updateSelectionTimes = config.sensibilityFactorDuringSelection; // Reset the number of callback accepted

                    coordsMousemove = d3.mouse(currentElement); // Get the actual cursor position

                    endCoords = {x: coordsMousemove[0], y: coordsMousemove[1]};// Get the actual cursor position in our internal format

                    selectedRectsBoundingBox = {min: {x: Infinity, y: Infinity}, max: {x: -1, y: -1}}; //Reset the selection boundaries

                    finalStartCoords = {x: Math.min(startCoords.x, endCoords.x), y: Math.min(startCoords.y, endCoords.y)}; //Calculate the bounding box of the cells touched by the selection
                    finalEndCoords = {x: Math.max(startCoords.x, endCoords.x), y: Math.max(startCoords.y, endCoords.y)};

                    selectionVertices = utils.getRectangularVertexPoints(finalStartCoords.x, finalStartCoords.y, finalEndCoords.x - finalStartCoords.x, finalEndCoords.y - finalStartCoords.y); // Get Selection vertices

                    // This function finds the subset of cells outside the bounding box
                    allCells
                        .filter(function (d) {
                            var out;
                            out = d.selected;

                            if (out == true) {
                                d.selected = false;
                            }

                            return out;
                        })
                        .style("fill", getNormalCellColor); //Replace the color of the cells outside with the default one (useful for cells no longer involved in the selection)


                    // This function finds the subset of cells inside the bounding box
                    selectedCells = allCells
                        .filter(function (d) {
                            var isCellSelected, rectVertices, currentRect;

                            currentRect = d3.select(this); // Points the current cell

                            d.optional.rectVertices = d.optional.rectVertices || utils.getRectangularVertexPoints(d.optional.xPosition, d.optional.yPosition, parseFloat(currentRect.attr("width")), parseFloat(currentRect.attr("height"))); // Calculate the cell vertices

                            rectVertices = d.optional.rectVertices;

                            isCellSelected = utils.isThereAnIntersection(selectionVertices, rectVertices);// && d.selected == false; // Find if there is an intersection

                            if (isCellSelected == true) {
                                /*
                                 * Calculate the real bounding box based on cells boundaries
                                 */
                                selectedRectsBoundingBox.min = {x: Math.min(rectVertices[0].x, selectedRectsBoundingBox.min.x), y: Math.min(rectVertices[2].y, selectedRectsBoundingBox.min.y)};
                                selectedRectsBoundingBox.max = {x: Math.max(rectVertices[0].x, selectedRectsBoundingBox.max.x), y: Math.max(rectVertices[3].y, selectedRectsBoundingBox.max.y)};

                                d.selected = true;
                            }

                            return isCellSelected;
                        })
                        .style("fill", getSelectedCellColor); //Change the color of the selected cells


                }
            };

            // This function is called when the user starts to select cells
            startSelection = function() {
                var mainView;

                mainView = env.mainView;

                mainView.popUp.hide(); // Cancel any popup
                mainView.showMessage(''); // Cancel any message
                mainView.selectColumn(false); // Unselect column
                mainView.selectRow(false); // Unselect row

                env.timeEventsActive = false;

                dragStarted = false;

                document.onselectstart = function () {return false;}; //Cursor hack to avoid browser default dragging cursor

                currentElement = this;

                coords = d3.mouse(currentElement);

                startCoords = {x: coords[0], y: coords[1]};
                endCoords = {x: coords[0], y: coords[1]};


                if (env.lowProfile == true) {

                    d3.select(eventsAttachedOn.plain) //Attach the low profile callback for the mouse gestures
                        .on("mousemove", updateSelectionLowProfile);
                }


                if (selectionRect){ //Remove any possible old selection rectangles (can happen when the window goes out of focus)
                    selectionRect.remove();
                }

                selectionRect = svg //Introduce the selection rectangle
                    .append("rect")
                    .attr("class", "selection-rect");

                selectionTooltipStart = $('<div class="dnsmon-tooltip selection-tooltip-start custom-jquery-ui-tooltip"></div>');
                selectionTooltipStop = $('<div class="dnsmon-tooltip selection-tooltip-stop custom-jquery-ui-tooltip"></div>');

                container.dom.$.append(selectionTooltipStart);
                container.dom.$.append(selectionTooltipStop);


                if (env.lowProfile == false){

                    d3.select(eventsAttachedOn.plain) //Attach the high profile callback for the mouse gestures
                        .on("mousemove", updateSelectionNormal);

                    getNormalCellColor = env.mainView.getCellColor;
                    getSelectedCellColor = env.mainView.getSelectedCellColor;
                    updateSelectionTimes = config.sensibilityFactorDuringSelection;
                }

                body.classed("stat-noselect", true);

                eventsAttachedOn.$
                    .on("mouseup.selection", stopSelection)
                    .on("keyup.selection", function(evt){
                        var key;

                        key = (evt.which) ? evt.which : evt.keyCode;
                        if (key == 27){ // Esc
                            removeSelectionWithFeedback(evt);
                        }
                    });

            };

            // This function is called when the user stops to select cells
            stopSelection = function(evt) {
                var zoomAnimationDuration, zoomAnimationDelay, selectionWithdrawalDuration;

                zoomAnimationDuration = config.zoomAnimationDuration;
                zoomAnimationDelay = config.zoomAnimationDelay;
                selectionWithdrawalDuration = config.selectionWithdrawalDuration;

                if (currentElement == null){
                    return;
                }


                body.classed("stat-noselect", false);
                eventsAttachedOn.$.off("mouseup.selection").off("keyup.selection");
                env.mainView.selectColumn(false); // Unselect column
                env.mainView.selectRow(false); // Unselect row
                document.onselectstart = function () {return true;}; //Remove the cursor hack

                if (dragStarted == false){
                    $this._clickEvent(evt);

                    currentElement = null; // Reset it (also if not used in the same function)
                    if (selectionRect){
                        selectionRect.remove();
                    }
                    return;
                }

                selectionTooltipStart.remove();
                selectionTooltipStop.remove();

                if (env.lowProfile == true || selectedRectsBoundingBox.min.x == Infinity) { // Set the approximate box
                    selectedRectsBoundingBox.min = {x: Math.min(startCoords.x, endCoords.x), y: Math.min(startCoords.y, endCoords.y)};
                    selectedRectsBoundingBox.max = {x: Math.max(startCoords.x, endCoords.x), y: Math.max(startCoords.y, endCoords.y)};
                }

                removeRect = function(){ //This function will be pushed as a callback of the redraw function in order to remove the selection rect if the selection is not applicable
                    selectionRect
                        .transition()
                        .duration(zoomAnimationDuration)
                        .delay(zoomAnimationDelay)
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", chart.width())
                        .attr("height", chart.height())
                        .remove();

                    env.timeEventsActive = true;
                };

                if (!$this._computeSubDomainsAndApply(selectedRectsBoundingBox.min, selectedRectsBoundingBox.max, removeRect)){ //checks if the new subselection is not applicable

                    env.timeEventsActive = true;

                    if (selectionRect){
                        selectionRect
                            .transition()
                            .duration(selectionWithdrawalDuration)
                            .attr("x", (selectedRectsBoundingBox.max.x - selectedRectsBoundingBox.min.x)/2 + selectedRectsBoundingBox.min.x)
                            .attr("y", (selectedRectsBoundingBox.max.y - selectedRectsBoundingBox.min.y)/2 + selectedRectsBoundingBox.min.y)
                            .attr("width", 0)
                            .attr("height", 0)
                            .remove();
                    }

                    if (selectedCells){
                        selectedCells //Gives a feedback to the user about the inapplicability of the subselection
                            .style("fill", config.style.noSelectableAreaColor)
                            .transition()
                            .duration(selectionWithdrawalDuration)
                            .style("fill", getNormalCellColor);

                    }
                }

                currentElement = null; //Reset the selection start point
                trackerDomElement
                    .on("mousemove", null);
            };

            trackerDomElement
                .on("mousedown", startSelection);
        };


        /**
         * This function is called when an user clicks on a cell
         *
         * @method _clickEvent
         * @private
         */

        this._clickEvent = function(evt){
            var selectedCellData, target;

            env.timeEventsActive = true;
            target = d3.select(evt.target);
            selectedCellData = target[0][0]["__data__"];
            if (selectedCellData){
                env.mainView.controlPanel.showExtraInfoDialog(selectedCellData);
            }

        };


        /**
         * This function computes the new sub-domain after a selection
         *
         * @method _computeSubDomains
         * @private
         * @param {Number} finalStartCoords The top-left point of the selection
         * @param {Number} finalEndCoords The bottom-right point of the selection
         * @return {Array} The new domain
         */

        this._computeSubDomains = function(finalStartCoords, finalEndCoords){
            var newXDomain, newXRange, newYRange, newYDomain;

            newXRange = [finalStartCoords.x, finalEndCoords.x];

            newYRange = [finalStartCoords.y, finalEndCoords.y];
            newXDomain = env.mainView.xAxis.getSubDomain(newXRange);
            newYDomain = env.mainView.yAxis.getSubDomain(newYRange);

            return [newXDomain, newYDomain];
        };


        /**
         * This function computes and applies the new sub-domain after a selection
         *
         * @method _computeSubDomainsAndApply
         * @private
         * @param {Number} startCoords The top-left point of the selection
         * @param {Number} endCoords The bottom-right point of the selection
         * @param {Function} callback A callback function
         * @return {Boolean} True if the new domain is applied
         */

        this._computeSubDomainsAndApply = function(startCoords, endCoords, callback){
            var newXDomain, newYDomain, domains, row, tmpSelectedRows, tmpStartDate, tmpEndDate, newSelection;

            domains = this._computeSubDomains(startCoords, endCoords);
            newXDomain = domains[0];
            newYDomain = domains[1];

            if ((newXDomain.length > 0 ) &&
                (newYDomain.length > 0)) {  // Zoom damper

                tmpStartDate = newXDomain[0];
                tmpEndDate = newXDomain[1];

                tmpSelectedRows = [];


                for (var n=0,length=env.mainView.rows.length; n<length ;n++){
                    row = env.mainView.rows[n];

                    if (utils.indexOf(row.label, newYDomain) != -1){
                        tmpSelectedRows.push(row.id);
                        this.rowsSubSelection = true;
                    }
                }

                if (env.mainView.timeController.isSubSelectable(tmpStartDate, tmpEndDate, tmpSelectedRows)){ // Check if the sub-selection is possible

                    utils.log('Subselection possible', env.debugMode);
                    env.params.selectedRows = tmpSelectedRows;
                    env.params.filterProbes = true;
                    env.params.startDate = tmpStartDate;
                    env.params.endDate = tmpEndDate;

                    env.mainView.redraw(callback, this);
                    return true;

                }else if (env.retrievedAggregationLevel != env.minAggregation && env.retrievedAggregationLevel != 0){ // We still have some aggregation levels in the middle

                    utils.log('Subselection too small, enlarged', env.debugMode);
                    env.params.selectedRows = tmpSelectedRows;
                    env.params.filterProbes = true;
                    newSelection = env.mainView.timeController.getZoomableWindow(tmpStartDate, tmpEndDate);
                    newSelection = env.mainView.timeController.getBoundedWindow(newSelection.start, newSelection.end);
                    env.params.startDate = newSelection.start;
                    env.params.endDate = newSelection.end;
                    env.mainView.showMessage(env.lang.minimumSelectionImposed);

                    env.mainView.redraw(callback, this);
                    return true;

                }else if (env.mainView.timeController.isSelectionReduced(tmpSelectedRows)){ // Check if the selection is a sub-selection

                    utils.log('Subselection too small, not enlargeable, some rows removed', env.debugMode);
                    env.params.selectedRows = tmpSelectedRows; //Don't change time, only the selected probes
                    env.params.filterProbes = true;
                    env.mainView.redraw(callback, this);
                    env.mainView.showMessage(env.lang.minimumTimeSelectionReached);
                    return true;

                }else{

                    utils.log('Subselection too small, not enlargeable, rows cannot be removed', env.debugMode);
                    env.mainView.showMessage(env.lang.tooZoomedMessage); //SubSelection failed
                    return false;
                }
            }
        }

    };

    return GesturesManager;
});


