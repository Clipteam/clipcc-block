'use strict';

goog.provide('Blockly.IntersectionObserver');

Blockly.IntersectionObserver = function(workspace) {
  this.workspace = workspace;
  this.observing = [];
  this.intersectionCheckQueued = false;
  this.checkForIntersections = this.checkForIntersections.bind(this);
};

Blockly.IntersectionObserver.prototype.observe = function(block) {
  var index = this.observing.indexOf(block);
  if (index === -1) {
    this.observing.push(block);
  }
};

Blockly.IntersectionObserver.prototype.unobserve = function(block) {
  var index = this.observing.indexOf(block);
  if (index !== -1) {
    this.observing = this.observing.filter(function(i) {
      return i !== block;
    });
  }
};

Blockly.IntersectionObserver.prototype.dispose = function() {
  this.observing = [];
  this.workspace = null;
};

Blockly.IntersectionObserver.prototype.queueIntersectionCheck = function() {
  if (this.intersectionCheckQueued) {
    return;
  }
  this.intersectionCheckQueued = true;
  (window.queueMicrotask || window.setTimeout)(this.checkForIntersections);
};

Blockly.IntersectionObserver.prototype.checkForIntersections = function() {
  this.intersectionCheckQueued = false;
  
  if (!this.workspace) return;

  var workspace = this.workspace;
  var workspaceScale = workspace.scale;
  var workspaceHeight = workspace.getParentSvg().height.baseVal.value;
  var workspaceWidth = workspace.getParentSvg().width.baseVal.value;
  if (workspace.isDragSurfaceActive_) var canvasPos = Blockly.utils.getRelativeXY(workspace.workspaceDragSurface_.SVG_);
  else var canvasPos = Blockly.utils.getRelativeXY(workspace.getCanvas());
  
  // Allow blocks to go slightly offscreen so that effects such as glow do not get cut off.
  var margin = 12 * workspaceScale;

  this.observing.forEach(function(block) {
    var blockPos = block.getRelativeToSurfaceXY();
    blockPos.x *= workspaceScale;
    blockPos.y *= workspaceScale;

    var visible = true;
    if (canvasPos.y + blockPos.y - margin > workspaceHeight) {
      visible = false;
    } else if (canvasPos.x + blockPos.x - margin > workspaceWidth) {
      visible = false;
    } else {
      var blockSize = block.getHeightWidth();
      blockSize.width *= workspaceScale;
      blockSize.height *= workspaceScale;
      if (canvasPos.x + blockPos.x + blockSize.width + margin < 0) {
        visible = false;
      } else if (canvasPos.y + blockPos.y + blockSize.height + margin < 0) {
        visible = false;
      }
    }

    block.setIntersects(visible);
  }, this);
};