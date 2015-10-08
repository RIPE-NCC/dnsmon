function AtlasTraceroute(data) {
    this.data = data;
    this.reverseNames = data.reverse_names || {};

    this.render = function() {
        var output = [];
        output.push(this.renderTimestamp(this.data.timestamp));
        output.push(this.renderHeader(
            this.data.dst_name, this.data.dst_addr, this.data.size));
        for (var h=0; h < this.data.result.length; h++) {
            var hop = this.data.result[h];
            output.push(this.renderHop(hop));
        }
        return "<div class='traceroute'>" + output.join("") + "</div>";
    };

    this.renderTimestring = function(timestamp) {
        return timestamp;
    };

    this.renderTimestamp = function(timestamp) {
        return "<span class='traceroute-timestamp'>" +
            this.renderTimestring(timestamp) + "</span>";
    };

    this.renderHeader = function(dstName, dstAddr, packetSize) {
        return "<div class='traceroute-header'>traceroute to " + dstName + " (" +
            dstAddr + "), " + packetSize + " byte packets</div>";
    };

    this.renderHopNumber = function(hop) {
        return "<span class='traceroute-hop-number'>" + hop + "</span>";
    };

    this.renderReply = function(reply, lastAddr) {
        var output = [];
        if (reply.x == "*") {
            output.push(this.renderTimeout());
        }
        if (reply.hasOwnProperty("from")) {
            var addr = reply.from;
            if (addr && addr != lastAddr) {
                output.push(this.renderAddress(addr, this.reverseNames[addr]));
            }
        }

        if (reply.hasOwnProperty("rtt")) {
            output.push(this.renderTime(reply.rtt));
        }
        if (reply.hasOwnProperty("err")) {
            output.push(this.renderError(reply.err));
        }
        return output.join(" ");
    };

    this.renderHop = function(hop) {
        var lastAddr = null;
        var output = [];
        output.push(this.renderHopNumber(hop.hop));
        for (var r=0; r < hop.result.length; r++) {
            var reply = hop.result[r];
            output.push(this.renderReply(reply, lastAddr));
            lastAddr = reply.from || lastAddr;

        }
        return "<div class='traceroute-hop'>" + output.join(" ") + "</div>";
    };

    this.renderTimeout = function() {
        return "*";
    };

    this.renderTime = function(time) {
        return time + " ms";
    };

    this.renderError = function(error) {
        return "!" + error;
    };

    this.renderAddress = function(addr, hostname) {
        var label;
        if (hostname) {
            label = hostname + " (" + addr + ")";
        } else {
            label = addr;
        }
        return "<a target='_blank' href='https://stat.ripe.net/" + addr +
            "' title='" + label + " [click to open in RIPEstat]'>" + addr + "</a>";
    };
}