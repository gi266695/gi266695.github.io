/** player enemies terain */
Enum_ObjectPriorities = {
    PRIORITY_MAP_TILE_FLOOR: 0, 
    PRIORITY_SPRITE_FLOOR: 1,
    PRIORITY_UI_FLOOR_INDICATOR: 2,
    PRIORITY_MAP_TILE_WALL_SHORT : 3, 
    PRIORITY_OBJECT_WALL_SHORT: 4,
    PRIORITY_SPRITE_SHORT: 5,
    PRIORITY_OBJECT_PLAYER: 6,  
    PRIORITY_OBJECT_ENEMY_SMALL: 7,
    PRIORITY_OBJECT_ENEMY_LARGE: 8,
    PRIORITY_OBJECT_BULLET_SMALL: 9,
    PRIORITY_OBJECT_BULLET_LARGE: 10,
    PRIORITY_MAP_TILE_WALL_TALL: 11,
    PRIORITY_OBJECT_WALL_TALL: 12,
    PRIORITY_SPRITE_TALL: 13,
    PRIORITY_UI_PROMPT: 14
};

Enum_EnemyTeams = {
    TEAM_NUTRAL: -1,
    TEAM_PLAYER: 0,
    TEAM_ENEMY_A: 1
};

class GameplayLayer extends GameLayer {
    constructor(){
        super();
    }
    Clear(){
        super.Clear();
        this.bool_loadingRoom = false;
        this.Lst_ActiveLevels = [];
        this.Player = null;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        //loads, add things to world
        //TODO: someone from the outide should tell us how to start up
        if(this.Player == null){
            this.Player = new PlayerObject();
            this.Player.Vector_Center.x = 2;
            this.Player.Vector_Center.y = 8;
            this.Player.Rotation = Math.PI * 0.25;
            this.AddInstance(this.Player, Enum_ObjectPriorities.PRIORITY_OBJECT_PLAYER);
        }
        else if(this.Player.Layer != this){
            this.Lst_ActiveLevels.forEach(element => {
                element.RemoveFromLayer();
            });
            this.Lst_ActiveLevels = [];
            this.Player = null;
        }

        if(this.Lst_ActiveLevels.length <= 0 && !this.bool_loadingRoom){
            this.bool_loadingRoom = true;
            coreData.AssetLibrary.LoadAssets(["Data/Structures/Splash/Test_level.json"], () => {
                var Level = coreData.AssetLibrary.GetLevelInstance("Data/Structures/Splash/Test_level.json");
                if(Level != null){
                    Level.AddToLayer(this);
                    this.Lst_ActiveLevels.push(Level);
                }
                this.bool_loadingRoom = false;
            });
        }
        //tick game objects
        if(DeltaTime >= 0.1){
            DeltaTime = 0.1;
        }
        this.bool_IsPaused = !coreData.InputManager.Bool_HasFocus;   
        super.Tick(coreData, DeltaTime);
    }
}