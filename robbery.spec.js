/* eslint-env mocha */
'use strict';

var assert = require('assert');

var robbery = require('./robbery');

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

    it('должен уравнивать часовые пояса', function () {
        assert.deepEqual(robbery.equalizeShifts([{ from: 'ПН 09:00+3', to: 'ПН 14:00+3' }], 5),
            [{ from: 'ПН 11:00', to: 'ПН 16:00' }]);
        assert.deepEqual(robbery.equalizeShifts([{ from: 'ПН 09:00+3', to: 'ПН 14:00+3' }], 3),
            [{ from: 'ПН 9:00', to: 'ПН 14:00' }]);
        assert.deepEqual(robbery.equalizeShifts([{ from: 'ПН 09:00+3', to: 'ПН 23:00+3' }], 5),
            [{ from: 'ПН 11:00', to: 'ВТ 1:00' }]);
        assert.deepEqual(robbery.equalizeShifts([{ from: 'ПН 22:00+3', to: 'ПН 23:00+3' }], 5),
            [{ from: 'ВТ 0:00', to: 'ВТ 1:00' }]);
        assert.deepEqual(robbery.equalizeShifts([{ from: 'ПН 22:00+3', to: 'ПН 23:00+3' }], 1),
            [{ from: 'ПН 20:00', to: 'ПН 21:00' }]);

    });

    it('должен пересекать отрезки времени и осталвять свободное', function () {
        let availableTime = {
            from: new Date(0, 0, 0, 10, 0),
            to: new Date(0, 0, 0, 18, 0)
        };
        let busyTime = {
            from: new Date(0, 0, 0, 12, 0),
            to: new Date(0, 0, 0, 18, 0)
        };
        robbery.mergeAvailableAndBusyTime(availableTime,
            busyTime).forEach(date => {
            console.info(date.from.getHours() + ':' + date.from.getMinutes() + '\n' +
                date.to.getHours() + ':' + date.to.getMinutes() + '\n');
        });
        assert.deepEqual([],
            []);
    });

    it('должен заполнить дни ограбления', function () {
        let normSchedule = {
            Danny: [
                { from: 'ПН 12:00', to: 'ПН 17:00' },
                { from: 'ВТ 13:00', to: 'ВТ 16:00' }
            ],
            Rusty: [
                { from: 'ПН 11:30', to: 'ПН 16:30' },
                { from: 'ВТ 13:00', to: 'ВТ 16:00' }
            ],
            Linus: [
                { from: 'ПН 11:00', to: 'ПН 16:00' },
                { from: 'ПН 23:00', to: 'ПН 23:59' },
                { from: 'ВТ 00:00', to: 'ВТ 11:30' },
                { from: 'СР 11:30', to: 'СР 17:00' }
            ]
        };

        assert.deepEqual(robbery.fillActionDays(normSchedule, ['ПН', 'ВТ', 'СР']),
            {
                ПН: [{ from: 'ПН 12:00', 'to': 'ПН 17:00' },
                    { from: 'ПН 11:30', to: 'ПН 16:30' },
                    { from: 'ПН 11:00', to: 'ПН 16:00' },
                    { from: 'ПН 23:00', to: 'ПН 23:59' }],
                ВТ: [{ from: 'ВТ 13:00', 'to': 'ВТ 16:00' },
                    { from: 'ВТ 13:00', 'to': 'ВТ 16:00' },
                    { from: 'ВТ 00:00', 'to': 'ВТ 11:30' }],
                СР: [{ from: 'СР 11:30', to: 'СР 17:00' }]
            });

    });
    it('должен разбить покрывающий несколько дней отрезок', function () {
        assert.deepEqual(robbery.separateSegment({ from: 'ПН 21:00+3', to: 'ВТ 09:30+3' }),
            [{ from: 'ПН 21:00', to: 'ПН 23:59' },
                { from: 'ВТ 00:00', to: 'ВТ 09:30' }]);

        assert.deepEqual(robbery.separateSegment({ from: 'ПН 21:00+3', to: 'СР 09:30+3' }),
            [{ from: 'ПН 21:00', to: 'ПН 23:59' },
                { from: 'ВТ 00:00', to: 'ВТ 23:59' },
                { from: 'СР 00:00', to: 'СР 09:30' }]);

        assert.deepEqual(robbery.separateSegment({ from: 'ПН 21:00+3', to: 'ЧТ 09:30+3' }),
            [{ from: 'ПН 21:00', to: 'ПН 23:59' },
                { from: 'ВТ 00:00', to: 'ВТ 23:59' },
                { from: 'СР 00:00', to: 'СР 23:59' },
                { from: 'ЧТ 00:00', to: 'ЧТ 09:30' }]);
    });
    it('должен приводить расписание к единому виду', function () {
        var schedule = {
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
        };
        assert.deepEqual(robbery.normalizeSchedule(schedule, { from: '10:00+5', to: '18:00+5' }),
            {
                Danny: [
                    { from: 'ПН 12:00', to: 'ПН 17:00' },
                    { from: 'ВТ 13:00', to: 'ВТ 16:00' }
                ],
                Rusty: [
                    { from: 'ПН 11:30', to: 'ПН 16:30' },
                    { from: 'ВТ 13:00', to: 'ВТ 16:00' }
                ],
                Linus: [
                    { from: 'ПН 11:00', to: 'ПН 16:00' },
                    { from: 'ПН 23:00', to: 'ПН 23:59' },
                    { from: 'ВТ 00:00', to: 'ВТ 11:30' },
                    { from: 'СР 11:30', to: 'СР 17:00' }
                ]
            });
    });

    it('должен форматировать существующий момент', function () {
        var moment = getMomentFor(90);

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            'Метим на ВТ, старт в 11:30!'
        );
    });

    it('должен вернуть пустую строку при форматировании несуществующего момента', function () {
        var moment = getMomentFor(121);

        assert.ok(!moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            ''
        );
    });

    if (robbery.isStar) {
        it('должен перемещаться на более поздний момент [*]', function () {
            var moment = getMomentFor(90);

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 16:00');

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 16:30');

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 10:00');
        });

        it('не должен сдвигать момент, если более позднего нет [*]', function () {
            var moment = getMomentFor(90);

            assert.ok(moment.tryLater());
            assert.ok(moment.tryLater());
            assert.ok(moment.tryLater());

            assert.ok(!moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 10:00');
        });
    }
})
;
