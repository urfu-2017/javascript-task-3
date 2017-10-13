'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @param {String} bankHourZone
 * @returns {Object}
 */

const DAYS_FOR_ATTACK = ['ПН', 'ВТ', 'СР'];
const NAMES = ['Danny', 'Rusty', 'Linus'];
const MS_IN_MINUTE = 60000;
const HALF_HOUR = 30;
const YEAR = 2018;
const MONTH = 0;


function getRoberryTime(intervals, utc) {
    return intervals.map(function (interval) {
        return {
            from: getInterval(interval.from, utc),
            to: getInterval(interval.to, utc)
        };
    });
}

function getInterval(time, utc) {
    let { day, hour, minute, utc: utcPoberry } = parseRobberyInterval(time);
    let shift = utcPoberry - utc;

    return createDate(day, hour - shift, minute);
}

function createDate(day, hour, minute) {
    let numberDay = DAYS_FOR_ATTACK.indexOf(day) + 1;
    if (hour > 23 || hour < 0) {
        var sign = hour > 23 ? 1 : -1;
        hour -= 24 * sign;
        numberDay += sign;
    }

    return Date.parse(new Date(YEAR, MONTH, numberDay, hour, minute, 0));
}

function getIntervalsClosedBank(workingHours) {
    var intervals = [];
    var startBankInterval = parseBankInterval(workingHours.from);
    var endBankInterval = parseBankInterval(workingHours.to);
    DAYS_FOR_ATTACK.forEach(function (day) {
        intervals.push (
            {
                from: createDate(day, 0, 0),
                to: createDate(day, startBankInterval.hour, startBankInterval.minute)
            },
            {
                from: createDate(day, endBankInterval.hour, endBankInterval.minute),
                to: createDate(day, 23, 59)
            });
    });

    return intervals;
}

function getIntervalForAttack(intervals, duration, start) {
    let finedInterval;
    let interval1 = start || intervals[0];
    for (let interval2 of intervals) {
        if (interval2.from - interval1.to >= duration * MS_IN_MINUTE) {
            finedInterval = interval1;
            break;
        }
        interval1 = interval2.to >= interval1.to ? interval2 : interval1;
    }

    return finedInterval;

}
function getNumberLengthTwo(number) {
    return number < 10 ? '0' + number : number;
}

function sortIntervals(robberyTime) {
    return robberyTime.sort(function (firstInterval, secondInterval) {
        return firstInterval.from - secondInterval.from;
    });
}
function parseRobberyInterval(time) {
    let formatRobberyTime = /([А-Я]{2})\s(\d{2}):(\d{2})\+(\d+)/;
    let [, day = null, hour = null, minute = null, utc = null] = formatRobberyTime.exec(time);

    return {
        day,
        hour,
        minute,
        utc
    };
}

function parseBankInterval(time) {
    let formatBankTime = /(\d{2}):(\d{2})\+(\d+)/;
    let [, hour = null, minute = null, utc = null] = formatBankTime.exec(time);

    return {
        hour,
        minute,
        utc
    };
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let utc = parseBankInterval(workingHours.from).utc;
    let robbery = [];
    for (let name of NAMES) {
        robbery = robbery.concat(getRoberryTime(schedule[name], utc));
    }
    robbery = robbery.concat(getIntervalsClosedBank(workingHours));
    robbery = sortIntervals(robbery);
    let robberyPoint = getIntervalForAttack(robbery, duration);


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return typeof robberyPoint !== 'undefined';
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                var timeAttack = new Date(robberyPoint.to);

                return template
                    .replace(/%DD/, DAYS_FOR_ATTACK[timeAttack.getDay() - 1])
                    .replace(/%HH/, getNumberLengthTwo(timeAttack.getHours()))
                    .replace(/%MM/, getNumberLengthTwo(timeAttack.getMinutes()));

            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let isFindTime = false;
            if (robberyPoint) {
                let startInterval = {
                    from: robberyPoint.from,
                    to: robberyPoint.to + HALF_HOUR * MS_IN_MINUTE

                };
                let newStartRobbery = getIntervalForAttack(robbery, duration, startInterval);
                if (newStartRobbery) {
                    robberyPoint = newStartRobbery;
                    isFindTime = true;
                }
            }

            return isFindTime;

        }
    };
};
