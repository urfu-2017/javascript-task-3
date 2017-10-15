/* eslint-env mocha */
'use strict';
var robbery = require('./robbery.js');
var assert = require('assert');

describe('Мои тесты для robbery.', function () {
    function getMomentFor(time) {
        return robbery.getAppropriateMoment(
            {
                Danny: [
                    { from: 'ПН 11:01+5', to: 'ПН 16:20+5' },
                    { from: 'ВТ 11:05+5', to: 'ВТ 17:50+5' }
                ],
                Rusty: [
                    { from: 'ПН 16:21+5', to: 'ПН 16:50+5' },
                    { from: 'ВТ 11:05+5', to: 'ВТ 17:51+5' }
                ],
                Linus: [
                    { from: 'ПН 14:51+3', to: 'ПН 15:59+3' },
                    { from: 'ПН 21:00+3', to: 'ВТ 09:00+3' },
                    { from: 'СР 09:09+3', to: 'СР 15:50+3' }
                ]
            },
            time,
            { from: '11:00+5', to: '18:00+5' }
        );
    }

    it('Должен находить в начале дня', function () {
        var moment = getMomentFor(5);

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('%DD %HH:%MM'), 'ВТ 11:00'
        );
    });

    it('Должен находить в конце дня. Rusty опаздывает во вторник на 1 минуту [*]', function () {
        var moment = getMomentFor(10);

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('%DD %HH:%MM'), 'СР 17:50'
        );
        assert.ok(!moment.tryLater());

    });

    it('Rusty успевает во вторник [*]', function () {
        var moment = getMomentFor(9);

        assert.ok(moment.exists());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 17:51');
        assert.ok(moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 11:00');
        assert.ok(moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 17:50');
        assert.ok(!moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 17:50');
    });

    it('Украсть за одну минуту [*]', function () {
        var moment = getMomentFor(1);
        assert.ok(moment.exists());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ПН 11:00');
        assert.ok(moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ПН 16:20');
        assert.ok(moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ПН 16:50');
        assert.ok(moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ПН 17:59');
        assert.ok(moment.tryLater());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 11:00');
    });

    it('Все свободны в любое время', function () {
        var moment = robbery.getAppropriateMoment(
            {
                Danny: [],
                Rusty: [],
                Linus: []
            },
            10,
            { from: '12:00+5', to: '15:00+5' }
        );
        assert.ok(moment.exists());
        assert.strictEqual(moment.format('%DD %HH:%MM'), 'ПН 12:00');
    });

    it('Danny не может', function () {
        var moment = robbery.getAppropriateMoment(
            {
                Danny: [
                    { from: 'ПН 00:00+5', to: 'ЧТ 00:00+5' }
                ],
                Rusty: [],
                Linus: []
            },
            10,
            { from: '12:00+5', to: '23:59+5' }
        );
        assert.ok(!moment.exists());
    });

});
