/* eslint-env mocha */
'use strict';

let assert = require('assert');

let robbery = require('./robbery');

describe('robbery.convertTime()', function () {
    it('should give the correct time', function () {
        assert.strictEqual(robbery.convertTime('ПН 23:59+5', 6), 'ВТ 00:59+6');
        assert.strictEqual(robbery.convertTime('ЧТ 05:59+24', 2), 'СР 07:59+2');
        assert.strictEqual(robbery.convertTime('ВС 22:59+1', 2), 'ВС 23:59+2');
        assert.strictEqual(robbery.convertTime('ПН 23:59+5', 3), 'ПН 21:59+3');
        assert.strictEqual(robbery.convertTime('ПН 23:59+5', 5), 'ПН 23:59+5');
    });
});

describe('robbery.less()', function () {
    it('should be ok', function () {
        assert.strictEqual(robbery.less('ПН 11:30+5', 'ПН 12:00+5'), true);
        assert.strictEqual(robbery.less('ПН 23:00+5', 'ВТ 23:59+5'), true);
        assert.strictEqual(robbery.less('ПН 23:59+5', 'ПН 00:59+5'), false);
        assert.strictEqual(robbery.less('СР 23:59+5', 'ВТ 00:59+5'), false);
    });
});

describe('robbery.getAppropriateMoment()', function () {
    function getMomentFor(time) {
        return robbery.getAppropriateMoment(
            {
                Danny: [
                    { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
                    { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
                ],
                Rusty: [
                    { from: 'ПН 11:30+5', to: 'ПН 16:30+5' },
                    { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
                ],
                Linus: [
                    { from: 'ПН 09:00+3', to: 'ПН 14:00+3' },
                    { from: 'ПН 21:00+3', to: 'ВТ 09:30+3' },
                    { from: 'СР 09:30+3', to: 'СР 15:00+3' }
                ]
            },
            time,
            { from: '10:00+5', to: '18:00+5' }
        );
    }

    it('должен форматировать существующий момент', function () {
        let moment = getMomentFor(90);

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            'Метим на ВТ, старт в 11:30!'
        );
    });

    it('должен вернуть пустую строку при форматировании несуществующего момента', function () {
        let moment = getMomentFor(121);

        assert.ok(!moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            ''
        );
    });

    if (robbery.isStar) {
        it('должен перемещаться на более поздний момент [*]', function () {
            let moment = getMomentFor(90);

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 16:00');

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 16:30');

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 10:00');
        });

        it('не должен сдвигать момент, если более позднего нет [*]', function () {
            let moment = getMomentFor(90);

            assert.ok(moment.tryLater());
            assert.ok(moment.tryLater());
            assert.ok(moment.tryLater());

            assert.ok(!moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 10:00');
        });
    }
});
