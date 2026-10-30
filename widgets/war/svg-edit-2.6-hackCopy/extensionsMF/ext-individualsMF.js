
/* needs TInterpretationBoard.js    */
/* needs TUtilities.js    */



/*
mf I use setConfig to get rid of rulers etc.


svgEditor.setConfig({
	no_save_warning: true,
	extensions: [],
	imgPath: serverImagePath + "cast/images/",
	jGraduatePath: serverImagePath + "svgedit/jgraduate/images/",
	colorPickerCSS: {'left': -10, 'bottom': -15},
	dimensions: [535,325],
	canvas_expansion: 0,
	show_outside_canvas: false,
	showRulers: false,
	selectNew: false
});

*/
/*
 * based on ext-helloworld.js
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

/* Safety check */

var svgCanvas = (typeof svgCanvas === 'undefined') ? null : svgCanvas;


/* new stuff  */

var gIndividualNames= "abcdefghijklmnopqrstuv";;     //defghijklmnopqrstuv";
                                          /*zero-order functors a..v are constants, w..z are variables
                                          the binary predefineds like + are treated as special cases
                                          and there are the numerals 0,1,2; conceptually gFunctors is a
                                          set of char*/

 function augmentSvg(newStr) {
   var prefix=  '<svg width="560" height="400" '+
                    'xmlns="http://www.w3.org/2000/svg">'+
                     '<defs><style type="text/css"><![CDATA[text {fill: black;}]]></style></defs>'+ //make text black through color change                
                    '<g id="svg_1"><title>Shape</title>';
   var prefixEndTag='<title>Shape</title>';
   var interpretation="";
   var startTag='<!--start-->'; // we put this after the svg blurb and the Interpretation Board        
   var suffix=  '</g></svg>';     
   var currentSvg= svgCanvas.getSvgString();
   var minusSuffix= currentSvg.slice(0,-(suffix.length+1));//take off suffix
   
    var index=minusSuffix.indexOf(startTag); //it may or may not have one, first time through it won't
  
    if (index>-1)
        index+=startTag.length;  //include the tag
    else{    
     index=minusSuffix.indexOf(prefixEndTag);   
     if (index>-1)
        index+=prefixEndTag.length; //include the tag
    }
    
    if (index>-1){
 //       index+=startTag.length;     // length of '<title>Layer 1</title>'
   
   //var prefLength=prefix.length;  ///not working for me
       //var trunc=minusSuffix.substring(prefLength);  
       var trunc=minusSuffix.substring(index);
     
 //    var trunc=truncWithBoard.replace(/<g id="svg_IBg">\w*/g,"");   //.*<\/g>
     
       var interpretation=gInterpretationBoard.makeInterpretationBoard(svgCanvas.getSvgString());   
       var augmented= prefix+interpretation+startTag+trunc+newStr+suffix; //the new item is not there yet
           interpretation=gInterpretationBoard.makeInterpretationBoard(augmented);             //update board
           augmented= prefix+interpretation+startTag+trunc+newStr+suffix; //update lot
 
      var test= svgCanvas.setSvgString(augmented);
             
       
 //      svgCanvas.updateCanvas();  //new Aug2  DOES NOT WORK
    }
};
        
var availableNames = function (){
    var available="";   
    var namesInUse=gInterpretationBoard.namesInSvg();
    var indexChar
    
    for (i=0;i<gIndividualNames.length;i++){
        indexChar=gIndividualNames.charAt(i);
       if ((namesInUse.indexOf(indexChar)===-1)&&  //not in universe
            !gInterpretationBoard.isIdentityDuplicate(indexChar)) //not in use as an identity
           available+=gIndividualNames.charAt(i);       
    }
    return available;    
};



//mf 
/*function loadSvg() {  //not being used
            var svgexample = '<svg width="640" height="480" xmlns:xlink="http://www.w3.org/1999/xlink" '+
                    'xmlns="http://www.w3.org/2000/svg"><g id="svg_1"><title>Layer 1</title><rect stroke-width="5" '+
                    'stroke="#000000" fill="#FF0000" id="svg_2" height="35" width="51" y="35" x="32"/>'+
                    '<g><ellipse ry="15" rx="24" '+
                    'stroke-width="5" stroke="#000000" fill="#0000ff" id="svg_3" cy="60" cx="66"/>'+
                    '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="24" id="svg_20" y="60" x="60"     fill="#000000">a</text>'+
                    '</g></g></svg>';
            
    
    svgCanvas.setSvgString(svgexample);
        }; */
        
function makeIndividual(name,x,y){
// the individuals are unique and so can be used for svg ids 

  var individual = '<g id="svg_'+name+'g"><circle r="11" stroke-width="1" id="svg_'+name+'" cy="'+y+'" cx="'+x+'" stroke="black" fill="none" />'+
                    '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
                    'id="svg_'+name+'t" y="'+(y+7)+'" x="'+x+'"    '+
                    ' fill="#000000">'+name+'</text>'+
                    '</g>';
  
    //fill-opacity="0.5" 
  return individual;   
}; 



function updateSvgIBoard(){   //outsde editing eg delete has changed the Interpreation Board
     augmentSvg("");    
     };


var serverImagePath = "";

svgEditor.setConfig({
	no_save_warning: true,
	extensions: ['ext-markers.js'/*,'ext-connector.js'*/],         //mf just removes eyedrop, connector
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

        
        
 

//  var svgCanvas = new embedded_svg_edit(window.frames['svgedit']);

 
 
// mf 2026-09: drag-to-place with a live-editable palette name, replacing the old
// blocking prompt() on mouseUp. See ProofsPublicCopy CLAUDE.md for the design discussion.

var individualsMF = individualsMF || {};

individualsMF.fCurrentName = null;   // the letter that will be used for the NEXT individual placed
individualsMF.fDraggingId = null;    // svg_<name> id of the individual currently being dragged, or null

// Picks the next available name and puts it in the palette field (if the field exists yet).
individualsMF.refreshCurrentName = function() {
	var available = availableNames();
	individualsMF.fCurrentName = available.length ? available.charAt(0) : null;
	var field = document.getElementById('individuals_name');
	if (field) {
		field.value = individualsMF.fCurrentName || '';
		field.disabled = !individualsMF.fCurrentName;
	}
};

// Called when the user types into the palette field: only ever accept a single
// letter that is actually available (matches the validation the old prompt() did).
individualsMF.onNameFieldChange = function() {
	var field = document.getElementById('individuals_name');
	var typed = field.value.trim().charAt(0);
	var available = availableNames();
	if (typed && available.indexOf(typed) > -1) {
		individualsMF.fCurrentName = typed;
		field.value = typed;
	} else {
		// not a legal choice - revert to whatever was current before the edit
		field.value = individualsMF.fCurrentName || '';
	}
};

individualsMF.showPanel = function(show) {
	var panel = document.getElementById('individuals_panel');
	if (panel) panel.style.display = show ? 'inline' : 'none';
};

svgEditor.addExtension("Individuals", function() {

		return {
			name: "Individuals",
			// For more notes on how to make an icon file, see the source of
			// the hellorworld-icon.xml
			svgicons: "extensionsMF/individuals-icon.xml",

			// A live-editable name field in the top toolbar, shown only while the
			// Individuals tool is the active mode (see the button's click handler below).
			context_tools: [{
				type: 'input',
				panel: 'individuals_panel',
				id: 'individuals_name',
				label: 'Name',
				size: 2,
				events: {
					// mf 2026-09-29: 'input' (not 'change') so the typed letter takes effect
					// immediately, without needing Enter/blur first - Martin found mousedown
					// was using the pre-filled letter, not whatever had just been typed.
					'input': individualsMF.onNameFieldChange,
					'blur': individualsMF.onNameFieldChange
				}
			}],

			// Multiple buttons can be added in this array
			buttons: [{
				// Must match the icon ID in individuals-icon.xml
				id: "individuals",

				// This indicates that the button will be added to the "mode"
				// button panel on the left side
				type: "mode",

				// Tooltip text
				title: "Individuals",

				// Events
				events: {
					'click': function() {
						// The action taken when the button is clicked on.
						// For "mode" buttons, any other button will
						// automatically be de-pressed.
						svgCanvas.setMode("individual");
						individualsMF.refreshCurrentName();
						individualsMF.showPanel(true);
					}
				}
			}],

			// Runs once, after our buttons/context_tools have been built into the DOM:
			// hide the name panel until the Individuals tool is actually selected, and
			// hide it again whenever any other tool button is clicked.
			callback: function() {
				individualsMF.showPanel(false);
				$(document).on('click', '.tool_button, .tool_button_current', function() {
					if (this.id !== 'individuals') individualsMF.showPanel(false);
				});

				// mf 2026-09-29: the field has no length limit of its own, so typing a new
				// letter without first clearing the old one just appends to it - cap it at one
				// character and select-on-focus so a click (or tab) into the field followed by
				// typing naturally replaces whatever's there, rather than requiring the User to
				// clear it manually first.
				var field = document.getElementById('individuals_name');
				if (field) {
					field.setAttribute('maxlength', '1');
					field.addEventListener('focus', function() { field.select(); });
				}
			},

			// This is triggered when the main mouse button is pressed down
			// on the editor canvas (not the tool panels). Creates the individual
			// immediately at the click point and arms the drag; mouseMove then just
			// follows the pointer, and mouseUp finalizes the position.
			mouseDown: function(opts) {
				if(svgCanvas.getMode() == "individual") {
					if (!individualsMF.fCurrentName) {
						alert("Sorry, there are no more individuals");
						return;
					}

					var zoom = svgCanvas.getZoom();
					var x = opts.start_x / zoom;
					var y = opts.start_y / zoom;

					var name = individualsMF.fCurrentName;
					augmentSvg(makeIndividual(name, x, y));
					individualsMF.fDraggingId = 'svg_' + name;

					// The returned object must include "started" with
					// a value of true in order for mouseMove/mouseUp to be triggered
					return {started: true};
				}
			},

			// Runs on every pointer move while armed; just repositions the DOM
			// nodes directly (cheap) rather than re-running augmentSvg() per frame
			// (which fully rebuilds the SVG string, including the Interpretation Board).
			mouseMove: function(opts) {
				if(svgCanvas.getMode() == "individual" && individualsMF.fDraggingId) {
					var zoom = svgCanvas.getZoom();
					var x = opts.mouse_x / zoom;
					var y = opts.mouse_y / zoom;

					var circle = svgCanvas.getElem(individualsMF.fDraggingId);
					var label = svgCanvas.getElem(individualsMF.fDraggingId + 't');
					if (circle) {
						circle.setAttribute('cx', x);
						circle.setAttribute('cy', y);
					}
					if (label) {
						label.setAttribute('x', x);
						label.setAttribute('y', y + 7);
					}
				}
			},

			// This is triggered from anywhere, but "started" must have been set
			// to true (see above). Note that "opts" is an object with event info
			mouseUp: function(opts) {
				if(svgCanvas.getMode() == "individual" && individualsMF.fDraggingId) {
					// Positions are already correct in the live DOM (set during mouseMove);
					// one augmentSvg() call here re-derives the Interpretation Board text
					// from the now-final canvas, same as updateSvgIBoard() does elsewhere.
					augmentSvg("");

					// Select the enclosing <g>, not the bare <circle> - see the identical,
					// more fully-explained fix in ext-propertiesMF.js's mouseUp. Without this,
					// a resize-handle drag right after creation moves the circle only, leaving
					// its label behind (svg-edit's own click-to-select always resolves to the
					// group for anything selected normally, so this only bites freshly-created
					// shapes that this code selects itself).
					var placed = svgCanvas.getElem(individualsMF.fDraggingId + 'g');
					if (placed) svgCanvas.addToSelection([placed], true);

					individualsMF.fDraggingId = null;

					// mf 2026-09-28: revert to the Select tool after each placement (Martin's
					// request) - otherwise the Individuals tool stays "hot" and a later mouseDown
					// anywhere in the drawing (eg meant to just select something) creates another
					// individual instead. Triggering the real Select button's own click reuses
					// its normal mode/toolbar/cursor update rather than duplicating that logic
					// here; it also fires the document-level '.tool_button' click listener from
					// the callback below, which hides our name panel the same as any other tool
					// switch. The already-selected individual stays selected across this switch.
					$('#tool_select').click();
				}
			}
		};
});

/******************** Interpretation Board

package us.softoption.interpretation;

import java.awt.*;
import java.awt.geom.*;


import us.softoption.infrastructure.*; import static us.softoption.infrastructure.Symbols.*; import static us.softoption.parser.TFormula.*;
import us.softoption.editor.*;
import us.softoption.parser.*;

// read Jan 2nd

public class TInterpretationBoard extends TBox{   // this is like a rectangle

static int fMinWidth=150;

private TSemantics fSemantics=null;

public TInterpretationBoard(){
    fTypeID = IDInterpretationBoard;
    fColor=Color.white;
    fName = chBlank;
    fXCoord=5;
    fYCoord=0;
    fWidth=200;
    fHeight=30;

    fSelected=false;
    fSemantics=null;


  }


public TInterpretationBoard(TSemantics theSemantics){
   this();

   fSemantics=theSemantics;
     }

   public TShape copy(){
      TInterpretationBoard newShape=new TInterpretationBoard();

      copyFieldsTo(newShape);
       return
           newShape;
        }

public void copyFieldsTo(TShape newShape){  // subclasses need to call super and just copy the fields
                                               // that your class defines
        super.copyFieldsTo(newShape);

        ((TInterpretationBoard)newShape).fSemantics=fSemantics;
                }


public void setSemantics(TSemantics theSemantics){
  fSemantics=theSemantics;

}

public TSemantics getSemantics(){
  return
      fSemantics;
}


    public void drawFrame(Graphics2D graphic){

// we'll make sure it's big enough first

      updateSize();

      graphic.draw(new Rectangle2D.Double(fXCoord-1, fYCoord-1,fWidth+1, fHeight+1));
      }



  public void drawInterior(Graphics2D graphic){
    int leftMargin = fXCoord + 5;
    int currentHeightMargin = fYCoord + 12;
    String tempStr;

    Composite originalComposite = graphic.getComposite();

    graphic.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER,
                                                    0.5F)); //half transparent

    graphic.fill(new Rectangle2D.Double(fXCoord, fYCoord, fWidth, fHeight));

    graphic.setComposite(originalComposite);

    graphic.setPaint(Color.black);

    tempStr = fSemantics.getCurrentUniverse();

    tempStr = TUtilities.separateStringWithCommas(tempStr);

    graphic.drawString("Universe= {" + tempStr + "} ", leftMargin,
                       currentHeightMargin);

    currentHeightMargin += 11;


    String[] currentProperties = fSemantics.getCurrentProperties();
    String possibleProperties = fSemantics.getPossibleProperties();

    for (int i = 0; i < currentProperties.length; i++) {
      if (currentProperties[i].length() > 0) {
        tempStr = currentProperties[i];
        tempStr = TUtilities.separateStringWithCommas(tempStr);

        graphic.drawString(possibleProperties.charAt(i) + "= {" + tempStr + "} ",
                           leftMargin, currentHeightMargin);

        currentHeightMargin += 11;
      }

    }


    String[] currentRelations = fSemantics.getCurrentRelations();
    String possibleRelations = fSemantics.getPossibleRelations();

    for (int i = 0; i < currentRelations.length; i++) {
      if (currentRelations[i].length() > 0) {
        tempStr = currentRelations[i];
        tempStr = TUtilities.intoOrderedPairs(tempStr);

        graphic.drawString(possibleRelations.charAt(i) + "= {" + tempStr + "} ",
                           leftMargin, currentHeightMargin);

        currentHeightMargin += 11;
      }

    }

    if (true) /*TPreferences.fIdentity||
       fUseIdentity)  This only draws if there are any*/ /* {
      String[] currentFunctions = fSemantics.getCurrentFunctions();
      String possibleFunctions = fSemantics.getPossibleFunctions();
      boolean functionsExist=false;

      String fancySuper= chSuperscript1+ "= {";


      for (int i = 0; i < currentFunctions.length; i++) {
        if (currentFunctions[i].length() > 0) {
          functionsExist=true;

          tempStr = currentFunctions[i];
          tempStr = TUtilities.intoOrderedPairs(tempStr);

          graphic.drawString(possibleFunctions.charAt(i) + fancySuper + tempStr + "} ",
                             leftMargin, currentHeightMargin);

          currentHeightMargin += 11;
        }

      }

      char[] currentIdentities = fSemantics.getCurrentIdentities();
      String possibleIdentities = fSemantics.getPossibleIdentities();

      for (int i = 0; i < currentIdentities.length; i++) {
         if (currentIdentities[i]!=' ') {

    graphic.drawString(possibleIdentities.charAt(i) + "= {" + currentIdentities[i] + "} ",
                       leftMargin, currentHeightMargin);

    currentHeightMargin += 11;
  }

}


      if (functionsExist){
        currentHeightMargin += 5;

        graphic.drawString("Instances of a function", leftMargin,currentHeightMargin);
        currentHeightMargin += 11;

        graphic.drawString("default to identity", leftMargin,currentHeightMargin);
        currentHeightMargin += 11;

      }

    }
  }


      public void resize(Point anchor, Point end){ //cannot resize board
                                               // we'll let them just follow the mouse
     // moveBy(end.x-(fXCoord+fWidth/2),end.y-(fYCoord+fHeight/2));

      }


void updateSize(){          // this makes it the right size for display, called by drawFrame
   int width;
   int height=2;

   width= fSemantics.getCurrentUniverse().length();

   String[] currentProperties=fSemantics.getCurrentProperties();

   for (int i=0;i<currentProperties.length;i++){    // look through all the possible properties here,
     if (currentProperties[i].length() > 0) { // not just the instantiated ones
       height += 1;
     }
   }

   String[] currentRelations=fSemantics.getCurrentRelations();

     for (int i=0;i<currentRelations.length;i++){    // look through all the possible properties here,
       int relationWidth=currentRelations[i].length();

       if (relationWidth>0){
         if (((2 * relationWidth) - 6 ) > width)
            width = ((2 * relationWidth) - 6);
         height+=1;
       }

   }

   String[] currentFunctions=fSemantics.getCurrentFunctions();
   boolean functionsExist=false;

     for (int i=0;i<currentFunctions.length;i++){    // look through all the possible properties here,
       int functionWidth=currentFunctions[i].length();

       if (functionWidth>0){
         functionsExist=true;
         if (((2 * functionWidth) - 6 ) > width)
            width = ((2 * functionWidth) - 6);
         height+=1;
       }
   }
   if (functionsExist)
     height+=2;       // this is to allow enough room for the default warning label

   char[] currentIdentities=fSemantics.getCurrentIdentities();

   for (int i=0;i<currentIdentities.length;i++){    // look through all the possible properties here,
     if (currentIdentities[i]!=chBlank) { // not just the instantiated ones
       height += 1;
     }
   }


   fHeight = (height + 1) * 10;

   width= 80 + width * 11 ;

   if (width < fMinWidth)
      width = fMinWidth;

   if (functionsExist)
     width+=5;       // this is to allow enough room for the default warning label

   fWidth=width;


      }


}




 */





/*  Old or unused code
 * 
 * 
 * 
 * 
 * //     svgCanvas.setSvgString(test); //mf need only remove suffix
     
   /*
    * 
 
    * 
    * 
    */  
     
    
     
     /*       var svgexample = '<svg width="640" height="480" xmlns:xlink="http://www.w3.org/1999/xlink" '+
                    'xmlns="http://www.w3.org/2000/svg"><g id="svg_1"><title>Layer 1</title><rect stroke-width="5" '+
                    'stroke="#000000" fill="#FF0000" id="svg_2" height="35" width="51" y="35" x="32"/>'+
                    '<g><ellipse ry="15" rx="24" '+
                    'stroke-width="5" stroke="#000000" fill="#0000ff" id="svg_3" cy="60" cx="66"/>'+
                    '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="24" id="svg_20" y="60" x="60"     fill="#000000">a</text>'+
                    '</g></g></svg>'; 
 *   // return prefix+currentSvg+newStr+suffix; 
  
    var ellipse='<ellipse ry="61" rx="90" id="svg_2" cy="123.5" cx="170" fill-opacity="0.5" stroke-opacity="0.5" stroke="#000000" fill="#FF0000"/>';

  var x=50; var y=50;
     
     var new2Str= '<ellipse ry="15" rx="24" '+
                    'stroke-width="5" stroke="#000000" fill="#0000ff" id="svg_3" cy="'+
                    y+'" '+ 'cx="'+x+'"/>';
 * 
 * 
 * 
 *   
  
  var test=
  '<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">'+
 '<g id="svg_1">'+
  '<title>Layer 1</title>'+
  '<ellipse ry="61" rx="90" id="svg_2" cy="123.5" cx="170" fill-opacity="0.5" stroke-opacity="0.5" stroke="#000000" fill="#FF0000"/>'+
 '</g>'+
'</svg>';
 * 
 */