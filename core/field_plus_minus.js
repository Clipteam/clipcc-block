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

/**
 * @fileoverview Field for plus and minus button.
 * @author cuizhihui030925@outlook.com (Alex Cui)
 */
'use strict';

goog.provide('Blockly.FieldPlusMinus');

goog.require('Blockly.Field');
goog.require('goog.dom');
goog.require('goog.math');
goog.require('goog.userAgent');

Blockly.FieldPlusMinus = function(handlePlus, handleMinus, opt_enablePlus, opt_enableMinus) {
  this.sourceBlock_ = null;
  this.size_ = new goog.math.Size(45, 20);
  this.handlePlus_ = handlePlus;
  this.handleMinus_ = handleMinus;
  this.wrappers_ = [];
  /** @type {SVGElement} */
  this.btnPlus_ = null;
  /** @type {SVGElement} */
  this.btnMinus_ = null;
  /** @type {SVGElement} */
  this.rectPlus_ = null;
  /** @type {SVGElement} */
  this.rectMinus_ = null;
  /** @type {SVGElement} */
  this.imgPlus_ = null;
  /** @type {SVGElement} */
  this.imgMinus_ = null;
  this.enablePlus_ = opt_enablePlus === undefined ? true : opt_enablePlus;
  this.enableMinus_ =  opt_enableMinus === undefined ? true : opt_enableMinus;
};
goog.inherits(Blockly.FieldPlusMinus, Blockly.Field);

Blockly.FieldPlusMinus.prototype.CURSOR = 'default';
Blockly.FieldPlusMinus.prototype.EDITABLE = true;
Blockly.FieldPlusMinus.prototype.SERIALIZABLE = false;

Blockly.FieldPlusMinus.prototype.init = function() {
  if (this.fieldGroup_) {
    return;
  }
  /** @type {SVGElement} */
  this.fieldGroup_ = Blockly.utils.createSvgElement('g', {}, null);
  this.btnPlus_ = Blockly.utils.createSvgElement('g',
      {
        'class': 'blocklyPlusMinus',
        'display': this.enablePlus_ ? '' : 'none'
      },
      this.fieldGroup_
  );
  this.btnMinus_ = Blockly.utils.createSvgElement('g',
      {
        'class': 'blocklyPlusMinus',
        'transform': this.enablePlus_ ? 'translate(25)' : 'translate(0)',
        'display': this.enableMinus_ ? '' : 'none'
      },
      this.fieldGroup_
  );
  this.rectPlus_ = Blockly.utils.createSvgElement('rect',
      {
        'class': 'blocklyBlockBackground blocklyPlusMinusRect',
        'width': 20,
        'height': 20,
        'x': 0,
        'y': 0,
        'rx': Blockly.BlockSvg.CORNER_RADIUS,
        'ry': Blockly.BlockSvg.CORNER_RADIUS,
        'stroke': this.sourceBlock_.getColourTertiary(),
        'fill': this.sourceBlock_.getColour(),
        'fill-opacity': 1
      },
      this.btnPlus_
  );
  this.rectMinus_ = Blockly.utils.createSvgElement('rect',
      {
        'class': 'blocklyBlockBackground blocklyPlusMinusRect',
        'width': 20,
        'height': 20,
        'rx': Blockly.BlockSvg.CORNER_RADIUS,
        'ry': Blockly.BlockSvg.CORNER_RADIUS,
        'stroke': this.sourceBlock_.getColourTertiary(),
        'fill': this.sourceBlock_.getColour(),
        'fill-opacity': 1
      },
      this.btnMinus_
  );
  this.imgPlus_ = Blockly.utils.createSvgElement('image',
      {
        'width': 20,
        'height': 20
      },
      this.btnPlus_
  );
  this.imgMinus_ = Blockly.utils.createSvgElement('image',
      {
        'width': 20,
        'height': 20
      },
      this.btnMinus_
  );
  this.imgPlus_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      Blockly.mainWorkspace.options.pathToMedia + 'plus.svg');
  this.imgMinus_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      Blockly.mainWorkspace.options.pathToMedia + 'minus.svg');
  this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);

  this.calcSize_();

  this.wrappers_ = [
    Blockly.bindEvent_(this.btnPlus_, 'mousedown', this, this.onMouseDown_.bind(this, true)),
    Blockly.bindEvent_(this.btnMinus_, 'mousedown', this, this.onMouseDown_.bind(this, false)),
    Blockly.bindEvent_(this.btnPlus_, 'mouseenter', this, this.handleHover_.bind(this, true, this.rectPlus_)),
    Blockly.bindEvent_(this.btnMinus_, 'mouseenter', this, this.handleHover_.bind(this, true, this.rectMinus_)),
    Blockly.bindEvent_(this.btnPlus_, 'mouseleave', this, this.handleHover_.bind(this, false, this.rectPlus_)),
    Blockly.bindEvent_(this.btnMinus_, 'mouseleave', this, this.handleHover_.bind(this, false, this.rectMinus_))
  ];

  this.render_();
};

/**
 * Construct a FieldPlusMinus from a JSON arg object.
 * @param {!Object} _options A JSON object with options.
 * @returns {!Blockly.FieldPlusMinus} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldPlusMinus.fromJson = function(_options) {
  return new Blockly.FieldPlusMinus();
};

/**
 * Dispose of all DOM objects belonging to this field.
 */
Blockly.FieldPlusMinus.prototype.dispose = function() {
  this.wrappers_.forEach(function(v) {
    Blockly.unbindEvent_(v);
  });
  this.wrappers_ = [];
  goog.dom.removeNode(this.fieldGroup_);
  this.fieldGroup_ = null;
  this.svgElement_ = null;
  this.isPlus_ = false;
};

Blockly.FieldPlusMinus.prototype.calcSize_ = function() {
  if (this.enablePlus_ && this.enableMinus_) {
    this.size_.width = 45;
  } else if (!this.enablePlus_ && !this.enableMinus_) {
    this.size_.width = 0;
  } else {
    this.size_.width = 20;
  }
};

Blockly.FieldPlusMinus.prototype.getSize = function() {
  this.calcSize_();
  return Blockly.FieldPlusMinus.superClass_.getSize.call(this);
};

/**
 * Handle a mouse down event on plus button.
 * @param {boolean} isPlus true if plus button clicked.
 * @param {!MouseEvent} e Mouse down event.
 * @private
 */
Blockly.FieldPlusMinus.prototype.onMouseDown_ = function(isPlus, e) {
  if (!this.sourceBlock_ || !this.sourceBlock_.workspace) {
    return;
  }
  this.isPlus_ = isPlus;
  var gesture = this.sourceBlock_.workspace.getGesture(e);
  if (gesture) {
    gesture.setStartField(this);
  }
  this.useTouchInteraction_ = Blockly.Touch.getTouchIdentifierFromEvent(event) !== 'mouse';
};

/**
 * Process click event.
 * @private
 */
Blockly.FieldPlusMinus.prototype.showEditor_ = function() {
  if (this.isPlus_) {
    this.handlePlus_();
  } else {
    this.handleMinus_();
  }
};

/**
 * Handle hover.
 * @param {boolean} isEnter true if mouse enter, otherwise mouse leave
 * @param {SVGElement} obj rect svg element
 * @private
 */
Blockly.FieldPlusMinus.prototype.handleHover_ = function(isEnter, obj) {
  obj.setAttribute('fill', isEnter
      ? this.sourceBlock_.getColourTertiary() : this.sourceBlock_.getColour());
  this.render_();
};

/**
 * Enable or disable the plus button. (need to call parent block's render)
 * @param {boolean} enable true if enable.
 */
Blockly.FieldPlusMinus.prototype.setEnablePlus = function(enable) {
  if (this.enablePlus_ === enable) return;
  this.enablePlus_ = enable;
  if (!this.fieldGroup_) return;
  if (this.enablePlus_) {
    this.btnPlus_.setAttribute('display', '');
    this.btnMinus_.setAttribute('transform', 'translate(25)');
  } else {
    this.btnPlus_.setAttribute('display', 'none');
    this.btnMinus_.setAttribute('transform', 'translate(0)');
  }
  this.render_();
};

/**
 * Enable or disable the minus button. (need to call parent block's render)
 * @param {boolean} enable true if enable.
 */
Blockly.FieldPlusMinus.prototype.setEnableMinus = function(enable) {
  if (this.enableMinus_ === enable) return;
  this.enableMinus_ = enable;
  if (!this.fieldGroup_) return;
  if (this.enableMinus_) {
    this.btnMinus_.setAttribute('display', '');
  } else {
    this.btnMinus_.setAttribute('display', 'none');
  }
  this.render_();
};

Blockly.FieldPlusMinus.CSS = [
  '.blocklyPlusMinus {',
  '  cursor: default;',
  '}',
  '.blocklyPlusMinusRect {',
  '  transition-duration: 0.3s',
  '}'
];

Blockly.Field.register('field_plus_minus', Blockly.FieldPlusMinus);
