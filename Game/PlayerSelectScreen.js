//This is not a Layer this uses Dom for it's UI
Enum_PlayerSelectScreenState = {
    SCREEN_UNINITIALIZED: -1,
    SCREEN_SELECT_PLAYER: 0,
    SCREEN_CREATE_NEW_PLAYER: 1,
}
class PlayerSelectScreen {
    constructor(){
        this.WindowObj = null;
        this.DocumentObj = null;
        this.RootElement = null;

        this.GameSave = null;

        this.Func_OnClose = null;

        this.Enum_State = Enum_PlayerSelectScreenState.SCREEN_UNINITIALIZED;
        this.Div_ListPanel = null;
        this.DctButton_Saves = {};

        this.Div_MainPanel = null;
        this.p_info = null;
        this.TextInput_Name = null;
        this.Button_Play = null;
        this.Button_CreateNewPlayer = null;
        this.Button_DeletePlayer = null;

    }
    /**
     * @param {CoreData} coreData 
     */
    SetDependencies(coreData){
        if(coreData == null){
            return;
        }
        this.WindowObj = coreData.WindowObj;
        this.DocumentObj = coreData.DocumentObj;
        this.RootElement = coreData.RootElement;

        this.GameSave = coreData.GameSave;
    }
    /**
     * @param {number} Enum_NewState 
     */
    SetState(Enum_NewState){
        if(this.WindowObj == null
                || this.DocumentObj == null
                || this.RootElement == null){
            
            this.Enum_State = Enum_PlayerSelectScreenState.SCREEN_UNINITIALIZED;
            return;
        }
        if(this.Div_ListPanel == null){
            this.Div_ListPanel = this.DocumentObj.createElement('div');
            this.Div_ListPanel.style.position = 'absolute';
            this.Div_ListPanel.style.width = '30%';
            this.Div_ListPanel.style.height = '100%';
            this.Div_ListPanel.style.right = 0;
            this.Div_ListPanel.style.top = 0;
            this.Div_ListPanel.style.zIndex = 2;

            this.RootElement.appendChild(this.Div_ListPanel);

            this.PopulatePlayerList();
        }
        if(this.Div_MainPanel == null){
            this.Div_MainPanel =  this.DocumentObj.createElement('div');
            this.Div_MainPanel.style.position = 'absolute';
            this.Div_MainPanel.style.width = '70%';
            this.Div_MainPanel.style.height = '100%';
            this.Div_MainPanel.style.left = 0;
            this.Div_MainPanel.style.top = 0;
            this.Div_MainPanel.style.zIndex = 2;

            this.RootElement.appendChild(this.Div_MainPanel);

            this.PopulateCenterElement();
        }

        if(this.GameSave != null){
            this.SelectPlayerSave(this.GameSave.Num_GetSelectedPlayerID());
        }
    }
    PopulatePlayerList(){
        if(this.Div_ListPanel == null){
            return;
        }
        this.Div_ListPanel.innerHTML = '';
        this.DctButton_Saves = {};

        if(this.GameSave == null && this.DocumentObj == null){
            return;
        }
        //TODO .css

        var p_Title = document.createElement('p');
        p_Title.innerHTML = 'SAVES<BR>';
        p_Title.style.color = "white";
        p_Title.style.fontFamily = 'arial';
        p_Title.style.fontSize = '140%';
        p_Title.style.textAlign = 'center';
        
        this.Div_ListPanel.appendChild(p_Title);

        var ul_List =  this.DocumentObj.createElement('ul');
        ul_List.style.listStyleType = 'none';
        ul_List.style.margin = 0;
        ul_List.style.padding = 0;
        ul_List.style.overflowY = 'auto'
        
        this.Div_ListPanel.appendChild(ul_List);

        for(var Num_ID in this.GameSave.Dct_PlayerSaves){
            let Save = this.GameSave.Dct_PlayerSaves[Num_ID];
            if(Save != null){
                var li_childRoot =  this.DocumentObj.createElement('li');
                li_childRoot.style.width = '100%';
                li_childRoot.style.padding = 0;
                
                ul_List.appendChild(li_childRoot);

                var Button_Select = this.DocumentObj.createElement('button');
                Button_Select.style.width = '99%';
                Button_Select.style.margin = '1%';
                Button_Select.style.fontFamily = 'arial';
                Button_Select.style.border = '2px solid #FFFFFF';
                Button_Select.style.display = 'block';
                
                var self = this;
                Button_Select.onclick = () => { self.SelectPlayerSave(Save.Num_ID); };

                li_childRoot.appendChild(Button_Select);
                this.DctButton_Saves[Save.Num_ID] = Button_Select;
            }
        }
    }
    PopulateCenterElement(){
        if(this.Div_MainPanel == null){
            return;
        }
        this.Div_MainPanel.innerHTML = '';
        this.p_info = null;
        this.TextInput_Name = null;
        this.Button_Play = null;
        this.Button_CreateNewPlayer = null;

        if(this.GameSave == null && this.DocumentObj == null){
            return;
        }
        var self = this;
        //TODO .css

        var Div_Centered = this.DocumentObj.createElement('div');
        Div_Centered.style.margin = 'auto';
        Div_Centered.style.width = "70%";
        Div_Centered.style.top = '50%';
        //Div_Centered.style.overflowY = 'auto';
        
        this.Div_MainPanel.appendChild(Div_Centered);

        var p_Title = document.createElement('p');
        p_Title.innerHTML = 'TODO CLEVER NAME<BR>'; //TODO Name
        p_Title.style.color = "white";
        p_Title.style.fontFamily = 'arial';
        p_Title.style.fontSize = '200%';
        p_Title.style.textAlign = 'center';

        Div_Centered.appendChild(p_Title);

        this.p_info = document.createElement('p');
        this.p_info.innerHTML = 'Type To Change Name';
        this.p_info.style.color = "white";
        this.p_info.style.fontFamily = 'arial';
        this.p_info.style.fontSize = '80%';
        this.p_info.style.margin = 0;
        this.p_info.style.padding = 0;

        Div_Centered.appendChild(this.p_info);

        this.TextInput_Name = this.DocumentObj.createElement('input');
        this.TextInput_Name.type = 'text';
        this.TextInput_Name.fontFamily = 'arial';
        this.TextInput_Name.style.color = 'white';
        this.TextInput_Name.style.backgroundColor = 'black';
        this.TextInput_Name.style.border = '2px solid #FFFFFF';
        this.TextInput_Name.style.width = '100%';
        this.TextInput_Name.style.textAlign = 'center';
        this.TextInput_Name.style.marginBottom = '10px';
        this.TextInput_Name.oninput = () => {
            if(self.GameSave == null){
                return;
            }
            var Save = self.GameSave.PlayerSave_GetSelectedPlayer();
            if(Save == null){
                return;
            }
            Save.SetName(self.TextInput_Name.value);
            if(Save.Num_ID in self.DctButton_Saves){
                self.DctButton_Saves[Save.Num_ID].innerHTML = Save.Str_Name;
            }
        }

        Div_Centered.appendChild(this.TextInput_Name);

        this.Button_Play = this.DocumentObj.createElement('button');
        this.Button_Play.style.width = '40%';
        this.Button_Play.style.margin = '2% auto';
        this.Button_Play.style.height = '50px';
        this.Button_Play.style.padding = 0;
        this.Button_Play.style.fontFamily = 'arial';
        this.Button_Play.style.border = '2px solid #FFFFFF';
        this.Button_Play.style.display = 'block';
        this.Button_Play.style.color = 'white';
        this.Button_Play.style.backgroundColor = 'black';
        this.Button_Play.onclick = () => {
            if(self.GameSave != null && self.GameSave.PlayerSave_GetSelectedPlayer()){
                self.CloseScreen();
            }
        }
        Div_Centered.appendChild(this.Button_Play);

        this.Button_CreateNewPlayer = this.DocumentObj.createElement('button');
        this.Button_CreateNewPlayer.style.width = '40%';
        this.Button_CreateNewPlayer.style.margin = '2% auto';
        this.Button_CreateNewPlayer.style.height = '50px';
        this.Button_CreateNewPlayer.style.padding = 0;
        this.Button_CreateNewPlayer.style.fontFamily = 'arial';
        this.Button_CreateNewPlayer.style.border = '2px solid #FFFFFF';
        this.Button_CreateNewPlayer.style.display = 'block';
        this.Button_CreateNewPlayer.style.color = 'white';
        this.Button_CreateNewPlayer.style.backgroundColor = 'black';
        this.Button_CreateNewPlayer.style.verticalAlign = 'top';
        this.Button_CreateNewPlayer.innerHTML = 'NEW PLAYER';
        this.Button_CreateNewPlayer.onclick = () => {
            if(self.GameSave != null){
                var newSave = self.GameSave.PlayerSave_CreateNewPlayer();
                if(newSave != null){
                    self.PopulatePlayerList();
                    self.SelectPlayerSave(newSave.Num_ID);
                }
            }
        }
        Div_Centered.appendChild(this.Button_CreateNewPlayer);

        this.Button_DeletePlayer = this.DocumentObj.createElement('button');
        this.Button_DeletePlayer.style.width = '40%';
        this.Button_DeletePlayer.style.margin = '2% auto';
        this.Button_DeletePlayer.style.height = '50px';
        this.Button_DeletePlayer.style.padding = 0;
        this.Button_DeletePlayer.style.fontFamily = 'arial';
        this.Button_DeletePlayer.style.border = '2px solid #FFFFFF';
        this.Button_DeletePlayer.style.display = 'block';
        this.Button_DeletePlayer.style.color = 'white';
        this.Button_DeletePlayer.style.backgroundColor = 'black';
        this.Button_DeletePlayer.style.verticalAlign = 'top';
        this.Button_DeletePlayer.innerHTML = 'DELETE PLAYER';
        this.Button_DeletePlayer.onclick = () => {
            if(self.GameSave != null){
                self.GameSave.DeletePlayer(self.GameSave.Num_GetSelectedPlayerID());
                var Num_FirstID = -1;
                for(var Num_ID in this.GameSave.Dct_PlayerSaves){
                    Num_FirstID = this.GameSave.Dct_PlayerSaves[Num_ID].Num_ID;
                    break;
                }
                self.PopulatePlayerList();
                self.SelectPlayerSave(Num_FirstID);
            }
        }
        Div_Centered.appendChild(this.Button_DeletePlayer);
    }
    /**
     * @param {number} Num_IDToSelect 
     */
    SelectPlayerSave(Num_IDToSelect){
        if(this.GameSave != null){
            this.GameSave.SetSelectedPlayer(Num_IDToSelect);
            Num_IDToSelect = this.GameSave.Num_GetSelectedPlayerID();
            var SelectedSave = this.GameSave.PlayerSave_GetSelectedPlayer();

            for(var Num_ID in this.DctButton_Saves){
                var Button = this.DctButton_Saves[Num_ID];
                Button.style.color = Num_ID == Num_IDToSelect ? 'black' : 'white';
                Button.style.backgroundColor = Num_ID == Num_IDToSelect ? 'white' : 'black';
            
                var Save = this.GameSave.PlayerSave_GetPlayer(Num_ID);
                Button.innerHTML = Save != null ? Save.Str_Name : "";  //TODO should definitly sanitize this     
            }
            if(this.Button_Play != null){
                this.Button_Play.style.visibility = SelectedSave == null ? 'hidden' : 'visible';
                if(SelectedSave != null){
                    this.Button_Play.innerHTML = SelectedSave.Str_LastCheckPoint != null ? 'CONTINUE GAME' : 'START GAME';
                }
            }
            if(this.p_info != null){
                this.p_info.style.visibility = SelectedSave == null ? 'hidden' : 'visible';
            }
            if(this.TextInput_Name != null){
                this.TextInput_Name.style.visibility = SelectedSave == null ? 'hidden' : 'visible';
                this.TextInput_Name.value = SelectedSave != null ? SelectedSave.Str_Name : "";  //TODO should definitly sanitize this     
            }
        }
    }
    /**
     * @param {function} Func_OnClose 
     */
    OpenScreen(Func_OnClose){
        this.Func_OnClose = Func_OnClose;

        this.SetState(Enum_PlayerSelectScreenState.SCREEN_SELECT_PLAYER);
    }
    CloseScreen(){
        if(this.Div_ListPanel != null && this.Div_ListPanel.parentNode != null){
            this.Div_ListPanel.parentNode.removeChild(this.Div_ListPanel);
        }
        if(this.Div_MainPanel != null && this.Div_MainPanel.parentNode != null){
            this.Div_MainPanel.parentNode.removeChild(this.Div_MainPanel);
        }
        this.Div_ListPanel = null;
        this.Div_MainPanel = null;
        this.DctButton_Saves = {};
        this.p_info = null;
        this.TextInput_Name = null;
        this.Button_Play = null;
        this.Button_CreateNewPlayer = null;

        if(this.Func_OnClose != null){
            this.Func_OnClose();
            this.Func_OnClose = null;
        }
    }
};