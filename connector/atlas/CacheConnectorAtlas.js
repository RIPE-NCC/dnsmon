/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/16/13
 * Time: 4:38 PM
 * To change this template use File | Settings | File Templates.
 */

define(
    [
        "env.utils",
        "connector.atlas.error-handler"
    ],
    function(utils, Connector){

        /**
         * CacheConnectorAtlas is the cache level dedicated to the atlas data-api for DNSMON.
         * It provides a bottom-up incremental cache and top-down decremental queries.
         *
         * @class CacheConnectorAtlas
         * @constructor
         * @module connector.Atlas
         */

        var CacheConnectorAtlas = function(env){
            var connector, oldRows, oldCells, dataNomenclatureMapping, minimumResultDate, maximumResultDate;

            connector = new Connector(env);

            // The map declaring the low-level data nomenclature
            dataNomenclatureMapping = {
                startTimestamp: "start_time",
                endTimestamp: "end_time",
                aggregationLevel: "aggregation",
                probesList: "probes",
                serversList: "servers",
                aggregationLevels: "aggregation_levels",
                measurementStartTime: "earliest_available",
                measurementEndTime: "latest_available",
                aggregationLabel: "aggregation_label",
                nativeAvailable: "native_available",

                server: {
                    id: "id",
                    label: "label",
                    group: "grouping",
                    resultsList: "results",
                    ipVersion: "ip_version",
                    description: "description"
                },

                probe: {
                    id: "id",
                    label: "label",
                    group: "grouping",
                    resultsList: "results",
                    description: "description"
                },

                result: {
                    respondingTime: "rtt50",
                    packetSent: "queries",
                    packetReceived: "replies",
                    time: "time"
                }
            };


            this.cache = {
                data: null,
                params: null,
                aggregationLevel: null
            };

            /**
             * It is strongly related to a particular JSON format.
             * From top to bottom: tries to reduce the amount of data requested based on the available data in cache.
             * From bottom to top: enrich the retrieved subset of data with the data already in cache.
             *
             * @method retrieveData
             * @param {Object} params A params vector
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.retrieveData = function(params, callback, context){

                if (!env.config.disableLocalCache && this.cache.data && this._isCacheValid(params)){

                    if (this._isCacheEnough(params)){
                        utils.log("Query in cache");

                        this.cache = {
                            data: this._filterData(params, this.cache.data),
                            params: params,
                            aggregationLevel: env.aggregationLevel
                        };

                        callback.call(context, this.cache.data);

                    }else{

                        utils.log("Query partially in cache");

                        connector.retrieveData(params, function(data){

                            this.cache = {
                                data: this._filterData(params, data),
                                params: params,
                                aggregationLevel: env.aggregationLevel
                            };

                            callback.call(context, this.cache.data);

                        }, this);

                    }

                }else{
                    connector.retrieveData(params, function(data){

                        this.cache = {
                            data: data,
                            params: params,
                            aggregationLevel: env.aggregationLevel
                        };

                        callback.call(context, data);
                    }, this);
                }

            };


            this._isCacheEnough = function(params){
                var oldParams;

                oldParams = this.cache.params;

                return (
                    oldParams.startTime <= params.startTime &&
                    oldParams.endTime >= params.endTime
                    );
            };


            this._isCacheValid = function(params){
                return true;

                var n1, n2, c1, c2;


                if (!this._isSameTarget(params) || this.cache.aggregationLevel != env.aggregationLevel){
                    return false;
                }

                if (this.cache.params.selectedRows.length < params.selectedRows.length){
                    return false;
                }

                n1 = params.startDate;
                n2 = params.endDate;
                c1 = this.cache.params.startDate;
                c2 = this.cache.params.endDate;

                return ((c1 >= n1 && c1<= n2) ||
                    (c2 >= n1 && c2<= n2) ||
                    (n1 >= c1 && n1<= c2) ||
                    (n2 >= c1 && n2<= c2));
            };


            this._filterData = function(params, data){

                return data; // For now

                var type, servers, probes;

                type = (data[dataNomenclatureMapping.serversList]) ? "servers" : "probes";

                minimumResultDate = 0;
                maximumResultDate = 0;

//                this._filterRows(params, data, type);

                data[dataNomenclatureMapping.startTimestamp] = minimumResultDate;
                data[dataNomenclatureMapping.endTimestamp] = maximumResultDate;

                if (type == "servers"){
                    servers = data[dataNomenclatureMapping.serversList];

                }else{
                    probes = data[dataNomenclatureMapping.probesList];
                }

                return data;
            };

            this._filterResults = function(results){
                var filteredResults;

                filteredResults = [];


                return filteredResults;
            };


            this._filterRows = function(params, data, type){
                var rows, newResults, row;
                newResults = [];

                rows = (type == "servers") ? data[dataNomenclatureMapping.serversList] : data[dataNomenclatureMapping.probesList];

                function isRowSelected(rowId){
                    return params.selectedRows.length == 0 || utils.indexOf(rowId, params.selectedRows) != -1;
                }

                for (var n=0,length=rows.length; n<length; n++){
                    row = rows[n];
                    if (isRowSelected(row.id)){
                        newResults.push(row);
                        this._filterResults(params, row, type);
                    }
                }

                data[((type == "servers") ? dataNomenclatureMapping.serversList : dataNomenclatureMapping.probesList )] = newResults; //Replace the filtered data
            };


            this._filterResults = function(params, row, type){
                var result, newResults, results;
                newResults = [];

                results = (type == "servers") ? row[dataNomenclatureMapping.server.resultsList] : row[dataNomenclatureMapping.probe.resultsList];

                for (var n=0,length=results.length; n<length; n++){
                    result = results[n];
                    if (result.time <= params.endDate && result.time >= params.startDate){
                        minimumResultDate = (result.time < minimumResultDate || !minimumResultDate) ? result.time : minimumResultDate;
                        maximumResultDate = (result.time > maximumResultDate || !maximumResultDate) ? result.time : maximumResultDate;
                        newResults.push(result);
                    }
                }

                row[((type == "servers") ? dataNomenclatureMapping.server.resultsList : dataNomenclatureMapping.probe.resultsList )] = newResults; //Replace the filtered data
            };


            this._isSameTarget = function(newParams){
                var oldParams, importantParams, paramTmp;

                oldParams = this.cache.params;
                importantParams = ["root", "group"];

                for (var n=0,length=importantParams.length; n<length; n++){
                    paramTmp = importantParams[n];
                    if (oldParams[paramTmp] != newParams[paramTmp]){
                        return false;
                    }
                }
                return true;
            };

            this._mergeData = function(oldData, newData){
                var rows, row;
                rows = [];

                for (var n=0,length=rows.length; n<length; n++){
                    row = rows[n];

                    if (isRowSelected(row.id)){
                        newResults.push(row);
                        this._filterResults(params, row);
                    }
                }
            };

            this.getNativeDnsResult = function(msmId, prbId, timestamp, callback, context){
                connector.getNativeDnsResult(msmId, prbId, timestamp, callback, context);
            };

            this.getClosestTraceroutes = function(msmId, prbId, timestamp, callback, context){
                connector.getClosestTraceroutes(msmId, prbId, timestamp, callback, context);
            };

        };

        return CacheConnectorAtlas;
    });