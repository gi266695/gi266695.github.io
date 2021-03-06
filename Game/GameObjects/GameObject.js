Enum_GameObjectLoadState = {
    LOAD_STATE_UNLOADED: 0,
    LOAD_STATE_STARTED: 1,
    LOAD_STATE_FINISHED: 2,
};
Enum_GameObjectTeam = {
    TEAM_NUTRAL_PASSIVE: -1,
    TEAM_NUTRAL_AGRESSIVE: 0,
    TEAM_PLAYER: 1,
    TEAM_ENEMY_1: 2,
};
Enum_GameObjectType = {
    TYPE_UNIT: 0,          //Player, Enemies
    TYPE_BULLET: 1,        //Bullet
    TYPE_INTERACTABLE: 2,  //levers, Doors Things complex enough to warent a Game Object but nothing should Draw Aggro
};

class GameObject extends BaseInstance{
    constructor(Str_SpritePath = null){
        super();
        //for internal use
        this.Str_AssetPaths = Str_SpritePath;
        this.LoadState = Enum_GameObjectLoadState.LOAD_STATE_UNLOADED;     
        this.Dct_GeneratedHitBoxes = {};
        this.Set_InRooms = new Set();
        
        //Set internally usfull externally
        this.Sprite = null;

        //You need to set these if you want them to do anything
        this.Vector_Center = new Vector2D(0, 0);
        this.Scale = 1;
        this.Rotation = 0;

        this.Str_BlocksShots = null;
        this.Str_BlocksVision = null;
        this.Str_BlocksMovement = null;
        this.Str_Visible = null;

        this.Enum_DefualtPriority = Enum_ObjectPriorities.PRIORITY_OBJECT_ENEMY_SMALL;

        this.Enum_Type = Enum_GameObjectType.TYPE_INTERACTABLE;
        this.Enum_Team = Enum_GameObjectTeam.TEAM_NUTRAL_PASSIVE;

    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        this.Bool_TryStartLoad(coreData);
        this.ClearCachedHitBoxes();
        if(this.Sprite != null){
            this.Sprite.Tick(coreData, DeltaTime);
        }
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha){
        var CompleteTransform = this.Matrix_GetTransform(ParentTranform);

        if(this.Sprite != null){
            this.Sprite.Draw(coreData, CompleteTransform, ParentAlpha);
        }
    }
    Vector_GetAudioCenter(){
        return this.Matrix_GetTransform().Vector_MultiplyVector(Vector_Zero);
    }
    bool_LoadFromFileData(Vector_ParentPosition, jsonObject){
        if(jsonObject == null
                || typeof jsonObject !== 'object'
                || typeof jsonObject.Name !== 'string'){
            return false;
        }
        /*
        {
            "Name": "",
            "Center": {Vector2D}
            "Rotation": 4,
            "Scale": 1,
        }
        */
        var Center = new Vector2D();
        if(Center.bool_LoadFromFileData("", jsonObject.Center)){
            this.Vector_Center = Center;
        }
        if(Vector_ParentPosition != null){
            this.Vector_Center.AddToSelf(Vector_ParentPosition);
        }
        if(typeof jsonObject.Rotation === 'number'){
            this.Rotation = jsonObject.Rotation;
        }
        if(typeof jsonObject.Scale === 'number'){
            this.Scale = jsonObject.Scale;
        }
        return true;
    }
    TakeDamage(){
        //overite this if you can take damage
    }
    /**
     * @param {CoreData} coreData 
     */
    Bool_TryStartLoad(coreData){
        if(this.LoadState == Enum_GameObjectLoadState.LOAD_STATE_UNLOADED
                && coreData != null 
                && coreData.AssetLibrary != null){

            this.LoadState = Enum_GameObjectLoadState.LOAD_STATE_STARTED;

            //load assets
            var lststr_Assets = [this.Str_AssetPaths];
            coreData.AssetLibrary.LoadAssets(lststr_Assets, ()=> {
                this.LoadState = Enum_GameObjectLoadState.LOAD_STATE_FINISHED;
                this.Sprite = coreData.AssetLibrary.SpriteInstance_GetSpriteInstance(lststr_Assets[0], this);
            });

            return true;
        }
        return false;
    }
    /**
     * @param {Matrix3X3} ParentTranform  
     */
    Matrix_GetTransform(ParentTranform = null){
        var RetVal = new Matrix3X3();
        if(ParentTranform != null){
            RetVal.MultiplyMatrix(ParentTranform);
        }
        RetVal.TranslateSelf(this.Vector_Center.x, this.Vector_Center.y);
        RetVal.RotateSelf(this.Rotation);
        RetVal.ScaleSelf(this.Scale, this.Scale);
        
        return RetVal;
    }
    Bool_IsLoaded(){
        return this.LoadState == Enum_GameObjectLoadState.LOAD_STATE_FINISHED;
    }
    /**
     * @param {GameObject} Obj_Other 
     */
    Bool_DoesObjAgroThis(Obj_Other){
        if(Obj_Other == null
                || Obj_Other == this
                || this.Enum_Type != Enum_GameObjectType.TYPE_UNIT
                || Obj_Other.Enum_Type != Enum_GameObjectType.TYPE_UNIT){
            return false;
        }
        if(this.Enum_Team == Enum_GameObjectTeam.TEAM_NUTRAL_PASSIVE){
            return false;
        }
        switch(Obj_Other.Enum_Team){
            case Enum_GameObjectTeam.TEAM_NUTRAL_PASSIVE: return false;
            case Enum_GameObjectTeam.TEAM_NUTRAL_AGRESSIVE: return true;
            default: return Obj_Other.Enum_Team != this.Enum_Team;
        }
        return false;
    }
    /**
     * @param {GameObject} Obj_Other 
     */
    Bool_DoesBulletHitThis(Obj_Other){
        if(Obj_Other == null
                || Obj_Other == this
                || this.Enum_Type != Enum_GameObjectType.TYPE_BULLET
                || Obj_Other.Enum_Type == Enum_GameObjectType.TYPE_BULLET){
              
            return false;
        }
        //Yep, It'd hit that
        return true;
    }
    /**
     * @param {GameObject} Obj_Other 
     */
    Bool_DoesBulletDamageThis(Obj_Other){
        if(Obj_Other == null){
            return false;
        }
        if(!this.Bool_DoesBulletHitThis(Obj_Other)){
            return false;
        }
        if(this.Enum_Team == Enum_GameObjectTeam.TEAM_NUTRAL_PASSIVE){
            return false;
        }
        switch(Obj_Other.Enum_Team){
            case Enum_GameObjectTeam.TEAM_NUTRAL_PASSIVE: return false;
            case Enum_GameObjectTeam.TEAM_NUTRAL_AGRESSIVE: return true;
            default: return Obj_Other.Enum_Team != this.Enum_Team;
        }
        return false;
    }
    ClearCachedHitBoxes(){
        this.Dct_GeneratedHitBoxes = {};
    }
    /**
     * @param {String} Str_Type
     * @param {Matrix3X3} ParentTranform  
     */
    LstBoxes_GetHitBoxesInLocalSpace(Str_Type, ParentTranform = null){
        if(this.Sprite == null || Str_Type == null){
            return [];
        }
        Str_Type = Str_Type.toLowerCase();
        if(ParentTranform == null && Str_Type in this.Dct_GeneratedHitBoxes){
            return this.Dct_GeneratedHitBoxes[Str_Type];
        }
        var CompleteTransform = this.Matrix_GetTransform(ParentTranform);

        var RetVal = this.Sprite.LstBoxes_GetHitBoxesInLocalSpace(Str_Type, CompleteTransform);
        if(ParentTranform == null){
            this.Dct_GeneratedHitBoxes[Str_Type] = RetVal;
        }

        return RetVal;
    }
    /**
     * @param {LevelInstance} Lst_Levels 
     */
    UpdateMapInforation(){
        if(this.Layer == null
                || !Array.isArray(this.Layer.Lst_ActiveLevels)
                || this.Layer.Lst_ActiveLevels.length <= 0){
            return;
        }
        var Lst_Levels = this.Layer.Lst_ActiveLevels;

        var Lst_HitBoxeNames = [];
        if(this.Str_BlocksShots != null && !Lst_HitBoxeNames.includes(this.Str_BlocksShots)){
            Lst_HitBoxeNames.push(this.Str_BlocksShots);
        }
        if(this.Str_BlocksVision != null && !Lst_HitBoxeNames.includes(this.Str_BlocksVision)){
            Lst_HitBoxeNames.push(this.Str_BlocksVision);
        }
        if(this.Str_BlocksMovement != null && !Lst_HitBoxeNames.includes(this.Str_BlocksMovement)){
            Lst_HitBoxeNames.push(this.Str_BlocksMovement);
        }
        if(this.Str_Visible != null && !Lst_HitBoxeNames.includes(this.Str_Visible)){
            Lst_HitBoxeNames.push(this.Str_Visible);
        }
        if(Lst_HitBoxeNames.length <= 0){
            return;
        }
        var Lst_HitBoxes = [];
        Lst_HitBoxeNames.forEach((element)=> {
            Lst_HitBoxes.push.apply(Lst_HitBoxes, this.LstBoxes_GetHitBoxesInLocalSpace(element))
        });
        if(Lst_HitBoxes.length <= 0){
            return;
        }
        var lst_NewRooms = [];
        forEach_RoomInBounds(Lst_Levels, Lst_HitBoxes, true, (Room) => {
            lst_NewRooms.push(Room);
            this.AddRoom(Room);
            Room.Bool_AddGameObjToRoom(this);
        });
        var Lst_ToRemove = null;
        this.Set_InRooms.forEach(Room => {
            if(!lst_NewRooms.includes(Room)){
                if(Lst_ToRemove == null){
                    Lst_ToRemove = [];
                }
                Lst_ToRemove.push(Room);
            }
        });
        if(Lst_ToRemove != null){
            Lst_ToRemove.forEach(Room => {
                Room.RemoveObjFromRoom(this);
                this.RemoveRoom(Room);
            });
        }
    }
    /**
     * remoces self from all mapTiles as well
     */
    RemoveSelfFromLayer(){
        if(this.Layer == null){
            return;
        }
        if(this.Sprite != null){
            this.Sprite.StopAllSounds();
        }

        //map tiles will tty to edit LstTile_OnTiles as we iterate so we don't want to iterate over LstTile_OnTiles 
        this.Set_InRooms.forEach(Room => {
            Room.RemoveObjFromRoom(this);
        });
        this.Set_InRooms.clear();

        //actually pull instance from layer
        this.Layer.RemoveInstance(this);
    }
    /**
     * @param {RoomInstance} Room_ToAdd 
     */
    AddRoom(Room_ToAdd){
        //TODO: is this to brute force
        if(Room_ToAdd == null || this.Set_InRooms.has(Room_ToAdd)){
            return;
        }
        this.Set_InRooms.add(Room_ToAdd);
    }
    /**
     * @param {RoomInstance} Room_ToRemove 
     */
    RemoveRoom(Room_ToRemove){
        if(Room_ToRemove == null || !this.Set_InRooms.has(Room_ToRemove)){
            return;
        }
        this.Set_InRooms.delete(Room_ToRemove);
        //TODO: is this to brute force
    }
}

function LstStr_GetGameObjectDependencies(){
    var retVal = [];
    retVal.push.apply(retVal, PlayerObject.LstStr_GetDependecies());
    retVal.push.apply(retVal, SimpleTurret.LstStr_GetDependecies());
    retVal.push.apply(retVal, SimpleBullet.LstStr_GetDependecies());
    retVal.push.apply(retVal, CheckpointObject.LstStr_GetDependecies());
    return retVal;
}
/**
 * @param {array} JSONSpawn 
 */
function GameObject_BuildFromSpawn(Vector_ParentPosition, JSONSpawn){
    if(JSONSpawn == null
            || typeof JSONSpawn !== 'object'
            || typeof JSONSpawn.Name !== 'string'){
        return null;
    }
    /*
    {
        "Name": "",
    }
    */
    JSONSpawn.Name = JSONSpawn.Name.toLowerCase();
    var RetVal = null;
    switch(JSONSpawn.Name){
        case 'simpleturret':
            RetVal = new SimpleTurret();
            if(!RetVal.bool_LoadFromFileData(Vector_ParentPosition, JSONSpawn)){
                RetVal = null
            }
            break;
            
        case Checkpoint_SpawnName:
            RetVal = new CheckpointObject();
            if(!RetVal.bool_LoadFromFileData(Vector_ParentPosition, JSONSpawn)){
                RetVal = null
            }
            break;
    }
    if(RetVal == null){
        console.log('GameObject_BuildFromSpawn(): failed to spawn Game Object of Type');
    }
    return RetVal;
}