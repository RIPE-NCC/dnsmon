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
        var perServerDataUrl, serversDataUrl, serversDataUrl, nativeDnsResultDataUrl, closesttraceroutesDataUrl, config;

        config = env.config;

        this.maxNumberOfCells = env.muxNumberOfCells || config.maxNumberOfCells;

        //weir-dev
        perServerDataUrl = (typeof DNSMON_PROBES_DATA_API_URL === "undefined") ? "https://weir-dev.atlas.ripe.net/dnsmon/api/probes" : DNSMON_PROBES_DATA_API_URL;
        serversDataUrl = (typeof DNSMON_SERVERS_DATA_API_URL === "undefined") ? "https://weir-dev.atlas.ripe.net/dnsmon/api/servers" : DNSMON_SERVERS_DATA_API_URL;

        nativeDnsResultDataUrl = (typeof DNSMON_ATLAS_DATA_API_URL === "undefined") ? "https://weir-dev.atlas.ripe.net/dnsmon/api/atlas-data" : DNSMON_ATLAS_DATA_API_URL;
        closesttraceroutesDataUrl = (typeof DNSMON_ATLAS_TRACEROUTE_API_URL === "undefined") ? "https://weir-dev.atlas.ripe.net/dnsmon/api/atlas-data" : DNSMON_ATLAS_TRACEROUTE_API_URL;

        this.getDataUrl = function(params){

            utils.log(params);
            var url = "";

            if (params.type == "zone-servers"){

                utils.log("multi-server-data");

                url = serversDataUrl;
                url += (params.zone) ? "?group=" + params.zone : "";
                url += (params.selectedRows.length > 0) ? "&servers=" + utils.join(params.selectedRows, ",") : "";

                //url += (!env.aggregationLevel) ? "" : "&min_aggregation=" + env.aggregationLevel;

                url += (params.startTime) ? "&start_time=" + params.startTime : "";
                url += (params.endTime) ? "&end_time=" + params.endTime : "";

//                url += (!params.startTime && !params.endTime && env.timeWindowSeconds && env.retrievedAggregationLevel != null && !params.timeWindow) ? "&default_time_period=" + (env.timeWindowSeconds + env.retrievedAggregationLevel - 1): "";
                url += (!params.startTime && !params.endTime && params.timeWindow) ? "&default_time_period=" + params.timeWindow : "";

                url += (params.ipVersion) ? "&ip_version=" + params.ipVersion : "";
                url += (params.isTcp) ? "&is_tcp=" + params.isTcp : "";

                url += (env.maxNumberOfCellsPerRow) ? "&max_samples_per_row=" + env.maxNumberOfCellsPerRow : "";
                url += (this.maxNumberOfCells) ? "&max_samples=" + this.maxNumberOfCells : "";

            }else if(params.type == "server-probes"){

                utils.log("single-server-data");

                url = perServerDataUrl
                    + "?server=" + params.server;

                url += (params.zone) ? "&group=" + params.zone : "";

                url += "&filter_probes=" + params.filterProbes;

                //url += (!env.aggregationLevel) ? "" : "&min_aggregation=" + env.aggregationLevel;

                url += (params.selectedRows.length > 0) ? "&probes=" + utils.join(params.selectedRows, ",") : "";

                url += (params.startTime) ? "&start_time=" + params.startTime : "";
                url += (params.endTime) ? "&end_time=" + params.endTime : "";

//                url += (!params.startTime && !params.endTime && env.timeWindowSeconds && env.retrievedAggregationLevel != null && !params.timeWindow) ? "&default_time_period=" + (env.timeWindowSeconds + env.retrievedAggregationLevel - 1): "";
                url += (!params.startTime && !params.endTime && params.timeWindow) ? "&default_time_period=" + params.timeWindow : "";

                url += (params.ipVersion) ? "&ip_version=" + params.ipVersion : "";
                url += (params.isTcp) ? "&is_tcp=" + params.isTcp : "";

                url += (env.maxNumberOfCellsPerRow) ? "&max_samples_per_row=" + env.maxNumberOfCellsPerRow : "";
                url += (this.maxNumberOfCells) ? "&max_samples=" + this.maxNumberOfCells : "";
            }

            //url += (env.params.random) ? "&random=true" : "";
//        url += "&debug_levels=0,3600,86400,2592000";

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

            utils.log(dataUrl);

            $.ajax({
                dataType: "jsonp",
                url: dataUrl,
                cache : false,
                method : 'get',
                timeout : 30000, // 30 secs of timeout FOR NOW

                success: function(data){

                    utils.log("Data retrieved");
                    data.type = params.type;
                    env.lastDownload = new Date();
                    callback.call(context, data);
                    delete data; // Force garbage
                },

                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    var emptyDataSet;

                    utils.log("Connection failed");
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

            utils.log('Retrieve native DNS data: '+ dataUrl);

            $.ajax({
                dataType: "jsonp",
                url: dataUrl,
                success: function(data){
                    utils.log("Native DNS data retrieved");
                    callback.call(context, data);
                    delete data; // Force garbage
                },

                fail: function(){
                    utils.log("It is not possible to retrieve native DNS data");
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

            utils.log('Retrieve traceroute data: '+ dataUrl);

            $.ajax({
                dataType: "jsonp",
                url: dataUrl,
                success: function(data){
                    utils.log("Traceroute data retrieved");
                    callback.call(context, data);
                    delete data; // Force garbage
                },

                fail: function(){
                    utils.log("It is not possible to retrieve traceroute data");
                }
            });
        };
    };

    return Connector;
});
