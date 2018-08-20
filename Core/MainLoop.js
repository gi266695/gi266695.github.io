class CoreData {
    constructor(){
        this.Clear();
    }
    Exit(){    
        //CoreTick will actually kill everything this is just a flag
        this.requestAnimationFrame_ID = null;
    }
    Clear(){
        this.WindowObj = null;
        this.DocumentObj = null;
        this.ContainerElement = null;

        this.requestAnimationFrame_ID = null;
        this.RootElement = null;
        this.CanvasElement = null;
        this.Context2D = null;

        this.AssetLibrary = null;
        this.LayerStack = null;
        this.InputManager = null;

        this.TotalElapsedSeconds = 0;

        this.DrawSpriteBoxes = false;
        this.DrawHitBoxes = false;
        this.DrawSpriteCenters = false;
    }
    GetContext2D(){
        if(this.Context2D != null){
            return this.Context2D;
        }
        if(this.CanvasElement == null){
            return null;
        }   
        this.Context2D = this.CanvasElement.getContext("2d"); 
        return this.Context2D;
    }
    ClearContext2D(){
        this.Context2D = null;
    }
}

/** blatently copied from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/*/
String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

/**
 * @param {Window} WindowObj - window
 * @param {HTMLDocument} DocumentObj - document,
 * @param {HTMLElement} ContainerElement - div or whatever defines the area this will use,
 * @param {String} CorePath - "??"Mainloop.js
 * @param {Function} TickCallBack - TickCallBack(CoreData, DeltaTime),
 */
function Core_Init(WindowObj, DocumentObj, ContainerElement, CorePath, TickCallBack){
    if(DocumentObj == null || ContainerElement == null || TickCallBack == null){
        //Becuase fuck you that's why
        return;
    }
    var coreData = new CoreData();
    coreData.WindowObj = WindowObj;
    coreData.DocumentObj = DocumentObj;
    coreData.ContainerElement = ContainerElement;

    //create root
    coreData.RootElement = coreData.DocumentObj.createElement("div");
    if(coreData.RootElement == null){
        //Becuase fuck you that's why
        return;
    }
    coreData.ContainerElement.appendChild(coreData.RootElement);
    coreData.RootElement.style.width = "100%";
    coreData.RootElement.style.height = "100%";
    coreData.RootElement.style.margin = 0;
    coreData.RootElement.style.padding = 0;
    coreData.RootElement.style.overflow = "hidden";
    coreData.RootElement.style.position = "relative";

    coreData.CanvasElement = coreData.DocumentObj.createElement("canvas");
    coreData.CanvasElement.style.width = "100%";
    coreData.CanvasElement.style.height = "100%";
    coreData.CanvasElement.style.margin = 0;
    coreData.CanvasElement.style.padding = 0;
    
    coreData.RootElement.appendChild(coreData.CanvasElement);

    //we do this first becase Core_LoadScripts is bullshit and it would be nice if all of its stack frames went away at some point
    coreData.requestAnimationFrame_ID = coreData.WindowObj.requestAnimationFrame(Core_Tick);

    //This is the include order if your thing is in core and it is undefined this isWhy
    lstCoreScripts = [(CorePath + "MathStuff.js")
                        , "testing123.js"
                        , (CorePath + "HitBoxes.js")
                        , (CorePath + "Assets/BaseAsset.js")
                        , (CorePath + "LayerStack.js")
                        , (CorePath + "Assets/SpriteSheetAsset.js")
                        , (CorePath + "Assets/SpriteAsset.js")
                        , (CorePath + "Assets/AnimationAsset.js")
                        , (CorePath + "Assets/AssetLibrary.js")
                        , (CorePath + "InputManager.js")];
    Core_LoadScripts(coreData, lstCoreScripts, Core_AfterScriptLoad);

    //actually start idle loop
    function Core_AfterScriptLoad(){
        coreData.AssetLibrary = new AssetLibrary();
        coreData.LayerStack = new LayerStack();   
        coreData.InputManager = new InputManager();
        coreData.InputManager.SetUpCallbacks(coreData);
    }

    function Core_Tick(TotalElapsedTime){
        TotalElapsedTime = (TotalElapsedTime / 1000);

        //don't do anything untill cor scripts load
        if(coreData.LayerStack != null){
            //exit flag kill everything
            if(coreData.requestAnimationFrame_ID == null){
                coreData.ContainerElement.removeChild(RootElement);
                coreData.Clear();
                return;
            }

            //idle loop
            var DeltaTime = (TotalElapsedTime - coreData.TotalElapsedSeconds);
            coreData.TotalElapsedSeconds = TotalElapsedTime;

            TickCallBack(coreData, DeltaTime);
        }
        coreData.ClearContext2D();

        //request next tick
        //apearently this is perfectly OK "https://stackoverflow.com/questions/23979309/endless-animations-requestanimationframe-and-call-stack-limits"
        coreData.requestAnimationFrame_ID = coreData.WindowObj.requestAnimationFrame(Core_Tick);
    }
}
/**
 * @param {CoreData} coreData 
 * @param {string[]} lstPaths 
 * @param {function} isLoadedCallback
 */
function Core_LoadScripts(coreData, lstPaths, isLoadedCallback){
    if(coreData == null || coreData.WindowObj == null || coreData.DocumentObj == null
            || lstPaths == null || lstPaths.length <= 0
            || isLoadedCallback == null){
         //Becuase fuck you that's why
         return;
    }
    var local_lstPaths = [];
    lstPaths.forEach(element => {
        local_lstPaths.push(element);
    });

    //this assumes this never recieves a list of some obserd size
    LoadNextScript(local_lstPaths[0]);
    
    //TODO: loop better
    //need to load 1 at a time in case code files reference eachother
    function LoadNextScript(path) {
        var pathID = "CoreScript_" + path.hashCode();
        console.log("Core_LoadScripts(): " + pathID + ":: " + path);
        var loadedScript = document.getElementById(pathID);

        //not loaded load it now
        if(loadedScript == null && path != null){
            var newScript = document.createElement("script");
            newScript.id = pathID;

            newScript.onreadystatechange = CoreLoop_LoadSuccessCallBack;
            newScript.onload = CoreLoop_LoadSuccessCallBack;
            newScript.onerror = CoreLoop_LoadFailCallBack;

            newScript.type = 'text/javascript';
            newScript.src = path;
            coreData.DocumentObj.head.appendChild(newScript);
        }
        //already loaded
        else{
            CoreLoop_LoadSuccessCallBack();
        }

        function CoreLoop_LoadSuccessCallBack(){
            CoreLocal_isLoadedCallBack(path, true);
        }
        function CoreLoop_LoadFailCallBack(){
            CoreLocal_isLoadedCallBack(path, false);
        }

    };
    function CoreLocal_isLoadedCallBack(path, bool_Success){
        if(!bool_Success){
            //we can't do anything about this error here were just going to load the rest and hope for the best
            console.log('Core_LoadScripts(): Failed to load [' + path + ']');
        }
        local_lstPaths.splice(0, 1);
        if(local_lstPaths.length > 0){
            LoadNextScript(local_lstPaths[0]);
        }
        else{
            console.log("mainLoop.CoreLocal_isLoadedCallBack(): scriptLoad Complete");
            isLoadedCallback();
        }
    }
}