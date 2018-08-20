class GameAssetLibrary extends AssetLibrary {
    constructor(){
        super();
    }
    Clear(){
        super.Clear();

        this.TileFactories = {};
        this.MapSprites = {};
        this.LevelDefs = {};
        this.RoomDefs = {};
    }
    LoadAssets(LstStr_Assets, Func_OnComplete){
        if(Func_OnComplete == null){
            return;
        }
        var baseLoadFinished = false;
        var Num_totalLoads = 0;
        var LstStr_TilesLoads = [];
        var LstStr_MapSpriteLoads = [];
        var LstStr_RoomLoads = [];
        var LstStr_LevelLoads = [];
        var lstStr_LoadsCompleted = [];

        if(LstStr_Assets == null || LstStr_Assets.length <= 0){
            baseLoadFinished = true;
            Local_IsLoaded();
            return;
        }
        LstStr_Assets.forEach(path => {
            path = path.toLowerCase();

            //tiles
            if(path.includes('_tileset') && !LstStr_TilesLoads.includes(path)){
                LstStr_TilesLoads.push(path);
            }
            //mapSprites
            if(path.includes('_mapsprites') && !LstStr_TilesLoads.includes(path)){
                LstStr_MapSpriteLoads.push(path);
            }
            //rooms
            if(path.includes('_room') && !LstStr_RoomLoads.includes(path)){
                LstStr_RoomLoads.push(path);
            }
            //levels
            if(path.includes('_level') && !LstStr_LevelLoads.includes(path)){
                LstStr_LevelLoads.push(path);
            }
        });
        Num_totalLoads = LstStr_TilesLoads.length
                        + LstStr_MapSpriteLoads.length
                        + LstStr_RoomLoads.length
                        + LstStr_LevelLoads.length

        //load base
        super.LoadAssets(LstStr_Assets, () =>{
            baseLoadFinished = true;
            Local_IsLoaded();
        });

        //load tiles
        LstStr_TilesLoads.forEach(path => {
            this.LoadTileFactory(path, (Str_Path, Bool_Success) => {
                lstStr_LoadsCompleted.push(Str_Path);
                if(!Bool_Success){
                    console.log('GameAssetLibrary.LoadAssets() failed to load ' + Str_Path);
                }
                Local_IsLoaded();
            });
        });
        //load map sprites
        LstStr_MapSpriteLoads.forEach(path => {
            this.LoadMapSpiteFactoryDef(path, (Str_Path, Bool_Success) => {
                lstStr_LoadsCompleted.push(Str_Path);
                if(!Bool_Success){
                    console.log('GameAssetLibrary.LoadAssets() failed to load ' + Str_Path);
                }
                Local_IsLoaded();
            });
        });
        //load rooms
        LstStr_RoomLoads.forEach(path => {
            this.LoadRoomDef(path, (Str_Path, Bool_Success) => {
                lstStr_LoadsCompleted.push(Str_Path);
                if(!Bool_Success){
                    console.log('GameAssetLibrary.LoadAssets() failed to load ' + Str_Path);
                }
                Local_IsLoaded();
            });
        });
        //load levels
        LstStr_LevelLoads.forEach(path => {
            this.LoadLevelDef(path, (Str_Path, Bool_Success) => {
                lstStr_LoadsCompleted.push(Str_Path);
                if(!Bool_Success){
                    console.log('GameAssetLibrary.LoadAssets() failed to load ' + Str_Path);
                }
                Local_IsLoaded();
            });
        });

        function Local_IsLoaded(){
            if(baseLoadFinished && Num_totalLoads == lstStr_LoadsCompleted.length){
                Func_OnComplete();
            }
        }
    }
    
    //-------------------------------------------------------------------------
    //Tile Factory
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadTileFactory(defPath, IsLoaded){
        this.LoadAsset(defPath
            , () => { return new TileFactory();}
            , (str_Path) => { return this.GetTileFactory(str_Path); }
            , (str_Path, Asset) => { this.AddTileFactory(str_Path, Asset); }
            , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {TileFactory} newDef 
     */
    AddTileFactory(defPath, newDef){
        this.AddAsset(this.TileFactories, defPath, newDef); 
    }
    /**
     * 
     * @param {string} defPath 
     */
    GetTileFactory(defPath){
        return this.GetAsset(this.TileFactories, defPath);
    }
    //-------------------------------------------------------------------------
    //MapSpriteFactory
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadMapSpiteFactoryDef(defPath, IsLoaded){
        this.LoadAsset(defPath
            , () => { return new MapSpiteFactory();}
            , (str_Path) => { return this.GetMapSpiteFactoryDef(str_Path); }
            , (str_Path, Asset) => { this.AddMapSpiteFactoryDef(str_Path, Asset); }
            , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {MapSpiteFactory} newDef 
     */
    AddMapSpiteFactoryDef(defPath, newDef){
        this.AddAsset(this.MapSprites, defPath, newDef); 
    }
    /**
     * @param {string} defPath 
     */
    GetMapSpiteFactoryDef(defPath){
        return this.GetAsset(this.MapSprites, defPath);
    }
    //-------------------------------------------------------------------------
    //Level
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadLevelDef(defPath, IsLoaded){
        this.LoadAsset(defPath
            , () => { return new LevelDef();}
            , (str_Path) => { return this.GetLevelDef(str_Path); }
            , (str_Path, Asset) => { this.AddLevelDef(str_Path, Asset); }
            , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {LevelDef} newDef 
     */
    AddLevelDef(defPath, newDef){
        this.AddAsset(this.LevelDefs, defPath, newDef); 
    }
    /**
     * @param {string} defPath 
     */
    GetLevelDef(defPath){
        return this.GetAsset(this.LevelDefs, defPath);
    }
    GetLevelInstance(defPath){
        var def = this.GetLevelDef(defPath);
        if(def == null){
            return null;
        }
        return def.Level_CreateInstance();
    }

    //-------------------------------------------------------------------------
    //Room
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadRoomDef(defPath, IsLoaded){
        this.LoadAsset(defPath
            , () => { return new RoomDef();}
            , (str_Path) => { return this.GetRoomDef(str_Path); }
            , (str_Path, Asset) => { this.AddRoomDef(str_Path, Asset); }
            , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {RoomDef} newDef 
     */
    AddRoomDef(defPath, newDef){
        this.AddAsset(this.RoomDefs, defPath, newDef); 
    }
    /**
     * @param {string} defPath 
     */
    GetRoomDef(defPath){
        return this.GetAsset(this.RoomDefs, defPath);
    }
    /**
     * @param {string} defPath 
     * @param {Vector2D} Vector_Center 
     */
    GetRoomInstance(defPath, Vector_Center){
        var Def = this.GetRoomDef(defPath);
        if(Def == null){
            return null;
        }
        return Def.Room_CreateRoomInstance(Vector_Center);
    }

}