
define(['jquery', '../javascripts/i18next-1.5.10', 'lib/class', 'lib/underscore.min', 'lib/stacktrace', 'util'], function($) {
       
    document.addEventListener("deviceready", function() {
   
   
    var testFlight = window.plugins.testFlight;

    testFlight.takeOff(
        function(){
            console.log("Success testFlight!");
        },

        function() {
            console.error("Failed testFlight!");
        },
        
        "testFlight id"
    );


    cordova.exec(
        function(langCode){
        
        
            //Load localized images by CSS
            var css = $("<link>");
            css.attr({
                rel:  "stylesheet",
                type: "text/css",
                href: "css/lang/" + langCode + "/main.css"
            });
            $("head").append(css);
                
            var option = { resGetPath: 'strings/' + langCode + '/__ns__.resjson', debug: true , getAsync: false, keyseparator : '---',
                ns: { namespaces: ['resources'], defaultNs: 'resources'} , fallbackLng : 'en-US'
            };
            
            i18n.init(option, function(t) {
                $('body').i18n();
            });
            
            window.gls = function(key) {
                return i18n.t(key);
            };
            //ready to play
            require(["main"]);
        },
        function(){
            
        },
        'Language',
        'language',
        []
        );
        

    }, false);
});