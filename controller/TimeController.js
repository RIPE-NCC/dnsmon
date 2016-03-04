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
    "dnsmon.controller.gesture-manager"
], function(utils, GesturesManager){

    /**
     * TimeController provides all the functions to manage the time in the tool.
     *
     * @class TimeController
     * @constructor
     * @module controller
     */

    var TimeController = function(env){
        var gesturesManager, config, subMinutes, addMinutes, updateTimer;

        config = env.config;
        gesturesManager = new GesturesManager(env);

        addMinutes = utils.addMinutes;
        subMinutes = utils.subMinutes;

        this.init = function(){
            gesturesManager.on('scrollRight', this.shiftRight, this);
            gesturesManager.on('scrollLeft', this.shiftLeft, this);
            gesturesManager.on('scrollUp', this.zoomOut, this);
            gesturesManager.on('scrollDown', this.zoomIn, this);
        };


        /**
         * Checks if it is possible to zoom-out with the current selection
         *
         * @method _isZoomableOut
         * @private
         * @param {Date} startDate The start date of the new selection
         * @param {Date} endDate The end date of the new selection
         * @return {Boolean} True if the zoom-out is applicable
         */

        this._isZoomableOut = function(startDate, endDate){
            var aggregationLevel;

            aggregationLevel = this._getAggregationLevel(startDate, endDate);
            return (aggregationLevel <= env.maxAggregation && startDate >= env.measurementStartTime && endDate <= env.measurementEndTime);
        };


        /**
         * Checks if it is possible to zoom-in with the current selection
         *
         * @method _isZoomableIn
         * @private
         * @param {Date} startDate The start date of the new selection
         * @param {Date} endDate The end date of the new selection
         * @return {Boolean} True if the zoom-in is applicable
         */

        this._isZoomableIn = function(startDate, endDate){
            var aggregationLevel, virtualZoom;

            aggregationLevel = this._getAggregationLevel(startDate, endDate);
            virtualZoom = (aggregationLevel > (env.minAggregation * config.virtualZoomFactor));

            return virtualZoom;
        };


        /**
         * Checks if it is possible to shift left the time window
         *
         * @method _isTranslableLeft
         * @private
         * @param {Date} startDate The start date of the new selection
         * @return {Boolean} True if the shift is applicable
         */

        this._isTranslableLeft = function(startDate){
            return (startDate >= env.measurementStartTime);
        };


        /**
         * Checks if it is possible to shift right the time window
         *
         * @method _isTranslableRight
         * @private
         * @param {Date} endDate The end date of the new selection
         * @return {Boolean} True if the shift is applicable
         */

        this._isTranslableRight = function(endDate){
            return (endDate <= env.measurementEndTime);
        };


        this._getAggregationLevel = function(startDate, endDate){
            var maxNumberOfCells, aggregationSeconds, containerWidth, timeInterval;

            timeInterval = Math.floor((endDate - startDate) / 1000);

            containerWidth = env.container.chart.width();

            maxNumberOfCells = containerWidth / (config.cellsMinWidth + config.xCellsMargin);

            aggregationSeconds = timeInterval / maxNumberOfCells;

            return (aggregationSeconds > 0) ? parseFloat(aggregationSeconds.toFixed(2)) : 0;
        };


        /**
         * Zoom in the chart
         *
         * @method zoomIn
         * @param {Number} zoomLevel A value to be applied at the current zoom
         */

        this.zoomIn = function(zoomLevel){
            var startDate, endDate, minutes;

            if (env.timeEventsActive == true) {
                minutes = ((env.params.endDate - env.params.startDate) / 60000) * config.zoomProportion * Math.abs(zoomLevel);

                startDate = addMinutes(env.params.startDate, minutes);
                endDate = subMinutes(env.params.endDate, minutes);

                if (this._isZoomableIn(startDate, endDate)) {
                    env.params.startDate = startDate;
                    env.params.endDate = endDate;

                    if (env.isUpdatedPeriodicallyActive) { // Disable the auto refresh function if active
                        env.mainView.controlPanel.keepUpdatedActive(false);
                    }

                    env.mainView.updateXDomain(true);
                }
            }
        };


        /**
         * Zoom out the chart
         *
         * @method zoomOut
         * @param {Number} zoomLevel A value to be applied at the current zoom
         */

        this.zoomOut = function(zoomLevel){
            var startDate, endDate, minutes, newTimeWindow;

            if (env.timeEventsActive == true) {
                minutes = ((env.params.endDate - env.params.startDate) / 60000) * config.zoomProportion * Math.abs(zoomLevel);

                startDate = subMinutes(env.params.startDate, minutes);
                endDate = addMinutes(env.params.endDate, minutes);

                newTimeWindow = this.getBoundedWindow(startDate, endDate);

                if (this._isZoomableOut(newTimeWindow.start, newTimeWindow.end)) {
                    env.params.startDate = newTimeWindow.start;
                    env.params.endDate = newTimeWindow.end;

                    if (env.isUpdatedPeriodicallyActive) { // Disable the auto refresh function if active
                        env.mainView.controlPanel.keepUpdatedActive(false);
                    }

                    env.mainView.updateXDomain(true);
                }
            }
        };


        /**
         * Shift left the time window
         *
         * @method shiftLeft
         */

        this.shiftLeft = function(){
            var startDate, endDate, timeOffset, newBoundaries;

            if (env.timeEventsActive == true) {
                timeOffset = ((env.params.endDate - env.params.startDate) / 60000) * config.slideProportion;

                startDate = subMinutes(env.params.startDate, timeOffset);
                endDate = subMinutes(env.params.endDate, timeOffset);

                newBoundaries = this.getBoundedWindow(startDate, endDate);

                if (this._isTranslableLeft(startDate) || env.params.startDate.getTime() != newBoundaries.start.getTime()) {
                    env.params.startDate = newBoundaries.start;
                    env.params.endDate = newBoundaries.end;

                    if (env.isUpdatedPeriodicallyActive) { // Disable the auto refresh function if active
                        env.mainView.controlPanel.keepUpdatedActive(false);
                    }

                    env.mainView.updateXDomain(true);
                }
            }
        };


        /**
         * Shift right the time window
         *
         * @method shiftRight
         */

        this.shiftRight = function(){
            var startDate, endDate, timeOffset, newBoundaries;

            if (env.timeEventsActive == true) {
                timeOffset = ((env.params.endDate - env.params.startDate) / 60000) * config.slideProportion;

                startDate = addMinutes(env.params.startDate, timeOffset);
                endDate = addMinutes(env.params.endDate, timeOffset);

                newBoundaries = this.getBoundedWindow(startDate, endDate);

                if (this._isTranslableRight(endDate) || env.params.endDate.getTime() != newBoundaries.end.getTime()) {
                    env.params.startDate = newBoundaries.start;
                    env.params.endDate = newBoundaries.end;

                    if (env.isUpdatedPeriodicallyActive) { // Disable the auto refresh function if active
                        env.mainView.controlPanel.keepUpdatedActive(false);
                    }

                    env.mainView.updateXDomain(true);
                }
            }
        };


        /**
         * Check if the new selection is a sub-selection of the previous one
         *
         * @method isSelectionReduced
         * @param {Array} selectedRows The new list of selected rows
         * @return {Boolean} True if the new selection is a sub-selection of the previous one
         */

        this.isSelectionReduced = function(selectedRows){
            var isSelectionReduced;

            isSelectionReduced = (selectedRows.length < env.params.selectedRows.length || env.params.selectedRows.length == 0);

            return isSelectionReduced;
        };


        /**
         * Check if the new selection can be applied
         *
         * @method isSubSelectable
         * @param {Date} startDate The start date of the new selections
         * @param {Date} endDate The end date of the new selection
         * @param {Array} selectedRows The new list of selected rows
         * @return {Boolean} True if the new selection can be applied
         */

        this.isSubSelectable = function(startDate, endDate, selectedRows){
            var isZoomableIn, isTimeChangend, isSelectionReduced;

            isZoomableIn = this._isZoomableIn(startDate, endDate);
            isTimeChangend = !((env.params.startDate == startDate) && (env.params.endDate == endDate));
            isSelectionReduced = this.isSelectionReduced(selectedRows);

            return isZoomableIn || (!isZoomableIn && !isTimeChangend && isSelectionReduced);
        };


        /**
         * Check if the new selection can be reduced
         *
         * @method isReducible
         * @param {Date} startDate The start date of the new selections
         * @param {Date} endDate The end date of the new selection
         * @return {Boolean} True if the new selection can be reduced
         */

        this.isReducible = function(startDate, endDate, selectedRows){
            var isZoomableIn, isTimeChangend, isSelectionReduced;

            isZoomableIn = this._isZoomableIn(startDate, endDate);

            isTimeChangend = !((env.params.startDate == startDate) && (env.params.endDate == endDate));

            isSelectionReduced = this.isSelectionReduced(selectedRows);


            return isZoomableIn || (!isZoomableIn && !isTimeChangend && isSelectionReduced);
        };


        /**
         * Update the status of the controller parameters of the whole widget.
         *
         * @method updateStatus
         */

        this.updateStatus = function(){
            var startDate, endDate, timeOffset, zoomMinutes, offsetTmp, newTimeWindow;

            startDate = env.params.startDate;
            endDate = env.params.endDate;

            offsetTmp = ((endDate - startDate) / 60000);

            timeOffset = offsetTmp * config.slideProportion;
            zoomMinutes = offsetTmp * config.zoomProportion * Math.abs(config.manualZoomFactor);

            env.params.aggregationLevel = this._getAggregationLevel(startDate, endDate);

            env.isZoomableIn = this._isZoomableIn(addMinutes(startDate, zoomMinutes), subMinutes(endDate, zoomMinutes));

            newTimeWindow = this.getBoundedWindow(subMinutes(startDate, zoomMinutes), addMinutes(endDate, zoomMinutes));
            env.isZoomableOut = this._isZoomableOut(newTimeWindow.start, newTimeWindow.end);

            env.isTranslableLeft = this._isTranslableLeft(subMinutes(startDate, timeOffset));
            env.isTranslableRight = this._isTranslableRight(addMinutes(endDate, timeOffset));
        };


        /**
         * Update the chart with the latest available data
         *
         * @method getNewData
         * @param {integer} timeWindow A time window express as seconds if null the current one will be used
         */

        this.getNewData = function(timeWindow){
            env.params.startDate = null;
            env.params.endDate = null;
            env.params.timeWindow = (timeWindow) ? timeWindow : env.timeWindowSeconds;
            env.timeEventsActive = false;

            env.mainView.redraw(function(){
                env.timeEventsActive = true;
            });
        };


        /**
         * Given a time interval, this function checks if it is valid otherwise it returns the closer valid selection
         *
         * @method getBoundedWindow
         * @param {Date} startDate The start date of the new selections
         * @param {Date} endDate The end date of the new selection
         * @return {Object} Returns start and end time (two Date Objects)
         */

        this.getBoundedWindow = function(startDate, endDate){
            var timeWindowMinutes, newStartDate, newEndDate;

            timeWindowMinutes = (endDate - startDate) / 60000; // Time window in minutes

            if (startDate < env.measurementStartTime && endDate <= env.measurementEndTime){

                newStartDate = env.measurementStartTime;
                newEndDate = addMinutes(newStartDate, timeWindowMinutes);

            }else if (endDate > env.measurementEndTime && startDate >= env.measurementStartTime){

                newEndDate = env.measurementEndTime;
                newStartDate = subMinutes(newEndDate, timeWindowMinutes);

            }else{

                newStartDate = startDate;
                newEndDate = endDate;

            }

            return {start: newStartDate, end: newEndDate};
        };


        /**
         * Given a time interval, this function checks if it is valid otherwise it returns the closer valid zoomable selection
         *
         * @method getZoomableWindow
         * @param {Date} startDate The start date of the new selections
         * @param {Date} endDate The end date of the new selection
         * @return {Object} Returns start and end time (two Date Objects)
         */

        this.getZoomableWindow = function(startDate, endDate){
            var minTimeWindow, newTimeWindow, newStartDate, newEndDate, timeWindowCenter, halfMinTimeWindow;

            minTimeWindow = ((env.minAggregation * config.virtualZoomFactor) * env.maxNumberOfCellsPerRow) * 1000;
            newTimeWindow = (endDate.getTime() - startDate.getTime());
            timeWindowCenter = startDate.getTime() + (newTimeWindow / 2);
            halfMinTimeWindow = (minTimeWindow / 2);

            newStartDate = new Date(timeWindowCenter - halfMinTimeWindow);
            newEndDate = new Date(timeWindowCenter + halfMinTimeWindow);

            return {start: newStartDate, end: newEndDate};
        };


        /**
         * This function starts the auto-update feature.
         *
         * @method keepUpdated
         * @param {Boolean} keepUpdate If true the auto-update feature starts
         */

        this.keepUpdated = function(keepUpdate){
            var $this, interval;

            $this = this;
            interval = ((env.debugMode) ? 6000 : (config.updateEverySeconds * 1000));

            if (keepUpdate){
                this.getNewData(null); // First refresh
                updateTimer = setInterval($this.getNewData, interval);
            }else{
                clearInterval(updateTimer);
            }
        };

    };

    return TimeController;
});