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

    it ('ПН 00:00', function () {
        let time = new timeModule.Time('ПН 00:00+2');
        let timeFromTotal = new timeModule.Time(time.getTotal(), 0);
        assert.strictEqual(timeFromTotal.format('%DD %HH:%MM', 4), 'ПН 02:00');
    });

    it ('СР 04:20', function () {
        let time = new timeModule.Time('СР 00:20+0');
        let timeFromTotal = new timeModule.Time(time.getTotal(), 0);
        assert.strictEqual(timeFromTotal.format('%DD %HH:%MM', 4), 'СР 04:20');
    });

    it ('СР 23:56', function () {
        let time = new timeModule.Time('СР 23:56+0');
        let timeFromTotal = new timeModule.Time(time.getTotal(), 0);
        assert.strictEqual(timeFromTotal.format('%DD %HH:%MM', 1), 'ЧТ 00:56');
    });

    it ('ВС 23:59', function () {
        let time = new timeModule.Time('ВС 22:59+0');
        let timeFromTotal = new timeModule.Time(time.getTotal(), 0);
        assert.strictEqual(timeFromTotal.format('%DD %HH:%MM', 1), 'ВС 23:59');
    });
});

