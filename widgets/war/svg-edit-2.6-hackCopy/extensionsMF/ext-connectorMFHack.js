/*
 * ext-connector.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 *
 */

// Needs TUtilities.js
// Needs TInterpretationBoard.js

/* We'll just put in a polyline (on a mousedown) 
 * with this and let the built in connector.js do the dragging etc. MAYBE
 */

/* We need to find the location of the individuals */






var relationsMF=relationsMF||{};

relationsMF.gRelations="ABCDEFGHIJKLMNOPQRSTUVWXYZ";

relationsMF.makeRelation=function (name,from,to){
    var relation=null;
    
/*	  var style=svgCanvas.getStyle();
	// 100 x 100 rect by default
	  var relation = '<g id="svg_'+name+'g"><rect width="100" height="100" id="svg_'+name+'" y="'+y+'" x="'+x+'" '+
	          'fill="'+style.fill+'" '+
	          'fill-opacity="'+style.fill_opacity+'" '+
	          'opacity="'+style.opacity+'" '+
	          'stroke="'+style.stroke+'" '+
	          'stroke-opacity="'+style.stroke_opacity+'" '+
	          'stroke-width="'+style.stroke_width+'" />'+
	                    '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
	                    'id="svg_'+name+'t" y="'+(y+100)+'" x="'+(x+50)+'" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" '+
	                    'stroke-width="0" stroke="#000000" fill="#000000">'+name+'</text>'+
	                    '</g>';
	  
	    //fill-opacity="0.5" */
    
    var arrowDef=' <defs>'+
    '<marker id="Triangle" viewBox="0 0 20 20" refX="0" refY="10" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto">'+
    '<path d="m0,0l20,10l-20,10l0,-20z"/>'+
   '</marker>'+
   '</defs>';
   
   var mx=from.x;
   var my=from.y;
   var lx=to.x-mx;
   var ly=to.y-my;
   
   //we always want to shorten it a little and start it off-center
   //it can go left to right, r to l, top to bottom, bottom to top
   //circle radius is 11
   
   var lTor=(lx>0);
   var tTob=(ly>0);
   
   if (lTor){
       mx+=8;
       lx-=16;
   }
   else {
       mx-=8;
       lx+=16;
   }
   
   if (tTob){
       my+=8;
       ly-=16;
   }
   else {
       my-=8;
       ly+=16;
   }
    
    
    relation= '<path d="m'+mx+','+my+
            'l'+lx+','+ly+'" '+
            'marker-end="url(#Triangle)" marker-mid="url(#Rect)" fill="none" id="svg_11" stroke="black"/>';
    
	  return arrowDef+relation;   
    
    
    
	};
 
svgEditor.addExtension("Relations", function(S) {
    var svgcontent = S.svgcontent,
		svgroot = S.svgroot,
		getNextId = S.getNextId,
		getElem = S.getElem,
		addElem = S.addSvgElementFromJson,
		selManager = S.selectorManager,
		curConfig = svgEditor.curConfig,
		started = false,
		start_x,
		start_y,
		cur_line,
		start_elem,
		end_elem,
		connections = [],
		conn_sel = ".se_connector",
		se_ns,
// 			connect_str = "-SE_CONNECT-",
		selElems = [];
    
    	function findConnectors(elems) {
		if(!elems) elems = selElems;
		var connectors = $(svgcontent).find(conn_sel);
		connections = [];

		// Loop through connectors to see if one is connected to the element
		connectors.each(function() {
			var start = elData(this, "c_start");
			var end = elData(this, "c_end");
			
			var parts = [getElem(start), getElem(end)];
			for(var i=0; i<2; i++) {
				var c_elem = parts[i];
				var add_this = false;
				// The connected element might be part of a selected group
				$(c_elem).parents().each(function() {
					if($.inArray(this, elems) !== -1) {
						// Pretend this element is selected
						add_this = true;
					}
				});
				
				if(!c_elem || !c_elem.parentNode) {
					$(this).remove();
					continue;
				}
				if($.inArray(c_elem, elems) !== -1 || add_this) {
					var bb = svgCanvas.getStrokedBBox([c_elem]);
					connections.push({
						elem: c_elem,
						connector: this,
						is_start: (i === 0),
						start_x: bb.x,
						start_y: bb.y
					});	
				}
			}
		});
	}
	
	
	return {
		name: "Relations",
		svgicons: "extensionsMF/relations-icon.xml",
		buttons: [{
			id: "relations",
			type: "mode",
			icon: "extensionsMF/relations-icon.xml",
			title: "Relations between two objects",
	/* mf 		includeWith: {
				button: '#tool_line',
				isDefault: false,
				position: 1
			}, */
			events: {
				'click': function() {
					svgCanvas.setMode("relations");
									}
					}
				}],
				
				
	// This is triggered when the main mouse button is pressed down 
			// on the editor canvas (not the tool panels)
		mouseDown: function() {
			var mode = svgCanvas.getMode();
	//		alert("Debug— mouseDown" + mode);
				// Check the mode on mousedown
                        if(mode == "relations") {
                                    
       // we may as well do this on mouseDown, because we are not allowing them
       // to draw
       
                    /*new*/
                  //          var choice="";
                            var available=gInterpretationBoard.namesInSvg();
             
                            if(available.length===0)
                                alert("Sorry, your need to have some individuals");
                            else{
                                var reply1="";    
                                var reply2="";
                                var reply3="";
                                var from=null;
                                var to=null;
                  
                                available=relationsMF.gRelations;
                  
                                while (((reply1.length!==1)|| //not choose 1, choose several
                                    available.indexOf(reply1)===-1)) //not a permitted choice
                                    {
                                    reply1=prompt("Please choose just one single letter Relation name",available);
                       
                                    if (reply1==null||reply1=="")
                                    break;          //jumpout          
                                    }
                      
                            if (reply1!=null&& reply1!="") {  //not cancelled, got a Relation
                                available=gInterpretationBoard.namesInSvg();
                	 
                                while (((reply2.length!==1)|| //not choose 1, choose several
                                    available.indexOf(reply2)===-1)) //not a permitted choice
                                    {
                                    reply2=prompt("Please choose just one individual as the relation 'from'",available);
                            
                                    if (reply2==null||reply2=="")
                                    break;          //jumpout          
                                    } 
                	     
                            if (reply2!=null&& reply2!="") {    //not cancelled at second stage
                            while (((reply3.length!==1)|| //not choose 1, choose several
                                available.indexOf(reply3)===-1)) //not a permitted choice
                                {
                                reply3=prompt("Please choose a second just one individual as the relation 'to'",available);
                                 
                                 if (reply3==null||reply3=="")
                                     break;          //jumpout          
                                }
                                
                            if (reply3!=null&& reply3!="") {  //not cancelled 
                                
                                from=gInterpretationBoard.hotSpotOfIndividual(reply2);
                                to=gInterpretationBoard.hotSpotOfIndividual(reply3);
                            
                            if (from&&to){
                         
                                var relation=relationsMF.makeRelation(name,from,to);
                            
                                if (relation)              //no duplicate etc 
                                    augmentSvg(relation);                             
                                        }
                                
                            };
                           }   
                                                               
                       //
                         
                          
                       };
                       
                       
                      }
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    if(started) return;
				
	//				alert("Debug— mouseDown");
				
					// The returned object must include "started" with 
					// a value of true in order for mouseUp to be triggered
                                    return {started: true};
                                    }
	/*			else if(mode == "select") {
	//				alert("Debug— mouseDown");
					findConnectors();
				}	 */
					
			},
                        
            /*    mouseMove: function(opts) {
			var zoom = svgCanvas.getZoom();
			var e = opts.event;
			var x = opts.mouse_x/zoom;
			var y = opts.mouse_y/zoom;
			
			var	diff_x = x - start_x,
				diff_y = y - start_y;
								
			var mode = svgCanvas.getMode();
			
			if(mode == "connector" && started) {
				
				var sw = cur_line.getAttribute('stroke-width') * 3;
				// Set start point (adjusts based on bb)
				var pt = getBBintersect(x, y, elData(cur_line, 'start_bb'), getOffset('start', cur_line));
				start_x = pt.x;
				start_y = pt.y;
				
				setPoint(cur_line, 0, pt.x, pt.y, true);
				
				// Set end point
				setPoint(cur_line, 'end', x, y, true);
			} else if(mode == "select") {
				var slen = selElems.length;
				
				while(slen--) {
					var elem = selElems[slen];
					// Look for selected connector elements
					if(elem && elData(elem, 'c_start')) {
						// Remove the "translate" transform given to move
						svgCanvas.removeFromSelection([elem]);
						svgCanvas.getTransformList(elem).clear();

					}
				}
				if(connections.length) {
					updateLine(diff_x, diff_y);	
				}
			} 
		} , */
                
                
       /*         selectedChanged: function(opts) {
			// TODO: Find better way to skip operations if no connectors are in use
			if(!$(svgcontent).find(conn_sel).length) return;
			
			if(svgCanvas.getMode() == 'connector') {
				svgCanvas.setMode('select');
			}
			
			// Use this to update the current selected elements
			selElems = opts.elems;
			
			var i = selElems.length;
			
			while(i--) {
				var elem = selElems[i];
				if(elem && elData(elem, 'c_start')) {
					selManager.requestSelector(elem).showGrips(false);
					if(opts.selectedElement && !opts.multiselected) {
						// TODO: Set up context tools and hide most regular line tools
						showPanel(true);
					} else {
						showPanel(false);
					}
				} else {
					showPanel(false);
				}
			}
			updateConnectors();
		},  */
						
			}
});
