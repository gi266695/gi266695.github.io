//defines a hitbox defined by a list of points 
class PolygonalHitBox {
    constructor(){
        this.Clear();
    }
    Clear(){
        this.LstVec_Points = [];
        this.Vector_Center = new Vector2D();
        this.Vector_Size = new Vector2D();
    }
    /**
     * @param {PolygonalHitBox} other 
     */
    Assign(other){
        if(other == null){
            return;
        }
        for(var loop = 0; loop <  other.LstVec_Points.length; loop++){
            if(loop <= this.LstVec_Points.length){
                var newPoint = new Vector2D();
                this.LstVec_Points.push(newPoint);
            }
            this.LstVec_Points[loop].Assign(other.LstVec_Points[loop]);
        }
        if(this.LstVec_Points.length > other.LstVec_Points.length){
            this.LstVec_Points.splice(other.LstVec_Points.length, this.LstVec_Points.length - other.LstVec_Points.length)
        }

        this.Vector_Center.Assign(other.Vector_Center);
        this.Vector_Size.Assign(other.Vector_Size);
    }
    /**
     * set up metadata for points
     * @param {array} LstVec_Points 
     */
    SetPoints(LstVec_Points){
        if(LstVec_Points == null){
            return;
        }
        Clear();
        LstVec_Points.forEach(element => {
            this.LstVec_Points.push(LstVec_Points);
        });
        Init();
    }
    /**
     * apply transform to this hitbox
     * @param {Matrix3X3} Matrix 
     */
    TrasnformToSpace(Matrix){
        if(this.LstVec_Points == null){
            return;
        }
        this.LstVec_Points.forEach(element => {
            element.Assign(Matrix.Vector_MultiplyVector(element));
        });
        this.Init();
    }
    Init(){
        this.Vector_Center.SetToZero();
        this.Vector_Size.SetToZero();
        var MinX = null;
        var MaxX = null;
        var MinY = null;
        var MaxY = null;
        this.LstVec_Points.forEach(element => {
            MinX = MinX != null ? Math.min(MinX, element.x) : element.x;
            MinY = MinY != null ? Math.min(MinY, element.y) : element.y;
            MaxX = MaxX != null ? Math.max(MaxX, element.x) : element.x;
            MaxY = MaxY != null ? Math.max(MaxY, element.y) : element.y;
        });
        if(this.LstVec_Points.length > 0){
            this.Vector_Size.x = MaxX - MinX;
            this.Vector_Size.y = MaxY - MinY;

            this.Vector_Center.x = MinX + (this.Vector_Size.x / 2);
            this.Vector_Center.y = MinY + (this.Vector_Size.y / 2);
        }
    }
    Num_GetBoundsCenterX(){
        return this.Vector_Center.x;
    }
    Num_GetBoundsCenterY(){
        return this.Vector_Center.y;
    }
    Num_GetBoundsSizeX(){
       return this.Vector_Size.x;
    }
    Num_GetBoundsSizeY(){
        return this.Vector_Size.y;
     }
    /**
     * @param {Vector2D} point 
     */
    Bool_IsPointInside(point){
        if(point == null){
            return;
        }
        if(this.LstVec_Points.length < 3){
            console.log("PolygonalHitBox.Bool_IsPointInside() hitbox has [" + this.LstVec_Points.length + "] this box is invalid");
            return false;
        }
        //is inside simple bounds
        if(point.x < (this.Num_GetBoundsCenterX() - (this.Num_GetBoundsSizeX() / 2))
                || point.x > (this.Num_GetBoundsCenterX() + (this.Num_GetBoundsSizeX() / 2))
                || point.y < (this.Num_GetBoundsCenterY() - (this.Num_GetBoundsSizeY() / 2))
                || point.y > (this.Num_GetBoundsCenterY() + (this.Num_GetBoundsSizeY() / 2))){
            
            return false;
        }

        //is inside all lines
        for(var loop = 0; loop < this.LstVec_Points.length; loop++){
            var a1 = this.LstVec_Points[loop];
            var a2 = null;
            if(loop + 1 < this.LstVec_Points.length){
                a2 = this.LstVec_Points[loop + 1];
            }
            else{
                a2 = this.LstVec_Points[0];
            }
            if(!bool_IsOnSameSide(a1, a2, this.Vector_Center, point)){
                return false;
            }
        }
        return true;
    }
    /**
     * @param {Vector2D} a1 
     * @param {Vector2D} a2 
     */
    Bool_IsLineInBox(a1, a2){
        if(a1 == null || a2 == null){
            return false;
        }
        if(this.Vector_GetClosestIntersection(a1, a2) != null){
            return true;
        }
        return this.Bool_IsPointInside(a1) || this.Bool_IsPointInside(a2);
    }

    /**
     * Given the line defined by (a1, a2) return the intersection closet to a1
     * out_fathestIntersectopm is only filled if not null
     * @param {Vector2D} a1 
     * @param {Vector2D} a2 
     * @param {out_fathestIntersection} a2 
     */
    Vector_GetClosestIntersection(a1, a2, out_fathestIntersection = null){
        if(a1 == null || a2 == null || this.LstVec_Points.length < 3){
            return null;
        }
        if(out_fathestIntersection != null){
            out_fathestIntersection.SetToZero();
        }
        //idoit check is a even within the boundsw of this box
        var MinX = Math.min(a1.x, a2.x);
        var MinY = Math.min(a1.y, a2.y);
        var MaxX = Math.max(a1.x, a2.x);
        var MaxY = Math.max(a1.y, a2.y);
        var CenterX = MinX + ((MaxX - MinX) / 2);
        var CenterY = MinY + ((MaxY - MinY) / 2);
        if(CenterX - this.Vector_Center.x > ((MaxX - MinX) + this.Vector_Size.x) / 2
                || CenterY - this.Vector_Center.y > ((MaxY - MinY) + this.Vector_Size.y) / 2){
            return null;     
        }
        var RetVal = null;
        var OldManhattan = 0;
        var TestLength = new Vector2D();

        var longestIntersect = null;
        var longestManhattan = 0;

        for(var loop = 0; loop < this.LstVec_Points.length; loop++){
            var b1 = this.LstVec_Points[loop];
            var b2 = null;
            if(loop + 1 < this.LstVec_Points.length){
                b2 = this.LstVec_Points[loop + 1];
            }
            else{
                b2 = this.LstVec_Points[0];
            }
            var Intersect = Vector_GetIntersection(a1, a2, b1, b2);
            if(Intersect != null){
                TestLength.Assign(Intersect);
                TestLength.SubtractFromSelf(a1);

                if(RetVal == null || TestLength.Num_GetManhattan() < OldManhattan){
                    OldManhattan = TestLength.Num_GetManhattan();
                    RetVal = Intersect;
                }      
                if(longestIntersect == null || TestLength.Num_GetManhattan() > longestManhattan){
                    longestManhattan = TestLength.Num_GetManhattan();
                    longestIntersect = Intersect;
                }       
            }
        }
        if(out_fathestIntersection != null){
            out_fathestIntersection.Assign(longestIntersect);
        }
        return RetVal;
    }

    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {String} Color
     * @param {number} LineWidth
     */
    Draw(coreData, ParentTranform, Color = '#ff0000', LineWidth = 1){
        if(coreData == null){
            return;
        }
        var context = coreData.GetContext2D();
        if(ParentTranform != null){
            ParentTranform.SetContextTransform(context);
        }
        else{
            var temp = new Matrix3X3();
            temp.SetContextTransform(context);
        }
        for(var loop = 0; loop < this.LstVec_Points.length; loop++){
            var a1 = this.LstVec_Points[loop];
            var a2 = null;
            if(loop + 1 < this.LstVec_Points.length){
                a2 = this.LstVec_Points[loop + 1];
            }
            else{
                a2 = this.LstVec_Points[0];
            }
            context.beginPath();

            context.moveTo(a1.x, a1.y);
            context.lineTo(a2.x, a2.y);

            context.strokeStyle = Color;
            context.lineWidth = LineWidth;
            context.stroke();
        }
        context.restore();
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
        /**
         {
             "Points":[{Vector2D}, {Vector2D}]
         }
         OR
         {
             "Type": "circle",
             "Center": {Vector2D},
             "Radius": 5,
             "Points": 2,
             "Start": 0.5,
             "End": -0.5
         }
         */
        var type = 'defualt';
        if(typeof JSONObject.Type == 'string'){
            type = JSONObject.Type;
        }
        type = type.toLowerCase();

        if(type == 'defualt'){
            if(Array.isArray(JSONObject.Points)){
                JSONObject.Points.forEach(element => {
                    var newPoint = new Vector2D();
                    if(newPoint.bool_LoadFromFileData(rootPath, element)){
                        this.LstVec_Points.push(newPoint);
                    }
                });
            }
        }
        else if(type == 'circle'){
            var Center = new Vector2D();
            var Radius = 1;
            var Points = 2;
            var Start = 0;
            var End = 0;

            if(typeof JSONObject.Center == 'object'){
                if(!Center.bool_LoadFromFileData(rootPath, JSONObject.Center)){
                    Center.SetToZero();
                }
            }
            if(typeof JSONObject.Radius == 'number'){
                Radius = JSONObject.Radius;
            }
            if(typeof JSONObject.Points == 'number'){
                Points = JSONObject.Points;
            }
            if(typeof JSONObject.Start == 'number'){
                Start = JSONObject.Start;
            }
            if(typeof JSONObject.End == 'number'){
                End = JSONObject.End;
            }
            
            var NewBox = HitBox_GetCircle(Center, Radius, Points, Start, End);
            if(NewBox == null){
                return false;
            }
            this.Assign(NewBox);
        }
        else{
            return false;
        }
        if(this.LstVec_Points.length < 3){
            return false;
        }
        this.Init();
        return true;
    }

}
function Bool_AreAnyColliding(Lst_Boxes1, Lst_Boxes2){
    if(!Array.isArray(Lst_Boxes1) || !Array.isArray(Lst_Boxes2)){
        return false;
    }
    for(var loop1 = 0; loop1 < Lst_Boxes1.length; loop1++){
        for(var loop2 = 0; loop2 < Lst_Boxes2.length; loop2++){
            if(Bool_GetCollisionData(Lst_Boxes1[loop1], Lst_Boxes2[loop2])){
                return true;
            }
        }
    }
    return false;
}

/**
 * returns true if the two boxes are coliding. If Vector_1_Normal facing of the collision with Box1. Same Vector_2_Normal for Box2
 * @param {PolygonalHitBox} Box1 
 * @param {PolygonalHitBox} Box2 
 * @param {Vector2D} Vector_1_Normal
 * @param {Vector2D} Vector_2_Normal
 */
function Bool_GetCollisionData(Box1, Box2, Vector_1_Normal = null, Vector_2_Normal = null){
    if(Vector_1_Normal != null){
        Vector_1_Normal.SetToZero();
    }
    if(Vector_2_Normal != null){
        Vector_2_Normal.SetToZero();
    }
    if(Box1 == null
            || Box2 == null 
            || Box1.LstVec_Points.length < 3
            || Box2.LstVec_Points.length < 3){
        return false;
    }
    //check if boxes are even remotly close
    if(Math.abs(Box1.Num_GetBoundsCenterX() - Box2.Num_GetBoundsCenterX()) > (Box1.Num_GetBoundsSizeX() + Box2.Num_GetBoundsSizeX() / 2)
            || Math.abs(Box1.Num_GetBoundsCenterY() - Box2.Num_GetBoundsCenterY()) > (Box1.Num_GetBoundsSizeY() + Box2.Num_GetBoundsSizeY() / 2)){
        return false
    }

    //check for intersetions
    var Lst_Vectors_Box1 = null;
    var Lst_Vectors_Box2 = null;
    if(Vector_1_Normal != null){
        Lst_Vectors_Box1 = [];
    }
    if(Vector_2_Normal != null){
        Lst_Vectors_Box2 = [];
    }
    for(var loop1 = 0; loop1 < Box1.LstVec_Points.length; loop1++){
        var a1 = Box1.LstVec_Points[loop1];
        var a2 = null;
        if(loop1 + 1 < Box1.LstVec_Points.length){
            a2 = Box1.LstVec_Points[loop1 + 1];
        }
        else{
            a2 = Box1.LstVec_Points[0];
        }
        for(var loop2 = 0; loop2 < Box2.LstVec_Points.length; loop2++){
            var b1 = Box2.LstVec_Points[loop2];
            var b2 = null;
            if(loop2 + 1 < Box2.LstVec_Points.length){
                b2 = Box2.LstVec_Points[loop2 + 1];
            }
            else{
                b2 = Box2.LstVec_Points[0];
            }

            if(Bool_DoesLineIntersect(a1, a2, b1, b2)){
                var NeedNormals = false;
                if(Lst_Vectors_Box1 != null){
                    NeedNormals = true;

                    var Normal = Vector_GetNormalForSide(a1, a2, Box1.Vector_Center);
                    if(Normal != null){
                        Lst_Vectors_Box1.push(Normal);
                    }
                }
                if(Lst_Vectors_Box2 != null){
                    NeedNormals = true;

                    var Normal = Vector_GetNormalForSide(b1, b2, Box2.Vector_Center);
                    if(Normal != null){
                        Lst_Vectors_Box2.push(Normal);
                    }
                }
                if(!NeedNormals){
                    return true;
                }
            }
        }
    }
    if(Lst_Vectors_Box1 != null && Lst_Vectors_Box1.length > 0){
        Lst_Vectors_Box1.forEach(element => {
            Vector_1_Normal.AddToSelf(element);
        });
        Vector_1_Normal.Normalize();
    }
    if(Lst_Vectors_Box2 != null && Lst_Vectors_Box2.length > 0){
        Lst_Vectors_Box2.forEach(element => {
            Vector_2_Normal.AddToSelf(element);
        });
        Vector_2_Normal.Normalize();
    }
    if((Lst_Vectors_Box1 != null && Lst_Vectors_Box1.length > 0)
            || (Lst_Vectors_Box2 != null && Lst_Vectors_Box2.length > 0)){
        return true;
    }

    //the only case remaining is if if one box is completly in another
    if(Box1.Bool_IsPointInside(Box2.LstVec_Points[0]) || Box2.Bool_IsPointInside(Box1.LstVec_Points[0])){
        if(Vector_1_Normal != null){
            Vector_1_Normal.Assign(Box2.Vector_Center);
            Vector_1_Normal.SubtractFromSelf(Box1.Vector_Center);
            Vector_1_Normal.Normalize();
        }
        if(Vector_2_Normal != null){
            Vector_2_Normal.Assign(Box1.Vector_Center);
            Vector_2_Normal.SubtractFromSelf(Box2.Vector_Center);
            Vector_2_Normal.Normalize();
        }
        return true;
    }
    return false;
}

/**
 * given a line defined by (a1, a2) return a vector pointing away from the center
 * @param {Vector2D} a1 
 * @param {Vector2D} a2 
 * @param {Vector2D} Center 
 */
function Vector_GetNormalForSide(a1, a2, Center){
    if(a1 == null || a2 == null || Center == null){
        return null;
    }
    var RetVal = new Vector2D();
    RetVal.Assign(a1);
    RetVal.SubtractFromSelf(a2);
    if(RetVal.Num_GetManhattan() <= 0){
        return null;
    }
    RetVal.ReverseXY();
    RetVal.Normalize();
    RetVal.x *= -1;

    var TestPoint = new Vector2D();
    TestPoint.Assign(a1);
    TestPoint.AddToSelf(RetVal);
    if(bool_IsOnSameSide(a1, a2, Center, TestPoint)){
        RetVal.x *= -1;
        RetVal.y *= -1;
    }
    return RetVal;
}

/**
 * returns the smallest distance MobileBox would need to move in order to no longer be incontact with StationaryBox
 * Wanring this will edit LstBoxes_Mobile Don't pass collision data you care about
 * if Bool_FailNotification is defined this function will not split up collisions to find a solution it will just return null (Bool_FailNotification.Bool_FailNotification will == true in this case)
 * @param {array} LstBoxes_Stationary
 * @param {array} LstBoxes_Mobile 
 */
function Vector_GetCollisionSolution(LstBoxes_Stationary, LstBoxes_Mobile){
    if(LstBoxes_Stationary == null || LstBoxes_Stationary.length <= 0
            || LstBoxes_Mobile == null || LstBoxes_Mobile.length <= 0){

        //becuase fuck you
        return null;
    }
    //TODO: less horrifically brute force

    //find all of the collisions. see if we can handle them in 1 step or if we nead several
    var Vector_Temp = new Vector2D();

    var LstBoxes_ActiveStationary = [];
    var LstBoxes_ActiveMobile = [];

    var Vector_CollisionNormal = new Vector2D();
    var LstVec_Normals = [];

    for(var loopStation = 0; loopStation < LstBoxes_Stationary.length; loopStation++){
        StationaryElement = LstBoxes_Stationary[loopStation];
        for(var loopMobile = 0; loopMobile < LstBoxes_Mobile.length; loopMobile++){
            MobileElement = LstBoxes_Mobile[loopMobile];
            if(Bool_GetCollisionData(StationaryElement, MobileElement, Vector_Temp)/* && Vector_Temp.Num_GetManhattan() > 0*/){          
                Vector_CollisionNormal.AddToSelf(Vector_Temp);
                
                var index = LstBoxes_ActiveStationary.indexOf(StationaryElement);
                if(index < 0){
                    LstBoxes_ActiveStationary.push(StationaryElement);
                    var newItem = {};
                    newItem.Vector = Vector_Temp;
                    newItem.Box = StationaryElement;
                    LstVec_Normals.push(newItem);
                }
                else{
                    LstVec_Normals[index].Vector.AddToSelf(Vector_Temp);
                }
                if(!LstBoxes_ActiveMobile.includes(MobileElement)){
                    LstBoxes_ActiveMobile.push(MobileElement);
                }
            }
        }
    }
    //no collisions
    if(LstBoxes_ActiveStationary.length <= 0 
            || LstBoxes_ActiveMobile.length <= 0
            || Vector_CollisionNormal.Num_GetManhattan() == 0){
        return null;
    }

    var CumulativeSoluion = Vector_GetCollisionSolution_helper(LstBoxes_Stationary, LstBoxes_Mobile, LstBoxes_ActiveStationary, LstBoxes_ActiveMobile, Vector_CollisionNormal);
    if(LstBoxes_ActiveStationary.length <= 1){
        return CumulativeSoluion;
    }
    var GeneralDirection = Vector_CollisionNormal.Num_GetRadians();
    LstVec_Normals.sort((a, b) => {
        var aDif = a.Vector.Num_GetRadians() - GeneralDirection;
        var bDif = b.Vector.Num_GetRadians() - GeneralDirection;
        if(aDif > bDif){
            return -1;
        }
        if(aDif < bDif){
            return 1;
        }
        return 0;
    });

    var IndividualSolution = null;
    var LstBoxes_MobileMoved = [];
    LstBoxes_Mobile.forEach(element => {
        var NewHitBox = new PolygonalHitBox();
        NewHitBox.Assign(element);
        LstBoxes_MobileMoved.push(NewHitBox);
    });
    var Matrix_temp = new Matrix3X3();
    var Lst_temp = [];
    Lst_temp.push(null);

    LstVec_Normals.forEach(Collision => {
        Vector_CollisionNormal.SetToZero();
        LstBoxes_ActiveMobile = [];
        LstBoxes_MobileMoved.forEach(MobileBox => {
            var Normal = new Vector2D();
            if(Bool_GetCollisionData(Collision.Box, MobileBox, Normal) && Normal.Num_GetManhattan() > 0){
                Vector_CollisionNormal.AddToSelf(Normal);
                LstBoxes_ActiveMobile.push(MobileBox);
            }
        });
        if(Vector_CollisionNormal.Num_GetManhattan() > 0){
            Lst_temp[0] = Collision.Box;
            var Solution = Vector_GetCollisionSolution_helper(Lst_temp, LstBoxes_MobileMoved, Lst_temp, LstBoxes_ActiveMobile, Vector_CollisionNormal);
            if(Solution != null){
                if(IndividualSolution == null){
                    IndividualSolution = new Vector2D();
                }
                IndividualSolution.AddToSelf(Solution);

                Matrix_temp.SetToTranslation(Solution.x, Solution.y);
                LstBoxes_MobileMoved.forEach(MobileBox => {
                    MobileBox.TrasnformToSpace(Matrix_temp);
                });              
            }
        }
    });
    //make sure IndividualSolution is actually valid
    for(var loopStationary = 0; IndividualSolution != null && loopStationary < LstBoxes_Stationary.length; ++loopStationary){
        for(var loopMobile = 0; IndividualSolution != null && loopMobile < LstBoxes_MobileMoved.length; ++loopMobile){
            if(Bool_GetCollisionData(LstBoxes_Stationary[loopStationary], LstBoxes_MobileMoved[loopMobile])){
                IndividualSolution = null;
            }
        }
    }
    if(IndividualSolution == null){
        return CumulativeSoluion;
    }
    if(CumulativeSoluion == null){
        return IndividualSolution;
    }
    if(CumulativeSoluion.Num_GetLength() > IndividualSolution.Num_GetLength()){
        return IndividualSolution;
    }
    return CumulativeSoluion;

    /**
     * Helper you should not be calling this
     * returns the smallest distance MobileBox would need to move in order to no longer be incontact with StationaryBox
     * Wanring this will edit LstBoxes_Mobile Don't pass collision data you care about
     * if Bool_FailNotification is defined this function will not split up collisions to find a solution it will just return null (Bool_FailNotification.Bool_FailNotification will == true in this case)
     * @param {array} LstBoxes_Stationary
     * @param {array} LstBoxes_Mobile 
     */
    function Vector_GetCollisionSolution_helper(LstBoxes_Stationary, LstBoxes_Mobile, LstBoxes_ActiveStationary, LstBoxes_ActiveMobile, Vector_CollisionNormal){
        //no collisions
        if(LstBoxes_ActiveStationary.length <= 0
                || LstBoxes_ActiveMobile.length <= 0){
            return null;
        }
        //Attempt to find solution
        var BestSolution = null;
        if(Vector_CollisionNormal.Num_GetManhattan() > 0){
            Vector_CollisionNormal.Normalize();

            Lst_Solutions = [];

            var Offset = new Vector2D();
        
            var Line1 = new Vector2D();
            var Line2 = new Vector2D();
            
            //possible solutions from stationary
            LstBoxes_ActiveStationary.forEach(StationaryBox => {
                StationaryBox.LstVec_Points.forEach(ElementPoint => {           
                    LstBoxes_ActiveMobile.forEach(MobileBox => {
                        Offset.Assign(Vector_CollisionNormal);
                        Offset.MultiplySelf(StationaryBox.Vector_Size.Num_GetManhattan() + MobileBox.Vector_Size.Num_GetManhattan());        

                        Line1.Assign(ElementPoint);
                        Line1.AddToSelf(Offset);
                        Line2.Assign(ElementPoint);
                        Line2.SubtractFromSelf(Offset);

                        var Solution2 = new Vector2D();
                        var Solution = MobileBox.Vector_GetClosestIntersection(Line1, Line2, Solution2);
                        if(Solution != null){
                            var temp = new Vector2D();

                            //console.log("Vector_GetCollisionSolution(): possible Statioary Solution found");
                            temp.Assign(ElementPoint);
                            temp.SubtractFromSelf(Solution);
                            temp.MultiplySelf(1.001);
                            if(!bool_SameSign(Vector_CollisionNormal.x, temp.x) || !bool_SameSign(Vector_CollisionNormal.y, temp.y)){
                                temp.MultiplySelf(-1);
                            }
                            Lst_Solutions.push(temp);

                            temp = new Vector2D();
                            temp.Assign(ElementPoint);
                            temp.SubtractFromSelf(Solution2);
                            temp.MultiplySelf(1.001);
                            if(!bool_SameSign(Vector_CollisionNormal.x, temp.x) || !bool_SameSign(Vector_CollisionNormal.y, temp.y)){
                                temp.MultiplySelf(-1);
                            }
                            Lst_Solutions.push(temp);
                        }
                    });               
                });
            });
            //possible solutions from mobile
            LstBoxes_ActiveMobile.forEach(MobileBox => {
                MobileBox.LstVec_Points.forEach(ElementPoint => {
                    LstBoxes_ActiveStationary.forEach(StationaryBox => {
                        Offset.Assign(Vector_CollisionNormal);
                        Offset.MultiplySelf(StationaryBox.Vector_Size.Num_GetManhattan() + MobileBox.Vector_Size.Num_GetManhattan());

                        Line1.Assign(ElementPoint);
                        Line1.SubtractFromSelf(Offset);
                        Line2.Assign(ElementPoint);
                        Line2.AddToSelf(Offset);

                        var Solution2 = new Vector2D();
                        var Solution = StationaryBox.Vector_GetClosestIntersection(Line1, Line2, Solution2);
                        if(Solution != null){
                            //console.log("Vector_GetCollisionSolution(): possible Mobile Solution found");
                            Solution.SubtractFromSelf(ElementPoint);
                            Solution.MultiplySelf(1.001);
                            if(!bool_SameSign(Vector_CollisionNormal.x, Solution.x) || !bool_SameSign(Vector_CollisionNormal.y, Solution.y)){
                                Solution.MultiplySelf(-1);
                            }
                            Lst_Solutions.push(Solution);

                            Solution2.SubtractFromSelf(ElementPoint);
                            Solution2.MultiplySelf(1.001);
                            if(!bool_SameSign(Vector_CollisionNormal.x, Solution2.x) || !bool_SameSign(Vector_CollisionNormal.y, Solution2.y)){
                                Solution2.MultiplySelf(-1);
                            }
                            Lst_Solutions.push(Solution2);
                        }
                    }); 
                });
            }); 
            //compare soluitions pick the best one that works
            if(Lst_Solutions.length > 0){
                Lst_Solutions.splice(0,0, new Vector2D(0,0));

                var Matrix = new Matrix3X3();
                var LstBoxes_test = [];
                for(var loop = 0; loop < LstBoxes_Mobile.length; loop++){
                    LstBoxes_test.push(new PolygonalHitBox())
                }

                var BestCost = null;

                Lst_Solutions.forEach(possibleSolution => {
                    var PossibleCost = possibleSolution.Num_GetManhattan();           
                    if(BestSolution == null || PossibleCost < BestCost){

                        Matrix.SetToTranslation(possibleSolution.x, possibleSolution.y);
                        for(var loop = 0; loop < LstBoxes_Mobile.length; loop++){
                            LstBoxes_test[loop].Assign(LstBoxes_Mobile[loop]);
                            LstBoxes_test[loop].TrasnformToSpace(Matrix);
                        }
                        var bool_FoundColision = false
                        for(var loopStation = 0; !bool_FoundColision && loopStation < LstBoxes_Stationary.length; loopStation++){
                            for(var loopTest = 0; !bool_FoundColision && loopTest < LstBoxes_test.length; loopTest++){
                                if(Bool_GetCollisionData(LstBoxes_Stationary[loopStation], LstBoxes_test[loopTest])){
                                    bool_FoundColision = true;
                                }
                            }
                        }
                        if(!bool_FoundColision){
                            BestSolution = possibleSolution;
                            BestCost = PossibleCost;
                        }
                    }
                });
            }
            if(BestSolution != null && BestSolution.Num_GetLength() > 30){
                console.log("big solution");
            }
        }
        //solution found
        if(BestSolution != null){
            return BestSolution;
        }
        //TODO: attempt other solutions
        return null;
    }
}

/**
 * @param {Vector2D} Vector_Center 
 * @param {number} Num_Radius 
 * @param {number} Num_Points 
 */
function HitBox_GetCircle(Vector_Center, Num_Radius, Num_Points, Num_StartRadians = 0, Num_EndRadians = 0){    
    var min = Math.min(Num_StartRadians, Num_EndRadians);
    var max = Math.max(Num_StartRadians, Num_EndRadians);

    if(Vector_Center == null
            || Num_Radius <= 0
            || Num_Points < 2
            || (max - min) > Math.PI){
        return null;
    }
    var RetVal = new PolygonalHitBox();
    
    if(Num_StartRadians == Num_EndRadians){
        for(var loop = 0; loop < Num_Points; loop++){
            var offset = Vector_GetNormal(((Math.PI * 2) / Num_Points) * loop);
            offset.MultiplySelf(Num_Radius);
            offset.AddToSelf(Vector_Center);

            RetVal.LstVec_Points.push(offset);
        }
    }
    else{
        for(var loop = 0; loop < Num_Points; loop++){
            var offset = Vector_GetNormal(min + (((max - min) / (Num_Points - 1)) * loop));
            offset.MultiplySelf(Num_Radius);
            offset.AddToSelf(Vector_Center);

            RetVal.LstVec_Points.push(offset);
        }
        var last = new Vector2D();
        last.Assign(Vector_Center);
        RetVal.LstVec_Points.push(last);
    }
    RetVal.Init();

    return RetVal;
}