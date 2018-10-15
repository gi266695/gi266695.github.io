Enum_MiniMapPriorites = {
    PROIORTY_MINIMAP_MAP: 0,
    PROIORTY_MINIMAP_SPAWN: 1,
    PROIORTY_MINIMAP_PLAYER: 2
};

class MiniMapLayer extends GameLayer {
    /**
     * @param {function} Func_OnExit 
     */
    constructor(Func_OnExit){
        super();

        this.Func_OnExit = Func_OnExit;

        this.Bool_SpritesCreated = false;
        this.Bool_Initialized = false;

        this.Num_Scale = 0.6;
        this.Num_PlayerRotation = 0;
        this.Bool_PlayerVisible = false;
        this.Vector_Center = new Vector2D();

        this.Sprite_Player = null;
        this.Str_CurrentCheckpointName = null;
        this.Dct_CheckPointSprites = {};

        this.Button_Exit = null;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){
        super.Tick(coreData, DeltaTime);

        if(!this.Bool_SpritesCreated){
            this.Bool_SpritesCreated = true;

            //load sprites player load
            coreData.AssetLibrary.LoadAssets(["data2/map/minimap_player_sprite.json", "data2/map/minimap_checkpoint_sprite.json"], () => {
                //player
                this.Sprite_Player = coreData.AssetLibrary.SpriteInstance_GetSpriteInstance("data2/map/minimap_player_sprite.json", null);
                if(this.Sprite_Player != null){
                    this.AddInstance(this.Sprite_Player, Enum_MiniMapPriorites.PROIORTY_MINIMAP_PLAYER);
                }
                //check points
                for(var LevelPath in coreData.AssetLibrary.LevelDefs){
                    var levelDef = coreData.AssetLibrary.LevelDefs[LevelPath];
                    levelDef.LstObj_GetCheckpointSpawns().forEach(SpawnObj => {
                        //Not going to add the Checkpoint object but we need it to build itself so we can know its transform
                        var testGameObject = new CheckpointObject();
                        if(testGameObject.bool_LoadFromFileData(levelDef.Vector_Center, SpawnObj)){
                            var PositionTransform = new SpriteInstance();//this will maintain the position. will controll scale and visiblilty through MinimMapCheckpoint
                            var MinimMapCheckpoint = coreData.AssetLibrary.SpriteInstance_GetSpriteInstance("data2/map/minimap_checkpoint_sprite.json", PositionTransform);
                            if(MinimMapCheckpoint != null){
                                PositionTransform.AttachSprite(MinimMapCheckpoint);
                                PositionTransform.LocalTransform.TranslateSelf(testGameObject.Vector_Center.x, testGameObject.Vector_Center.y);
                                this.AddInstance(PositionTransform, Enum_MiniMapPriorites.PROIORTY_MINIMAP_SPAWN);

                                this.Dct_CheckPointSprites[testGameObject.Str_Name] = MinimMapCheckpoint; 
                            }
                        }
                    });
                }
                if(this.Bool_Initialized){
                    this.UpdateCheckPointAnimations(coreData);
                    this.UpdatePlayerState(this.Vector_Center, this.Num_PlayerRotation, this.Bool_PlayerVisible);
                }
                var self = this;

                //adding button after load so it can't be clicked untill after
                //TODO: should probubly do this with a sprite in the layer
                this.Button_Exit = coreData.DocumentObj.createElement('button');
                this.Button_Exit.style.position = 'absolute';
                this.Button_Exit.style.left = 0;
                this.Button_Exit.style.top = 0;
                this.Button_Exit.style.color = 'white';
                this.Button_Exit.style.backgroundColor = 'black';
                this.Button_Exit.style.fontFamily = 'arial';
                this.Button_Exit.style.border = '2px solid #FFFFFF';
                this.Button_Exit.innerHTML = 'EXIT TO TITLE';
                this.Button_Exit.onclick = () => {   
                    if(self.LayerStack != null){             
                        coreData.InputManager.Bool_UsingScrollWheel = false;
                        self.Bool_Initialized = false;
                        self.LayerStack.RemoveLayer(self);
                        if(self.Func_OnExit != null){
                            self.Func_OnExit();
                        }
                        self.Button_Exit.parentNode.removeChild(self.Button_Exit);
                    }
                };
                coreData.RootElement.appendChild(this.Button_Exit);
            });

            //TODO: want to dynamicly reveal rooms
            var LstSprite_toAdd = [];
            for(var LevelPath in coreData.AssetLibrary.LevelDefs){
                coreData.AssetLibrary.LevelDefs[LevelPath].AddRoomMiniMapSprites(LstSprite_toAdd);
            }
            LstSprite_toAdd.forEach(element => {
                this.AddInstance(element, Enum_MiniMapPriorites.PROIORTY_MINIMAP_MAP);
            });
        }      
        if(!this.Bool_Initialized){
            this.Bool_Initialized = true;
            if(this.Button_Exit != null){
                this.Button_Exit.style.visibility = 'visible';
            }

            this.UpdateCheckPointAnimations(coreData);
            this.UpdatePlayerState(this.Vector_Center, this.Num_PlayerRotation, this.Bool_PlayerVisible);
        }
        //zoom in/out
        var Num_ScrollChange = 0;
        coreData.InputManager.Lst_CurrentTickInputs.forEach(input => {
            if(!input.Bool_Blocked){
                Num_ScrollChange += input.Num_MouseWheelMove;
            }
        });
        if(Num_ScrollChange != 0){
            this.Num_Scale += (Num_ScrollChange * DeltaTime * 0.03);
            if(this.Num_Scale < 0.2){
                this.Num_Scale = 0.2;
            }
            else if(this.Num_Scale > 1){
                this.Num_Scale = 1;
            }
            this.UpdatePlayerState(this.Vector_Center, this.Num_PlayerRotation, this.Bool_PlayerVisible);
        }
        if(this.LayerStack != null){
            coreData.InputManager.Bool_UsingScrollWheel = true;

            //close mimimap
            for(var loop = 0; loop < coreData.InputManager.Lst_CurrentTickInputs.length; loop++){
                var input = coreData.InputManager.Lst_CurrentTickInputs[loop];
                if(input.Bool_ButtonDown 
                        && (input.Enum_KeyboardInput == Enum_KeyboardButtons.BUTTON_ESCAPE
                            || input.Enum_KeyboardInput == Enum_KeyboardButtons.BUTTON_F10)){
                    
                    coreData.InputManager.Bool_UsingScrollWheel = false;
                    this.Bool_Initialized = false;
                    if(this.Button_Exit != null){
                        this.Button_Exit.style.visibility = 'hidden';
                    }
                    this.LayerStack.RemoveLayer(this);
                    return;
                }
            }
        }
    }
    /**
     * @param {string} Str_Name 
     */
    SetCurrentCheckpoint(Str_Name){
        this.Str_CurrentCheckpointName = Str_Name;
    }
    /**
     * @param {Vector2D} Vector_Center 
     * @param {number} Num_Rotation 
     * @param {boolean} Bool_PlayerVisible 
     */
    UpdatePlayerState(Vector_Center, Num_Rotation, Bool_PlayerVisible){
        if(Vector_Center != null){
            this.Vector_Center.Assign(Vector_Center);
        }
        if(Num_Rotation != null){
            this.Num_PlayerRotation = Num_Rotation;
        }
        this.Bool_PlayerVisible = Bool_PlayerVisible;
        var Num_IconScale = 1 / this.Num_Scale;
        if(this.Sprite_Player != null){
            this.Sprite_Player.ResetTramsform();
            this.Sprite_Player.LocalTransform.TranslateSelf(this.Vector_Center.x, this.Vector_Center.y);
            this.Sprite_Player.LocalTransform.RotateSelf(this.Num_PlayerRotation);
            this.Sprite_Player.LocalTransform.ScaleSelf(Num_IconScale, Num_IconScale);
            this.Sprite_Player.LocalAlpha = this.Bool_PlayerVisible ? true : false;
        }
        for(var Str_Name in this.Dct_CheckPointSprites){
            var checkPointSprite = this.Dct_CheckPointSprites[Str_Name];
            checkPointSprite.ResetTramsform();
            checkPointSprite.LocalTransform.ScaleSelf(Num_IconScale, Num_IconScale);
        }
        this.SetCamera(this.Vector_Center, this.Num_Scale);
    }
    /**
     * @param {CoreData} coreData 
     */
    UpdateCheckPointAnimations(coreData){
        if(coreData == null){
            return;
        }
        for(var Str_Name in this.Dct_CheckPointSprites){
            var checkPointSprite = this.Dct_CheckPointSprites[Str_Name];
            if(this.Str_CurrentCheckpointName == Str_Name){
                checkPointSprite.SetAnimation("active");
            }
            else if(coreData.GameSave != undefined && !coreData.GameSave.Bool_UsedCheckpoint_SelectedPlayer(Str_Name)){
                checkPointSprite.SetAnimation("off");
            }
            else{
                checkPointSprite.SetAnimation("inactive");
            }
        }
    }
}