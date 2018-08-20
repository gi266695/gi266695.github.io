class AnimationAsset extends BaseAsset {
    constructor(){
        super();
        this.Clear();
    }
    Clear(){
        this.str_name = "";
        this.lst_Steps = [];
        this.loop = false;
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(String_Path, jsonObject){
        if(typeof jsonObject !== 'object' || jsonObject == null){
            return false;
        }
        /*
         {
             "Name": "",
             "Steps": [{AnimationStep},{AnimationStep}]
         }
        */
        if(typeof jsonObject.Name === 'string'){
            this.str_name = jsonObject.Name.toLowerCase();
        }
        //steps
        if(Array.isArray(jsonObject.Steps)){
            jsonObject.Steps.forEach(element => {
                var newStep = new AnimationStep();
                if(newStep.bool_LoadFromFileData(String_Path, element)){
                    this.lst_Steps.push(newStep);
                }
            });
        }
        //TODO... the rest of the things

        return true;
    }
    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var retVal = [];
        this.lst_Steps.forEach(elementStep => {
            elementStep.LstStr_GetDependencies().forEach(elementStr => {
                retVal.push(elementStr);
            });
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
        this.lst_Steps.forEach(element =>{
            element.SetDependencies(assetLibrary);
        });
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {Number} AnimationTime - how long has this been animating
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha
     */
    Draw(coreData, ParentTranform, ParentAlpha, AnimationTime){
        this.lst_Steps.forEach(elementStep => {
            if(AnimationTime >= elementStep.Float_StartTime
                    && (elementStep.Float_EndTime <= 0 || AnimationTime < elementStep.Float_EndTime)){
                elementStep.Draw(coreData, ParentTranform, ParentAlpha, AnimationTime);
            }
        });
    }
    Num_GetTotalAnimationMiliseconds(){
        var retVal = 0;
        
        this.lst_Steps.forEach(element =>{
            var AnimTime = element.Float_StartTime + element.Num_GetTotalAnimationMiliseconds();
            if(AnimTime > retVal){
                retVal = AnimTime;
            }
        });
        return retVal;
    }
}

//-----------------------------------------------------------------------------
//AnimationStep

class AnimationStep extends BaseAsset {
    constructor(){
        super();
        this.Clear();
    }
    Clear(){
        this.LstStr_ReferencedSheets = [];  //sheets referenced by the animation
        this.Lst_LocalSheets = [];          //sprite sheets defined specifically by this animation
        this.Lst_SpriteSheets = [];         //pointers to all sheets

        this.Lst_MatrixAnimations = [];     //matrix animations
        this.Lst_AlphaAnimations = [];      //alpha animations

        this.LstStr_ReferencedAnimations = []; //animations referenced in def    
        this.Lst_Animations = [];           //animation pointers

        this.Float_StartTime = 0.0;         //start drawing tha animation at this point
        this.Float_EndTime = -1.0;          //stop ticking the animation at this point
        
        //TODO more things
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(String_Path, jsonObject){
        if(typeof jsonObject !== 'object' || jsonObject == null){
            return false;
        }
        /*
        {
            "ReferencedSheet": ["...", "..."],
            "SpiteSheets": [{SpriteSheetAsset},{SpriteSheetAsset}],
            "MatrixAnimations": [{MatrixAnimations},{MatrixAnimations}],
            "AlphaAnimations": [{NumericAnimation},{NumericAnimation}],
            "Animations":["...","..."],
            "StartTime" = 0,
            "EndTime" = 0
        }
        */
        //Referenced spriteSheets
        if(Array.isArray(jsonObject.ReferencedSheet)){
            jsonObject.ReferencedSheet.forEach(element => {
                if(typeof element === 'string'){
                    this.LstStr_ReferencedSheets.push(element);
                }
            });
        }
        //local SpriteSheets
        if(Array.isArray(jsonObject.SpiteSheets)){
            jsonObject.SpiteSheets.forEach(element => {
                var newSheet = new SpriteSheetAsset();
                if(newSheet.bool_LoadFromFileData(String_Path, element)){
                    this.Lst_LocalSheets.push(newSheet);
                }
            });
        }
        //Matrix Animations
        if(Array.isArray(jsonObject.MatrixAnimations)){
            jsonObject.MatrixAnimations.forEach(element => {
                var NewAnim = new MatrixAnimation();
                if(NewAnim.bool_LoadFromFileData(String_Path, element)){
                    this.Lst_MatrixAnimations.push(NewAnim);
                }
            });
        }
        //Alpha animations
        if(Array.isArray(jsonObject.AlphaAnimations)){
            jsonObject.AlphaAnimations.forEach(element => {
                var NewAnim = new NumericAnimation();
                if(NewAnim.bool_LoadFromFileData(String_Path, element)){
                    this.Lst_AlphaAnimations.push(NewAnim);
                }
            });
        }
        //steps
        if(Array.isArray(jsonObject.Animations)){
            jsonObject.Animations.forEach(element => {
                if(typeof element === 'string'){
                    this.LstStr_ReferencedAnimations.push(element);
                }
            });
        }
        //timing
        if(typeof jsonObject.StartTime === 'number'){
            this.Float_StartTime = jsonObject.StartTime;
        }
        if(typeof jsonObject.EndTime === 'number'){
            this.Float_EndTime = jsonObject.EndTime;
        }
        return true;
    }
    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var retVal = [];
        this.LstStr_ReferencedSheets.forEach(element => {
            retVal.push(element);
        });
        this.Lst_LocalSheets.forEach(elementSheet => {
            elementSheet.LstStr_GetDependencies().forEach(elementStr => {
                retVal.push(elementStr);
            });
        });
        this.LstStr_ReferencedAnimations.forEach(element =>{
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
        this.Lst_SpriteSheets = [];
        this.LstStr_ReferencedSheets.forEach(element => {
            var Sheet = assetLibrary.GetSpriteSheetDef(element);
            if(Sheet != null){
                this.Lst_SpriteSheets.push(Sheet);
            }
        });  
        this.Lst_LocalSheets.forEach(element => {
            element.SetDependencies(assetLibrary);
            this.Lst_SpriteSheets.push(element);
        });
        this.Lst_Animations = [];
        this.LstStr_ReferencedAnimations.forEach(element => {
            var Anim = assetLibrary.GetAnimationDef(element);
            if(Anim != null){
                this.Lst_Animations.push(Anim);
            }
        });
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData
     * @param {Number} AnimationTime - how long has this been animating
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha, AnimationTime){
        //AnimationTime
        if(AnimationTime >= this.Float_EndTime && this.Float_EndTime > 0){
            AnimationTime = this.EndTime;
        }        
        AnimationTime = AnimationTime - this.Float_StartTime;

        //get transform
        var CompleteTransform = new Matrix3X3();
        if(ParentTranform != null){
            CompleteTransform.MultiplyMatrix(ParentTranform);
        }
        this.Lst_MatrixAnimations.forEach(element => {
            CompleteTransform.MultiplyMatrix(element.Matrix_GetCurrentMatrix(AnimationTime));
        });

        //get alpha
        var CompleteAlpha = ParentAlpha;
        this.Lst_AlphaAnimations.forEach(element => {
            CompleteAlpha *= CompleteAlpha.Num_GetValue(AnimationTime);
        });

        //draw sub animations
        this.Lst_Animations.forEach(element => {
            element.Draw(coreData, CompleteTransform, CompleteAlpha, AnimationTime);
        });

        //draw self
        this.Lst_SpriteSheets.forEach(element => {
            element.Draw(coreData, CompleteTransform, CompleteAlpha, AnimationTime);
        });       
    }
    Num_GetTotalAnimationMiliseconds(){
        if(this.Float_EndTime >= 0){
            if(this.Float_StartTime >= this.Float_EndTime){
                return 0;
            }
            return this.Float_EndTime - this.Float_StartTime;
        }
        var retVal = 0;
        //sprite sheets
        this.Lst_SpriteSheets.forEach(element => {
            var compartTime = element.Num_GetTotalAnimationMiliseconds();
            if(compartTime > retVal){
                retVal = compartTime;
            }
        });
        this.Lst_Animations.forEach(element => {
            var compartTime = element.Num_GetTotalAnimationMiliseconds();
            if(compartTime > retVal){
                retVal = compartTime;
            }
        });
        return retVal;
    }
}


//-----------------------------------------------------------------------------
//MatrixAnimation
//TODO not sure if this should be in it's own file

class MatrixAnimation{
    constructor(){
        this.Clear();
    }
    Clear(){
        //all of these are NumericAnimation
        this.MoveX = null;
        this.MoveY = null;

        this.ScaleX = null;
        this.ScaleY = null;

        this.Rotate = null;
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(String_Path, jsonObject){
         //we take in String_Path for consitency with other bool_LoadFromFileData() we don't use it

        /*
        {
            MoveX: {NumericAnimation},
            MoveY: {NumericAnimation},
            ScaleX: {NumericAnimation},
            ScaleY: {NumericAnimation},
            Rotate: {NumericAnimation},
        }
         */

        if(jsonObject == null){
            return false;
        }
        var temp = new NumericAnimation();
        if(temp.bool_LoadFromFileData(String_Path, jsonObject.MoveX)){
            this.MoveX = temp;
        }
        temp = new NumericAnimation();
        if(temp.bool_LoadFromFileData(String_Path, jsonObject.MoveY)){
            this.MoveY = temp;
        }

        temp = new NumericAnimation();
        if(temp.bool_LoadFromFileData(String_Path, jsonObject.ScaleX)){
            this.ScaleX = temp;
        }
        temp = new NumericAnimation();
        if(temp.bool_LoadFromFileData(String_Path, jsonObject.ScaleY)){
            this.ScaleY = temp;
        }
        temp = new NumericAnimation();
        if(temp.bool_LoadFromFileData(String_Path, jsonObject.ScaleX)){
            this.ScaleX = temp;
        }
        temp = new NumericAnimation();
        if(temp.bool_LoadFromFileData(String_Path, jsonObject.Rotate)){
            this.Rotate = temp;
        }
        return true;
    }
    /**
     * @param {Number} Num_AnimationTime 
     */
    Matrix_GetCurrentMatrix(Num_AnimationTime){
        var RetVal = new Matrix3X3();
        
        //translate
        var x = 0;
        var y = 0;
        if(this.MoveX != null){
            x = this.MoveX.Num_GetValue(Num_AnimationTime);
        }
        if(this.MoveY != null){
            y = this.MoveY.Num_GetValue(Num_AnimationTime);
        }
        if(x != 0 || y != 0){
            RetVal.TranslateSelf(x,y);
        }

        //scale
        var x = 1;
        var y = 1;
        if(this.ScaleX != null){
            x = this.ScaleX.Num_GetValue(Num_AnimationTime);
        }
        if(this.ScaleY != null){
            y = this.ScaleY.Num_GetValue(Num_AnimationTime);
        }
        if(x != 1 || y != 1){
            RetVal.ScaleSelf(x, y);
        }

        //rotate
        if(this.Rotate != null && this.Rotate != 0){
            RetVal.RotateSelf(this.Rotate.Num_GetValue(Num_AnimationTime));
        }

        return RetVal;
    }
}

class NumericAnimation{
    constructor(){
        this.Clear();
    }
    Clear(){
        //TODO types if we need more then quadratics ei(sin)

        //a(x^2)+bx+c
        this.a = 0;
        this.b = 0;
        this.c = 0;

        var min = null;
        var max = null;
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(String_Path, jsonObject){
        //we take in String_Path for consitency with other bool_LoadFromFileData() we don't use it

        /*
        {
            "a" = 4,
            "b" = 4,
            "c" = 4,
            "min" = 2,
            "max" = 4,
        }
        */

        if(jsonObject == null){
            return false;
        }
        if(typeof jsonObject.a === 'number'){
            this.a = jsonObject.a;
        }
        if(typeof jsonObject.b === 'number'){
            this.b = jsonObject.b;
        }
        if(typeof jsonObject.c === 'number'){
            this.c = jsonObject.c;
        }
        if(typeof jsonObject.min === 'number'){
            this.min = jsonObject.min;
        }
        if(typeof jsonObject.max === 'number'){
            this.max = jsonObject.max;
        }
        return true;
    }
    Num_GetValue(Num_Input){
        if(this.min != null && Num_Input < this.min){
            Num_Input = this.min;
        }
        if(this.max != null && Num_Input > this.max){
            Num_Input = this.max;
        }

        var retVal = 0;
        if(this.a != 0){
            retVal += this.a * Num_Input * Num_Input;
        }
        if(this.b != 0){
            retVal += this.b * Num_Input;
        }
        if(this.c != 0){
            retVal += this.c;
        }
        return retVal;
    }
}