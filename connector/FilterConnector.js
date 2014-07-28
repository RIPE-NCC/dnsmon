/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/16/13
 * Time: 4:38 PM
 * To change this template use File | Settings | File Templates.
 */

var FilterConnector = function(environment){

    var connector;

    connector = new AntiFloodConnector(environment);


    this.retrieveData = function(params, callback, context){


        //Just an indirection for now
        connector.retrieveData(params, function(data){


            var filteredData = this._filter(data);
            callback.call(context, filteredData);

        }, this);

    };

    this._filter = function(data){
        var filteredData = {};

        return data;
    };


};