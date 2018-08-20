class AssetLibrary {
    constructor(){
        this.Clear();
    }
    Clear(){
        this.SpriteSheets = {};
        this.Sprites = {};
        this.Animations = {};
        this.Images = {};
    }
    /**
     * will attempt to load everything from the paths given returns success on complete
     * @param {string[]} LstStr_Assets 
     * @param {function} Func_OnComplete 
     */
    LoadAssets(LstStr_Assets, Func_OnComplete){
        if(Func_OnComplete == null){
            return;
        }
        if(LstStr_Assets == null || LstStr_Assets.length <= 0){
            Func_OnComplete()
        }

        var lstStr_ImageLoads = [];
        var LstStr_SheetLoads = [];
        var LstStr_AnimLoads = [];
        var LstStr_SpriteLoads = [];
        var lstStr_LoadsCompleted = [];

        LstStr_Assets.forEach(path => {
            path = path.toLowerCase();
            //image
            if((path.includes('png') || path.includes('jpg'))
                    && !lstStr_ImageLoads.includes(path)){

                lstStr_ImageLoads.push(path);
            }
            //spriteSheet
            if(path.includes('_sheet') && !LstStr_SheetLoads.includes(path)){
                LstStr_SheetLoads.push(path);
            }
            //Animation
            if(path.includes('_anim') && !LstStr_AnimLoads.includes(path)){
                LstStr_AnimLoads.push(path);
            }
            //Sprite
            if(path.includes('_sprite') && !LstStr_SpriteLoads.includes(path)){
                LstStr_SpriteLoads.push(path);
            }
        });
        var totalLoads = lstStr_ImageLoads.length
                        + LstStr_SheetLoads.length
                        + LstStr_AnimLoads.length
                        + LstStr_SpriteLoads.length;
        
        if(totalLoads <= 0){
            Func_OnComplete();
            return;
        }

        lstStr_ImageLoads.forEach(path => {
            this.LoadImage(path, Local_Isloaded);
        });
        LstStr_SheetLoads.forEach(path => {
            this.LoadSpriteSheet(path, Local_Isloaded);
        });
        LstStr_AnimLoads.forEach(path => {
            this.LoadAnimation(path, Local_Isloaded);
        });
        LstStr_SpriteLoads.forEach(path => {
            this.LoadSprite(path, Local_Isloaded);
        });
        
        function Local_Isloaded(str_Path, bool_Success){
            lstStr_LoadsCompleted.push(str_Path);
            if(!bool_Success){
                console.log('AssetLibrary.LoadAssets() failed to load ' + str_Path);
            }
            if(totalLoads == lstStr_LoadsCompleted.length){
                Func_OnComplete();
            }
        }
    }
    //-------------------------------------------------------------------------
    //Sprites
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadSprite(defPath, IsLoaded){
        this.LoadAsset(defPath
            , () => { return new SpriteAsset();}
            , (str_Path) => { return this.GetSpriteDef(str_Path); }
            , (str_Path, Asset) => { this.AddSpriteDef(str_Path, Asset); }
            , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {SpriteSheetAsset} newDef 
     */
    AddSpriteDef(defPath, newDef){
        this.AddAsset(this.Sprites, defPath, newDef); 
    }
    /**
     * 
     * @param {string} defPath 
     */
    GetSpriteDef(defPath){
        return this.GetAsset(this.Sprites, defPath);
    }

    SpriteInstance_GetSpriteInstance(defPath){
        var Def = this.GetSpriteDef(defPath);
        if(Def == null){
            return null;
        }
        return Def.SpriteInstance_GetNewInstance();
    }

    //-------------------------------------------------------------------------
    //SpriteSheets
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadSpriteSheet(defPath, IsLoaded){
        this.LoadAsset(defPath
                    , () => { return new SpriteSheetAsset();}
                    , (str_Path) => { return this.GetSpriteSheetDef(str_Path); }
                    , (str_Path, Asset) => { this.AddSpriteSheetDef(str_Path, Asset); }
                    , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {SpriteSheetAsset} newDef 
     */
    AddSpriteSheetDef(defPath, newDef){
        this.AddAsset(this.SpriteSheets, defPath, newDef); 
    }
    /**
     * @param {string} defPath 
     */
    GetSpriteSheetDef(defPath){
        return this.GetAsset(this.SpriteSheets, defPath);
    }
    //-------------------------------------------------------------------------
    //Animations
    /**
     * @param {String} defPath
     * @param {function} IsLoaded - IsLoaded(defPath, bSuccess)
     */
    LoadAnimation(defPath, IsLoaded){
        this.LoadAsset(defPath
                , () => { return new AnimationAsset();}
                , (str_Path) => { return this.GetAnimationDef(str_Path); }
                , (str_Path, Asset) => { this.AddAnimationDef(str_Path, Asset); }
                , IsLoaded);
    }
    /**
     * @param {String} defPath
     * @param {AnimationAsset} newDef 
     */
    AddAnimationDef(defPath, newDef){
        this.AddAsset(this.Animations, defPath, newDef); 
    }
    /**
     * 
     * @param {string} defPath 
     */
    GetAnimationDef(defPath){
        return this.GetAsset(this.Animations, defPath);
    }
    //-------------------------------------------------------------------------
    //images
    /**
     * @param {String} defPath 
     * @param {function} IsLoaded - IsLoaded(str_Path, bool_Success)
     */
    LoadImage(defPath, IsLoaded){
        if(defPath == null){
            return;
        }
        var newImage = this.GetImage(defPath);
        if(newImage != null){
            IsLoaded(defPath, true);
            return;
        }
        defPath = defPath.toLowerCase();
       
        newImage = new Image();
        newImage.src = defPath;
        newImage.onload = Local_IsloadedSuccess;
        newImage.onerror = Local_IsloadedFail;

        var self = this;

        function Local_IsloadedFail(){
            IsLoaded(defPath, false);
        }
        function Local_IsloadedSuccess(){
            if(!this.complete && this.naturalWidth !== 0){
                Local_IsloadedFail();
                return;
            }
            self.AddImage(defPath, this);
            if(IsLoaded != null){
                IsLoaded(defPath, true);
            }
        }
    }
    /**
     * 
     * @param {string} defPath 
     * @param {Image} newDef 
     */
    AddImage(defPath, newDef){
       this.AddAsset(this.Images, defPath, newDef);   
    }
    /**
     * @param {String} defPath 
     */
    GetImage(defPath){
        return this.GetAsset(this.Images, defPath);
    }
    //-------------------------------------------------------------------------
    //For internal use
    /**
     * This will not overite anything already loaded
     * @param {Object} dct_Library 
     * @param {string} str_Path 
     * @param {BaseAsset} Asset 
     */
    AddAsset(dct_Library, str_Path, Asset){
        if(str_Path == null
                || str_Path.length <= 0
                || Asset == null
                || dct_Library == null){
            return;
        }
        str_Path = str_Path.toLowerCase();
        if(str_Path in dct_Library){
            return;
        }
        dct_Library[str_Path] = Asset;

        console.log('AssetLibrary.AddAsset(): Asset [' + str_Path + '] added');
    }
    /**
     * @param {Object} dct_Library 
     * @param {string} str_Path 
     * @param {BaseAsset} Asset 
     */
    GetAsset(dct_Library, str_Path, Asset){
        if(str_Path == null
                || str_Path.length <= 0
                || dct_Library == null){
            return null;
        }
        str_Path = str_Path.toLowerCase();

        if(str_Path in dct_Library){
            return dct_Library[str_Path];
        }
        return null;
    }
    /**
     * @param {String} defPath
     * @param {function} func_NewAsset - () { return Asset }
     * @param {function} func_GetAsset - (str_Path) {retun Asset or null}
     * @param {function} func_AddAsset - (str_Path, Asset) {}
     * @param {function} func_IsLoaded - (defPath, bSuccess) {}
     */
    LoadAsset(defPath, func_NewAsset, func_GetAsset, func_AddAsset, func_IsLoaded){
        if(defPath == null){
            func_IsLoaded(defPath, false);  
            return;
        }
        if(func_GetAsset(defPath) != null){
            func_IsLoaded(defPath, true);  
            return;
        }
        var NewAsset = func_NewAsset();
        if(NewAsset == null){
            return;
        }
        var self = this;
        NewAsset.Load(defPath, Local_Isloaded); 

        function Local_Isloaded(str_Path, Asset){
            if(Asset != null){
                self.LoadAssets(Asset.LstStr_GetDependencies(), function() {
                    Asset.SetDependencies(self);
                    func_AddAsset(str_Path, Asset);
                    func_IsLoaded(defPath, true);
                });
            }
            else{
                func_IsLoaded(defPath, false);
            }
        }
    }
}