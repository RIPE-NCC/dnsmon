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
    "dnsmon.lib.jquery-libs-amd"
], function(utils, $){

    /**
     * FullScreenView is the view component for the full screen feature
     *
     * @class FullScreenView
     * @constructor
     * @module view
     */

    var FullScreenView = function(env){

        var oldDimensions, oldDomDimensions, oldBackground, config, templateManager, margin, body, fullScreenThrobber,
            timeOverviewContainer, oldTimeOverviewDimensions, openTimeOverviewImage, $this, isTimeOverviewOpened,
            windowWidth, windowHeight;

        $this = this;
        config = env.config;
        templateManager = env.mainView.templateManager;
        body = $('body');
        margin = config.style.fullScreenMargin;
        fullScreenThrobber = $(templateManager.fullScreenThrobber);
        timeOverviewContainer = templateManager.dom.timeOverviewContainer;
        openTimeOverviewImage = $(templateManager.openTimeOverviewImage);
        isTimeOverviewOpened = config.timeOverviewOpenedByDefaultInFullScreen;

        /**
         * This method manages the full screen mode
         *
         * @method fullScreenMode
         * @input {Boolean} fullScreen If true the full screen will be enabled
         */

        this.fullScreenMode = function(fullScreen){
            if (fullScreen){
                this._openFullScreen();
            }else{
                this._closeFullScreen();
            }
        };


        /**
         * This method shows the time overview
         *
         * @method openTimeOverviewPanel
         */

        this.openTimeOverviewPanel = function(){
            timeOverviewContainer.$.css({"position": "relative"}).animate({"height": oldTimeOverviewDimensions.height}, 800);

            env.mainView.defaultDimensions.height = windowHeight;
            env.container.height(env.mainView.defaultDimensions.height);
            env.mainView.redraw(function(){
                env.container.chart.timeBoundaries.style("visibility", "visible");
            }, this);

            openTimeOverviewImage
                .css("opacity", 0.8);
        };


        /**
         * This method hides the time overview
         *
         * @method closeTimeOverviewPanel
         */

        this.closeTimeOverviewPanel = function(){
            timeOverviewContainer.$.animate({"height": "0"}, 800);


            env.mainView.defaultDimensions.height = windowHeight + config.style.timeOverviewHeight;
            env.container.height(env.mainView.defaultDimensions.height);
            env.mainView.redraw();

            env.mainDom.$
                .append(openTimeOverviewImage);

            env.container.chart.timeBoundaries.style("visibility", "hidden");

            openTimeOverviewImage
                .css("opacity", 1)
                .off("click")
                .on("click", function(){

                    if (isTimeOverviewOpened){
                        $this.closeTimeOverviewPanel();
                    }else{
                        $this.openTimeOverviewPanel();
                    }
                    isTimeOverviewOpened = !isTimeOverviewOpened;
                });
        };


        /**
         * This method starts the full screen mode
         *
         * @method _openFullScreen
         * @private
         */

        this._openFullScreen = function(){
            oldDimensions = {width: env.container.width(), height: env.container.height()};
            oldTimeOverviewDimensions = {width: timeOverviewContainer.$.width(), height: timeOverviewContainer.$.height()};
            oldDomDimensions = {width: env.externalDom.$.width(), height: env.externalDom.$.height()};

            oldBackground = body.css("background");

            windowWidth = $(window).width() - margin;
            windowHeight = $(window).height() - margin;

            env.mainView.templateManager.dom.bottomInfoSection.$.hide();

            env.mainView.defaultDimensions.height = windowHeight;
            env.container.width(windowWidth);

            body.css({
                "visibility": "hidden", // Hide the rest of the page
                "background": config.style.fullScreenBackground
            }).append(fullScreenThrobber);

            timeOverviewContainer.$.addClass("floating-panel");

            env.externalDom.$.css({
                width: "auto",
                visibility: "visible",
                position: "fixed",
                opacity: 0,
                "z-index": config.style.fullScreenZIndex,
                top: "0",
                left: "0"
            });

            env.mainView.redraw(function(){
                env.externalDom.$.animate({"opacity": "1"}, 400);
                fullScreenThrobber.remove();
                if (!isTimeOverviewOpened){
                    $this.closeTimeOverviewPanel();
                }
            }, this);
        };


        /**
         * This method closes the full screen mode
         *
         * @method _closeFullScreen
         * @private
         */

        this._closeFullScreen = function(){

            isTimeOverviewOpened = config.timeOverviewOpenedByDefaultInFullScreen;
            body.css({
                "visibility":  "visible",
                "background": oldBackground
            });

            env.container.chart.timeBoundaries.style("visibility", "visible");
            timeOverviewContainer.$.removeClass("floating-panel").css("height", oldTimeOverviewDimensions.height);

            env.mainView.defaultDimensions = oldDomDimensions;
            env.container.width(oldDimensions.width);

            env.mainView.templateManager.dom.bottomInfoSection.$.show();

            env.externalDom.$.css({
                position: "relative",
                visibility: "visible",
                opacity: 0,
                width: oldDomDimensions.width
            });

            env.mainView.redraw(function(){
                env.externalDom.$.animate({"opacity": "1"}, 400);
                openTimeOverviewImage.remove();
            }, this);
        };


    };

    return FullScreenView;
});