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
    /**
     * @param {function} Func_OnClose 
     */
    constructor(Func_OnClose){
        super();
        
        this.Str_CurrentSpawn = null;

        this.Lst_ActiveLevels = [];     //Being ticked
        this.Lst_InactiveLevels = [];   //not being ticked
        this.Player = null;

        this.Layer_MiniMapLayer = null;

        this.Func_OnClose = Func_OnClose;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){
        //first Create level
        if(this.Lst_ActiveLevels.length <= 0
                && this.Lst_InactiveLevels.length <= 0
                && this.Str_CurrentSpawn != null){

            var Level = coreData.AssetLibrary.GetLevelInstance(coreData.AssetLibrary.Str_GetLevelBySpawn(this.Str_CurrentSpawn));
            if(Level != null){
                Level.AddToLayer(this);
                this.Lst_ActiveLevels.push(Level);
            }
        }
        //create/Recreate player
        if(this.Lst_ActiveLevels.length > 0){
            //respawn player
            if(this.Player == null){
                var SpawnInstance = null;
                for(var loop = 0; SpawnInstance == null && loop < this.Lst_ActiveLevels.length; loop++){
                    SpawnInstance = this.Lst_ActiveLevels[loop].Obj_GetSpawnByName(this.Str_CurrentSpawn);
                }
                for(var loop = 0; SpawnInstance == null && loop < this.Lst_InactiveLevels.length; loop++){
                    var inactiveLevel = this.Lst_InactiveLevels[loop];
                    SpawnInstance = inactiveLevel.Obj_GetSpawnByName(this.Str_CurrentSpawn);
                   
                    this.Lst_InactiveLevels.splice(loop, 1);
                    inactiveLevel.AddToLayer(this);
                    this.Lst_ActiveLevels.push(inactiveLevel);
                    break;
                }
                if(SpawnInstance != null && SpawnInstance.Bool_IsLoaded()){
                    this.Player = new PlayerObject();
                    this.Player.Vector_Center.Assign(SpawnInstance.Vector_GetSpawnPosition());
                    this.AddInstance(this.Player, Enum_ObjectPriorities.PRIORITY_OBJECT_PLAYER);
                }
            }
            //restart level
            else if(this.Player.Layer != this) {
                this.ClearInstances();
                this.Lst_ActiveLevels = [];
                this.Lst_InactiveLevels = [];
                this.Player = null;
            }
        }

        //make sure adjacent levels are active
        //pull any levels that are not active
        if(this.Player != null
                && this.Player.Layer == this
                && this.Player.Bool_IsLoaded()){

            //figure out what levels should be active
            var Set_NewActiveLevelDefs = new Set();
            this.Lst_ActiveLevels.forEach(elementActiveLevel => {
                if(elementActiveLevel.Bool_forEachRoomInBounds(this.Player.LstBoxes_GetHitBoxesInLocalSpace(this.Player.Str_BlocksMovement), true, () => { return true; })){
                    if(elementActiveLevel.LevelDef != null){
                        Set_NewActiveLevelDefs.add(elementActiveLevel.LevelDef);
                        elementActiveLevel.LevelDef.Lst_AdjacentLevels.forEach(elementLevelDef => {
                            Set_NewActiveLevelDefs.add(elementLevelDef);
                        });
                    }               
                }
            });
            //pull levels that should not be active
            for(var loop = 0; loop < this.Lst_ActiveLevels.length; /*This is not a typo*/){
                var current = this.Lst_ActiveLevels[loop];
                if(current.LevelDef != null){
                    if(Set_NewActiveLevelDefs.has(current.LevelDef)){
                        Set_NewActiveLevelDefs.delete(current.LevelDef);
                        loop++;
                    }
                    else {
                        current.RemoveFromLayer();
                        this.Lst_InactiveLevels.push(current);
                        this.Lst_ActiveLevels.splice(loop, 1);
                    }
                }
            }
            //add levels that should be active
            Set_NewActiveLevelDefs.forEach(elementMissingDef => {
                var newInstance = null;
                for(var loop = 0; loop < this.Lst_InactiveLevels.length; loop++){
                    var tempLevel = this.Lst_InactiveLevels[loop];
                    if(tempLevel.LevelDef == elementMissingDef){
                        newInstance = tempLevel;
                        this.Lst_InactiveLevels.splice(loop, 1);
                        break;
                    }
                }
                if(newInstance == null){
                    newInstance = elementMissingDef.Level_CreateInstance();
                }
                if(newInstance != null){
                    newInstance.AddToLayer(this);
                    this.Lst_ActiveLevels.push(newInstance);
                }
            });
        }
        //show mimimap
        var Bool_MiniMapOpen = false;
        if(this.Layer_MiniMapLayer != null 
                && this.LayerStack != null
                && this.Layer_MiniMapLayer.LayerStack == this.LayerStack){
            
            Bool_MiniMapOpen = true;
        }
        else{
            for(var loop = 0; loop < coreData.InputManager.Lst_CurrentTickInputs.length; loop++){
                var input = coreData.InputManager.Lst_CurrentTickInputs[loop];
                if(input.Bool_ButtonDown 
                        && (input.Enum_KeyboardInput == Enum_KeyboardButtons.BUTTON_ESCAPE
                            || input.Enum_KeyboardInput == Enum_KeyboardButtons.BUTTON_F10)){
                    
                    Bool_MiniMapOpen = true;
                    break;
                }
            }
            if(Bool_MiniMapOpen){
                if(this.Layer_MiniMapLayer == null){
                    var self = this;
                    this.Layer_MiniMapLayer = new MiniMapLayer(() => {
                        //on exit
                        this.LayerStack.RemoveLayer(this);
                        if(this.Func_OnClose != null){
                            this.Func_OnClose();
                        }
                    });
                    this.Layer_MiniMapLayer.SetCurrentCheckpoint(this.Str_CurrentSpawn);
                }
                this.LayerStack.AddLayer(this.Layer_MiniMapLayer, this.Num_StackPriority)
                if(this.Player != null){
                    this.Layer_MiniMapLayer.UpdatePlayerState(this.Player.Vector_Center, this.Player.Rotation, true);
                }
                else{
                    this.Layer_MiniMapLayer.UpdatePlayerState(null, null, false);
                }
            }
        }
         //update Save
         if(coreData.GameSave != undefined){
            var playerSave = coreData.GameSave.PlayerSave_GetSelectedPlayer();
            if(playerSave != null){
                playerSave.SetCheckpoint(this.Str_CurrentSpawn);
            }
        }
        //tick game objects
        if(DeltaTime >= 0.1){
            DeltaTime = 0.1;
        }
        this.bool_IsPaused = Bool_MiniMapOpen || !coreData.InputManager.Bool_HasFocus;   
        super.Tick(coreData, DeltaTime);
    }
     /**
     * @param {string} Str_NewRespawnName 
     */
    SetPlayerRespawn(Str_NewRespawnName){
        this.Str_CurrentSpawn = Str_NewRespawnName;

        //update minimap
        if(this.Layer_MiniMapLayer != null){
            this.Layer_MiniMapLayer.SetCurrentCheckpoint(Str_NewRespawnName);
        }
    }
    GetPlayerRespawn(){
        return this.Str_CurrentSpawn;
    }
    GetPlayer(){
        return this.Player;
    }
}