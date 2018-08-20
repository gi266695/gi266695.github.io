var Enum_MouseButtons = {
    LEFT_MOUSE_BUTTON: 0,
    MIDDLE_MOUSE_BUTTON: 1,
    RIGHT_MOUSE_BUTTON: 2,
};
var Enum_KeyboardButtons = {
    BUTTON_BACKSPACE: 8,
    BUTTON_TAB: 9,
    BUTTON_ENTER: 13,
    BUTTON_SHIFT: 16,
    BUTTON_CTRL: 17,
    BUTTON_ALT: 18,
    BUTTON_PUASE_BREAK: 19,
    BUTTON_CAPS_LOCK: 20,
    BUTTON_ESCAPE: 27,
    BUTTON_SPACE: 32,
    BUTTON_PAGE_UP: 33,
    BUTTON_PAGE_DOWN: 34,
    BUTTON_END: 35,
    BUTTON_HOME: 36,
    BUTTON_ARROW_LEFT: 37,
    BUTTON_ARROW_UP: 38,
    BUTTON_ARROW_RIGHT: 39,
    BUTTON_ARROW_DOWN: 40,
    BUTTON_INSERT: 45,
    BUTTON_DELETE: 46,
    BUTTON_0: 48,
    BUTTON_1: 49,
    BUTTON_2: 50,
    BUTTON_3: 51,
    BUTTON_4: 52,
    BUTTON_5: 53,
    BUTTON_6: 54,
    BUTTON_7: 55,
    BUTTON_8: 56,
    BUTTON_9: 57,
    BUTTON_A: 65,
    BUTTON_B: 66,
    BUTTON_C: 67,
    BUTTON_D: 68,
    BUTTON_E: 69,
    BUTTON_F: 70,
    BUTTON_G: 71,
    BUTTON_H: 72,
    BUTTON_I: 73,
    BUTTON_J: 74,
    BUTTON_K: 75,
    BUTTON_L: 76,
    BUTTON_M: 77,
    BUTTON_N: 78,
    BUTTON_O: 79,
    BUTTON_P: 80,
    BUTTON_Q: 81,
    BUTTON_R: 82,
    BUTTON_S: 83,
    BUTTON_T: 84,
    BUTTON_U: 85,
    BUTTON_V: 86,
    BUTTON_W: 87,
    BUTTON_X: 88,
    BUTTON_Y: 89,
    BUTTON_Z: 90,
    BUTTON_WINDOWS_KEY_LEFT: 91,
    BUTTON_WINDOWS_KEY_RIGHT: 92,
    BUTTON_SELECT_KEY: 93,
    BUTTON_NUMPAD_0: 96,
    BUTTON_NUMPAD_1: 97,
    BUTTON_NUMPAD_2: 98,
    BUTTON_NUMPAD_3: 99,
    BUTTON_NUMPAD_4: 100,
    BUTTON_NUMPAD_5: 101,
    BUTTON_NUMPAD_6: 102,
    BUTTON_NUMPAD_7: 103,
    BUTTON_NUMPAD_8: 104,
    BUTTON_NUMPAD_9: 105,
    BUTTON_NUMPAD_MULTIPLY: 106,
    BUTTON_NUMPAD_ADD: 107,
    BUTTON_NUMPAD_SUBTRACT: 109,
    BUTTON_NUMPAD_DECIMAL_POINT: 110,
    BUTTON_NUMPAD_DIVIDE: 111,
    BUTTON_F1: 112,
    BUTTON_F2: 113,
    BUTTON_F3: 114,
    BUTTON_F4: 115,
    BUTTON_F5: 116,
    BUTTON_F6: 117,
    BUTTON_F7: 118,
    BUTTON_F8: 119,
    BUTTON_F9: 120,
    BUTTON_F10: 121,
    BUTTON_F11: 122,
    BUTTON_F12: 123,
    BUTTON_NUM_LOCK: 144,
    BUTTON_SCROLL_LOCK: 145,
    BUTTON_SEMI_COLON: 186,
    BUTTON_EQUAL_SIGN: 187,
    BUTTON_COMMA: 188,
    BUTTON_DASH: 189,
    BUTTON_PERIOD: 190,
    BUTTON_FORWARD_SLASH: 191,
    BUTTON_GRAVE_ACCENT: 192,
    BUTTON_OPEN_BRAKET: 219,
    BUTTON_BACK_SLASH: 220,
    BUTTON_CLOSE_BRAKET: 221,
    BUTTON_SINGLE_QUOTE: 222
};
class InputManager{
    constructor(){
        this.Vector_LastMousePosition = new Vector2D();
        this.Set_MouseButtonsDown = new Set();
        this.Set_KeyboardButtonsDown = new Set();
        this.Num_WheelPosition = 0;
        this.Bool_HasFocus = true;
    }
    /**
     * @param {CoreData} coreData 
     */
    SetUpCallbacks(coreData){
        if(coreData == null
                || coreData.DocumentObj == null
                || coreData.DocumentObj.body == null
                || coreData.WindowObj == null
                || coreData.RootElement == null){
            return;
        }
        
        var self = this;

        //mouse position
        coreData.DocumentObj.onmousemove = (event) => {
            //blatently copied from stack overflow
            var eventDoc = null;
            var doc = null;
            var body = null;

            event = event || coreData.WindowObj.event; // IE-ism

            // If pageX/Y aren't available and clientX/Y
            // are, calculate pageX/Y - logic taken from jQuery
            // Calculate pageX/Y if missing and clientX/Y available
            if (event.pageX == null && event.clientX != null) {
                eventDoc = (event.target && event.target.ownerDocument) || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;

                event.pageX = event.clientX +
                    (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                    (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY +
                    (doc && doc.scrollTop || body && body.scrollTop || 0) -
                    (doc && doc.clientTop || body && body.clientTop || 0);
            }

            self.Vector_LastMousePosition.x = event.pageX - coreData.RootElement.offsetLeft;
            self.Vector_LastMousePosition.y = event.pageY - coreData.RootElement.offsetTop;
        }

        //mouse down
        coreData.CanvasElement.onmousedown = (event) => {
            //IE8 uses 4 for MIDDLE_MOUSE_BUTTON
            var ButtonType = event.button;
            if(ButtonType == 4){
                ButtonType = 2;
            }
            if(!self.Set_MouseButtonsDown.has(ButtonType)){
                self.Set_MouseButtonsDown.add(ButtonType);
            }
        }
        //mouse up
        coreData.CanvasElement.onmouseup = (event) => {
            //IE8 uses 4 for MIDDLE_MOUSE_BUTTON
            var ButtonType = event.button;
            if(ButtonType == 4){
                ButtonType = 2;
            }
            if(self.Set_MouseButtonsDown.has(ButtonType)){
                self.Set_MouseButtonsDown.delete(ButtonType);
            }
        }

        //mouse wheel
        coreData.DocumentObj.onwheel = (event) => {
            self.Num_WheelPosition += event.deltaY;
        };

        //key down
        coreData.DocumentObj.onkeydown = (event) => {
            if(!self.Set_KeyboardButtonsDown.has(event.keyCode)){
                self.Set_KeyboardButtonsDown.add(event.keyCode);
            }
        }
        //key up
        coreData.DocumentObj.onkeyup = (event) => {
            if(self.Set_KeyboardButtonsDown.has(event.keyCode)){
                self.Set_KeyboardButtonsDown.delete(event.keyCode);
            }
        }
        //focus gained
        coreData.WindowObj.onfocus = () => {
            self.Bool_HasFocus = true;

            //clear state we don't know what these are anymore
            self.Set_MouseButtonsDown.clear();
            self.Set_KeyboardButtonsDown.clear();
        }
        //focus lost
        coreData.WindowObj.onblur = () => {
            self.Bool_HasFocus = false;

            //clear state we don't know what these are anymore
            self.Set_MouseButtonsDown.clear();
            self.Set_KeyboardButtonsDown.clear();
        }
    }
}