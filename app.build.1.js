({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){define.amd=false;",
        end: "});"
    },

    include: ["lib.jquery", "lib.jquery.cookie", "lib.jquery-ui", "lib.jquery-ui.timepicker"], // Only jQuery stuff
    paths:{

        /* libs */
        "lib.jquery": "dnsmon/lib/jquery.min",
        "lib.jquery-ui": "dnsmon/lib/jquery-ui.min",
        "lib.jquery-ui.timepicker": "dnsmon/lib/jquery-ui.timepicker",
        "lib.jquery.cookie": "dnsmon/lib/jquery.cookie"
    },

    optimize: "uglify2",
    wrapShim: false,
    out: "dnsmon/lib/libs-dist.js"

})