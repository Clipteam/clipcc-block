/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
 * https://developers.google.com/blockly/
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

/**
 * @fileoverview Classes for all types of function events.
 */

'use strict';

goog.provide('Blockly.Events.FuncModify');

goog.require('Blockly.Events');
goog.require('Blockly.Events.Abstract');

goog.require('goog.array');
goog.require('goog.math.Coordinate');

/**
 * Class for a function modification event.
 * @param {Object} oldMutation The old mutation.
 * @param {Object} newMutation The new mutation.
 *     to.
 * @extends {Blockly.Events.Abstract}
 * @constructor
 */
Blockly.Events.FuncModify = function(ws, proccode, oldMutation, newMutation) {
  Blockly.Events.FuncModify.superClass_.constructor.call(this);
  this.workspaceId = ws.id;
  this.proccode = proccode;
  this.oldMutation = oldMutation;
  this.newMutation = newMutation;
};
goog.inherits(Blockly.Events.FuncModify, Blockly.Events.Abstract);

/**
 * Type of this event
 * @type {string}
 */
Blockly.Events.FuncModify.prototype.type = Blockly.Events.FUNC_MODIFY;

/**
 * Encode the event as JSON.
 * @return {!Object} JSON representation.
 */
Blockly.Events.FuncModify.prototype.toJson = function() {
  var json = Blockly.Events.FuncModify.superClass_.toJson.call(this);
  json['proccode'] = this.proccode;
  json['oldMutation'] = this.oldMutation;
  json['newMutation'] = this.newMutation;
  return json;
};

/**
 * Decode the JSON event.
 * @param {!Object} json JSON representation.
 */
Blockly.Events.FuncModify.prototype.fromJson = function(json) {
  Blockly.Events.FuncModify.superClass_.fromJson.call(this, json);
  this.proccode = json['proccode'];
  this.oldMutation = json['oldMutation'];
  this.newMutation = json['newMutation'];
};
