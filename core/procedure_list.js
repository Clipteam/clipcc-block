'use strict';

goog.provide('Blockly.ProcedureList');

Blockly.ProcedureList = function(workspace) {
  this.procedureList_ = [];

  /**
   * The workspace this list belongs to.
   * @type {!Blockly.Workspace}
   */
  this.workspace = workspace;
};

Blockly.ProcedureList.prototype.clear = function() {
  this.procedureList_ = [];
};

Blockly.ProcedureList.prototype.getProcedureByProccode = function(proccode) {
  for (var j = 0, procedure; procedure = this.procedureList_[j]; j++) {
    if (procedure.getAttribute('proccode') == proccode) {
      return procedure;
    }
  }
  return null;
};

Blockly.ProcedureList.prototype.createProcedureFromMutation = function(mutation) {
  this.procedureList_.push(mutation);
};

Blockly.ProcedureList.prototype.deleteProcedureByProccode = function(proccode) {
  for (var j = 0, procedure; procedure = this.procedureList_[j]; j++) {
    if (procedure.getAttribute('proccode') == proccode) {
      this.procedureList_.splice(j, 1);
      break;
    }
  }
};

Blockly.ProcedureList.prototype.getProcedureList = function() {
  return this.procedureList_;
};
