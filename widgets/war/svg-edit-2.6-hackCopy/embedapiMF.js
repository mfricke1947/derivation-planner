var svgCanvas = null;       
var globalSvgStr="";
var globalSvgIB;
       
var preloadSvg = (typeof preloadSvg === 'undefined') ? null : preloadSvg;
  


function getCurrentUniverse(){
        	return globalSvgIB.fCurrentUniverse;
        }
function getCurrentProperties(i){
        	return globalSvgIB.fCurrentProperties[i];
        }     
function getCurrentRelations(i){
        	return globalSvgIB.fCurrentRelations[i];
        }
function getCurrentFunctions(i){
	return globalSvgIB.fCurrentFunctions[i];
}
function getCurrentIdentities(){
	var s=globalSvgIB.fCurrentIdentities;  //char array, don't know why	
	return s.join("");
}
function getIndividualNames(){
        	return globalSvgIB.fIndividualNames;
        }
function getSvgStrSoftOpt(){    	
        	return globalSvgStr;
        } 
        
function handleUpdate(data, error) {
			if (error){
				alert('error ' + error);
			}
            else{
				globalSvgStr= data;
			}			
        }        
        
function init_embed() {
            var frame = document.getElementById('svgedit');
			svgCanvas = new embedded_svg_edit(frame);
			svgCanvas.setMode('select');  //nov 2013
			
			/*the iframe has a gInterpretationBoard but the top window does not*/
			globalSvgIB= frame.contentWindow.gInterpretationBoard||
															frame.gInterpretationBoard;		           
        }
        
function startSvg(){
        	init_embed();
        	loadSvg();       	
        }
      
function updateSvgStrSoftOpt(){
        	globalSvgStr="";
        	svgCanvas.getSvgString()(handleUpdate);    	
        }    
  
  
        function handleSvgData(data, error) {
			if (error)
			{
				alert('error ' + error);
			}
            else
			{
				alert('Congratulations. Your SVG string is back in the host page, do with it what you will\n\n' + data);
			}			
        }
        
        function loadSvg() {
 //         alert('load ' + preloadSvg);
 //           alert('canvas ' + svgCanvas);
 
            svgCanvas.setSvgString(preloadSvg);
            globalSvgStr=preloadSvg;
        }
        
		
		function saveSvg() {			
			svgCanvas.getSvgString()(handleSvgData);	
		}
		
		function clear() {			
			svgCanvas.clear();	// nov 2013
		}
		  
        
        
/* preload sample
'<svg width="560" height="400" xmlns="http://www.w3.org/2000/svg">'+
' <g id="svg_1">'+
'  <title>Shape</title>'+
'  <g id="svg_IBg">'+
'   <rect height="60" width="160" id="svg_IB" y="0" x="0" stroke="black" fill="none"/>'+
'   <text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" id="svg_line1" y="18" x="80" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#000000" fill="#000000">Universe={a,b,c}</text>'+
'   <text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" id="svg_line1" y="36" x="80" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#000000" fill="#000000">F={a}</text>'+
'   <text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" id="svg_line1" y="54" x="80" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#000000" fill="#000000">H={a}</text>'+
'  </g>'+
'  <g id="svg_ag">'+
'   <circle fill="none" stroke="black" cx="140" cy="164" id="svg_a" r="11"/>'+
'   <text fill="#000000" stroke="#000000" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="140" y="171" id="svg_at" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">a</text>'+
'  </g>'+
'  <g id="svg_bg">'+
'   <circle fill="none" stroke="black" cx="274" cy="182" id="svg_b" r="11"/>'+
'   <text fill="#000000" stroke="#000000" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="274" y="189" id="svg_bt" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">b</text>'+
'  </g>'+
'  <g id="svg_cg">'+
'   <circle fill="none" stroke="black" cx="374" cy="182" id="svg_c" r="11"/>'+
'   <text fill="#000000" stroke="#000000" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="374" y="189" id="svg_ct" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">c</text>'+
'  </g>'+
'  <g id="svg_Fg" opacity="0.5">'+
'   <rect stroke-width="5" stroke-opacity="null" stroke="#000000" fill-opacity="null" fill="#8FD8D8" x="63" y="115" id="svg_F" height="140" width="100"/>'+
'   <text fill="#000000" stroke="#000000" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="113" y="255" id="svg_Ft" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">F</text>'+
'  </g>'+
'  <g id="svg_Hg" opacity="0.5">'+
'   <rect stroke-width="5" stroke-opacity="null" stroke="#000000" fill-opacity="null" fill="#FF0000" x="83" y="82" id="svg_H" height="100" width="150"/>'+
'   <text fill="#000000" stroke="#000000" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="188" y="182" id="svg_Ht" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">H</text>'+
'  </g>'+
' </g>'+
'</svg>'



*/     
            
        