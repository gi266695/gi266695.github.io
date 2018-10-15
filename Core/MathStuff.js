//Appearently Javascript does not have a Matrix withought encorperating some overkill math library
//SVGMatrix exists but appearently it is depricated and can't even be created withought a document object
//DOMMatrix is suposed to replace SVGMatrix but few support it
//And so, here we are

//3x3 matrix for 2D transforms
//[[m00, m01, m02]
// [m10, m11, m12]
// [0, 0, 1]]
class Matrix3X3 {
    constructor(){
        this.SetToIdentity();
    }
    /** @param {Matrix3X3} other */
    Assign(other){
        if(other == null){
            return;
        }
        this.m00 = other.m00;
        this.m01 = other.m01;
        this.m02 = other.m02;
        this.m10 = other.m10;
        this.m11 = other.m11;
        this.m12 = other.m12;
    }
    SetToIdentity(){
        this.m00 = 1;
        this.m01 = 0;
        this.m02 = 0;
        this.m10 = 0;
        this.m11 = 1;
        this.m12 = 0;
    }   
    /**  @param {Matrix3X3} other */
    MultiplyMatrix(other){
        if(other == null){
            return;
        }
        Matrix_TempMultiply.Assign(this);

        this.m00 = (Matrix_TempMultiply.m00 * other.m00) + (Matrix_TempMultiply.m01 * other.m10)
        this.m01 = (Matrix_TempMultiply.m00 * other.m01) + (Matrix_TempMultiply.m01 * other.m11)
        this.m02 = (Matrix_TempMultiply.m00 * other.m02) + (Matrix_TempMultiply.m01 * other.m12) + Matrix_TempMultiply.m02

        this.m10 = (Matrix_TempMultiply.m10 * other.m00) + (Matrix_TempMultiply.m11 * other.m10)
        this.m11 = (Matrix_TempMultiply.m10 * other.m01) + (Matrix_TempMultiply.m11 * other.m11)
        this.m12 = (Matrix_TempMultiply.m10 * other.m02) + (Matrix_TempMultiply.m11 * other.m12) + Matrix_TempMultiply.m12;
    }
    /**
     * 
     * @param {Vector2D} vector 
     */
    Vector_MultiplyVector(vector){
        if(vector == null){
            return;
        }
        var retVal = new Vector2D();
        retVal.x = (vector.x * this.m00) + (vector.y * this.m01) + this.m02;
        retVal.y = (vector.x * this.m10) + (vector.y * this.m11) + this.m12;
    
        return retVal;
    }
    /** 
     * @param {Number} X
     * @param {Number} Y 
    */
    SetToTranslation(X, Y){
        this.SetToIdentity();
        this.m02 = X;
        this.m12 = Y;
    }
    /** 
     * @param {Number} X
     * @param {Number} Y 
    */
    TranslateSelf(X, Y){
        Matrix_Temp.SetToTranslation(X, Y);
        this.MultiplyMatrix(Matrix_Temp);
    }
    /** 
     * @param {Radians} X
    */
    SetToRotation(Radians){
        this.SetToIdentity();

        this.m00 = Math.cos(Radians);
        this.m01 = Math.sin(Radians);
        this.m10 = -this.m01;
        this.m11 = this.m00;
    }
    /** 
     * @param {Radians} X
    */
    RotateSelf(Radians){
        Matrix_Temp.SetToRotation(Radians);
        this.MultiplyMatrix(Matrix_Temp);
    }
    /** 
     * @param {Number} X
     * @param {Number} Y 
    */
    SetToScale(X, Y){
        this.SetToIdentity();

        this.m00 = X;
        this.m11 = Y;
    }
    /** 
     * @param {Number} X
     * @param {Number} Y 
    */
    ScaleSelf(X, Y){
        Matrix_Temp.SetToScale(X, Y);
        this.MultiplyMatrix(Matrix_Temp);
    }

    /*Bool_IsIdentity(){
        return this.m00 == 1 && this.m01 == 0 && this.m02 == 0
                && this.m00 == 0 && this.m01 == 1 && this.m02 == 0
    }*/

    /**
     * @param {Vector2D} other 
     */
    bool_isEqual(other){
        if(this == other){
            return true;
        }
        if(other == null){
            return false;
        }
        return this.m00 == other.m00
                && this.m01 == other.m01
                && this.m02 == other.m02
                && this.m10 == other.m10
                && this.m11 == other.m11
                && this.m12 == other.m12;
    }

    Matrix_GetInverse(){
        //[[m00, m01, m02]
        // [m10, m11, m12]
        // [0, 0, 1]]
        // \+
        // /-
        //https://www.mathsisfun.com/algebra/matrix-inverse-minors-cofactors-adjugate.html

        var Determinant = (this.m00 * this.m11)
                            - (this.m01 * this.m10);

        if(Determinant == 0){
            return null;
        }
                  
        var RetVal = new Matrix3X3();

        //Adjugate
        RetVal.m00 = this.m11 / Determinant;
        RetVal.m10 = -this.m10 / Determinant;
        //var b_m20 = ((this.m10 * 0) - (this.m11 * 0)) / Determinant;

        RetVal.m01 = -this.m01 / Determinant;
        RetVal.m11 = this.m00 / Determinant;
        //var b_m21 = -((this.m00 * 0) - (this.m01 * 0)) / Determinant;

        RetVal.m02 = ((this.m01 * this.m12) - (this.m02 * this.m11)) / Determinant;
        RetVal.m12 = -((this.m00 * this.m12) - (this.m02 * this.m10)) / Determinant;
        //var b_m22 = ((this.m00 * this.m11) - (this.m01 * this.m10)) / Determinant;

        //var Test = new Matrix3X3();
        //Test.Assign(this);
        //Test.MultiplyMatrix(RetVal);

        return RetVal;
        
    }
    /** @param {CanvasRenderingContext2D} context2D */
    SetContextTransform(context2D){
        context2D.setTransform(this.m00,
                                this.m10,
                                this.m01,
                                this.m11,
                                this.m02,
                                this.m12);
    }
}
//some function here need to create temp matrix to multiply. this prevents extra news
var Matrix_Temp = new Matrix3X3();
var Matrix_TempMultiply = new Matrix3X3();

//-----------------------------------------------------------------------------
//Vector2D

//[x]
//[y]
//[1] : Z exists for matrix multiplication. otherwise it does not exist
class Vector2D{
    constructor(x = 0.0, y = 0.0){
        this.x = x;
        this.y = y;
    }
    /** @param {Vector2D} other */
    Assign(other){
        if(other == null){
            return;
        }
        this.x = other.x;
        this.y = other.y;
    }
    SetToZero(){
        this.x = 0;
        this.y = 0;
    }
    Normalize(){
        var Length = this.Num_GetLength();
        if(Length == 0){
            return;
        }
        this.x /= Length;
        this.y /= Length;
    }
    /** @param {Vector2D} other */
    AddToSelf(other){
        if(other == null){
            return;
        }
        this.x += other.x;
        this.y += other.y;
    }
    /** @param {Vector2D} other */
    SubtractFromSelf(other){
        if(other == null){
            return;
        }
        this.x -= other.x;
        this.y -= other.y;
    }
    MultiplySelf(Num_Amount){
        this.x *= Num_Amount;
        this.y *= Num_Amount;
    }
    ReverseXY(){
        var temp = this.x;
        this.x = this.y;
        this.y = temp;
    }
    Num_GetLength(){
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
    Num_GetManhattan(){
        return Math.abs(this.x) + Math.abs(this.y);
    }
    Num_GetRadians(){
        var self = this;
        if(self.Num_GetLength() != 1){
            self = new Vector2D();
            self.Assign(this);
            self.Normalize();
        }
        var RetVal = -Math.acos(self.x);
        if(self.y < 0){
            RetVal = (Math.PI - RetVal) + Math.PI;
        }

        return RetVal;
    }
    /**
     * @param {Vector2D} other 
     */
    bool_isEqual(other){
        if(this == other){
            return true;
        }
        if(other == null){
            return false;
        }
        return this.x == other.x && this.y == other.y;
    }
    /**
     * @param {string} rootPath
     * @param {Object} JSONObject 
     */
    bool_LoadFromFileData(rootPath, JSONObject){
        if(typeof JSONObject !== "object" || JSONObject == null){                   
            return false;   
        }
        /*
         {
             "x": 5,
             "y": 5
         } 
        */
        this.SetToZero();
        if(typeof JSONObject.x === 'number'){
            this.x = JSONObject.x;
        }
        if(typeof JSONObject.y === 'number'){
            this.y = JSONObject.y;
        }
        return true;
    }
}
var Vector_Zero = new Vector2D(0,0);

/**
 * @param {Vector2D} a 
 * @param {Vector2D} b 
 */
function Num_DotProduct(a, b){
    if(a == null || b == null){
        return;
    }
    return (a.x * b.x) + (a.y * b.y);
}

/**
 * return a unit vetcor in the direction given
 * @param {number} Num_Radians 
 */
function Vector_GetNormal(Num_Radians){
    var RetVal = new Vector2D();
    RetVal.x = Math.cos(Num_Radians);
    RetVal.y = -Math.sin(Num_Radians);
    return RetVal;
}

function Num_Clamp(Num, min, max){
    if(Num < min){
        return min;
    }
    else if(Num > max){
        return max;
    }
    return Num;
}
function Num_ClampRadians(Num){
    var Tau = Math.PI * 2;
    if(Num > Tau){
        return Num - (Tau* Math.trunc(Num / Tau))
    }
    if(Num < 0){
        if(Num < -Tau){
            Num = -Num_ClampRadians(-Num);
        }
        return Tau + Num;
    }
    return Num;
}

/**
 * returns true if the line Segment defined by (a1, a2) intersects the line segment defined by (b1, b2)
 * @param {Vector2D} a1 
 * @param {Vector2D} a2 
 * @param {Vector2D} b1 
 * @param {Vector2D} b2 
 */
function Bool_DoesLineIntersect(a1, a2, b1, b2){
    if(a1 == null
            || a2 == null
            || b1 == null
            || b2 == null){
        return false;
    }
    
    //(a1, a2) -> ax + c = y
    //(b1, b2) -> bx + d = y
    //x = (d - c)/(a - b)
    //Profit

    if(a2.x != a1.x){
        var a = (a2.y - a1.y) / (a2.x - a1.x);
        var c = a1.y - (a * a1.x);

        if(b2.x != b1.x){
            var b = (b2.y - b1.y) / (b2.x - b1.x);
            var d = b1.y - (b * b1.x);

            //parellel?
            if(a == b){
                //diffenrent lines
                if(c != d){
                    return false;
                }
                //same line do they overlap
                return Bool_IsPointBetween(a1, a2, b1) ||  Bool_IsPointBetween(a1, a2, b2);
            }
        }
    }
    //a and b are vertical (parellel)
    else if(b2.x == b1.x){
        //diffenrent lines
        if(a1.x != b1.x){
            return false;
        }
        //same line do they overlap
        return Bool_IsPointBetween(a1, a2, b1) || Bool_IsPointBetween(a1, a2, b2);
    }

    var intersect = Vector_GetIntersection(a1, a2, b1, b2);

    //they do intersect if intersect is beween (a1, a2) and (b1, b2) 
    return Bool_IsPointBetween(a1, a2, intersect) && Bool_IsPointBetween(b1, b2, intersect);
}
/**
 * given the lines (a1, a2) and (b1, b2) returns the point they intersect. otherwise returns null
 * @param {Vector2D} a1 
 * @param {Vector2D} a2 
 * @param {Vector2D} b1 
 * @param {Vector2D} b2 
 */
function Vector_GetIntersection(a1, a2, b1, b2){
    if(a1 == null
            || a2 == null
            || b1 == null
            || b2 == null){
        return null;
    }
    //no line for a
    if(a1.x == a2.x && a1.y == a2.y){
        return null;
    }
    //no line for b
    if(b1.x == b2.x && b1.y == b2.y){
        return null;
    }

    //(a1, a2) -> ax + c = y
    //(b1, b2) -> bx + d = y
    //x = (d - c)/(a - b)
    //Profit
    var RetVal = new Vector2D();

    //a is vertical
    if(a1.x == a2.x){
        //b is vertical
        if(b1.x == b2.x){
            return null;
        }
        //b is horizontal
        else if(b1.y == b2.y){
            RetVal.x = a1.x;
            RetVal.y = b1.y;
        }
        //b is diagonal
        else{
            var b = (b2.y - b1.y) / (b2.x - b1.x);
            var d = b1.y - (b * b1.x);

            RetVal.x = a1.x;
            RetVal.y = (b * RetVal.x) + d;
        }
    }
    //a is horizontal
    else if(a1.y == a2.y){
        //b is vertical
        if(b1.x == b2.x){
            RetVal.x = b1.x;
            RetVal.y = a1.y; 
        }
        //b is horizontal
        else if(b1.y == b2.y){
            return null;
        }
        //b is diagonal
        else{
            var b = (b2.y - b1.y) / (b2.x - b1.x);
            var d = b1.y - (b * b1.x);

            RetVal.y = a1.y;
            RetVal.x = (RetVal.y - d) / b;
        }
    }
    //a is diagonal
    else{
        var a = (a2.y - a1.y) / (a2.x - a1.x);
        var c = a1.y - (a * a1.x);

        //b is vertical
        if(b1.x == b2.x){
            RetVal.x = b1.x;
            RetVal.y = (a * RetVal.x) + c;
        }
        //b is horizontal
        else if(b1.y == b2.y){
            RetVal.y = b1.y;
            RetVal.x = (RetVal.y - c) / a;
        }
        //b is diagonal
        else{
            var b = (b2.y - b1.y) / (b2.x - b1.x);
            var d = b1.y - (b * b1.x);

            RetVal.x = (d - c) / (a - b);
            RetVal.y = (a * RetVal.x) + c;
        }
    }

    //if retVal is in both segments then return it. otherwise null
    if(Bool_IsPointBetween(a1, a2, RetVal) && Bool_IsPointBetween(b1, b2, RetVal)){
        return RetVal;
    }
    return null;
}

/**
 * returns true if c is between a and b, (it is assumed that a, b, and c are on the same line)
 * @param {Vector2D} a 
 * @param {Vector2D} b 
 * @param {Vector2D} c 
 */
function Bool_IsPointBetween(a, b, c){
    if(a == null
            || b == null
            || c == null){
        return false;
    }
    var MinX = Math.min(a.x, b.x);
    var MinY = Math.min(a.y, b.y);
    var MaxX = Math.max(a.x, b.x);
    var MaxY = Math.max(a.y, b.y);

    return MinX <= c.x && MaxX >= c.x && MinY <= c.y && MaxY >= c.y;
}
/**
 * return true if test1 is on the same side of the line defined by (a1, a2) as test2, if either are on the line then this will return true
 * @param {Vector2D} a1 
 * @param {Vector2D} a2 
 * @param {Vector2D} test1 
 * @param {Vector2D} test2 
 */
function bool_IsOnSameSide(a1, a2, test1, test2){
    if(a1 == null
            || a2 == null
            || test1 == null
            || test2 == null){
        return false;
    }
    //a is vertical
    if(a2.x == a1.x){
        return (bool_SameSign(test1.x - a1.x) == bool_SameSign(test2.x - a1.x));
    }
    //a is vertical
    if(a2.y == a1.y){
        return (bool_SameSign(test1.y - a1.y) == bool_SameSign(test2.y - a1.y));
    }
     //(a1, a2) -> ax + c = y -> (y - c) / a = x
     var a = (a2.y - a1.y) / (a2.x - a1.x);
     var c = a1.y - (a * a1.x);

     return bool_SameSign((test1.y - ((a * test1.x) + c)), (test2.y - ((a * test2.x) + c)))
            && bool_SameSign((test1.x - ((test1.y - c) / a)), (test2.x - ((test2.y - c) / a)));
}
/**
 * returns true if a has the same sign as b. if either a or b are 0 this returns true
 * @param {Number} a 
 * @param {Number} b 
 */
function bool_SameSign(a, b){
    return (a == 0) || (b == 0) || (a > 0 == b > 0); 
}