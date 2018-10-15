Enum_BulletStates = {
    BULLET_UNINITIALIZED: -1,
    BULLET_MOVING: 0,
    BULLET_EXPLODING: 1          
};
Checkpoint_SpawnName = "checkpoint";
Checkpoint_SpritePath = "Data/Structures/Splash/Checkpoint_Sprite.json";

class CheckpointObject extends GameObject {
    constructor(){
        super(Checkpoint_SpritePath);

        this.Str_BlocksShots = null;
        this.Str_BlocksVision = null;
        this.Str_BlocksMovement = null;
        this.Str_Visible = null;

        this.Enum_DefualtPriority = Enum_ObjectPriorities.PRIORITY_MAP_TILE_WALL_SHORT;

        this.Enum_Type = Enum_GameObjectType.TEAM_NUTRAL;
        this.Enum_Team = Enum_GameObjectTeam.TYPE_INTERACTABLE;

        this.Str_Name = "";
        this.Bool_Initialized = false;
        this.Sprite_SpawnPosition = null;

        this.Bool_IsActive = false;
    }
    static LstStr_GetDependecies(){
        return [
            Checkpoint_SpritePath
        ];
    }
    /**
     * @param {object} jsonObject 
     */
    static Str_CheckpointGetNameFromSpawn(jsonObject){
        if(jsonObject == null
                || typeof jsonObject !== 'object'
                || typeof jsonObject.Name !== 'string'
                || jsonObject.Name != Checkpoint_SpawnName
                || typeof jsonObject.Checkpoint_SpawnName !== 'string'){
    
            return null;
        }
        return jsonObject.Checkpoint_SpawnName;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        super.Tick(coreData, DeltaTime);

        if(this.Sprite != null){
            if(!this.Bool_Initialized){
                this.Bool_Initialized = true;
                this.Sprite_SpawnPosition = this.Sprite.Sprite_GetSprite('Spawn_Position');
            }
            if(!this.Bool_IsActive){
                var Lst_Targets = Lst_GetGameObjects(this.Layer.Lst_ActiveLevels
                                                    , this.LstBoxes_GetHitBoxesInLocalSpace("interaction_Range")
                                                    , (GameObj) => { return GameObj.LstBoxes_GetHitBoxesInLocalSpace(GameObj.Str_Visible); }
                                                    , (GameObj) => { return GameObj != null && GameObj == this.Layer.GetPlayer(); }
                                                    , (GameObj, Lst_Boxes) => {return Bool_HasLineOfSite(this.Layer.Lst_ActiveLevels, this.Vector_Center, Lst_Boxes, [this, GameObj]);});
                
                if(Lst_Targets != null && Lst_Targets.length > 0){
                    this.Layer.SetPlayerRespawn(this.Str_Name); 
                }          
            }

            //play active animatoin if active
            var Bool_IsActive = this.Layer.GetPlayerRespawn() == this.Str_Name;
            if(this.Bool_IsActive != Bool_IsActive){
                this.Bool_IsActive = Bool_IsActive;
                this.Sprite.SetAnimation(this.Bool_IsActive ? 'Active' : 'Idle');
            }
        }
    }
    Vector_GetSpawnPosition(){
        if(this.Sprite != null && this.Sprite_SpawnPosition != null){
            var Transform = this.Sprite.Matrix_GetTransformByReference(this.Sprite_SpawnPosition, this.Matrix_GetTransform());
            if(Transform != null){
                return Transform.Vector_MultiplyVector(Vector_Zero);
            }
        }
        return this.Vector_Center;
    }
    /**
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(Vector_ParentPosition, jsonObject){
        if(!super.bool_LoadFromFileData(Vector_ParentPosition, jsonObject)){
            return false;
        }
        /**
        {
            "Checkpoint_SpawnName": "Spawn",
        } 
        */
        if(typeof jsonObject.Checkpoint_SpawnName === 'string'){
            this.Str_Name = jsonObject.Checkpoint_SpawnName;
        }
        return true;
    }
}