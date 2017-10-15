/* eslint-env mocha */
'use strict';

var timeModule = require('./timemodule.js');
var assert = require('assert');

describe('Time tests', () => {
    it('должен возвращать ПН 00:00', function () {
        let time = new timeModule.Time('ПН 00:00+3');
        assert.strictEqual(time.format('%DD %HH:%MM', 3), 'ПН 00:00');
    });

    it('должен возвращать ПН 00:00', function () {
        let time = new timeModule.Time('ПН 00:00+0');
        assert.strictEqual(time.format('%DD %HH:%MM', 0), 'ПН 00:00');
    });

    it('должен возвращать ПН 04:20', function () {
        let time = new timeModule.Time('ПН 00:20+0');
        assert.strictEqual(time.format('%DD %HH:%MM', 4), 'ПН 04:20');
    });
});

