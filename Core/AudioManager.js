class AudioManager {
    constructor(){
        this.AudioContext = null;
        this.Num_MasterVolume = 1;
        this.Vector_ListenerPosition = new Vector2D();

        this.Lst_CachedNodes = [];    //Duplicate sources that arnt playing anything

        this.ActiveInstances = [];
        this.Dct_Channels = {};

        this.AssetLibrary = null;
    }
    /**
     * @param {string} Str_Path 
     * @param {AudioInstance} Instance_Settings 
     */
    Instance_PlaySound(Str_Path, Instance_Settings = null){
        if(Str_Path == null
                || (Instance_Settings != null && Instance_Settings.AudioMan != null)){
            return null;
        }
        if(Instance_Settings == null){
            Instance_Settings = new AudioInstance();           
        }
        var channel = this.Chanel_GetChannel(Instance_Settings.Num_ChannelID);
        if(channel != null){
            Instance_Settings.Num_MinBeforeDropoff = channel.Num_DefualtMinBeforeDropoff;
            Instance_Settings.Num_DropOffRange = channel.Num_DefualtDropOffRange;
        }
        Instance_Settings.Bool_InitInstance(this, Str_Path);
        Instance_Settings.SetAudioState(Enum_AudioState.AUDIO_PLAYING);
        this.ActiveInstances.push(Instance_Settings);

        return Instance_Settings;
    }
    /**
     * @param {number} Num_ID 
     * @param {boolean} Bool_CreateIfNew 
     */
    Chanel_GetChannel(Num_ID, Bool_CreateIfNew = false){
        if(Num_ID in this.Dct_Channels){
            return this.Dct_Channels[Num_ID];
        }
        if(!Bool_CreateIfNew){
            return null;
        }
        var newChannel = new AudioChannel();
        this.Dct_Channels[Num_ID] = newChannel;

        return newChannel;
    }
    /**
     * @param {Number} DeltaTime 
     * @param {CoreData} coreData 
     */
    Tick(coreData, DeltaTime){ 
        if(coreData.AssetLibrary != null && coreData.AssetLibrary != this.AssetLibrary){
            if(coreData.AssetLibrary != this.AssetLibrary){
                this.AssetLibrary = coreData.AssetLibrary;
            }
            if(coreData.AudioContext != null){
                this.AudioContext = coreData.AudioContext;
            }
        }
        var loop = 0;
        while(loop < this.ActiveInstances.length){
            var element = this.ActiveInstances[loop];
            element.Tick(coreData, DeltaTime);
            if(!element.Bool_IsActive()){
                this.ReleaseAudioSource(element.Str_SourcePath, element.Audio_Source)
                element.ClearAudioManResorces();
                this.ActiveInstances.splice(loop, 1);
            }
            else{
                loop++;
            }
        }
    }
    /**
     * @param {string} str_path 
     */
    Audio_GetNewSource(Str_Path){
        if(Str_Path == null
                || Str_Path.length <= 0
                || this.AudioContext == null
                || this.AssetLibrary == null){
            return null;
        }
        Str_Path = Str_Path.toLowerCase();

        //todo pull log is spammy
        console.log("AudioManager.Audio_GetNewSource(): New Source [" + Str_Path + "]");


        var RetVal = new AudioInstanceSorceData();
        RetVal.AudioContext = this.AudioContext;

        //get Buffer
        var Buffer_Source = this.AssetLibrary.GetAudioBuffer(Str_Path);
        if(Buffer_Source == null){
            console.log("AudioManager.Audio_GetNewSource(): failed to find buffer for new source [" + Str_Path + "] not found in AssetLibrary");
            return null;
        }
        RetVal.Buffer_Source = Buffer_Source;

        //GetGain Node
        var GainNode_Source = null;
        if(this.Lst_CachedNodes.length > 0){
            GainNode_Source = this.Lst_CachedNodes[0];
            this.Lst_CachedNodes.splice(0, 1);
        }
        else{
            GainNode_Source = this.AudioContext.createGain();
            if(GainNode_Source != null){
                GainNode_Source.connect(this.AudioContext.destination);
            }
        }
        if(GainNode_Source == null){
            console.log("AudioManager.Audio_GetNewSource(): failed to find gaine node for new source [" + Str_Path + "] not found in AssetLibrary");
            return null;
        }
        RetVal.GainNode_Source = GainNode_Source;

        return RetVal;
    }
    /**
     * @param {String} Str_Path 
     * @param {AudioInstanceSorceData} Audio_Source 
     */
    ReleaseAudioSource(Str_Path, Audio_Source){
        if(Str_Path == null || Audio_Source == null){
            return;
        }
        Str_Path = Str_Path.toLowerCase();

        //todo pull log is spammy
        console.log("AudioManager.ReleaseAudioSource(): Release Source [" + Str_Path + "]");
        
        if(Audio_Source.GainNode_Source != null){
            this.Lst_CachedNodes.push(Audio_Source.GainNode_Source);
        }
    }
}

class AudioInstanceSorceData {
    constructor(){
        this.AudioContext = null;
        this.Buffer_Source = null;
        this.GainNode_Source = null;
        this.BufferNode_Source = null;
    }
    /**
     * @param {number} Num_StartTime 
     */
    PlaySound(Num_StartTime){
        if(this.BufferNode_Source != null){
            //already playing
            return;
        }
        if(this.AudioContext != null
                && this.Buffer_Source != null
                && this.GainNode_Source != null){
            
            var Self = this;
            this.BufferNode_Source = this.AudioContext.createBufferSource();
            this.BufferNode_Source.buffer = this.Buffer_Source;
            this.BufferNode_Source.connect(this.GainNode_Source);
            this.BufferNode_Source.onended = () => {
                Self.StopSound();
            }
            this.BufferNode_Source.start(0, Num_StartTime);
        }
    }
    StopSound(){
        if(this.BufferNode_Source == null){
            return;
        }
        if(this.BufferNode_Source.stop){
            this.BufferNode_Source.stop();
        }
        if(this.BufferNode_Source.disconnect){
            this.BufferNode_Source.disconnect();
        }
        //AudioBufferSourceNode can only be played once
        //https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
        this.BufferNode_Source = null;
    }
    /**
     * @param {number} Num_Volume 
     */
    SetVolume(Num_Volume){
        if(this.GainNode_Source != null && this.GainNode_Source.gain.value != Num_Volume){
            this.GainNode_Source.gain.value = Num_Volume;
        }
    }
    /**
     * @param {boolean} Bool_Loop 
     */
    SetLoop(Bool_Loop){
        if(this.BufferNode_Source != null && this.BufferNode_Source.loop != Bool_Loop){
            this.BufferNode_Source.loop = Bool_Loop;
        }
    }
    Bool_IsPlaying(){
        return this.BufferNode_Source != null;
    }
}

class AudioChannel {
    constructor() {
        this.Num_Volume = 1;

        this.Num_DefualtMinBeforeDropoff = 15;
        this.Num_DefualtDropOffRange = 5;
    }
}

Enum_AudioState = {
    AUDIO_UNINITIALIZED: -1,
    AUDIO_ENDED: 0,
    AUDIO_PLAYING: 1,
    AUDIO_PAUSED: 2,               //some one legitemitly paused this
    AUDIO_PAUSED_BECUASE_OWNER: 3, //this paused itslef becuase the owner was paused
};
class AudioInstance {
    constructor(){
        //things you can mess with
        this.Num_LocalVolume = 1;
        this.Bool_loop = false;

        this.Vector_Position = null;
        this.Num_MinBeforeDropoff = null;
        this.Num_DropOffRange = 0;

        this.Num_ChannelID = -1;
        this.Layer_Owner = null;

        //things you should not mess with
        this.Str_SourcePath = null;
        this.Audio_Source = null; 
        this.AudioMan = null;

        this.Num_SorceLength = 0 ;
        this.Num_PlayTime = 0;
        this.Enum_State = Enum_AudioState.AUDIO_UNINITIALIZED;
    }
    /**
     * @param {AudioManager} AudioManager_Man 
     * @param {string} Str_Path 
     */
    Bool_InitInstance(AudioManager_Man, Str_Path){
        this.AudioMan = AudioManager_Man;
        this.Str_SourcePath = Str_Path;
        this.Num_PlayTime = 0;

        if(this.AudioMan != null && this.AudioMan.AssetLibrary != null){
            var AudioBuffer_Source = this.AudioMan.AssetLibrary.GetAudioBuffer(this.Str_SourcePath);
            if(AudioBuffer_Source != null && isFinite(AudioBuffer_Source.duration)){
                this.Num_SorceLength = AudioBuffer_Source.duration;
                this.Enum_State = Enum_AudioState.AUDIO_ENDED;

                this.Tick(null, 0);
                return true;
            }
        }
        return false;
    }   
    ClearAudioManResorces(){
        this.Audio_Source = null; 
        this.AudioMan = null;
        this.Enum_State = Enum_AudioState.AUDIO_UNINITIALIZED;
    }
    Bool_IsActive(){
        return this.Enum_State == Enum_AudioState.AUDIO_PAUSED
                || this.Enum_State == Enum_AudioState.AUDIO_PAUSED_BECUASE_OWNER
                || this.Enum_State == Enum_AudioState.AUDIO_PLAYING;
    }
    Enum_GetState(){
        return this.Enum_State;
    }
    /**
     * @param {CoreData} coreData 
     * @param {number} Num_DeltaTime 
     */
    Tick(coreData, Num_DeltaTime){
        if(this.AudioMan == null){
            return;
        }
        switch(this.Enum_State){
        case Enum_AudioState.AUDIO_PAUSED_BECUASE_OWNER:
            if(coreData != null){
                if(this.Layer_Owner == null
                        || coreData.LayerStack == null
                        || this.Layer_Owner.LayerStack != coreData.LayerStack){
                    
                    this.SetAudioState(Enum_AudioState.AUDIO_ENDED);
                    return;
                }
            }
            if(!this.Layer_Owner.bool_IsPaused){
                this.SetAudioState(Enum_AudioState.AUDIO_PLAYING);
                return;
            }
            break;

        case Enum_AudioState.AUDIO_PLAYING:
            this.Num_PlayTime += Num_DeltaTime;
            //is done
            if(!this.Bool_loop && this.Num_PlayTime >= this.Num_SorceLength){
                if(this.Audio_Source == null || !this.Audio_Source.Bool_IsPlaying()){
                    this.SetAudioState(Enum_AudioState.AUDIO_ENDED);
                    return;
                }
            } 
            if(this.Layer_Owner != null && this.Layer_Owner.bool_IsPaused){
                this.SetAudioState(Enum_AudioState.AUDIO_PAUSED_BECUASE_OWNER);
                return;
            }
            //check volume           
            var Num_ParentVolume = this.AudioMan.Num_MasterVolume;
            var Channel = this.AudioMan.Chanel_GetChannel(this.Num_ChannelID);
            if(Channel != null){
                Num_ParentVolume *= Channel.Num_Volume;   
            }
            //need to create source if we need one
            var newVolume = this.Num_GetCalculatedVolume(this.AudioMan.Vector_ListenerPosition, Num_ParentVolume);
            if(this.Audio_Source == null && newVolume > 0){
                this.Audio_Source = this.AudioMan.Audio_GetNewSource(this.Str_SourcePath);
                if(this.Audio_Source != null){
                    this.Audio_Source.PlaySound(this.Num_PlayTime);
                }
            }
            //update audio sorce if we have one
            if(this.Audio_Source != null){
                this.Audio_Source.SetVolume(newVolume);
                if(this.Audio_Source.SetVolume(newVolume)){
                    this.Audio_Source.volume = newVolume;
                }

                if(this.Audio_Source.loop != this.Bool_loop){
                    this.Audio_Source.loop = this.Bool_loop;
                }
            }           
            break;
        }
    }
    /**
     * @param {number} Enum_State 
     */
    SetAudioState(Enum_State){
        this.Enum_State = Enum_State;

        switch(this.Enum_State){
        case Enum_AudioState.AUDIO_PLAYING:
            if(this.Audio_Source != null){
                this.Audio_Source.PlaySound(this.Num_PlayTime);
            }
            else{
                this.Tick(null, 0);
            }
            break;

        case Enum_AudioState.AUDIO_ENDED:
            if(this.Audio_Source != null){
                this.Audio_Source.currentTime = 0;
                this.Audio_Source.StopSound();
            }
            this.Num_PlayTime = 0;
            break;

        case Enum_AudioState.AUDIO_PAUSED:
        case Enum_AudioState.AUDIO_PAUSED_BECUASE_OWNER:
            if(this.Audio_Source != null){
                this.Audio_Source.StopSound();
            }
            break;
        }
    }
    Num_GetCalculatedVolume(Vector_ListenerPosition, Num_ParentVolume){
        if(Vector_ListenerPosition == null
                || this.Vector_Position == null
                || this.Num_MinBeforeDropoff == null){
                    
            return Num_Clamp(this.Num_LocalVolume * Num_ParentVolume, 0, 1);
        }
        
        Vector_AudioInstanceTemp.Assign(this.Vector_Position);
        Vector_AudioInstanceTemp.SubtractFromSelf(Vector_ListenerPosition);

        var Distance = Vector_AudioInstanceTemp.Num_GetLength();
        if(Distance <= 0){
            return this.Num_LocalVolume * Num_ParentVolume;
        }
        if(this.Num_MinBeforeDropoff != null || Distance < this.Num_MinBeforeDropoff){
            if(Distance <= this.Num_MinBeforeDropof){
                return Num_Clamp(this.Num_LocalVolume * Num_ParentVolume, 0, 1);
            }
            if(this.Num_DropOffRange == null){
                this.Num_DropOffRange = 0;
            }
            if(Distance >= this.Num_MinBeforeDropof + this.Num_DropOffRange){
                return 0;
            }
            return Num_Clamp((this.Num_LocalVolume * (1 - ((Distance - this.Num_MinBeforeDropoff) / this.Num_DropOffRange))) * Num_ParentVolume, 0, 1);
        }
        return Num_Clamp(this.Num_LocalVolume * Num_ParentVolume, 0, 1); 
    }
}
var Vector_AudioInstanceTemp = new Vector2D();

class TimedAudioInstance {
    constructor(){
        this.Bool_PlayedSound = false;
        this.Bool_FireAndForget = true;
        this.Num_TimeTillPlay = 0;
        this.AudioInstance_Instance = new AudioInstance();
    }
    /**
    * @param {CoreData} coreData 
    * @param {number} Num_DeltaTime
    * @param {Vector2D} Num_DeltaTime
    */
    TickInstance(coreData, Num_DeltaTime, Vector_Position){
        if(Num_DeltaTime > 0){//We don't play sounds if the anim is playing in revers
            this.Num_TimeTillPlay -= Num_DeltaTime;
            if(this.Num_TimeTillPlay < 0){
                this.Num_TimeTillPlay = 0;
            }
        }
        if(Vector_Position != null && this.AudioInstance_Instance.Vector_Position != null){
            this.AudioInstance_Instance.Vector_Position.Assign(Vector_Position);
        }
        switch(this.AudioInstance_Instance.Enum_GetState()){
        case Enum_AudioState.AUDIO_UNINITIALIZED:
            if(this.Num_TimeTillPlay <= 0
                    && coreData.AudioManager != null
                    && !this.Bool_PlayedSound){

                this.Bool_PlayedSound = true;
                coreData.AudioManager.Instance_PlaySound(this.AudioInstance_Instance.Str_SourcePath, this.AudioInstance_Instance);
            }
            break;

        case Enum_AudioState.AUDIO_PLAYING:
            if(Num_DeltaTime == 0 && !this.Bool_FireAndForget){
                this.AudioInstance_Instance.SetAudioState(Enum_AudioState.AUDIO_PAUSED);
            }
            break;

        case Enum_AudioState.AUDIO_PAUSED:
            if(Num_DeltaTime == 0){
                this.AudioInstance_Instance.SetAudioState(Enum_AudioState.AUDIO_PLAYING);
            }
            break;
        }
    }
    Bool_IsDone(){
        return this.Bool_PlayedSound && !this.AudioInstance_Instance.Bool_IsActive();
    }
    StopSound(){
        if(this.AudioInstance_Instance.Enum_GetState() != Enum_AudioState.AUDIO_UNINITIALIZED
                && (!this.Bool_FireAndForget || this.AudioInstance_Instance.Bool_loop)){
            
            this.AudioInstance_Instance.SetAudioState(Enum_AudioState.AUDIO_ENDED);
        }
    }
}

class AudioSpawn {
    constructor(){
        this.Str_Path = null;
        this.Num_Volume = 1;
        this.Bool_loop = false;
        this.Bool_FireAndForget = true;
        this.Bool_PlayAtPosition = false;
        this.Num_PlayWaitTime = 0;
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
        /*
        {
            "SoundPath": ""
            "Volume": 1,
            "Loop": false,
            "PlayAtPosition": false,
            "FireAndFoget": true,
            "WaitTime": 0
        }
        */
        if(typeof JSONObject.SoundPath === 'string'){
            this.Str_Path = JSONObject.SoundPath;
        }
        if(typeof JSONObject.Volume === 'number'){
            this.Num_Volume = JSONObject.Volume;
        }
        if(typeof JSONObject.Loop === 'boolean'){
            this.Bool_loop = JSONObject.Loop;
        }
        if(typeof JSONObject.PlayAtPosition === 'boolean'){
            this.Bool_PlayAtPosition = JSONObject.PlayAtPosition;
        }
        if(typeof JSONObject.FireAndFoget === 'boolean'){
            this.Bool_FireAndForget = JSONObject.FireAndFoget;
        }
        if(typeof JSONObject.WaitTime === 'number'){
            this.Num_PlayWaitTime = JSONObject.WaitTime;
        }
        return true;
    }
    /**
     * @param {number} Num_ChannelID 
     * @param {GameLayer} Layer_Owner 
     */
    TimedInstance_CreateInstance(Num_ChannelID, Layer_Owner){
        var retVal = new TimedAudioInstance();
        retVal.Num_TimeTillPlay = this.Num_PlayWaitTime;

        retVal.AudioInstance_Instance.Str_SourcePath = this.Str_Path;
        retVal.AudioInstance_Instance.Num_LocalVolume = this.Num_Volume;
        retVal.AudioInstance_Instance.Bool_loop = this.Loop;
        if(this.Bool_PlayAtPosition){
            retVal.AudioInstance_Instance.Vector_Position = null;
        }
        else {
            retVal.AudioInstance_Instance.Vector_Position = new Vector2D();
        }
        retVal.AudioInstance_Instance.Num_ChannelID = Num_ChannelID;
        retVal.AudioInstance_Instance.Layer_Owner = Layer_Owner;

        return retVal;
    }
}