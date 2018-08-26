Enum_TurretStates = {
    TURRET_UNINITIALIZED: -1,
    TURRET_IDLE: 0,
    TURRET_AGRO: 1,
    TURRET_TARGET_LOST: 2,
    TURRET_FIRE_START: 3,
    TURRET_FIRE_END: 4
};
SimpleTurret_SpritePath = "Data/Structures/Splash/testTurret_Sprite.json";
SimpleTurret_TurnSpeed = (Math.PI / 5);
class SimpleTurret extends GameObject{
    constructor(){
        super(SimpleTurret_SpritePath);
        this.Enum_State = Enum_TurretStates.TURRET_UNINITIALIZED;
        this.Num_TurretRotation = 0;

        this.Sprite_Turret = null;

        this.Str_BlocksShots = "map";
        this.Str_BlocksMovement = "map";
        this.Str_Visible = "map";

        this.Enum_DefualtPriority = Enum_ObjectPriorities.PRIORITY_OBJECT_ENEMY_SMALL;

        this.Enum_Type = Enum_GameObjectType.TYPE_UNIT;
        this.Enum_Team = Enum_GameObjectTeam.TEAM_ENEMY_1;

        this.Bool_ClockWise = true;

        this.Obj_AgroTarget = null;
        this.Num_StateTimer = 0;

        this.BaseTick = super.Tick
    }
    static LstStr_GetDependecies(){
        return [
            SimpleTurret_SpritePath
        ];
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        this.BaseTick(coreData, DeltaTime);

        this.Num_StateTimer += DeltaTime;

        switch(this.Enum_State){
        case Enum_TurretStates.TURRET_UNINITIALIZED:
            if(this.Sprite != null){
                this.Sprite_Turret = this.Sprite.Sprite_GetSprite("Turret");
            
                this.UpdateTurretPosition();
                
                this.SetState(Enum_TurretStates.TURRET_IDLE);
            }
            break;

        case Enum_TurretStates.TURRET_IDLE:
            this.Num_TurretRotation += ((this.Bool_ClockWise ? -SimpleTurret_TurnSpeed : SimpleTurret_TurnSpeed) * DeltaTime);        
            this.UpdateTurretPosition();

            //fall though is deliberate
        case Enum_TurretStates.TURRET_TARGET_LOST:
            var Lst_Targets = Lst_GetAgroTargets(this.Layer.Lst_ActiveLevels,
                                                            this,
                                                            this.LstBoxes_GetHitBoxesInLocalSpace("vision"),
                                                             (Obj, Lst_Boxes) => {return Obj != null && this.Bool_DoesObjAgroThis(Obj) && Bool_HasLineOfSite(this.Layer.Lst_ActiveLevels, this.Vector_Center, Lst_Boxes, [this, Obj]);});
            
            if(Lst_Targets != null){
                var Target = null;
                var SmallestDifference = null;
                var DirectionVector = new Vector2D();

                Lst_Targets.forEach((possibleTarget) => {
                    DirectionVector.Assign(possibleTarget.Vector_Center);
                    DirectionVector.SubtractFromSelf(this.Vector_Center);
                    var Direction = DirectionVector.Num_GetRadians();
                    Direction = Math.abs(Direction, Direction - this.Num_TurretRotation);
                    
                    if(Target == null || SmallestDifference < Direction){
                        Target = possibleTarget;
                        SmallestDifference = Direction;
                    }
                });
                if(Target != null){
                    this.Obj_AgroTarget = Target;
                    this.SetState(Enum_TurretStates.TURRET_AGRO);
                    return;
                }
            }
            if(this.Enum_State == Enum_TurretStates.TURRET_TARGET_LOST
                     && this.Num_StateTimer >= 5){

                this.SetState(Enum_TurretStates.TURRET_IDLE);
                return;
            }

            break;

        case Enum_TurretStates.TURRET_AGRO:
        case Enum_TurretStates.TURRET_FIRE_START:
        case Enum_TurretStates.TURRET_FIRE_END:
            {
                //fire shot if animation is ready
                if(this.Enum_State == Enum_TurretStates.TURRET_FIRE_START
                            && this.Sprite_Turret.Num_GetAnimationPercent() >= (5/12)){
                   
                    this.SetState(Enum_TurretStates.TURRET_FIRE_END);
                }
                //go bact to Agro state after cool down
                if(this.Enum_State == Enum_TurretStates.TURRET_FIRE_END
                        && this.Sprite_Turret.Num_GetAnimationPercent() >= 1){
                
                    this.Sprite_Turret.SetAnimation("idle");
                    this.SetState(Enum_TurretStates.TURRET_AGRO);
                }
                //we can not go back to idle if shooting
                var Bool_CanLeaveState = this.Enum_State == Enum_TurretStates.TURRET_AGRO;

                //if target spntanioslly disapeared go back to idle
                if(this.Obj_AgroTarget == null
                        || this.Obj_AgroTarget.Layer == null 
                        || this.Obj_AgroTarget == this){

                    if(Bool_CanLeaveState){
                        this.SetState(Enum_TurretStates.TURRET_TARGET_LOST);
                    }
                    return;
                }
                //make sre we can still see the target
                var Lst_Vision = this.LstBoxes_GetHitBoxesInLocalSpace("vision");
                var Lst_Visible = this.Obj_AgroTarget.LstBoxes_GetHitBoxesInLocalSpace(this.Obj_AgroTarget.Str_BlocksVision);
                if(!Bool_AreAnyColliding(Lst_Vision, Lst_Visible)){
                    if(Bool_CanLeaveState){
                        this.SetState(Enum_TurretStates.TURRET_TARGET_LOST);
                    }
                    return;
                }
                if(!Bool_HasLineOfSite(this.Layer.Lst_ActiveLevels, this.Vector_Center, Lst_Visible, [this, this.Obj_AgroTarget])){
                    if(Bool_CanLeaveState){
                        this.SetState(Enum_TurretStates.TURRET_TARGET_LOST);
                    }
                    return;
                }
                //calculate direction to target
                var DirectionVector = new Vector2D();
                DirectionVector.Assign(this.Obj_AgroTarget.Vector_Center);
                DirectionVector.SubtractFromSelf(this.Vector_Center);
                var Direction = DirectionVector.Num_GetRadians();
                var test1 = Num_ClampRadians(Direction);
                var test2 = Num_ClampRadians(this.Num_TurretRotation);

                var RotateAmount = Num_ClampRadians(Direction) - Num_ClampRadians(this.Num_TurretRotation);
                if(RotateAmount >= Math.PI){
                    RotateAmount = Math.PI - RotateAmount;
                }
                if(RotateAmount <= -Math.PI){
                    RotateAmount = Math.PI + RotateAmount;
                }

                //turn in that direction
                this.Num_TurretRotation += Num_Clamp(RotateAmount, (SimpleTurret_TurnSpeed * -DeltaTime), (SimpleTurret_TurnSpeed * DeltaTime));        
                this.UpdateTurretPosition();

                if(!Bool_HasShot(this.Layer.Lst_ActiveLevels, this.Vector_Center, this.Obj_AgroTarget.LstBoxes_GetHitBoxesInLocalSpace(this.Obj_AgroTarget.Str_BlocksShots), [this, this.Obj_AgroTarget])){
                    return;
                }

                //if we are close enough start shooting if we are not already
                if(Math.abs(RotateAmount) <= (Math.PI / 10) && this.Enum_State == Enum_TurretStates.TURRET_AGRO){
                    this.SetState(Enum_TurretStates.TURRET_FIRE_START);

                }
            }
            break;
        }
        this.UpdateMapTiles();
    }
    bool_LoadFromFileData(jsonObject){
        if(!super.bool_LoadFromFileData(jsonObject)){
            return false;
        }
        /**
        {
            "ClockWise": true,
        } 
        */
        if(typeof jsonObject.ClockWise === 'boolean'){
            this.Bool_ClockWise = jsonObject.ClockWise;
        }
        return true;
    }
    TakeDamage(){
        //TODO health damage
        this.RemoveSelfFromLayer();
    }
    /**
     * @param {number} Enum_NewState 
     */
    SetState(Enum_NewState){
        this.Enum_State = Enum_NewState;
        this.Num_StateTimer = 0;

        switch(this.Enum_State){
            case Enum_TurretStates.TURRET_IDLE:
                this.Obj_AgroTarget = null;
                break; 

            case Enum_TurretStates.TURRET_FIRE_START:
                this.Sprite_Turret.SetAnimation("Shoot");
                break;

            case Enum_TurretStates.TURRET_FIRE_END:
            {
                var SpawnTransform = this.Sprite.Matrix_GetTransform("BulletSpawn", this.Matrix_GetTransform());
                if(SpawnTransform != null){
                    var Center = new Vector2D();
                    Center = SpawnTransform.Vector_MultiplyVector(Center);

                    var newBullet = new SimpleBullet(Center, this.Num_TurretRotation, this);
                    this.Layer.AddInstance(newBullet, newBullet.Enum_DefualtPriority);
                }
            }
                break;
        }
    }
    UpdateTurretPosition(){
        if(this.Sprite_Turret != null){
            this.Sprite_Turret.ResetTramsform();
            this.Sprite_Turret.LocalTransform.RotateSelf(this.Num_TurretRotation);
        }
    }
}