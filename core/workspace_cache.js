/**
 * @fileoverview Workspace Cache
 */

'use strict';

goog.provide('Blockly.WorkspaceCache');

goog.require('Blockly.VariableMap');
goog.require('Blockly.WorkspaceComment');
goog.require('Blockly.ConnectionDB');

/**
 * Class for a workspace cache storing data of a workspace
 * to avoid load xml data repeatly.
 * @param {!Blockly.Workspace} workspace Workspace.
 * @param {!string} id An unique id.
 * @constructor
 */
Blockly.WorkspaceCache = function(workspace, id) {
  /** @type {string} */
  this.id = id;

  /** @type {Blockly.Workspace} */
  this.workspace = workspace;

  /**
   * @type {!Array.<!Blockly.Block>}
   * @private
   */
  this.topBlocks_ = [];
  
  /**
   * @type {!Array.<!Blockly.WorkspaceComment>}
   * @private
   */
  this.topComments_ = [];

  /**
   * @type {!Object}
   * @private
   */
  this.commentDB_ = Object.create(null);
  
  /**
   * @type {!Array.<!Function>}
   * @private
   */
  this.listeners_ = [];

  /**
   * @type {!Object}
   * @private
   */
  this.blockDB_ = Object.create(null);

  /**
   * @type {!Blockly.VariableMap}
   * @private
   */
  this.variableMap_ = new Blockly.VariableMap(this.workspace);

  /**
   * @type {!Blockly.VariableMap}
   * @private
   */
  this.potentialVariableMap_ = null;

  /**
   * @type {!Array.<!Blockly.ConnectionDB>}
   * @private
   */
  this.connectionDBList = null;
  Blockly.ConnectionDB.init(this);

  this.isClearing = false;
};

/**
 * Create and store the potential variable map for this workspace.
 * @package
 */
Blockly.WorkspaceCache.prototype.createPotentialVariableMap = function() {
  this.potentialVariableMap_ = new Blockly.VariableMap(this.workspace);
};

Blockly.WorkspaceCache.prototype.dispose = function() {
  this.listeners_.length = 0;
  this.clear();
};

/**
 * Dispose of all blocks and comments in workspace.
 */
Blockly.WorkspaceCache.prototype.clear = function() {
  this.isClearing = true;
  var existingGroup = Blockly.Events.getGroup();
  if (!existingGroup) {
    Blockly.Events.setGroup(true);
  }
  while (this.topBlocks_.length) {
    this.topBlocks_[0].dispose();
  }
  while (this.topComments_.length) {
    this.topComments_[this.topComments_.length - 1].dispose();
  }
  if (!existingGroup) {
    Blockly.Events.setGroup(false);
  }
  this.variableMap_.clear();
  // Any block with a drop-down or WidgetDiv was disposed.
  if (Blockly.DropDownDiv) {
    Blockly.DropDownDiv.hideWithoutAnimation();
  }
  if (Blockly.WidgetDiv) {
    Blockly.WidgetDiv.hide(true);
  }
  if (this.potentialVariableMap_) {
    this.potentialVariableMap_.clear();
  }
  this.isClearing = false;
};


