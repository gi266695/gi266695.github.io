class AssetLibrary {
    constructor(){
        this.Clear(true);
    }
    /**
     * @param {boolean} Bool_ClearAudoiContext 
     */
    Clear(Bool_ClearAudoiContext = true){
        if(Bool_ClearAudoiContext){
            this.AudioContext = null;
        }

        this.SpriteSheets = {};
        this.Sprites = {};
        this.Animations = {};
        this.Images = {};
        this.Audios = {};

        this.Dct_LoadsInProgress = {};
    }
    /**
     * 
     * @param {CoreData} coreData 
     */
    SetDependencies(coreData){
        if(coreData != null){
            this.AudioContext = coreData.AudioContext;
        }
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
        var lstStr_AudioLoads = [];
        var LstStr_SheetLoads = [];
        var LstStr_AnimLoads = [];
        var LstStr_SpriteLoads = [];
        var lstStr_LoadsCompleted = [];

        LstStr_Assets.forEach(path => {
            path = path.toLowerCase();
            //image
            if((path.includes('.png') || path.includes('.jpg'))
                    && !lstStr_ImageLoads.includes(path)){

                lstStr_ImageLoads.push(path);
            }
            //Audio (we really only support .wav becuase shannanagans) "https://en.wikipedia.org/wiki/HTML5_audio"
            if((path.includes('.wav') || path.includes('.flac')) && !lstStr_AudioLoads.includes(path)){
                lstStr_AudioLoads.push(path);
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
                        + lstStr_AudioLoads.length
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
        lstStr_AudioLoads.forEach((path) => {
            this.LoadAudioBuffer(path, Local_Isloaded);
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

    SpriteInstance_GetSpriteInstance(defPath, Instance_Parent){
        var Def = this.GetSpriteDef(defPath);
        if(Def == null){
            return null;
        }
        return Def.SpriteInstance_GetNewInstance(Instance_Parent);
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
        if(IsLoaded == null){
            return;
        }
        if(defPath == null){
            IsLoaded(defPath, false);
            return;
        }
        var newImage = this.GetImage(defPath);
        if(newImage != null){
            IsLoaded(defPath, true);
            return;
        }
        //if someone is already trying to load this then we don't have to
        if(this.Bool_IsLoadInProgress(defPath)){
            this.Bool_ReportLoadInProgress(defPath, IsLoaded);
            return;
        }
        if(!this.Bool_ReportLoadInProgress(defPath, IsLoaded)){
            return;
        }
        defPath = defPath.toLowerCase();
        var self = this;

        newImage = new Image();
        newImage.onload = Local_IsloadedSuccess;
        newImage.onerror = Local_IsloadedFail;
        newImage.src = defPath;

        function Local_IsloadedFail(){
            self.ReportLoadComplete(defPath, false);
        }
        function Local_IsloadedSuccess(){
            if(!this.complete && this.naturalWidth !== 0){
                Local_IsloadedFail();
                return;
            }
            self.AddImage(defPath, this);
            if(IsLoaded != null){
                self.ReportLoadComplete(defPath, true);
            }
        }
    }
    /**
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
    //audio
    /**
     * @param {String} defPath 
     * @param {function} IsLoaded - IsLoaded(str_Path, bool_Success)
     */
    LoadAudioBuffer(defPath, IsLoaded){
        if(IsLoaded == null){
            return;
        }
        if(defPath == null){
            IsLoaded(defPath, false);
            return;
        }
        if(this.AudioContext == null){
            console.log('"LoadAudio.Load(): failed to load [' + defPath + '] because this.AudioContext is null');
            IsLoaded(defPath, false);
            return;
        }
        var newAudio = this.GetAudioBuffer(defPath);
        if(newAudio != null){
            IsLoaded(defPath, true);
            return;
        }
        //if someone is already trying to load this then we don't have to
        if(this.Bool_IsLoadInProgress(defPath)){
            this.Bool_ReportLoadInProgress(defPath, IsLoaded);
            return;
        }
        if(!this.Bool_ReportLoadInProgress(defPath, IsLoaded)){
            return;
        }
        var self = this;
        defPath = defPath.toLowerCase();

        //https://stackoverflow.com/questions/30433667/cloning-audio-source-without-having-to-download-it-again
        //https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
        var xhttp = new XMLHttpRequest();
        try{
            xhttp.onreadystatechange = Local_IsLoaded;
            xhttp.open("GET", defPath, true);
            xhttp.responseType = 'arraybuffer';
            xhttp.send(null);
        }
        catch(exception){
            console.log("LoadAudio.Load(): Exception [" + exception + "] " + defPath);
            this.ReportLoadComplete(defPath, false);
        }
        function Local_IsLoaded(){
            if(xhttp.readyState === 4){
                if (xhttp.status === 200) {
                     try{
                        self.AudioContext.decodeAudioData(this.response
                            //Decode success
                            , (buffer) => {
                                self.AddAudioBuffer(defPath, buffer);
                                self.ReportLoadComplete(defPath, true);
                            }
                            //Decode faliure
                            , (error) => {
                                console.log("LoadAudio.Load(): Decode Failed error [" + error + "] " + defPath);
                                self.ReportLoadComplete(defPath, false);
                            } )                    
                     }
                     catch(exception){
                        console.log("LoadAudio.Load(): Exception [" + exception + "] " + defPath);
                        self.ReportLoadComplete(defPath, false);
                    }
                }
                else{
                    console.log("LoadAudio.Load(): Failed \"" + defPath + "\" [" + xhttp.readyState + ", " +  xhttp.status + ", " + xhttp.statusText + "]"); 
                    self.ReportLoadComplete(defPath, false);
                }
            }
        }
    }
    /**
     * @param {string} defPath 
     * @param {Audio} newDef 
     */
    AddAudioBuffer(defPath, newDef){
        this.AddAsset(this.Audios, defPath, newDef);   
    }
    /**
     * @param {string} defPath 
     */
    GetAudioBuffer(defPath){
        return this.GetAsset(this.Audios, defPath);
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
     */
    GetAsset(dct_Library, str_Path){
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
        //if the asset is already loaded were done
        if(func_GetAsset(defPath) != null){
            func_IsLoaded(defPath, true);  
            return;
        }
        //if someone is already trying to load this then we don't have to
        if(this.Bool_IsLoadInProgress(defPath)){
            this.Bool_ReportLoadInProgress(defPath, func_IsLoaded);
            return;
        }
        var NewAsset = func_NewAsset();
        if(NewAsset == null){
            return;
        }
        if(!this.Bool_ReportLoadInProgress(defPath, func_IsLoaded)){
            return;
        }

        var self = this;
        NewAsset.Load(defPath, Local_Isloaded); 

        function Local_Isloaded(str_Path, Asset){
            if(Asset != null){
                self.LoadAssets(Asset.LstStr_GetDependencies(), function() {
                    Asset.SetDependencies(self);
                    func_AddAsset(str_Path, Asset);

                    self.ReportLoadComplete(defPath, true);
                });
            }
            else{
                self.ReportLoadComplete(defPath, false);
            }
        }
    }
    /**
     * @param {string} Str_Path 
     */
    Bool_IsLoadInProgress(Str_Path){
        if(Str_Path == null){
            return false;
        }
        Str_Path = Str_Path.toLowerCase();
        return Str_Path in this.Dct_LoadsInProgress;
    }
    /**
     * Func_OnComplete(str_Path, bool_Oncomplete)
     * @param {function} Func_OnComplete 
     * @param {string} Str_Path 
     */
    Bool_ReportLoadInProgress(Str_Path, Func_OnComplete){
        if(Func_OnComplete == null){
            return false;
        }
        if(Str_Path == null){
            Func_OnComplete(Str_Path, false);
            return false;
        }
        Str_Path = Str_Path.toLowerCase();
        if(!(Str_Path in this.Dct_LoadsInProgress)){
            var newItem = new AssetLoadInProgress();
            this.Dct_LoadsInProgress[Str_Path] = newItem;
        }
        this.Dct_LoadsInProgress[Str_Path].AddOnComplete(Func_OnComplete);
        return true;
    }
    /**
     * @param {string} Str_Path 
     * @param {boolean} Bool_Success 
     */
    ReportLoadComplete(Str_Path, Bool_Success){
        if(Str_Path == null){
            return;
        }
        Str_Path = Str_Path.toLowerCase();
        if(!(Str_Path in this.Dct_LoadsInProgress)){
            return;
        }
        var EventQueue = this.Dct_LoadsInProgress[Str_Path];
        delete this.Dct_LoadsInProgress[Str_Path];

        EventQueue.OnComplete(Str_Path, Bool_Success);
    }
}

class AssetLoadInProgress {
    constructor(){
        this.LstFunc_OnComplete = [];
    }
    /**
     * Func_OnComplete(str_Path, bool_Oncomplete)
     * @param {function} Func_OnComplete 
     */
    AddOnComplete(Func_OnComplete){
        if(Func_OnComplete == null || this.LstFunc_OnComplete.includes(Func_OnComplete)){
            return;
        }  
        this.LstFunc_OnComplete.push(Func_OnComplete); 
    }
    /**
     * @param {string} str_Path 
     * @param {boolean} Bool_Success 
     */
    OnComplete(str_Path, Bool_Success){
        this.LstFunc_OnComplete.forEach(element => {
            element(str_Path, Bool_Success);
        });
    }
}