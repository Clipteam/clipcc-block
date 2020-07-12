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

Blockly.ProcedureList.prototype.getProcedureByProccode = function(proccode) {
  for (var j = 0, procedure; procedure = this.procedureList_[j]; j++) {
    if (procedure.getAttribute('proccode') == proccode) {
      return procedure;
    }
  }
  return null;
};

Blockly.ProcedureList.prototype.createProcedureFromMutation = function(mutation) {
  console.log(mutation.getAttribute('proccode'));
  var procedure = this.getProcedureByProccode(mutation.getAttribute('proccode'));
  if (procedure) {
    return procedure;
  }

  this.procedureList_.push(mutation);
  return mutation;
};
