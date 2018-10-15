class LevelDef extends BaseAsset {
    constructor(){
        super();
        
        this.Str_LevelPath = "";
        this.Vector_Center = new Vector2D();
        this.HitBox = new PolygonalHitBox();
        this.LstDefs_Rooms = [];

        this.Lst_MapSpriteFactories = [];
        this.Lst_MapsSpriteFactoryRefs = [];
        this.Lst_MapSpriteSpawns = [];
        this.Lst_GameObjectSpawns = [];
        this.Set_CheckpointSpawns = new Set(); //these spawns are in Lst_GameObjectSpawns as well

        this.Lst_AdjacentLevelPaths = [];
        this.Lst_AdjacentLevels = [];
        this.Bool_AdjacentLevelsLoaded = false;
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
            "Center": {Vector2D},
            "AdjacentLevels": ["...", "..."],
            "Rooms": [{RoomDef}, {RoomDef}],
            "MapSprite_Defs": ["Data/...", "Data/..."],
            "MapSprite_Spawns": [{MapSpriteSpawn},{MapSpriteSpawn}]
            "GameObject_Spawns": [{object},{object}]
        }
        */
        if(String_Path != null){
            this.Str_LevelPath = String_Path;
        }
        var Center = new Vector2D();
        if(Center.bool_LoadFromFileData(String_Path, JSONObject.Center)){
            this.Vector_Center = Center;
            this.Vector_Center.x = Math.trunc(this.Vector_Center.x);
            this.Vector_Center.y = Math.trunc(this.Vector_Center.y);
        }
        //Rooms
        if(Array.isArray(JSONObject.Rooms)){
            JSONObject.Rooms.forEach(JSONRoom => {
                var newRoom = new RoomDef();
                if(newRoom.bool_LoadFromFileData(String_Path, JSONRoom)){
                    this.LstDefs_Rooms.push(newRoom);
                }
            });
        }
        //Map Sprites
        if(Array.isArray(JSONObject.MapSprite_Defs)){
            JSONObject.MapSprite_Defs.forEach((elementPath) => {
                if(typeof elementPath === 'string'){
                    this.Lst_MapSpriteFactories.push(elementPath);
                }
            });
        }
        if(Array.isArray(JSONObject.MapSprite_Spawns)){
            JSONObject.MapSprite_Spawns.forEach((elementSpawn) => {
                var newSpawn = new MapSpriteSpawn();
                if(newSpawn.bool_LoadFromFileData(String_Path, elementSpawn)){
                    this.Lst_MapSpriteSpawns.push(newSpawn);
                }
            });
        }
        //Game Object Spawns
        if(Array.isArray(JSONObject.GameObject_Spawns)){
            this.Lst_GameObjectSpawns = JSONObject.GameObject_Spawns;
            this.Lst_GameObjectSpawns.forEach(elementSpawn => {
                var Str_Name = CheckpointObject.Str_CheckpointGetNameFromSpawn(elementSpawn);
                if(Str_Name != null){
                    this.Set_CheckpointSpawns.add(elementSpawn);
                }
            });
        }
        //Adjacent levels
        if(Array.isArray(JSONObject.AdjacentLevels)){
            JSONObject.AdjacentLevels.forEach(element => {
                if(typeof element === 'string'){
                    this.Lst_AdjacentLevelPaths.push(element);
                }
            });
        }

        //update bounds
        var MinX = null;
        var MinY = null;
        var MaxX = null;
        var MaxY = null;
        this.LstDefs_Rooms.forEach(Room => {
            var temp = this.Vector_Center.x + Room.Vector_Center.x - (Room.Num_Width / 2) - 0.5;
            if(MinX == null){
                MinX = temp;
            }
            else {
                MinX = Math.min(MinX, temp);
            }
            temp = this.Vector_Center.y + Room.Vector_Center.y - (Room.Num_Height / 2) - 0.5;
            if(MinY == null){
                MinY = temp;
            }
            else {
                MinY = Math.min(MinY, temp);
            }
            temp = this.Vector_Center.x + Room.Vector_Center.x + (Room.Num_Width / 2) - 0.5;
            if(MaxX == null){
                MaxX = temp;
            }
            else {
                MaxX = Math.max(MaxX, temp);
            }
            temp = this.Vector_Center.y +Room.Vector_Center.y + (Room.Num_Height / 2) - 0.5;
            if(MaxY == null){
                MaxY = temp;
            }
            else {
                MaxY = Math.max(MaxY, temp);
            }
        });
        if(MinX == null || MinY == null || MaxX == null || MaxY == null){
            return false;
        }
        this.HitBox.Clear();
        this.HitBox.LstVec_Points.push(new Vector2D(MinX, MinY));
        this.HitBox.LstVec_Points.push(new Vector2D(MinX, MaxY));
        this.HitBox.LstVec_Points.push(new Vector2D(MaxX, MaxY));
        this.HitBox.LstVec_Points.push(new Vector2D(MaxX, MinY));
        this.HitBox.Init();

        return true;
    }
    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var RetVal = [];
        this.LstDefs_Rooms.forEach(element => {
            RetVal.push.apply(RetVal, element.LstStr_GetDependencies());
        });
        RetVal.push.apply(RetVal, this.Lst_MapSpriteFactories);
        
        //we cannot list Adjacent levels as dependencies because these dependencies are circular
        //RetVal.push.apply(RetVal, this.Lst_AdjacentLevelPaths);
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
        this.LstDefs_Rooms.forEach(element => {
            element.SetDependencies(assetLibrary);
        });
        this.Lst_MapSpriteFactories.forEach((element) => {
            var newFact = assetLibrary.GetMapSpiteFactoryDef(element);
            if(newFact != null){
                this.Lst_MapsSpriteFactoryRefs.push(newFact);
            }
        });
    }
    SetAdjacentLevels(assetLibrary){
        if(assetLibrary == null){
            return;
        }
        //adding adjacent levels in a seperate step to avoid circulat dependency shananagans
        this.Bool_AdjacentLevelsLoaded = true;
        this.Lst_AdjacentLevelPaths.forEach((element) => {
            var level = assetLibrary.GetLevelDef(element);
            if(level != null){
                this.Lst_AdjacentLevels.push(level);
            }
        });
    }

    Level_CreateInstance(){
        var RetVal = new LevelInstance();
        RetVal.LevelDef = this;

        var Temp = new Vector2D();

        //create room Instances
        this.LstDefs_Rooms.forEach(element => {
            Temp.Assign(this.Vector_Center);
            Temp.AddToSelf(element.Vector_Center);
            var RoomInstance = element.Room_CreateRoomInstance(Temp);
            if(RoomInstance != null){
                RetVal.LstInstances_Rooms.push(RoomInstance);
            }
        });

        //create map sprite instances
        this.Lst_MapSpriteSpawns.forEach((spawn) => {
            for(var loop = 0; loop < this.Lst_MapsSpriteFactoryRefs.length; loop++){
                var Instance = this.Lst_MapsSpriteFactoryRefs[loop].MapSprite_CreateInstanceFromSpawn(spawn);
                if(Instance != null){
                    RetVal.LstInstances_MapSprites.push(Instance);
                    break;
                }
            }
        });

        //Create Game Objects
        this.Lst_GameObjectSpawns.forEach((spawn) => {
            var Obj = GameObject_BuildFromSpawn(this.Vector_Center, spawn);
            if(Obj != null){
                RetVal.LstInstances_GameObjects.push(Obj);
                if(this.Set_CheckpointSpawns.has(spawn)){
                    RetVal.Dct_SpawnsByName[CheckpointObject.Str_CheckpointGetNameFromSpawn(spawn)] = Obj;
                }
            }
        });
        return RetVal;
    }

    /**
     * @param {array} Lst_ToAddTo 
     */
    AddRoomMiniMapSprites(Lst_ToAddTo){
        if(Lst_ToAddTo == null){
            return;
        }
        var Temp = new Vector2D();
        this.LstDefs_Rooms.forEach(element => {
            Temp.Assign(this.Vector_Center);
            Temp.AddToSelf(element.Vector_Center);

            element.AddMiniMapSprites(Temp, Lst_ToAddTo);
        });
    }
    
    LstStr_GetCheckpointSpawnNames(){
        var Lst_RetVal = [];
        this.Set_CheckpointSpawns.forEach(element => {
            Lst_RetVal.push(CheckpointObject.Str_CheckpointGetNameFromSpawn(element));
        });
        return Lst_RetVal;
    }
    LstObj_GetCheckpointSpawns(){
        var Lst_RetVal = [];
        this.Set_CheckpointSpawns.forEach(element => {
            Lst_RetVal.push(element);
        });
        return Lst_RetVal;
    }
}

class LevelInstance {
    constructor(){
        this.LevelDef = null;
        this.Layer = null;

        this.LstInstances_Rooms = [];
        this.LstInstances_MapSprites = [];
        this.LstInstances_GameObjects = [];

        this.Dct_SpawnsByName = {};

        //lookup table for what tiles are where
        this.DctDct_TilesByPosition = {};
    }
    /**
     * @param {GameplayLayer} Layer_Target 
     */
    AddToLayer(Layer_Target){
        if(Layer_Target == null
                || this.LevelDef == null
                || this.Layer != null){

            return;
        }
        //add tiles
        this.Layer = Layer_Target;
        this.LstInstances_Rooms.forEach(Room => {
            if(Room != null){
                Room.AddToLayer(Layer_Target);
            }
        });

        //add map sprites
        var Lst_Levels = [];
        Lst_Levels.push(this);
        this.LstInstances_MapSprites.forEach(sprite => {
            if(sprite != null && sprite.MapSprite_def != null){
                //add to layer
                Layer_Target.AddInstance(sprite, sprite.MapSprite_def.Enum_GetPriority());
                
                //add to tiles
                forEach_TileInBounds(Lst_Levels, sprite.LstHitBox_BlocksShots, false, true, (Tile) => {
                    Tile.LstBoxes_BlocksShots.push.apply(Tile.LstBoxes_BlocksShots, sprite.LstHitBox_BlocksShots);
                });
                forEach_TileInBounds(Lst_Levels, sprite.LstHitBox_BlocksVision, false, true, (Tile) => {
                    Tile.LstBoxes_BlocksVision.push.apply(Tile.LstBoxes_BlocksVision, sprite.LstHitBox_BlocksVision);
                });
                forEach_TileInBounds(Lst_Levels, sprite.LstHitBox_BlocksMovement, false, true, (Tile) => {
                    Tile.LstBoxes_BlocksMovement.push.apply(Tile.LstBoxes_BlocksMovement, sprite.LstHitBox_BlocksMovement);
                });
            }
        });

        //add Game Objects
        this.LstInstances_GameObjects.forEach((obj) => {
            Layer_Target.AddInstance(obj, obj.Enum_DefualtPriority);
        });

        console.log("LevelInstance.AddToLayer() Added Level [" +  this.LevelDef.Str_LevelPath + "]");
    }
    RemoveFromLayer(){
        //pull rooms
        this.LstInstances_Rooms.forEach(Room => {
            if(Room != null){
                Room.RemoveFromLayer();
            }
        });

        //pull map sprites
        this.LstInstances_MapSprites.forEach(sprite => {
            if(sprite != null){
                sprite.StopAllSounds();
                this.Layer.RemoveInstance(sprite);
            }
        });

        //pull game objects
        for(var loop = 0; loop < this.LstInstances_GameObjects.length; /*Not a typo*/){
            var obj = this.LstInstances_GameObjects[loop];
            //if an obj killed itself don't re-add it
            if(obj.Layer != this.Layer){
                this.LstInstances_GameObjects.splice(loop, 1);
            }
            else{
                obj.RemoveSelfFromLayer();
                loop++;
            }
        }
        this.Layer = null;
        
        console.log("LevelInstance.RemoveFromLayer() Removed Level [" +  (this.LevelDef != null ? this.LevelDef.Str_LevelPath : "NULL Def") + "]");
    }
    Bool_IsInLayer(){
        return this.Layer != null;
    }
    /**
     * @param {Vector2D} Vector_Point 
     */
    Room_GetRoom(Vector_Point){
        if(Vector_Point == null 
                || this.LevelDef == null
                || this.LevelDef.HitBox == null){
            
            return null;
        }
        if(!this.LevelDef.HitBox.Bool_IsPointInside(Vector_Point)){
            return null;
        }
        //We assume rooms don't overlap
        for(var loop = 0; loop < this.LstInstances_Rooms.length; loop++){
            var Room = this.LstInstances_Rooms[loop];
            if(Room.HitBox.Bool_IsPointInside(Vector_Point)){
                return Room;
            }
        }
        return null;
    }
    /**
     * @param {Vector2D} Vector_Point 
     */
    Tile_GetTile(Vector_Point){
        if(Vector_Point == null){
            return null;
        }
        //get cached Tile
        var TruncX = Math.trunc(Vector_Point.x);
        var TruncY = Math.trunc(Vector_Point.y);
        var Dct_TilesByY = null;
        if(TruncX in this.DctDct_TilesByPosition){
            var Dct_TilesByY = this.DctDct_TilesByPosition[TruncX];
            if(TruncY in Dct_TilesByY){
                return Dct_TilesByY[TruncY];
            }
        }
        //find tile the hard way
        var Room = this.Room_GetRoom(Vector_Point);
        if(Room == null){
            return null;
        }
        //add to cash
        var RetVal = Room.Tile_GetTile(Vector_Point);
        if(RetVal != null){
            if(Dct_TilesByY == null){
                Dct_TilesByY = {};
                this.DctDct_TilesByPosition[TruncX] = Dct_TilesByY;
            }
            Dct_TilesByY[TruncY] = RetVal;
        }
        //profit
        return RetVal;
    }
    /**
     * @param {string} Str_Name 
     */
    Obj_GetSpawnByName(Str_Name){
        if(Str_Name in this.Dct_SpawnsByName){
            return this.Dct_SpawnsByName[Str_Name];
        }
        return null;
    }
    /**
     * if Func_Break return trues this loop break this returns true if Func_Break returns true 
     * Func_Break (RoomIntance) => Bool
     * @param {array} Lst_Boxes 
     * @param {boolean} Bool_CheckCollision 
     * @param {function} Func_Break
     */
    Bool_forEachRoomInBounds(Lst_Boxes, Bool_CheckCollision, Func_Break){
        if(Lst_Boxes == null || Func_Break == null){
            return false;
        }
        var Bool_Break = false
        for(var loopRoom = 0; !Bool_Break && loopRoom < this.LstInstances_Rooms.length; loopRoom++){
            var Room = this.LstInstances_Rooms[loopRoom];
            for(var loopBox = 0; loopBox < Lst_Boxes.length; loopBox++){
                var OBjBox = Lst_Boxes[loopBox];
                if(Bool_CheckCollision){
                    if(Bool_GetCollisionData(Room.HitBox, OBjBox)){
                        if(Func_Break(Room)){
                            Bool_Break = true;
                        }
                        break;
                    }
                }
                else if(Bool_GetIsWithinBounds(Room.HitBox, OBjBox)){
                    if(Func_Break(Room)){
                        Bool_Break = true;
                    }
                    break;
                }
            }
        }
        return Bool_Break;
    }
    /**
     * if Func_Break return trues this loop break this returns true if Func_Break returns true 
     * Func_Break (RoomIntance) => Bool
     * @param {Vector2D} Vec_Line1
     * @param {Vector2D} Vec_Line2
     * @param {boolean} Bool_CheckCollision 
     * @param {function} Func_Break
     */
    Bool_forEachRoomOnLine(Vec_Line1, Vec_Line2, Bool_CheckCollision, Func_Break){
        if(Vec_Line1 == null 
                || Vec_Line2 == null 
                || Func_Break == null){

            return false;
        }
        for(var loopRoom = 0; loopRoom < this.LstInstances_Rooms.length; loopRoom++){
            var Room = this.LstInstances_Rooms[loopRoom];
            if(Room.HitBox != null){
                if(Bool_CheckCollision){
                    if(Room.HitBox.Bool_IsLineInBox(Vec_Line1, Vec_Line2)){
                        if(Func_Break(Room)){
                            return true;
                        }
                    }
                }
                else if(Room.HitBox.Bool_IsLineWithinBounds(Vec_Line1, Vec_Line2)){
                    if(Func_Break(Room)){
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

class RoomDef extends BaseAsset {
    constructor(){
        super();

        this.LstStr_TileFactories = [];
        this.LstTile_FactoryReferences = [];

        this.Vector_Center = new Vector2D();
        this.Num_Width = 0;
        this.Num_Height = 0;

        this.LstLstStr_Tiles = [];  //[Rows][Columns]
        //TODO Obsticals, Enemies
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
            "TileSets": ["Data/...", "Data/..."],
            "Width": 5,
            "Height": 5,
            "UpperLeft": {Vector2D},
            "Tiles": [["Wall","floor"],["Wall","floor"]]
        }
        */
        if(Array.isArray(JSONObject.TileSets)){
            JSONObject.TileSets.forEach(element => {
                if(typeof element === 'string'){
                    this.LstStr_TileFactories.push(element);
                }
            });
        }
        if(typeof JSONObject.Width === 'number'){
            this.Num_Width = JSONObject.Width;
        }
        if(typeof JSONObject.Height === 'number'){
            this.Num_Height = JSONObject.Height;
        }
        var Center = new Vector2D();
        if(Center.bool_LoadFromFileData(String_Path, JSONObject.UpperLeft)){
            Center.x = Math.trunc(Center.x);
            Center.y = Math.trunc(Center.y);
            Center.x += (this.Num_Width / 2);
            Center.y += (this.Num_Height / 2);
            this.Vector_Center = Center;
        }
        if(Array.isArray(JSONObject.Tiles)){
            JSONObject.Tiles.forEach(elementRow => {
                var CurrentRow = [];
                if(Array.isArray(elementRow)){
                    elementRow.forEach(elementTile => {
                        if(typeof elementTile === 'string'){
                            CurrentRow.push(elementTile);
                        }
                        else{
                            console.log("RoomDef.bool_LoadFromFileData(" + String_Path + "): failed to load tile [" + elementTile + "] not a string");
                            CurrentRow.push("");
                        }
                    });
                }
                if(CurrentRow.length != this.Num_Width){
                    console.log("RoomDef.bool_LoadFromFileData(" + String_Path + "): Row is incorrect length");
                }
                this.LstLstStr_Tiles.push(CurrentRow);
            });
        }
        if(this.LstLstStr_Tiles.length != this.Num_Height){
            console.log("RoomDef.bool_LoadFromFileData(" + String_Path + "):  incorrect number of rows");
        }
        return true;
    }

    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var Retval = [];
        Retval.push.apply(Retval, this.LstStr_TileFactories);
        return Retval;
    }
    /**
     * After all dependencies have been loaded this is called so that this can grab references to anything it needs
     * @param {AssetLibrary} assetLibrary 
     */
    SetDependencies(assetLibrary){
        if(assetLibrary == null){
            return;
        }
        this.LstStr_TileFactories.forEach(element => {
            var Factory = assetLibrary.GetTileFactory(element);
            if(Factory != null){
                this.LstTile_FactoryReferences.push(Factory);
            }
        });
    }
    /**
     * @param {Vector2D} Vector_Center 
     */
    Room_CreateRoomInstance(Vector_Center){
        if(Vector_Center == null){
            return;
        }
        var Vector_temp = new Vector2D();

        var RetVal = new RoomInstance();
        RetVal.RoomDef = this;
        RetVal.Vector_Center.Assign(Vector_Center);
        for(var loopX = 0; loopX < this.Num_Width; ++loopX){
            for(var loopY = 0; loopY < this.Num_Height; ++loopY){
                if(loopY >= this.LstLstStr_Tiles.length
                        || this.LstLstStr_Tiles[loopY] == null
                        || loopX >= this.LstLstStr_Tiles[loopY].length){
                    
                    RetVal.Lst_Tiles.push(null);                    
                }
                else{
                    Vector_temp.x = Vector_Center.x - (this.Num_Width / 2) + loopX;
                    Vector_temp.y = Vector_Center.y - (this.Num_Height / 2) + loopY;
                    var NewTile = null;
                    for(var loopFactory = 0; NewTile == null && loopFactory < this.LstTile_FactoryReferences.length; ++loopFactory){
                        NewTile = this.LstTile_FactoryReferences[loopFactory].CreateInstance(this.LstLstStr_Tiles[loopY][loopX], Vector_temp);
                    }
                    RetVal.Lst_Tiles.push(NewTile); 
                }            
            }
        }
        RetVal.HitBox.LstVec_Points.push(new Vector2D(Vector_Center.x - (this.Num_Width / 2) - 0.5, Vector_Center.y - (this.Num_Height / 2) - 0.5));
        RetVal.HitBox.LstVec_Points.push(new Vector2D(Vector_Center.x + (this.Num_Width / 2) - 0.5, Vector_Center.y - (this.Num_Height / 2) - 0.5));
        RetVal.HitBox.LstVec_Points.push(new Vector2D(Vector_Center.x + (this.Num_Width / 2) - 0.5, Vector_Center.y + (this.Num_Height / 2) - 0.5));
        RetVal.HitBox.LstVec_Points.push(new Vector2D(Vector_Center.x - (this.Num_Width / 2) - 0.5, Vector_Center.y + (this.Num_Height / 2) - 0.5));
        RetVal.HitBox.Init();

        return RetVal;
    }
    AddMiniMapSprites(Vector_Center, Lst_ToAddTo){
        if(Vector_Center == null || Lst_ToAddTo == null){
            return;
        }
        var Vector_temp = new Vector2D();
        for(var loopX = 0; loopX < this.Num_Width; ++loopX){
            for(var loopY = 0; loopY < this.Num_Height; ++loopY){
                if(loopY < this.LstLstStr_Tiles.length
                        && this.LstLstStr_Tiles[loopY] != null
                        && loopX < this.LstLstStr_Tiles[loopY].length){
                
                    Vector_temp.x = Vector_Center.x - (this.Num_Width / 2) + loopX;
                    Vector_temp.y = Vector_Center.y - (this.Num_Height / 2) + loopY;
                    
                    var newSprite = null;
                    for(var loopFactory = 0; newSprite == null && loopFactory < this.LstTile_FactoryReferences.length; ++loopFactory){
                        newSprite = this.LstTile_FactoryReferences[loopFactory].Sprite_GetMiniMapSprite(this.LstLstStr_Tiles[loopY][loopX], Vector_temp);
                    }
                    if(newSprite != null){
                        Lst_ToAddTo.push(newSprite);
                    }
                }
            }
        }
    }
}

/**
 * Rooms are not sprites, there just a manager for adding or removing tiles from the world
 */
class RoomInstance {
    constructor(){
        this.Vector_Center = new Vector2D();
        this.HitBox = new PolygonalHitBox();
        this.RoomDef = null;
        this.Lst_Tiles = [];
        this.Layer = null;

        //Note these game objectsw have nothing to do with the ones swpawned by the level
        this.Set_GameObjectsInRoom = new Set();
    }
    /**
     * @param {GameplayLayer} Layer_Target 
     */
    AddToLayer(Layer_Target){
        if(Layer_Target == null
                || this.Layer != null
                || this.RoomDef == null){

            return;
        }
        this.Layer = Layer_Target;
        this.Lst_Tiles.forEach(Tile => {
            if(Tile != null && Tile.TileDef != null){
                Layer_Target.AddInstance(Tile, Tile.TileDef.Num_Priority);
            }
        });
    }
    RemoveFromLayer(){
        if(this.Layer == null){
            return;
        }
        this.Lst_Tiles.forEach(Tile => {
            if(Tile != null){
                this.Layer.RemoveInstance(Tile);
                Tile.ClearHitBoxes();
            }
        });
        this.ClearGameObjects();
        
        this.Layer = null;
    }
    /**
     * Vector_Position is in world coordinates
     * @param {*} Vector_Position 
     */
    Vector_GetRoomPosition(Vector_Position){
        if(Vector_Position == null || this.RoomDef == null){
            return null;
        }
        var RetVal = new Vector2D();
        RetVal.x = Math.trunc(Vector_Position.x - (this.Vector_Center.x - (this.RoomDef.Num_Width / 2)));
        RetVal.y = Math.trunc(Vector_Position.y - (this.Vector_Center.y - (this.RoomDef.Num_Height / 2)));
    
        return RetVal;
    }
    /**
     * Vector_Position is in world coordinates
     * @param {Vector2D} Vector_Position 
     */
    Tile_GetTile(Vector_Position){
        var RoomPosition = this.Vector_GetRoomPosition(Vector_Position);
        if(RoomPosition == null){
            return null;
        }
        return this.Tile_GetTileFromRoomPosition(RoomPosition.x, RoomPosition.y); 
    }
    /**
     * @param {number} RoomX 
     * @param {number} RoomY 
     */
    Tile_GetTileFromRoomPosition(RoomX, RoomY){
        if(this.RoomDef == null 
                || RoomX < 0
                || RoomX >= this.RoomDef.Num_Width
                || RoomY < 0
                || RoomY >= this.RoomDef.Num_Height){

            return null;
        }
        var index = (RoomX * this.RoomDef.Num_Height) + RoomY;
        if(index < 0 || index >= this.Lst_Tiles.length){
            return null;
        }
        return this.Lst_Tiles[index];
    }
    /**
     * @param {GameObject} Obj_ToAdd 
     */
    Bool_AddGameObjToRoom(Obj_ToAdd){
        if(Obj_ToAdd == null){
            return false;
        }
        if(!this.Set_GameObjectsInRoom.has(Obj_ToAdd)){
            this.Set_GameObjectsInRoom.add(Obj_ToAdd);
        }
        return true;
    }
    /**
     * @param {GameObject} Obj_ToRemove 
     */
    RemoveObjFromRoom(Obj_ToRemove){
        if(Obj_ToRemove == null || !this.Set_GameObjectsInRoom.has(Obj_ToRemove)){
            return;
        }
        this.Set_GameObjectsInRoom.delete(Obj_ToRemove);
    }
    ClearGameObjects(){
        this.Set_GameObjectsInRoom.forEach((Obj) => {
            Obj.RemoveRoom();
        });
        this.Set_GameObjectsInRoom.clear();
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     */
    Draw(coreData, ParentTranform){
        if(coreData == null || this.RoomDef == null){
            return;
        }
        this.HitBox.Draw(coreData, ParentTranform, "#ff0000");

        for(var loopX = 0; loopX < this.RoomDef.Num_Width; ++loopX){
            for(var loopY = 0; loopY < this.RoomDef.Num_Height; ++loopY){
                var Tile = this.Tile_GetTileFromRoomPosition(loopX,loopY);
                if(Tile != null 
                        && Tile.TileDef != null
                        && (Tile.TileDef.Num_MoveSpeed != 1 || Tile.TileDef.Bool_BlocksVision || Tile.TileDef.Bool_BlocksShots)
                        && Tile.HitBox != null){

                    Tile.HitBox.Draw(coreData, ParentTranform, "#ff00ff");
                }
            }
        }
    }
}
/**
 * Func_Break is passed a MapTileInstance, if it returns true the loop will break
 * @param {array} Lst_Levels 
 * @param {Vector2D} Vector_Start 
 * @param {Vector2D} Vector_End
 * @param {boolean} Bool_CollisionsOnly
 * @param {funtion} Func_Break 
 */
function forEach_TileOnLine(Lst_Levels, Vector_Start, Vector_End, Bool_CollisionsOnly, Func_Break){
    if(!Array.isArray(Lst_Levels)
            || Vector_Start == null
            || Vector_End == null
            || Func_Break == null){
        return;
    }
    //get bounds
    var MinX = Math.min(Vector_Start.x, Vector_End.x);
    var MinY = Math.min(Vector_Start.y, Vector_End.y);
    var MaxX = Math.max(Vector_Start.x, Vector_End.x);
    var MaxY = Math.max(Vector_Start.y, Vector_End.y);
    
    MinX = Math.round(MinX);
    MinY = Math.round(MinY);
    MaxX = Math.round(MaxX);
    MaxY = Math.round(MaxY);

    if(MinX > MaxX || MinY > MaxY){
        return;
    }

    var temp = new Vector2D();
    for(var loopX = MinX; loopX <= MaxX; ++loopX){
        for(var loopY = MinY; loopY <= MaxY; ++loopY){
            temp.x = loopX;
            temp.y = loopY;
            for(var loopLevel = 0; loopLevel < Lst_Levels.length; ++loopLevel){
                if(Lst_Levels[loopLevel] == null){
                    continue;
                }
                var Tile = Lst_Levels[loopLevel].Tile_GetTile(temp);
                if(Tile == null || Tile.HitBox == null){
                    continue;
                }
                if(Bool_CollisionsOnly){
                    if(!Tile.HitBox.Bool_IsLineInBox(Vector_Start, Vector_End)){
                        continue;
                    }
                }
                if(Func_Break(Tile)){
                    return;
                }
            }
        }
    }
}
/**
 * Func_Break is passed a MapTileInstance, if it returns true the loop will break
 * @param {array} Lst_Levels 
 * @param {array} Lst_HitBoxes 
 * @param {function} Func_Break 
 * @param {boolean} Bool_IncludeEdges
 * @param {boolean} Bool_CollisionsOnly
 */
function forEach_TileInBounds(Lst_Levels, Lst_HitBoxes, Bool_IncludeEdges, Bool_CollisionsOnly, Func_Break){
    if(!Array.isArray(Lst_Levels)
            || Lst_Levels.length <= 0
            || !Array.isArray(Lst_HitBoxes)
            || Lst_HitBoxes.length <= 0
            || Func_Break == null){
        
        return;
    }
    //get bounds
    var MinX = null;
    var MinY = null;
    var MaxX = null;
    var MaxY = null;

    Lst_HitBoxes.forEach(element => {
        var temp = element.Vector_Center.x - (element.Vector_Size.x / 2);
        if(MinX == null){
            MinX = temp;
        }
        else {
            MinX = Math.min(MinX, temp);
        }
        temp = element.Vector_Center.y - (element.Vector_Size.y / 2);
        if(MinY == null){
            MinY = temp;
        }
        else {
            MinY = Math.min(MinY, temp);
        }
        temp = element.Vector_Center.x + (element.Vector_Size.x / 2);
        if(MaxX == null){
            MaxX = temp;
        }
        else {
            MaxX = Math.max(MaxX, temp);
        }
        temp = element.Vector_Center.y + (element.Vector_Size.y / 2);
        if(MaxY == null){
            MaxY = temp;
        }
        else {
            MaxY = Math.max(MaxY, temp);
        }
    });
    if(MinX == null || MinY == null || MaxX == null || MaxY == null){
        return;
    }
    MinX = Math.round(MinX);
    MinY = Math.round(MinY);
    MaxX = Math.round(MaxX);
    MaxY = Math.round(MaxY);

    if(Bool_IncludeEdges){
        MinX -= 1;
        MinY -= 1;
        MaxX += 1;
        MaxY += 1;
    }
    if(MinX > MaxX || MinY > MaxY){
        return;
    }
    var temp = new Vector2D();
    for(var loopX = MinX; loopX <= MaxX; ++loopX){
        for(var loopY = MinY; loopY <= MaxY; ++loopY){
            temp.x = loopX;
            temp.y = loopY;
            for(var loopLevel = 0; loopLevel < Lst_Levels.length; ++loopLevel){
                if(Lst_Levels[loopLevel] == null){
                    continue;
                }
                var Tile = Lst_Levels[loopLevel].Tile_GetTile(temp);
                if(Tile == null || Tile.TileDef == null){
                    continue;
                }
                if(Bool_CollisionsOnly){
                    if(Tile.HitBox == null){
                        continue;
                    }
                    var IsColliding = false;
                    for(var LoopCollision = 0; !IsColliding && LoopCollision < Lst_HitBoxes.length; ++LoopCollision){
                        if(Bool_GetCollisionData(Lst_HitBoxes[LoopCollision], Tile.HitBox)){
                            IsColliding = true;
                        }
                    }
                    if(!IsColliding){
                        continue;
                    }
                }
                if(Func_Break(Tile)){
                    return;
                }
            }
        }
    }
}
/**
 * if Func_Break return trues this loop break this returns true if Func_Break returns true 
 * Func_Break (RoomIntance) => Bool
 * @param {array} Lst_Levels 
 * @param {array} Lst_Boxes 
 * @param {boolean} Bool_CollisionsOnly 
 * @param {function} Func_break 
 */
function forEach_RoomInBounds(Lst_Levels, Lst_Boxes, Bool_CollisionsOnly, Func_break){
    if(Lst_Levels == null
            || Lst_Boxes == null
            || Func_break == null){
        return;
    }
    for(var loopLevel = 0; loopLevel < Lst_Levels.length; loopLevel++){
        if(Lst_Levels[loopLevel].Bool_forEachRoomInBounds(Lst_Boxes, Bool_CollisionsOnly, Func_break)){
            return;
        }
    }
}
/**
 * if Func_Break return trues this loop break this returns true if Func_Break returns true 
 * Func_Break (RoomIntance) => Bool
 * @param {array} Lst_Levels 
 * @param {Vector2D} Vec_Line1
 * @param {Vector2D} Vec_Line2
 * @param {boolean} Bool_CollisionsOnly 
 * @param {function} Func_break
 */
function forEach_RoomOnLine(Lst_Levels, Vec_Line1, Vec_Line2, Bool_CollisionsOnly, Func_break){
    if(Lst_Levels == null
            || Vec_Line1 == null
            || Vec_Line2 == null
            || Func_break == null){
        return;
    }
    for(var loopLevel = 0; loopLevel < Lst_Levels.length; loopLevel++){
        if(Lst_Levels[loopLevel].Bool_forEachRoomOnLine(Vec_Line1, Vec_Line2, Bool_CollisionsOnly, Func_break)){
            return;
        }
    }
}
/**
 * @param {array} Lst_Levels 
 * @param {array} Lst_ObjectBoxes 
 * @param {function} Func_LstGetBoxes 
 * @param {function} Func_BoolPreCheck 
 * @param {function} Func_BoolPostCheck 
 */
function Lst_GetGameObjects(Lst_Levels, Lst_ObjectBoxes, Func_LstGetBoxes, Func_BoolPreCheck, Func_BoolPostCheck){
    if(Lst_Levels == null
            || Lst_ObjectBoxes == null
            || Func_LstGetBoxes == null){

        return null;
    }
    if(Func_BoolPreCheck == null){
        Func_BoolPreCheck = (GameObj) => {
            if(GameObj == null){
                return false;
            }
            var LstBoxes = Func_LstGetBoxes(GameObj);
            if(LstBoxes == null || LstBoxes.length <= 0){
                return false;
            }
            return true;
        }
    }
    if(Func_BoolPostCheck == null){
        Func_BoolPostCheck = (GameObj, Lst_Boxes) => {return true;}
    }
    var Retval = null;
    var FailedReturnVals = null;
    forEach_RoomInBounds(Lst_Levels, Lst_ObjectBoxes, false, (Room) => {
        var GameObjectsToCheck = null;
        Room.Set_GameObjectsInRoom.forEach(element_GameObj => {
            if(Func_BoolPreCheck(element_GameObj)
                    && (Retval == null || !Retval.includes(element_GameObj))
                    && (FailedReturnVals == null || !FailedReturnVals.includes(element_GameObj))){

                if(GameObjectsToCheck == null){
                    GameObjectsToCheck = [];
                }
                GameObjectsToCheck.push(element_GameObj);
            }
        });
        if(GameObjectsToCheck != null){
            var IsColidingWithRoom = false;
            for(var loop = 0; loop < Lst_ObjectBoxes.length; loop++){
                if(Bool_GetCollisionData(Room.HitBox, Lst_ObjectBoxes[loop])){
                    IsColidingWithRoom = true;
                    break;
                }
            }
            if(IsColidingWithRoom){
                GameObjectsToCheck.forEach((element_GameObj) => {            
                    var Element_HitBoxes = Func_LstGetBoxes(element_GameObj);
                    if(Element_HitBoxes != null){
                        var Bool_FoundCollision = false;
                        for(var loopElement = 0; !Bool_FoundCollision && loopElement < Element_HitBoxes.length; loopElement++){
                            for(var loopObj = 0; !Bool_FoundCollision && loopObj < Lst_ObjectBoxes.length; loopObj++){
                                Bool_FoundCollision = true;
                                if(Bool_GetCollisionData(Element_HitBoxes[loopElement], Lst_ObjectBoxes[loopObj])){
                                    var Bool_Success = false;
                                    if(Func_BoolPostCheck(element_GameObj, Element_HitBoxes)){
                                        if(Retval == null){
                                            Retval = [];
                                        }
                                        Retval.push(element_GameObj);
                                        Bool_Success = true;
                                    }
                                    if(!Bool_Success){
                                        if(FailedReturnVals == null){
                                            FailedReturnVals = [];
                                        }
                                        FailedReturnVals.push(element_GameObj);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    });
    return Retval;
}
/**
 * @param {array} Lst_Levels 
 * @param {GameObject} GameObj_Self 
 * @param {array} Lst_ObjectBoxes 
 */
function Lst_GetDamageTargets(Lst_Levels, GameObj_Self, Lst_ObjectBoxes){
    if(Lst_Levels == null
            || Lst_ObjectBoxes == null
            || GameObj_Self == null){

        return null;
    }
    return Lst_GetGameObjects(Lst_Levels
                            , Lst_ObjectBoxes
                            , (GameObj) => { return GameObj != GameObj_Self && (GameObj != null ? GameObj.LstBoxes_GetHitBoxesInLocalSpace(GameObj.Str_BlocksShots) : null); }
                            , (GameObj) => { return GameObj != null && GameObj_Self.Bool_DoesBulletDamageThis(GameObj); }
                            , (GameObj, Lst_Boxes) => { return true; } )
}

/**
 * Func_UseObj is expected to return true if the object is wanted otherwise false
 * @param {array} Lst_Levels 
 * @param {GameObject} GameObj_Self
 * @param {array} Lst_ObjectBoxes 
 * @param {function} Func_UseObj 
 */
function Lst_GetAgroTargets(Lst_Levels, GameObj_Self, Lst_ObjectBoxes, Func_UseObj = (Obj, Box) => {return true;}){
    if(Func_UseObj == null
            || Lst_ObjectBoxes == null
            || Func_UseObj == null
            || GameObj_Self == null
            || Lst_ObjectBoxes.length <= 0){

        return null;
    }
    return Lst_GetGameObjects(Lst_Levels
                            , Lst_ObjectBoxes
                            , (GameObj) => { return GameObj != null ? GameObj.LstBoxes_GetHitBoxesInLocalSpace(GameObj.Str_Visible) : null; }
                            , (GameObj) => { return GameObj != GameObj_Self && GameObj.Str_Visible != null && GameObj_Self.Bool_DoesObjAgroThis(GameObj); }
                            , Func_UseObj);
}
/**
 * @param {array} Lst_Levels 
 * @param {GameObject} GameObj_Self 
 * @param {array} Lst_ObjectBoxes 
 */
function Bool_IsBulletHitting(Lst_Levels, GameObj_Self, Lst_ObjectBoxes){
    if(Lst_Levels == null
            || Lst_ObjectBoxes == null
            || GameObj_Self == null){

        return false;
    }

    var Bool_FoundHit = false;
    var CheckedGameObjects = null;
    var CheckedBoxes = null;
    forEach_TileInBounds(Lst_Levels, Lst_ObjectBoxes, false, false, (Tile) => {
        //check map sprites if we have to
        var Lst_BoxesToCheck = null;
        if(!Bool_FoundHit){
            Tile.LstBoxes_BlocksShots.forEach((element_Box) => {
                if(CheckedBoxes == null || !CheckedBoxes.includes(element_Box)){
                    if(CheckedBoxes == null){
                        CheckedBoxes = [];
                    }
                    CheckedBoxes.push(element_Box);
                    if(Lst_BoxesToCheck == null){
                        Lst_BoxesToCheck = [];
                    }
                    Lst_BoxesToCheck.push(element_Box);
                }
            });
        }
        //we don't need to check to see if we hit something if we already determined that we hit something 
        var Bool_NeedToCheck = false;
        if((Tile.TileDef != null && Tile.TileDef.Bool_BlocksShots && !Bool_FoundHit)
                || Lst_BoxesToCheck != null){
            Bool_NeedToCheck = true;
        }
        //actually check tile hitbox
        if(Bool_NeedToCheck){
            Bool_NeedToCheck = false;
            for(var loop = 0; loop < Lst_ObjectBoxes.length; loop++){
                if(Bool_GetCollisionData(Tile.HitBox, Lst_ObjectBoxes[loop])){
                    Bool_NeedToCheck = true;
                    Bool_FoundHit |= (Tile.TileDef != null && Tile.TileDef.Bool_BlocksShots);
                    break;
                }
            }
        }
        if(Bool_NeedToCheck){
            //check boxes
            if(Lst_BoxesToCheck != null){
                for(var loopTileBoxes = 0; !Bool_FoundHit && loopTileBoxes < Lst_BoxesToCheck.length; loopTileBoxes++){
                    for(var loopObjBoxes = 0; loopObjBoxes < Lst_ObjectBoxes.length; loopObjBoxes++){
                        if(Bool_GetCollisionData(Lst_BoxesToCheck[loopTileBoxes], Lst_ObjectBoxes[loopObjBoxes])){
                            Bool_FoundHit = true;
                            break;
                        }
                    }
                }
            }
        }
        //break if found hit and not looking for damage targets
        return Bool_FoundHit;
    });
    //if we already found a collision don't bother checking game objects
    if(Bool_FoundHit){
        return true;
    }

    var CheckedGameObjects = null;
    forEach_RoomInBounds(Lst_Levels, Lst_ObjectBoxes, false, (Room) => {
        var Lst_ObjToCheck_Hit = null;
        Room.Set_GameObjectsInRoom.forEach((element_GameObj) => {
            if(CheckedGameObjects == null || !CheckedGameObjects.includes(CheckedGameObjects)){
                //if we already confimred a hit don't bother checking other boxes that could also cause a hit just check the things we can damage
                if(!Bool_FoundHit && GameObj_Self.Bool_DoesBulletHitThis(element_GameObj)){
                    if(Lst_ObjToCheck_Hit == null){
                        Lst_ObjToCheck_Hit = [];
                    }
                    Lst_ObjToCheck_Hit.push(element_GameObj);
                }
            }
        });
        if(Lst_ObjToCheck_Hit != null && Bool_AreAnyColliding([Room.HitBox], Lst_ObjectBoxes)){
            //check Objs we can hit of we half too
            for(var loopObjs = 0; !Bool_FoundHit && loopObjs < Lst_ObjToCheck_Hit.length; loopObjs++){
                var CurrentObj = Lst_ObjToCheck_Hit[loopObjs];
                var ObjBoxes_other = CurrentObj.LstBoxes_GetHitBoxesInLocalSpace(CurrentObj.Str_BlocksShots)
                
                //mark that we checked box
                if(CheckedGameObjects == null){
                    CheckedGameObjects = [];
                }
                CheckedGameObjects.push(CurrentObj);

                //actually ckeck box
                for(var loopOtherBoxes = 0; !Bool_FoundHit && loopOtherBoxes < ObjBoxes_other.length; loopOtherBoxes++){
                    for(var loopSelfBoxes = 0; !Bool_FoundHit && loopSelfBoxes < Lst_ObjectBoxes.length; loopSelfBoxes++){
                        Bool_FoundHit |= Bool_GetCollisionData(ObjBoxes_other[loopOtherBoxes], Lst_ObjectBoxes[loopSelfBoxes]);
                    }
                }
            }
        }
        return Bool_FoundHit;
    });

    return Bool_FoundHit;
}
/**
 * @param {array} Lst_Levels 
 * @param {Vector2D} Vector_PointOfSight 
 * @param {array} Lst_Boxes 
 * @param {array} Lst_GameObjectsToIgnore 
 */
function Bool_HasLineOfSite(Lst_Levels, Vector_PointOfSight, Lst_Boxes, Lst_GameObjectsToIgnore = null){
    if(!Array.isArray(Lst_Boxes)
            || Lst_Boxes.length <= 0
            || Vector_PointOfSight == null){

        return false;
    }
    if(Lst_GameObjectsToIgnore == null){
        Lst_GameObjectsToIgnore = [];
    }
    //if point is with hitboxs we have line of sight
    for(var loopBox = 0; loopBox < Lst_Boxes.length; loopBox++){
        if(Lst_Boxes[loopBox].Bool_IsPointInside(Vector_PointOfSight)){
            return true;
        }
    }
    //if anything is between start and end we do not have line of sight
    //for simplicities saker were only hoing to check each center
    for(var loopBox = 0; loopBox < Lst_Boxes.length; loopBox++){
        var CheckedHitBoxes = null;     //Because MapSprites and Game Objects can be in more then one tile at once but we dont' want to check them more than once

        var EndPoint = Lst_Boxes[loopBox].Vector_Center;
        var Bool_FoundCollision = false;
        forEach_TileOnLine(Lst_Levels, Vector_PointOfSight, EndPoint, false, (Tile) => {
            //get sprite boxes
            var LstSprites = null;
            for(var loopObjBox = 0; loopObjBox < Tile.LstBoxes_BlocksVision.length; loopObjBox++){
                var CurrentBox = Tile.LstBoxes_BlocksVision[loopObjBox];
                if(CheckedHitBoxes == null || !CheckedHitBoxes.includes(CurrentBox)){
                    if(LstSprites == null){
                        LstSprites = [];
                    }
                    LstSprites.push(CurrentBox);
                }
            }
            //need to check tile
            if((Tile.TileDef != null && Tile.TileDef.Bool_BlocksVision)
                    || Lst_Boxes == null){
                
                 //check tile
                if(Tile.HitBox.Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                     //hit tile
                    if(Tile.TileDef != null && Tile.TileDef.Bool_BlocksVision){
                        Bool_FoundCollision = true;
                        return true;
                    }
                    //hit map sprites
                    if(LstSprites != null){
                        for(var loopObjBox = 0; loopObjBox < LstSprites.length; loopObjBox++){
                            var CurrentBox = LstSprites[loopObjBox];
                            if(CurrentBox.Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                                Bool_FoundCollision = true;
                                return true;
                            }
                            else{
                                if(CheckedHitBoxes == null){
                                    CheckedHitBoxes = [];
                                }
                                CheckedHitBoxes.push(CurrentBox);
                            }
                        }
                    }                
                }
            }
            return false;
        });
        if(Bool_FoundCollision){
            return false;
        }
        var CheckedGameObjects = null;
        forEach_RoomOnLine(Lst_Levels, Vector_PointOfSight, EndPoint, false, (Room) => {
            //get Game Objects
            if(Room.HitBox != null){
                var Lst_GameObjs = null;
                Room.Set_GameObjectsInRoom.forEach((CurrentGameObject) => {
                    if(CurrentGameObject.Str_BlocksVision != null
                            && !Lst_GameObjectsToIgnore.includes(CurrentGameObject)
                            && (CheckedGameObjects == null || !CheckedGameObjects.includes(CheckedGameObjects))){
                        
                        if(Lst_GameObjs == null){
                            Lst_GameObjs = [];
                        }
                        Lst_GameObjs.push(CurrentBox);
                    }
                });
                if(Lst_GameObjs != null && Room.HitBox.Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                    for(var loopGameObj = 0; loopGameObj < Lst_GameObjs.length; loopGameObj++){
                        var CurrentGameObject = Lst_GameObjs[loopGameObj];

                        //check hitbox
                        var HitBoxes = CurrentGameObject.Str_BlocksVision != null ? CurrentGameObject.LstBoxes_GetHitBoxesInLocalSpace(CurrentGameObject.Str_BlocksVision) : null;
                        for(var loopObjBox = 0; loopObjBox < HitBoxes.length; loopObjBox++){
                            if(HitBoxes[loopObjBox].Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                                Bool_FoundCollision = true;
                                return true;
                            }
                        }
                        //record Game Object
                        if(CheckedGameObjects == null){
                            CheckedGameObjects = [];
                        }
                        CheckedGameObjects.push(CurrentGameObject);
                    }
                }
            }
            return false;
        });
        if(Bool_FoundCollision){
            return false;
        }
    }
    return true;
}

/**
 * @param {array} Lst_Levels 
 * @param {Vector2D} Vector_PointOfSight 
 * @param {array} Lst_Boxes 
 * @param {array} Lst_GameObjectsToIgnore 
 */
function Bool_HasShot(Lst_Levels, Vector_PointOfSight, Lst_Boxes, Lst_GameObjectsToIgnore = null){
    if(!Array.isArray(Lst_Boxes)
            || Lst_Boxes.length <= 0
            || Vector_PointOfSight == null){

        return false;
    }
    if(Lst_GameObjectsToIgnore == null){
        Lst_GameObjectsToIgnore = [];
    }
    //if point is with hitboxs we have line of sight
    for(var loopBox = 0; loopBox < Lst_Boxes.length; loopBox++){
        if(Lst_Boxes[loopBox].Bool_IsPointInside(Vector_PointOfSight)){
            return true;
        }
    }
    //if anything is between start and end we do not have line of sight
    //for simplicities saker were only hoing to check each center
    for(var loopBox = 0; loopBox < Lst_Boxes.length; loopBox++){
        var CheckedHitBoxes = null;     //Because MapSprites and Game Objects can be in more then one tile at once but we dont' want to check them more than once

        var EndPoint = Lst_Boxes[loopBox].Vector_Center;
        var Bool_FoundCollision = false;
        forEach_TileOnLine(Lst_Levels, Vector_PointOfSight, EndPoint, false, (Tile) => {
            //get boxes
            var Lst_Boxs = null;
            for(var loopObjBox = 0; loopObjBox < Tile.LstBoxes_BlocksShots.length; loopObjBox++){
                var CurrentBox = Tile.LstBoxes_BlocksShots[loopObjBox];
                if(CheckedHitBoxes == null || !CheckedHitBoxes.includes(CurrentBox)){
                    if(Lst_Boxs == null){
                        Lst_Boxs = [];
                    }
                    Lst_Boxs.push(CurrentBox);
                }
            }
            
            //do we need to check tile
            if((Tile.TileDef != null && Tile.TileDef.Bool_BlocksShots)
                    || Lst_Boxs != null){

                //check tile
                if(Tile.HitBox.Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                    //tile is blocking
                    if(Tile.TileDef != null && Tile.TileDef.Bool_BlocksShots){
                        Bool_FoundCollision = true;
                        return true;
                    }
                    //map sprite is blocking
                    if(Lst_Boxs != null){
                        for(var loopObjBox = 0; loopObjBox < Lst_Boxs.length; loopObjBox++){
                            var CurrentBox = Lst_Boxs[loopObjBox];  
                            if(CurrentBox.Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                                Bool_FoundCollision = true;
                                return true;
                            }
                            else{
                                if(CheckedHitBoxes == null){
                                    CheckedHitBoxes = [];
                                }
                                CheckedHitBoxes.push(CurrentBox);
                            }
                        }
                    }
                }
            }
            return false;
        });
        if(Bool_FoundCollision){
            return false;
        }
        var CheckedGameObjects = null;
        forEach_RoomOnLine(Lst_Levels, Vector_PointOfSight, EndPoint, false, (Room) => {
            //get objs
            var Lst_GameObjs = null;
            Room.Set_GameObjectsInRoom.forEach((CurrentGameObject) => {
                if(CurrentGameObject.Str_BlocksShots != null
                        && !Lst_GameObjectsToIgnore.includes(CurrentGameObject)
                        && (CheckedGameObjects == null || !CheckedGameObjects.includes(CheckedGameObjects))){
                    
                    if(Lst_GameObjs == null){
                        Lst_GameObjs = [];
                    }
                    Lst_GameObjs.push(CurrentGameObject);
                }
            });
            if(Lst_GameObjs != null && Room.HitBox.Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                for(var loopGameObj = 0; loopGameObj < Lst_GameObjs.length; loopGameObj++){
                    var CurrentGameObject = Lst_GameObjs[loopGameObj];
                    var HitBoxes = CurrentGameObject.Str_BlocksShots != null ? CurrentGameObject.LstBoxes_GetHitBoxesInLocalSpace(CurrentGameObject.Str_BlocksShots) : null;
                    for(var loopObjBox = 0; loopObjBox < HitBoxes.length; loopObjBox++){
                        if(HitBoxes[loopObjBox].Bool_IsLineInBox(Vector_PointOfSight, EndPoint)){
                            Bool_FoundCollision = true;
                            return true;
                        }
                    }
                    //record Game Object
                    if(CheckedGameObjects == null){
                        CheckedGameObjects = [];
                    }
                    CheckedGameObjects.push(CurrentGameObject);
                }
            }
        });
    }
    if(Bool_FoundCollision){
        return false;
    }
    return true;
}

/**
 * @param {array} Lst_Levels 
 * @param {Vector2D} Vector_PointOfSight 
 * @param {array} Lst_Boxes 
 * @param {array} Lst_GameObjectsToIgnore 
 */
function Vector_BulletInpactPoint(Lst_Levels, Vector_PointOfSight, Vector_MaxEndPoint, Lst_GameObjectsToIgnore = null){
    if(Vector_MaxEndPoint == null
            || Vector_PointOfSight == null){

        return false;
    }
    if(Vector_PointOfSight == Vector_MaxEndPoint){
        return Vector_MaxEndPoint;
    }
    if(Lst_GameObjectsToIgnore == null){
        Lst_GameObjectsToIgnore = [];
    }
    var RetVal = null;
    var oldDistance = null;
    var Vector_temp = new Vector2D();

    //if anything is between start and end we do not have line of sight
    //for simplicities saker were only hoing to check each center
    var CheckedHitBoxes = null;     //Because MapSprites and Game Objects can be in more then one tile at once but we dont' want to check them more than once
    forEach_TileOnLine(Lst_Levels, Vector_PointOfSight, Vector_MaxEndPoint, false, (Tile) => {
        //get map sprites t0 check
        var Lst_MapSprites = null;
        for(var loopObjBox = 0; loopObjBox < Tile.LstBoxes_BlocksShots.length; loopObjBox++){
            var CurrentBox = Tile.LstBoxes_BlocksShots[loopObjBox];
            if(CheckedHitBoxes == null || !CheckedHitBoxes.includes(CurrentBox)){
                if(Lst_MapSprites == null){
                    Lst_MapSprites = [];
                }
                Lst_MapSprites.push(CurrentBox);
            }
        }
        
        //need to check tile
        if((Tile.TileDef != null && Tile.TileDef.Bool_BlocksShots)
                || Lst_MapSprites != null){

            //check tile
            var TileIntersect = Tile.HitBox.Vector_GetClosestIntersection(Vector_PointOfSight, Vector_MaxEndPoint);
            if(TileIntersect != null){
                //record intersect
                if(Tile.TileDef != null && Tile.TileDef.Bool_BlocksShots){
                    Vector_temp.Assign(TileIntersect);
                    Vector_temp.SubtractFromSelf(Vector_PointOfSight);
                    if(RetVal == null || (oldDistance > Vector_temp.Num_GetManhattan())){
                        RetVal = TileIntersect;
                        oldDistance = Vector_temp.Num_GetManhattan();
                    }
                }
                //check map sprites
                if(Lst_MapSprites != null){
                    for(var loopObjBox = 0; loopObjBox < Lst_MapSprites.length; loopObjBox++){
                        var CurrentBox = Lst_MapSprites[loopObjBox];
                        //check intersect
                        var InterSect = CurrentBox.Vector_GetClosestIntersection(Vector_PointOfSight, Vector_MaxEndPoint);
                        if(InterSect != null){
                            Vector_temp.Assign(InterSect);
                            Vector_temp.SubtractFromSelf(Vector_PointOfSight);
                            if(RetVal == null || (oldDistance > Vector_temp.Num_GetManhattan())){
                                RetVal = InterSect;
                                oldDistance = Vector_temp.Num_GetManhattan();
                            }
                        }
                        //record hitbox
                        if(CheckedHitBoxes == null){
                            CheckedHitBoxes = [];
                        }
                        CheckedHitBoxes.push(CurrentBox);
                    }
                } 
            }
        }
    });
    var CheckedGameObjects = null;
    forEach_RoomOnLine(Lst_Levels, Vector_PointOfSight, Vector_MaxEndPoint, false, (Room) => {
        //get game objects to check
        var Lst_GameObjects = null;
        Room.Set_GameObjectsInRoom.forEach((CurrentGameObject) => {
            if(CurrentGameObject.Str_BlocksShots != null
                    && !Lst_GameObjectsToIgnore.includes(CurrentGameObject)
                    && (CheckedGameObjects == null || !CheckedGameObjects.includes(CheckedGameObjects))){
            
                if(Lst_GameObjects == null){
                    Lst_GameObjects = [];
                }
                Lst_GameObjects.push(CurrentGameObject);
            }
        });
        if(Lst_GameObjects != null && Room.HitBox.Bool_IsLineInBox(Vector_PointOfSight, Vector_MaxEndPoint)){
            for(var loopGameObj = 0; loopGameObj < Lst_GameObjects.length; loopGameObj++){
                var CurrentGameObject = Lst_GameObjects[loopGameObj];
                //record Game Object
                if(CheckedGameObjects == null){
                    CheckedGameObjects = [];
                }
                CheckedGameObjects.push(CurrentGameObject);

                //check intersects
                var HitBoxes = CurrentGameObject.Str_BlocksShots != null ? CurrentGameObject.LstBoxes_GetHitBoxesInLocalSpace(CurrentGameObject.Str_BlocksShots) : null;
                for(var loopObjBox = 0; loopObjBox < HitBoxes.length; loopObjBox++){
                    var InterSect = HitBoxes[loopObjBox].Vector_GetClosestIntersection(Vector_PointOfSight, Vector_MaxEndPoint);
                    if(InterSect != null){
                        Vector_temp.Assign(InterSect);
                        Vector_temp.SubtractFromSelf(Vector_PointOfSight);
                        if(RetVal == null || (oldDistance > Vector_temp.Num_GetManhattan())){
                            RetVal = InterSect;
                            oldDistance = Vector_temp.Num_GetManhattan();
                        }
                    }
                }
            }
        }
    });

    if(RetVal == null){
        RetVal = Vector_MaxEndPoint;
    }
    return RetVal;
}

/**
 * @param {array} Lst_Levels 
 * @param {array} Lst_ObjectBoxes 
 * @param {GameObject} Obj_Self 
 */
function Vector_GetMapCollisionSolution(Lst_Levels, Lst_ObjectBoxes, Obj_Self){
    Lst_ObstructionBoxes = [];
    forEach_TileInBounds(Lst_Levels, Lst_ObjectBoxes, true, false, (Tile) => {
        if(Tile.TileDef != null){
            if(Tile.TileDef.Bool_BlocksMovement){
                Lst_ObstructionBoxes.push(Tile.HitBox);
            }
            Tile.LstBoxes_BlocksMovement.forEach((box) => {
                if(!Lst_ObstructionBoxes.includes(box)){
                    Lst_ObstructionBoxes.push(box);
                }
            });
        }
    });
    Lst_GameObjBoxes = [];
    forEach_RoomInBounds(Lst_Levels, Lst_ObjectBoxes, true, (Room) => {
        Room.Set_GameObjectsInRoom.forEach((element) => {
            if(element != Obj_Self && !Lst_GameObjBoxes.includes(element)){
                Lst_GameObjBoxes.push(element);
                var Lst_Box = element.LstBoxes_GetHitBoxesInLocalSpace(element.Str_BlocksMovement, null);
                if(Bool_GetIsAnyWithinBounds(Lst_ObjectBoxes, Lst_Box)){
                    Lst_ObstructionBoxes.push.apply(Lst_ObstructionBoxes, Lst_Box);
                }
            }
        });
    });
    if(Lst_ObstructionBoxes.length <= 0){
        return null;
    }
    return Vector_GetCollisionSolution(Lst_ObstructionBoxes, Lst_ObjectBoxes);
    //we want to 
}