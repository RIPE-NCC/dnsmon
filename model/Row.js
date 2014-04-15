/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/17/13
 * Time: 11:45 AM
 * To change this template use File | Settings | File Templates.
 */

define([], function(){

    /**
     * Row is the model object for a row.
     *
     * @class Row
     * @constructor
     * @module model
     */

    var Row = function(id, label){
        this.id = id;
        this.label = label;
        this.cells = [];

        this.group = "";

        this.minimumResponseTime = null;
        this.measurementId = null;
    };

    return Row;
});