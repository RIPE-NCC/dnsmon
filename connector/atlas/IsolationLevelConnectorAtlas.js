/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/17/13
 * Time: 11:35 AM
 * To change this template use File | Settings | File Templates.
 */



// Coupled with the model layer

define(
    [
        "env.utils",
        "env.params-manager",
        "model.cell",
        "model.row",
        "connector.atlas.cache",
        "lib.atlas-traceroute-printer"
    ],
    function(utils, paramsManager, Cell, Row, Connector){

        /**
         * IsolationLevelConnectorAtlas has a fundamental role providing isolation between the internal input format
         * and the external input format. It allows to block the propagation of changes affecting the JSON format
         * provided by the data-api. In addition it is a transposition level between a format convenient for the
         * data-api (e.g. light data data format) and a format convenient for the tool (e.g. less computation format).
         *
         * @class IsolationLevelConnectorAtlas
         * @constructor
         * @module connector.Atlas
         */

        var IsolationLevelConnectorAtlas = function(env){

            var connector, dataNomenclatureMapping, maxUsedDate, minUsedDate, crowdestRow, envelop, config, originalTime;

            connector = new Connector(env);
            config = env.config;

            dataNomenclatureMapping = {
                startTimestamp: "start_time",
                endTimestamp: "end_time",
                aggregationLevel: "aggregation",
                probesList: "probes",
                serversList: "servers",
                isOngoing: "active",

                aggregationLevels: "aggregation_levels",
                measurementStartTime: "earliest_available",
                measurementEndTime: "latest_available",
                aggregationLabel: "aggregation_label",
                nativeAvailable: "native_available",

                singleZone: "group",
                singleServer: "server",

                zone: {
                    id: "id",
                    label: "label",
                    description: "description",
                    isOngoing: "active"
                },

                server: {
                    id: "id",
                    hostname: "hostname",
                    resultsList: "results",
                    ipVersion: "ip_version",
                    ipAddress: "ip_address",
                    label: "label",
                    description: "description",
                    urlsMap: "atlas_measurements"
                },

                urlItem: {
                    typeId: "type",
                    label: "type_label",
                    overviewUrl: "overview_url",
                    dataUrl: "result_url",
                    measurementId: "msm_id",
                    currentDatasource: "data_source",
                    samplingFrequency: "interval"
                },

                probe: {
                    id: "id",
                    country: "country",
                    label: "label",
                    description: "description",
                    hostname: "hostname",
                    resultsList: "results"
                },

                result: {
                    respondingTime: "rtt50",
                    packetSent: "queries",
                    packetReceived: "replies",
                    time: "time",
                    endTime: "end_time",
                    errors: "errors"
                },

                managedRcodes: ["ServFail", "NXDomain", "Refused"]
            };


            /**
             * It is strongly related to a particular JSON format.
             * From top to bottom: uses paramsManager to translate the internal format of the parameters in the format valid outside.
             * From bottom to top: translates the external input data in the internal format.
             *
             * @method retrieveData
             * @param {Object} params A params vector
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.retrieveData = function(params, callback, context){

                params = this._parseParams(params); //Translates the internal format of the parameters in the format valid outside

                //Just an indirection for now
                connector.retrieveData(params, function(data){
                    var wrappedData = this._parseData(data);

                    callback.call(context, wrappedData); // Back to the normal data flow

                }, this); // Data callback context
            };


            /**
             * This method translates parameters from the internal to the external format
             *
             * @method _parseParams
             * @param {Object} params A params vector
             * @return {Object} A params vector in the internal format
             */
            this._parseParams = function(params){
                return paramsManager.fromInternalToExternal(params);
            };


            /**
             * This method translates a server from the external to the internal format
             *
             * @method _parseSingleServer
             * @param {Object} server A server described in the external format
             * @return {Object} A server described in the internal format
             */

            this._parseSingleServer = function(server){
                var serverNomenclature, serverObj;

                serverNomenclature = dataNomenclatureMapping.server;
                serverObj = {
                    id: paramsManager.convertRemoteToLocalId(server[serverNomenclature.id]),
                    label: server[serverNomenclature.label] || server[serverNomenclature.hostname] + ' ' + ((server[serverNomenclature.ipVersion] == 4) ? 'IPv4': 'IPv6'),
                    description: server[serverNomenclature.description],
                    urlsMap: this._generateJsonUrls(server[serverNomenclature.urlsMap])
                };

                return serverObj;
            };


            /**
             * This method translates a zone from the external to the internal format
             *
             * @method _parseSingleServer
             * @param {Object} zone A zone described in the external format
             * @return {Object} A zone described in the internal format
             */

            this._parseZone = function(zone){
                var zoneNomenclature, zoneObj;

                zoneNomenclature = dataNomenclatureMapping.zone;
                zoneObj = {
                    id: paramsManager.convertRemoteToLocalId(zone[zoneNomenclature.id]),
                    label: zone[zoneNomenclature.label]
                };

                env.isOngoing = zone[zoneNomenclature.isOngoing];

                return zoneObj;
            };


            /**
             * This method initialises the parsing of the input JSON
             *
             * @method _parseData
             * @private
             * @param {Object} data The external data structure
             * @return {Object} The internal data structure
             */

            this._parseData = function(data){
                maxUsedDate = null;
                minUsedDate = null;

                crowdestRow = {cells: []};

                originalTime = {
                    start: data[dataNomenclatureMapping.startTimestamp],
                    end: data[dataNomenclatureMapping.endTimestamp]
                };

                envelop = { // Creates the internal data structure
                    startDate: paramsManager.convertRemoteToLocalDate(originalTime.start),
                    endDate: paramsManager.convertRemoteToLocalDate(originalTime.end),
                    rows: [],
                    cells: [],
                    group: null
                };

                // Synchronizes the internal parameters with those returned
                env.params.startDate = envelop.startDate;
                env.params.endDate = envelop.endDate;

                env.retrievedAggregationLevel = data[dataNomenclatureMapping.aggregationLevel];

                if (data.type == "server-probes"){ // Different parser based on data.type

                    envelop.group = this._parseSingleServer(data[dataNomenclatureMapping.singleServer]);
                    envelop.root = this._parseZone(data[dataNomenclatureMapping.singleZone]);
                    this._parseProbes(data[dataNomenclatureMapping.probesList]);

                }else if (data.type == "zone-servers"){

                    envelop.group = this._parseZone(data[dataNomenclatureMapping.singleZone]);
                    this._parseServers(data[dataNomenclatureMapping.serversList]);

                }else{
                    console.log("Malformed json!");
                }

                envelop.maxUsedDate = maxUsedDate;
                envelop.minUsedDate = minUsedDate;


                // Computes some internal parameters
                env.aggregationLevels = data[dataNomenclatureMapping.aggregationLevels];
                env.minAggregation = env.aggregationLevels[0];
                env.maxAggregation = env.aggregationLevels[env.aggregationLevels.length - 1];
                env.measurementStartTime = paramsManager.convertRemoteToLocalDate(data[dataNomenclatureMapping.measurementStartTime]);
                env.measurementEndTime = paramsManager.convertRemoteToLocalDate(data[dataNomenclatureMapping.measurementEndTime]);

                env.aggregationLabel = data[dataNomenclatureMapping.aggregationLabel];
                env.isNativeAvailable = data[dataNomenclatureMapping.nativeAvailable];

                envelop.usedTimeWindowSeconds = Math.ceil((maxUsedDate - minUsedDate)/1000);
                env.timeWindowSeconds = Math.ceil((env.params.endDate - env.params.startDate)/1000);
                envelop.crowdestRow = crowdestRow;

                if (minUsedDate < env.params.startDate){
                    utils.log('Warning: an element retrieved is before the start date', env.debugMode);
                }

                return envelop;
            };


            /**
             * Parses all the servers available in the JSON in order to create an internal compatible version of them
             *
             * @method _parseServers
             * @private
             * @param {Object} servers A list of server
             */

            this._parseServers = function(servers){
                var row, rowId, rowLabel, objRow, serverNomenclature, rowResults, resultsObjList, rowGroup, rowIpVersion,
                    rowDescription, externalId, rowHostname, rowIp, multipleLabels;

                serverNomenclature = dataNomenclatureMapping.server;
                multipleLabels = {};

                for (var n=0,length=servers.length; n<length; n++){ // For all the servers
                    row = servers[n];

                    externalId = row[serverNomenclature.id];
                    rowId = paramsManager.convertRemoteToLocalId(externalId);
                    rowResults = row[serverNomenclature.resultsList];

                    rowHostname = row[serverNomenclature.hostname];
                    rowGroup = rowHostname; // Grouped by host name

                    rowIpVersion = row[serverNomenclature.ipVersion];
                    rowIp = row[serverNomenclature.ipAddress];

                    rowDescription = row[serverNomenclature.description] || rowIp + ' (' + rowHostname + ')';

                    rowLabel = row[serverNomenclature.label] || this._abbreviateLabel(rowHostname) + ' ' + ((rowIpVersion == 4) ? 'IPv4': 'IPv6');

                    if (multipleLabels[rowLabel]){
                        multipleLabels[rowLabel]++;
                        rowLabel += '(' + multipleLabels[rowLabel] + ')';
                    }else{
                        multipleLabels[rowLabel] = 1;
                    }

                    objRow  = new Row(rowId, rowLabel); // Create a row object of the model layer
                    objRow.group = rowGroup;
                    objRow.internalOrder = rowIpVersion;
                    objRow.description = rowDescription;
                    objRow.minimumResponseTime = null;
                    objRow.___externalId___ = externalId;
                    objRow.___type___ = "server";

                    objRow.urlsMap = this._generateJsonUrls(row[serverNomenclature.urlsMap]); // Get additional data-api URLs

                    resultsObjList = this._parseResults(rowResults, objRow); // Parse all the results for this row

                    envelop.rows.push(objRow);
                }

            };


            /**
             * This method translates the URLs of additional data-api reported in the JSON in the internal format
             *
             * @method _generateJsonUrls
             * @private
             * @param {Object} urlsMap A map of URLs
             * @return {Object} A map of URLs translated in the internal format
             */

            this._generateJsonUrls = function(urlsMap){
                var jsonOverviewUrls, jsonSampleUrls, dataUrl, overviewUrl, label, nomenclatureUrlMap, mapUrlItem,
                    current, measurementId, typeId, samplingFrequency;

                jsonOverviewUrls = [];
                jsonSampleUrls = [];
                nomenclatureUrlMap = dataNomenclatureMapping.urlItem;

                for (var n=0,length=urlsMap.length; n<length; n++){

                    mapUrlItem = urlsMap[n];
                    label = mapUrlItem[nomenclatureUrlMap.label];
                    overviewUrl = mapUrlItem[nomenclatureUrlMap.overviewUrl];
                    dataUrl = mapUrlItem[nomenclatureUrlMap.dataUrl];
                    measurementId = mapUrlItem[nomenclatureUrlMap.measurementId];
                    typeId = mapUrlItem[nomenclatureUrlMap.typeId];
                    current = (mapUrlItem[nomenclatureUrlMap.currentDatasource] == true);

                    samplingFrequency = mapUrlItem[nomenclatureUrlMap.samplingFrequency];

                    if (current){
                        env.samplingFrequency = samplingFrequency;
                    }

                    if (typeId != 3){
                        jsonOverviewUrls.push({type: typeId, label: label, url: overviewUrl, current: current, measurementId: measurementId, samplingFrequency: samplingFrequency});
                        jsonSampleUrls.push({type: typeId, label: label, url: dataUrl, current: current, measurementId: measurementId, samplingFrequency: samplingFrequency});
                    }
                }

                return {sample: jsonSampleUrls, overview: jsonOverviewUrls};
            };


            /**
             * This method abbreviates the labels for IPv6 addresses
             *
             * @method _abbreviateIPv6Label
             * @private
             * @param {String} label An IP address
             */

            this._abbreviateIPv6Label = function(label){
                var blocks, fullBlocks, blockTmp, resultBlocksHead, resultBlocksTail, labelOut;

                fullBlocks = [];
                resultBlocksHead = [];
                resultBlocksTail = [];
                blocks = label.split(":");

                for (var n=0,length=blocks.length; n<length; n++){
                    blockTmp = blocks[n];
                    if (blockTmp != "") {
                        fullBlocks.push(blockTmp);
                    }
                }

                if (fullBlocks.length > 4){
                    resultBlocksHead.push(fullBlocks[0]);
                    resultBlocksHead.push(fullBlocks[1]);

                    resultBlocksTail.push(fullBlocks[fullBlocks.length - 2]);
                    resultBlocksTail.push(fullBlocks[fullBlocks.length - 1]);

                    labelOut = utils.join(resultBlocksHead, ":") + ":..:" + utils.join(resultBlocksTail, ":");
                }else{
                    labelOut = label;
                }

                return labelOut;

            };



            /**
             * This method abbreviates the labels
             *
             * @method _abbreviateLabel
             * @private
             * @param {String} label A label
             */

            this._abbreviateLabel = function(label){
                var stringOut, firstPart, secondPart, startSecondPart, length;

                length = label.length;
                if (length >= config.maxYLabelLength){
                    startSecondPart = length - 4;

                    firstPart = (label.charAt(7) != '.') ? label.substring(0, 8) : label.substring(0, 7);
                    secondPart = (label.charAt(startSecondPart) != '.') ? label.substring(startSecondPart, length) : label.substring(startSecondPart + 1, length);

                    stringOut = firstPart + '...' + secondPart;
                }else{
                    stringOut = label;
                }

                return stringOut;
            };


            /**
             * Parses all the probes available in the JSON in order to create an internal compatible version of them
             *
             * @method _parseProbes
             * @private
             * @param {Object} probes A list of probes
             */

            this._parseProbes = function(probes){
                var row, rowId, rowLabel, objRow, probeNomenclature, rowResults, resultsObjList, rowGroup,
                    rowDescription, externalId, rowCountry, rowHostname;

                probeNomenclature = dataNomenclatureMapping.probe;

                for (var n=0,length=probes.length; n<length; n++){
                    row = probes[n];

                    externalId = row[probeNomenclature.id];

                    rowId = paramsManager.convertRemoteToLocalId(externalId);
                    rowResults = row[probeNomenclature.resultsList];
                    rowCountry = row[probeNomenclature.country];
                    rowHostname = row[probeNomenclature.hostname];
                    rowGroup = rowCountry;
                    rowLabel = row[probeNomenclature.label] || rowHostname + ' (' + rowCountry + ')';
                    rowDescription = row[probeNomenclature.description] || rowHostname;

                    objRow  = new Row(rowId, rowLabel); //Label modified for now
                    objRow.group = rowGroup;
                    objRow.internalOrder = rowId;
                    objRow.description = rowDescription;
                    objRow.minimumResponseTime = null;
                    objRow.___externalId___ = externalId;
                    objRow.___type___ = "probe";

                    objRow.urlsMap = envelop.group.urlsMap;

                    resultsObjList = this._parseResults(rowResults, objRow);
                    envelop.rows.push(objRow);
                }

            };


            /**
             * Parses all results retrieved in the JSON for the current row
             *
             * @method _parseResults
             * @private
             * @param {Object} results A list of results
             * @param {Object} row An object of the model layer representing the row
             */

            this._parseResults = function(results, row){
                var cell, objCell, cellResponseTime, cellTime, resultNomenclature, cellLoss, cellTimeEnd,
                    lastSampleDate, startTimestamp, endTimestamp;

                resultNomenclature = dataNomenclatureMapping.result; // Get the nomenclature for a result item

                for (var n=0,length=results.length; n<length; n++){ // Iterate an all the results
                    cell = results[n];

                    startTimestamp = cell[resultNomenclature.time];
                    endTimestamp = cell[resultNomenclature.endTime];

                    cellTime = paramsManager.convertRemoteToLocalDate(startTimestamp); // The start time MUST be every time specified by the server

                    if (endTimestamp){ // The end time is specified by the server

                        cellTimeEnd = paramsManager.convertRemoteToLocalDate(endTimestamp);

                    }else{

                        if (env.retrievedAggregationLevel != 0){ // It is an aggregation, so every single cell is representing a period with start and end time

                            cellTimeEnd = paramsManager.convertRemoteToLocalDate(startTimestamp + env.retrievedAggregationLevel); // Computes the end time

                        }else{ // It is a sample with just startTime

                            cellTimeEnd = null;

                        }
                    }

                    cellResponseTime = this._computeRespondingTime(cell);
                    cellLoss = this._computePacketLoss(cell);

                    if (maxUsedDate == null){
                        maxUsedDate = cellTime;
                        minUsedDate = cellTime;
                    }else{
                        maxUsedDate = (maxUsedDate > cellTime) ? maxUsedDate : cellTime;
                        minUsedDate = (minUsedDate < cellTime) ? minUsedDate : cellTime;
                    }

                    objCell = new Cell(row, cellTime); // Create a new object of the model layer

                    this._parseRcodes(objCell, cell);

                    objCell.endTime = cellTimeEnd;
                    objCell.respondingTime = cellResponseTime;
                    objCell.loss = cellLoss;
                    objCell.sent = cell[dataNomenclatureMapping.result.packetSent];

                    envelop.cells.push(objCell);

                    row.cells.push(objCell); // Set the current cell to the current row

                    if (cellResponseTime != null){
                        row.minimumResponseTime = ((row.minimumResponseTime == null || row.minimumResponseTime > cellResponseTime) ? cellResponseTime : row.minimumResponseTime);
                     }

                    crowdestRow = (row.cells.length > crowdestRow.cells.length) ? row : crowdestRow;

                    lastSampleDate = cellTime;
                }
            };

            /**
             * Enriches the cell object of the model layer with the rcodes error retrieved in the JSON for the conresponding result
             *
             * @method _parseRcodes
             * @private
             * @param {Object} cell An object of the model layer
             * @param {Object} cellData A result/cell of the JSON input
             */

            this._parseRcodes = function(cell, cellData){
                var errorsData, importantErrors, others, totalNumber, cellError, numberOfErrorsOfThisType;

                others = 0;
                totalNumber = 0;
                importantErrors = dataNomenclatureMapping.managedRcodes;
                errorsData = cellData[dataNomenclatureMapping.result.errors];
                cellError = {};

                for (var errorName in errorsData){

                    if (utils.indexOf(errorName, importantErrors)){
                        numberOfErrorsOfThisType = errorsData[errorName];
                        totalNumber += numberOfErrorsOfThisType;
                        cellError[errorName] = numberOfErrorsOfThisType;
                    }else{
                        totalNumber++;
                        others++;
                    }
                    cellError["others"] = others;
                }

                cell.errors = cellError;
                cell.numberCorrectResponses = this._computeNumberCorrectResponses(cellData, totalNumber);
            };


            /**
             * Computes the percentage of correct responses
             *
             * @method _computeNumberCorrectResponses
             * @private
             * @param {Object} cellData A result/cell of the JSON input
             * @return {Number} Returns a percentage
             */

            this._computeNumberCorrectResponses = function(cellData, numberOfErrors){
                var packetLoss;

                packetLoss = cellData[dataNomenclatureMapping.result.packetSent] - (cellData[dataNomenclatureMapping.result.packetReceived] - numberOfErrors);
                packetLoss = (100 / cellData[dataNomenclatureMapping.result.packetSent]) * packetLoss;
                return packetLoss.toFixed(2);
            };

            /**
             * Computes the unanswered queries of a cell/result
             *
             * @method _computePacketLoss
             * @private
             * @param {Object} cellData A result/cell of the JSON input
             * @return {float} Returns a percentage
             */

            this._computePacketLoss = function(cellData){
                var packetLoss;
                packetLoss = cellData[dataNomenclatureMapping.result.packetSent] - cellData[dataNomenclatureMapping.result.packetReceived];

                packetLoss = (100 / cellData[dataNomenclatureMapping.result.packetSent]) * packetLoss;
                return packetLoss.toFixed(2);
            };


            /**
             * Computes the RTT of a cell/result
             *
             * @method _computeRespondingTime
             * @private
             * @param {Object} cellData A result/cell of the JSON input
             * @return {Number} Returns a RTT value
             */
            this._computeRespondingTime = function(cellData){
                var rtt, resultNomenclature;

                resultNomenclature = dataNomenclatureMapping.result;
                rtt = cellData[resultNomenclature.respondingTime];

                return (rtt) ? parseFloat(rtt).toFixed(2) : null;
            };


            /**
             * Get the DNS response data and translates it in an internal stable format
             *
             * @method getNativeDnsResult
             * @param {Number} msmId The id of the measurement
             * @param {Number} prbId The id of the probe
             * @param {Number} timestamp A UNIX timestamp
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.getNativeDnsResult = function(msmId, prbId, timestamp, callback, context){
                var nomenclatureDnsResponse;

                nomenclatureDnsResponse = {
                    probeId: "prb_id",
                    responseTime: "rt",
                    nsId: "nsid",
                    date: "timestamp",
                    response: "answer",
                    error: "error"
                };

                connector.getNativeDnsResult(msmId, prbId, timestamp, function(data){
                    var internalResponse, newData, dataItem;

                    newData = [];

                    for (var n= 0,length=data.length; n<length; n++){
                        dataItem = data[n];

                        internalResponse = { // Translate to internal object
                            probeId: dataItem[nomenclatureDnsResponse.probeId],
                            responseTime: dataItem[nomenclatureDnsResponse.responseTime] || "NA",
                            date: paramsManager.convertRemoteToLocalDate(dataItem[nomenclatureDnsResponse.date]),
                            nsId: dataItem[nomenclatureDnsResponse.nsId],
                            response: dataItem[nomenclatureDnsResponse.response],
                            error: dataItem[nomenclatureDnsResponse.error]
                        };

                        newData.push(internalResponse);
                    }

                    callback.call(context, newData);
                }, this);
            };


            /**
             * Get the closest traceroutes data and translates it in an internal stable format
             *
             * @method getClosestTraceroutes
             * @param {Number} msmId The id of the measurement
             * @param {Number} prbId The id of the probe
             * @param {Number} timestamp A UNIX timestamp
             * @param {Function} callback A function taking the retrieved data as input when it is ready
             * @param {Object} context The context of the callback
             */

            this.getClosestTraceroutes = function(msmId, prbId, timestamp, callback, context){
                var nomenclatureDnsResponse, tracerouteAtlas;

//                nomenclatureDnsResponse = {
//                    probeId: "prb_id",
//                    date: "timestamp",
//                    response: "result"
//                };

                connector.getClosestTraceroutes(msmId, prbId, timestamp, function(data){
                    var closestTraceroutes, newData, dataItem;

                    newData = [];

//                    for (var n= 0,length=data.length; n<length; n++){
//                        dataItem = data[n];+
//
//                        closestTraceroutes = { // Translate to internal object
//                            probeId: dataItem[nomenclatureDnsResponse.probeId],
//                            date: paramsManager.convertRemoteToLocalDate(dataItem[nomenclatureDnsResponse.date]),
//                            response: dataItem[nomenclatureDnsResponse.response]
//                        };
//
//                        newData.push(closestTraceroutes);
//                    }


                    for (var n=0,length=data.length; n<length; n++){
                        tracerouteAtlas = new AtlasTraceroute(data[n]);
                        tracerouteAtlas.renderTimestring = function(timestamp){
                            return '>>> ' + utils.dateToString(utils.timestampToLocalDate(timestamp));
                        };

                        newData.push(tracerouteAtlas.render());
                    }

                    callback.call(context, newData);
                }, this);
            };

        };


        return IsolationLevelConnectorAtlas;
    });
