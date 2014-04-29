define([
    "env.utils"
], function(utils){

    /**
     * Connector is in charge of connecting the data-apis and providing a JSON format to the layers over.
     *
     * @class Connector
     * @constructor
     * @module connector.Atlas
     */

    var Connector = function(env){
        var perServerDataUrl, serversDataUrl, serversDataUrl, nativeDnsResultDataUrl, closesttraceroutesDataUrl, config,
            commonServer;

        config = env.config;

        this.maxNumberOfCells = env.muxNumberOfCells || config.maxNumberOfCells;
        env.downoadedBytes = 0;

        //weir-dev
        commonServer = "https://atlas.ripe.net/dnsmon/api";

        perServerDataUrl = (typeof DNSMON_PROBES_DATA_API_URL === "undefined") ? commonServer + "/probes" : DNSMON_PROBES_DATA_API_URL;
        serversDataUrl = (typeof DNSMON_SERVERS_DATA_API_URL === "undefined") ? commonServer + "/servers" : DNSMON_SERVERS_DATA_API_URL;

        nativeDnsResultDataUrl = (typeof DNSMON_ATLAS_DATA_API_URL === "undefined") ? commonServer + "/atlas-data" : DNSMON_ATLAS_DATA_API_URL;
        closesttraceroutesDataUrl = (typeof DNSMON_ATLAS_TRACEROUTE_API_URL === "undefined") ? commonServer + "/atlas-data" : DNSMON_ATLAS_TRACEROUTE_API_URL;

        this.getDataUrl = function(params){

            utils.log('Queried for:', env.debugMode);
            utils.log(params, env.debugMode);
            var url = "";

            if (params.type == "zone-servers"){

                utils.log("Data-api type: multi-server-data", env.debugMode);

                url = serversDataUrl;
                url += (params.zone) ? "?group=" + params.zone : "";
                url += (params.selectedRows != '') ? "&servers=" + params.selectedRows : "";

                url += (!params.aggregationLevel) ? "" : "&min_aggregation=" + params.aggregationLevel;

                url += (params.startTime) ? "&start_time=" + params.startTime : "";
                url += (params.endTime) ? "&end_time=" + params.endTime : "";

                url += (!params.startTime && !params.endTime && params.timeWindow) ? "&default_time_period=" + params.timeWindow : "";

                url += (params.ipVersion) ? "&ip_version=" + params.ipVersion : "";
                url += (params.isTcp) ? "&is_tcp=" + params.isTcp : "";

                url += (env.maxNumberOfCellsPerRow) ? "&max_samples_per_row=" + env.maxNumberOfCellsPerRow : "";
                url += (this.maxNumberOfCells) ? "&max_samples=" + this.maxNumberOfCells : "";

            }else if(params.type == "server-probes"){

                utils.log("Data-api type: single-server-data", env.debugMode);

                url = perServerDataUrl
                    + "?server=" + params.server;

                url += (params.zone) ? "&group=" + params.zone : "";

                url += "&filter_probes=" + params.filterProbes;

                url += (!params.aggregationLevel) ? "" : "&min_aggregation=" + params.aggregationLevel;

                url += (params.selectedRows != "") ? "&probes=" + params.selectedRows : "";

                url += (params.startTime) ? "&start_time=" + params.startTime : "";
                url += (params.endTime) ? "&end_time=" + params.endTime : "";

                url += (!params.startTime && !params.endTime && params.timeWindow) ? "&default_time_period=" + params.timeWindow : "";

                url += (params.ipVersion) ? "&ip_version=" + params.ipVersion : "";
                url += (params.isTcp) ? "&is_tcp=" + params.isTcp : "";

                url += (env.maxNumberOfCellsPerRow) ? "&max_samples_per_row=" + env.maxNumberOfCellsPerRow : "";
                url += (this.maxNumberOfCells) ? "&max_samples=" + this.maxNumberOfCells : "";
            }

            return url;
        };


        /**
         * It is strongly dedicated to a particular data-api.
         * From top to bottom: given some data-api valid parameters, it provides a method to connect to the data-api and query for that parameters.
         * From bottom to top: provides the raw JSON to the received callback.
         *
         * @method retrieveData
         * @param {Object} params A parameters vector valid for the data-api
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.retrieveData = function(params, callback, context){
            var dataUrl, externalParams;

            externalParams = params;

            dataUrl = this.getDataUrl(externalParams);

            utils.log('Ajax call: ' + dataUrl, env.debugMode);

            $.ajax({
                dataType: "jsonp",
                url: dataUrl,
                cache : false,
                method : 'get',
                timeout : config.connectionTimeout,

                success: function(data){

                    utils.log("Data retrieved", env.debugMode);

                    if (env.debugMode){
                        env.lastDownloadBytes = utils.objectSize(data);
                        env.downoadedBytes += env.lastDownloadBytes;
                    }

                    data.type = params.type;
                    env.lastDownload = new Date();
                    callback.call(context, data);
                    delete data; // Force garbage

                },

                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    var emptyDataSet;

                    utils.log("Connection failed", env.debugMode);
                    emptyDataSet = {
                        messages: [
                            {type: "connection-fail", text: errorThrown}
                        ]
                    };

                    callback.call(context, emptyDataSet);
                }

            });

        };


        /**
         * Get the DNS response from the data-api
         *
         * @method getNativeDnsResult
         * @param {Number} msmId The id of the measurement
         * @param {Number} prbId The id of the probe
         * @param {Number} timestamp A UNIX timestamp
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getNativeDnsResult = function(msmId, prbId, timestamp, callback, context){
            var dataUrl;

            dataUrl = utils.setParam('msm_id', msmId, nativeDnsResultDataUrl);
            dataUrl = utils.setParam('prb_id', prbId, dataUrl);
            dataUrl = utils.setParam('timestamp', timestamp, dataUrl);

            utils.log('Retrieve native DNS data: '+ dataUrl, env.debugMode);

            $.ajax({
                dataType: "jsonp",
                url: dataUrl,
                success: function(data){
                    utils.log("Native DNS data retrieved", env.debugMode);

                    if (env.debugMode){
                        env.lastDownloadBytes = utils.objectSize(data);
                        env.downoadedBytes += env.lastDownloadBytes;
                    }

                    callback.call(context, data);
                    delete data; // Force garbage
                },

                fail: function(){
                    utils.log("It is not possible to retrieve native DNS data", env.debugMode);
                }
            });
        };


        /**
         * Get the closest traceroutes data from the data-api
         *
         * @method getClosestTraceroutes
         * @param {Number} msmId The id of the measurement
         * @param {Number} prbId The id of the probe
         * @param {Number} timestamp A UNIX timestamp
         * @param {Function} callback A function taking the retrieved data as input when it is ready
         * @param {Object} context The context of the callback
         */

        this.getClosestTraceroutes = function(msmId, prbId, timestamp, callback, context){
            var dataUrl;

            dataUrl = utils.setParam('msm_id', msmId, closesttraceroutesDataUrl);
            dataUrl = utils.setParam('prb_id', prbId, dataUrl);
            dataUrl = utils.setParam('timestamp', timestamp, dataUrl);
            dataUrl = utils.setParam('surrounding', config.tracerouteSurrounding, dataUrl);
            dataUrl = utils.setParam('render', "false", dataUrl);

            utils.log('Retrieve traceroute data: '+ dataUrl, env.debugMode);

            $.ajax({
                dataType: "jsonp",
                url: dataUrl,
                success: function(data){
                    utils.log("Traceroute data retrieved", env.debugMode);

                    if (env.debugMode){
                        env.lastDownloadBytes = utils.objectSize(data);
                        env.downoadedBytes += env.lastDownloadBytes;
                    }

                    callback.call(context, data);
                    delete data; // Force garbage
                },

                fail: function(){
                    utils.log("It is not possible to retrieve traceroute data", env.debugMode);
                }
            });
        };
    };

    return Connector;
});
