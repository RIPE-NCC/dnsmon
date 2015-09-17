/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/16/13
 * Time: 4:38 PM
 * To change this template use File | Settings | File Templates.
 */

define(
    [
        "dnsmon.env.utils",
        "dnsmon.connector.atlas.error-handler"
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
            var connector, dataNomenclatureMapping, minimumResultDate, maximumResultDate;

            connector = new Connector(env);

            env.totalSavedBytes = 0;
            env.stats = "";

            // The map declaring the low-level data nomenclature
            dataNomenclatureMapping = {
                startTime: "start_time",
                endTime: "end_time",
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


            // Initialise the cache
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
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.retrieveData = function(params, callback, context){
                if (env.localCacheActive && this.cache.data){ // Is the cache active and available

                    if (this._isCacheFilteredServerSide(params)) { // The server side is computing the diff (e.g. because the client doesn't know the time window that will be returned)

                        //this._composeQueryOnUpdate(params, callback, context); // To be tested

                    }else if (this._isCacheEnough(params)){ // The whole query is in cache

                        utils.log("Query in cache", env.debugMode);
                        utils.log(params);
                        this._composeQueryOnCache(params, callback, context);

                    }else if (this._isCachePartiallyValid(params)){ // A portion of the query is in the cache

                        utils.log("Query partially in cache", env.debugMode);
                        this._retrieveQuerySubset(params, callback, context);

                    }else{

                        this._retrieveWithoutCache(params, callback, context); // The cache is active and available but not related to the actual query

                    }

                }else{

                    this._retrieveWithoutCache(params, callback, context); // The cache is not active or empty

                }

            };


            /**
             * This method retrieves from the data-api a portion of the query.
             * It describes the available data in cache and the data-api provides the remaining parts
             *
             * @method _composeQueryOnUpdate
             * @private
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this._composeQueryOnUpdate = function(params, callback, context){
                var totalBytes, savedBytes;

                connector.retrieveData(params, function(data){

                    // Set the time boundaries retrieved from the server
                    params.startTime = data[dataNomenclatureMapping.startTime];
                    params.endTime = data[dataNomenclatureMapping.endTime];

                    data = this._mergeData(params, this.cache.data, data);
                    data = this._filterData(params, data);

                    if (env.debugMode){
                        totalBytes = utils.objectSize(data);
                        savedBytes = totalBytes - env.lastDownloadBytes;
                        env.totalSavedBytes += savedBytes;
                        env.stats += "t" + totalBytes + "s" + savedBytes + ",";
                        utils.log('Retrieved bytes: ' + env.lastDownloadBytes + ' Total bytes: ' + totalBytes + ' Saved bytes: ' +  savedBytes, env.debugMode);
                        utils.log('Total bytes saved until now: ' + env.totalSavedBytes, env.debugMode);
                    }

                    this._updateCache(params, data);

                    callback.call(context, data);

                }, this);
            };


            /**
             * This method checks if the data-api should filter the data or not.
             *
             * @method _isCacheFilteredServerSide
             * @private
             * @param {Object} params A parameters vector
             * @return {Boolean} True if the data-api should filter the data
             */

            this._isCacheFilteredServerSide = function(params){
                return (
                    params.startTime == null &&
                    params.endTime == null &&
                    params.timeWindow != null &&
                    params.cutFrom != null
                    );
            };


            /**
             * This method answers to the request by filtering the data in cache.
             * It usable only when the whole query is in cache.
             *
             * @method _composeQueryOnCache
             * @private
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the composed data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this._composeQueryOnCache = function(params, callback, context){
                var filteredCacheData, totalBytes, savedBytes;

                filteredCacheData = this._filterData(params, this.cache.data);
                this._updateCache(params, filteredCacheData);

                if (env.debugMode){
                    totalBytes = utils.objectSize(filteredCacheData);
                    savedBytes = totalBytes;
                    env.totalSavedBytes += savedBytes;
                    env.stats += "t" + totalBytes + "s" + savedBytes + ",";
                    utils.log('Retrieved bytes: 0 Total bytes: ' + totalBytes + ' Saved bytes: ' +  savedBytes, env.debugMode);
                    utils.log('Total bytes saved until now: ' + env.totalSavedBytes, env.debugMode);
                }

                callback.call(context, this.cache.data);
            };


            /**
             * This method answers to the request by composing the answer from the cache and the server.
             * It computes the data not available in cache and asks to the server for it.
             *
             * @method _retrieveQuerySubset
             * @private
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the composed data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this._retrieveQuerySubset = function(params, callback, context){
                var subsetParams, totalBytes, savedBytes, newAggregationLevels, oldAggregationLevels;

                subsetParams = this._getParamsSubset(this.cache.params, params);

                subsetParams.aggregationLevel = env.aggregationLevel; // Force the aggregation level

                connector.retrieveData(subsetParams, function(data){

                    oldAggregationLevels = this.cache.data[dataNomenclatureMapping.aggregationLevels];
                    newAggregationLevels = data[dataNomenclatureMapping.aggregationLevels];

                    if (newAggregationLevels.length != oldAggregationLevels.length || !utils.containsAll(newAggregationLevels, oldAggregationLevels)) { // If the aggregations list changes

                        this._retrieveWithoutCache(params, callback, context);

                    }else{

                        data = this._mergeData(params, this.cache.data, data);
                        data = this._filterData(params, data);

                        if (env.debugMode) {
                            totalBytes = utils.objectSize(data);
                            savedBytes = totalBytes - env.lastDownloadBytes;
                            env.totalSavedBytes += savedBytes;
                            env.stats += "t" + totalBytes + "s" + savedBytes + ",";
                            utils.log('Retrieved bytes: ' + env.lastDownloadBytes + ' Total bytes: ' + totalBytes + ' Saved bytes: ' + savedBytes, env.debugMode);
                            utils.log('Total bytes saved until now: ' + env.totalSavedBytes, env.debugMode);
                        }

                        this._updateCache(params, data);

                        callback.call(context, data);
                    }

                }, this);

            };


            /**
             * This method computes the difference between two parameters vector
             *
             * @method _getParamsSubset
             * @private
             * @param {Object} oldParams The old parameters vector
             * @param {Object} newParams The new parameters vector
             * @return {Object} The resulting parameters vector
             */

            this._getParamsSubset = function(oldParams, newParams){
                var params, timeDiff;

                params = utils.lightClone(newParams); // Clone the parameters vector

                //params.selectedRows = this._getRowsDiff(oldParams.selectedRows, newParams.selectedRows); // Get the new rows not included in the previous query

                timeDiff = this._getTimeDiff(this.cache.data[dataNomenclatureMapping.startTime], this.cache.data[dataNomenclatureMapping.endTime], newParams.startTime, newParams.endTime); // Get the diff in time boundaries

                params.startTime = timeDiff.startTime; // Set the new time boundaries
                params.endTime = timeDiff.endTime;

                return params;
            };


            /**
             * This method computes the difference between two time windows
             *
             * @method _getTimeDiff
             * @private
             * @param {Date} oldStartTime The old start date
             * @param {Date} oldEndTime The old end date
             * @param {Date} newStartTime The new start date
             * @param {Date} newEndTime The new end date
             * @return {Object} The computed time window (composed of startTime and endTime)
             */

            this._getTimeDiff = function(oldStartTime, oldEndTime, newStartTime, newEndTime){
                var startTime, endTime, consistencyOffset;

                consistencyOffset = env.aggregationLevel || env.samplingFrequency;

                if (newStartTime < oldStartTime){

                    startTime = newStartTime;
                    endTime = oldStartTime + consistencyOffset;

                }else if (newEndTime > oldEndTime){

                    startTime = oldEndTime - consistencyOffset;
                    endTime = newEndTime;

                }

                return {startTime: startTime, endTime: endTime};
            };


            /**
             * This method checks if the actual cache is partially valid or not.
             *
             * @method _isCachePartiallyValid
             * @private
             * @param {Object} params A parameters vector
             * @return {Boolean} True if the actual cache is partially valid
             */

            this._isCachePartiallyValid = function(params){
                var oldParams, oldRows, newRows;

                oldParams = this.cache.params;

                oldRows = utils.split(oldParams.selectedRows, ',', true);
                newRows = utils.split(params.selectedRows, ',', true);

                return (
                    params.startTime != null &&
                    params.endTime != null &&
                    this._isSameTarget(params) && // Same target
                    this.cache.aggregationLevel == env.aggregationLevel && // Check the aggregation level

                    // Same rows
                    oldRows.length == newRows.length &&
                    this._containsRows(oldRows, newRows) &&

                    (
                        (params.startTime >= oldParams.startTime  && params.startTime <= oldParams.endTime) || // Different time but partially valid
                        (params.endTime >= oldParams.startTime  && params.endTime <= oldParams.endTime)
                        )
                    );
            };


            /**
             * This method updates the cache
             *
             * @method _updateCache
             * @private
             * @param {Object} params The new parameters vector
             * @param {Object} data The blob of data
             */

            this._updateCache = function(params, data){


                this.cache = {
                    data: data,
                    params: utils.lightClone(params),
                    aggregationLevel: env.aggregationLevel
                };

            };


            /**
             * This method checks if a new row selection contains the old rows selected.
             *
             * @method _containsRows
             * @private
             * @param {Object} oldRowsSelection The old vector of selected rows
             * @param {Object} newRowsSelection The new vector of selected rows
             * @return {Boolean} True if the new row selection contains the old rows selected
             */

            this._containsRows = function(oldRowsSelection, newRowsSelection){

                return oldRowsSelection.length == 0 || (newRowsSelection.length != 0 && newRowsSelection.length <= oldRowsSelection.length && utils.containsAll(oldRowsSelection, newRowsSelection));

            };


            /**
             * This method rely on the layers below to answer the query
             *
             * @method _retrieveWithoutCache
             * @private
             * @param {Object} params A parameters vector
             * @param {Function} callback A function taking the data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this._retrieveWithoutCache = function(params, callback, context){

                connector.retrieveData(params, function(data){

                    this._updateCache(params, data);

                    utils.log('Retrieved bytes: ' + env.lastDownloadBytes, env.debugMode);
                    callback.call(context, data);
                }, this);

            };


            /**
             * This method checks if the actual cache is completely valid or not.
             *
             * @method _isCacheEnough
             * @private
             * @param {Object} params A parameters vector
             * @return {Boolean} True if the actual cache is completely valid
             */

            this._isCacheEnough = function(params){
                var oldParams;

                oldParams = this.cache.params;

                return (
                    params.startTime != null &&
                    params.endTime != null &&
                    this._isSameTarget(params) &&
                    this.cache.aggregationLevel == env.aggregationLevel &&
                    this._containsRows(utils.split(oldParams.selectedRows, ',', true), utils.split(params.selectedRows, ',', true)) &&
                    oldParams.startTime <= params.startTime &&
                    oldParams.endTime >= params.endTime
                    );
            };


            /**
             * This method filters the data in order to satisfy the actual parameters
             *
             * @method _filterData
             * @private
             * @param {Object} params The new parameters vector
             * @param {Object} data The blob of data
             * @return {Object} The filtered data
             */

            this._filterData = function(params, data){
                minimumResultDate = null;
                maximumResultDate = null;

                this._filterRows(params, data);

                // Updates the composed JSON with the actual start/end dates

                if (env.aggregationLevel != 0) {
                    data[dataNomenclatureMapping.startTime] = minimumResultDate; //( minimumResultDate >= params.startTime) ? params.startTime : minimumResultDate;
                    data[dataNomenclatureMapping.endTime] = maximumResultDate; // ( maximumResultDate + (env.aggregationLevel)  <= params.endTime) ? params.endTime : maximumResultDate;
                }else{
                    data[dataNomenclatureMapping.startTime] = params.startTime;
                    data[dataNomenclatureMapping.endTime] = params.endTime;
                }

                return data;
            };


            /**
             * This method filters the rows on a blob of data in order to satisfy a vector of parameters
             *
             * @method _filterRows
             * @private
             * @param {Object} params A parameters vector
             * @param {Object} data The blob of data
             */

            this._filterRows = function(params, data){
                var rows, newResults, row, rowId, selectedRows, rowsListNomenclature;

                newResults = [];
                selectedRows = utils.split(params.selectedRows, ',', true);
                rowsListNomenclature = this._getRowsListNomenclature(params);
                rows = data[rowsListNomenclature];

                for (var n=0,length=rows.length; n<length; n++){
                    row = rows[n];

                    rowId = '' + row[this._getRowNomenclature(params).id]; // Is a string

                    if (selectedRows.length == 0 || utils.indexOf(rowId, selectedRows) != -1){
                        newResults.push(row);

                        this._filterResults(params, row);
                    } else {
                        // Force GC
//                        delete data[rowsListNomenclature][n];
                    }
                }

                data[rowsListNomenclature] = newResults; //Replace the filtered data
            };


            /**
             * This method filters the results in a row in order to satisfy a vector of parameters
             *
             * @method _filterRows
             * @private
             * @param {Object} params A parameters vector
             * @param {Object} row A row (a group of results)
             */

            this._filterResults = function(params, row){
                var result, newResults, results, rowNomenclature, maxResultTime;

                newResults = [];
                rowNomenclature = this._getRowNomenclature(params);
                results = row[rowNomenclature.resultsList];

                for (var n=0,length=results.length; n<length; n++){
                    result = results[n];

                    // Get the new time boundaries
                    if (result.time < params.endTime && result.time >= params.startTime){
                        maxResultTime = result.time + env.aggregationLevel;
                        minimumResultDate = (result.time < minimumResultDate || !minimumResultDate) ? result.time : minimumResultDate;
                        maximumResultDate = (maxResultTime > maximumResultDate || !maximumResultDate) ? maxResultTime : maximumResultDate;
                        newResults.push(result);
                    } else {
                        // Force GC
//                        delete row[rowNomenclature.resultsList][n];
                    }

                }

                row[rowNomenclature.resultsList] = newResults; //Replace the filtered data
            };


            /**
             * This method checks if the provided parameters are referring to the same target/measurement/contest.
             *
             * @method _isSameTarget
             * @private
             * @param {Object} newParams The new parameters vector
             * @return {Boolean} True if is the same target/measurement/contest
             */

            this._isSameTarget = function(newParams){
                var oldParams, importantParams, paramTmp;

                oldParams = this.cache.params;
                importantParams = ["root", "group", "type", "ipVersion", "isTcp"];


                for (var n=0,length=importantParams.length; n<length; n++){
                    paramTmp = importantParams[n];

                    if (oldParams[paramTmp] != newParams[paramTmp]){
                        return false;
                    }
                }

                return true;
            };


            /**
             * This method merges two blob of data
             *
             * @method _mergeData
             * @private
             * @param {Object} params The new parameters vector
             * @param {Object} oldData The old blob of data
             * @param {Object} newData The new blob of data
             * @return {Object} The merged blob of data
             */

            this._mergeData = function(params, oldData, newData){

                return this._mergeRows(params, oldData, newData);

            };


            /**
             * This support method merges the rows of two blob of data
             *
             * @method _mergeData
             * @private
             * @param {Object} params The new parameters vector
             * @param {Object} oldData The old blob of data
             * @param {Object} newData The new blob of data
             * @return {Object} The merged blob of data
             */

            this._mergeRows = function(params, oldData, newData){
                var dataRows, oldDataRows, row, rowId, oldRow, results, newResults, resultsListNomenclature, rowsListNomenclature;

                rowsListNomenclature = this._getRowsListNomenclature(params);
                dataRows = newData[rowsListNomenclature];
                oldDataRows = oldData[rowsListNomenclature];


                for (var n=0,length=dataRows.length; n<length; n++){
                    row = dataRows[n];

                    rowId = '' + row[this._getRowNomenclature(params).id];
                    oldRow = this._getRow(params, oldData, rowId);

                    if (!oldRow){

                        oldDataRows.push(row);

                    }else{
                        resultsListNomenclature = this._getRowNomenclature(params).resultsList;
                        results = oldRow[resultsListNomenclature];
                        newResults = row[resultsListNomenclature];
                        oldRow[resultsListNomenclature]  = results.concat(newResults);

                    }

                }

                oldData[dataNomenclatureMapping.startTime] = Math.min(oldData[dataNomenclatureMapping.startTime], newData[dataNomenclatureMapping.startTime]);
                oldData[dataNomenclatureMapping.endTime] = Math.max(oldData[dataNomenclatureMapping.endTime], newData[dataNomenclatureMapping.endTime]);

                return oldData;
            };


            /**
             * This method returns the nomenclature of a group for the given query type
             *
             * @method _getRowNomenclature
             * @private
             * @param {Object} params A parameters vector
             * @return {String} The nomenclature
             */

            this._getRowNomenclature = function(params){

                switch (params.type){
                    case "zone-servers":
                        return dataNomenclatureMapping.server;
                        break;

                    case "server-probes":
                        return dataNomenclatureMapping.probe;
                        break;
                }
            };


            /**
             * This method returns the nomenclature of a list of groups for the given query type
             *
             * @method _getRowsListNomenclature
             * @private
             * @param {Object} params A parameters vector
             * @return {String} The nomenclature
             */

            this._getRowsListNomenclature = function(params){

                switch (params.type){
                    case "zone-servers":
                        return dataNomenclatureMapping.serversList;
                        break;

                    case "server-probes":
                        return dataNomenclatureMapping.probesList;
                        break;
                }
            };


            /**
             * This method retrieves a row from a blob of data
             *
             * @method _getRow
             * @private
             * @param {Object} params A parameters vector
             * @param {Object} data A blob of data
             * @param {String} id The if of a row
             * @return {Object} A row or null
             */

            this._getRow = function(params, data, id){
                var rows, row, rowId;

                rows = data[this._getRowsListNomenclature(params)];
                for (var n=0,length=rows.length; n<length; n++){
                    row = rows[n];
                    rowId = '' + row[this._getRowNomenclature(params).id];

                    if (rowId == id){
                        return row;
                    }
                }

                return null;
            };


            /**
             * Get the human readable version of the DNS response and use cache
             *
             * @method getNativeDnsResult
             * @param {Number} msmId The id of the measurement
             * @param {Number} prbId The id of the probe
             * @param {Number} timestamp A UNIX timestamp
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.getNativeDnsResult = function(msmId, prbId, timestamp, callback, context){ // Just indirection for now
                connector.getNativeDnsResult(msmId, prbId, timestamp, callback, context);
            };


            /**
             * Get the closest traceroutes and use cache
             *
             * @method getClosestTraceroutes
             * @param {Number} msmId The id of the measurement
             * @param {Number} prbId The id of the probe
             * @param {Number} timestamp A UNIX timestamp
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.getClosestTraceroutes = function(msmId, prbId, timestamp, callback, context){ // Just indirection for now
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

        return CacheConnectorAtlas;
    });