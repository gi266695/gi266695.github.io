//each square on the map
class TileFactory extends BaseAsset {
    constructor(){
        super();

        this.Dct_Tiles = {};
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
            "Tiles": [{TileDef}, {TileDef}]
        }
        */
        if(Array.isArray(JSONObject.Tiles)){
            JSONObject.Tiles.forEach(element => {
                var newDef = new TileDef();
                if(newDef.bool_LoadFromFileData(String_Path, element)
                        && newDef.Str_Name.length > 0){
                    
                    this.Dct_Tiles[newDef.Str_Name] = newDef;
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
        for(var key in this.Dct_Tiles){
            RetVal.push.apply(RetVal, this.Dct_Tiles[key].LstStr_GetDependencies());
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
        for(var key in this.Dct_Tiles){
            this.Dct_Tiles[key].SetDependencies(assetLibrary);
        }
    }
    /**
     * @param {string} Str_Name
     * @param {Vector2D} Vector_Center 
     */
    CreateInstance(Str_Name, Vector_Center){
        if(Str_Name == null || Vector_Center == null){
            return null;
        }
        Str_Name = Str_Name.toLowerCase();
        if(Str_Name in this.Dct_Tiles){
            return this.Dct_Tiles[Str_Name].CreateInstance(Vector_Center);
        }
        return null;
    }
    /**
     * @param {Vector2D} Vector_Center 
     */
    Sprite_GetMiniMapSprite(Str_Name, Vector_Center){
        if(Str_Name == null || Vector_Center == null){
            return null;
        }
        Str_Name = Str_Name.toLowerCase();
        if(Str_Name in this.Dct_Tiles){
            return this.Dct_Tiles[Str_Name].Sprite_GetMiniMapSprite(Vector_Center);
        }
        return null;
    }
}

class TileDef extends BaseAsset {
    constructor(){
        super();

        this.Str_Name = "";
        this.Str_Animation = null;
        this.Bool_RandomAnimationStart = false;
        this.Num_Priority = 0;

        this.AnimationReference = null;

        this.Num_MoveSpeed = 1;
        this.Bool_BlocksVision = false;
        this.Bool_BlocksShots = false;
        this.Bool_BlocksMovement = false;

        this.SpriteDef_MapTileDef = null;
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
            Name: "",
            "Animation": "",
            "Animation": {AnimationAsset},
            "RandomizeAnimStart": false,
            "MoveSpeed": 1,
            "BlocksVision": false,
            "BlocksShots": false,
            "BlocksMovement": false
        }
        */
        if(typeof JSONObject.Name === 'string'){
            this.Str_Name = JSONObject.Name.toLowerCase();
        }
        if(typeof JSONObject.Animation === 'string'){
            this.Str_Animation = JSONObject.Animation;
        }
        else if(typeof JSONObject.Animation === 'object'){
            this.Str_Animation = null;
            var Animation = new AnimationAsset();
            if(Animation.bool_LoadFromFileData(String_Path, JSONObject.Animation)){
                this.AnimationReference = Animation;
            }
        }
        if(typeof JSONObject.RandomizeAnimStart === 'boolean'){
            this.Bool_RandomAnimationStart = JSONObject.RandomizeAnimStart;
        }
        if(typeof JSONObject.Priority === 'number'){
            this.Num_Priority = JSONObject.Priority;
        }
        if(typeof JSONObject.BlocksVision === 'boolean'){
            this.Bool_BlocksVision = JSONObject.BlocksVision;
        }
        if(typeof JSONObject.BlocksShots === 'boolean'){
            this.Bool_BlocksShots = JSONObject.BlocksShots;
        }
        if(typeof JSONObject.BlocksMovement === 'boolean'){
            this.Bool_BlocksMovement = JSONObject.BlocksMovement;
        }

        if(this.Bool_BlocksMovement && (!this.Bool_BlocksVision && !this.Bool_BlocksShots)){
            this.Num_Priority = Enum_ObjectPriorities.PRIORITY_MAP_TILE_WALL_SHORT;
        }
        else if(this.Bool_BlocksVision || this.Bool_BlocksShots){
            this.Num_Priority = Enum_ObjectPriorities.PRIORITY_MAP_TILE_WALL_TALL;
        }
        else{
            this.Num_Priority = Enum_ObjectPriorities.PRIORITY_MAP_TILE_FLOOR;
        }

        return true;
    }
    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var LstStr_RetVal = [];
        if(this.Str_Animation != null){
            LstStr_RetVal.push(this.Str_Animation);
        }
        if(this.AnimationReference != null){
            LstStr_RetVal.push.apply(LstStr_RetVal, this.AnimationReference.LstStr_GetDependencies());
        }
        LstStr_RetVal.push("Data2/map/minimap_tile_sprite.json");
        return LstStr_RetVal;
    }
    /**
     * After all dependencies have been loaded this is called so that this can grab references to anything it needs
     * @param {AssetLibrary} assetLibrary 
     */
    SetDependencies(assetLibrary){ 
        if(assetLibrary == null){
            return;
        }
        if(this.Str_Animation != null){
            this.AnimationReference = assetLibrary.GetAnimationDef(this.Str_Animation);
        }
        else if(this.AnimationReference != null){
            this.AnimationReference.SetDependencies(assetLibrary);
        }
        this.SpriteDef_MapTileDef = assetLibrary.GetSpriteDef("Data2/map/minimap_tile_sprite.json");
    }
    /**
     * @param {Vector2D} Vector_Center 
     */
    CreateInstance(Vector_Center){
        var RetVal = new MapTileInstance();
        RetVal.TileDef = this;
        if(this.Bool_RandomAnimationStart && this.AnimationReference != null){
            RetVal.AnimationTime = Math.random() * this.AnimationReference.Num_GetTotalAnimationMiliseconds();
        }
        RetVal.Init(Vector_Center);
        return RetVal;
    }
    /**
     * @param {Vector2D} Vector_Center 
     */
    Sprite_GetMiniMapSprite(Vector_Center){
        if(this.SpriteDef_MapTileDef == null){
            return null;
        }
        var Sprite_RetVal = this.SpriteDef_MapTileDef.SpriteInstance_GetNewInstance(null);
        if(Sprite_RetVal == null){
            return null;
        }
        if(Vector_Center != null){
            Sprite_RetVal.LocalTransform.TranslateSelf(Vector_Center.x, Vector_Center.y);
        }

        switch(this.Num_Priority){
        case Enum_ObjectPriorities.PRIORITY_MAP_TILE_FLOOR:
            Sprite_RetVal.SetAnimation('floor');
            break;

        case Enum_ObjectPriorities.PRIORITY_MAP_TILE_WALL_TALL:
            Sprite_RetVal.SetAnimation('wall');
            break;

        default:
        case Enum_ObjectPriorities.PRIORITY_MAP_TILE_WALL_SHORT:
            Sprite_RetVal.SetAnimation('idle');
            break;
        }
        return Sprite_RetVal;
    }
}

class MapTileInstance extends BaseInstance {
    constructor(){
        super();

        this.TileDef = null;
        this.Vector_Center = new Vector2D();
        this.HitBox = new PolygonalHitBox();
        this.AnimationTime = 0;

        //MapSprites
        this.LstBoxes_BlocksShots = [];
        this.LstBoxes_BlocksVision = [];
        this.LstBoxes_BlocksMovement = [];
    }
    /**
     * It is assumed that MapTileInstance does not move you need re-init it each time you move it
     * All Tiles are 1x1
     * @param {Vector2D} Vector_Center 
     */
    Init(Vector_Center){
        this.Vector_Center.Assign(Vector_Center);
        this.HitBox.Clear();
        this.HitBox.LstVec_Points.push(new Vector2D(0.5, 0.5));
        this.HitBox.LstVec_Points.push(new Vector2D(0.5, -0.5));
        this.HitBox.LstVec_Points.push(new Vector2D(-0.5, -0.5));
        this.HitBox.LstVec_Points.push(new Vector2D(-0.5, 0.5));  

        var Matrix = new Matrix3X3();
        Matrix.SetToTranslation(Vector_Center.x, Vector_Center.y);
        this.HitBox.TrasnformToSpace(Matrix);   
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){
        if(this.TileDef == null || this.TileDef.AnimationReference == null){
            return;
        }
        this.AnimationTime += DeltaTime;

        //map tiles do not play sounds
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform = null, ParentAlpha = 1){
        if(this.TileDef == null || this.TileDef.AnimationReference == null){
            return;
        }
        var CompleteTransform = new Matrix3X3();
        if(ParentTranform != null){
            CompleteTransform.MultiplyMatrix(ParentTranform);
        }
        CompleteTransform.TranslateSelf(this.Vector_Center.x, this.Vector_Center.y);
    
        this.TileDef.AnimationReference.Draw(coreData, CompleteTransform, ParentAlpha, this.AnimationTime);
    }  
    Vector_GetAudioCenter() {
        return this.Vector_Center;
    }
    ClearHitBoxes(){
        this.LstBoxes_BlocksShots = [];
        this.LstBoxes_BlocksVision = [];
        this.LstBoxes_BlocksMovement = [];
    }
}