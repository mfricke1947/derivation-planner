/*
 * ext-helloworld.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 *
 */
 
/* 
	This is a very basic SVG-Edit extension. It adds a "Hello World" button in
	the left panel. Clicking on the button, and then the canvas will show the
 	user the point on the canvas that was clicked on.
*/


/* new stuff  */

/*
 * 
Using an Object works perfectly fine for sets. If obj is your object and A is a variable that has the value you want to operate on in the set, then you can do these:

Initialization code:

var obj = {};
Question 1: Is A in the list:

if (A in obj) {
    // put code here
}
Question 2: Delete 'A' from the list if it's there:

delete obj[A];
Question 3: Add 'A' to the list if it wasn't already there

obj[A] = true;
For completeness, the test for whether A is in the list is a little safer with this:

if (obj.hasOwnProperty(A)) {
    // put code here
}
because of potential conflict between built-in methods and/or properties on the base Object like the constructor property.

 * 
 */


var gIndividualNames= "abcdefghijklmnopqrstuv";;     //defghijklmnopqrstuv";
                                          /*zero-order functors a..v are constants, w..z are variables
                                          the binary predefineds like + are treated as special cases
                                          and there are the numerals 0,1,2; conceptually gFunctors is a
                                          set of char*/
var namesInUse="";

var availableNames = function (){
    var available="";
    
    for (i=0;i<gIndividualNames.length;i++){
       if (namesInUse.indexOf(gIndividualNames.charAt(i))===-1)
           available+=gIndividualNames.charAt(i);       
    }
    return available;    
};




var serverImagePath = "";

svgEditor.setConfig({
	no_save_warning: true,
	extensions: ['ext-markers.js','ext-connector.js'],         //mf just removes eyedrop
//	imgPath: serverImagePath + "cast/images/",
//	jGraduatePath: serverImagePath + "svgedit/jgraduate/images/",


initFill: {
					color: 'FF0000',  // solid red
					opacity: 0.5
				},
				initStroke: {
					width: 1,
					color: '000000',  // solid black
					opacity: 0.5
				},


	colorPickerCSS: {'left': -10, 'bottom': -15},
	dimensions: [535,325],
	canvas_expansion: 0,
	show_outside_canvas: false,
	showRulers: false,              //like this
	selectNew: false
}); 
//mf
function loadSvg() {
            var svgexample = '<svg width="640" height="480" xmlns:xlink="http://www.w3.org/1999/xlink" '+
                    'xmlns="http://www.w3.org/2000/svg"><g id="svg_1"><title>Layer 1</title><rect stroke-width="5" '+
                    'stroke="#000000" fill="#FF0000" id="svg_2" height="35" width="51" y="35" x="32"/>'+
                    '<g><ellipse ry="15" rx="24" '+
                    'stroke-width="5" stroke="#000000" fill="#0000ff" id="svg_3" cy="60" cx="66"/>'+
                    '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="24" id="svg_20" y="60" x="60" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#000000" fill="#000000">a</text>'+
                    '</g></g></svg>';
            
    
    svgCanvas.setSvgString(svgexample);
        };
 
svgEditor.addExtension("Hello World", function() {

		return {
			name: "Hello World",
			// For more notes on how to make an icon file, see the source of
			// the hellorworld-icon.xml
			svgicons: "extensions/helloworld-icon.xml",
			
			// Multiple buttons can be added in this array
			buttons: [{
				// Must match the icon ID in helloworld-icon.xml
				id: "hello_world", 
				
				// This indicates that the button will be added to the "mode"
				// button panel on the left side
				type: "mode", 
				
				// Tooltip text
				title: "Say 'Hello World'", 
				
				// Events
				events: {
					'click': function() {
						// The action taken when the button is clicked on.
						// For "mode" buttons, any other button will 
						// automatically be de-pressed.
						svgCanvas.setMode("hello_world");
					}
				}
			}],
			// This is triggered when the main mouse button is pressed down 
			// on the editor canvas (not the tool panels)
			mouseDown: function() {
				// Check the mode on mousedown
				if(svgCanvas.getMode() == "hello_world") {
				
					// The returned object must include "started" with 
					// a value of true in order for mouseUp to be triggered
					return {started: true};
				}
			},
			
			// This is triggered from anywhere, but "started" must have been set
			// to true (see above). Note that "opts" is an object with event info
			mouseUp: function(opts) {
				// Check the mode on mouseup
				if(svgCanvas.getMode() == "hello_world") {
					var zoom = svgCanvas.getZoom();
					
					// Get the actual coordinate by dividing by the zoom value
					var x = opts.mouse_x / zoom;
					var y = opts.mouse_y / zoom;
					
					var text = "Hello Hello World!\n\nYou clicked here: " 
						+ x + ", " + y;
                                        
                                        
                                        
						
					// Show the text using the custom alert function
				//	$.alert(text);
                                        
                                        $.prompt("Please choose just one individual",availableNames());
                                        
                                        loadSvg(); //mf
				}
			}
		};
});

