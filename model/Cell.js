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

define(["dnsmon.env.utils"], function(utils){

    /**
     * Cell is the model object for a cell.
     *
     * @class Cell
     * @constructor
     * @module model
     */

    var Cell = function(row, time){

        this.row = row;

        this.time = time;

        this.id = this.getId();

        this.optional = {};
    };


    /**
     * This method returns the packet loss of this cell
     *
     * @method getPacketLoss
     * @return {Number} A percentage
     */

    Cell.prototype.getPacketLoss = function(){
        return this.loss;
    };


    /**
     * This method returns the errors of the dns response of this cell
     *
     * @method getErrors
     * @return {Object} A Map of errors
     */

    Cell.prototype.getErrors = function(){
        return this.errors;
    };


    /**
     * This method returns the number of the correct dns responses of this cell
     *
     * @method getNumberCorrectResponses
     * @return {Number} The number of the correct responses
     */

    Cell.prototype.getNumberCorrectResponses = function(){
        return this.numberCorrectResponses;
    };


    /**
     * This method returns the response time of this cell
     *
     * @method getResponseTime
     * @return {Number} An amount of milliseconds
     */

    Cell.prototype.getResponseTime = function(){
        return this.respondingTime;
    };


    /**
     * This method returns the relative response time of this cell.
     * The relative response time is the percentage of increase from the minimum response time of the cell's row.
     *
     * @method getRelativeResponseTime
     * @return {Number} A percentage
     */

    Cell.prototype.getRelativeResponseTime = function(){
        return (this.respondingTime == null) ? null : (((this.respondingTime - this.row.minimumResponseTime) / this.row.minimumResponseTime) * 100);
    };


    /**
     * This method returns the unique ID of this cell
     *
     * @method getId
     * @return {String} A unique ID
     */

    Cell.prototype.getId = function(){
        return "" + this.row.id + "_" + this.time.getTime();
    };


    /**
     * This method returns a string describing this cell
     *
     * @method toString
     * @return {String} A string describing this cell
     */

    Cell.prototype.toString = function(){
        var string = "";

        if (this.respondingTime) {
            string += "RTT: " + this.respondingTime + "<br>";
        }

        string += "Packet Loss: " + this.loss;

        return string;
    };


    /**
     * This method returns an array of strings describing this cell in a multi-line way
     *
     * @method toArrayString
     * @return {Array} An array of strings
     */

    Cell.prototype.toArrayString = function(){
        var stringArray, type;

        stringArray = [];

        switch(this.row.___type___){

            case "server":
                type = "Server: ";
                break;

            case "probe":
                type = "Probe: ";
                break;
        }

        stringArray.push(type + this.row.label);
        if (this.endTime){
            stringArray.push("From " + utils.dateToString(this.time));
            stringArray.push("To " + utils.dateToString(this.endTime));
        }else{
            stringArray.push("At " + utils.dateToString(this.time));
        }

        stringArray.push('RTT' + ((this.sent == 1) ? '' : ' (median)') + ': ' +((this.respondingTime) ? this.respondingTime + ' ms' : 'NA'));
        stringArray.push("Queries sent: " + this.sent);
        stringArray.push("Unanswered queries: " + this.loss + "%");

        if (this.errors["ServFail"]) stringArray.push("\"ServFail\" errors: " + this.errors["ServFail"]);
        if (this.errors["NXDomain"]) stringArray.push("\"NXDomain\" errors: " + this.errors["NXDomain"]);
        if (this.errors["Refused"]) stringArray.push("\"Refused\" errors: " + this.errors["Refused"]);
        if (this.errors["others"]) stringArray.push("Other errors: " + this.errors["others"]);
        return stringArray;
    };

    return Cell;
});

