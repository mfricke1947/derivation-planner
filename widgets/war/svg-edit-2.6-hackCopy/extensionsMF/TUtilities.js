var TUtilities =TUtilities||{};


 TUtilities.parseSvgRect= function (rectStr){
   var rect=new TUtilities.rect(0,0,0,0);
   var width=0;var height=0;var x=0;var y=0;
   var start;
   var numStr="";
   var next;
   
   start=rectStr.indexOf(' x="');                   //getting x
   for (var i=start+4;i<rectStr.length-start;i++){
    next=rectStr.charAt(i);
    if (next!=='"')
        numStr+=next;
    else
        break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return rect;
    else
        x=parseInt(numStr);
                
                
    numStr="";                                    //getting y
                start=rectStr.indexOf(' y="');
                for (var i=start+4;i<rectStr.length-start;i++){
                    next=rectStr.charAt(i);
                    if (next!=='"')
                        numStr+=next;
                    else
                        break;               
                }
                
                if (isNaN(parseInt(numStr)))
                    return rect;
                else
                    y=parseInt(numStr);
    
   numStr="";
   
   start=rectStr.indexOf(' width="');                   //getting width
   for (var i=start+8;i<rectStr.length-start;i++){
    next=rectStr.charAt(i);
    if (next!=='"')
        numStr+=next;
    else
        break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return rect;
    else
        width=parseInt(numStr);   
    
   numStr="";

start=rectStr.indexOf(' height="');                   //getting height
   for (var i=start+9;i<rectStr.length-start;i++){
    next=rectStr.charAt(i);
    if (next!=='"')
        numStr+=next;
    else
        break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return rect;
    else
        height=parseInt(numStr);  
    
    rect.height=height;
    rect.width=width;
    rect.x=x;
    rect.y=y;
    
    return rect;
 };
 
  TUtilities.parseSvgFunction= function (relationStr){
 /* A relation looks like this

   <path stroke="black" fill="none" marker-mid="url(#Rect)" marker-end="url(#Triangle)" 
   id="svg_functiona" d="m113,196l153,-6"/>
 
 i.e. it contains a direction string in the middle somewhere
     This should return two points which are the ends of the path.
     We have the start from moveTo; getting the end is more tricky
     but we use only simple paths, (straight line or circle)
 */
     
     
   var start=new TUtilities.point(0,0);
   var end=new TUtilities.point(0,0);
   var width=0;var height=0;var x=0;var y=0;
   var scanIndex=0;
   var numStr="";
   var next;
   var lineIndex=0;
   var prefix=' d="m';
 
   var path=relationStr;
   var reflexive=false;    //some relations are reflexive ie Raa not Rab
   
   if (relationStr.indexOf('Reflexive')>-1)
       reflexive=true;
      
//we need to get the path out of here, out of d="m113,196l153,-6"
 //nowadays the pathstring is d="m113,196l76,-3l76,-3"
 // ie the length drawing is split in half so as to permit
 // a mid point vertex and marker
 
        path=relationStr.substring(relationStr.indexOf(prefix)+
                prefix.length);
        path=path.substring(0,path.indexOf('"'));
   
     //path now, say m113,196l153,-6
      
   for (var i=scanIndex;i<path.length;i++){
    next=path.charAt(i);
    if (next!==',')
        numStr+=next;
    else{
        scanIndex=i;
        break;
    }
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];       //error, exit function
    else
        start.x=parseInt(numStr);
                
                
    numStr="";                     //getting y for the start point
    scanIndex+=1;          // skip the comma                 
    for (var i=scanIndex;i<path.length;i++){
        next=path.charAt(i);
        if (next!=='l') // l for line is the terminator
            numStr+=next;
        else
            break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];     //error, exit function
    else
        start.y=parseInt(numStr);  //workd to hrtr
    
    if (reflexive){
        end.x=start.x;
        end.y=start.y;
    }
    else{
     
      //in our case we need to get the last move and last line to get the end
   
     var lastMIndex=path.lastIndexOf("m");
     lineIndex=path.indexOf("l",lastMIndex);
   
     numStr="";
   
     for (var i=lineIndex+1;i<path.length;i++){ //step past l
        next=path.charAt(i);
        if (next!==',')
            numStr+=next;
        else{
            lineIndex=i;
            break;
        }
     }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];       //error, exit function
    else
        end.x=(2*parseInt(numStr))+start.x;  //the move plus the 1/2 line twice
   
   numStr="";                     //getting y for the end point
    lineIndex+=1;          // skip the comma                 
    for (var i=lineIndex;i<path.length;i++){
        next=path.charAt(i);
        if (next!=='"') // quote is the terminator
            numStr+=next;
        else
            break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];     //error, exit function
    else
        end.y=(2*parseInt(numStr))+start.y;
}
    
    return [start,end];
 };
 
  TUtilities.parseSvgIdentity= function (relationStr){
 /* A relation looks like this

   <path stroke="black" fill="none" marker-mid="url(#Rect)" marker-end="url(#Triangle)" 
   id="svg_functiona" d="m113,196l153,-6"/>
 
 i.e. it contains a direction string in the middle somewhere
     This should return two points which are the ends of the path.
     We have the start from moveTo; getting the end is more tricky
     but we use only simple paths, (straight line or circle)
 */
     
     
   var start=new TUtilities.point(0,0);
   var end=new TUtilities.point(0,0);
   var width=0;var height=0;var x=0;var y=0;
   var scanIndex=0;
   var numStr="";
   var next;
   var lineIndex=0;
   var prefix=' d="m';
 
   var path=relationStr;

      
//we need to get the path out of here, out of d="m113,196l153,-6"
 //nowadays the pathstring is d="m113,196l76,-3l76,-3"
 // ie the length drawing is split in half so as to permit
 // a mid point vertex and marker
 
        path=relationStr.substring(relationStr.indexOf(prefix)+
                prefix.length);
        path=path.substring(0,path.indexOf('"'));
   
     //path now, say m113,196l153,-6
      
   for (var i=scanIndex;i<path.length;i++){
    next=path.charAt(i);
    if (next!==',')
        numStr+=next;
    else{
        scanIndex=i;
        break;
    }
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];       //error, exit function
    else
        start.x=parseInt(numStr);
                
                
    numStr="";                     //getting y for the start point
    scanIndex+=1;          // skip the comma                 
    for (var i=scanIndex;i<path.length;i++){
        next=path.charAt(i);
        if (next!=='l') // l for line is the terminator
            numStr+=next;
        else
            break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];     //error, exit function
    else
        start.y=parseInt(numStr);  //workd to hrtr
    
   
     
      //in our case we need to get the last move and last line to get the end
   
     var lastMIndex=path.lastIndexOf("m");
     lineIndex=path.indexOf("l",lastMIndex);
   
     numStr="";
   
     for (var i=lineIndex+1;i<path.length;i++){ //step past l
        next=path.charAt(i);
        if (next!==',')
            numStr+=next;
        else{
            lineIndex=i;
            break;
        }
     }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];       //error, exit function
    else
        end.x=(2*parseInt(numStr))+start.x;  //the move plus the 1/2 line twice
   
   numStr="";                     //getting y for the end point
    lineIndex+=1;          // skip the comma                 
    for (var i=lineIndex;i<path.length;i++){
        next=path.charAt(i);
        if (next!=='"') // quote is the terminator
            numStr+=next;
        else
            break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];     //error, exit function
    else
        end.y=(2*parseInt(numStr))+start.y;

    
    return [start,end];  //we are parsing start and end, but don't care about start
 };
 
 TUtilities.parseSvgRelation= function (relationStr){
 /* A relation looks like this

   <path stroke="black" fill="none" marker-mid="url(#Rect)" marker-end="url(#Triangle)" 
   id="svg_relationA" d="m113,196l153,-6"/>
 
 i.e. it contains a direction string in the middle somewhere
     This should return two points which are the ends of the path.
     We have the start from moveTo; getting the end is more tricky
     but we use only simple paths, (straight line or circle)
 */
     
     
   var start=new TUtilities.point(0,0);
   var end=new TUtilities.point(0,0);
   var width=0;var height=0;var x=0;var y=0;
   var scanIndex=0;
   var numStr="";
   var next;
   var lineIndex=0;
   var prefix=' d="m';
 
   var path=relationStr;
   var reflexive=false;    //some relations are reflexive ie Raa not Rab
   
   if (relationStr.indexOf('Reflexive')>-1)
       reflexive=true;
      
//we need to get the path out of here, out of d="m113,196l153,-6"
 //nowadays the pathstring is d="m113,196l76,-3l76,-3"
 // ie the length drawing is split in half so as to permit
 // a mid point vertex and marker
 
        path=relationStr.substring(relationStr.indexOf(prefix)+
                prefix.length);
        path=path.substring(0,path.indexOf('"'));
   
     //path now, say m113,196l153,-6
      
   for (var i=scanIndex;i<path.length;i++){
    next=path.charAt(i);
    if (next!==',')
        numStr+=next;
    else{
        scanIndex=i;
        break;
    }
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];       //error, exit function
    else
        start.x=parseInt(numStr);
                
                
    numStr="";                     //getting y for the start point
    scanIndex+=1;          // skip the comma                 
    for (var i=scanIndex;i<path.length;i++){
        next=path.charAt(i);
        if (next!=='l') // l for line is the terminator
            numStr+=next;
        else
            break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];     //error, exit function
    else
        start.y=parseInt(numStr);  //workd to hrtr
    
    if (reflexive){
        end.x=start.x;
        end.y=start.y;
    }
    else{
     
      //in our case we need to get the last move and last line to get the end
   
     var lastMIndex=path.lastIndexOf("m");
     lineIndex=path.indexOf("l",lastMIndex);
   
     numStr="";
   
     for (var i=lineIndex+1;i<path.length;i++){ //step past l
        next=path.charAt(i);
        if (next!==',')
            numStr+=next;
        else{
            lineIndex=i;
            break;
        }
     }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];       //error, exit function
    else
        end.x=(2*parseInt(numStr))+start.x;  //the move plus the 1/2 line twice
   
   numStr="";                     //getting y for the end point
    lineIndex+=1;          // skip the comma                 
    for (var i=lineIndex;i<path.length;i++){
        next=path.charAt(i);
        if (next!=='"') // quote is the terminator
            numStr+=next;
        else
            break;               
    }
                
    if (isNaN(parseInt(numStr)))
        return [null,null];     //error, exit function
    else
        end.y=(2*parseInt(numStr))+start.y;
}
    
    return [start,end];
 };
 
 
 
 TUtilities.point=function (x, y) {
  this.x = x;
  this.y = y;
}

 TUtilities.rect=function (width,height,x, y) {
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
}
 
 TUtilities.rectAndRemainder=function (svgStr ){  //this returns the first rectStr and the remainer
var start =svgStr.search(/(svg_)[A-Z]g\"/);       // finds first start of a rect Group
var end=0;
var rectStr="";
var tailStr="";
var remainder="";
var name="";

if (start===-1)
    return [null,null,name];
else{
   name=svgStr.charAt(start+"svg_".length); // the name is the upcase letter
   start+="svg_Ag\">".length;              //advance to interior of group, the A is just a spacer
   tailStr=svgStr.substring(start); //drop the front
   end =tailStr.search(/<\/g>/)+"</g>".length;
   remainder=tailStr.substring(end);
   rectStr=tailStr.substring(0,end);
//   name=rectStr.charAt("svg_".length);
   
   return [rectStr,remainder,name];
        
}
    
};


/* A relation looks like this
 * 
   <path stroke="black" fill="none" marker-mid="url(#Rect)" marker-end="url(#Triangle)" 
   id="svg_relationA" d="m113,196l153,-6"/>
 
 i.e. it contains an id in the middle somewhere
 */
 TUtilities.relationAndRemainder=function (svgStr ){  //this returns the first rectStr and the remainer
var name="";
//var idIndex =svgStr.search(/(svg_relation)[A-Z]\"/);       // finds first start of a rect Group
var idIndex =svgStr.search(/((svg_relation)[A-Z]\"|(svg_relation)[A-Z](Reflexive)\")/);       // finds first start of a rect Group

if (idIndex===-1)
    return [null,"",name];
else{
    name=svgStr.substring(idIndex+12,idIndex+13); // eg svg_relationA (we want the A)
    var openIndex=svgStr.lastIndexOf("<",idIndex);
    var closeIndex=svgStr.indexOf(">",idIndex);
    return [svgStr.substring(openIndex,closeIndex+1),svgStr.substring(closeIndex+1),name];
    }
};

TUtilities.functionAndRemainder=function (svgStr ){  //this returns the first rectStr and the remainer
var name="";

var idIndex =svgStr.search(/((svg_function)[a-z]\"|(svg_function)[a-z](Reflexive)\")/);       // finds first start of a rect Group

if (idIndex===-1)
    return [null,"",name];
else{
    name=svgStr.substring(idIndex+12,idIndex+13); // eg svg_relationA (we want the A)
    var openIndex=svgStr.lastIndexOf("<",idIndex);
    var closeIndex=svgStr.indexOf(">",idIndex);
    return [svgStr.substring(openIndex,closeIndex+1),svgStr.substring(closeIndex+1),name];
    }
};

TUtilities.identityAndRemainder=function (svgStr ){  //this returns the first rectStr and the remainer
var name="";

var idIndex =svgStr.search(/(svg_identity)[a-z]\"/);       // finds first start of a rect Group

if (idIndex===-1)
    return [null,"",name];
else{
    name=svgStr.substring(idIndex+12,idIndex+13); // eg svg_relationA (we want the A)
    var openIndex=svgStr.lastIndexOf("<",idIndex);
    var closeIndex=svgStr.indexOf(">",idIndex);
    return [svgStr.substring(openIndex,closeIndex+1),svgStr.substring(closeIndex+1),name];
    }
};
 
 
 TUtilities.removeDuplicates=function (string ){
    var unique='';

    for(var i=0; i<string.length; i++){
        
        if(string.lastIndexOf(string[i]) === i){
            unique += string[i];
        }
    }
    return unique;
};
 
 
TUtilities.separateStringWithCommas =function(inputStr){
    var outputStr="";
    
    for (i=0;i<inputStr.length;i++){
          outputStr+=inputStr.charAt(i);
          if (i<(inputStr.length-1))
             outputStr+=",";
        };
  return outputStr;   
}

/*
static public String separateStringWithCommas(String inputStr){
     StringBuffer tempBuffer = new StringBuffer("");

        for (int i=0;i<inputStr.length();i++){
          tempBuffer.append(inputStr.charAt(i));
          if (i<(inputStr.length()-1))
             tempBuffer.append(",");
        }
        return
            tempBuffer.toString();

  }
*/

TUtilities.intoOrderedPairs =function(inputStr){
    var outputStr="";
    var i=0;
    
    while (i<inputStr.length){    //expecting pairs     
        if (i>1)
            outputStr+=(',');       
        outputStr+='('+inputStr.charAt(i)+','+inputStr.charAt(i+1)+')';      
        i+=2;      
    }
  return outputStr;   
}

/*
 * 
static public String intoOrderedPairs(String inputStr){
       StringBuffer tempBuffer = new StringBuffer("");

       int i=0;

          while (i<inputStr.length()){    //expecting pairs

            if (i>1)
               tempBuffer.append(",");

            tempBuffer.append("<");
            tempBuffer.append(inputStr.charAt(i));
            i+=1;
            tempBuffer.append(inputStr.charAt(i));
            tempBuffer.append(">");
            i+=1;
          }
          return
              tempBuffer.toString();
    }
 */