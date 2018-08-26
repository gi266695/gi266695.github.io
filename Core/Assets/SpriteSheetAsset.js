//every time we draw we build a hitbox in screan space to check if we are on screen. having  a staic one need we don't have to crreate a new one each frame
var HitBox_RenderBox = new PolygonalHitBox();
HitBox_RenderBox.LstVec_Points.push(new Vector2D());
HitBox_RenderBox.LstVec_Points.push(new Vector2D());
HitBox_RenderBox.LstVec_Points.push(new Vector2D());
HitBox_RenderBox.LstVec_Points.push(new Vector2D());

class SpriteSheetAsset extends BaseAsset {
    constructor(){
        super();
        this.Clear();
    }
    Clear(){
        this.ImagePath = "";
        this.SecondsPerFrame = 0.066;
        this.LocalTransform = new Matrix3X3();
        this.Rows = 1;
        this.Columns = 1;
        this.Remainder = 0;
        this.Loop = false;
        this.AdditiveBlend = false;
        this.AlphaValue = 1.0;

        this.Image = null; 
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {Number} AnimationTime - how long has this been animating
     * @param {CoreData} coreData 
     * * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha, AnimationTime){
        if(coreData == null
                || coreData.CanvasElement == null
                || this.Image == null
                || !this.Image.complete
                || this.Image.naturalWidth === 0){
            //why is this even being fucking called
            return;
        }
        //get alpha
        var CompleteAlpha = ParentAlpha * this.AlphaValue;
        if(CompleteAlpha <= 0){
            //if this draw does nothing bail out early
            return;
        }
        if(CompleteAlpha > 1){
            CompleteAlpha = 1;
        }
        //get transform
        var CompleteTransform = new Matrix3X3();
        if(ParentTranform != null){
            CompleteTransform.MultiplyMatrix(ParentTranform);
        }
        CompleteTransform.MultiplyMatrix(this.LocalTransform);

        //check if this is on screen
        HitBox_RenderBox.LstVec_Points[0].x = 0.5;
        HitBox_RenderBox.LstVec_Points[0].y = 0.5;

        HitBox_RenderBox.LstVec_Points[1].x = 0.5;
        HitBox_RenderBox.LstVec_Points[1].y = -0.5;

        HitBox_RenderBox.LstVec_Points[2].x = -0.5;
        HitBox_RenderBox.LstVec_Points[2].y = -0.5;

        HitBox_RenderBox.LstVec_Points[3].x = -0.5;
        HitBox_RenderBox.LstVec_Points[3].y = 0.5;

        HitBox_RenderBox.TrasnformToSpace(CompleteTransform);
    
        //debug draw before we decide whether or not to draw this
        if(coreData.DrawSpriteBoxes){
            HitBox_RenderBox.Draw(coreData, null)
        }
        if(coreData.LayerStack.ScreenBox != null && !Bool_GetCollisionData(HitBox_RenderBox, coreData.LayerStack.ScreenBox)){
            return;
        }

        var FrameIndex = this.Num_GetFrameIndex(AnimationTime);
        var FrameRow =  this.Num_GetFrameRow(FrameIndex);
        var FrameWidth = this.Image.width > 0 ? this.Image.width / this.Columns : 1;
        var FrameColumn = this.Num_GetFrameColumn(FrameIndex);
        var FrameHeight = this.Image.height > 0 ? this.Image.height / this.Rows : 1;

        var context = coreData.GetContext2D(); 
        
        CompleteTransform.SetContextTransform(context);
        context.globalCompositeOperation = (this.AdditiveBlend ? 'lighter' : 'source-over');
        context.globalAlpha = CompleteAlpha;

        context.drawImage(this.Image,
                            FrameWidth * FrameColumn,
                            FrameHeight * FrameRow,
                            FrameWidth,
                            FrameHeight,
                            -0.5,   //always draw sprite centered at 0,0 with size 1, this way the transform is deciding things like position and scale
                            -0.5,
                            1,
                            1);
        //context.restore();
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(String_Path, jsonObject){
        if(typeof jsonObject !== "object" && jsonObject == null){
            return false;
        }

        /*
        {
            "ImagePath": "...",
            "MilisecondsPerFrame": 0.033,
            "CenterX": 0,
            "CenterY": 0,
            "Width": 1,
            "Height": 1,
            "Rows": 1,
            "Columns": 1,
            "Remainder": 0,
            "Loop": true,
            "AdditiveBlend": false,
            "Alpha": 1,
        }
        */

        var rootPath = "";
        var lastSlashIndex = String_Path.lastIndexOf("/");
        if(lastSlashIndex != -1 || lastSlashIndex > String_Path.length) {
            rootPath = String_Path.substr(0, lastSlashIndex + 1);
        }  

        if(typeof jsonObject.ImagePath === "string"){
            this.ImagePath = rootPath + jsonObject.ImagePath;
            this.ImagePath = this.ImagePath.toLowerCase();
        }
        if(typeof jsonObject.SecondsPerFrame === "number"){
            this.SecondsPerFrame = jsonObject.SecondsPerFrame;
        }
        //center
        this.LocalTransform = new Matrix3X3();
        var tempX = 0;
        var tempY = 0;
        if(typeof jsonObject.CenterX === "number"){
            tempX = jsonObject.CenterX;
        }
        if(typeof jsonObject.CenterY === "number"){
            tempY = jsonObject.CenterY;
        }
        this.LocalTransform.TranslateSelf(tempX, tempY); 

        //scale
        tempX = 50;
        if(typeof jsonObject.Width === "number"){
            tempX = jsonObject.Width;
        }
        tempY = tempX;
        if(typeof jsonObject.Height === "number"){
            tempY = jsonObject.Height;
        }
        this.LocalTransform.ScaleSelf(tempX, tempY);       

        if(typeof jsonObject.Rows === "number"){
            this.Rows = jsonObject.Rows;
        }
        if(typeof jsonObject.Columns === "number"){
            this.Columns = jsonObject.Columns;
        }
        if(typeof jsonObject.Remainder === "number"){
            this.Remainder = jsonObject.Remainder;
        }
        if(typeof jsonObject.Loop === "boolean"){
            this.Loop = jsonObject.Loop;
        }
        if(typeof jsonObject.AdditiveBlend === 'boolean'){
            this.AdditiveBlend = jsonObject.AdditiveBlend;
        }
        if(typeof jsonObject.Alpha === "number"){
            this.AlphaValue = jsonObject.Alpha;
        }
        return true;
    }
    /**
     * setup a basic sheet for a simgle image. if Matrix_LocalTransform is null it defualts to position(0,0) size (1,1). remember to use LstStr_GetDependencies and SetDependencies
     * @param {string} str_ImagePath 
     * @param {Matrix3X3} Matrix_LocalTransform
     */
    SetUpSimpleSheetForImage(str_ImagePath, Matrix_LocalTransform = null){
        if(str_ImagePath == null){
            //becuase fuck you thats why
            return;
        }
        if(Matrix_LocalTransform == null){
            Matrix_LocalTransform = new Matrix3X3();
            this.Matrix_LocalTransform.ScaleSelf(1, 1);
        }

        this.ImagePath = str_ImagePath;
        this.SecondsPerFrame = 0.066;
        this.LocalTransform = Matrix_LocalTransform;
        this.Rows = 1;
        this.Columns = 1;
        this.Remainder = 0;
        this.Loop = false;

        this.Image = null; 
    }

    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        var retVal = [];
        retVal.push(this.ImagePath);
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
        this.Image = assetLibrary.GetImage(this.ImagePath);
    }

    Num_GetFrameCount(){
        var RetVal = this.Rows * this.Columns;
        if(this.Remainder > 0){
            RetVal = (RetVal - this.Columns) + this.Remainder;
        }
        return RetVal;
    }
    Num_GetTotalAnimationMiliseconds(){
        return this.Num_GetFrameCount() * this.SecondsPerFrame;
    }
    Num_GetFrameIndex(Miliseconds){
        var AnimTime = this.Num_GetTotalAnimationMiliseconds();
        if(AnimTime <= 0){
            return 0;
        }
        if(Math.abs(Miliseconds) > AnimTime){
            if(!this.Loop){
                if(Miliseconds >= AnimTime){
                    Miliseconds = AnimTime;
                }
                else if(Miliseconds <= -AnimTime){
                    Miliseconds = -AnimTime;
                }
            }
            else{
                Miliseconds = Miliseconds % AnimTime;
            }
        }
        var NumFrames = this.Num_GetFrameCount();
        var RetVal = Math.trunc((Miliseconds / AnimTime) * NumFrames);
        if(RetVal >= NumFrames){
            --RetVal;
        }
        return RetVal;
    }
    Num_GetFrameRow(FrameIndex){
        if(this.Columns <= 1){
            return 0;
        }
        return Math.trunc(FrameIndex / this.Columns);
    }
    Num_GetFrameColumn(FrameIndex){
        if(this.Columns <= 0){
            return 0;
        }
        return Math.trunc(FrameIndex % this.Columns);
    }
}