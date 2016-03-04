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