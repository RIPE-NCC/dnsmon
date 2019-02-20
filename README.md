# DNSMON

The RIPE NCC DNS Monitoring Service (DNSMON) provides a comprehensive, objective and up-to-date overview of the quality of the service offered by high-level Domain Name System (DNS) servers. It is an active measurement service. It uses our RIPE Atlas active measurement network to provide an up-to-date service overview of all DNS root and many Top-Level Domain (TLD) name servers. An important feature is the ability to view historical data. This allows quick analysis of both past and present DNS issues.

DNSMON measures DNS performance between site that host RIPE Atlas anchors and those where DNS servers are installed. The high number of probes and the method of presenting the results are unique. The information is updated as soon as new data points are received.

## Documentation

### Official Usage Documentation
If you want just to use the widget, the following documentation is enough:
[Documentation can be found here](https://atlas.ripe.net/dnsmon/about)
You can use the optimised dnsmon-dist.js for production purposes.

### Developer Documentation
The code of DNSMON is documented by using YUIDoc.

YUIDoc is a Node.js application that generates API documentation from comments in source, using a syntax similar to tools like Javadoc and Doxygen.
Once you have YUIDoc installed on your machine you can simply generate the documentation running 'yuidoc .' in the root of the project

#### Additional Informations for Developers
During the development you should set dev: true, localCacheActive: false, and debugMode: true in the embedding options.

The debug mode will print in the browser's console informations about the execution of the widget, including performances and resources used.
