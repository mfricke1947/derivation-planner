
// Needs TUtilities.js
// Needs TInterpretationBoard.js

/* We'll just put in a path (on a mousedown) 
 */

/* We need to find the location of the individuals 
 * 
 * Use the markers-icons.xml
 * 
 * */

var identitiesMF=identitiesMF||{};

identitiesMF.gIdentities="abcdefghijklmnopqrstuv";

identitiesMF.makeIdentity=function (name,from,to){
    var relation=null;
    var iD='svg_identity'+name;
   
    var arrowDef=' <defs>'+  
    '<marker id="Triangle" viewBox="0 0 20 20" refX="0" refY="10" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto">'+
    '<path d="m0,0l20,10l-20,10l0,-20z"/>'+
   '</marker>'+
   '<marker id="Function'+name+'" viewBox="0 0 80 80" refX="0" refY="0" markerUnits="strokeWidth" markerWidth="80" markerHeight="80" >'+
 //   '<path d="m0,0l20,10l-20,10l0,-20z"/>'+
   '<text font-size="14" y="14" x="0">'+name+'</text>'+
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
            'l'+lx/2+','+ly/2+              //we need to split the line so
            'l'+lx/2+','+ly/2+'" '+        //as to have a mid-point (vertex)
            'id="'+iD+'" '+
            'marker-end="url(#Triangle)" marker-mid="url(#Function'+name+')" fill="none"  stroke="black"/>';
    
	  return arrowDef+relation;   
        
	};
               
 
svgEditor.addExtension("Identities", function(S) {
 	
	return {
		name: "Identities",
		svgicons: "extensionsMF/identities-icon.xml",
		buttons: [{
			id: "identities",
			type: "mode",
			icon: "extensionsMF/identities-icon.xml",
			title: "Alias of object",

			events: {
				'click': function() {
					svgCanvas.setMode("identities");
									}
					}
				}],
				
				
	// This is triggered when the main mouse button is pressed down 
			// on the editor canvas (not the tool panels)
		mouseDown: function() {
			var mode = svgCanvas.getMode();
	//		alert("Debug— mouseDown" + mode);
				// Check the mode on mousedown
                        if(mode == "identities") {
                                    
       // we may as well do this on mouseDown, because we are not allowing them
       // to draw
       
                    /*new*/
                  //          var choice="";
                            var inUse=gInterpretationBoard.namesInSvg(); //real individuals
                            var available=identitiesMF.gIdentities;
             
                            if(inUse.length===0)
                                alert("Sorry, your need to have some individuals");
                            else{
                                var reply1="";    
                       //         var reply2="";
                                var reply3="";
                                var from=null;
                                var to=null;
                             
                                var tempStr="";
                                var indexChar="";
                                
                                for (var i=0;i<identitiesMF.gIdentities.length;i++){
                                   indexChar=available.charAt(i);
                                   if ((inUse.indexOf(indexChar)===-1)&&  //not in universe
                                        !gInterpretationBoard.isIdentityDuplicate(indexChar)) //not already an identity
                                       tempStr+=indexChar;   
                                }
                                
                                available=tempStr;
                  
                                while (((reply1.length!==1)|| //not choose 1, choose several
                                    available.indexOf(reply1)===-1)) //not a permitted choice
                                    {
                                    reply1=prompt("Please choose just one single letter 'alias'",available);
                       
                                    if (reply1==null||reply1=="")
                                    break;          //jumpout          
                                    }
                      
                            if (reply1!=null&& reply1!="") {  //not cancelled, got a Function
                                available=gInterpretationBoard.namesInSvg();
                                
                                //need to take out members of universe
                                
                	 
                           /*     while (((reply2.length!==1)|| //not choose 1, choose several
                                    available.indexOf(reply2)===-1)) //not a permitted choice
                                    {
                                    reply2=prompt("Please choose just one individual as the function 'from'",available);
                            
                                    if (reply2==null||reply2=="")
                                    break;          //jumpout          
                                    } */ 
                	     
                          /*  if (reply2!=null&& reply2!=""){*/     //not cancelled at second stage
                            while (((reply3.length!==1)|| //not choose 1, choose several
                                available.indexOf(reply3)===-1)) //not a permitted choice
                                {
                                reply3=prompt("Please choose just one individual as the target of the alias",available);
                                 
                                 if (reply3==null||reply3=="")
                                     break;          //jumpout          
                                }
                                
                            if (reply3!=null&& reply3!="") {  //not cancelled 
                                
                               // from=gInterpretationBoard.hotSpotOfIndividual(reply2);
                                to=gInterpretationBoard.hotSpotOfIndividual(reply3);
                                var x= 40+Math.floor(Math.random()*101);
                                var y= 40+Math.floor(Math.random()*101);
                                
                                from=new TUtilities.point(x,y);
                       
                           //var randomnumber=Math.floor(Math.random()*11)             
                                        
                                        
                            if (from&&to){
                         
                                var relation=null;
                                
                               relation=identitiesMF.makeIdentity(reply1,from,to);
                                
                               if (!gInterpretationBoard.isIdentityDuplicate(reply1)){
                            
                                if (relation)              //no duplicate etc 
                                    augmentSvg(relation);                             
                                        }
                                    } 
                            };
                         
                                                               
                       //
                         
                          
                       };
                       
                       
                      }
   
                                    }

			},
                        
   
						
			}
});

