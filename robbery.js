'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

exports.converter = function () {
    const MIN_IN_HOUR = 60;
    const MIN_IN_DAY = 60 * 24;
    const DAYS_TO_NUM = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6};
    const NUM_TO_DAYS = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС'};

    return {
        fullDate: function(day, time) {
            return day + ' ' + time;
        },
        getOffset: function(date) {
            return parseInt(date.split('+')[1]);
        },

        dayToNum: function(day) {
            return DAYS_TO_NUM[day];
        },

        NumToDay: function(num) {
            return NUM_TO_DAYS[num];
        },

        parseDate: function (date) {
            var parseDate = date.split(/ |:|\+/);
            var day = parseDate[0];
            var hour = parseInt(parseDate[1]);
            var min = parseInt(parseDate[2]);
            var offset = parseInt(parseDate[3]);

            return {day: day, hour:hour, min:min, offset:offset};

        },

        timeToNumber: function (time) {
            return DAYS_TO_NUM[time.day] * MIN_IN_DAY +
                   time.hour * MIN_IN_HOUR + time.min -
                   time.offset * MIN_IN_HOUR;

        },

        timeToString: function (time, template) {
            return template.replace('%DD', time.day)
                .replace('%HH', time.hour)
                .replace('%MM', time.min)
                .replace('%OO', time.offset);

        },

        toNumber: function (timeString) {
            var parseDate = timeString.split(/ |:|\+/);
            var day = parseDate[0];
            var hour = parseInt(parseDate[1]);
            var min = parseInt(parseDate[2]);
            var offset = parseInt(parseDate[3]);

            return DAYS_TO_NUM[day] * MIN_IN_DAY +
                   hour * MIN_IN_HOUR + min -
                   offset * MIN_IN_HOUR;
        },

        toTime: function (number, offset, template) {
            number += offset * MIN_IN_HOUR;
            var day = NUM_TO_DAYS[Math.floor(number / MIN_IN_DAY)];
            var hour = Math.floor((number % MIN_IN_DAY) / MIN_IN_HOUR);
            var min = (number % MIN_IN_DAY) % MIN_IN_HOUR;
            if (hour < 10) {
                hour = '0' + hour.toString();
            }
            if (min < 10) {
                min = '0' + min.toString();
            }

            return template.replace('%DD', day)
                           .replace('%HH', hour)
                           .replace('%MM', min)
                           .replace('%OO', offset);
        },

        toNumberInterval: function (interval) {
            return {
                from: this.toNumber(interval.from),
                to: this.toNumber(interval.to)
            };
        },

        toTimeInterval: function (interval, offset) {
            return {
                from: this.toTime(interval.from, offset, '%DD %HH:%MM+%OO'),
                to: this.toTime(interval.to, offset, '%DD %HH:%MM+%OO')
            };
        }
    };
};

exports.intervalComparator = function (interval1, interval2) {
    return {
        notIntersect: (interval1.to <= interval2.from || interval1.from >= interval2.to),
        firstIn: (interval2.from <= interval1.from && interval1.to <= interval2.to)
    };
};

exports.isGoodTimeForAllGuys = function (timeInterval, schedule) {
    var answer = true;
    var converter = exports.converter();
    var curInterval = converter.toNumberInterval(timeInterval);
    for (var guy in schedule) {
        if (!schedule.hasOwnProperty(guy)) {
            continue;
        }
        for (var i = 0; i < schedule[guy].length; ++i) {
            var guyInterval = converter.toNumberInterval(schedule[guy][i]);
            var cmp = exports.intervalComparator(curInterval, guyInterval);
            answer = answer && cmp.notIntersect;
        }
    }

    return answer;
};

exports.isGoodTimeForBank = function (timeInterval, workingHours, bankFirstDay, bankLastDay) {
    var converter = exports.converter();
    var currentInterval = converter.toNumberInterval(timeInterval);
    var firstDay = converter.dayToNum(bankFirstDay);
    var lastDay = converter.dayToNum(bankLastDay);
    for (var i = firstDay; i <=  lastDay; ++i) {
        var workInterval = converter.toNumberInterval(
            {
                from: converter.fullDate(converter.NumToDay(i), workingHours.from),
                to: converter.fullDate(converter.NumToDay(i), workingHours.to)
            }
        );
        var cmp = exports.intervalComparator(currentInterval, workInterval);
        if (cmp.firstIn) {
            return true;
        }
    }

    return false;
};

exports.findGoodTime = function (start, end, info) {
    var converter = exports.converter();
    for (var timeNum = start; timeNum <= end; ++timeNum) {
        var timeInterval = converter.toTimeInterval(
            {
                from: timeNum,
                to: timeNum + info.duration
            },
            info.bankOffset
        );
        if (exports.isGoodTimeForAllGuys(timeInterval, info.schedule) &&
            exports.isGoodTimeForBank(timeInterval,
                info.workingHours, info.bankFirstDay, info.bankLastDay)) {
            return {
                exist: true,
                answer: timeNum
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
    const BANK_FIRST_DAY = 'ПН';
    const BANK_LAST_DAY = 'СР';
    console.info(schedule, duration, workingHours);
    var converter = exports.converter();
    var bankOffset = converter.getOffset(workingHours.from);
    var info = {
        schedule: schedule,
        workingHours: workingHours,
        duration: duration,
        bankOffset: bankOffset,
        bankFirstDay: BANK_FIRST_DAY,
        bankLastDay: BANK_LAST_DAY
    };
    var globalStart = converter.toNumber(converter.fullDate(BANK_FIRST_DAY, workingHours.from));
    var globalEnd = converter.toNumber(converter.fullDate(BANK_LAST_DAY, workingHours.to));
    var result = exports.findGoodTime(globalStart, globalEnd, info);
    var exist = result.exist;
    var answer = result.answer;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return exist;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (answer === undefined) {
                return '';
            }

            return converter.toTime(answer, bankOffset, template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const NEXT_TRY_OFFSET = 30;
            if (answer === undefined) {
                return false;
            }
            result = exports.findGoodTime(answer+NEXT_TRY_OFFSET, globalEnd, info);
            if (result.exist) {
                answer = result.answer;
            }

            return result.exist;
        }
    };
};
