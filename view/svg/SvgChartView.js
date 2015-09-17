/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/16/13
 * Time: 4:25 PM
 * To change this template use File | Settings | File Templates.
 */

define([
    "dnsmon.env.utils",
    "dnsmon.env.config",
    "dnsmon.lib.jquery-libs-amd",
    "dnsmon.lib.d3"
], function(utils, config, $, d3){

    /**
     * SvgChartView is the view component representing the chart in SVG terms
     *
     * @class SvgChartView
     * @constructor
     * @module view.svg
     */

    var SvgChartView = function(container, margins, options) {
        var jqueryDom, $this, padding, lineFunction, duration, chartMaxHeight, chartMinHeight, cellsMinHeight,
            cellsMaxHeight, maxHeight, minHeight;

        $this = this;

        this.margin = margins;

        padding = options.trackerPadding;
        maxHeight = options.maxHeight;
        minHeight = options.minHeight;
        duration = options.animationDuration || 0;

        lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        this.width = function() {
            return container.width() - (this.margin.left + this.margin.right);
        };

        this.height = function() {
            return container.height() - (this.margin.top + this.margin.bottom);
        };

        chartMaxHeight = maxHeight;
        chartMinHeight = minHeight;

        cellsMinHeight = config.cellsMinHeight;
        cellsMaxHeight = config.cellsMaxHeight;

        this.computeBestHeight = function(numberOfRows){
            var totalCellsMinHeight, totalCellsMaxHeight, height, residualSpace;

            totalCellsMinHeight = numberOfRows * cellsMinHeight;
            totalCellsMaxHeight = numberOfRows * cellsMaxHeight;

            if (totalCellsMaxHeight <= chartMinHeight){
                height = chartMinHeight;
            }else if (totalCellsMaxHeight >= chartMaxHeight){
                height = chartMaxHeight;
            }else{
                residualSpace = (chartMaxHeight - totalCellsMaxHeight);
                height = Math.min(Math.max((Math.log(residualSpace) + totalCellsMinHeight), chartMinHeight), chartMaxHeight);
            }

            height = Math.min(height, chartMaxHeight);
            height = Math.max(height, chartMinHeight);

            return height;
        };

        this.chartSelectorVertical = container.svg
            .append("rect")
            .attr("class", config.domClasses.chartSelectorVertical)
            .attr("fill", config.style.chartBackground)
            .attr("x", margins.left)
            .attr("y", margins.top)
            .style("stroke", config.style.selectorRectColor)
            .style("shape-rendering", "crispEdges")
            .attr("height", $this.height());

        this.timeBoundaries = container.svg
            .append("path")
            .attr("class", "cone-time-boundaries");

        this.svg = container.svg
            .append("g")
            .attr("class", config.domClasses.chartDom)
            .attr("transform", "translate(" + margins.left + ", " + margins.top + ")");

        this.trackerBackground = this.svg
            .append("svg:rect")
            .attr("class", "selectionTracker")
            .attr("fill", config.style.chartBackground)
            .attr("opacity", 0)
            .attr("transform", "translate(-" + padding + ", -" + padding + ")")
            .attr("width", $this.width() + padding + padding)
            .attr("height", $this.height() + padding + padding);

        jqueryDom = $("." + config.domClasses.chartDom);

        this.dom = utils.encapsulateDom(jqueryDom);

        this.update = function(){
            this.svg
                .transition()
                .duration(duration)
                .attr("height", $this.height())
                .attr("width", $this.width());

            this.chartSelectorVertical
                .attr("height", $this.height());

            this.trackerBackground
                .attr("width", $this.width() + padding + padding)
                .attr("height", $this.height() + padding + padding);

        };

        this.updateBoundaries = function(points){
            this.timeBoundaries
                .attr("d", lineFunction([
                    {x: margins.left, y: $this.height() + margins.top},
                    {x: points[0] + margins.left, y: $this.height() + margins.top + margins.bottom},
                    {x: points[1] + margins.left, y: $this.height() + margins.top + margins.bottom},
                    {x: $this.width() + margins.left, y: $this.height() + margins.top}
                ]));
        };

        this.getCenter = function(){
            var center = {};

            center.x = this.width() / 2;
            center.y = this.height() / 2;

            return center;
        };

        container.updateList.push({update: this.update, context: this});
    };

    return SvgChartView;
});