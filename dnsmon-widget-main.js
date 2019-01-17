/*
 * Copyright (c) ${YEAR} RIPE NCC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 /*

/**
 * Some path configurations
 */

DNSMON_WIDGET_URL = ((typeof DNSMON_EXTERNAL_WIDGET_URL == 'undefined') ? "https://www-static.ripe.net/static/rnd-ui/dnsmon/static/visualisation/dnsmon/" : DNSMON_EXTERNAL_WIDGET_URL) ;


/**
 * Name space configuration
 */
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

window.atlas = window.atlas || {};
window.atlas._widgets = window.atlas._widgets || {};
window.atlas._widgets.dnsmon = window.atlas._widgets.dnsmon || {};

window.atlas._widgets.dnsmon.instances = window.atlas._widgets.dnsmon.instances || {
        requested: [],
        running: {},
        callback: {}
    };

if (!window.atlas._widgets.widgetInjectorRequested) { // Only one injector
    window.atlas._widgets.widgetInjectorLoaded = false;
    window.atlas._widgets.widgetInjectorRequested = true;
    window.atlas._widgets.dnsmon.tmp_scripts = document.getElementsByTagName('script');
    window.atlas._widgets.dnsmon.tmp_scrip = window.atlas._widgets.dnsmon.tmp_scripts[window.atlas._widgets.dnsmon.tmp_scripts.length - 1];
    window.atlas._widgets.injectorScript = document.createElement('script');
    window.atlas._widgets.injectorScript.async = false;
    window.atlas._widgets.injectorScript.src = DNSMON_LIB_URL + 'require.min.js';
    window.atlas._widgets.dnsmon.tmp_scrip.parentNode.appendChild(window.atlas._widgets.injectorScript);
}


/**
 * Widget injector
 */
function initDNSmon(domElement, instanceParams, queryParams){
    var run;

    run = function(){
        var instances, instance;

        instances = window.atlas._widgets.dnsmon.instances;
        instance = instances.requested.shift();

        while (instance){

            (function(instances, instance){
                requirejs.config({
                    waitSeconds: 60
                });
                if (instance.instanceParams.dev) { // Load dev version
                    require([DNSMON_WIDGET_URL + 'dnsmon-loader.js'], function(DNSMON){
                        instances.running[instance.domElement] = DNSMON(instance);
                    });
                } else { // Load deployed version
                    require([DNSMON_WIDGET_URL + 'dnsmon-dist.js'], function () {
                        require(['dnsmon/dnsmon-loader'], function(DNSMON){
                            instances.running[instance.domElement] = DNSMON(instance);
                        });
                    });
                }
            })(instances, instance);

            instance = instances.requested.shift();
        }
    };

    window.atlas._widgets.dnsmon.instances.callback[domElement] = null;
    window.atlas._widgets.dnsmon.instances.requested
        .push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    if (document.readyState == 'complete'){
        window.atlas._widgets.widgetInjectorLoaded = true;
    } else {

        function ieLoadBugFix(){
            if (!window.atlas._widgets.widgetInjectorLoaded){
                if (document.readyState=='loaded' || document.readyState=='complete') {
                    window.atlas._widgets.injectorScript.onload();
                }else {
                    setTimeout(ieLoadBugFix, 200);
                }
            }
        }

        ieLoadBugFix();
    }

    if (window.atlas._widgets.widgetInjectorLoaded === false){
        window.atlas._widgets.injectorScript.onload = function(){
            window.atlas._widgets.widgetInjectorLoaded = true;
            run();
        };
    } else {
        run();
    }

    return {
        ready: function(callback){
            window.atlas._widgets.dnsmon.instances.callback[domElement] = callback;
        },
        setParams: function(params){
            var instance = window.atlas._widgets.dnsmon.instances.running[domElement];

            if (instance) {
                instance.setParams(params);
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        },

        on: function(type, callback){
            var instance = window.atlas._widgets.dnsmon.instances.running[domElement];

            if (instance) {
                instance.on(type, callback);
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        },

        off: function(type){
            var instance = window.atlas._widgets.dnsmon.instances.running[domElement];

            if (instance) {
                instance.off(type);
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        },

        getParams: function(){
            var instance = window.atlas._widgets.dnsmon.instances.running[domElement];

            if (instance) {
                instance.getParams();
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        },

        getEnvironment: function(){
            var instance = window.atlas._widgets.dnsmon.instances.running[domElement];

            if (instance) {
                instance.getEnvironment();
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        }
    };
}