
define([
    "dnsmon.lib.d3"
], function(d3){

    /**
     * SvgTimeAxisView is the view component representing the x-axis in SVG terms.
     * It provides additional functions to manage interactions with the x elements.
     *
     * @class SvgTimeAxisView
     * @constructor
     * @module view.svg
     */

    var SvgTimeAxisView = function(container, options){

        this.orient = options.orient;

        this.container = container;

        this.range = options.range;

        this.domain = options.domain;

        this.parent = this.container.svg.append('g');

        this.setRange = function(range){
            this.range = range;
            this.update();
        }

        this.setDomain = function(domain){
            this.domain = domain;
            this.update();
        }

        this.render = function(){
            this._buildFunction();
            this.parent.call(this.axisFunction);
            this._rotate();
        };

        this.update = function(){
            this._buildFunction();
            this.parent.call(this.axisFunction);
            this._rotate();
        };

        this._buildFunction = function(){
            this.scale = d3
                .time
                .scale
                .utc()
                .domain(this.domain())
                .range(this.range());

            this.axisFunction = d3.svg
                .axis()
                .scale(this.scale)
                .tickFormat(this.timeFormat)
                .ticks(20);

            this.axisFunction
                .orient(this.orient);

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


            this.parent
                .attr("class", "x axis")
                .attr('transform', 'translate(' + this.margin.left + ', ' + this.margin.top+ ')');
        };

        this._rotate = function(){
            this.parent.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr('transform', 'rotate(-65)');
        };


        this.getSubDomain = function(newRange){
            return newRange.map(this.scale.invert).sort(d3.ascending);
        };

        this.timeFormat = d3.time.format.utc.multi([
            [".%L", function(d) { return d.getUTCMilliseconds(); }],
            [":%S", function(d) { return d.getUTCSeconds(); }],
            ["%H:%M", function(d) { return d.getUTCMinutes(); }],
            ["%H:%M", function(d) { return d.getUTCHours(); }],
            ["%Y-%m-%d", function(d) { return d.getUTCDay() && d.getUTCDate() != 1; }],
            ["%Y-%m-%d", function(d) { return d.getUTCDate() != 1; }],
            ["%Y-%m-%d", function(d) { return d.getUTCMonth(); }],
            ["%Y", function() { return true; }]
        ]);

        this.container.updateList.push({update: this.update, context: this});

    };

    return SvgTimeAxisView;
});


