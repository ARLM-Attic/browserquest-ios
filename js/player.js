
define(['character', 'exceptions'], function(Character, Exceptions) {

    var Player = Character.extend({
        MAX_LEVEL: 10,
    
        init: function(id, name, kind) {
            this._super(id, kind);
        
            this.name = name;
        
            // Renderer
     		this.nameOffsetY = -10;
        
            // sprites
            this.spriteName = "clotharmor";
            this.weaponName = "sword1";
        
            // modes
            this.isLootMoving = false;
            this.isSwitchingWeapon = true;

            //PVP flag
            this.team = Types.Team.NEUTRAL;
            this.pvpFlag = false;
            this.pvpWaitFlag = false;
            
            this.level = 1;
            this.xp = 0;
        },
    
        loot: function(item) {
            if(item) {
                var rank, currentRank, msg, currentArmorName;
                var levelToLow = false;
                var minLevel = 0;
            
                if(this.currentArmorSprite) {
                    currentArmorName = this.currentArmorSprite.name;
                } else {
                    currentArmorName = this.spriteName;
                }

                if(item.type === "armor") {
                    rank = Types.getArmorRank(item.kind);
                    currentRank = Types.getArmorRank(Types.getKindFromString(currentArmorName));
                    msg = gls("loot.alreadybetterarmor");

                    minLevel = Types.getArmorLevel(item.kind);
                    levelToLow = this.level < minLevel;
                } else if(item.type === "weapon") {
                    rank = Types.getWeaponRank(item.kind);
                    currentRank = Types.getWeaponRank(Types.getKindFromString(this.weaponName));
                    msg = gls("loot.alreadybetterweapon");

                    minLevel = Types.getWeaponLevel(item.kind);
                    levelToLow = this.level < minLevel;
                }

                if(rank && currentRank) {
                    if(rank === currentRank) {
                        throw new Exceptions.LootException(gls("loot.already"));
                    } else if(rank <= currentRank) {
                        throw new Exceptions.LootException(msg);
                    }
                }

                if (levelToLow) {
                    throw new Exceptions.LootException(String.format(gls("pvp.lowlevel"), minLevel));
                }

                log.info('Player '+this.id+' has looted '+item.id);
                if(Types.isArmor(item.kind) && this.invincible) {
                    this.stopInvincibility();
                }
                item.onLoot(this);
            }
        },
    
        /**
         * Returns true if the character is currently walking towards an item in order to loot it.
         */
        isMovingToLoot: function() {
            return this.isLootMoving;
        },
    
        getSpriteName: function() {
            return this.spriteName;
        },
    
        setSpriteName: function(name) {
            this.spriteName = name;
        },
        
        getArmorName: function() {
            var sprite = this.getArmorSprite();
            if (sprite.id == "firefox") {
                return "clotharmor";
            }
            return sprite.id;
        },
        
        getArmorSprite: function() {
            if(this.invincible) {
                return this.currentArmorSprite;
            } else {
                return this.sprite;
            }
        },
    
        getWeaponName: function() {
            return this.weaponName;
        },
    
        setWeaponName: function(name) {
            this.weaponName = name;
        },

        setTeam: function (team) {
            this.team = team;
        },
    
        hasWeapon: function() {
            return this.weaponName !== null;
        },

        setLevel: function (level) {
            this.level = level;
        },

        getLevel: function() {
            return this.level;
        },

        setXP: function (xp) {
            this.xp = xp;
        },

        getXP: function () {
            return this.xp;
        },

        incrementXP: function (points) {
            var self = this;
            
            if (self.level < Types.getMaxLevel()) {
                self.xp += points;
                var currentLevelXP = self.getXPForCurrentLevel();

                if (self.xp >= currentLevelXP) {
                    self.level += 1;
                    self.xp -= currentLevelXP;

                    try {
                        //Track level of players
                    	window.plugins.analytics.trackPageView("Level", "Level_" + self.level);
                        window.plugins.testFlight.passCheckpoint(function() {}, function() {}, "Level_" + self.level);
                    } catch (e) {
                    }

                    if (self.level_callback) {
                        self.level_callback();
                    }
                }
            }
        },

        getXPForCurrentLevel: function () {
            if (this.lastLevelCalc === this.level && this.lastXPCalc) {
                return this.lastXPCalc;
            }
            var xp = 0;
            //Save calculation
            if (this.level < 12) {
                xp = 40 * this.level * this.level + 360 * this.level;
            } else {
                xp = -0.40 * this.level * this.level * this.level + 40.4 * this.level * this.level + 396 * this.level;
            }
            //Round to nearst 100
            this.lastXPCalc = 100 * Math.round(xp / 100.0);
            this.lastLevelCalc = this.level;
            return this.lastXPCalc;
        },
    
        switchWeapon: function(newWeaponName) {
            var count = 14, 
                value = false, 
                self = this;
        
            var toggle = function() {
                value = !value;
                return value;
            };
        
            if(newWeaponName !== this.getWeaponName()) {
                if(this.isSwitchingWeapon) {
                    clearInterval(blanking);
                }
            
                this.switchingWeapon = true;
                var blanking = setInterval(function() {
                    if(toggle()) {
                        self.setWeaponName(newWeaponName);
                    } else {
                        self.setWeaponName(null);
                    }

                    count -= 1;
                    if(count === 1) {
                        clearInterval(blanking);
                        self.switchingWeapon = false;
                    
                        if(self.switch_callback) {
                            self.switch_callback();
                        }
                    }
                }, 90);
            }
        },
    
        switchArmor: function(newArmorSprite) {
            var count = 14, 
                value = false, 
                self = this;
        
            var toggle = function() {
                value = !value;
                return value;
            };
        
            if(newArmorSprite && newArmorSprite.id !== this.getSpriteName()) {
                if(this.isSwitchingArmor) {
                    clearInterval(blanking);
                }
            
                this.isSwitchingArmor = true;
                self.setSprite(newArmorSprite);
                self.setSpriteName(newArmorSprite.id);
                var blanking = setInterval(function() {
                    self.setVisible(toggle());

                    count -= 1;
                    if(count === 1) {
                        clearInterval(blanking);
                        self.isSwitchingArmor = false;
                    
                        if(self.switch_callback) {
                            self.switch_callback();
                        }
                    }
                }, 90);
            }
        },
        
        onArmorLoot: function(callback) {
            this.armorloot_callback = callback;
        },
    
        onSwitchItem: function(callback) {
            this.switch_callback = callback;
        },
        
        onInvincible: function(callback) {
            this.invincible_callback = callback;
        },

        onLevelChanged: function (callback) {
            this.level_callback = callback;
        },

        startInvincibility: function() {
            var self = this;
        
            if(!this.invincible) {
                this.currentArmorSprite = this.getSprite();
                this.invincible = true;
                this.invincible_callback();      
            } else {
                // If the player already has invincibility, just reset its duration.
                if(this.invincibleTimeout) {
                    clearTimeout(this.invincibleTimeout);
                }
            }
        
            this.invincibleTimeout = setTimeout(function() {
                self.stopInvincibility();
                self.idle();
            }, 15000);
        },
    
        stopInvincibility: function() {
            this.invincible_callback();
        
            if(this.currentArmorSprite) {
                this.setSprite(this.currentArmorSprite);
                this.setSpriteName(this.currentArmorSprite.id);
                this.currentArmorSprite = null;
            }
            if(this.invincibleTimeout) {
                clearTimeout(this.invincibleTimeout);
            }
            this.invincible = false;
        },

        flagPVP: function (pvpFlag) {
            this.pvpFlag = pvpFlag;
        },

        flagPVPWait: function (pvpWaitFlag) {
            this.pvpWaitFlag = pvpWaitFlag;
        }
    });

    return Player;
});