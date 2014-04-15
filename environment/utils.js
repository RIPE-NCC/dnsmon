define([
    "lib.date-format"
], function(){

    /**
     * A collection of utilities
     */

    return {

        addMinutes: function(date, minutes){
            return new Date(date.getTime() + (minutes * 60 * 1000));
        },

        subMinutes: function(date, minutes){
            return new Date(date.getTime() - (minutes * 60 * 1000));
        },

        translate: function(pointsArray, vector){
            var item, translatedArray;

            translatedArray = [];

            for (var n=0,length=pointsArray.length; n<length; n++){
                item = pointsArray[n];
                translatedArray.push({x: item.x + vector.x, y: item.y + vector.y});
            }
            return translatedArray;
        },

        computeColorScale: function(legend){
            var mapOut, legendItem;

            mapOut = {valueRange: [], colorRange: []};

            for (var n= 0,length=legend.length; n<length; n++){
                legendItem = legend[n];

                mapOut.valueRange =  mapOut.valueRange.concat(legendItem.valueRange);
                mapOut.colorRange =  mapOut.colorRange.concat(legendItem.colorRange);
            }
            return mapOut;
        },

        getLongestString: function(arrayOfStrings){
            var maximum, item;

            maximum = -Infinity;
            for (var n=0,length=arrayOfStrings.length; n<length; n++){
                item = arrayOfStrings[n].length;

                if (maximum < item){
                    maximum = item;
                }
            }

            return maximum;
        },

        writeSvgText: function(container, textArray, position, padding){
            var textItem, actualPosition, interline, text;

            actualPosition = 0;
            interline = 15;

            container
                .selectAll("text")
                .remove();

            for (var n= 0,length=textArray.length; n<length; n++){
                textItem = textArray[n];

                actualPosition = interline * n;

                container
                    .append("text")
                    .attr("class", "popup-text")
                    .attr("dx", position.x + padding.left)
                    .attr("dy", position.y + actualPosition + padding.top)
                    .text(textItem);
            }

            return text;
        },

        lightClone: function(toBeCloned){
            var cloned, isArray;

            isArray = toBeCloned instanceof Array;

            if (isArray){
                cloned = [];

                for (var n= 0,length=toBeCloned.length; n<length; n++){
                    cloned.push(toBeCloned[n]);
                }

            }else{
                cloned = {};

                for (var item in toBeCloned){
                    cloned[item] = toBeCloned[item];
                }
            }

            return cloned;
        },

        log: function(text){
            if (this.getUrlParam("debug_mode") == "true"){
                console.log(new Date(), text);
            }
        },

        getUrlParam: function(key){
            var regex, result, match, url;
            url = document.location.search;
            regex = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi');
            result = [];

            while ((match = regex.exec(url)) != null){
                result.push(match[1]);
            }
            return result;
        },

        indexOf: function(element, array){
            var index = -1;

            if (array.indexOf){
                index = array.indexOf(element);
            }else{

                for (var n=0, length=array.length; n<length;n++){
                    if (array[n] == element){
                        index = n;
                        break;
                    }
                }
            }
            return index;
        },

        encapsulateDom: function(jQuerySelection){
            return {$: jQuerySelection, plain: jQuerySelection[0]};
        },

        loadCss: function(cssFile){
            var newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.type = 'text/css';
            newLink.href = cssFile;
            newLink.async = true;
            document.head.appendChild(newLink);
        },

        getRectangularVertexPoints: function(x, y, width, height){
            var leftTop, leftBottom, rightTop, rightBottom;

            leftTop = {x: x, y: y};
            leftBottom = {x: x, y: y + height};

            rightTop = {x: x + width, y: y};
            rightBottom = {x: x + width, y: y + height};

            return [leftTop, rightTop, rightBottom, leftBottom]; //returned clockwise
        },

        isThereAnIntersection: function(selectionVertices, cellVertices){
            var a, b, c, d, e, f, g, h, thereIsAnIntersection, cellCenter, isSelectionStartingInARect, isSelectionEndingInARect,
                intersectionPoint;

            a = selectionVertices[0];
            b = selectionVertices[1];
            c = selectionVertices[2];
            d = selectionVertices[3];

            e = cellVertices[0];
            f = cellVertices[1];
            g = cellVertices[2];
            h = cellVertices[3];

            intersectionPoint = this.getLinesIntersection(a, b, e, h);

            function isPointInside(a, b, c, d, p){
                return p.x >= a.x && p.x <= b.x && p.y >= a.y && p.y <= d.y;
            }

            // Don't declare the single items in dedicated vars in order to calculate them only if needed
            thereIsAnIntersection =
                isPointInside(e,f,g,h, a) || //Is It starting in a rect?
                isPointInside(a,b,c,d, this.getRectangleCenter(e, f, g, h)) ||
                isPointInside(a,b,c,d, e) ||
                isPointInside(a,b,c,d, h) ||
                isPointInside(a,b,c,d, g) ||
                isPointInside(a,b,c,d, f) ||
                isPointInside(e,f,g,h, c) || //Is it ending in a rect?
                (intersectionPoint != null);

            return thereIsAnIntersection;
        },

        getLinesIntersection: function(a, b, c, d){

            /// "unroll" the objects
            var p0x = a.x,
                p0y = a.y,
                p1x = b.x,
                p1y = b.y,
                p2x = c.x,
                p2y = c.y,
                p3x = d.x,
                p3y = d.y,

            /// calc difference between the coords
                d1x = p1x - p0x,
                d1y = p1y - p0y,
                d2x = p3x - p2x,
                d2y = p3y - p2y,

            /// determinator
                d = d1x * d2y - d2x * d1y,

                px, py,
                s, t;

            /// if is not intersecting/is parallel then return immediately
            if (d == 0.0)
                return null;

            /// solve x and y for intersecting point
            px = p0x - p2x;
            py = p0y - p2y;

            s = (d1x * py - d1y * px) / d;
            if (s >= 0 && s <= 1) {

                /// if s was in range, calc t
                t = (d2x * py - d2y * px) / d;
                if (t >= 0 && t <= 1) {

                    return {x: p0x + (t * d1x),
                        y: p0y + (t * d1y)}
                }
            }

            return null;
        },

        getRectangleCenter: function(a, b, c, d){
            var x, y;
            x = ((b.x - a.x) / 2) + a.x;
            y = ((d.y - a.y) / 2) + a.y;

            return {x: x, y: y};
        },

        join: function(array, char){
            var stringOut = "";
            if (array.join){
                stringOut = array.join(char);
            }else{

                for (var n=0,length=array.length; n<length; n++){
                    stringOut += array[n];
                    if (n != length-1){
                        stringOut += '' + char;
                    }
                }
            }

            return stringOut;
        },

        logOnce: function(log){
            if (!window.once){
                window.once = true;
                this.log(log);
            }
        },

        reduceCalls: function(reductionId, reductionFactor){
            var callNow;
            callNow = false;
            if (!window.reductionCallsCounters){
                window.reductionCallsCounters = {};
            }

            if (window.reductionCallsCounters[reductionId] == null){
                window.reductionCallsCounters[reductionId] = reductionFactor;
            }

            if (window.reductionCallsCounters[reductionId] == 0){
                callNow = true;
                window.reductionCallsCounters[reductionId] = reductionFactor
            }else{
                window.reductionCallsCounters[reductionId]--;
            }

            return callNow;
        },

        timestampToUTCDate: function(timestamp){
            var date = new Date(timestamp * 1000);
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        },

        getInstanceSuffix: function(domName){
            var suffix;

            suffix = domName.replace('.', '');
            suffix = suffix.replace('#', '');

            return suffix;
        },

        getUrlParameters: function(domName) { // Get a map composed of ALL the parameters
            var map, suffix, parts, subElements, atLeastOne;

            map = {};
            atLeastOne = false;
            suffix = this.getInstanceSuffix(domName) + '.';

            parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {

                key = key.toString().replace(suffix, ''); // Creates the map removing the suffix

                if (key.indexOf('.') != -1){
                    subElements = key.split('.');
                    if (!map[subElements[0]]){
                        map[subElements[0]] = {};
                    }
                    map[subElements[0]][subElements[1]] = value;
                }else{
                    map[key] = value;
                }

                atLeastOne = true;
            });

            return (atLeastOne) ? map : null;
        },

        mergeMaps: function(map1, map2){
            var mapOut;

            mapOut = {};

            for (var key in map1){
                mapOut[key] = map1[key];
            }

            for (var key in map2){
                mapOut[key] = map2[key];
            }

            return mapOut;
        },

        isNumber: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        dateToString: function(date){ //This is an indirection, may be useful in the future to manipulate dates
            return "" + date.getUTCFullYear() +
                "-" + ('0' + (date.getUTCMonth() + 1)).slice(-2) +
                "-" + ('0' + date.getUTCDate()).slice(-2) +
                " " + ('0' + date.getUTCHours()).slice(-2) +
                ":" + ('0' + date.getUTCMinutes()).slice(-2) +
                ":" + ('0' + date.getUTCSeconds()).slice(-2) +
                " UTC";
        },

        dateToStringShort: function(date){ //This is an indirection, may be useful in the future to manipulate dates
            return "" + date.getUTCFullYear() +
                "-" + ('0' + (date.getUTCMonth() + 1)).slice(-2) +
                "-" + ('0' + date.getUTCDate()).slice(-2) +
                " " + ('0' + date.getUTCHours()).slice(-2) +
                ":" + ('0' + date.getUTCMinutes()).slice(-2);
        },

        timestampToLocalDate: function(timestamp){
            var date;
            date = new Date(timestamp * 1000);
            return date;
        },

        localDateToUTCDate: function(date){
            var utcDate;

            utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

            return utcDate;
        },

        UTCDateToLocalDate: function(date){
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),  date.getHours(), date.getMinutes(), date.getSeconds()));
        },

        dateToUTCTimestamp: function(date){
            return Math.ceil(date.getTime()/1000);
//            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),  date.getHours(), date.getMinutes(), date.getSeconds())).getTime()/1000;
        },

        callCallbacks: function(list, parameters){
            var item;

            for (var n=0,length=list.length; n<length; n++){
                item = list[n];
                item.call(this, parameters);
            }
        },

        getCurrentUrl: function(){
            return window.location.href;
        },

        setParam: function(key, value, url){
            var baseUrl, paramsUrl, pair, query, pairs, keyTmp, valueTmp, newPairs, inserted, questionMarkPosition,
                itemUrl;

            newPairs = [];
            inserted = false;

            if (url){
                questionMarkPosition = url.indexOf('?');
                if (questionMarkPosition == -1){
                    baseUrl = url;
                    paramsUrl = '';
                }else{
                    baseUrl = url.substring(0, questionMarkPosition);
                    paramsUrl = url.substring(questionMarkPosition + 1, url.length);
                }
            }else{
                baseUrl = '';
                paramsUrl = '';
            }

            pairs = paramsUrl.split('&');

            for(var n=0,length=pairs.length; n<length;n++){
                itemUrl = pairs[n];

                if (itemUrl != ""){
                    pair = (itemUrl).split('=');

                    keyTmp = pair[0];
                    valueTmp = pair[1];

                    if (keyTmp == key){
                        if (value != null && value != '') {
                            newPairs.push(keyTmp + "=" + value);
                        }
                        inserted = true;
                    }else{
                        newPairs.push(keyTmp + "=" + valueTmp);
                    }
                }
            }

            if (!inserted){
                if (value != null && value != ""){
                    newPairs.push(key + "=" + value);
                }
            }

            query = this.join(newPairs, '&');

            return baseUrl + '?' + query;
        }

    };

});