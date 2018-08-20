/**
 * This does not really do anything just exists to define the functions AssetLibrary Expects to be overidden
 */
class BaseAsset{
    /**
     * Func_onComplete(String, BaseAsset) is called on complete Func_onComplete(String, this) == success, Func_onComplete(String, null), failiure
     * @param {string} String_Path 
     * @param {function} Func_onComplete 
     */
    Load(String_Path, Func_OnComplete){
        if(Func_OnComplete == null){
            return;
        }
        if(String_Path == null){
            Func_OnComplete(String_Path, null);
        }
        //hacky test is hacky
        //Func_OnComplete(String_Path, null);
        //return;

        var xhttp = new XMLHttpRequest();
        try{
            xhttp.onreadystatechange = Local_Isloaded;
            xhttp.open("GET", String_Path, true);
            xhttp.send(null);
        }
        catch(exception){
            console.log("BaseAsset.Load(): Exception [" + exception + "] " + String_Path);
            Func_OnComplete(String_Path, null);
        }
        var self = this; //TODO: not the dumb way

        function Local_Isloaded(){
            if(xhttp.readyState === 4){
                if (xhttp.status === 200) {
                    var bError = false;
                     try{
                        var JSONObject = JSON.parse(xhttp.response); 
                        bError = !self.bool_LoadFromFileData(String_Path, JSONObject);
                     }
                     catch(exception){
                        console.log("BaseAsset.Load(): Exception [" + exception + "] " + String_Path);
                        bError = true;
                    }
                     Func_OnComplete(String_Path, bError ? null : self);
                }
                else{
                    console.log("BaseAsset.Load(): Failed \"" + String_Path + "\" [" + xhttp.readyState + ", " +  xhttp.status + ", " + xhttp.statusText + "]"); 
                    Func_OnComplete(String_Path, null);
                }
            }
            else{
                //console.log("BaseAsset.Load(): In Progress \"" + String_Path + "\" [" + xhttp.readyState + ", " +  xhttp.status + ", " + xhttp.statusText + "]"); 
            }
        }
    }
    /**
     * Load data from file now that the file has been loaded
     * @param {string} String_Path 
     * @param {object} jsonObject 
     */
    bool_LoadFromFileData(String_Path, jsonObject){
        return true;
    }

    /**
     * After This has been loaded this is used to find and load any files this needs (images sounds etc...)
     */
    LstStr_GetDependencies(){
        return []; // does nothing by defualt
    }
    /**
     * After all dependencies have been loaded this is called so that this can grab references to anything it needs
     * @param {AssetLibrary} assetLibrary 
     */
    SetDependencies(assetLibrary){ ; }
}