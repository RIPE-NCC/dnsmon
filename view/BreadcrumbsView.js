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
    "dnsmon.env.params-manager"
], function(utils, $, paramsManager){

    /**
     * BreadcrumbsView is the view component for the breadcrumbs function
     *
     * @class BreadcrumbsView
     * @constructor
     * @module view
     */

    var BreadcrumbsView = function(env){
        var levelsIndex, dom, stateStack, config, $this;

        config = env.config;
        levelsIndex = [];
        stateStack = {};
        $this = this;

        dom = $(env.mainView.templateManager.breadcrumbs);

        env.mainDom.$.append(dom);

        dom.css("margin-left", config.labelWidth + "px");


        /**
         * This method updates the html representing the breadcrumbs
         *
         * @method update
         */

        this.update = function(){
            var domElement, item, positionIndex;

            domElement = $(this._getTitle());

            domElement
                .off("click")
                .on("click", function(){

                    item = $(this).text();

                    env.params = utils.lightClone(stateStack[item]); // Rebuild the status

                    positionIndex = utils.indexOf(item, levelsIndex);
                    if (positionIndex != levelsIndex.length){
                        levelsIndex = levelsIndex.slice(0, $.inArray(item, levelsIndex) + 1);

                        $this.update();
                    }
                    env.mainView.redraw();
                });

            dom.html(domElement);
        };


        /**
         * This method removes the last entry of the breadcrumbs
         *
         * @method removeLastLevel
         */

        this.removeLastLevel = function(){
            var index;

            if (levelsIndex.length > 0){
                index = levelsIndex.pop();
                delete stateStack[index];

                this.update();
            }
        };


        /**
         * This method removes all the entries of the breadcrumbs
         *
         * @method resetLevels
         */

        this.resetLevels = function(){
            levelsIndex = [];
            stateStack = {};

            dom.children().off('click');
            this.update();
        };


        /**
         * This method initialises the breadcrumbs
         *
         * @method init
         */

        this.init = function(){
            if (env.initialHistory){
                this.pushHistory(env.initialHistory);
            }else{
                this.addLevel(env.connector.getGroup().label);
            }
        };


        /**
         * This method pushes a new entry in the breadcrumbs based on the actual query parameters
         *
         * @method addLevel
         * @input {String} levelString A string describing the new state
         */

        this.addLevel = function(levelString){
            this._addLevelWithParams(levelString, env.params);
        };


        /**
         * This method pushes a new entries and a vector of query parameters fot that entry
         *
         * @method _addLevelWithParams
         * @private
         * @input {String} levelString A string describing the new state
         * @input {Object} levelString A vector of query parameters
         */

        this._addLevelWithParams = function(levelString, params){
            var label;

            if (!(params.type == "servers" && env.params.isUdm)) {
                label = this._getLabelPrefix(params.type);
                levelString = label + levelString;

                if (utils.indexOf(levelString, levelsIndex) == -1) {
                    levelsIndex.push(levelString);

                    stateStack[levelString] = utils.lightClone(params);
                    this.update();
                }
            }
        };


        /**
         * This method returns the actual html representation for the breadcrumbs
         *
         * @method _getTitle
         * @private
         * @return {Array} A set of DOM elements
         */

        this._getTitle = function(){
            var domElements, index;

            domElements = [];

            for (var n=0,length=levelsIndex.length; n<length; n++){
                index = levelsIndex[n];
                domElements.push('<span class="stacked-title-item">' + index + '</span>');
            }

            return utils.join(domElements, "&nbsp;&gt;&nbsp;");
        };


        /**
         * This method imposes a set of items based on a given history object
         *
         * @method pushHistory
         * @input {Object} history A history object
         */

        this.pushHistory = function(history){
            var historicParams, historicParamItem, group, entryId;

            this.resetLevels();

            for (var n=0,length=history.length; n<length; n++){
                historicParamItem = history[n];
                historicParams = paramsManager.mergeParams(utils.lightClone(env.params), historicParamItem.params);

                group = env.connector.getGroup();

                entryId = historicParamItem.id;

                if (group && group.id == historicParamItem.id) {
                    entryId = group.label
                }

                this._addLevelWithParams(paramsManager.convertLocalToRemoteId(entryId), historicParams);

            }
        };


        this.enrichLabel = function(id, label, type) {
            var levelStringOld, prefix, element, levelStringNew;

            prefix = this._getLabelPrefix(type);
            levelStringOld = prefix + paramsManager.convertLocalToRemoteId(id);
            levelStringNew = prefix + label;

            element = stateStack[levelStringOld];

            if (element) {
                delete stateStack[levelStringOld];

                stateStack[levelStringNew] = element;
                levelsIndex[levelsIndex.indexOf(levelStringOld)] = levelStringNew;

                if (!env.fullScreenActive){
                    this.update();
                } else {
                    setTimeout(function(){
                        $this.update.call($this);
                    }, 4000);
                }
            }
        };

        /**
         * This method returns the introducing label of an entry based on its type
         *
         * @method _getLabelPrefix
         * @private
         * @input {String} type An entry type
         * @return {String} A label
         */

        this._getLabelPrefix = function(type){
            var label;

            switch(type){

                case "servers":
                    label = env.lang.zoneLevelLabel;
                    break;

                case "probes":
                    label = env.lang.serverLevelLabel;
                    break;

                case "instance":
                    label = ''; // For now
                    break;
            }

            return label + ': ';
        };

    };

    return BreadcrumbsView;
});