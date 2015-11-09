/**
 * Created by mcandela on 23/01/14.
 */

define([
    "dnsmon.env.utils",
    "dnsmon.connector.anti-flood",
    "dnsmon.env.params-manager",
    "dnsmon.connector.log-connector"
], function(utils, Connector, paramsManager, LogRestConnector){

    /**
     * ConnectorFacade is the singleton Facade of the whole connector level.
     * It provides high-level connectivity functions able to receive as input model objects and converting
     * them in low-level parameters.
     *
     * @class ConnectorFacade
     * @constructor
     * @module connector
     */

    var ConnectorFacade = function(env){
        var connector, indexedRows, logConnector;

        connector = new Connector(env);
        logConnector = new LogRestConnector(env);


        /**
         * From top to bottom: it provides a way to query the data-api with the current valid parameters.
         *
         * @method retrieveData
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.retrieveData = function(callback, context){

            env.lastRequest = new Date();
            indexedRows = null;
            connector.retrieveData(env.params, function(data){
                this.rows = data.rows;
                this.group = data.group;

                env.lastUpdate = new Date();
                if (callback){
                    callback.call(context, data);
                }
            }, this);


        };

        /** Get all the rows
         *
         * @method getRows
         * @return {Array} A list of rows
         */

        this.getRows = function(){
            if (!this.rows){
                this.retrieveData();
            }

            return this.rows;
        };


        /** Get a row given an id
         *
         * @method getRowById
         * @param {Number} id An id
         * @return {Object} A row of the model layer
         */

        this.getRowById = function(id){
            var rows, row;

            if (!indexedRows){

                rows = this.getRows();
                indexedRows = {};

                for (var n=0,length=rows.length; n<length; n++){
                    row = rows[n];
                    indexedRows[row.id] = row;
                }

            }
            return indexedRows[id];
        };


        /** Get the group of the last query
         *
         * @method getGroup
         * @return {Object} A group
         */

        this.getGroup = function(){
            return this.group;
        };


        /** Get additional data-api URLs given a cell
         *
         * @method getCellDataUrls
         * @param {Object} cell A cell object
         * @return {Object} A map of URLs for the selected sample
         */

        this.getCellDataUrls = function(cell){
            var listSampleUrls, urlTmp, row;

            row = cell.row;
            listSampleUrls = row.urlsMap.sample;

            for (var n=0,length=listSampleUrls.length; n<length; n++){
                urlTmp = listSampleUrls[n];

                urlTmp.url = utils.setParam('format', 'json', urlTmp.url);

                if (row.___type___ == "probe"){
                    urlTmp.url = utils.setParam('prb_id', paramsManager.convertLocalToRemoteId(row.id), urlTmp.url);
                }

                urlTmp.url = utils.setParam('start', paramsManager.convertLocalToRemoteDate(cell.time), urlTmp.url);

                if (cell.endTime){
                    urlTmp.url = utils.setParam('stop', paramsManager.convertLocalToRemoteDate(cell.endTime), urlTmp.url);
                }else{
                    urlTmp.url = utils.setParam('stop', paramsManager.convertLocalToRemoteDate(new Date(cell.time.getTime() + (env.retrievedAggregationLevel * 1000))), urlTmp.url);
                }
            }

            return listSampleUrls;
        };


        /** Get the url of the probes page
         *
         * @method getProbesPageUrl
         * @param {Number} probeId The id of the probe
         * @param {Object} params A parameters vector
         * @return {String} An URL
         */

        this.getProbesPageUrl = function(probeId, params){
            var row = this.getRowById(probeId);

            return row.url;
            //return 'https://atlas.ripe.net/dnsmon/probes/' + paramsManager.convertLocalToRemoteId(probeId)+ '?zone=' + paramsManager.convertLocalToRemoteId(params.root);
        };


        /** Get additional data-api URLs given a cell
         *
         * @method getDataUrls
         * @param {Object} cell A cell object
         * @return {Object} A map of URLs for the whole time window
         */

        this.getDataUrls = function(cell){
            var listOverviewUrls, urlTmp, row;

            row = cell.row;
            listOverviewUrls = row.urlsMap.overview;

            for (var n=0,length=listOverviewUrls.length; n<length; n++){
                urlTmp = listOverviewUrls[n];

                urlTmp.url = utils.setParam('format', 'json', urlTmp.url);

                if (row.___type___ == "probe"){
                    urlTmp.url = utils.setParam('prb_id', paramsManager.convertLocalToRemoteId(row.id), urlTmp.url);
                }
            }

            return listOverviewUrls;
        };


        /** Get the DNS response, in a human readable format, given a cell
         *
         * @method getNativeDnsResult
         * @param {Object} cell A cell object
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getNativeDnsResult = function(cell, callback, context){
            var msmId, prbId, timestamp;

            msmId = this._getMeasurementId(cell);
            if (msmId) {
                prbId = paramsManager.convertLocalToRemoteId(cell.row.id);
                timestamp = paramsManager.convertLocalToRemoteDate(cell.time);
                connector.getNativeDnsResult(msmId, prbId, timestamp, callback, context);
            } else {
                throw "No DNS results collected for this measurement";
            }
        };


        /** Get the closest traceroutes given a cell
         *
         * @method getClosestTraceroutes
         * @param {Object} cell A cell object
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getClosestTraceroutes = function(cell, callback, context){
            var msmId, prbId, timestamp, measurementType;

            measurementType = "traceroute";

            msmId = this._getMeasurementIdByType(cell, measurementType);
            if (msmId){
                prbId = paramsManager.convertLocalToRemoteId(cell.row.id);
                timestamp = paramsManager.convertLocalToRemoteDate(cell.time);
                connector.getClosestTraceroutes(msmId, prbId, timestamp, callback, context);
            } else {
                throw "No traceroutes collected for this measurement";
            }
        };

        /**
         * Get the closest hostname.bind and checks errors
         *
         * @method getClosestHostnameBind
         * @param {Object} cell A cell object
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getClosestHostnameBind = function(cell, callback, context){
            var msmId, prbId, timestamp, measurementType;

            measurementType = "hostname_bind";
            msmId = this._getMeasurementIdByType(cell, measurementType);

            if (msmId){
                prbId = paramsManager.convertLocalToRemoteId(cell.row.id);
                timestamp = paramsManager.convertLocalToRemoteDate(cell.time);

                // No errors checks for now
                connector.getClosestHostnameBind(msmId, prbId, timestamp, callback, context);
            } else {
                throw "No traceroutes collected for this measurement";
            }
        };



        /** Get the measurement id given a cell
         *
         * @method _getMeasurementId
         * @private
         * @param {Object} cell A cell object
         * @return {String} The measurement id
         */

        this._getMeasurementId = function(cell){
            var dataUrls, urlItem;

            dataUrls = this.getDataUrls(cell);

            for (var n=0,length=dataUrls.length; n<length; n++){
                urlItem = dataUrls[n];
                if (urlItem.current == true){
                    return urlItem.measurementId;
                }
            }

            return null;
        };


        /** Get the DNS response, in a human readable format, given a cell
         *
         * @method _getMeasurementIdByType
         * @private
         * @param {Object} cell A cell object
         * @param {String} type A valid type
         * @return {Number} The measurement id
         */

        this._getMeasurementIdByType = function(cell, type){
            var dataUrls, urlItem;

            dataUrls = this.getDataUrls(cell);

            for (var n=0,length=dataUrls.length; n<length; n++){
                urlItem = dataUrls[n];

                if (urlItem.type == type){
                    return urlItem.measurementId;
                }
            }

            return null;
        };


        /** Sends logs to the servers
         *
         * @method persistLog
         * @param {String} type The type of the log
         * @param {String} log The body of the log
         */

        this.persistLog = function(type, log){
            var browserVersion;

            if (env.config.persistLog) {
                browserVersion = utils.getBrowserVersion();
                logConnector.log(type, log + ' (browser: ' + browserVersion.name + ' ' + browserVersion.version.toString() + ')');
            }

        };


        /** Sends errors to the servers
         *
         * @method persistError
         * @param {String} type The type of the error
         * @param {String} log The body of the error
         */

        this.persistError = function(type, log){
            var browserVersion;

            if (env.config.persistErrors) {
                browserVersion = utils.getBrowserVersion();
                logConnector.error(type, log + ' (browser: ' + browserVersion.name + ' ' + browserVersion.version.toString() + ', codeVersion: ' + env.version + ')');
            }

        };

    };

    return ConnectorFacade;
});