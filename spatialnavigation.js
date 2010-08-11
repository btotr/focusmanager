var directions = {    
    38 : "top", 
    39 : "right", 
    40 : "bottom", 
    37 : "left"  
}

function getNearestElement(target, direction){

    function getEuclideanDistance(point1, point2){
        return parseInt(Math.sqrt(Math.pow(Math.abs(point1[0] - point2[0]),2) + Math.pow(Math.abs(point1[1] - point2[1]),2)))
    }
    
    var focusableElements = document.getElementsByTagName("a");
    var nearestElement = null;
    var nearestPosition = 999;  
    var difference = 999;

    var width = target.offsetWidth || target.firstChild.nextSibling.getBBox().width;
    var height = target.offsetHeight || target.firstChild.nextSibling.getBBox().height
    
    var x = target.getBoundingClientRect()["left"] + (width/2);
    var y = target.getBoundingClientRect()[directions[direction]];
    var opposite = directions[parseInt((direction+1)%4+37)];

    if (direction == 37 || direction == 39) {
        x = target.getBoundingClientRect()[directions[direction]]
        y = target.getBoundingClientRect()["top"] + (height/2)
    }
    
    var targetPoint = [x, y];

    for (var i=0,l=focusableElements.length, x, y;i<l;i++) {
        var element = focusableElements[i];
        if (target == element || parseInt(element.getAttribute("tabindex")) == -1) continue

        x = element.getBoundingClientRect()["left"];
        if (Math.abs(x-targetPoint[0]) > Math.abs(element.getBoundingClientRect()["right"]-targetPoint[0]))
            x = element.getBoundingClientRect()["right"];
        
        y = element.getBoundingClientRect()[opposite];

        if (direction == 37 || direction == 39) {
            x = element.getBoundingClientRect()[opposite]
            y = element.getBoundingClientRect()["top"];
            if (Math.abs(y-targetPoint[1]) > Math.abs(element.getBoundingClientRect()["bottom"]-targetPoint[1]))
                y = element.getBoundingClientRect()["bottom"];
        }

        if (targetPoint[1] + height/2 < y && (direction == 38)) continue // top
        if (targetPoint[1] - height/2 > y && (direction == 40)) continue // down
        if (targetPoint[0] - width/2  > x && (direction == 39)) continue // right
        if (targetPoint[0] + width/2 < x && (direction == 37)) continue // left

        var difference = getEuclideanDistance(targetPoint, [x,y]);

        if (difference <= nearestPosition) {
            nearestPosition = difference;
            nearestElement = element;
        }

    }
    if (!nearestElement) nearestElement = target
    return nearestElement
    
}


function setSpatialNavigation() {
    document.documentElement.addEventListener("keydown", function(e) {
         if (e.which in directions) {       
              getNearestElement(e.target, e.which).focus();
         }
     }, false);
   
}
window.addEventListener("load", setSpatialNavigation, false)