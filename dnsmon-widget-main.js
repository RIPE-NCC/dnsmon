/**
 * Created by mcandela on 23/01/14.
 */


/**
 * Some path configurations
 */

DNSMON_WIDGET_URL = ((typeof DNSMON_EXTERNAL_WIDGET_URL == 'undefined') ? "https://www-static.ripe.net/static/rnd-ui/dnsmon/static/visualisation/dnsmon/" : DNSMON_EXTERNAL_WIDGET_URL) ;

DNSMON_ENVIRONMENT_URL = DNSMON_WIDGET_URL + "environment/";

DNSMON_LIB_URL = DNSMON_WIDGET_URL + "lib/";
DNSMON_CONNECTOR_URL = DNSMON_WIDGET_URL + "connector/";

DNSMON_MODEL_URL = DNSMON_WIDGET_URL + "model/";
DNSMON_VIEW_URL = DNSMON_WIDGET_URL + "view/";
DNSMON_CONTROLLER_URL = DNSMON_WIDGET_URL + "controller/";

DNSMON_SESSION_URL = DNSMON_WIDGET_URL + "session/";
DNSMON_CONFIG_URL = DNSMON_WIDGET_URL;
DNSMON_UTIL_URL = DNSMON_WIDGET_URL;

DNSMON_MAIN_URL = DNSMON_WIDGET_URL;


DNSMON_INSTANCES = [];
DNSMON_RUNNING_INSTANCES = {};
DNSMON_INSTANCE_CALLBACKS = {};

document.write('<script src="' + DNSMON_LIB_URL + 'require.min.js"></script>');


/**
 * This is the code of the widget system
 */

function getDNSmonInstance(){
    return DNSMON_INSTANCES.shift();
}

function setDNSmonParam(domElement, params){
    var instance = DNSMON_RUNNING_INSTANCES[domElement];
    instance.setParams(params);
}

function initDNSmon(domElement, instanceParams, queryParams){
    var runDNSmon;

    DNSMON_INSTANCES.push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    runDNSmon = function (DNSmon) {
        var instance;

        instance = getDNSmonInstance();
        DNSMON_RUNNING_INSTANCES[domElement] = DNSmon(instance);
    };


    if (!instanceParams.dev) {

        require([DNSMON_WIDGET_URL + 'dnsmon-dist.js'], function () {
            require(['dnsmon/dnsmon-loader'], runDNSmon);
        });

    } else {

        require([DNSMON_WIDGET_URL + 'dnsmon-loader.js'], runDNSmon);

    }


    return {
        setParams: function(params){
            DNSMON_RUNNING_INSTANCES[domElement].setParams(params);
        },

        on: function(type, callback){
            DNSMON_RUNNING_INSTANCES[domElement].on(type, callback);
        },

        off: function(type){
            DNSMON_RUNNING_INSTANCES[domElement].off(type);
        },

        getParams: function(){
            return DNSMON_RUNNING_INSTANCES[domElement].getParams();
        },

        getEnvironment: function(){
            return DNSMON_RUNNING_INSTANCES[domElement].getEnvironment();
        }
    };
}
