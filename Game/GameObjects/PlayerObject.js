Enum_PlayerState = {
    PLAYER_IDLE: 0,
    PLAYER_FIRE_INTRO: 1,
    PLAYER_FIRE_OUTRO: 2
};
PlayerObject_SpritePath = "Data/Structures/Splash/testPlayer_Sprite.json";

class PlayerObject extends GameObject{
    constructor(){
        super(PlayerObject_SpritePath);

        this.Vector_LastCameraPosition = null;

        this.Str_BlocksShots = "map";
        this.Str_BlocksVision = "map";
        this.Str_BlocksMovement = "map";
        this.Str_Visible = "map";

        this.Enum_DefualtPriority = Enum_ObjectPriorities.PRIORITY_OBJECT_ENEMY_SMALL;

        this.Enum_Type = Enum_GameObjectType.TYPE_UNIT;
        this.Enum_Team = Enum_GameObjectTeam.TEAM_PLAYER;
    
        this.m_State = Enum_PlayerState.PLAYER_IDLE;
    }
    static LstStr_GetDependecies(){
        return [
            PlayerObject_SpritePath
        ];
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        super.Tick(coreData, DeltaTime);
        
        if(this.Sprite != null && this.Layer != null){
            var Temp = new Vector2D();

            //point
            Temp.Assign(coreData.InputManager.Vector_LastMousePosition);
            Temp.SubtractFromSelf(this.Layer.Matrix_GetTransform().Vector_MultiplyVector(this.Vector_Center));
            Temp.Normalize();
            this.Rotation = Temp.Num_GetRadians();

            //up
            Temp.SetToZero();
            if(coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_ARROW_UP)
                    || coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_W)){
                    
                Temp.y -= 1;
            }
            //down
            if(coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_ARROW_DOWN)
                    || coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_S)){
                    
                Temp.y += 1;
            }
            //left
            if(coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_ARROW_LEFT)
                    || coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_A)){
                    
                Temp.x -= 1;
            }
            //right
            if(coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_ARROW_RIGHT)
                    || coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_D)){
                    
                Temp.x += 1;
            }
            Temp.Normalize();
            Temp.MultiplySelf(2.5 * DeltaTime);

            this.Vector_Center.AddToSelf(Temp);

            //recenter
            if(coreData.InputManager.Set_KeyboardButtonsDown.has(Enum_KeyboardButtons.BUTTON_ENTER)){
                this.Vector_Center.x = 5;
                this.Vector_Center.y = 5;
            }

            //manage Camera
            if(this.Vector_LastCameraPosition == null){
                this.Vector_LastCameraPosition = new Vector2D();
            }
            this.Vector_LastCameraPosition.Assign(this.Vector_Center);
            this.Layer.SetCamera(this.Vector_LastCameraPosition, 1);

            //handle collision
            if(this.Layer != null
                    && Array.isArray(this.Layer.Lst_ActiveLevels)
                    && this.Layer.Lst_ActiveLevels.length > 0){

                var Solution = Vector_GetMapCollisionSolution(this.Layer.Lst_ActiveLevels, this.LstBoxes_GetHitBoxesInLocalSpace("Map"), this);
                if(Solution != null){
                    this.Vector_Center.AddToSelf(Solution);
                }
            }
            coreData.AudioManager.Vector_ListenerPosition =  this.Vector_Center;
            this.UpdateMapInforation();

            var Bool_bClicked = false;
            if(coreData.InputManager.Set_MouseButtonsDown.has(Enum_MouseButtons.LEFT_MOUSE_BUTTON)
                    || coreData.InputManager.Set_MouseButtonsDown.has(Enum_MouseButtons.RIGHT_MOUSE_BUTTON)){
                
                Bool_bClicked = true;
            }
            if(!Bool_bClicked){
                for(var loop = 0; loop < coreData.InputManager.Lst_CurrentTickInputs.length; loop++){
                    var current = coreData.InputManager.Lst_CurrentTickInputs[loop];
                    if(current.Bool_ButtonDown
                            && (current.Bool_ButtonDown.Enum_MouseInput == Enum_MouseButtons.LEFT_MOUSE_BUTTON)
                                || current.Bool_ButtonDown.Enum_MouseInput == Enum_MouseButtons.RIGHT_MOUSE_BUTTON){
                        
                        Bool_bClicked = true;
                    }
                }
            }

            switch(this.m_State){
                case Enum_PlayerState.PLAYER_IDLE:
                    if(Bool_bClicked){   
                        this.Sprite.SetAnimation("Shoot");
                        this.m_State = Enum_PlayerState.PLAYER_FIRE_INTRO;
                        return;
                    }
                    break;
                case Enum_PlayerState.PLAYER_FIRE_INTRO:
                    if(this.Sprite.Num_GetAnimationPercent() >= (5/12)){
                        var SpawnTransform = this.Sprite.Matrix_GetTransform("BulletSpawn", this.Matrix_GetTransform());
                        if(SpawnTransform != null){
                            var Center = new Vector2D();
                            Center = SpawnTransform.Vector_MultiplyVector(Center);

                            var newBullet = new SimpleBullet(Center, this.Rotation, this);
                            this.Layer.AddInstance(newBullet, newBullet.Enum_DefualtPriority);
                        }
                        this.m_State = Enum_PlayerState.PLAYER_FIRE_OUTRO;
                        return;
                    }
                    break;
                case Enum_PlayerState.PLAYER_FIRE_OUTRO:
                    if(this.Sprite.Num_GetAnimationPercent() >= 1){
                        this.m_State = Enum_PlayerState.PLAYER_IDLE;
                        return;
                    }
                    break;
            }
        }
    }
    /**
     * @param {Matrix3X3} ParentTranform 
     * @param {CoreData} coreData 
     * @param {Number} ParentAlpha 
     */
    Draw(coreData, ParentTranform, ParentAlpha){
        super.Draw(coreData, ParentTranform, ParentAlpha);

        var Vetor_End = Vector_GetNormal(this.Rotation);
        Vetor_End.MultiplySelf(20);
        Vetor_End.AddToSelf(this.Vector_Center);

        Vetor_End = Vector_BulletInpactPoint(this.Layer.Lst_ActiveLevels, this.Vector_Center, Vetor_End, [this]);

        //TODO: use sprite for guide line
        var context = coreData.GetContext2D();
        if(ParentTranform != null){
            ParentTranform.SetContextTransform(context);
        }
        context.beginPath();

        context.moveTo(this.Vector_Center.x, this.Vector_Center.y);
        context.lineTo(Vetor_End.x, Vetor_End.y);

        context.strokeStyle = "#ffff00";
        context.lineWidth = 0.02;
        context.stroke();
    }
    TakeDamage(){
        //TODO health damage
        this.RemoveSelfFromLayer();
    }
}