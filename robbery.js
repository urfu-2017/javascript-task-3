'use strict';
const time = require('./time');
var Timedelta = time.Timedelta;
var Timestamp = time.Timestamp;
var days = time.days;


/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

function getBankTimetable(workingHours) {
    var result = [];
    for (var day of days.slice(0, 3)) {
        var fromTs = Timestamp.fromString(day + ' ' + workingHours.from);
        var toTs = Timestamp.fromString(day + ' ' + workingHours.to);
        result.push(new Timedelta(fromTs, toTs));
    }

    return result;
}

function cartesian(a, b, ...c) {
    const f = (d, e) => [].concat(...d.map(x => e.map(y => [].concat(x, y))));

    return b ? cartesian(f(a, b), ...c) : a;
}

function getIntervals(tds) {
    var result = [];
    var lower = Timestamp.min();
    for (var td of tds) {
        result.push(new Timedelta(lower, td.fromTs));
        lower = td.toTs;
    }
    result.push(new Timedelta(lower, Timestamp.max()));

    return result;
}


function getMomentInfo(schedule, duration, workingHours) {
    var bankTimetable = getBankTimetable(workingHours);
    var bankOffset = bankTimetable[0].fromTs.offset;
    var tables = Object.values(schedule).map(x => getIntervals(x.map(Timedelta.fromObj)));
    tables.push(bankTimetable);
    tables.push(bankTimetable); // bypass cartesian product of one element
    var available = [];
    for (var tds of cartesian(...tables)) {
        var intersection = tds.reduce((acc, x) => x.intersect(acc), Timedelta.max());
        var length = intersection.totalMinutes();
        if (length >= duration) {
            available.push([intersection, Math.trunc((length - duration) / 30)]);
        }
    }

    return [bankOffset, available];
}


/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var [bankOffset, available] = getMomentInfo(schedule, duration, workingHours);
    var i = 0;
    var j = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return i < available.length;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (i >= available.length) {
                return '';
            }
            var intersection = available[i][0];
            var offset = bankOffset - intersection.fromTs.offset;

            return intersection.fromTs
                .addMinutes(offset * 60)
                .addMinutes(j * 30)
                .format(template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (i >= available.length) {
                return false;
            }
            var [, repeat] = available[i];
            if (++j > repeat) {
                j = 0;
                i++;
            }
            if (i >= available.length) {
                i--;
                j = repeat;

                return false;
            }

            return true;
        }
    };
};
