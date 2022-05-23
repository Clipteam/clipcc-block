/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2022 Clip Team
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
