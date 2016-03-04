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
    "dnsmon.connector.atlas.isolation-level"
],
    function(Connector){

        /**
         * AggregationLevelConnector introduces in the query all the information related to the aggregation level.
         * It provides a transparent layer between the tool and the data implementing all the logic
         * about the data aggregation.
         *
         * @class AggregationLevelConnector
         * @constructor
         * @module connector
         */

        var AggregationLevelConnector = function(env){

            var connector, config;

            config = env.config;
            connector = new Connector(env);

            /**
             * From top to bottom: it injects information about the aggregation level.
             * From bottom to top: it parse information about the aggregation level
             *
             * @method retrieveData
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the retrieved data as input when it will be ready
             * @param {Object} context The context of the callback
             */

            this.retrieveData = function(params, callback, context){
                var containerWidth;

                containerWidth = env.container.chart.width();
                env.maxNumberOfCellsPerRow = Math.floor(containerWidth / (config.cellsMinWidth + config.xCellsMargin));

                if (params.startDate && params.endDate && env.aggregationLevels && env.aggregationLevels.length > 0){
                    env.aggregationLevel = this._getAggregationLevel(params);
                }

                connector.retrieveData(params, function(data){
                    callback.call(context, data);
                }, this);
            };


            this._getBestAggregationLevel = function(params){
                var aggregationSeconds, timeInterval;

                timeInterval = Math.floor((params.endDate - params.startDate) / 1000);
                aggregationSeconds = timeInterval / env.maxNumberOfCellsPerRow;

                return  (aggregationSeconds > 0) ? aggregationSeconds.toFixed(2) : 0;
            };



            this._getAggregationLevel = function(params){
                var bestLevel, currentLevel;

                if (typeof I_WANT_TO_SHOOT_ON_MY_FOOT != 'undefined'){
                    return 0;
                }

                bestLevel = this._getBestAggregationLevel(params);

                if (env.isNativeAvailable && bestLevel <= env.samplingFrequency){ // Native resolution
                    return 0;
                }

                for (var n=0,length=env.aggregationLevels.length; n<length; n++){
                    currentLevel = env.aggregationLevels[n];
                    if (currentLevel >= bestLevel){
                        break;
                    }
                }

                return currentLevel;
            };


            /**
             * Get the DNS response
             *
             * @method getNativeDnsResult
             * @param {Number} msmId The id of the measurement
             * @param {Number} prbId The id of the probe
             * @param {Number} timestamp A UNIX timestamp
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.getNativeDnsResult = function(msmId, prbId, timestamp, callback, context){
                connector.getNativeDnsResult(msmId, prbId, timestamp, callback, context);
            };


            /** Get the closest traceroutes
            *
            * @method getClosestTraceroutes
            * @param {Number} msmId The id of the measurement
            * @param {Number} prbId The id of the probe
            * @param {Number} timestamp A UNIX timestamp
            * @param {Function} callback A function taking the retrieved data as input when it is ready
            * @param {Object} context The context of the callback
            */

            this.getClosestTraceroutes = function(msmId, prbId, timestamp, callback, context){
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

        return AggregationLevelConnector;
    });