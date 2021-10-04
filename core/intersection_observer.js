/**
 * Based on https://github.com/w3c/IntersectionObserver/blob/main/polyfill/intersection-observer.js
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

'use strict';

goog.provide('Blockly.IntersectionObserver');

/**
 * Creates the global IntersectionObserverEntry constructor.
 * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
 * @param {Object} entry A dictionary of instance properties.
 * @constructor
 */
function IntersectionObserverEntry(entry) {
    this.target = entry.target;
    this.rootBounds = ensureDOMRect(entry.rootBounds);
    this.boundingClientRect = ensureDOMRect(entry.boundingClientRect);
    this.intersectionRect = ensureDOMRect(entry.intersectionRect || getEmptyRect());
    this.isIntersecting = !!entry.intersectionRect;

    // Calculates the intersection ratio.
    var targetRect = this.boundingClientRect;
    var targetArea = targetRect.width * targetRect.height;
    var intersectionRect = this.intersectionRect;
    var intersectionArea = intersectionRect.width * intersectionRect.height;

    // Sets intersection ratio.
    if (targetArea) {
        // Round the intersection ratio to avoid floating point math issues:
        // https://github.com/w3c/IntersectionObserver/issues/324
        this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
    } else {
        // If area is zero and is intersecting, sets to 1, otherwise to 0
        this.intersectionRatio = this.isIntersecting ? 1 : 0;
    }
};

Blockly.IntersectionObserver = function (callback, opt_options) {
    var options = opt_options || {};

    this.checkForIntersections = this.checkForIntersections.bind(this);

    // Private properties.
    this._callback = callback;
    this._observationTargets = [];
    this._queuedEntries = [];
    this._rootMarginValues = this._parseRootMargin(options.rootMargin);

    // Public properties.
    this.thresholds = this._initThresholds(options.threshold);
    this.root = options.root || null;
    this.rootMargin = this._rootMarginValues.map(function (margin) {
        return margin.value + margin.unit;
    }).join(' ');

    /** @private @const {!Array<!Document>} */
    this._monitoringDocuments = [];
    /** @private @const {!Array<function()>} */
    this._monitoringUnsubscribes = [];
};

/**
 * Starts observing a target element for intersection changes based on
 * the thresholds values.
 * @param {Element} target The DOM element to observe.
 */
Blockly.IntersectionObserver.prototype.observe = function (target) {
    var isTargetAlreadyObserved = this._observationTargets.some(function (item) {
        return item.element == target;
    });

    if (isTargetAlreadyObserved) {
        return;
    }

    if (!(target && target.nodeType == 1)) {
        throw new Error('target must be an Element');
    }

    this._observationTargets.push({ element: target, entry: null });
};


/**
 * Stops observing a target element for intersection changes.
 * @param {Element} target The DOM element to observe.
 */
Blockly.IntersectionObserver.prototype.unobserve = function (target) {
    this._observationTargets =
        this._observationTargets.filter(function (item) {
            return item.element != target;
        });
};


/**
 * Stops observing all target elements for intersection changes.
 */
Blockly.IntersectionObserver.prototype.disconnect = function () {
    this._observationTargets = [];
};


/**
 * Returns any queue entries that have not yet been reported to the
 * callback and clears the queue. This can be used in conjunction with the
 * callback to obtain the absolute most up-to-date intersection information.
 * @return {Array} The currently queued entries.
 */
Blockly.IntersectionObserver.prototype.takeRecords = function () {
    var records = this._queuedEntries.slice();
    this._queuedEntries = [];
    return records;
};


/**
 * Accepts the threshold value from the user configuration object and
 * returns a sorted array of unique threshold values. If a value is not
 * between 0 and 1 and error is thrown.
 * @private
 * @param {Array|number=} opt_threshold An optional threshold value or
 *     a list of threshold values, defaulting to [0].
 * @return {Array} A sorted list of unique and valid threshold values.
 */
Blockly.IntersectionObserver.prototype._initThresholds = function (opt_threshold) {
    var threshold = opt_threshold || [0];
    if (!Array.isArray(threshold)) threshold = [threshold];

    return threshold.sort().filter(function (t, i, a) {
        if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
            throw new Error('threshold must be a number between 0 and 1 inclusively');
        }
        return t !== a[i - 1];
    });
};


/**
 * Accepts the rootMargin value from the user configuration object
 * and returns an array of the four margin values as an object containing
 * the value and unit properties. If any of the values are not properly
 * formatted or use a unit other than px or %, and error is thrown.
 * @private
 * @param {string=} opt_rootMargin An optional rootMargin value,
 *     defaulting to '0px'.
 * @return {Array<Object>} An array of margin objects with the keys
 *     value and unit.
 */
Blockly.IntersectionObserver.prototype._parseRootMargin = function (opt_rootMargin) {
    var marginString = opt_rootMargin || '0px';
    var margins = marginString.split(/\s+/).map(function (margin) {
        var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
        if (!parts) {
            throw new Error('rootMargin must be specified in pixels or percent');
        }
        return { value: parseFloat(parts[1]), unit: parts[2] };
    });

    // Handles shorthand.
    margins[1] = margins[1] || margins[0];
    margins[2] = margins[2] || margins[0];
    margins[3] = margins[3] || margins[1];

    return margins;
};

/**
 * Scans each observation target for intersection changes and adds them
 * to the internal entries queue. If new entries are found, it
 * schedules the callback to be invoked.
 * @private
 */
Blockly.IntersectionObserver.prototype.checkForIntersections = function () {
    var rootIsInDom = this._rootIsInDom();
    var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

    this._observationTargets.forEach(function (item) {
        var target = item.element;
        var targetRect = getBoundingClientRect(target);
        var rootContainsTarget = this._rootContainsTarget(target);
        var oldEntry = item.entry;
        var intersectionRect = rootIsInDom && rootContainsTarget &&
            this._computeTargetAndRootIntersection(target, targetRect, rootRect);

        var rootBounds = null;
        if (!this._rootContainsTarget(target)) {
            rootBounds = getEmptyRect();
        } else if (this.root) {
            rootBounds = rootRect;
        }

        var newEntry = item.entry = new IntersectionObserverEntry({
            target: target,
            boundingClientRect: targetRect,
            rootBounds: rootBounds,
            intersectionRect: intersectionRect
        });

        if (!oldEntry) {
            this._queuedEntries.push(newEntry);
        } else if (rootIsInDom && rootContainsTarget) {
            // If the new entry intersection ratio has crossed any of the
            // thresholds, add a new entry.
            if (this._hasCrossedThreshold(oldEntry, newEntry)) {
                this._queuedEntries.push(newEntry);
            }
        } else {
            // If the root is not in the DOM or target is not contained within
            // root but the previous entry for this target had an intersection,
            // add a new record indicating removal.
            if (oldEntry && oldEntry.isIntersecting) {
                this._queuedEntries.push(newEntry);
            }
        }
    }, this);

    if (this._queuedEntries.length) {
        this._callback(this.takeRecords(), this);
    }
};


/**
 * Accepts a target and root rect computes the intersection between then
 * following the algorithm in the spec.
 * TODO(philipwalton): at this time clip-path is not considered.
 * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
 * @param {Element} target The target DOM element
 * @param {Object} targetRect The bounding rect of the target.
 * @param {Object} rootRect The bounding rect of the root after being
 *     expanded by the rootMargin value.
 * @return {?Object} The final intersection rect object or undefined if no
 *     intersection is found.
 * @private
 */
Blockly.IntersectionObserver.prototype._computeTargetAndRootIntersection =
    function (target, targetRect, rootRect) {
        // If the element isn't displayed, an intersection can't happen.
        if (window.getComputedStyle(target).display == 'none') return;

        var intersectionRect = targetRect;
        var parent = getParentNode(target);
        var atRoot = false;

        while (!atRoot && parent) {
            var parentRect = null;
            var parentComputedStyle = parent.nodeType == 1 ?
                window.getComputedStyle(parent) : {};

            // If the parent isn't displayed, an intersection can't happen.
            if (parentComputedStyle.display == 'none') return null;

            if (parent == this.root || parent.nodeType == /* DOCUMENT */ 9) {
                atRoot = true;
                if (parent == this.root || parent == document) {
                    parentRect = rootRect;
                } else {
                    // Check if there's a frame that can be navigated to.
                    var frame = getParentNode(parent);
                    var frameRect = frame && getBoundingClientRect(frame);
                    var frameIntersect =
                        frame &&
                        this._computeTargetAndRootIntersection(frame, frameRect, rootRect);
                    if (frameRect && frameIntersect) {
                        parent = frame;
                        parentRect = convertFromParentRect(frameRect, frameIntersect);
                    } else {
                        parent = null;
                        intersectionRect = null;
                    }
                }
            } else {
                // If the element has a non-visible overflow, and it's not the <body>
                // or <html> element, update the intersection rect.
                // Note: <body> and <html> cannot be clipped to a rect that's not also
                // the document rect, so no need to compute a new intersection.
                var doc = parent.ownerDocument;
                if (parent != doc.body &&
                    parent != doc.documentElement &&
                    parentComputedStyle.overflow != 'visible') {
                    parentRect = getBoundingClientRect(parent);
                }
            }

            // If either of the above conditionals set a new parentRect,
            // calculate new intersection data.
            if (parentRect) {
                intersectionRect = computeRectIntersection(parentRect, intersectionRect);
            }
            if (!intersectionRect) break;
            parent = parent && getParentNode(parent);
        }
        return intersectionRect;
    };


/**
 * Returns the root rect after being expanded by the rootMargin value.
 * @return {ClientRect} The expanded root rect.
 * @private
 */
Blockly.IntersectionObserver.prototype._getRootRect = function () {
    var rootRect;
    if (this.root) {
        rootRect = getBoundingClientRect(this.root);
    } else {
        // Use <html>/<body> instead of window since scroll bars affect size.
        var doc = document;
        var html = doc.documentElement;
        var body = doc.body;
        rootRect = {
            top: 0,
            left: 0,
            right: html.clientWidth || body.clientWidth,
            width: html.clientWidth || body.clientWidth,
            bottom: html.clientHeight || body.clientHeight,
            height: html.clientHeight || body.clientHeight
        };
    }
    return this._expandRectByRootMargin(rootRect);
};


/**
 * Accepts a rect and expands it by the rootMargin value.
 * @param {DOMRect|ClientRect} rect The rect object to expand.
 * @return {ClientRect} The expanded rect.
 * @private
 */
Blockly.IntersectionObserver.prototype._expandRectByRootMargin = function (rect) {
    var margins = this._rootMarginValues.map(function (margin, i) {
        return margin.unit == 'px' ? margin.value :
            margin.value * (i % 2 ? rect.width : rect.height) / 100;
    });
    var newRect = {
        top: rect.top - margins[0],
        right: rect.right + margins[1],
        bottom: rect.bottom + margins[2],
        left: rect.left - margins[3]
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;

    return newRect;
};


/**
 * Accepts an old and new entry and returns true if at least one of the
 * threshold values has been crossed.
 * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
 *    particular target element or null if no previous entry exists.
 * @param {IntersectionObserverEntry} newEntry The current entry for a
 *    particular target element.
 * @return {boolean} Returns true if a any threshold has been crossed.
 * @private
 */
Blockly.IntersectionObserver.prototype._hasCrossedThreshold =
    function (oldEntry, newEntry) {

        // To make comparing easier, an entry that has a ratio of 0
        // but does not actually intersect is given a value of -1
        var oldRatio = oldEntry && oldEntry.isIntersecting ?
            oldEntry.intersectionRatio || 0 : -1;
        var newRatio = newEntry.isIntersecting ?
            newEntry.intersectionRatio || 0 : -1;

        // Ignore unchanged ratios
        if (oldRatio === newRatio) return;

        for (var i = 0; i < this.thresholds.length; i++) {
            var threshold = this.thresholds[i];

            // Return true if an entry matches a threshold or if the new ratio
            // and the old ratio are on the opposite sides of a threshold.
            if (threshold == oldRatio || threshold == newRatio ||
                threshold < oldRatio !== threshold < newRatio) {
                return true;
            }
        }
    };


/**
 * Returns whether or not the root element is an element and is in the DOM.
 * @return {boolean} True if the root element is an element and is in the DOM.
 * @private
 */
Blockly.IntersectionObserver.prototype._rootIsInDom = function () {
    return !this.root || containsDeep(document, this.root);
};


/**
 * Returns whether or not the target element is a child of root.
 * @param {Element} target The target element to check.
 * @return {boolean} True if the target element is a child of root.
 * @private
 */
Blockly.IntersectionObserver.prototype._rootContainsTarget = function (target) {
    var rootDoc =
        (this.root && (this.root.ownerDocument || this.root)) || document;
    return (
        containsDeep(rootDoc, target) &&
        (!this.root || rootDoc == target.ownerDocument)
    );
};

/**
 * Throttles a function and delays its execution, so it's only called at most
 * once within a given time period.
 * @param {Function} fn The function to throttle.
 * @param {number} timeout The amount of time that must pass before the
 *     function can be called again.
 * @return {Function} The throttled function.
 */
function throttle(fn, timeout) {
    var timer = null;
    return function () {
        if (!timer) {
            timer = setTimeout(function () {
                fn();
                timer = null;
            }, timeout);
        }
    };
}


/**
 * Returns the intersection between two rect objects.
 * @param {Object} rect1 The first rect.
 * @param {Object} rect2 The second rect.
 * @return {?Object|?ClientRect} The intersection rect or undefined if no
 *     intersection is found.
 */
function computeRectIntersection(rect1, rect2) {
    var top = Math.max(rect1.top, rect2.top);
    var bottom = Math.min(rect1.bottom, rect2.bottom);
    var left = Math.max(rect1.left, rect2.left);
    var right = Math.min(rect1.right, rect2.right);
    var width = right - left;
    var height = bottom - top;

    return (width >= 0 && height >= 0) && {
        top: top,
        bottom: bottom,
        left: left,
        right: right,
        width: width,
        height: height
    } || null;
}


/**
 * Shims the native getBoundingClientRect for compatibility with older IE.
 * @param {Element} el The element whose bounding rect to get.
 * @return {DOMRect|ClientRect} The (possibly shimmed) rect of the element.
 */
function getBoundingClientRect(el) {
    return el.getBoundingClientRect();
}


/**
 * Returns an empty rect object. An empty rect is returned when an element
 * is not in the DOM.
 * @return {ClientRect} The empty rect.
 */
function getEmptyRect() {
    return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0
    };
}


/**
 * Ensure that the result has all of the necessary fields of the DOMRect.
 * Specifically this ensures that `x` and `y` fields are set.
 *
 * @param {?DOMRect|?ClientRect} rect
 * @return {?DOMRect}
 */
function ensureDOMRect(rect) {
    // A `DOMRect` object has `x` and `y` fields.
    if (!rect || 'x' in rect) {
        return rect;
    }
    // A IE's `ClientRect` type does not have `x` and `y`. The same is the case
    // for internally calculated Rect objects. For the purposes of
    // `IntersectionObserver`, it's sufficient to simply mirror `left` and `top`
    // for these fields.
    return {
        top: rect.top,
        y: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        x: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
    };
}


/**
 * Inverts the intersection and bounding rect from the parent (frame) BCR to
 * the local BCR space.
 * @param {DOMRect|ClientRect} parentBoundingRect The parent's bound client rect.
 * @param {DOMRect|ClientRect} parentIntersectionRect The parent's own intersection rect.
 * @return {ClientRect} The local root bounding rect for the parent's children.
 */
function convertFromParentRect(parentBoundingRect, parentIntersectionRect) {
    var top = parentIntersectionRect.top - parentBoundingRect.top;
    var left = parentIntersectionRect.left - parentBoundingRect.left;
    return {
        top: top,
        left: left,
        height: parentIntersectionRect.height,
        width: parentIntersectionRect.width,
        bottom: top + parentIntersectionRect.height,
        right: left + parentIntersectionRect.width
    };
}


/**
 * Checks to see if a parent element contains a child element (including inside
 * shadow DOM).
 * @param {Node} parent The parent element.
 * @param {Node} child The child element.
 * @return {boolean} True if the parent node contains the child node.
 */
function containsDeep(parent, child) {
    var node = child;
    while (node) {
        if (node == parent) return true;

        node = getParentNode(node);
    }
    return false;
}


/**
 * Gets the parent node of an element or its host element if the parent node
 * is a shadow root.
 * @param {Node} node The node whose parent to get.
 * @return {Node|null} The parent node or null if no parent exists.
 */
function getParentNode(node) {
    return node.parentNode;
}