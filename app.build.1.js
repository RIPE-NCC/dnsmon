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
        "lib.jquery": "lib/jquery.min",
        "lib.jquery-ui": "lib/jquery-ui.min",
        "lib.jquery-ui.timepicker": "lib/jquery-ui.timepicker",
        "lib.jquery.cookie": "lib/jquery.cookie"
    },

    optimize: "uglify2",
    wrapShim: false,
    out: "lib/libs-dist.js"

})