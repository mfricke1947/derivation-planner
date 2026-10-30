/*
 * This makes sure the drawing is correct and the IBoard fits it
 */

// Needs TUtilities.js

/*
 * 
 * @type @exp;gInterpretationBoard|TInterpretationBoard
 * 
 * working on relations Dec 16
 */

var gInterpretationBoard =gInterpretationBoard||new TInterpretationBoard();

/****************** The TInterpretationBoard object **********************/

function TInterpretationBoard (){
    
this.fIndividualNames="abcdefghijklmnopqrstuv";  //the global individual names
this.fExtentRects=new Array(this.fIndividualNames.length);
this.fHotSpots=new Array(this.fIndividualNames.length); //points objects like {x:23,y:0}

//var fPossiblePropositions=TParser.gPredicates;
this.fPossibleProperties="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //TParser.gPredicates;
this.fPossibleRelations="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //TParser.gPredicates;
this.fPossibleFunctions="abcdefghijklmnopqrstuvwxyz";//TParser.gFunctors;
this.fPossibleIdentities="abcdefghijklmnopqrstuv";//TParser.gFunctors;
/*private String fPossibleIdentities=TParser.gZeroFunctors;*/
    
this.fCurrentProperties= new Array(this.fPossibleProperties.length);  /*
                                  array of stsrings. the index is the index of the properties in the
                                  fPossibleProperties eg  1 ie 'B' to strings eg "cfg" which
                                  are the individuals those properties apply to*/
this.fCurrentRelations= new Array(this.fPossibleRelations.length);  /*the index is the index of the relations in the
                                 fPossibleRelations eg  1 ie 'B' to strings of ordered
                                 pais eg "cfgc" which
                                 are the pairs of individuals those relations apply to*/
 
this.fCurrentFunctions= new Array(this.fPossibleFunctions.length);  /*the index is the index of the functions in the
                                fPossibleFunctions eg  1 ie 'b' to strings of ordered
                                pais eg "cfgc" which
                                are the pairs of individuals those functions apply to*/
this.fCurrentIdentities= new Array(this.fPossibleIdentities.length);    
/*private char [] fCurrentIdentities;  /*the index is the index of the character in the
                               fPossibleIdentities eg  1 ie 'b' to a char eg 'c' which
                               the individual that b is identical to. The identities are
                               zero-ary functors, so the index is the name of the functor
                               and the entry here is the value.*/
   
    
    
this.fCurrentUniverse="";

this.hotSpotOfIndividual= function (indName){
    var hotSpot=null;
     
    this.updateUniverse();

    if (this.fCurrentUniverse.indexOf(indName)===-1)
        return null;

    var individualIndex=this.fIndividualNames.indexOf(indName);

    hotSpot=this.fHotSpots[individualIndex];

    return hotSpot;
};
    
    
this.hotSpotInRect= function (hotSpot,rect){
        
if ((hotSpot.x>rect.x&&hotSpot.x<rect.x+rect.width) &&
    (hotSpot.y>rect.y&&hotSpot.y<rect.y+rect.height))
    return true;
else
    return false;   
};
    
this.initializeCharArray= function (aCharArray){
	var chBlank=' ';

    for(i=0;i<aCharArray.length;i++){
      aCharArray[i]=chBlank;
    };

};    


this.initializeStringArray= function (aStringArray){

      for(i=0;i<aStringArray.length;i++){
        aStringArray[i]="";
      };

};   
    
this.makeInterpretationBoard=function (svgString){
    // the individuals are unique and so can be used for svg ids

        var names=this.namesInSvgString(svgString);
        var properties=this.propertiesInSvg();
        var relations=this.relationsInSvg();
        var functions=this.functionsInSvg();
        var identities=this.identitiesInSvg();
     
        var height=(1+properties.length+ relations.length + 
                    functions.length + identities.length)*20;
        var line1= 'Universe={'+TUtilities.separateStringWithCommas(names)+'}';
        var width=(line1.length)*10;


        var x=0; var y=0;

        var board = '<g id="svg_IBg">'+
          '<rect height="'+height+'" width="'+width+'" stroke-width="1" id="svg_IB" y="0" x="0" stroke="black" fill="none" />'+
          '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
          'id="svg_line1" y="'+(y+18)+'" x="'+width/2+'"    '+
          ' fill="#000000">'+line1+'</text>';
   
        board+=this.writeProperties(properties,x,y,width); //note, passed by value
        
        //each property line height is 18, so increment y 
        
        y+=properties.length*18;
    
        board+=this.writeRelations(relations,x,y,width); //note, passed by value

        y+=relations.length*18;
    
        board+=this.writeFunctions(functions,x,y,width); //note, passed by value
        
        y+=functions.length*18;
    
        board+=this.writeIdentities(identities,x,y,width); //note, passed by value

        y+=identities.length*18;  // don't need this
      
    board+= '</g>';
    
    
        return board;   
};


this.writeProperties=function (properties,x,y,width){
    var outputStr="";
    var propertyName;
    var propertyIndex=-1;
    var propertyExtension
    
    for (var i=0;i<properties.length;i++){
            propertyName=properties.charAt(i);
            propertyIndex=this.fPossibleProperties.indexOf(propertyName);          
            propertyExtension=this.fCurrentProperties[propertyIndex];
            
          outputStr+='<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
          'id="svg_line1" y="'+(y+(i+2)*18)+'" x="'+width/2+'"    '+
          ' fill="#000000">'
          +propertyName+
          '={'+
          TUtilities.separateStringWithCommas(propertyExtension)+
          '}</text>';
      
        }
    return outputStr;       
};

this.writeRelations=function (relations,x,y,width){
    var outputStr="";
    var relationName;
    var relationIndex=-1;
    var relationExtension;
    
    for (var i=0;i<relations.length;i++){
            relationName=relations.charAt(i);
            relationIndex=this.fPossibleRelations.indexOf(relationName);          
            relationExtension=this.fCurrentRelations[relationIndex];
            
          outputStr+='<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
          'id="svg_line2" y="'+(y+(i+2)*18)+'" x="'+width/2+'"    '+
          ' fill="#000000">'
          +relationName+
          '={'+
          TUtilities.intoOrderedPairs(relationExtension)+
          '}</text>';
      
        }
    return outputStr;
};

this.writeFunctions=function (relations,x,y,width){
    var outputStr="";
    var relationName;
    var relationIndex=-1;
    var relationExtension;
    
    for (var i=0;i<relations.length;i++){
            relationName=relations.charAt(i);
            relationIndex=this.fPossibleFunctions.indexOf(relationName);          
            relationExtension=this.fCurrentFunctions[relationIndex];
            
          outputStr+='<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
          'id="svg_line2" y="'+(y+(i+2)*18)+'" x="'+width/2+'"    '+
          ' fill="#000000">'
          +relationName+
          '={'+
          TUtilities.intoOrderedPairs(relationExtension)+
          '}</text>';
      
        }
    return outputStr;
};

this.writeIdentities=function (relations,x,y,width){
    var outputStr="";
    var relationName;
    var relationIndex=-1;
    var relationExtension;
    
    for (var i=0;i<relations.length;i++){
            relationName=relations.charAt(i);
            relationIndex=this.fPossibleIdentities.indexOf(relationName);          
            relationExtension=this.fCurrentIdentities[relationIndex];
            
            var debug=relationExtension.length;
            
            
          outputStr+='<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
          'id="svg_line2" y="'+(y+(i+2)*18)+'" x="'+width/2+'"    '+
          ' fill="#000000">'
          +relationName+
          '={'+
         /* TUtilities.separateStringWithCommas(*/relationExtension/*)*/+
          '}</text>';
      
        }
    return outputStr;
};



this.namesInSvg=function (){
    var currentSvg="";
    
    if (window.svgCanvas)  //new Dec 2013
        currentSvg= svgCanvas.getSvgString();
   
  return this.namesInSvgString(currentSvg);  
};

this.namesInSvgString=function(svgString){
    var namesArray= svgString.match(/(svg_)[a-v]\"/g);  
    var names="";
    
    if (namesArray!==null){
        namesArray=namesArray.sort();
        for (i=0;i<namesArray.length;i++)
            names+=namesArray[i].charAt(4);     
    };
   
  return names;  
};

/************* Mainly Properties ******************************/

this.propertiesInSvg=function (){
    var currentSvg="";
    
    if  (window.svgCanvas)  //new Dec 2013
        currentSvg= svgCanvas.getSvgString();
   
  return this.propertiesInSvgString(currentSvg);  
};

this.propertiesInSvgString=function (svgString){
    var propertiesArray= svgString.match(/(svg_)[A-Z]\"/g);
    
    var properties="";
    
    if (propertiesArray){
        propertiesArray=propertiesArray.sort();
    
        if (propertiesArray!==null){
            for (var i=0;i<propertiesArray.length;i++)
                properties+=propertiesArray[i].charAt(4);     
        };
    
        properties=TUtilities.removeDuplicates(properties);
    }
   
  return properties;  
};


/************* End of Mainly Properties ******************************/


/************* Mainly Relations ******************************/

this.relationsInSvg=function (){
    var currentSvg="";
    
    if  (window.svgCanvas)  //new Dec 2013
        currentSvg= svgCanvas.getSvgString();
   
  return this.relationsInSvgString(currentSvg);  
};

this.relationsInSvgString=function (svgString){
    // a relation marker looks like this svg_relationA where A is the relation
    
    var relationsArray= svgString.match(/(svg_relation)[A-Z]/g);
    
    var relations="";
    
    if (relationsArray){
        relationsArray=relationsArray.sort();
    
        if (relationsArray!==null){
            for (var i=0;i<relationsArray.length;i++)
                relations+=relationsArray[i].charAt(12);     
        };
    
        relations=TUtilities.removeDuplicates(relations);
    }
   
  return relations;  
};

/************* End of Mainly Relations ******************************/

/************* Mainly Functioons ******************************/

this.functionsInSvg=function (){
    var currentSvg="";
    
    if  (window.svgCanvas)  //new Dec 2013
        currentSvg= svgCanvas.getSvgString();
   
  return this.functionsInSvgString(currentSvg);  
};

this.functionsInSvgString=function (svgString){
    // a relation marker looks like this svg_relationA where A is the relation
    
    var relationsArray= svgString.match(/(svg_function)[a-z]/g);
    
    var relations="";
    
    if (relationsArray){
        relationsArray=relationsArray.sort();
    
        if (relationsArray!==null){
            for (var i=0;i<relationsArray.length;i++)
                relations+=relationsArray[i].charAt(12);     
        };
    
        relations=TUtilities.removeDuplicates(relations);
    }
   
  return relations;  
};

/************* End of Mainly Functions ******************************/

/************* Mainly Idneities ******************************/

this.identitiesInSvg=function (){
    var currentSvg="";
    
    if  (window.svgCanvas)  //new Dec 2013
        currentSvg= svgCanvas.getSvgString();
   
  return this.identitiesInSvgString(currentSvg);  
};

this.identitiesInSvgString=function (svgString){
    // a relation marker looks like this svg_relationA where A is the relation
    
    var relationsArray= svgString.match(/(svg_identity)[a-z]/g);
    
    var relations="";
    
    if (relationsArray){
        relationsArray=relationsArray.sort();
    
        if (relationsArray!==null){
            for (var i=0;i<relationsArray.length;i++)
                relations+=relationsArray[i].charAt(12);     
        };
    
        relations=TUtilities.removeDuplicates(relations);
    }
   
  return relations;  
};

/************* End of Mainly Identities ******************************/



var oldSvgNames="";
var oldSvgProperties="";
var oldSvgRelations="";
var oldSvgFunctions="";
var oldSvgIdentities="";
      


this.svgCheck=function (){
var currentSvgNames=this.namesInSvg();  //check individuals only if check whole string propeprties are rotated
var currentSvgProperties=this.propertiesInSvg(); // we'll need to look at drag resize
var currentSvgRelations=this.relationsInSvg();
var currentSvgFunctions=this.functionsInSvg();
var currentSvgIdentities=this.identitiesInSvg();

var update=false;

if (currentSvgNames!==oldSvgNames){
    oldSvgNames=currentSvgNames;
    update=true;
}

if (currentSvgProperties!==oldSvgProperties){
    oldSvgProperties=currentSvgProperties;
    update=true;
}

if (currentSvgFunctions!==oldSvgFunctions){
    oldSvgFunctions=currentSvgFunctions;
    update=true;
}

if (currentSvgIdentities!==oldSvgIdentities){
    oldSvgIdentities=currentSvgIdentities;
    update=true;
}

this.updateUniverse();
   
if  (window.svgCanvas)  { //new Dec 2013
        var currentSvg= svgCanvas.getSvgString();
        if (this.updateProperties(currentSvg))
            update=true;
        
        if (this.updateRelations(currentSvg))
            update=true; 
        
        if (this.updateFunctions(currentSvg))
            update=true;
        
        if (this.updateIdentities(currentSvg))
            update=true;
      };

if (update)
    updateSvgIBoard();      
};



this.updateUniverse= function(){
  var currentUniverse= this.namesInSvg();    
       
    this.fCurrentUniverse= currentUniverse;
    
    
    var currentSvg="";
    
    if  (window.svgCanvas)  { //new Dec 2013
        currentSvg= svgCanvas.getSvgString();
        var temp;
        var x=0; var y=0;var start=0; var numStr=""; var next="";
    
        for (var i=0;i<currentUniverse.length;i++){
            numStr="";
            
            var individual=currentUniverse.charAt(i);
            var individualIndex=this.fIndividualNames.indexOf(individual);
            temp=currentSvg.split("svg_"+individual+"g\">",2); // the tags have the form svg_ag">
            x=0;y=0;
            
            if (temp&&temp[1]){    // temp{1] will be <circle etc.
                start=temp[1].indexOf('x="');
                for (var j=start+3;j<currentSvg.length-start;j++){
                    next=temp[1].charAt(j);
                    if (next!=='"')
                        numStr+=next;
                    else
                        break;               
                }
                
                if (!isNaN(parseInt(numStr)))
                    x=parseInt(numStr);
                
                
                numStr="";
                start=temp[1].indexOf('y="');
                for (var k=start+3;k<currentSvg.length-start;k++){
                    next=temp[1].charAt(k);
                    if (next!=='"')
                        numStr+=next;
                    else
                        break;               
                }
                
                if (!isNaN(parseInt(numStr)))
                    y=parseInt(numStr);
            }
            
            this.fHotSpots[individualIndex] = new TUtilities.point(x,y);
            
    //        var test =fHotSpots[individualIndex].x;
            
       }
  //     numStr="";
        
    }
   };
   
/*
 * 
For example, if we have a rectangle defined by

<rect id="R" onclick="Here()" x="155" y="125"
height="30" width="80"
stroke="black" stroke-width="2" fill="green"
opacity=".5"/>
then document.getElementById("R").getAttributeNS(null, "fill") would return the value "green."
 * 
 * 
 * 
 */   
   
   
   
/*
  boolean updateUniverse(){
      boolean changed=false;
      TShape theShape;
      String tempStr="";

      if (fShapes.size() > 0) {
         Iterator iter = fShapes.iterator();

         while (iter.hasNext()){
           theShape = (TShape) iter.next();

           if ((!theShape.getSelected())&&theShape.fTypeID==TShape.IDIndividual){
             tempStr = tempStr + theShape.fName;

             int index = fIndividualNames.indexOf(theShape.fName);
             fExtentRects[index] = theShape.getBoundsRect();
             fHotSpots[index] = ( (TIndividual) theShape).getHotSpot();
           }
         }
         char [] temp = tempStr.toCharArray();
         Arrays.sort(temp);
         tempStr= new String(temp);

         if (!tempStr.equals(fCurrentUniverse)){
           fCurrentUniverse = tempStr;
           changed = true;
         }

      }

      return
          changed;   //gIndividualNames
    }
 */


   this.updateProperties= function(svgString){ // presuppose here that the universe has been updated first
    var individualName="";
    var individualIndex=0;
    var tempStr="";
    var propertiesArray;
    var hotSpot;
    var rect;
    var propertyName;
    var propertyIndex;
    
    var test;
      
    var tempProperties = new Array(this.fPossibleProperties.length);
    
    this.initializeStringArray(tempProperties);             // all to nullStr
    
    for (var j = 0; j < this.fCurrentUniverse.length; j++) { // we are running through the names of the individuals in the universe of the diagram
       individualName = this.fCurrentUniverse.charAt(j);
       
       individualIndex = this.fIndividualNames.indexOf(individualName);

       hotSpot= this.fHotSpots[individualIndex];

       tempStr = "";
       
       // now we are going to run through the shapes to see which are properties applying to that individual
       
       // we want to split the svg string into rectangles
       
       
       test= TUtilities.rectAndRemainder(svgString);
       
       while (test[0]!==null){
           rect=TUtilities.parseSvgRect(test[0]);
           
           if (this.hotSpotInRect(hotSpot,rect)){  //check whether individual has property
               propertyName=test[2];
               propertyIndex=this.fPossibleProperties.indexOf(propertyName);
               
               tempStr=tempProperties[propertyIndex];
               
               if (tempStr.indexOf(individualName) < 0){               // no duplicates
                 tempStr = tempStr + individualName;
                 tempProperties[propertyIndex]=tempStr;                 //update               
                 };
           
           }
            
       test=TUtilities.rectAndRemainder(test[1]); // go on to next rectangle              
    }
     
   }

         // at this point the tempProperties array should be good but we now need
         // to see if the real one is any different and update if so
    
    var changed=false;

    for (var i=0;i<this.fPossibleProperties.length;i++){ // running through the properties

   //    propertyKey = fPossibleProperties.charAt(i);

       tempStr=tempProperties[i];

       if (!(tempStr===(this.fCurrentProperties[i]))) {
           changed = true;
           this.fCurrentProperties[i]=tempStr;
       }

    }

   return changed;
    };



/*
boolean updateProperties(){   // presuppose here that the universe has been updated first
      boolean changed = false;
      String tempStr = "";
      char propertyKey;
      int individualIndex;
      int propertyIndex;
      char individualName;
      String [] tempProperties;


   tempProperties = new String[fPossibleProperties.length()];
   initializeStringArray(tempProperties);


   for (int j = 0; j < fCurrentUniverse.length(); j++) { // we are running through the names of the individuals in the universe of the diagram
       individualName = fCurrentUniverse.charAt(j);

       individualIndex = fIndividualNames.indexOf(individualName);

       Point hotSpot= fHotSpots[individualIndex];

       tempStr = "";

       if (fShapes.size() > 0) {  // now we are going to run through the shapes to see which are properties applying to that individual
         Iterator iter = fShapes.iterator();
         TShape theShape;

         while (iter.hasNext()) { //this checks if it contains an individual
           theShape = (TShape) iter.next();


           if ((!theShape.getSelected()) &&
               theShape.fTypeID == TShape.IDProperty) {   //ie non selected properties

             if ((theShape.getBoundsRect()).contains(hotSpot)){ // applies to individual
               propertyIndex = fPossibleProperties.indexOf(theShape.fName);

               tempStr=tempProperties[propertyIndex];

               if (tempStr.indexOf(individualName) < 0){               // no duplicates
                 tempStr = tempStr + individualName;
                 tempProperties[propertyIndex]=tempStr;                 //update
               }
             }
           }
         }
       }
     }

         // at this point the tempProperties array should be good but we now need
         // to see if the real one is any different and update if so

    for (int i=0;i<fPossibleProperties.length();i++){ // running through the properties

   //    propertyKey = fPossibleProperties.charAt(i);

       tempStr=tempProperties[i];

       if (!tempStr.equals(fCurrentProperties[i])) {
           changed = true;
           fCurrentProperties[i]=tempStr;

       }

    }

   return
       changed;
    }
 */

this.pointsClose=function(first,second,howClose){
   if ((Math.abs(first.x-second.x)<=howClose)&&
      (Math.abs(first.y-second.y)<=howClose))
    return true;
  else
    return false; 
    };
    
this.isFunctionDuplicate= function (name,from,to){
    
    var relationIndex = this.fPossibleFunctions.indexOf(name);
    var relationStr=this.fCurrentFunctions[relationIndex];
    
    if ((relationStr.indexOf(from + to)<0)||
           (relationStr.indexOf(from + to)%2===0 ))
        return false;
    else
        return true; 
}

this.isRelationDuplicate= function (name,from,to){
    
    var relationIndex = this.fPossibleRelations.indexOf(name);
    var relationStr=this.fCurrentRelations[relationIndex];
    
    if ((relationStr.indexOf(from + to)<0)||
           (relationStr.indexOf(from + to)%2===0 ))
        return false;
    else
        return true; 
}

this.isIdentityDuplicate= function (name){
    //each alias can be the alias of only one thing
    //so if it is there, there cannot be another
    
    var relationIndex = this.fPossibleIdentities.indexOf(name);
    var relationStr=this.fCurrentIdentities[relationIndex];
    
    var chBlank=' ';
     
    if ((relationStr==chBlank))  //initialized to blanks
        return false;
    else
        return true; 
}


this.updateRelations= function(svgString){ // presuppose here that the universe has been updated first
    var changed=false;
    var tempStr="";
    var relationIndex;
    var tempRelations = new Array(this.fPossibleRelations.length);
    var fromPoint=null; var toPoint=null;
    var fromName="";var toName="";
    var fromIndex=-1;var toIndex=-1;
    //refer to individuals
    var relationFrom,relationTo;
    var test=[null,null];
    var relation;
    var relationName="";
    
    
    this.initializeStringArray(tempRelations);             // all to nullStr
    
    //we need to run through all the pairs of individuals, including the same individual twice
    //and all the Relations
    
    for (var i = 0; i < this.fCurrentUniverse.length; i++) { // we are running through the names of the individuals in the universe of the diagram
       fromName = this.fCurrentUniverse.charAt(i);
       fromIndex = this.fIndividualNames.indexOf(fromName);
       fromPoint = this.fHotSpots[fromIndex];
       tempStr = "";

       for (var j = 0; j < this.fCurrentUniverse.length; j++) { // we are running through the names of the individuals in the universe of the diagram
        toName = this.fCurrentUniverse.charAt(j);
        toIndex = this.fIndividualNames.indexOf(toName);
        toPoint = this.fHotSpots[toIndex];
        tempStr = "";
        // we want to split the svg string into first relation and remainder
        test= TUtilities.relationAndRemainder(svgString);
        //WOrking ok test[0] is relation test[1] is remainder test[2] is relation name
       
        while (test[0]!==null){
           relation=TUtilities.parseSvgRelation(test[0]);
           //relation should be [fromPoint,toPoint,name]
           relationFrom=relation[0];
           relationTo=relation[1];
           
           if (relationFrom&&relationTo){
               
            if (this.pointsClose(fromPoint,relationFrom,12)&&
                this.pointsClose(toPoint,relationTo,12)){     //good
            
                relationName=test[2];
                
                relationIndex = this.fPossibleRelations.indexOf(relationName);

                tempStr = tempRelations[relationIndex];

 //              int debug = tempStr.indexOf(fromName + toName);

                var dupIndex=tempStr.indexOf(fromName + toName);
                        
                 if ((dupIndex < 0)||(dupIndex%2===1)){ // no duplicates
                     // not there or cross boundary e.g. abcd does NOT have bc
                    tempStr = tempStr + fromName + toName;
                    tempRelations[relationIndex] = tempStr; //update
                    }   
                }
             }
            
        test=TUtilities.relationAndRemainder(test[1]); // go on to next rectangle              
      }
      }
  }
     
 /*  }

    }   */  
 
          // at this point the tempRelations array should be good but we now need
         // to see if the real one is any different and update if so

    for (var i=0;i<this.fPossibleRelations.length;i++){ // running through the properties

        tempStr=tempRelations[i];

       if (!(tempStr===(this.fCurrentRelations[i]))) {
           changed = true;
           this.fCurrentRelations[i]=tempRelations[i];
       }
   }

   return changed;
    };

/*
boolean updateRelations(){   // presuppose here that the universe (and extentrects) have been updated first
      boolean changed = false;
      String tempStr = "";
      int relationIndex;
      String [] tempRelations;
      Rectangle fromRect;
      Rectangle toRect;
      char fromName, toName;
      int fromIndex,toIndex;


   tempRelations = new String[fPossibleRelations.length()];
   initializeStringArray(tempRelations);


   for (int i = 0; i < fCurrentUniverse.length(); i++) { // we are running through the names of the individuals in the universe of the diagram

     fromName = fCurrentUniverse.charAt(i);

     fromIndex = fIndividualNames.indexOf(fromName);

     fromRect = fExtentRects[fromIndex];

     tempStr = "";

     for (int j = 0; j < fCurrentUniverse.length(); j++) { // we are running through the names of the individuals in the universe of the diagram

       toName = fCurrentUniverse.charAt(j);

       toIndex = fIndividualNames.indexOf(toName);

       toRect = fExtentRects[toIndex];

       tempStr = "";

       if (fShapes.size() > 0) { // now we are going to run through the shapes to see which are relations applying to the pairs of individuals
         Iterator iter = fShapes.iterator();
         TShape theShape;

         while (iter.hasNext()) { //this checks if it contains an individual
           theShape = (TShape) iter.next();

           if ( (!theShape.getSelected()) &&
               (!TParser.isFunctor(theShape.fName)) &&       // small letters
               ( (theShape.fTypeID == TShape.IDRelationR) ||
                (theShape.fTypeID == TShape.IDFunction))) { //ie non selected relations

             if ( (fromRect.contains( ( (TRelation) theShape).getFrom())) &&
                 ( (toRect.contains( ( (TRelation) theShape).getTo())))) {

               relationIndex = fPossibleRelations.indexOf(theShape.fName);

               tempStr = tempRelations[relationIndex];

               int debug = tempStr.indexOf(fromName + toName);

               if (tempStr.indexOf(fromName + toName) < 0) { // no duplicates
                 tempStr = tempStr + fromName + toName;
                 tempRelations[relationIndex] = tempStr; //update
               }

             }
           }
         }
       }
     }
   }

         // at this point the tempRelations array should be good but we now need
         // to see if the real one is any different and update if so

    for (int i=0;i<fPossibleRelations.length();i++){ // running through the properties

   //    propertyKey = fPossibleProperties.charAt(i);

     //  tempStr=tempRelations[i];

       if (!(tempRelations[i].equals(fCurrentRelations[i]))) {
           changed = true;
           fCurrentRelations[i]=tempRelations[i];

       }

    }

   return
       changed;

    }
 */

this.updateFunctions= function(svgString){ // presuppose here that the universe has been updated first
    var changed=false;
    var tempStr="";
    var relationIndex;
    var tempFunctions = new Array(this.fPossibleFunctions.length);
    var fromPoint=null; var toPoint=null;
    var fromName="";var toName="";
    var fromIndex=-1;var toIndex=-1;
    //refer to individuals
    var relationFrom,relationTo;
    var test=[null,null];
    var relation;
    var relationName="";
    
    
    this.initializeStringArray(tempFunctions);             // all to nullStr
    
    //we need to run through all the pairs of individuals, including the same individual twice
    //and all the Functions
    
    for (var i = 0; i < this.fCurrentUniverse.length; i++) { // we are running through the names of the individuals in the universe of the diagram
       fromName = this.fCurrentUniverse.charAt(i);
       fromIndex = this.fIndividualNames.indexOf(fromName);
       fromPoint = this.fHotSpots[fromIndex];
       tempStr = "";

       for (var j = 0; j < this.fCurrentUniverse.length; j++) { // we are running through the names of the individuals in the universe of the diagram
        toName = this.fCurrentUniverse.charAt(j);
        toIndex = this.fIndividualNames.indexOf(toName);
        toPoint = this.fHotSpots[toIndex];
        tempStr = "";
        // we want to split the svg string into first relation and remainder
        test= TUtilities.functionAndRemainder(svgString);
        //WOrking ok test[0] function is relation test[1] is remainder test[2] is relation name
       
        while (test[0]!==null){
           relation=TUtilities.parseSvgFunction(test[0]);
           //relation should be [fromPoint,toPoint,name]
           relationFrom=relation[0];
           relationTo=relation[1];
           
           if (relationFrom&&relationTo){
               
            if (this.pointsClose(fromPoint,relationFrom,12)&&
                this.pointsClose(toPoint,relationTo,12)){     //good
            
                relationName=test[2];
                
                relationIndex = this.fPossibleFunctions.indexOf(relationName);

                tempStr = tempFunctions[relationIndex];

 //              int debug = tempStr.indexOf(fromName + toName);

                var dupIndex=tempStr.indexOf(fromName + toName);
                        
                 if ((dupIndex < 0)||(dupIndex%2===1)){ // no duplicates
                     // not there or cross boundary e.g. abcd does NOT have bc
                    tempStr = tempStr + fromName + toName;
                    tempFunctions[relationIndex] = tempStr; //update
                    }   
                }
             }
            
        test=TUtilities.functionAndRemainder(test[1]); // go on to next rectangle              
      }
      }
  }
     
 /*  }

    }   */  
 
          // at this point the tempFunctions array should be good but we now need
         // to see if the real one is any different and update if so

    for (var i=0;i<this.fPossibleFunctions.length;i++){ // running through the properties

        tempStr=tempFunctions[i];

       if (!(tempStr===(this.fCurrentFunctions[i]))) {
           changed = true;
           this.fCurrentFunctions[i]=tempFunctions[i];
       }
   }

   return changed;
    };

this.updateIdentities= function(svgString){ // presuppose here that the universe has been updated first
    var changed=false;
    var tempStr="";
    var relationIndex;
    var tempFunctions = new Array(this.fPossibleIdentities.length);
    var fromPoint=null; var toPoint=null;
    var fromName="";var toName="";
    var fromIndex=-1;var toIndex=-1;
    //refer to individuals
    var relationFrom,relationTo;
    var test=[null,null];
    var relation;
    var relationName="";
    
    
    this.initializeCharArray(tempFunctions);             // all to blank char
    
    //we need to run through all the pairs of individuals, including the same individual twice
    //and all the Functions
    
  /*  for (var i = 0; i < this.fCurrentUniverse.length; i++) { // we are running through the names of the individuals in the universe of the diagram
       fromName = this.fCurrentUniverse.charAt(i);
       fromIndex = this.fIndividualNames.indexOf(fromName);
       fromPoint = this.fHotSpots[fromIndex];
       tempStr = ""; from commented out */

       for (var j = 0; j < this.fCurrentUniverse.length; j++) { // we are running through the names of the individuals in the universe of the diagram
        toName = this.fCurrentUniverse.charAt(j);
        toIndex = this.fIndividualNames.indexOf(toName);
        toPoint = this.fHotSpots[toIndex];
        tempStr = "";
        // we want to split the svg string into first relation and remainder
        test= TUtilities.identityAndRemainder(svgString);
        //WOrking ok test[0] function is relation test[1] is remainder test[2] is relation name
       
        while (test[0]!==null){
           relation=TUtilities.parseSvgIdentity(test[0]);
           //relation should be [fromPoint,toPoint,name]
  //         relationFrom=relation[0];
           relationTo=relation[1];
           
           if (/*relationFrom&&*/relationTo){
               
            if (/*this.pointsClose(fromPoint,relationFrom,12)&&*/
                this.pointsClose(toPoint,relationTo,12)){     //good
            
                relationName=test[2];
                
                relationIndex = this.fPossibleIdentities.indexOf(relationName);

                tempStr = tempFunctions[relationIndex];

 //              int debug = tempStr.indexOf(fromName + toName);

                var dupIndex=tempStr.indexOf(/*fromName + */toName);
                        
                 if ((dupIndex < 0)/*||(dupIndex%2===1)*/){ // no duplicates
                     // not there or cross boundary e.g. abcd does NOT have bc
                    tempStr = /*tempStr + fromName + */ toName;
                    tempFunctions[relationIndex] = tempStr; //update
                    }   
                }
             }
            
        test=TUtilities.identityAndRemainder(test[1]); // go on to next rectangle              
      }
      }
 /* }  from commented out*/
     
 /*  }

    }   */  
 
          // at this point the tempFunctions array should be good but we now need
         // to see if the real one is any different and update if so

    for (var i=0;i<this.fPossibleIdentities.length;i++){ // running through the properties

        tempStr=tempFunctions[i];

       if (!(tempStr===(this.fCurrentIdentities[i]))) {
           changed = true;
           this.fCurrentIdentities[i]=tempFunctions[i];
       }
   }

   return changed;
    };

}




var myVar=setInterval(function(){gInterpretationBoard.svgCheck();},1000);    //unfortunately they can change the svg by delete key etc.

var dummy=0;
/*
<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
 <g id="svg_1">
  <title>Layer 1</title>
  <g id="svg_IBg">
   <rect fill="none" stroke="black" x="0" y="0" id="svg_IB" width="140" height="60"/>
   <text fill="#000000"     x="70" y="18" id="svg_line1" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">Universe={a,b}</text>
   <text fill="#000000"     x="70" y="36" id="svg_line1" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">A={a}</text>
   <text fill="#000000"     x="70" y="54" id="svg_line1" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">D={b}</text>
  </g>
  <!--start-->
  <g id="svg_Ag">
   <rect stroke-opacity="0.5" stroke="#000000" fill-opacity="0.5" fill="#FF0000" x="318" y="159.5" id="svg_A" height="100" width="100"/>
   <text fill="#000000"     x="368" y="259.5" id="svg_At" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">A</text>
  </g>
  <g id="svg_ag">
   <circle stroke="black" fill="none" cx="361.5" cy="211.83602" id="svg_a" r="58.80816"/>
   <text stroke="#000000" fill="#000000" stroke-width="0"    x="551.55206" y="202.39758" id="svg_at" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve" transform="matrix(5.38524 0 0 5.49109 -2608.75 -861.109)">a</text>
  </g>
  <g id="svg_Dg">
   <rect stroke-opacity="0.5" stroke="#000000" fill-opacity="0.5" fill="#007fff" x="131" y="239.5" id="svg_D" height="100" width="100"/>
   <text fill="#007fff"     x="181" y="339.5" id="svg_Dt" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">D</text>
  </g>
  <g id="svg_bg">
   <circle fill="none" stroke="black" cx="175" cy="291.5" id="svg_b" r="11"/>
   <text fill="#000000"     x="175" y="298.5" id="svg_bt" font-size="18" font-family="serif" text-anchor="middle" xml:space="preserve">b</text>
  </g>
 </g>
</svg>

*/