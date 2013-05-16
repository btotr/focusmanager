/*global Element*/
function FocusManager(containerElement) {
    this.debugMode = false;
    this.initKeyListener(containerElement);
}

FocusManager.prototype.initKeyListener = function initKeyListener(containerElement) {
    var self = this;
    if (!containerElement) {
        containerElement = window;
    }
    containerElement.addEventListener("keydown", function moveFocus(e) {
        if (e.debug) { e.debug(); }
        // remove debug lines on backspace
        if (e.keyCode === 8){
            self.clearDebug();
            e.stopPropagation();
        }
        // NOTE use the html5 attribute autofocus to set the first focused element
        if (e.keyCode in self.directions && !e.defaultPrevented) {
            self.focusInDirection(self.getFocusedElement(), e.keyCode);
            e.preventDefault();
            e.stopPropagation();
        }
    }, false);
};

FocusManager.prototype.setFocus = function setFocus(focusableNode, generateFocus) {
    var focusedElement = this.getFocusedElement();
    if (focusedElement) {
        focusedElement.classList.remove("focus");
    }
    focusableNode.classList.add("focus");
    focusableNode.focus();
};

FocusManager.prototype.getFocusedElement = function getFocusedElement() {
    return document.getElementsByClassName("focus")[0];
};

FocusManager.prototype.directions = {
    38 : "top",
    39 : "right",
    40 : "bottom",
    37 : "left"
};

FocusManager.prototype.getEuclideanDistance    = function getEuclideanDistance(point1, point2) {
    return parseInt(Math.sqrt(Math.pow(Math.abs(point1[0] - point2[0]),2) + Math.pow(Math.abs(point1[1] - point2[1]),2)), 10);
};

FocusManager.prototype.resetFocusableElementsContainers = function resetFocusableElementsContainers() {
    this.setFocusableElementsContainers([document.documentElement]);
};

FocusManager.prototype.setFocusableElementsContainers = function setFocusableElementsContainers(containers) {
    while (this.getFocusableElementsContainers().length > 0) {
        this.getFocusableElementsContainers()[0].classList.remove("focus-container");
    }
    for (var i=0,l=containers.length;i<l;i++) {
       containers[i].classList.add("focus-container");
    }
};

FocusManager.prototype.getFocusableElementsContainers = function getFocusableElementsContainers() {
    return document.getElementsByClassName("focus-container");
};

FocusManager.prototype.focusableElementsQuery = "[tabindex]:not([tabindex^='-']), a[href]:not([tabindex^='-']), button:not([disabled]):not([tabindex^='-']), input:not([disabled]):not([tabindex^='-']), select:not([disabled]):not([tabindex^='-']), textarea:not([disabled]):not([tabindex^='-']), command:not([disabled]):not([tabindex^='-']), [draggable]:not([tabindex^='-'])";

FocusManager.prototype.focusInDirection = function focusInDirection(target, direction) {
    var nextFocus = this.getNearestElement(target, direction);
    if (nextFocus) {
        this.setFocus(nextFocus);
        return true;
    } else {
        return false;
    }
};

FocusManager.prototype.getNearestElement = function getNearestElement(target, direction) {
    // constrain focusable elements
    var focusableElements = [];
    for (var i=0,l=this.getFocusableElementsContainers().length; i < l; i++) {
         var tmpFocusableElements = this.getFocusableElementsContainers()[i].querySelectorAll(this.focusableElementsQuery);
         for (var t=0,lt=tmpFocusableElements.length; t <= lt; t++) {
             focusableElements.push(tmpFocusableElements[t]);
         }
         // remove container from focusable elements
         focusableElements.splice(focusableElements.indexOf(this.getFocusableElementsContainers()[i]), 1);
    }
    // initialize start values
    var nearestElement = null;
    var nearestPosition = 999;
    var difference = 999;
    var tabIndex = 0;
    // width and heigth from the target
    var width = target.getElementInViewportRect().width;
    var height = target.getElementInViewportRect(target).height;
    // calculate targetPoint[x,y] 'o' which is the center from the direction
    // example (direction is top):
    // ------------o-------------
    // |                        |
    // |                        |
    // |                        |
    // --------------------------
    var tx = target.getElementInViewportRect().left + (width/2);
    var ty = target.getElementInViewportRect()[this.directions[direction]];
    if (direction === 37 || direction === 39) {
        tx = target.getElementInViewportRect()[this.directions[direction]];
        ty = target.getElementInViewportRect().top + (height/2);
    }
    var targetPoint = [tx, ty];
    // get the opposite direction (e.g. top becomes bottom)
    var opposite = this.directions[parseInt((direction+1)%4+37, 10)];
    for (var i=0,l=focusableElements.length; i < l; i++) {
        var element = focusableElements[i];
        
        if (element.getElementInViewportRect().width === 0 || element.getElementInViewportRect().height === 0) {
            continue;
        }
        
        var x = element.getElementInViewportRect().left + element.getElementInViewportRect().width/2;
        var y = element.getBoundingClientRect()[opposite];

        if (Math.abs(x-targetPoint[0]) >= Math.abs(element.getElementInViewportRect().right - targetPoint[0])) {
            x = element.getElementInViewportRect().right - element.getElementInViewportRect().width/2;
        }
        if (direction === 37 || direction === 39) {
            x = element.getElementInViewportRect()[opposite];
            y = element.getElementInViewportRect().top +  element.getElementInViewportRect().height/2;
            if (Math.abs(y-targetPoint[1]) >= Math.abs(element.getElementInViewportRect().bottom-targetPoint[1])) {
                y = element.getElementInViewportRect().bottom - element.getElementInViewportRect().height/2;
            }
        }
        if (targetPoint[1] + height/2 <= y && (direction === 38)) { continue; } // top
        if (targetPoint[1] - height/2 >= y && (direction === 40)) { continue; } // down
        if (targetPoint[0] - width/2 >= x && (direction === 39)) { continue; } // right
        if (targetPoint[0] + width/2 <= x && (direction === 37)) { continue; } // left

        difference = this.getEuclideanDistance(targetPoint, [x,y]);
        this.debug(targetPoint, x,y);
        if (difference <= nearestPosition) {
            nearestPosition = difference;
            nearestElement = element;
            var xLast = x;
            var yLast = y;
            this.debug(targetPoint, xLast,yLast, "green");
        }
    }
    
    if (!nearestElement) { nearestElement = target; }
    return nearestElement;
};

    
FocusManager.prototype.debug = function debug(targetPoint, x,y, color) {
    if (this.debugMode){
        if (!color) { color = "red"; }
        if (targetPoint !== undefined && x !== undefined && y !== undefined) {
            var fragment = document.createElement("div");
            fragment.setAttribute("class", "debug")
            fragment.innerHTML = '<svg style="position:absolute;left:0;top:0;" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><line x1="'+targetPoint[0]+'" y1="'+targetPoint[1]+'" x2="'+x+'" y2="'+y+'" style="stroke:'+color+';stroke-width:3"/><circle cx="'+x+'" cy="'+y+'" r="10"  fill="'+color+'"/><circle cx="'+targetPoint[0]+'" cy="'+targetPoint[1]+'" r="10"  fill="blue"/></svg>';
            document.body.appendChild(fragment);
        }
    }
};

FocusManager.prototype.clearDebug = function debug() {
    if (this.debugMode){
        var debugFragments = document.querySelectorAll(".debug");
        for (var i=0,l=debugFragments.length;i<l;i++){
            debugFragments[i].parentNode.removeChild(debugFragments[i])
        }
    }
};


Element.prototype.getElementInViewportRect = function() {
    var rect = this.getBoundingClientRect();
    var inViewportRect = {
        width:rect.width,
        height:rect.height,
        top:rect.top,
        bottom:rect.bottom,
        left:rect.left,
        right:rect.right
    };
    if (window.innerWidth < this.getBoundingClientRect().width + rect.left && rect.left >= 0) {
        inViewportRect.width = window.innerWidth - rect.left;
    }
    if (window.innerHeight < this.getBoundingClientRect().height + rect.top && rect.top >= 0) {
        inViewportRect.height = window.innerHeight - rect.top;
    }
    
    if (rect.left < 0) {
        inViewportRect.left = 0;
        inViewportRect.width = inViewportRect.width + rect.left;
    }
    
    if (rect.top < 0) {
        inViewportRect.top = 0;
        inViewportRect.height = inViewportRect.height + rect.top;
    }
    
    return inViewportRect;
};


