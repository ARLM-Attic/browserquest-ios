
define(['jquery', 'app'], function($, App) {
    var app, game;
    
    
    var adsRemoved = false;
    var adsKeyName = "inapp.removeads";

    var purchasedRemoveAds = function() {
        adsRemoved = true;
        window.localStorage.setItem(adsKeyName, "OK");
        cordova.exec(null, null, "AdPlugin", "hideAds", []);
        $('#removeAdsDiv').hide();
    };
    
    var purchaseRemoveAds = function() {
        if (!adsRemoved) {
       
            navigator.notification.confirm(
                gls("removeAdsDescription"),
                function(index) {
                    try {
                        console.log(index);
                        if (index == 2) {
                            //Remove ads
                            window.plugins.inAppPurchaseManager.requestProductData(adsKeyName,
                                function(productId, title, description, price) {
                                    //console.log("productId: " + productId + " title: " + title + " description: " + description + " price: " + price);
                                    window.plugins.inAppPurchaseManager.makePurchase(productId, 1);
                                }, function(id) {
                                //console.log("Invalid product id: " + id);
                                }
                            );
                        }
                        else if (index == 1) {
                            window.plugins.inAppPurchaseManager.restoreCompletedTransactions();
                        }
                    } catch (e) {}
                },
                "BrowserQuest",
                [gls("restore"), gls("buy")]
             );


            
        } else {
            purchasedRemoveAds();
        }
    };
    

    var initApp = function() {
        $(document).ready(function() {
        	app = new App();
            app.center();
                          
            cordova.exec(null, null, "AdPlugin", "hideAds", []);
            $('#removeAdsDiv').hide();
            
            $('#removeAds').click(function() {
                purchaseRemoveAds();
            });
            
            
            $('.externalWebView').click(function() {
                var $input = $(this);
                var url = $input.attr("href");
                window.open(url, '_blank');
                event.stopPropagation();
                return false;
            });
            
            $('.emailUs').click(function() {
                var body = "";
                window.plugins.emailComposer.showEmailComposerWithCB(
                    function() {},
                    "BrowserQuest for iPad (version 2.0) (Feedback/Support)", body, "apps@mpbrun.dk");
                
                event.stopPropagation();
                return false;
            });
            
            //Setup listeners
            window.plugins.inAppPurchaseManager.onPurchased = function(transactionIdentifier, productId, transactionReceipt) {
                console.log('purchased: ' + productId);
                if (adsKeyName === productId) {
                    purchasedRemoveAds();
                }
            };

            window.plugins.inAppPurchaseManager.onRestored = function(transactionIdentifier, productId, transactionReceipt) {
                console.log('restored: ' + productId);
                if (adsKeyName === productId) {
                    purchasedRemoveAds();
                }
            };

            window.plugins.inAppPurchaseManager.onFailed = function(errno, errtext) {
                console.log('failed: ' + errtext);
            };
            
            /* function() */
            window.plugins.inAppPurchaseManager.onRestoreCompletedTransactionsFinished = function() {
                console.log('onRestoreCompletedTransactionsFinished');
            };


            /* function(errorCode) */
            window.plugins.inAppPurchaseManager.onRestoreCompletedTransactionsFailed = function(errorCode) {
                console.log('failed: ' + errorCode);
            };
    
            //Load current value
            var adsRemovedValue = window.localStorage.getItem(adsKeyName);
            if (typeof adsRemovedValue !== 'undefined' &&  adsRemovedValue != null) {
                adsRemoved = true;
            }
        
            if(Detect.isWindows()) {
                // Workaround for graphical glitches on text
                $('body').addClass('windows');
            }
            
            if(Detect.isOpera()) {
                // Fix for no pointer events
                $('body').addClass('opera');
            }
        
            $('body').click(function(event) {
                if($('#parchment').hasClass('credits')) {
                    app.toggleCredits();
                }
                
                if($('#parchment').hasClass('about')) {
                    app.toggleAbout();
                }
            });

            $('.barbutton').click(function() {
        	    $(this).toggleClass('active');
        	});

        	$('#chatbutton').click(function() {
        	    if($('#chatbutton').hasClass('active')) {
        	        app.showChat();
        	    } else {
                    app.hideChat();
        	    }
        	});

        	$('#helpbutton').click(function() {
                app.toggleAbout();
        	});
	
        	$('#achievementsbutton').click(function() {
                app.toggleAchievements();
                if(app.blinkInterval) {
                    clearInterval(app.blinkInterval);
                }
                $(this).removeClass('blink');
        	});
	
        	$('#instructions').click(function() {
                app.hideWindows();
        	});
        	
        	$('#playercount').click(function() {
        	    app.togglePopulationInfo();
        	});
        	
        	$('#population').click(function() {
        	    app.togglePopulationInfo();
        	});
	
        	$('.clickable').click(function(event) {
                event.stopPropagation();
        	});
	
        	$('#toggle-credits').click(function() {
        	    app.toggleCredits();
        	});
	
        	$('#create-new span').click(function() {
        	    app.animateParchment('loadcharacter', 'confirmation');
        	});
	
        	$('.delete').click(function() {
                app.storage.clear();
        	    app.animateParchment('confirmation', 'createcharacter');
        	});
	
        	$('#cancel span').click(function() {
        	    app.animateParchment('confirmation', 'loadcharacter');
        	});

        	var showTotal = true;

        	setInterval(function () {

        	    var instaceElement = $("#playercount .playercountinstance");
        	    var totalElement = $("#playercount .playercounttotal");

        	    
        	    if (showTotal) {
                    instaceElement.fadeOut(500, function () {
                        totalElement.fadeIn(500);
                    });
        	        
        	    } else {
                    totalElement.fadeOut(500, function () {
                        instaceElement.fadeIn(500);
                    });
        	    }
        	    
        	    showTotal = !showTotal;
        	}, 10 * 1000);
        	
        	$('.ribbon').click(function() {
        	    app.toggleAbout();
            });

        	$('#nameinput').attr('placeholder', gls('placeholder.name'));
        	$('#chatinput').attr('placeholder', gls('placeholder.comment'));

            $('#nameinput').bind("keyup", function() {
                app.toggleButton();
            });
    
            $('#previous').click(function() {
                var $achievements = $('#achievements');
        
                if(app.currentPage === 1) {
                    return false;
                } else {
                    app.currentPage -= 1;
                    $achievements.removeClass().addClass('active page' + app.currentPage);
                }
            });
    
            $('#next').click(function() {
                var $achievements = $('#achievements'),
                    $lists = $('#lists'),
                    nbPages = $lists.children('ul').length;
        
                if(app.currentPage === nbPages) {
                    return false;
                } else {
                    app.currentPage += 1;
                    $achievements.removeClass().addClass('active page' + app.currentPage);
                }
            });

            $('#notifications div').bind(TRANSITIONEND, app.resetMessagesPosition.bind(app));
    
            $('.close').click(function() {
                app.hideWindows();
            });
        
            $('.twitter').click(function() {
                var url = $(this).attr('href');

               app.openPopup('twitter', url);
               return false;
            });

            $('.facebook').click(function() {
                var url = $(this).attr('href');

               app.openPopup('facebook', url);
               return false;
            });
        
            var data = app.storage.data;
    		if(data.hasAlreadyPlayed) {
    		    if(data.player.name && data.player.name !== "") {
    		        $('#playername').html(data.player.name);
    		        $('#playerimage').attr('src', data.player.image);
    		        $('#playerimage').show();
    		    }
    		}
    		
    		$('.play div').click(function(event) {
                //Show the ads on play
                if (!adsRemoved) {
                    cordova.exec(null, null, "AdPlugin", "showAds", []);
                    
                }
                                 
    			window.plugins.analytics.trackPageView("Play");
                var nameFromInput = $('#nameinput').attr('value'),
                    nameFromStorage = $('#playername').html(),
                    name = nameFromInput || nameFromStorage;
                
                app.tryStartingGame(name);
            });
        
            document.addEventListener("touchstart", function() {},false);
            
            $('#resize-check').bind("transitionend", app.resizeUi.bind(app));
            $('#resize-check').bind("webkitTransitionEnd", app.resizeUi.bind(app));
            $('#resize-check').bind("oTransitionEnd", app.resizeUi.bind(app));
        
            log.info("App initialized.");
        
            initGame();
        });
    };
    
    var initGame = function() {
        require(['game'], function(Game) {
            
            var canvas = document.getElementById("entities"),
        	    background = document.getElementById("background"),
        	    foreground = document.getElementById("foreground"),
				textcanvas = document.getElementById("textcanvas"),
                toptextcanvas = document.getElementById("toptextcanvas"),
        	    input = document.getElementById("chatinput");

    		game = new Game(app);
    		game.setup('#bubbles', canvas, background, foreground, textcanvas, toptextcanvas, input);
    		game.setStorage(app.storage);
    		app.setGame(game);
    		
    		if(app.isDesktop) {
    		    game.loadMap();
    		}
	
    		game.onGameStart(function() {
                if (!adsRemoved) {
                    setTimeout(function() {
                            $('#removeAdsDiv').fadeIn(1000);
                    }, 500);
                }
                app.initEquipmentIcons();
    		});
    		
    		game.onDisconnect(function(message, reason) {
    		    $('#death').find('p').html(message);
    		    $('#respawn').hide();

    		    alert(message, null, false, "Disconnect" + reason);
    		});
	
    		game.onPlayerDeath(function() {
    		    if($('body').hasClass('credits')) {
    		        $('body').removeClass('credits');
    		    }
                $('body').addClass('death');
    		});
	
    		game.onPlayerEquipmentChange(function() {
    		    app.initEquipmentIcons();
    		});
	
    		game.onPlayerInvincible(function() {
    		    $('#hitpoints').toggleClass('invincible');
    		});

    		game.onNbPlayersChange(function(worldPlayers, totalPlayers) {
    		    var setWorldPlayersString = function(string) {
        		        $("#instance-population").find("span:nth-child(2)").text(string);
        		        $("#playercount").find("span.countstring").text(string);
        		    },
        		    setTotalPlayersString = function(string) {
        		        $("#world-population").find("span:nth-child(2)").text(string);
        		    };
    		    
    		    $("#playercount .playercountinstance").find("span.count").text(worldPlayers);
    		    
    		    $("#instance-population").find("span.count").text(worldPlayers);
    		    if(worldPlayers == 1) {
    		        setWorldPlayersString(gls("chrome.player"));
    		    } else {
    		        setWorldPlayersString(gls("chrome.players"));
    		    }

    		    $("#playercount .playercounttotal").find("span.count").text(totalPlayers);
    		    
    		    $("#world-population").find("span.count").text(totalPlayers);
    		    if(totalPlayers == 1) {
    		        setTotalPlayersString(gls("chrome.player"));
    		    } else {
    		        setTotalPlayersString(gls("chrome.players"));
    		    }
    		});
	
    		game.onAchievementUnlock(function(id, name, description) {
    		    app.unlockAchievement(id, name);
    		});
	
    		game.onNotification(function(message, priority) {
    		    app.showMessage(message, priority);
    		});
	
    		app.initHealthBar();
    		app.initXPBar();
	
            $('#nameinput').attr('value', '');
            $('#chatbox').attr('value', '');
    		
        	if(game.renderer.mobile || game.renderer.tablet) {
                $('#canvas .clickable').bind('touchstart', function(event) {
                    app.center();
                    app.setMouseCoordinates(event.originalEvent.touches[0]);
                	game.click();
                	app.hideWindows();
                });
            } else {
                $('#canvas .clickable').click(function(event) {
                    app.center();
                    app.setMouseCoordinates(event);
                    if(game) {
                	    game.click();
                	}
                	app.hideWindows();
                    // $('#chatinput').focus();
                });
            }

            $('body').unbind('click');
            $('#intro').click(function() {
                var hasClosedParchment = false;
                
                if($('#parchment').hasClass('credits')) {
                    if(game.started) {
                        app.closeInGameCredits();
                        hasClosedParchment = true;
                    } else {
                        app.toggleCredits();
                    }
                }
                
                if($('#parchment').hasClass('about')) {
                    if(game.started) {
                        app.closeInGameAbout();
                        hasClosedParchment = true;
                    } else {
                        app.toggleAbout();
                    }
                }
                
                //Dont make it click outside. Fixes chatbox clicks bug.
                if (game.started && !game.renderer.mobile && game.player && !hasClosedParchment) {
                    game.click();
                }
                
            });
            
            $('#respawn').click(function(event) {
                game.audioManager.playSound("revive");
                game.restart();
                $('body').removeClass('death');
            });
            
            $(document).mousemove(function(event) {
            	app.setMouseCoordinates(event);
            	if(game.started) {
            	    game.movecursor();
            	}
            });

            $(document).keydown(function(e) {
            	var key = e.which,
                    $chat = $('#chatinput');

                if(key === 13) {
                    if($('#chatbox').hasClass('active')) {
                        app.hideChat();
                    } else {
                        app.showChat();
                    }
                }
            });
            
            $('#chatinput').keydown(function(e) {
                var key = e.which,
                    $chat = $('#chatinput');

                if(key === 13) {
                    if($chat.attr('value') !== '') {
                        if(game.player) {
                            game.say($chat.attr('value'));
                        }
                        $chat.attr('value', '');
                        app.hideChat();
                        $('#canvas .clickable').focus();
                        return false;
                    } else {
                        app.hideChat();
                        return false;
                    }
                }
                
                if(key === 27) {
                    app.hideChat();
                    return false;
                }
            });

            $('#nameinput').keypress(function(event) {
                var $name = $('#nameinput'),
                    name = $name.attr('value');

                if(event.keyCode === 13) {
                    if(name !== '') {
                        app.tryStartingGame(name, function() {
                            $name.blur(); // exit keyboard on mobile
                        });
                        return false; // prevent form submit
                    } else {
                        return false; // prevent form submit
                    }
                }
            });
            
            $('#mutebutton').click(function () {
                try {
                    game.audioManager.toggle();
                } catch (e) {
                }
            });
            
            $(document).bind("keydown", function(e) {
            	var key = e.which,
            	    $chat = $('#chatinput');

                if($('#chatinput:focus').size() == 0 && $('#nameinput:focus').size() == 0) {
                    if(key === 13) { // Enter
                        if(game.ready) {
                            $chat.focus();
                            return false;
                        }
                    }
                    if(key === 32) { // Space
                        // game.togglePathingGrid();
                        return false;
                    }
                    if(key === 70) { // F
                        // game.toggleDebugInfo();
                        return false;
                    }
                    if (key === 27) { // ESC
                        try {
                            app.hideWindows();
                            _.each(game.player.attackers, function(attacker) {
                                attacker.stop();
                            });
                        } catch (e) {

                        }
                        return false;
                    }
                    if(key === 65) { // a
                        // game.player.hit();
                        return false;
                    }
                } else {
                    if(key === 13 && game.ready) {
                        $chat.focus();
                        return false;
                    }
                }
            });
            
            if(game.renderer.tablet) {
                $('body').addClass('tablet');
            }
        });
    };
    
    initApp();
});
