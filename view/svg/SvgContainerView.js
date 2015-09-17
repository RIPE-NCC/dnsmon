/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/16/13
 * Time: 4:24 PM
 * To change this template use File | Settings | File Templates.
 */

define([
    "dnsmon.env.utils",
    "dnsmon.env.config",
    "dnsmon.lib.d3",
    "dnsmon.view.svg.chart"
], function(utils, config, d3, SvgChartView){

    /**
     * SvgContainerView is the view component representing the SVG container
     *
     * @class SvgContainerView
     * @constructor
     * @module view.svg
     */

    var SvgContainerView = function(parentDom, chartMargins, options){
        var node, svg, duration;

        node = d3.select(parentDom.plain);

        this.dom = parentDom;
        this.updateList = [];

        duration = options.animationDuration || 0;

        this.svg = node
            .append('svg')
            .attr("class", "dnsmon-svg");

        this.width = function(val) {
            if (val != null){
                parentDom.$.width(val);
                this.updateDimensions();
            }
            return parentDom.$.width();
        };

        this.height = function(val) {
            if (val != null){
                parentDom.$.height(val);
                this.updateDimensions();
            }

            return parentDom.$.height();
        };

        this.updateDimensions = function(){
            var updateFuncElement;

            this.svg
                .transition()
                .duration(duration)
                .attr("width", parentDom.$.width())
                .attr("height", parentDom.$.height())
                .style("width", parentDom.$.width())
                .style("height", parentDom.$.height());

            for (var n=0, length=this.updateList.length; n<length; n++){
                updateFuncElement = this.updateList[n];
                updateFuncElement.update.call(updateFuncElement.context);
            }
        };


        /*
         * Draw chart
         */

        this.chart = new SvgChartView(this, chartMargins, options);
        this.chart.hidden = false;

    };

    return SvgContainerView;
});