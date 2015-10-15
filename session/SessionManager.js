/**
 * Created by mcandela on 10/01/14.
 */

define([
    "dnsmon.env.utils",
    "dnsmon.lib.jquery-libs-amd"
], function(utils, $){

    /**
     * SessionManager is the layer providing all the functions to manage the session.
     * It provides a transparent layer for the tool to store and retrieve parameters.
     * The persistence can be provided (or not) by cookies or with any other possible server interaction.
     *
     * @class SessionManager
     * @constructor
     * @module session
     */

    var SessionManager = function(env){
        var volatileValues, session, defaultSession, cookieSuffix, cookiePreSuffix, config, useLocalPersistence,
            expireDate, localParamsChecked, initialisationSession;

        config = env.config;
        useLocalPersistence = config.useLocalPersistenceForSettings;
        session = {};
        expireDate = new Date((new Date()).getTime() + (config.localPersistenceValidityTimeMinutes * 60 * 1000)); // Expiration date for the persistence
        localParamsChecked = false;

        defaultSession = { // Pre-filled session with default values. Will be replaced by stored/permalink parameters
            "exclude-errors": config.excludeErrorsByDefault
        };

        initialisationSession = {};// Contains the parameters coming from the embedding code. Will be replaced by permalink only

        volatileValues = []; // Keys in this list are not stored persistently
        cookiePreSuffix = "dnsmon_"; // A suffix to create a better scope for the cookies

        //Compute the final suffix
        cookieSuffix = utils.getInstanceSuffix(env.parentDom);
        cookieSuffix = cookiePreSuffix + cookieSuffix + "_";


        /**
         * This method set a value for a session parameter expressed in the embedding code
         *
         * @method setInitialisationValues
         * @input {String} key A key
         * @input {String} value A value
         */

        this.setInitialisationValues = function(key, value){
            initialisationSession[key] = value;
        };


        /**
         * This method saves a session values if it is not in the volatileValues list
         *
         * @method saveValue
         * @input {String} key A key
         * @input {String} value A value
         */

        this.saveValue = function(key, value){
            var keyString, valueString;

            keyString = key.toString(); // Cast input to String
            valueString = value.toString();

            session[keyString] = valueString;

            if (useLocalPersistence && utils.indexOf(keyString, volatileValues) == -1){ // The current item is not volatile
                this._persistValue(keyString, valueString);
            }
        };


        /**
         * This method checks if the current values are different from the one stored locally
         *
         * @method saveValue
         * @input {String} key A key
         * @input {String} value A value
         */

        this._notLocalParams = function(){
            var retrievedVersion;

            for (var paramKey in session){

                if (utils.indexOf(paramKey, volatileValues) == -1){
                    retrievedVersion = this._retrieveValue(paramKey); // Do this after all the checks (it is expensive)

                    if (retrievedVersion != null && retrievedVersion != '' + session[paramKey]){ // Different from the one contained locally
                        return true;
                    }
                }
            }
            return false;
        };


        /**
         * This method returns a session value given a key. It considers defaults, persistents and temporary (e.g. permalinks) session values
         *
         * @method getValue
         * @input {String} key A key
         * @return {String} A value
         */

        this.getValue = function(key){
            var keyString;

            keyString = key.toString();

            /*
            * Priority order: 1) permalink, 2) embedding code, 3) local storage/cookies, 4) default values
            */
            if (session[keyString] == null && initialisationSession[key]){ // Lazy approach && the current item is imposed in the embedding code
                utils.log("The session parameter " + key + " has been initialised with the value in the embedding code", env.debugMode);
                session[keyString] = initialisationSession[key];
            }

            if (useLocalPersistence && session[keyString] == null && utils.indexOf(keyString, volatileValues) == -1){ // Lazy approach && the current item is not volatile
                session[keyString] = this._retrieveValue(keyString);
            }

            if (session[keyString] == null && defaultSession[keyString] != null){ // Lazy approach && there is a default value
                session[keyString] = defaultSession[keyString];
            }

            if (localParamsChecked == false){
                localParamsChecked = true;
                if (this._notLocalParams()){
                    env.mainView.showMessage(env.lang.notYourConfig);
                }
            }

            return session[keyString];
        };


        /**
         * This method saves a value locally
         *
         * @method _persistValue
         * @private
         * @input {String} key A key
         * @return {Boolean} If true the value has been saved correctly
         */

        this._persistValue = function(key, value){
            var saved;

            try{
                $.cookie(cookieSuffix + key, value, {expires: expireDate});
                saved = true;
            }catch(error){
                utils.log(error, env.debugMode);
                saved = false;
            }

            return saved;
        };


        /**
         * This method reads a value saved locally
         *
         * @method _retrieveValue
         * @private
         * @input {String} key A key
         * @return {String} A value
         */

        this._retrieveValue = function(key){
            var value;

            try{
                value = $.cookie(cookieSuffix + key);
            }catch(error){
                utils.log(error, env.debugMode);
                value = null;
            }

            return value;
        };


        /**
         * This method returns the actual session
         *
         * @method getSession
         * @return {Object} A vector of values describing the actual session
         */

        this.getSession = function(){
            for (var key in defaultSession){
                if (!session.hasOwnProperty(key)){
                    session[key] = this.getValue(key);
                }
            }

            return session;
        };


        /**
         * This method imposes temporary a session
         *
         * @method setSession
         * @input {Object} newSession A vector of values describing a session
         */

        this.setSession = function(newSession){
            session = newSession;
        };

    };

    return SessionManager;
});