var focusManager = {
    setFocus    : function(focusableNode){
        this.getFocusedElement().removeClassName("focus");
        focusableNode.addClassName("focus");
        focusableNode.focus();
    },
    getFocusedElement   : function(){
        return document.getElementsByClassName("focus")[0]
    },
    directions : {    
        38 : "top", 
        39 : "right", 
        40 : "bottom", 
        37 : "left"  
    },
    focusableElementsQuery  : "[tabindex]:not([tabindex^='-']), a[href], link[href], button:not([disable]), input:not([disable]), select:not([disable]), textarea:not([disable]), command:not([disable]), [draggable]",
    getEuclideanDistance    : function(point1, point2) {
        return parseInt(Math.sqrt(Math.pow(Math.abs(point1[0] - point2[0]),2) + Math.pow(Math.abs(point1[1] - point2[1]),2)))
    },
    getNearestElement       : function(target, direction) {
        // NOTE tabindex order is ignored. i.e. it doesn't matter if the value is 1 or 100
        var focusableElements = document.querySelectorAll(this.focusableElementsQuery);

        var nearestElement = null;
        var nearestPosition = 999;  
        var difference = 999;

        var width = target.offsetWidth;
        var height = target.offsetHeight;

        // calculate target x and y start position
        var x = target.getBoundingClientRect()["left"] + (width/2);
        var y = target.getBoundingClientRect()[this.directions[direction]];
        var opposite = this.directions[parseInt((direction+1)%4+37)];

        if (direction == 37 || direction == 39) {
            x = target.getBoundingClientRect()[this.directions[direction]]
            y = target.getBoundingClientRect()["top"] + (height/2)
        }

        var targetPoint = [x, y];

        for (var i=0,l=focusableElements.length, x, y;i<l;i++) {
            var element = focusableElements[i];

            var x = element.getBoundingClientRect()["left"] + element.offsetWidth/2;
            y = element.getBoundingClientRect()[opposite];
            if (Math.abs(x-targetPoint[0]) >= Math.abs(element.getBoundingClientRect()["right"]-targetPoint[0]))
                x = element.getBoundingClientRect()["right"] - element.offsetWidth/2;
            

            if (direction == 37 || direction == 39) {
                x = element.getBoundingClientRect()[opposite]
                y = element.getBoundingClientRect()["top"] +  element.offsetHeight/2;;
                if (Math.abs(y-targetPoint[1]) >= Math.abs(element.getBoundingClientRect()["bottom"]-targetPoint[1]))
                    y = element.getBoundingClientRect()["bottom"] - element.offsetHeight/2;
            }

            if (targetPoint[1] + height/2 <= y && (direction == 38)) continue // top
            if (targetPoint[1] - height/2 >= y && (direction == 40)) continue // down
            if (targetPoint[0] - width/2  >= x && (direction == 39)) continue // right
            if (targetPoint[0] + width/2 <= x && (direction == 37)) continue // left

            var difference = this.getEuclideanDistance(targetPoint, [x,y]);
            if (difference <= nearestPosition) {
                nearestPosition = difference;
                nearestElement = element;
                xLast = x;
                yLast = y;
            }
            
        }
        
        //this.debug(targetPoint, xLast,yLast)
        if (!nearestElement) nearestElement = target 
        else {
            // add class name focus to new focused element
            nearestElement.addClassName("focus");
            target.removeClassName("focus");
            // add animation classes to old en new focused element
            target.addClassName("animating");
            target.addClassName("to-" + this.directions[direction]);
            nearestElement.addClassName("from-" + this.directions[direction]);
            nearestElement.addClassName("animating");
            window.setTimeout(function() { 
                target.removeClassName("to-" + focusManager.directions[direction]) 
                target.removeClassName("animating");
            }, 100);
            window.setTimeout(function(){ 
                nearestElement.removeClassName("from-" + focusManager.directions[direction]) 
                nearestElement.removeClassName("animating");
            }, 0);
        }
        return nearestElement
    },
    debug : function(targetPoint, x,y) {
        var fragment = document.createElement("div");
        fragment.innerHTML = '<svg style="position:absolute;left:0;top:0;" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><line x1="'+targetPoint[0]+'" y1="'+targetPoint[1]+'" x2="'+x+'" y2="'+y+'" style="stroke:red;stroke-width:3"/></svg>'
        document.getElementsByTagName("body")[0].appendChild(fragment)
    }
};


document.documentElement.addEventListener("keydown", function(e) {
    // NOTE use the html5 attribute autofocus to set the first focused element
    if (e.keyCode in focusManager.directions) {
        focusManager.getNearestElement(e.target, e.keyCode).focus();
        e.preventDefault();
    }
}, false);

