'use strict';
const { Timedelta, Timestamp, days } = require('./time');


/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

function getBankTimetable(workingHours) {
    let result = [];
    for (let day of days.slice(0, 3)) {
        let fromTs = Timestamp.fromString(day + ' ' + workingHours.from);
        let toTs = Timestamp.fromString(day + ' ' + workingHours.to);
        result.push(new Timedelta(fromTs, toTs));
    }

    return result;
}

function product2(list1, list2) {
    return [].concat(...list1.map(x => list2.map(y => [].concat(x, y))));
}

function cartesian(list1, list2, ...lists) {
    // based on https://stackoverflow.com/a/43053803
    return list2
        ? cartesian(product2(list1, list2), ...lists)
        : product2(list1, [[]]);
}

function getIntervals(tds) {
    let result = [];
    let lower = Timestamp.min();
    for (let td of tds) {
        result.push(new Timedelta(lower, td.fromTs));
        lower = td.toTs;
    }
    result.push(new Timedelta(lower, Timestamp.max()));

    return result;
}


function getMomentInfo(schedule, duration, workingHours) {
    let bankTimetable = getBankTimetable(workingHours);
    let bankOffset = bankTimetable[0].fromTs.offset;
    let available = [];
    let tables = Object.values(schedule).map(x => getIntervals(x.map(Timedelta.fromObj)));
    tables.push(bankTimetable);
    for (let tds of cartesian(...tables)) {
        let intersection = tds.reduce((acc, x) => x.intersect(acc), Timedelta.max());
        let length = intersection.totalMinutes();
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
    let [bankOffset, available] = getMomentInfo(schedule, duration, workingHours);
    let i = 0;
    let j = 0;

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
            let intersection = available[i][0];
            let offset = bankOffset - intersection.fromTs.offset;

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
            let [, repeat] = available[i];
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
