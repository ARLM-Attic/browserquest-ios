



define(['character'], function(Character) {

    var translateList = function (prefix) {
        var translations = [];

        var length = parseInt(gls(prefix + ".length"));

        for (var i = 0; i < length; i++) {
            translations.push(gls(prefix + "." + (i + 1)));
        }
        return translations;
    }

    var NpcTalk = {
        "guard": translateList("npc.guard"),
    
        "king": translateList("npc.king"),
    
        "villagegirl": translateList("npc.villagegirl"),
    
        "villager": translateList("npc.villager"),
    
        "agent": translateList("npc.agent"),
    
        "rick": translateList("npc.rick"),
        
        "scientist": translateList("npc.scientist"),
    
        "nyan": [
            "nyan nyan nyan nyan nyan",
            "nyan nyan nyan nyan nyan nyan nyan",
            "nyan nyan nyan nyan nyan nyan",
            "nyan nyan nyan nyan nyan nyan nyan nyan"
        ],
        
        "forestnpc": [
            "lorem ipsum dolor sit amet",
            "consectetur adipisicing elit, sed do eiusmod tempor"
        ],
        
        "lavanpc": [
            "lorem ipsum dolor sit amet",
            "consectetur adipisicing elit, sed do eiusmod tempor"
        ],

        "pvpnpc": translateList("npc.pvpnpc"),
    
        "priest": translateList("npc.priest"),
        
        "sorcerer": translateList("npc.sorcerer"),
        
        "octocat": translateList("npc.octocat"),
        
        "coder": translateList("npc.coder"),
    
        "beachnpc": translateList("npc.beachnpc"),
        
        "desertnpc": translateList("npc.desertnpc"),
    
        "othernpc": [
            "lorem ipsum",
            "lorem ipsum"
        ]
    };

    var Npc = Character.extend({
        init: function(id, kind) {
            this._super(id, kind, 1);
            this.itemKind = Types.getKindAsString(this.kind);
            this.talkCount = NpcTalk[this.itemKind].length;
            this.talkIndex = 0;
        },
    
        talk: function() {
            var msg = null;
        
            if(this.talkIndex > this.talkCount) {
                this.talkIndex = 0;
            }
            if(this.talkIndex < this.talkCount) {
                msg = NpcTalk[this.itemKind][this.talkIndex];
            }
            this.talkIndex += 1;
            
            return msg;
        }
    });
    
    return Npc;
});