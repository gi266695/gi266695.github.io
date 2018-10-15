/**
 * Manages the cookie that stores save game data
 */
class GameSave {
    constructor(){
        this.Clear();
    }
    Clear(){
        /** [number]PlayerSave  */
        this.Dct_PlayerSaves = {};
        this.Num_SelectedPlayerID = null;

        this.Bool_FlagNeedsSave = false;
        this.Str_Name = null;
    }
    /**
     * @param {CoreData} coreData 
     */
    FirstInit(coreData, Str_Name){
        if(coreData == null
                || coreData.DocumentObj == null
                || Str_Name == null){
            return;
        }
        if(coreData.GameSave != this){
            coreData.GameSave = this;
        }
        var Obj_Json = null;
        try{
            var Str_Json = coreData.Str_GetCookie(Str_Name);
            if(Str_Json.length > 1){
                Obj_Json = JSON.parse(Str_Json);
            }
        }
        catch(exception){
            console.log("GameSave.FirstInit(): Exception [" + exception + "] getting cookie [" + this.Str_Name + "]" );
        }

        this.LoadFromJsom(Obj_Json);
        this.Str_Name = Str_Name;

        console.log("GameSave.FirstInit(): loaded from cookie [" + this.Str_Name + "]" );
    }
    /**
     * @param {CoreData} coreData 
     */
    SaveIfNeeded(coreData){
        if(coreData == null
                || coreData.DocumentObj == null
                || this.Str_Name == null
                || !this.Bool_NeedsSave()){
            return;
        }
        try{
            coreData.SetCookie(this.Str_Name, JSON.stringify(this.Obj_GetJsonObject()), 720);
            this.ClearSaveFlags();

            console.log("GameSave.SaveIfNeeded(): cookie [" + this.Str_Name + "] updated");
        }
        catch(exception) {
            console.log("GameSave.SaveIfNeeded(): Exception [" + exception + "] saving cookie [" + this.Str_Name + "]" );
        }
    }
    /**
     * @param {object} Obj_JSON 
     */
    LoadFromJsom(Obj_JSON){
        this.Clear();
        if(Obj_JSON == null || typeof Obj_JSON !== 'object'){
            return;
        }
        if(Array.isArray(Obj_JSON.Dct_PlayerSaves)){
            Obj_JSON.Dct_PlayerSaves.forEach(element => {
                var newSave = new PlayerSave();
                if(newSave.bool_LoadFromJsom(element)){
                    this.Dct_PlayerSaves[newSave.Num_ID] = newSave;
                }
            });
        }
        if(typeof Obj_JSON.Num_SelectedPlayerID === 'number'
                 && this.PlayerSave_GetPlayer(Obj_JSON.Num_SelectedPlayerID) != null){
            
            this.Num_SelectedPlayerID = Obj_JSON.Num_SelectedPlayerID;
        }
    }
    Obj_GetJsonObject(){
        var RetVal = {};

        RetVal.Dct_PlayerSaves = [];
        for(var Num_Id in this.Dct_PlayerSaves){
            var playerObj = this.Dct_PlayerSaves[Num_Id].Obj_GetJsonObject();
            if(playerObj != null){
                RetVal.Dct_PlayerSaves.push(playerObj);
            }
        }
        RetVal.Num_SelectedPlayerID = this.Num_SelectedPlayerID;

        return RetVal;
    }
    /**
     * @param {number} Num_ID 
     */
    SetSelectedPlayer(Num_ID){
        if(this.PlayerSave_GetPlayer(Num_ID) != null && this.Num_SelectedPlayerID != Num_ID){
            this.Num_SelectedPlayerID = Num_ID;
            this.Bool_FlagNeedsSave = true;
        }
    }
    Num_GetSelectedPlayerID(){
        return this.Num_SelectedPlayerID;
    }
    PlayerSave_GetSelectedPlayer(){
        return this.PlayerSave_GetPlayer(this.Num_SelectedPlayerID);
    }
    /**
     * @param {number} Num_ID 
     */
    PlayerSave_GetPlayer(Num_PlayerID){
        if(Num_PlayerID in this.Dct_PlayerSaves){
            return this.Dct_PlayerSaves[Num_PlayerID];
        }
        return null;
    }
    PlayerSave_CreateNewPlayer(){
        var Num_newID = 1;
        for(var Str_Id in this.Dct_PlayerSaves){
            var Num_ID = this.Dct_PlayerSaves[Str_Id].Num_ID;
            if(Num_ID >= Num_newID){
                Num_newID = Num_ID + 1;
            }
        }
        var RetVal = new PlayerSave();
        RetVal.Num_ID = Num_newID;
        RetVal.Bool_FlagNeedsSave = true;

        this.Dct_PlayerSaves[Num_newID] = RetVal;

        return RetVal;
    }
    DeletePlayer(Num_ID){
        if(!this.PlayerSave_GetPlayer(Num_ID)){
            return;
        }
        delete this.Dct_PlayerSaves[Num_ID];
        if(this.Num_SelectedPlayerID == Num_ID){
            this.Num_SelectedPlayerID = -1;
        }
        this.Bool_FlagNeedsSave = true;
    }
    Bool_NeedsSave(){
        if(this.Bool_FlagNeedsSave){
            return true;
        }
        for(var Num_Id in this.Dct_PlayerSaves){
            if(this.Dct_PlayerSaves[Num_Id].Bool_FlagNeedsSave){
                return true;
            }
        }
        return false;
    }
    ClearSaveFlags(){
        this.Bool_FlagNeedsSave = false;
        for(var Num_Id in this.Dct_PlayerSaves){
            this.Dct_PlayerSaves[Num_Id].Bool_FlagNeedsSave = false;
        }
    }
    Str_GetLastCheckPoint_SelectedPlayer(){
        var player = this.PlayerSave_GetSelectedPlayer();
        if(player != null){
            return player.Str_GetLastCheckPoint();
        }
        return null;
    }
    /**
     * @param {string} Str_Name 
     */
    Bool_UsedCheckpoint_SelectedPlayer(Str_Name){
        var player = this.PlayerSave_GetSelectedPlayer();
        if(player != null){
            return player.Bool_UsedCheckpoint(Str_Name);
        }
        return false;
    }
}
class PlayerSave {
    constructor() {
        this.Clear();
    }
    Clear(){
        this.Num_ID = -1;

        this.Str_Name = "New_Player";

        this.Str_LastCheckPoint = null;
        this.Set_UnlockedCheckpoints = new Set();

        this.Bool_FlagNeedsSave = false;
    }
    bool_LoadFromJsom(Obj_JSON){
        if(Obj_JSON == null || typeof Obj_JSON !== 'object'){
            return false;
        }
        if(typeof Obj_JSON.Num_ID !== 'number' || Obj_JSON.Num_ID <= 0){
            return false;
        }
        this.Clear();

        this.Num_ID = Obj_JSON.Num_ID;
        if(typeof Obj_JSON.Str_Name === 'string'){
            this.Str_Name = Obj_JSON.Str_Name;
        }

        if(typeof Obj_JSON.Str_LastCheckPoint === 'string'){
            this.Str_LastCheckPoint = Obj_JSON.Str_LastCheckPoint;
        }
        if(Array.isArray(Obj_JSON.Set_UnlockedCheckpoints)){
            Obj_JSON.Set_UnlockedCheckpoints.forEach(element => {
                if(typeof element === 'string'){
                    this.Set_UnlockedCheckpoints.add(element);
                }
            });
        }
        return true;
    }
    Obj_GetJsonObject(){
        var RetVal = {};
        RetVal.Num_ID = this.Num_ID;
        RetVal.Str_Name = this.Str_Name;

        RetVal.Str_LastCheckPoint = this.Str_LastCheckPoint;
        
        RetVal.Set_UnlockedCheckpoints = [];
        this.Set_UnlockedCheckpoints.forEach((element) => {
            RetVal.Set_UnlockedCheckpoints.push(element);
        });

        return RetVal;
    }
    SetName(Str_Name){
        if(this.Str_Name != Str_Name){
            this.Str_Name = Str_Name;
            this.Bool_FlagNeedsSave = true;
        }
    }
    Str_GetLastCheckPoint(){
        return this.Str_LastCheckPoint;
    }
    /**
     * @param {string} Str_CheckpointName 
     */
    SetCheckpoint(Str_CheckpointName){
        if(this.Str_LastCheckPoint != Str_CheckpointName){
            this.Str_LastCheckPoint = Str_CheckpointName
            this.Set_UnlockedCheckpoints.add(Str_CheckpointName);
        
            this.Bool_FlagNeedsSave = true;
        }
    }
    /**
     * @param {string} Str_Name 
     */
    Bool_UsedCheckpoint(Str_Name){
        if(Str_Name == null){
            return false;
        }
        return this.Set_UnlockedCheckpoints.has(Str_Name);
    }
}
