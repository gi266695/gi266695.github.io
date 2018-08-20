class SpriteAsset extends BaseAsset {
    constructor(){
        super();
        this.Clear();

        //overide functions in base
        //this.Bool_UpdateFromJsonObject = SpriteAsset.prototype.Bool_UpdateFromJsonObject;
        //this.LstStr_GetDependencies = SpriteAsset.prototype.LstStr_GetDependencies;
        //this.SetDependencies = SpriteAsset.prototype.SetDependencies;
    }

    Clear(){
        this.Name = "";
        this.Alpha = 1.0;
        this.Transform = new Matrix3X3();

        this.dctAnimations = {};
        this.dctHitBoxTypes = {};

        this.Lst_LocalSprites = [];
        this.Lst_ReferencedSprites = [];
        this.Lst_Sprites = [];
    }

    SpriteInstance_GetNewInstance(){
        var retVal = new SpriteInstance();
        retVal.SpriteAsset = this;
        retVal.LocalTransform.Assign(this.Transform);
        retVal.LocalAlpha = this.Alpha;

        this.Lst_Sprites.forEach(element => {
            var newInstance = element.SpriteInstance_GetNewInstance();
            newInstance.SetAnimation('idle');
            newInstance.SetAnimationPercent(Math.random());
            retVal.lst_Sprites.push(newInstance);
        });
        
        retVal.SetAnimation('idle');
        retVal.SetAnimationPercent(Math.random());
        return retVal;
    }

    /**
     * @param {String} AnimName 
     */
    Animation_GetAnimationByName(AnimName){
        if(AnimName == null){
            return;
        }
        AnimName = AnimName.toLowerCase();
        if(this.dctAnimations != null && (AnimName in this.dctAnimations)){
            return this.dctAnimations[AnimName];
        }
        return null;
    }

    /**
     * @param {string} rootPath
     * @param {Object} JSONObject 
     */
    bool_LoadFromFileData(rootPath, JSONObject){
        if(typeof JSONObject !== "object"
                || JSONObject == null){
                    
            return false;   
        }
        /*
         {
            "Name": "",
            "CenterX": 0,
            "CenterY": 0,
            "ScaleX": 1,
            "ScaleY": 1,
            "Rotate": 0,
            "Alpha": 0,
            "Animations": [{AnimationAsset}, {{AnimationAsset}}]
            "Sprites": [{SpriteAsset}, "...", {SpriteAsset}] //sprite objects or paths to sprite objects, paths are absolute
            "HitBoxes":[
                {
                "Name": "blabla1",
                "Boxes": [{PolygonalHitBox}, {PolygonalHitBox}]
                },
                { ... }
            ]
        }
         */
        if(typeof JSONObject.Name === 'string'){
            this.Name = JSONObject.Name.toLowerCase();
        }
        this.Transform.SetToIdentity();
        var x = 0;
        var y = 0;
        if(typeof JSONObject.CenterX === 'number'){
            x = JSONObject.CenterX;
        }
        if(typeof JSONObject.CenterX === 'number'){
            y = JSONObject.CenterY;
        }
        this.Transform.TranslateSelf(x,y);

        var x = 1;
        var y = 1;
        if(typeof JSONObject.ScaleX === 'number'){
            x = JSONObject.ScaleX;
        }
        if(typeof JSONObject.ScaleY === 'number'){
            y = JSONObject.ScaleY;
        }
        this.Transform.ScaleSelf(x, y);

        if(typeof JSONObject.Rotate === 'number'){
            this.Transform.RotateSelf(JSONObject.Rotate);
        }

        if(typeof JSONObject.Alpha === 'number'){
            this.Alpha = JSONObject.Alpha;
        }

        if(Array.isArray(JSONObject.Animations)){
            JSONObject.Animations.forEach(JSONDef => {
                var newAnim = new AnimationAsset();
                if(newAnim.bool_LoadFromFileData(rootPath, JSONDef)){
                    this.dctAnimations[newAnim.str_name] = newAnim;
                }
            });
        }
        if(Array.isArray(JSONObject.HitBoxes)){
            JSONObject.HitBoxes.forEach(elementBoxList => {
               if(typeof elementBoxList === 'object'
                        && elementBoxList != null
                        && typeof elementBoxList.Name === 'string'
                        && elementBoxList.Name.length > 0
                        && Array.isArray(elementBoxList.Boxes)){
                 
                    var lst_Boxes = [];
                    elementBoxList.Boxes.forEach(elementBox => {
                        var newBox = new PolygonalHitBox();
                        if(newBox.bool_LoadFromFileData(rootPath, elementBox)){
                            lst_Boxes.push(newBox);
                        }
                    });
                    if(lst_Boxes.length > 0){
                        this.dctHitBoxTypes[elementBoxList.Name.toLowerCase()] = lst_Boxes;
                    }
               }
           });
        }
        if (Array.isArray(JSONObject.Sprites)){
            JSONObject.Sprites.forEach(element => {
                if(typeof element === 'object'){
                    var newSprite = new SpriteAsset();
                    if(newSprite.bool_LoadFromFileData(rootPath, element)){
                        this.Lst_LocalSprites.push(newSprite);
                    }
                }
                else if(typeof element === 'string'){
                    this.Lst_ReferencedSprites.push(element);
                }
            });
        }

        return true;
    }
    
    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var retVal = [];
        for(var animName in this.dctAnimations ){
            this.dctAnimations[animName].LstStr_GetDependencies().forEach(elementStr => {
                retVal.push(elementStr);
            });
        }
        this.Lst_LocalSprites.forEach(element => {
            element.LstStr_GetDependencies().forEach(elementStr => {
                retVal.push(elementStr);
            });
        });
        this.Lst_ReferencedSprites.forEach(element => {
            retVal.push(element);
        });
        return retVal;
    }

    /**
     * After all dependencies have been loaded this is called so that this can grab references to anything it needs
     * @param {AssetLibrary} assetLibrary 
     */
    SetDependencies(assetLibrary){
        if(assetLibrary == null){
            return;
        }
        for(var animName in this.dctAnimations ){
            this.dctAnimations[animName].SetDependencies(assetLibrary);
        };
        this.Lst_Sprites = [];
        this.Lst_ReferencedSprites.forEach(element => {
            var temp = assetLibrary.GetSpriteDef(element);
            if(temp != null){
                this.Lst_Sprites.push(temp);
            }
        });
        this.Lst_LocalSprites.forEach(element => {
            element.SetDependencies(assetLibrary);
            this.Lst_Sprites.push(element);
        });
    }
}

class SpriteInstance extends BaseInstance {
    constructor(){
        super();
        this.Clear();
    }
    Clear(){
        this.SpriteAsset = null;
        this.CurrentAnim = null;

        this.AnimationTime = 0.0;
        this.AnimationSpeed = 1.0;

        this.LocalTransform = new Matrix3X3();
        this.LocalAlpha = 1.0;

        this.lst_Sprites = [];
    }

    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){
        if(this.CurrentAnim == null){
            return;
        }
        
        this.AnimationTime += (DeltaTime * this.AnimationSpeed);

        this.lst_Sprites.forEach(element => {
            element.Tick(coreData, DeltaTime);
        });
        /*var TotatTime = this.Num_GetTotalAnimationMiliseconds();
        if(this.AnimationTime < 0){
            this.AnimationTime = TotatTime - this.AnimationTime;
        }
        if(this.AnimationTime > TotatTime && TotatTime > 0){
            this.AnimationTime = this.AnimationTime % TotatTime;
        }*/
    }

    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform = null, ParentAlpha = 1){
        var CompleteTransform = new Matrix3X3();
        if(ParentTranform != null){
            CompleteTransform.MultiplyMatrix(ParentTranform);
        }
        CompleteTransform.MultiplyMatrix(this.LocalTransform);

        if(this.CurrentAnim != null){
            var CurrentAlpha = ParentAlpha * this.LocalAlpha;
    
            this.CurrentAnim.Draw(coreData, CompleteTransform, CurrentAlpha, this.AnimationTime);
            this.lst_Sprites.forEach(element => {
                element.Draw(coreData, CompleteTransform, CurrentAlpha, this.AnimationTime);
            });    
        }
        if(coreData.DrawHitBoxes 
                && this.SpriteAsset != null
                && Object.keys(this.SpriteAsset.dctHitBoxTypes).length > 0){

            for(var key in this.SpriteAsset.dctHitBoxTypes){
                this.SpriteAsset.dctHitBoxTypes[key].forEach(elementBox => {
                    elementBox.Draw(coreData, CompleteTransform, "#00ffff");
                });
            }
        }
        if(coreData.DrawSpriteCenters){
            var context = coreData.GetContext2D();
            CompleteTransform.SetContextTransform(context);

            context.strokeStyle = "#ff00ff";
            context.lineWidth = 1;

            context.beginPath();
            context.moveTo(5, 0);
            context.lineTo(-5, 0);
            context.stroke();

            context.beginPath();
            context.moveTo(0, 5);
            context.lineTo(0, -5);
            context.stroke();

            context.restore();
        }
    }
    
    /**
     * @param {String} Name - animation name
     * @param {Number} Speed - animation speed
     */
    SetAnimation(NewName, NewSpeed = 1){
        if(this.SpriteAsset == null){
            return null;
        }
        this.AnimationSpeed = NewSpeed;
        this.AnimationTime = 0.0;
        this.CurrentAnim = this.SpriteAsset.Animation_GetAnimationByName(NewName);
        if(this.CurrentAnim == null){
            return;
        }
        if(this.AnimationSpeed < 0){
            this.AnimationTime = this.Num_GetTotalAnimationMiliseconds();
        }
    }

    /** 
     * @param {Number} Percent - number between 0 and one
    */
    SetAnimationPercent(Percent){
        if(this.SpriteAsset == null){
            return null;
        }
        var totalTime = this.Num_GetTotalAnimationMiliseconds();
        if(totalTime <= 0){
            this.AnimationTime = 0;
        }
        else{
            this.AnimationTime = totalTime * Percent;
        }
    }

    Num_GetAnimationPercent(){
        if(this.SpriteAsset == null){
            return null;
        }
        var totalTime = this.Num_GetTotalAnimationMiliseconds();
        if(totalTime <= 0){
            return 0;
        }
        else{
            return this.AnimationTime / totalTime;
        }
    }
    
    Num_GetTotalAnimationMiliseconds(){
        if(this.CurrentAnim == null || this.AnimationSpeed == 0){
            return 0;
        }
        return this.CurrentAnim.Num_GetTotalAnimationMiliseconds() / this.AnimationSpeed;
    }

    /**
     * @param {String} Str_Type
     * @param {Matrix3X3} ParentTranform  
     */
    LstBoxes_GetHitBoxesInLocalSpace(Str_Type, ParentTranform){
        var RetVal = [];
        if(Str_Type == null){
            return RetVal;
        }
        Str_Type = Str_Type.toLowerCase();
        var CompleteTransform = new Matrix3X3();
        if(ParentTranform != null){
            CompleteTransform.MultiplyMatrix(ParentTranform);
        }
        CompleteTransform.MultiplyMatrix(this.LocalTransform);

        this.lst_Sprites.forEach(element => {
            RetVal.push.apply(RetVal, element.LstBoxes_GetHitBoxesInLocalSpace(Str_Type, CompleteTransform));
        });

        if(this.SpriteAsset != null
                && this.SpriteAsset.dctHitBoxTypes != null
                && Str_Type in this.SpriteAsset.dctHitBoxTypes){
                
            this.SpriteAsset.dctHitBoxTypes[Str_Type].forEach(element => {
                var newBox = new PolygonalHitBox();
                newBox.Assign(element);
                newBox.TrasnformToSpace(CompleteTransform);
                RetVal.push(newBox);
            });        
        }

        return RetVal;
    }
    ResetTramsform(){
        if(this.SpriteAsset == null){
            return;
        }
        this.LocalTransform.Assign(this.SpriteAsset.Transform);
    }
    /**
     * @param {string} str_Name 
     * @param {Matrix3x3} ParentTransform
     */
    Matrix_GetTransform(str_Name, ParentTransform = null){
        var lst_SpritePath = this.LstSprite_GetPathToSprite(str_Name);
        if(lst_SpritePath == null){
            return null;
        }
        var RetVal = new Matrix3X3();
        if(ParentTransform != null){
            RetVal.MultiplyMatrix(ParentTransform);
        }
        lst_SpritePath.forEach((element)=> {
            RetVal.MultiplyMatrix(element.LocalTransform);
        });
        
        return RetVal;
    }
    /**
     * @param {string} str_Name 
     */
    Sprite_GetSprite(str_Name){
        var lst_SpritePath = this.LstSprite_GetPathToSprite(str_Name);
        if(lst_SpritePath == null){
            return null;
        }
        return lst_SpritePath[lst_SpritePath.length - 1]; 
    }
    /**
     * @param {string} str_Name
     */
    LstSprite_GetPathToSprite(str_Name){
        str_Name = str_Name.toLowerCase();
        if(this.SpriteAsset != null && this.SpriteAsset.Name == str_Name){
            var RetVal = [];
            RetVal.push(this);
            return RetVal;
        }
        for(var loop = 0; loop < this.lst_Sprites.length; ++loop){
            var RetVal = this.lst_Sprites[loop].LstSprite_GetPathToSprite(str_Name);
            if(RetVal != null){
                RetVal.splice(0,0,this);
                return RetVal;
            }
        }
        return null;
    }

}
