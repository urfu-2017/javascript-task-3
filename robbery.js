'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

exports.converter = function () {
    var MinInHour = 60;
    var MinInDay = 60 * 24;
    var DaysToNum = { 'ПН': 0, 'ВТ': 1, 'СР': 2 };
    var NumToDays = { 0: 'ПН', 1: 'ВТ', 2: 'СР' };

    return {
        toNumber: function (timeString) {
            var parseDate = timeString.split(/ |:|\+/);
            var day = parseDate[0];
            var hour = parseInt(parseDate[1]);
            var min = parseInt(parseDate[2]);
            var offsetInHours = parseInt(parseDate[3]);
            var number =
                DaysToNum[day] * MinInDay +
                hour * MinInHour + min -
                offsetInHours * MinInHour;

            return { number: number, offset: offsetInHours };
        },

        toTime: function (number, offset, template) {
            number += offset * MinInHour;
            var day = NumToDays[Math.floor(number / MinInDay)];
            var hour = Math.floor((number % MinInDay) / MinInHour);
            var min = (number % MinInDay) % MinInHour;
            if (hour < 10) {
                hour = '0' + hour.toString();
            }
            if (min < 10) {
                min = '0' + min.toString();
            }

            var aa = template.replace('%DD', day);
            aa = aa.replace('%HH', hour);
            aa = aa.replace('%MM', min);
            aa = aa.replace('%OO', offset);

            return aa;
        },

        toNumberInterval: function (interval) {
            return {
                from: this.toNumber(interval.from).number,
                to: this.toNumber(interval.to).number
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
    var curInterval = exports.converter().toNumberInterval(timeInterval);
    for (var guy in schedule) {
        if (!schedule.hasOwnProperty(guy)) {
            continue;
        }
        for (var i = 0; i < schedule[guy].length; ++i) {
            var guyInterval = exports.converter().toNumberInterval(schedule[guy][i]);
            var cmp = exports.intervalComparator(curInterval, guyInterval);
            answer = answer && cmp.notIntersect;
        }
    }

    return answer;
};

exports.isGoodTimeForBank = function (timeInterval, bankWorkingIntervals) {
    var curInterval = exports.converter().toNumberInterval(timeInterval);
    for (var i = 0; i < 3; ++i) {
        var workInterval = exports.converter().toNumberInterval(bankWorkingIntervals[i]);
        var cmp = exports.intervalComparator(curInterval, workInterval);
        if (cmp.firstIn) {
            return true;
        }
    }

    return false;
};

exports.findGoodTime = function (start, end, info) {
    for (var timeNum = start; timeNum <= end; ++timeNum) {
        var timeInterval = exports.converter().toTimeInterval(
            { from: timeNum, to: timeNum + info.duration }, info.offset);
        if (exports.isGoodTimeForAllGuys(timeInterval, info.schedule) &&
            exports.isGoodTimeForBank(timeInterval, info.bankIntervals)) {
            return { exist: true, answer: timeNum };
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
    console.info(schedule, duration, workingHours);
    var offset = exports.converter().toNumber('ПН ' + workingHours.from).offset;
    var bankWorkingIntervals = [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }];
    var info = {
        schedule: schedule,
        bankIntervals: bankWorkingIntervals,
        duration: duration,
        offset: offset
    };
    var globalStart = exports.converter().toNumber(bankWorkingIntervals[0].from).number;
    var globalEnd = exports.converter().toNumber(bankWorkingIntervals[2].to).number;
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

            return exports.converter().toTime(answer, offset, template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var nextTryDuration = 30;
            if (answer === undefined) {
                return false;
            }
            result = exports.findGoodTime(answer + nextTryDuration, globalEnd, info);
            if (result.exist) {
                answer = result.answer;
            }

            return result.exist;
        }
    };
};
