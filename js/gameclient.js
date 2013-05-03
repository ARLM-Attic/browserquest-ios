
define(['player', 'entityfactory', 'lib/bison'], function(Player, EntityFactory, BISON) {

    var GameClient = Class.extend({
        init: function(host, port) {
            this.connection = null;
            this.host = host;
            this.port = port;
    
            this.connected_callback = null;
            this.spawn_callback = null;
            this.movement_callback = null;
        
            this.handlers = [];
            this.handlers[Types.Messages.WELCOME] = this.receiveWelcome;
            this.handlers[Types.Messages.MOVE] = this.receiveMove;
            this.handlers[Types.Messages.LOOTMOVE] = this.receiveLootMove;
            this.handlers[Types.Messages.ATTACK] = this.receiveAttack;
            this.handlers[Types.Messages.SPAWN] = this.receiveSpawn;
            this.handlers[Types.Messages.DESPAWN] = this.receiveDespawn;
            this.handlers[Types.Messages.SPAWN_BATCH] = this.receiveSpawnBatch;
            this.handlers[Types.Messages.HEALTH] = this.receiveHealth;
            this.handlers[Types.Messages.CHAT] = this.receiveChat;
            this.handlers[Types.Messages.EQUIP] = this.receiveEquipItem;
            this.handlers[Types.Messages.DROP] = this.receiveDrop;
            this.handlers[Types.Messages.TELEPORT] = this.receiveTeleport;
            this.handlers[Types.Messages.DAMAGE] = this.receiveDamage;
            this.handlers[Types.Messages.POPULATION] = this.receivePopulation;
            this.handlers[Types.Messages.LIST] = this.receiveList;
            this.handlers[Types.Messages.DESTROY] = this.receiveDestroy;
            this.handlers[Types.Messages.KILL] = this.receiveKill;
            this.handlers[Types.Messages.HP] = this.receiveHitPoints;
            this.handlers[Types.Messages.BLINK] = this.receiveBlink;
            this.handlers[Types.Messages.PVP] = this.receivePVP;
            this.handlers[Types.Messages.TEAM] = this.receiveTeam;
            this.handlers[Types.Messages.PVPTELEPORT] = this.receivePVPTeleport;
            this.handlers[Types.Messages.PVPFINISH] = this.receivePVPFinish;
            this.handlers[Types.Messages.PVPSTATE] = this.receivePVPState;
            this.handlers[Types.Messages.PVPTIME] = this.receivePVPTime;
            this.handlers[Types.Messages.PVPWAIT] = this.receiveWaitPvp;
            this.handlers[Types.Messages.XP] = this.receiveXP;
            this.handlers[Types.Messages.LEVEL] = this.receiveLevel;
            this.handlers[Types.Messages.MESSAGEID] = this.receiveMessageId;
        
            this.useBison = false;
            this.enable();
        },
    
        enable: function() {
            this.isListening = true;
        },
    
        disable: function() {
            this.isListening = false;
        },
        
        connect: function (dispatcherMode, usebackup, noSecure) {
            var self = this;
            
            

            if (dispatcherMode) {
                //Use http for dispatcher
                var url = "http://" + this.host + ":" + this.port + "/";
                if (usebackup) {
                    url = "INSERT URL TO BACKUP";
                }
                url += "?v=" + "2.0.0.0&d=ipad";
                var date = new Date();
                url = url + "?date=" + date.getDate() + date.getMonth() + date.getFullYear() + date.getTime();
                
                log.info("Dispacher on: " + url);
                jQuery.ajax({ url: url, dataType: "json" })
                                  .fail(function(jqXHR, textStatus,errorThrows) {
                                        if (!usebackup) {
                                            self.connect(true, true);
                                        } else {
                                            alert(gls("connect.unknown"), null, true, "Dispatcher_Parse3");
                                        }
                                    }
                        ).done(
                function fulfilled(result) {
                    try {
                        var reply = result;//JSON.parse(result.responseText);
                        //reply.status = "UPDATE";
                        if (reply.status === 'OK') {
                            self.dispatched_callback(reply.host, reply.port);
                        } else if (reply.status === 'FULL') {
                            alert(gls("connect.full"), null, false, "Full");
                        } else if (reply.status === 'UPDATE') {
                            alert(gls("connect.update"), null, false, "Update");
                        } else {
                            if (!usebackup) {
                                self.connect(true, true);
                            } else {
                                alert(gls("connect.unknown"), null, true, "Dispatcher_Parse1");
                            }
                        }
                    } catch (e) {
                        if (!usebackup) {
                            self.connect(true, true);
                        } else {
                            alert(gls("connect.unknown"), null, true, "Dispatcher_Parse2");
                        }
                    }
                });
            } else {
                //Socket connection
                var url = "";

                var prototcol = "wss";
                if (noSecure) {
                    prototcol = "ws";
                }
                                  

                if (this.port === 80 || this.port == 443) {
                    url = prototcol + "://" + this.host + "/";
                } else {
                    url = prototcol + "://" + this.host + ":" + this.port + "/";
                }
                
                
                log.info("Trying to connect to server : " + url);

                if(window.MozWebSocket) {
                    this.connection = new MozWebSocket(url);
                } else {
                    this.connection = new WebSocket(url);
                }
                
                var connected = false;
                this.connection.onopen = function(e) {
                    log.info("Connected to server "+self.host+":"+self.port);
                };

                this.connection.onmessage = function (e) {
                    if (e.data === "go") {
                        connected = true;
                        if(self.connected_callback) {
                            self.connected_callback();
                        }
                        return;
                    }
                    if(e.data === 'timeout') {
                        self.isTimeout = true;
                        return;
                    }
                    
                    self.receiveMessage(e.data);
                };

                this.connection.onerror = function(e) {
                    log.error(e, true);
                };

                this.connection.onclose = function() {
                    log.debug("Connection closed");
                    if (!connected) {
                        if (!noSecure) {
                            self.connect(false, false, true);
                        } else {
                            $('#container').addClass('error');
                            alert(gls("connect.close"), null, true, "Close_NotConnected");
                        }
                    }
                    else if (self.disconnected_callback) {
                        $('#container').addClass('error');
                        if (self.isTimeout) {
                            self.disconnected_callback(gls("connect.inactive"), "Inactive");
                        } else {
                            self.disconnected_callback(gls("connect.lost"), "Lost");
                        }
                    } else {
                        $('#container').addClass('error');
                        alert(gls("connect.close"), null, true, "Close_Connected");
                    }
                };
            }
        },

        sendMessage: function(json) {
            var data;
            if (Globals.isAndroid) {
            	state = this.connection.getReadyState();
            } else {
            	state = this.connection.readyState;
            }
            if(state === 1) {
                if(this.useBison) {
                    data = BISON.encode(json);
                } else {
                    data = JSON.stringify(json);
                }
                this.connection.send(data);
            }
        },

        receiveMessage: function(message) {
            var data, action;
        
            if(this.isListening) {
                if(this.useBison) {
                    data = BISON.decode(message);
                } else {
                    data = JSON.parse(message);
                }

                //log.debug("data: " + message);

                if(data instanceof Array) {
                    if(data[0] instanceof Array) {
                        // Multiple actions received
                        this.receiveActionBatch(data);
                    } else {
                        // Only one action received
                        this.receiveAction(data);
                    }
                }
            }
        },
    
        receiveAction: function(data) {
            var action = data[0];
            if(this.handlers[action] && _.isFunction(this.handlers[action])) {
                this.handlers[action].call(this, data);
            }
            else {
                log.error("Unknown action : " + action);
            }
        },
    
        receiveActionBatch: function(actions) {
            var self = this;

            _.each(actions, function(action) {
                self.receiveAction(action);
            });
        },
    
        receiveWelcome: function(data) {
            var id = data[1],
                name = data[2],
                x = data[3],
                y = data[4],
                hp = data[5],
                minPvpLevel = data[6];
        
            if(this.welcome_callback) {
                this.welcome_callback(id, name, x, y, hp, minPvpLevel);
            }
        },
    
        receiveMove: function(data) {
            var id = data[1],
                x = data[2],
                y = data[3];
        
            if(this.move_callback) {
                this.move_callback(id, x, y);
            }
        },
    
        receiveLootMove: function(data) {
            var id = data[1], 
                item = data[2];
        
            if(this.lootmove_callback) {
                this.lootmove_callback(id, item);
            }
        },
    
        receiveAttack: function(data) {
            var attacker = data[1], 
                target = data[2];
        
            if(this.attack_callback) {
                this.attack_callback(attacker, target);
            }
        },
    
        receiveSpawn: function(data) {
            var id = data[1],
                kind = data[2],
                x = data[3],
                y = data[4];
        
            if(Types.isItem(kind)) {
                var item = EntityFactory.createEntity(kind, id);
            
                if(this.spawn_item_callback) {
                    this.spawn_item_callback(item, x, y);
                }
            } else if(Types.isChest(kind)) {
                var item = EntityFactory.createEntity(kind, id);
            
                if(this.spawn_chest_callback) {
                    this.spawn_chest_callback(item, x, y);
                }
            } else {
                var name, orientation, target, weapon, armor, team, level;
            
                if(Types.isPlayer(kind)) {
                    name = data[5];
                    orientation = data[6];
                    armor = data[7];
                    weapon = data[8];
                    team = data[9];
                    level = data[10];
                    if(data.length > 11) {
                        target = data[11];
                    }
                }
                else if(Types.isMob(kind)) {
                    orientation = data[5];
                    if(data.length > 6) {
                        target = data[6];
                    }
                }

                var character = EntityFactory.createEntity(kind, id, name);
            
                if(character instanceof Player) {
                    character.weaponName = Types.getKindAsString(weapon);
                    character.spriteName = Types.getKindAsString(armor);
                    character.team = team;
                    character.level = level;
                }
            
                if(this.spawn_character_callback) {
                    this.spawn_character_callback(character, x, y, orientation, target);
                }
            }
        },
    
        receiveDespawn: function(data) {
            var id = data[1];
        
            if(this.despawn_callback) {
                this.despawn_callback(id);
            }
        },
    
        receiveHealth: function(data) {
            var points = data[1],
                isRegen = false;
        
            if(data[2]) {
                isRegen = true;
            }
        
            if(this.health_callback) {
                this.health_callback(points, isRegen);
            }
        },
    
        receiveChat: function(data) {
            var id = data[1],
                text = data[2];
        
            if(this.chat_callback) {
                this.chat_callback(id, text);
            }
        },
    
        receiveEquipItem: function(data) {
            var id = data[1],
                itemKind = data[2];
        
            if(this.equip_callback) {
                this.equip_callback(id, itemKind);
            }
        },

        receiveTeam: function (data) {
            var id = data[1],
                team = data[2];

            if (this.team_callback) {
                this.team_callback(id, team);
            }
        },
    
        receiveDrop: function(data) {
            var mobId = data[1],
                id = data[2],
                kind = data[3];
        
            var item = EntityFactory.createEntity(kind, id);
            item.wasDropped = true;
            item.playersInvolved = data[4];
        
            if(this.drop_callback) {
                this.drop_callback(item, mobId);
            }
        },
    
        receiveTeleport: function(data) {
            var id = data[1],
                x = data[2],
                y = data[3];
        
            if(this.teleport_callback) {
                this.teleport_callback(id, x, y);
            }
        },
    
        receiveDamage: function(data) {
            var id = data[1],
                dmg = data[2];
        
            if(this.dmg_callback) {
                this.dmg_callback(id, dmg);
            }
        },
    
        receivePopulation: function(data) {
            var worldPlayers = data[1],
                totalPlayers = data[2];
        
            if(this.population_callback) {
                this.population_callback(worldPlayers, totalPlayers);
            }
        },
    
        receiveKill: function(data) {
            var mobKind = data[1];
        
            if(this.kill_callback) {
                this.kill_callback(mobKind);
            }
        },
    
        receiveList: function(data) {
            data.shift();
        
            if(this.list_callback) {
                this.list_callback(data);
            }
        },
    
        receiveDestroy: function(data) {
            var id = data[1];
        
            if(this.destroy_callback) {
                this.destroy_callback(id);
            }
        },
    
        receiveHitPoints: function(data) {
            var maxHp = data[1];
        
            if(this.hp_callback) {
                this.hp_callback(maxHp);
            }
        },
    
        receiveBlink: function(data) {
            var id = data[1];
        
            if(this.blink_callback) {
                this.blink_callback(id);
            }
        },

        receivePVP: function (data) {
            var pvp = data[1];
            if (this.pvp_callback) {
                this.pvp_callback(pvp);
            }
        },

        receiveWaitPvp: function (data) {
            var pvpWait = data[1];
            if (this.pvp_wait_callback) {
                this.pvp_wait_callback(pvpWait);
            }
        },

        receivePVPTeleport: function(data) {
            var x = data[1];
            var y = data[2];
            var type = data[3];
            if (this.pvpteleport_callback) {
                this.pvpteleport_callback(x, y, type);
            }
        },

        receivePVPFinish: function(data) {
            var redwins = data[1];
            var bluewins = data[2];
            var type = data[3];
            if (this.pvpfinish_callback) {
                this.pvpfinish_callback(redwins, bluewins, type);
            }
        },

        receivePVPState: function (data) {
            var redkills = data[1];
            var bluekills = data[2];
            if (this.pvpstate_callback) {
                this.pvpstate_callback(redkills, bluekills);
            }
        },

        receivePVPTime: function (data) {
            var time = data[1];
            if (this.pvptime_callback) {
                this.pvptime_callback(time);
            }
        },

        receiveXP: function (data) {
            var points = data[1];

            if (this.xp_callback) {
                this.xp_callback(points);
            }
        },

        receiveLevel: function (data) {
            var id = data[1],
                level = data[2];

            if (this.level_callback) {
                this.level_callback(id, level);
            }
        },

        receiveMessageId: function(data) {
            var id = data[1];

            if (this.messageid_callback) {
                this.messageid_callback(id);
            }
        },
        
        onDispatched: function(callback) {
            this.dispatched_callback = callback;
        },

        onConnected: function(callback) {
            this.connected_callback = callback;
        },
        
        onDisconnected: function(callback) {
            this.disconnected_callback = callback;
        },

        onWelcome: function(callback) {
            this.welcome_callback = callback;
        },

        onSpawnCharacter: function(callback) {
            this.spawn_character_callback = callback;
        },
    
        onSpawnItem: function(callback) {
            this.spawn_item_callback = callback;
        },
    
        onSpawnChest: function(callback) {
            this.spawn_chest_callback = callback;
        },

        onDespawnEntity: function(callback) {
            this.despawn_callback = callback;
        },

        onEntityMove: function(callback) {
            this.move_callback = callback;
        },

        onEntityAttack: function(callback) {
            this.attack_callback = callback;
        },
    
        onPlayerChangeHealth: function(callback) {
            this.health_callback = callback;
        },
    
        onPlayerEquipItem: function(callback) {
            this.equip_callback = callback;
        },

        onPlayerTeam: function(callback) {
            this.team_callback = callback;
        },
    
        onPlayerMoveToItem: function(callback) {
            this.lootmove_callback = callback;
        },
    
        onPlayerTeleport: function(callback) {
            this.teleport_callback = callback;
        },
    
        onChatMessage: function(callback) {
            this.chat_callback = callback;
        },
    
        onDropItem: function(callback) {
            this.drop_callback = callback;
        },
    
        onPlayerDamageMob: function(callback) {
            this.dmg_callback = callback;
        },
    
        onPlayerKillMob: function(callback) {
            this.kill_callback = callback;
        },
    
        onPopulationChange: function(callback) {
            this.population_callback = callback;
        },
    
        onEntityList: function(callback) {
            this.list_callback = callback;
        },
    
        onEntityDestroy: function(callback) {
            this.destroy_callback = callback;
        },
    
        onPlayerChangeMaxHitPoints: function(callback) {
            this.hp_callback = callback;
        },
    
        onItemBlink: function(callback) {
            this.blink_callback = callback;
        },

        onPVPChange: function (callback) {
            this.pvp_callback = callback;
        },

        onPVPWaitChange: function (callback) {
            this.pvp_wait_callback = callback;
        },
        
        onPVPTeleport: function (callback) {
            this.pvpteleport_callback = callback;
        },

        onPVPFinish: function (callback) {
            this.pvpfinish_callback = callback;
        },

        onPVPState: function (callback) {
            this.pvpstate_callback = callback;
        },

        onPVPTime: function (callback) {
            this.pvptime_callback = callback;
        },

        onXP: function (callback) {
            this.xp_callback = callback;
        },

        onPlayerLevelChanged: function (callback) {
            this.level_callback = callback;
        },

        onMessageId: function (callback) {
            this.messageid_callback = callback;
        },

        sendHello: function(player) {
            this.sendMessage([Types.Messages.HELLO,
                              player.name,
                              Types.getKindFromString(player.getSpriteName()),
                              Types.getKindFromString(player.getWeaponName()),
                              player.getLevel()]);
        },

        sendMove: function(x, y) {
            this.sendMessage([Types.Messages.MOVE,
                              x,
                              y]);
        },
    
        sendLootMove: function(item, x, y) {
            this.sendMessage([Types.Messages.LOOTMOVE,
                              x,
                              y,
                              item.id]);
        },
    
        sendAggro: function(mob) {
            this.sendMessage([Types.Messages.AGGRO,
                              mob.id]);
        },
    
        sendAttack: function(mob) {
            this.sendMessage([Types.Messages.ATTACK,
                              mob.id]);
        },
    
        sendHit: function(mob) {
            this.sendMessage([Types.Messages.HIT,
                              mob.id]);
        },
    
        sendHurt: function(mob) {
            this.sendMessage([Types.Messages.HURT,
                              mob.id]);
        },
    
        sendChat: function(text) {
            this.sendMessage([Types.Messages.CHAT,
                              text]);
        },

        sendLevel: function (level) {
            this.sendMessage([Types.Messages.LEVEL,
                              level]);
        },
    
        sendLoot: function(item) {
            this.sendMessage([Types.Messages.LOOT,
                              item.id]);
        },
    
        sendTeleport: function(x, y) {
            this.sendMessage([Types.Messages.TELEPORT,
                              x,
                              y]);
        },
    
        sendWho: function(ids) {
            ids.unshift(Types.Messages.WHO);
            this.sendMessage(ids);
        },
    
        sendZone: function() {
            this.sendMessage([Types.Messages.ZONE]);
        },
    
        sendOpen: function(chest) {
            this.sendMessage([Types.Messages.OPEN,
                              chest.id]);
        },
    
        sendCheck: function(id) {
            this.sendMessage([Types.Messages.CHECK,
                              id]);
        }
    });
    
    return GameClient;
});