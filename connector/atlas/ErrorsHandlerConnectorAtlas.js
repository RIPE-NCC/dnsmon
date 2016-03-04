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
    "dnsmon.connector.atlas.rest"
], function(utils, $, Connector){

    /**
     * ErrorsHandlerConnectorAtlas checks the validity of the JSON input and handle errors raised by the data-api.
     *
     * @class ErrorsHandlerConnectorAtlas
     * @constructor
     * @module connector.Atlas
     */

    var ErrorsHandlerConnectorAtlas = function(env){
        var connector, errorsNomenclature, responsivenessTimer, lastRequestWorkingParams,
            restoringAttempt, config, firstConnection;

        connector = new Connector(env);
        config = env.config;
        firstConnection = true;

        this.globalErrorState = 0; // 0 - No error

        errorsNomenclature = {
            messages: "messages",

            message: {
                text: "text",
                type: "type"
            }
        };

        /**
         * From bottom to top: check the JSON validity and handles the error raised by the data-api.
         *
         * @method retrieveData
         * @param {Object} params A params vector
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.retrieveData = function(params, callback, context){

            this.globalErrorState = 0; // Reset the global error state

            this._responsivenessCheck();

            connector.retrieveData(params,
                function(data){

                    clearTimeout(responsivenessTimer);

                    this._handleDataApiErrors(data); // This can change the global error state

                    if (this.globalErrorState < 3){ // retry still active

                        if (this.globalErrorState <= 1){ //If there are no blocking errors

                            if (this._checkDataFormat(data)){ //If the json format is correct

                                if (this._checkAllFields(data, ["probes"]) || this._checkAllFields(data, ["servers"])){
                                    lastRequestWorkingParams = utils.lightClone(params); // Store last working request
                                    firstConnection = false;

                                    callback.call(context, data);
                                } else {

                                    this._handle("error", env.lang.emptyDataset);
                                    env.mainView.loadingImage(false);

                                }

                            }else{ //If the json format is malformed

                                this._handle("error", env.lang.malformedDataset);
                                env.mainView.loadingImage(false);

                            }

                        }else { // There is at least one blocking error

                            this.globalErrorState = 0; // Reset it for the next error

                            if (env.isUpdatedPeriodicallyActive == false) { // Network error with auto-update disabled
                                this._tryToReconnect(params, callback, context);
                            } else {
                                env.mainView.showMessage(env.lang.lastQueryFails);
                            }
                        }
                    }

                }, this);

        };


        /**
         * This method tries to reconnect to the server in case of failures and provides a feedback to the user.
         *
         * @method _tryToReconnect
         * @private
         * @param {Object} params A params vector
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this._tryToReconnect = function(params, callback, context){
            var $this;

            $this = this;
            setTimeout(function(){

                env.mainView.showMessage(env.lang.waitingConnection);

                utils.log('Try to reconnect', env.debugMode);
                $this.retrieveData(params, callback, context);

            }, config.reconnectionInterval);

        };


        /**
         * This method tries to restore the previous working query in case of failures and provides a feedback to the user.
         *
         * @method _restorePreviousWorkingQuery
         * @private
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this._restorePreviousWorkingQuery = function(callback, context){
            utils.log('Try to restore the previous situation', env.debugMode);

            env.params = lastRequestWorkingParams;
            connector.retrieveData(lastRequestWorkingParams, callback, context);
        };


        /**
         * This method dispatches to _handle all the data-api errors
         *
         * @method _handleDataApiErrors
         * @private
         * @param {Object} data The data blob retrieved from the data-api
         */

        this._handleDataApiErrors = function(data){
            var errorsTmp, errorTmp, errorNomenclature;
            errorsTmp = data[errorsNomenclature.messages];

            if (errorsTmp){
                errorNomenclature = errorsNomenclature.message;

                for (var n=0,length=errorsTmp.length; n<length && this.globalErrorState <3; n++){
                    errorTmp = errorsTmp[n];
                    this._handle(errorTmp[errorNomenclature.type], errorTmp[errorNomenclature.text]);
                    env.mainView.loadingImage(false);
                }
            }
        };


        /**
         * It provides a different method to handle each error raised from the data-api.
         *
         * @method _handle
         * @private
         * @param {String} type A string representing the type of the error
         * @param {String} text A string describing the error
         */

        this._handle = function(type, text){
            switch(type){

                case "connection-fail":
                    env.mainView.showMessage(env.lang.connectionFailed);
                    this._setGlobalErrorState(2); // 2 - Blocking error, retry
                    break;

                case "error":
                    env.mainView.showMessage(text);
                    this._setGlobalErrorState(3); // 3 - Blocking error, no retry
                    break;

                case "info":
                    env.mainView.showMessage(text);
                    this._setGlobalErrorState(1); // 1 - The show must go on
                    break;
            }
        };


        /**
         * This method sets the global error state.
         * A global error is a blocking error that can not be handled by other components of the tool
         *
         * @method _setGlobalErrorState
         * @private
         * @param {Number} errorLevel An integer representing the current error state
         */

        this._setGlobalErrorState = function(errorLevel){
            this.globalErrorState = errorLevel;
        };


        /**
         * It checks if the retrieved JSON contains all the mandatory fields for all the possible views.
         *
         * @method _checkDataFormat
         * @private
         * @return {Boolean} Returns true on success
         */
        this._checkDataFormat = function(data){
            var requiredFields;

            requiredFields = {};

            requiredFields["zone-servers"] = ["start_time", "end_time", "earliest_available", "latest_available", "aggregation", "aggregation_levels", "native_available", "group"];
            requiredFields["server-probes"] = ["start_time", "end_time", "earliest_available", "latest_available", "aggregation", "aggregation_levels", "native_available", "group", "server"];


            return this._checkAllFields(data, requiredFields["zone-servers"]) || this._checkAllFields(data, requiredFields["server-probes"]);
        };


        /**
         * It checks if the retrieved JSON contains all the mandatory fields.
         *
         * @method _checkAllFields
         * @private
         * @return {Boolean} Returns true on success
         */
        this._checkAllFields = function(data, list){
            for (var n=0,length=list.length; n<length; n++){
                if (!this._checkField(data, list[n])){
                    return false;
                }
            }

            return true;
        };


        /**
         * It checks if the retrieved JSON contains a certain mandatory field.
         *
         * @method _checkField
         * @private
         * @return {Boolean} Returns true on success
         */
        this._checkField = function(data, field){
            var item, presence, emptiness, result;

            item = data[field];

            presence = (item != null);
            emptiness = ($.isArray(item)) ? (item.length > 0) : (item !== "");
            result = presence && emptiness;

            if (!result){
                utils.log(field + ': ' + (presence && emptiness) , env.debugMode);
            }
            return result;
        };


        /**
         * It checks the responsiveness of the data-api to provide a feedback to the user.
         *
         * @method _responsivenessCheck
         * @private
         */

        this._responsivenessCheck = function(){
            var $this = this;

            responsivenessTimer = setTimeout(function(){
                $this._handle.call($this, "info", env.lang.serverSlowMessage);
            }, 7 * 1000);
        };


        /**
         * Get the human readable version of the DNS response and check errors
         *
         * @method getNativeDnsResult
         * @param {Number} msmId The id of the measurement
         * @param {Number} prbId The id of the probe
         * @param {Number} timestamp A UNIX timestamp
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getNativeDnsResult = function(msmId, prbId, timestamp, callback, context){ // Just indirection for now

            // No errors checks for now
            connector.getNativeDnsResult(msmId, prbId, timestamp, callback, context);
        };


        /**
         * Get the closest traceroutes and checks errors
         *
         * @method getClosestTraceroutes
         * @param {Number} msmId The id of the measurement
         * @param {Number} prbId The id of the probe
         * @param {Number} timestamp A UNIX timestamp
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getClosestTraceroutes = function(msmId, prbId, timestamp, callback, context){ // Just indirection for now

            // No errors checks for now
            connector.getClosestTraceroutes(msmId, prbId, timestamp, callback, context);
        };


        /**
         * Get the closest hostname.bind and checks errors
         *
         * @method getClosestHostnameBind
         * @param {Number} msmId The id of the measurement
         * @param {Number} prbId The id of the probe
         * @param {Number} timestamp A UNIX timestamp
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getClosestHostnameBind = function(msmId, prbId, timestamp, callback, context){ // Just indirection for now

            // No errors checks for now
            connector.getClosestHostnameBind(msmId, prbId, timestamp, callback, context);
        };

    };

    return ErrorsHandlerConnectorAtlas;
});