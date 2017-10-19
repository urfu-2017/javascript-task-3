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
 * @returns {Object}
 */

var DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР'];

function convertToHours(mins) {
    var hours = parseInt(mins / 60);
    var minutes = mins % 60;
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (hours < 10) {
        hours = '0' + hours;
    }

    return hours + ':' + minutes;
}

function convertToMinutes(time) {
    var hours = parseInt(time.split(':')[0]);
    var mins = parseInt(time.split(':')[1]);

    return hours * 60 + mins;
}

function customSort(x, y) {
    var dayFromX = x.day;
    var dayFromY = y.day;
    var timeFromX = x.from.match(/\d{1,2}/g).join('');
    var timeFromY = y.from.match(/\d{1,2}/g).join('');
    var timeToX = x.to.match(/\d{1,2}/g).join('');
    var timeToY = y.to.match(/\d{1,2}/g).join('');
    if (dayFromX !== dayFromY) {
        return DAYS_OF_WEEK.indexOf(dayFromX) - DAYS_OF_WEEK.indexOf(dayFromY);
    }
    if (timeFromX !== timeFromY) {
        return timeFromX - timeFromY;
    }

    return timeToX - timeToY;
}

function getMax(maxFrom, current) {

    return maxFrom > current ? convertToHours(maxFrom).match(/\d{1,2}/g)
        .join('')
        : convertToHours(current).match(/\d{1,2}/g)
            .join('');
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {

    function convertToBankTimezone(str) {
        var bankTimezone = parseInt(workingHours.from.split('+')[1]);
        var day = str.split(' ')[0];
        var time = str.match(/\d{1,2}/g);
        var newHours = parseInt(time[0]) + bankTimezone - str.split('+')[1];
        if (newHours > 24) {
            newHours -= 24;
        } else if (newHours < 0) {
            newHours += 24;
        }
        if (newHours < 10) {
            newHours = '0' + newHours;
        }

        return (day + ' ' + newHours + ':' + time[1] + '+' + bankTimezone);
    }

    function splitIntervalsOverDay(robber, record) {
        var dayOfWeek = schedule[robber][record].from.slice(0, 2);
        if (DAYS_OF_WEEK.indexOf(schedule[robber][record].to.slice(0, 2)) === -1) {
            schedule[robber][record].to = 'СР 23:59+5';
        }
        if (dayOfWeek === 'ПН' && schedule[robber][record].to.slice(0, 2) === 'СР') {
            schedule[robber].push({
                from: 'СР 00:00+5',
                to: 'CP' + schedule[robber][record].to.slice(2)
            });
            schedule[robber].push({
                from: 'ВТ 00:00+5',
                to: 'ВТ 23:59+5'
            });
            schedule[robber][record].to = 'ПН 23:59+5';
        } else if (dayOfWeek !== schedule[robber][record].to.slice(0, 2)) {
            schedule[robber].push({
                from: schedule[robber][record].to.slice(0, 2) + ' 00:00+5',
                to: schedule[robber][record].to
            });
            schedule[robber][record].to = dayOfWeek + ' 23:59+5';
        }
    }

    function cutForBankHours(robber) {
        for (var record in schedule[robber]) {
            if (!schedule[robber].hasOwnProperty(record)) {
                continue;
            }
            var from = convertToMinutes(schedule[robber][record].from.slice(3, 8));
            var to = convertToMinutes(schedule[robber][record].to.slice(3, 8));
            var bankFrom = convertToMinutes(workingHours.from.split('+')[0]);
            var bankTo = convertToMinutes(workingHours.to.split('+')[0]);
            if (from < bankFrom) {
                schedule[robber][record].from = schedule[robber][record].from.slice(0, 3) +
                    workingHours.from;
            }
            if (to > bankTo) {
                schedule[robber][record].to = schedule[robber][record].from.slice(0, 3) +
                    workingHours.to;
            }
        }
    }

    function convertByBankRange() {
        for (var robber in schedule) {
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            cutForBankHours(robber);
        }
    }

    function addRecordWhenBusy(day, robber, intervals) {
        for (var record in schedule[robber]) {
            if (!schedule[robber].hasOwnProperty(record)) {
                continue;
            }
            if (schedule[robber][record].from.slice(0, 2) === DAYS_OF_WEEK[day]) {
                intervals.push({
                    day: DAYS_OF_WEEK[day],
                    from: schedule[robber][record].from.match(/\d{1,2}:\d{1,2}/g).toString(),
                    to: schedule[robber][record].to.match(/\d{1,2}:\d{1,2}/g).toString()
                });
            }
        }

    }

    function addRecordInCorrectForm(robber) {
        for (var record in schedule[robber]) {
            if (!schedule[robber].hasOwnProperty(record)) {
                continue;
            }
            schedule[robber][record].from =
                convertToBankTimezone(schedule[robber][record].from);
            schedule[robber][record].to =
                convertToBankTimezone(schedule[robber][record].to);
            splitIntervalsOverDay(robber, record);
        }
    }

    function setScheduleCorrectForm() {
        for (var robber in schedule) {
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            addRecordInCorrectForm(robber);
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            schedule[robber] = schedule[robber].filter(function (rec) {
                var from = convertToMinutes(rec.from.slice(3, 8));
                var to = convertToMinutes(rec.to.slice(3, 8));
                var bankFrom = convertToMinutes(workingHours.from.split('+')[0]);
                var bankTo = convertToMinutes(workingHours.to.split('+')[0]);

                return !(from <= bankFrom && to <= bankFrom || from >= bankTo && to >= bankTo);
            });
        }
        convertByBankRange();
    }

    function createScheduleWhenBusy(day, intervals) {
        for (var robber in schedule) {
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            addRecordWhenBusy(day, robber, intervals);
        }
    }

    function createScheduleWhenFree(day, result, intervals) {
        var maxFrom = 0;
        for (var i = 1; i < intervals.length; i++) {
            intervals.sort(customSort);
            var intervalFrom = intervals[i - 1].to.match(/\d{1,2}/g).join('');
            var intervalTo = intervals[i].from.match(/\d{1,2}/g).join('');
            if (maxFrom < convertToMinutes(intervals[i - 1].to)) {
                maxFrom = convertToMinutes(intervals[i - 1].to);
            }
            if (convertToMinutes(intervals[i].from) - convertToMinutes(intervals[i - 1].to) >=
                duration) {
                intervalFrom = getMax(maxFrom, convertToMinutes(intervals[i - 1].to));
                result.push({
                    day: DAYS_OF_WEEK[day],
                    from: intervalFrom.slice(0, 2) + ':' + intervalFrom.slice(2),
                    to: intervalTo.slice(0, 2) + ':' + intervalTo.slice(2)
                });
            }
        }
    }

    function checkRangeLimits(day, result, intervals) {
        intervals.sort(customSort);
        var minFrom = intervals[0].from;
        intervals.sort(function (x, y) {

            return x.to.match(/\d{2}/g).join('') -
                y.to.match(/\d{2}/g).join('');
        });
        var maxTo = intervals[intervals.length - 1].to;
        var bankFrom = workingHours.from.split('+')[0];
        var bankTo = workingHours.to.split('+')[0];
        if (convertToMinutes(minFrom) - convertToMinutes(bankFrom) >= duration) {
            result.push({
                day: DAYS_OF_WEEK[day],
                from: bankFrom.slice(0, 2) + ':' + bankFrom.slice(3),
                to: minFrom.slice(0, 2) + ':' + minFrom.slice(3)
            });
        }
        if (convertToMinutes(bankTo) - convertToMinutes(maxTo) >= duration) {
            result.push({
                day: DAYS_OF_WEEK[day],
                from: maxTo.slice(0, 2) + ':' + maxTo.slice(3),
                to: bankTo.slice(0, 2) + ':' + bankTo.slice(3)
            });
        }
    }

    function getResultsForTryLater(cur, record, result) {
        while (cur + 30 <= (convertToMinutes(record.to) - duration)) {
            cur += 30;
            result.push({
                day: record.day,
                from: convertToHours(cur),
                to: convertToHours(cur + duration)
            });
        }
    }

    function modifyResult(result) {
        result.sort(customSort);
        for (var i = 0; i < result.length; i++) {
            if (convertToMinutes(result[i].to) - convertToMinutes(result[i].from) >=
                duration + 30) {
                var cur = convertToMinutes(result[i].from);
                getResultsForTryLater(cur, result[i], result);
                result[i].to = convertToHours(convertToMinutes(result[i].from) + duration);
            }
        }
        result.sort(customSort);
    }

    function formResult(intervals, result) {
        for (var i = 0; i < DAYS_OF_WEEK.length; i++) {
            createScheduleWhenBusy(i, intervals);
            intervals.sort(customSort);
            if (intervals.length === 0) {
                result.push({
                    day: DAYS_OF_WEEK[i],
                    from: workingHours.from.split('+')[0],
                    to: workingHours.to.split('+')[0]
                });
            } else if (intervals.length === 1) {
                checkRangeLimits(i, result, intervals);
            } else if (intervals.length > 1) {
                createScheduleWhenFree(i, result, intervals);
                checkRangeLimits(i, result, intervals);
            }
            intervals = [];
        }
    }

    function getRobberySchedule() {
        if (duration <= 0) {
            return [];
        }
        setScheduleCorrectForm();
        var intervals = [];
        var result = [];
        formResult(intervals, result);
        if (result.length !== 0) {
            modifyResult(result);
        }

        return result;
    }

    return {

        daysForRobbery: getRobberySchedule(),

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return this.daysForRobbery.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return ('');
            }

            return template.replace('%HH', this.daysForRobbery[0].from.split(':')[0])
                .replace('%MM', this.daysForRobbery[0].from.split(':')[1])
                .replace('%DD', this.daysForRobbery[0].day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.daysForRobbery.length === 0) {
                return false;
            }
            var willRob = this.daysForRobbery.length > 1;
            if (this.daysForRobbery.length > 1) {
                this.daysForRobbery.splice(0, 1);
            }

            return willRob;
        }
    };
};
