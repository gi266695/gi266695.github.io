class LayerStack{
    constructor(){
        this.Clear();
    }
    Clear(){
        this.Lst_Layers = [];
        /** PolygonalHitBox used for determining if things are on screan. Note this is in Raw Screen space */
        this.ScreenBox = null;
    
        this.GlobalTransform = new Matrix3X3();
    }
    /**
     * @param {GameLayer} Layer 
     * @param {Number} Num_Priority 
     */
    AddLayer(Layer, Num_Priority){
        if(Layer == null
                || Num_Priority < 0
                || Layer.Num_StackPriority >= 0){
            return;
        }
        Layer.LayerStack = this;
        Layer.Num_StackPriority = Num_Priority;

        for(var loop = 0; loop < this.Lst_Layers.length; ++loop){
            var current = this.Lst_Layers[loop];
            //insert above existing layer
            if(Num_Priority <= current.Num_Priority){
                this.Lst_Layers.splice(loop, 0, Layer);
                return;
            }
        }
        //add to bottom of layer stack
        this.Lst_Layers.push(Layer);
    }
    /**
     * @param {GameLayer} Layer 
     */
    RemoveLayer(Layer){
        if(Layer == null
                || Layer.LayerStack != this){
            //no
            return;
        }
        for(var loop = 0; loop < this.Lst_Layers.length; ++loop){
            if(this.Lst_Layers[loop] == Layer){
                Layer = null;
                Layer.Num_StackPriority = -1;

                this.Lst_Layers.splice(loop, 1);
                return;
            }
        }
    }
    /**
     * @param {CoreData} coreData 
     * @param {Number} DeltaTime 
     */
    Tick(coreData, DeltaTime){
        if(coreData.LayerStack != this){
            return;
        }    
        this.Lst_Layers.forEach(element => {
            element.Tick(coreData, DeltaTime);
        });
    }
    /**
     * @param {CoreData} coreData 
     */
    Draw(coreData) {
        if(coreData != null
            && coreData.LayerStack != this
            && coreData.RootElement != null){
            return;
        }
        //clear canvas
        var style = coreData.WindowObj.getComputedStyle(coreData.RootElement, null);

        coreData.CanvasElement.width = parseInt(style.width);
        coreData.CanvasElement.height = parseInt(style.height);
        var context = coreData.CanvasElement.getContext("2d");
        context.clearRect(0, 0, coreData.CanvasElement.width, coreData.CanvasElement.height);

        if(this.ScreenBox == null){
            this.ScreenBox = new PolygonalHitBox();
            this.ScreenBox.LstVec_Points.push(new Vector2D());
            this.ScreenBox.LstVec_Points.push(new Vector2D());
            this.ScreenBox.LstVec_Points.push(new Vector2D());
            this.ScreenBox.LstVec_Points.push(new Vector2D());
        }
        this.ScreenBox.LstVec_Points[0].x = 0;
        this.ScreenBox.LstVec_Points[0].y = 0;
        this.ScreenBox.LstVec_Points[1].x = 0;
        this.ScreenBox.LstVec_Points[1].y = coreData.CanvasElement.height;
        this.ScreenBox.LstVec_Points[2].x = coreData.CanvasElement.width;
        this.ScreenBox.LstVec_Points[2].y = coreData.CanvasElement.height;
        this.ScreenBox.LstVec_Points[3].x = coreData.CanvasElement.width;
        this.ScreenBox.LstVec_Points[3].y = 0;
        this.ScreenBox.Init();

        if(coreData.DrawSpriteBoxes){
            this.ScreenBox.Draw(coreData, null);
        }

        //draw layers Bottom up
        //loop backwards
        for(var loop = this.Lst_Layers.length - 1; loop >= 0; --loop){
            this.Lst_Layers[loop].Draw(coreData, this.GlobalTransform);
        }
    }
}
/**
 * instances with a defined draw order that all share the same camera information
 */
class GameLayer {
    constructor(){
        this.Clear();
    }
    Clear(){
        //for internal use only
        this.Num_StackPriority = -1;
        this.Lst_Sets = [];
        this.LayerStack = null;
        
        //your's to fuck with
        this.Matrix_CameraTransform = new Matrix3X3();
        this.Num_Alpha = 1;
    }
    /**
     * 
     * @param {BaseInstance} Instance 
     * @param {Number} Num_Priority 
     */
    AddInstance(Instance, Num_Priority){
        if(Instance == null || Instance.Layer != null){
            return;
        }
        Instance.Layer = this;

        for(var loop = 0; loop < this.Lst_Sets.length; ++loop){
            var currentSet = this.Lst_Sets[loop];
            //add to existing set
            if(currentSet.Num_Priority == Num_Priority){
                currentSet.AddInstance(Instance);
                return;
            }
            //insert new set
            if(Num_Priority < currentSet.priority ){
                var newSet = new LayerInstanceSet();
                newSet.Num_Priority = Num_Priority;
                newSet.AddInstance(Instance);

                this.Lst_Sets.splice(loop, 0, newSet);
                return;
            }
        }
        //if we got this far we have not inserted anything yet
        var newSet = new LayerInstanceSet();
        newSet.Num_Priority = Num_Priority;
        newSet.AddInstance(Instance);
        this.Lst_Sets.push(newSet);
    }
    /**
     * @param {BaseInstance} Instance 
     */
    RemoveInstance(Instance){
        if(Instance == null 
                || Instance.Layer != this
                || Instance.LayerPriority < 0){
            return;
        }
        for(var loop = 0; loop < this.Lst_Sets.length; loop++){
            if(Instance.LayerPriority == this.Lst_Sets[loop].Num_Priority){
                this.Lst_Sets[loop].RemoveInstance(Instance);
                Instance.Layer = null;
                break;
            }
        }
    }
    Matrix_GetTransform(){
        var RetVal = new Matrix3X3();
        if(this.LayerStack != null && this.LayerStack.GlobalTransform != null){
            RetVal.MultiplyMatrix(this.LayerStack.GlobalTransform);
        }
        RetVal.MultiplyMatrix(this.Matrix_CameraTransform);

        return RetVal;
    }
    /** 
     * @param {Vector2D} Vector_Center 
     * @param {number} Scale
     */
    SetCamera(Vector_Center, Scale){
        if(Vector_Center == null
                 || this.LayerStack == null
                 || this.LayerStack.ScreenBox == null
                 || this.LayerStack.GlobalTransform == null){
            return;
        }
        var InverseScreenSpace = this.LayerStack.GlobalTransform.Matrix_GetInverse();
        if(InverseScreenSpace == null){
            return;
        }
        var ScreenCenter = new Vector2D();
        ScreenCenter.Assign(this.LayerStack.ScreenBox.Vector_Center);
        ScreenCenter = InverseScreenSpace.Vector_MultiplyVector(ScreenCenter);
        ScreenCenter.SubtractFromSelf(Vector_Center);

        this.Matrix_CameraTransform.SetToTranslation(ScreenCenter.x, ScreenCenter.y);
        this.Matrix_CameraTransform.ScaleSelf(Scale, Scale);

    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){   
        this.Lst_Sets.forEach(element => {
            element.Tick(coreData, DeltaTime);
        });
    }
    /**
     * @param {CoreData} coreData
     * @param {Matrix3X3} ParentTranform 
     */
    Draw(coreData, ParentTranform){
        if(this.Num_Alpha <= 0){
            return;
        }
        var CompleteTransform = new Matrix3X3();
        if(ParentTranform != null){
            CompleteTransform.MultiplyMatrix(ParentTranform);
        }
        CompleteTransform.MultiplyMatrix(this.Matrix_CameraTransform);

        this.Lst_Sets.forEach(element => {
            element.Draw(coreData, CompleteTransform, this.Num_Alpha);
        });
    }
}

/**
 * a bunch of instances
 */
class LayerInstanceSet {
    constructor(){
        this.Clear();
    }
    Clear(){
        this.Num_Priority = 0;
        this.Lst_Instances = [];
        this.Set_OpenIndexes = new Set();
    }
    AddInstance(Instance){
        if(Instance == null){
            return;
        }
        var insertionIndex = -1;
        for(var loop = 0; loop < this.Set_OpenIndexes.length; loop++){
            insertionIndex = element;
            this.Set_OpenIndexes.splice(loop, 1);
            break;
        }  
        if(insertionIndex < 0){
            insertionIndex = this.Lst_Instances.length;
            this.Lst_Instances.push(Instance);
        }
        else{
            this.Lst_Instances[insertionIndex] = Instance;
        }

        Instance.LayerPriority = this.Num_Priority;
        Instance.LayerSetIndex = insertionIndex;

 
    }
    RemoveInstance(Instance){
        if(Instance == null
                || Instance.LayerSetIndex < 0
                || Instance.LayerSetIndex >= this.Lst_Instances.length
                || this.Lst_Instances[Instance.LayerSetIndex] != Instance){
            return;
        }
        this.Lst_Instances[Instance.LayerSetIndex] = null;

        this.Set_OpenIndexes.add(Instance.LayerSetIndex);
        
        Instance.Layer = null;
        Instance.LayerPriority = -1
        Instance.LayerSetIndex = -1;

    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){   
        this.Lst_Instances.forEach(element => {
            if(element != null){
                element.Tick(coreData, DeltaTime);
            }
        });
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha){
        this.Lst_Instances.forEach(element => {
            if(element != null){
                element.Draw(coreData, ParentTranform, ParentAlpha);
            }
        });
    }

}

/**
 * A single thing (Sprite mostly)
 */
class BaseInstance{
    constructor(){ 
        //for internal use only Do not set these
        this.Layer = null;
        this.LayerPriority = -1
        this.LayerSetIndex = -1;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ ; }

    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha){ ; }
}