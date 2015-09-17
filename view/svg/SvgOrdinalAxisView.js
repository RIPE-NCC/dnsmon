
define([
    "dnsmon.lib.d3",
    "dnsmon.lib.jquery-libs-amd"
], function(d3, $){

    /**
     * SvgOrdinalAxisView is the view component representing the y-axis in SVG terms.
     * It provides additional functions to manage interactions with the y elements.
     *
     * @class SvgOrdinalAxisView
     * @constructor
     * @module view.svg
     */

    var SvgOrdinalAxisView = function(container, options){
        var onMouseOverCallbacks, onMouseOutCallbacks, onClickCallbacks, $this, uniqueGroups, groupsRepresentation,
            axisTooltip, groupsCount;

        $this = this;
        onMouseOverCallbacks = [];
        onMouseOutCallbacks = [];
        onClickCallbacks = [];
        groupsRepresentation = {};
        groupsCount = {};

        this.magnetValues = options.magnetValues;

        this.descriptions = options.descriptions;

        this.groups = options.groups;

        this.displayGroupBlocks = options.displayGroupBlocks;

        this.orient = options.orient;

        this.container = container;

        this.range = options.range;

        this.domain = options.domain;

        this.parent = this.container.svg.append('g');


        this._computeGroupsColors = function(){
            if (this.displayGroupBlocks && this.groups){
                uniqueGroups = [];
                $.each(this.groups, function(i, el){
                    if($.inArray(el, uniqueGroups) === -1) uniqueGroups.push(el);
                });


                this.colors = (uniqueGroups.length <= 10) ? ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"] : ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];
            }
        };


        this._getColorForGroup = function(group){
            var colorIndex;

            colorIndex = uniqueGroups.indexOf(group);
            return this.colors[colorIndex] || this._generateRandomColor();
        };


        this._generateRandomColor = function(){
            var letters, color;

            letters = '0123456789ABCDEF'.split('');
            color = '#';

            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.round(Math.random() * 15)];
            }

            return color;
        };


        this.setRange = function(range){
            this.range = range;
            this.update();
        };

        this.setDomain = function(domain, magnetValues, descriptions, groups){
            this.domain = domain;

            if (magnetValues){
                this.magnetValues = magnetValues;
            }

            if (descriptions){
                this.descriptions = descriptions;
            }

            if (groups){
                this.groups = groups;
            }

            this.update();
        };

        this.render = function(){
            this._computeGroupsColors();
            this._buildFunction();
            this.parent.call(this.axisFunction);
            this._initOnClick();
            this._initOnMouseOver();
            this._initOnMouseOut();

            axisTooltip = $('<div></div>')
                .addClass('dnsmon-tooltip')
                .addClass('custom-jquery-ui-tooltip').hide();
            container.dom.$.append(axisTooltip);

            this._initTooltips();
        };

        this._initTooltips = function(){
            container.dom.$
                .find(".y.axis text")
                .off("mousemove")
                .off("mouseout")
                .on("mousemove", function(evt){
                    axisTooltip.show();
                    axisTooltip
                        .html(d3.select(this).attr('label'))
                        .css({
                            "top" : evt.clientY + 13,
                            "left" : evt.clientX
                        });
                })
                .on("mouseout", function(evt){

                    axisTooltip.hide();
                });
        };

        this.update = function(){
            this._computeGroupsColors();
            this._buildFunction();
            this.parent.call(this.axisFunction);

            this._initOnClick();
            this._initOnMouseOver();
            this._initOnMouseOut();
            this._initTooltips();
        };


        this._buildFunction = function(){
            var scale;

            if (this.orient == 'left'){
                this.margin = {
                    left: this.container.chart.margin.left,
                    right: 0,
                    top: this.container.chart.margin.top,
                    bottom: 0
                };
            }else{
                this.margin = {
                    left: this.container.chart.margin.left,
                    right: 0,
                    top: this.container.height() - this.container.chart.margin.bottom,
                    bottom: this.container.chart.margin.bottom
                };
            }

            scale = d3.scale
                .ordinal()
                .domain(this.domain())
                .rangeRoundBands(this.range(), options.offset, 0);


            scale.invert = function(x) {
                var domainElements, domainElement, inverseElementPosition, lastDomainElement;
                domainElements = this.domain();

                lastDomainElement = domainElements[0];

                for (var n=0,length=domainElements.length; n<length; n++){
                    domainElement = domainElements[n];

                    inverseElementPosition = scale(domainElement);
                    if (inverseElementPosition >= x){
                        break;
                    }

                    lastDomainElement = domainElement;
                }
                return lastDomainElement;
            };

            this.scale = scale;

            this.axisFunction = d3.svg
                .axis()
                .scale(this.scale);

            if ($this.displayGroupBlocks && $this.groups){
                for (var group in groupsRepresentation){
                    if (groupsRepresentation[group]){
                        groupsRepresentation[group].remove();
                        groupsRepresentation[group] = null;
                    }
                }
            }

            this.axisFunction
                .orient(this.orient)
                .tickSize(0)
                .tickFormat(function(d){
                    var thisElement, thisParentNode;
                    thisElement = d3.select(this);
                    thisParentNode = d3.select(this.parentNode);

                    if ($this.magnetValues){
                        thisElement.attr("magnet", $this.magnetValues[d.replace(" ", "_")]);
                    }

                    if ($this.descriptions){
                        thisElement.attr("label", $this.descriptions[d.replace(" ", "_")]);
                    }


                    if ($this.displayGroupBlocks && $this.groups){ // Draw group blocks
                        var group = $this.groups[d.replace(" ", "_")];

                        if (!groupsRepresentation[group]){

                            groupsCount[group] = 1;
                            groupsRepresentation[group] = thisParentNode
                                .append("svg:rect")
                                .attr("width", 4)
                                .attr("y", -$this.scale.rangeBand()/2)
                                .attr("x", -container.chart.margin.left + 1)
                                .attr("height", $this.scale.rangeBand())
                                .attr("stroke-width", 1)
                                .attr("title", group)
                                .attr("shape-rendering", "crispEdges")
                                .style("fill", function(d){
                                    return $this._getColorForGroup(group);
                                });
                        }else{
                            groupsCount[group] ++;
                            groupsRepresentation[group]
                                .attr("height", function(){
                                    return groupsCount[group] * ($this.scale.rangeBand() + ($this.scale.rangeBand()/2));
                                });

                        }
                    }

                    if (options.grid == true){
                        thisParentNode
                            .append("rect")
                            .attr("width", 500)
                            .attr("height", 1)
                            .attr("y", $this.scale.rangeBand()/2);
                    }
                    return d;
                });

            this.parent
                .attr("class", "y axis")
                .attr('transform', 'translate(' + this.margin.left + ', ' + this.margin.top+ ')');
        };

        this.getSubDomain = function(selection){
            var startElement, stopElement, domainElements, domainElement, subDomain, insideSubDomain, start, stop;

            subDomain = [];

            start = selection[0];
            stop = selection[1];

            startElement = this.scale.invert(start);

            stopElement = this.scale.invert(stop);

            domainElements = this.domain();

            insideSubDomain = false;

            for (var n=0,length=domainElements.length; n<length; n++){
                domainElement = domainElements[n];


                if (domainElement == startElement || insideSubDomain == true){
                    insideSubDomain = true;
                    subDomain.push(domainElement);
                }

                if (domainElement == stopElement){
                    insideSubDomain = false;
                    break;
                }
            }

            if (subDomain.length == 2 && subDomain[0] == subDomain[1]){
                subDomain = [subDomain[0]];
            }
            return subDomain;
        };

        this.onClick = function(callback){
            onClickCallbacks.push(callback);
        };

        this.onMouseOver = function(callback){
            onMouseOverCallbacks.push(callback);
        };

        this.onMouseOut = function(callback){
            onMouseOutCallbacks.push(callback);
        };

        this._initOnClick = function(){
            container.dom.$
                .find(".y.axis text")
                .off("click")
                .on("click", function(evt){

                    var callback, context;
                    for(var n=0,length=onClickCallbacks.length; n<length; n++){

                        callback = onClickCallbacks[n];
                        context = this;

                        callback.call(context, evt);
                    }

                });
        };


        this._initOnMouseOver = function(){
            container.dom.$
                .find(".y.axis text")
                .off("mouseover")
                .on("mouseover", function(evt){
                    var callback, context;
                    for(var n=0,length=onMouseOverCallbacks.length; n<length; n++){

                        callback = onMouseOverCallbacks[n];
                        context = this;

                        callback.call(context, evt);
                    }
                });
        };

        this._initOnMouseOut = function(){
            container.dom.$
                .find(".y.axis text")
                .off("mouseout")
                .on("mouseout", function(evt){
                    var callback, context;
                    for(var n=0,length=onMouseOutCallbacks.length; n<length; n++){

                        callback = onMouseOutCallbacks[n];
                        context = this;

                        callback.call(context, evt);
                    }
                });
        };


        this.container.updateList.push({update: this.update, context: this});

    };

    return SvgOrdinalAxisView;
});


