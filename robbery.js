'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

exports.converter = function () {
    const MIN_IN_HOUR = 60;
    const MIN_IN_DAY = 60 * 24;
    const DAYS_TO_NUM = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
    const NUM_TO_DAYS = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС' };

    return {

        fullDate: function (day, time) {
            return day + ' ' + time;
        },

        getOffset: function (date) {
            return parseInt(date.split('+')[1]);
        },

        numToDay: function (num) {
            return NUM_TO_DAYS[num];
        },

        numberToTime: function (number, offset) {
            number += offset * MIN_IN_HOUR;

            return {
                day: Math.floor(number / MIN_IN_DAY),
                hour: Math.floor((number % MIN_IN_DAY) / MIN_IN_HOUR),
                min: (number % MIN_IN_DAY) % MIN_IN_HOUR,
                offset: offset
            };
        },

        parseDate: function (date) {
            var parseDate = date.split(/ |:|\+/);
            var day = parseDate[0];
            var hour = parseInt(parseDate[1]);
            var min = parseInt(parseDate[2]);
            var offset = parseInt(parseDate[3]);

            return {
                day: DAYS_TO_NUM[day],
                hour: hour,
                min: min,
                offset: offset
            };

        },

        timeToMin: function (time) {
            return time.day * MIN_IN_DAY +
                   time.hour * MIN_IN_HOUR +
                   time.min -
                   time.offset * MIN_IN_HOUR;

        },

        timeToString: function (time, template) {
            var hour = time.hour;
            var min = time.min;
            if (hour < 10) {
                hour = '0' + hour.toString();
            }
            if (min < 10) {
                min = '0' + min.toString();
            }

            return template.replace('%DD', NUM_TO_DAYS[time.day])
                .replace('%HH', hour)
                .replace('%MM', min)
                .replace('%OO', time.offset);

        },

        getTimeBankIntervals: function (workingHours, bankFirstDay, bankLastDay) {
            var timeBankIntervals = [];
            for (var i = bankFirstDay; i <= bankLastDay; ++i) {
                var workInterval =
                {
                    begin: this.parseDate(this.fullDate(this.numToDay(i), workingHours.from)),
                    end: this.parseDate(this.fullDate(this.numToDay(i), workingHours.to))
                };
                timeBankIntervals.push(workInterval);
            }

            return timeBankIntervals;
        },

        convertToTimeSchedule: function (schedule) {
            var timeSchedule = {};
            for (var guy in schedule) {
                if (!schedule.hasOwnProperty(guy)) {
                    continue;
                }
                timeSchedule[guy] = [];
                for (var i = 0; i < schedule[guy].length; ++i) {
                    var timeInterval = {
                        begin: this.parseDate(schedule[guy][i].from),
                        end: this.parseDate(schedule[guy][i].to)
                    };
                    timeSchedule[guy].push(timeInterval);
                }
            }

            return timeSchedule;
        }

    };
};

exports.timeIntervalComparator = function (firstTimeInterval, secondTimeInterval) {
    var converter = exports.converter();
    var firstBegin = converter.timeToMin(firstTimeInterval.begin);
    var firstEnd = converter.timeToMin(firstTimeInterval.end);
    var secondBegin = converter.timeToMin(secondTimeInterval.begin);
    var secondEnd = converter.timeToMin(secondTimeInterval.end);

    return {
        notIntersect: (firstEnd <= secondBegin || firstBegin >= secondEnd),
        firstIn: (secondBegin <= firstBegin && firstEnd <= secondEnd)
    };
};

exports.isGoodTimeForAllGuys = function (timeInterval, timeSchedule) {
    var answer = true;
    for (var guy in timeSchedule) {
        if (!timeSchedule.hasOwnProperty(guy)) {
            continue;
        }
        for (var i = 0; i < timeSchedule[guy].length; ++i) {
            var cmp = exports.timeIntervalComparator(timeInterval, timeSchedule[guy][i]);
            answer = answer && cmp.notIntersect;
        }
    }

    return answer;
};

exports.isGoodTimeForBank = function (timeInterval, timeBankIntervals) {
    for (var bankInterval in timeBankIntervals) {
        if (!timeBankIntervals.hasOwnProperty(bankInterval)) {
            continue;
        }
        var cmp = exports.timeIntervalComparator(timeInterval, timeBankIntervals[bankInterval]);
        if (cmp.firstIn) {
            return true;
        }
    }

    return false;
};

exports.findGoodTime = function (startTime, endTime, info) {
    var converter = exports.converter();
    var start = converter.timeToMin(startTime);
    var end = converter.timeToMin(endTime);
    for (var timeNum = start; timeNum <= end; ++timeNum) {
        var timeInterval =
        {
            begin: converter.numberToTime(timeNum, info.bankOffset),
            end: converter.numberToTime(timeNum + info.duration, info.bankOffset)
        };
        if (exports.isGoodTimeForAllGuys(timeInterval, info.timeSchedule) &&
            exports.isGoodTimeForBank(timeInterval, info.timeBankIntervals)) {
            return {
                exist: true,
                answer: converter.numberToTime(timeNum, info.bankOffset)
            };
        }
    }

    return { exist: false };
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const BANK_FIRST_DAY = 0;
    const BANK_LAST_DAY = 2;
    console.info(schedule, duration, workingHours);
    var converter = exports.converter();
    var info = {
        timeSchedule: converter.convertToTimeSchedule(schedule),
        timeBankIntervals: converter.getTimeBankIntervals(workingHours,
            BANK_FIRST_DAY, BANK_LAST_DAY),
        duration: duration,
        bankOffset: converter.getOffset(workingHours.from)
    };
    var globalStartTime = info.timeBankIntervals[0].begin;
    var globalEndTime = info.timeBankIntervals[info.timeBankIntervals.length - 1].end;
    var result = exports.findGoodTime(globalStartTime, globalEndTime, info);
    var existRobberyTime = result.exist;
    var robberyTime = result.answer;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return existRobberyTime;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTime === undefined) {
                return '';
            }

            return converter.timeToString(robberyTime, template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const NEXT_TRY_OFFSET = 30;
            if (robberyTime === undefined) {
                return false;
            }
            var newStartTime = converter.numberToTime(
                converter.timeToMin(robberyTime) + NEXT_TRY_OFFSET, info.bankOffset);
            result = exports.findGoodTime(newStartTime, globalEndTime, info);
            if (result.exist) {
                robberyTime = result.answer;
            }

            return result.exist;
        }
    };
};
