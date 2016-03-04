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
    "dnsmon.lib.d3",
    "dnsmon.env.utils"
], function(d3, utils){

    /**
     * PopUpView is the view component for the cell's pop-up function
     *
     * @class PopUpView
     * @constructor
     * @module view
     */

    var PopUpView = function(env){
        var config;

        config = env.config;


        /**
         * This method hides the pop-up describing a cell
         *
         * @method hide
         */

        this.hide = function(){
            clearTimeout(this._popupDelayTimer);

            if (this.svgBalloon){
                this.svgBalloon.group
                    .remove();

                this.svgBalloon = null;
            }
        };


        /**
         * This method shows the pop-up describing a cell
         *
         * @method show
         * @input {Object} cell A cell
         * @input {Object} mouseCoords The coordinates of the mouse cursor
         */

        this.show = function(cell, mouseCoords){
            if (env.timeEventsActive){
                var $this, container, chart;
                $this = this;

                clearTimeout(this._popupDelayTimer);

                if (!container){
                    container = env.container;
                    chart = container.chart;
                }

                this._popupDelayTimer = setTimeout(function(){
                        var balloonWidth, balloonHeight, svgBallonLeft, svgBallonRight, cursorOffset, arrowPoint,
                            chartCenter, translationVector, arrowTop, absTranslationVector, balloonArray, lineFunction,
                            cursorOffsetUnit, roundingFactor, balloonCellPosition, cellText, fontCharWidth, fontCharHeight,
                            defaultYTranslation;

                        fontCharWidth = 7; // Pixels
                        fontCharHeight = 20; // Pixels
                        defaultYTranslation = chart.margin.top + 20; // Pixels


                        if (env.timeEventsActive){
                            chartCenter = chart.getCenter();

                            cellText = cell.toArrayString();

                            balloonWidth = utils.getLongestString(cellText) * fontCharWidth;
                            balloonHeight = cellText.length * fontCharHeight;

                            chartCenter.y = Math.max(balloonHeight + defaultYTranslation, chartCenter.y); // This line avoids the pop-up to overflow the chart top margin

                            cursorOffsetUnit = 3;

                            absTranslationVector = {x: balloonWidth/4, y: balloonHeight/4};
                            translationVector = {x: 0, y: 0};

                            arrowTop = false;

                            svgBallonLeft = [];
                            svgBallonRight = [];

                            roundingFactor = 3;

                            //Balloon points

                            // ---Left
                            svgBallonLeft.push({x: balloonWidth/4, y: 0});

                            svgBallonLeft.push({x: roundingFactor, y: 0}); //Rounded
                            svgBallonLeft.push({x: 0, y: roundingFactor}); //Rounded

                            svgBallonLeft.push({x: 0, y: balloonHeight - roundingFactor}); //Rounded
                            svgBallonLeft.push({x: roundingFactor, y: balloonHeight}); //Rounded

                            svgBallonLeft.push({x: balloonWidth/4, y: balloonHeight});


                            // ---Right
                            svgBallonRight.push({x: (balloonWidth/4)*3, y: balloonHeight});

                            svgBallonRight.push({x: balloonWidth - roundingFactor, y: balloonHeight}); //Rounded
                            svgBallonRight.push({x: balloonWidth, y: balloonHeight - roundingFactor}); //Rounded

                            svgBallonRight.push({x: balloonWidth, y: roundingFactor}); //Rounded
                            svgBallonRight.push({x: balloonWidth - roundingFactor, y: 0}); //Rounded

                            svgBallonRight.push({x: (balloonWidth/4)*3, y: 0});

                            if (mouseCoords.x > chartCenter.x && mouseCoords.y < chartCenter.y){ //First quadrant
                                arrowTop = true;
                                cursorOffset = {x: -cursorOffsetUnit, y: cursorOffsetUnit}; //To avoid overlaps with the mouse cursor
                                translationVector.x = mouseCoords.x - (absTranslationVector.x + balloonWidth);
                                translationVector.y = mouseCoords.y + absTranslationVector.y;

                            }else if (mouseCoords.x < chartCenter.x && mouseCoords.y < chartCenter.y){ //Second quadrant
                                arrowTop = true;
                                cursorOffset = {x: cursorOffsetUnit, y: cursorOffsetUnit}; //To avoid overlaps with the mouse cursor
                                translationVector.x = mouseCoords.x + absTranslationVector.x;
                                translationVector.y = mouseCoords.y + absTranslationVector.y;

                            }else if (mouseCoords.x < chartCenter.x && mouseCoords.y > chartCenter.y){ //Third quadrant
                                arrowTop = false;
                                cursorOffset = {x: cursorOffsetUnit, y: -cursorOffsetUnit}; //To avoid overlaps with the mouse cursor
                                translationVector.x = mouseCoords.x + absTranslationVector.x;
                                translationVector.y = mouseCoords.y - (absTranslationVector.y + balloonHeight);

                            }else{ //Fourth quadrant
                                arrowTop = false;
                                cursorOffset = {x: -cursorOffsetUnit, y: -cursorOffsetUnit}; //To avoid overlaps with the mouse cursor
                                translationVector.x = mouseCoords.x - (absTranslationVector.x + balloonWidth);
                                translationVector.y = mouseCoords.y - (absTranslationVector.y + balloonHeight);

                            }

                            svgBallonLeft = utils.translate(svgBallonLeft, translationVector);
                            svgBallonRight = utils.translate(svgBallonRight, translationVector);

                            arrowPoint = {x: mouseCoords.x + cursorOffset.x , y: mouseCoords.y + cursorOffset.y};

                            //Add the arrow
                            if (arrowTop == false){
                                svgBallonLeft.push(arrowPoint);
                                balloonArray = svgBallonLeft.concat(svgBallonRight);
                            }else{
                                svgBallonRight.push(arrowPoint);
                                balloonArray = svgBallonRight.concat(svgBallonLeft);
                            }

                            lineFunction = d3.svg.line()
                                .x(function(d) { return d.x; })
                                .y(function(d) { return d.y; })
                                .interpolate("linear-closed");


                            if (!$this.svgBalloon){

                                $this.svgBalloon = {};

                                $this.svgBalloon.group = container.svg
                                    .append('g');

                                $this.svgBalloon.cloud = $this.svgBalloon.group
                                    .append("path")
                                    .attr("class", "svg-balloon");

                                $this.svgBalloon.cell = $this.svgBalloon.group
                                    .append("rect")
                                    .attr("class", "balloon-rect");

                                $this.svgBalloon.text = $this.svgBalloon.group
                                    .append('g');
                            }

                            $this.svgBalloon.cloud
                                .attr("d", lineFunction(balloonArray))
                                .attr("stroke", "#757575")
                                .attr("stroke-width", 2)
                                .attr("opacity", 0.8)
                                .attr("fill", "white");

                            balloonCellPosition = utils.translate([{x: 0, y: 0}], translationVector)[0];

                            $this.svgBalloon.cell
                                .attr("width", balloonWidth - 10)
                                .attr("height", balloonHeight - 10)
                                .attr("rx", 3)
                                .attr("ry", 3)
                                .attr("x", balloonCellPosition.x + 5)
                                .attr("y", balloonCellPosition.y + 5)
                                .attr("fill", function(){
                                    return env.mainView.getCellColor(cell);
                                });

                            utils.writeSvgText($this.svgBalloon.text, cellText, balloonCellPosition, {left: 10, top: 20});
                        }
                    },
                    config.popupDelay);

            }
        };
    };
    return PopUpView;
});