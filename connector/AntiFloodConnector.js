    /**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/16/13
 * Time: 4:27 PM
 * To change this template use File | Settings | File Templates.
 */

define(
    [
        "dnsmon.connector.aggregation-level"
    ],
    function(Connector){

        /**
         * AntiFloodConnector it is a layer implementing a client-side anti-flood system.
         * This anti-flood layer allows cumulative query to the data-api reducing considerably the amount of
         * interactions with the network stack.
         *
         * @class AntiFloodConnector
         * @constructor
         * @module connector
         */

        var AntiFloodConnector = function(env){

            var connector, timeoutLoadingTimer, firstCall, config;

            firstCall = true;
            config = env.config;
            connector = new Connector(env);

            /**
             * From top to bottom: it drops or aggregates queries.
             * From bottom to top: it responds to the single query in the usual way.
             *
             * @method retrieveData
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.retrieveData = function(params, callback, context){

                if (firstCall ==  false){
                    clearTimeout(timeoutLoadingTimer);
                    timeoutLoadingTimer = setTimeout(
                        function(){
                            connector.retrieveData(params, callback, context);
                        },
                        config.antiFloodTimer);

                    env.antiFloodTimer = null;
                }else{
                    firstCall =  false;
                    connector.retrieveData(params, callback, context);
                }
            };


            /** Get the DNS response
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

        return AntiFloodConnector;
    });