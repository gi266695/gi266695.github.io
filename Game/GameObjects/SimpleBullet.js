Enum_BulletStates = {
    BULLET_UNINITIALIZED: -1,
    BULLET_MOVING: 0,
    BULLET_EXPLODING: 1          
};
SimpleBullet_SpritePath = "Data/Structures/Splash/SplashBullet_Sprite.json";
SimpleBullet_MoveSpeed = 5;
class SimpleBullet extends GameObject{
    /**
     * @param {number} Num_RadDirection 
     * @param {Vector2D} Vector_Start 
     * @param {GameObject} Obj_Spawn 
     */
    constructor(Vector_Start, Num_RadDirection, Obj_Spawn){
        super(SimpleBullet_SpritePath);
        this.Str_Visible = null;

        this.Enum_DefualtPriority = Enum_ObjectPriorities.PRIORITY_OBJECT_ENEMY_SMALL;

        this.Enum_Type = Enum_GameObjectType.TYPE_BULLET;
        this.Enum_Team = Enum_GameObjectTeam.TEAM_NUTRAL_PASSIVE;

        this.Enum_State = Enum_BulletStates.BULLET_UNINITIALIZED;
        
        this.Vector_Velosity = Vector_GetNormal(Num_RadDirection);
        this.Vector_Velosity.MultiplySelf(SimpleBullet_MoveSpeed);
        
        this.Vector_Center = Vector_Start;
        this.Rotation = Num_RadDirection;
        this.Enum_Team = Obj_Spawn != null ? Obj_Spawn.Enum_Team : Enum_GameObjectTeam.TEAM_NUTRAL_AGRESSIVE;

        this.SpawnObj = Obj_Spawn;
    }
    static LstStr_GetDependecies(){
        return [
            SimpleBullet_SpritePath
        ];
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        super.Tick(coreData, DeltaTime);
        if(this.Layer == null){
            return;
        }

        switch(this.Enum_State){
            case Enum_BulletStates.BULLET_UNINITIALIZED:
                if(this.Sprite != null){
                    this.SetState(Enum_BulletStates.BULLET_MOVING);
                    this.Tick(coreData, 0);
                }
                break;

            case Enum_BulletStates.BULLET_MOVING:
                var Move = new Vector2D();
                Move.Assign(this.Vector_Velosity);
                Move.MultiplySelf(DeltaTime);
                this.Vector_Center.AddToSelf(Move);
                if(Bool_IsBulletHitting(this.Layer.Lst_ActiveLevels, this, this.LstBoxes_GetHitBoxesInLocalSpace("idleHit"))){
                    this.SetState(Enum_BulletStates.BULLET_EXPLODING);
                    return;
                }
                break;

            case Enum_BulletStates.BULLET_EXPLODING:
                {
                    if(this.Sprite != null && this.Sprite.Num_GetAnimationPercent() >= 1){
                        this.RemoveSelfFromLayer();
                        return;
                    }
                    var DamageTargets = [];
                    Bool_IsBulletHitting(this.Layer.Lst_ActiveLevels, this, this.LstBoxes_GetHitBoxesInLocalSpace("explodeHit"), DamageTargets);
                    DamageTargets.forEach((target) => {
                        target.TakeDamage();
                    });
                }
                break;
        }

        //this.UpdateMapTiles();
    }
    /**
     * @param {GameObject} Obj_Other 
     */
    Bool_DoesBulletHitThis(Obj_Other){
        if(!super.Bool_DoesBulletHitThis(Obj_Other)){
            return false;
        }
        return Obj_Other != this.SpawnObj;
    }

    /**
     * @param {number} Enum_NewState 
     */
    SetState(Enum_NewState){
        this.Enum_State = Enum_NewState;

        switch(this.Enum_State){
            case Enum_BulletStates.BULLET_MOVING: 
                this.Str_Visible = 'IdleHit';
                break;

            case Enum_BulletStates.BULLET_EXPLODING:
                this.Str_Visible = 'ExplodeHit';
                if(this.Sprite != null){
                    this.Sprite.SetAnimation('Explode'); 
                }
                break;
        }
    }
} 