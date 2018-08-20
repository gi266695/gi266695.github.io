//objects an decoration on the map, them can animate but they cannot move
class MapSpiteFactory extends BaseAsset{
    constructor(){
        super();
        
        this.Dct_MapSpriteDefs = {};
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} JSONObject 
     */
    bool_LoadFromFileData(String_Path, JSONObject){
        if(typeof JSONObject !== "object"
                || JSONObject == null){
                    
            return false;   
        }
        /*
        {
            "Defs":[{MapSpriteDef}, {MapSpriteDef}]
        }
        */
        if(Array.isArray(JSONObject.Defs)){
            JSONObject.Defs.forEach(element => {
                var newDef = new MapSpriteDef();
                if(newDef.bool_LoadFromFileData(String_Path, element) && newDef.Str_Name.length > 0){
                    this.Dct_MapSpriteDefs[newDef.Str_Name] = newDef;
                }
            });
        }
        return true;
    }
    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var RetVal = [];
        for(var key in this.Dct_MapSpriteDefs){
            var MapSprite = this.Dct_MapSpriteDefs[key];
            if(MapSprite.Str_SpritePath != null){
                RetVal.push(MapSprite.Str_SpritePath);
            }
            else if(MapSprite.Sprite_def != null){
                RetVal.push.apply(RetVal, MapSprite.Sprite_def.LstStr_GetDependencies());
            }
        }
        return RetVal; 
    }
    /**
     * After all dependencies have been loaded this is called so that this can grab references to anything it needs
     * @param {AssetLibrary} assetLibrary 
     */
    SetDependencies(assetLibrary){ 
        if(assetLibrary == null){
            return;
        }
        for(var key in this.Dct_MapSpriteDefs)
        {
            var MapSprite = this.Dct_MapSpriteDefs[key];
            if(MapSprite.Str_SpritePath != null){
                MapSprite.Sprite_def = assetLibrary.GetSpriteDef(MapSprite.Str_SpritePath);
            }
            else if(MapSprite.Sprite_def != null){
                MapSprite.Sprite_def.SetDependencies(assetLibrary);
            }
        }
    }
    
    /**
     * @param {MapSpriteSpawn} Spawn 
     */
    MapSprite_CreateInstanceFromSpawn(Spawn){
        if(Spawn == null){
            return null;
        }
        return this.MapSprite_CreateInstance(Spawn.Name, Spawn.Matrix_GetTransform());
    }

    /**
     * @param {string} Str_Name 
     * @param {Matrix3x3} Matrix_Transform
     */
    MapSprite_CreateInstance(Str_Name, Matrix_Transform){
        if(Str_Name == null || Matrix_Transform == null){
            return null;
        }
        Str_Name = Str_Name.toLowerCase();
        if(Str_Name in this.Dct_MapSpriteDefs){
            return this.Dct_MapSpriteDefs[Str_Name].MapSprite_GetInstance(Matrix_Transform);
        }
        return null;
    }
}

class MapSpriteSpawn {
    constructor(){
        this.Name = "";
        this.Vector_Center = new Vector2D(); 
        this.Num_Rotation = 0;
        this.Num_Scale = 1;
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} JSONObject 
     */
    bool_LoadFromFileData(String_Path, JSONObject){
        if(typeof JSONObject !== "object"
                || JSONObject == null){
                    
            return false;   
        }
        /*
        {
            "Name": "lamp"
            "Center": {Vector2D},
            "Rotation": 0,
            "Scale": 1
        }
        */
        if(typeof JSONObject.Name == 'string'){
            this.Name = JSONObject.Name.toLowerCase();
        }
        var test = new Vector2D();
        if(test. bool_LoadFromFileData(String_Path, JSONObject.Center)){
            this.Vector_Center = test;
        }
        if(typeof JSONObject.Rotation == 'number'){
            this.Num_Rotation = JSONObject.Rotation;
        }
        if(typeof JSONObject.Scale == 'number'){
            this.Num_Scale = JSONObject.Scale;
        }
        return true;
    }

    Matrix_GetTransform(){
        var RetVal = new Matrix3X3();
        RetVal.SetToTranslation(this.Vector_Center.x, this.Vector_Center.y);
        RetVal.RotateSelf(this.Num_Rotation);
        RetVal.ScaleSelf(this.Num_Scale, this.Num_Scale);

        return RetVal;
    }
}

Enum_MapSpriteHeight = {
    SPRITE_HEIGHT_FLOOR: 0,
    SPRITE_HEIGHT_SHORT: 1,
    SPRITE_HEIGHT_TALL: 2,
};

class MapSpriteDef {
    constructor() {
        this.Str_Name = "";
        this.Str_SpritePath = null;
        this.Sprite_def = null;
        this.Enum_Height = Enum_MapSpriteHeight.SPRITE_HEIGHT_FLOOR;
        this.Str_BlocksShotsID = null;
        this.Str_BlocksVisionID = null;
        this.Str_BlocksMovementID = null;
    }

    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} JSONObject 
     */
    bool_LoadFromFileData(String_Path, JSONObject){
        if(typeof JSONObject !== "object"
                || JSONObject == null){
                    
            return false;   
        }
        /*
        {
            "Name": "",
            "Height": 0,
            "Sprite": "",
            "Sprite": {SpriteAsset},
            "BlocksShotsID": "",
            "BlocksVisionID": "",
            "BlocksMovementID": ""
        }
        */
        if(typeof JSONObject.Name === 'string'){
            this.Str_Name = JSONObject.Name.toLowerCase();
        }
        if(typeof JSONObject.Height === 'number'){
            this.Enum_Height = JSONObject.Height;
        }
        if(typeof JSONObject.Sprite == 'string'){
            this.Str_SpritePath = JSONObject.Sprite;
        }
        else if(typeof JSONObject.Sprite == 'object'){
            var newSprite = SpriteAsset();
            if(newSprite.bool_LoadFromFileData(String_Path, JSONObject)){
                this.Sprite_def = newSprite;
            }
        }
        if(typeof JSONObject.BlocksShotsID == 'string' && JSONObject.BlocksShotsID.length > 0){
            this.Str_BlocksShotsID = JSONObject.BlocksShotsID;
        }
        if(typeof JSONObject.BlocksVisionID == 'string' && JSONObject.BlocksVisionID.length > 0){
            this.Str_BlocksVisionID = JSONObject.BlocksVisionID;
        }
        if(typeof JSONObject.BlocksMovementID == 'string'&& JSONObject.BlocksMovementID.length > 0){
            this.Str_BlocksMovementID = JSONObject.BlocksMovementID;
        }
        return true;
    }
    Enum_GetPriority(){
        var DoesSomething = this.Str_BlocksShotsID != null
                            || this.Str_BlocksVisionID != null
                            || this.Str_BlocksMovementID != null;
        
        switch(this.Enum_Height){
        default:
        case Enum_MapSpriteHeight.SPRITE_HEIGHT_FLOOR:
            return Enum_ObjectPriorities.PRIORITY_SPRITE_FLOOR;

        case Enum_MapSpriteHeight.SPRITE_HEIGHT_SHORT:
            return DoesSomething ? Enum_ObjectPriorities.PRIORITY_OBJECT_WALL_SHORT : Enum_ObjectPriorities.PRIORITY_SPRITE_SHORT;
        
        case Enum_MapSpriteHeight.SPRITE_HEIGHT_TALL:
            return DoesSomething ? Enum_ObjectPriorities.PRIORITY_OBJECT_WALL_TALL : Enum_ObjectPriorities.PRIORITY_SPRITE_TALL;
        }
    }
    /**
     * @param {Matrix3X3} Matrix 
     */
    MapSprite_GetInstance(Matrix){
        if(this.Sprite_def == null){
            return null;
        }
        var newInstance = new MapSpriteInstance();
        newInstance.MapSprite_def = this;
        newInstance.Matrix = Matrix;
        newInstance.SpriteInstance = this.Sprite_def.SpriteInstance_GetNewInstance();
        if(this.Str_BlocksShotsID != null){
            newInstance.LstHitBox_BlocksShots = newInstance.LstBoxes_GetHitBoxesInLocalSpace(this.Str_BlocksShotsID, null);
        }
        if(this.Str_BlocksVisionID != null){
            newInstance.LstHitBox_BlocksVision = newInstance.LstBoxes_GetHitBoxesInLocalSpace(this.Str_BlocksVisionID, null);
        }
        if(this.Str_BlocksMovementID != null){
            newInstance.LstHitBox_BlocksMovement = newInstance.LstBoxes_GetHitBoxesInLocalSpace(this.Str_BlocksMovementID, null);
        }

        return newInstance;
    }
}

class MapSpriteInstance extends BaseInstance {
    constructor() {
        super();

        this.MapSprite_def = null;
        this.SpriteInstance = null;
        this.Matrix = new Matrix3X3();
        this.LstHitBox_BlocksShots = null;
        this.LstHitBox_BlocksVision = null;
        this.LstHitBox_BlocksMovement = null;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        if(this.SpriteInstance == null){
            return;
        }
        this.SpriteInstance.Tick(coreData, DeltaTime);
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha){
        if(this.SpriteInstance == null){
            return;
        }
        var Transform = new Matrix3X3();
        if(ParentTranform){
            Transform.Assign(ParentTranform);
        }
        Transform.MultiplyMatrix(this.Matrix);
        this.SpriteInstance.Draw(coreData, Transform, ParentAlpha);
    }
    LstBoxes_GetUniqueBoxes(){
        var retVal = [];
        if(this.LstHitBox_BlocksShots != null){
            this.LstHitBox_BlocksShots.forEach(element => {
                if(!retVal.includes(element)){
                    retVal.push(element);
                }
            });
        }
        if(this.LstHitBox_BlocksVision != null){
            this.LstHitBox_BlocksVision.forEach(element => {
                if(!retVal.includes(element)){
                    retVal.push(element);
                }
            });
        }
        if(this.LstHitBox_BlocksMovement != null){
            this.LstHitBox_BlocksMovement.forEach(element => {
                if(!retVal.includes(element)){
                    retVal.push(element);
                }
            });
        }
        return retVal;
    }
    /**
     * @param {String} Str_Type
     * @param {Matrix3X3} ParentTranform  
     */
    LstBoxes_GetHitBoxesInLocalSpace(Str_Type, ParentTranform){
        if(this.SpriteInstance == null){
            return [];
        }
        var Transform = new Matrix3X3();
        if(ParentTranform){
            Transform.Assign(ParentTranform);
        }
        Transform.MultiplyMatrix(this.Matrix);

        return this.SpriteInstance.LstBoxes_GetHitBoxesInLocalSpace(Str_Type, Transform);
    }
}