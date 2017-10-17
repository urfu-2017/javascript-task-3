'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const DAYS_OF_THE_WEEK = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const TIME_FORMAT = /^(\d\d):(\d\d)\+(\d+)$/;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const HALF_AN_HOUR = 30;
const DAYS_FOR_ROBBERY = 3;

let isIntersected = (first, second) => first.to >= second.from && second.to >= first.from;

function parseTime(stringTime) {
    let [, hoursFrom, minutesFrom, timeZone] = stringTime.match(TIME_FORMAT);

    return [parseInt(hoursFrom), parseInt(minutesFrom), parseInt(timeZone)];
}

let timeToMinutes = (dayNumber, hh, mm, diff) =>
    ((dayNumber * HOURS_IN_DAY + hh + diff) * MINUTES_IN_HOUR) + mm;

function minutesToTime(startMinute) {
    let mm = startMinute % MINUTES_IN_HOUR;
    let hh = ((startMinute - mm) / MINUTES_IN_HOUR) % HOURS_IN_DAY;
    let dayNumber = Math.floor(((startMinute - mm) / MINUTES_IN_HOUR) / HOURS_IN_DAY);
    let dd = Object.keys(DAYS_OF_THE_WEEK)[dayNumber];
    hh = ('0' + hh).slice(-2);
    mm = ('0' + mm).slice(-2);

    return [dd, hh, mm];
}

function getBankScheduleAndTimeZone(workingHours) {
    let [hoursFrom, minutesFrom, timeZone] = parseTime(workingHours.from);
    let [hoursTo, minutesTo] = parseTime(workingHours.to);
    let bankSchedule = [];
    for (let i = 0; i < DAYS_FOR_ROBBERY; i++) {
        let fromInMinutes = timeToMinutes(i, hoursFrom, minutesFrom, 0);
        let toInMinutes = timeToMinutes(i, hoursTo, minutesTo, 0);
        bankSchedule.push({ from: fromInMinutes, to: toInMinutes });
    }

    return [bankSchedule, timeZone];
}

function robberTimeInMinutes(time, bankTimeZone) {
    let dayNumber = DAYS_OF_THE_WEEK[time.substring(0, 2)];
    let [hh, mm, timeZone] = parseTime(time.substring(3));
    let diff = bankTimeZone - timeZone;
    let result = timeToMinutes(dayNumber, hh, mm, diff);

    return result;
}

function getGeneralSchedule(schedule, bankTimeZone) {
    let result = [];
    Object.keys(schedule).forEach(function (robber) {
        schedule[robber].forEach(function (time) {
            let from = robberTimeInMinutes(time.from, bankTimeZone);
            let to = robberTimeInMinutes(time.to, bankTimeZone);
            result.push({ from, to });
        });
    });
    result = result.sort((a, b) => a.from - b.from);

    return result;
}

function getJoinedSchedule(generalSchedule) {
    let stack = [];
    stack.push(generalSchedule[0]);
    generalSchedule.forEach(function (current) {
        let stackTop = stack[stack.length - 1];
        if (isIntersected(stackTop, current)) {
            stackTop.to = Math.max(current.to, stackTop.to);
        } else {
            stack.push(current);
        }
    });

    return stack;
}

function getFreeTimes(joinedSchedule) {
    let result = [];
    let globalStart = 0;
    let globalEnd = MINUTES_IN_DAY * DAYS_FOR_ROBBERY;
    result.push({ from: globalStart, to: joinedSchedule[0].from });
    for (let i = 0; i < joinedSchedule.length - 1; i++) {
        result.push({ from: joinedSchedule[i].to, to: joinedSchedule[i + 1].from });
    }
    result.push({ from: joinedSchedule[joinedSchedule.length - 1].to, to: globalEnd });

    return result;
}

function getRobberyIntervals(bankSchedule, freeTimes, duration) {
    let result = [];
    bankSchedule.forEach(function (workingHours) {
        freeTimes.forEach(function (freeTime) {
            if (isIntersected(workingHours, freeTime)) {
                let from = Math.max(workingHours.from, freeTime.from);
                let to = Math.min(workingHours.to, freeTime.to);
                result.push({ from, to });
            }
        });
    });
    result = result.filter(interval => interval.to - interval.from >= duration);

    return result;
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
    let [bankSchedule, timeZone] = getBankScheduleAndTimeZone(workingHours);
    console.info('bankSchedule ' + JSON.stringify(bankSchedule));
    let generalSchedule = getGeneralSchedule(schedule, timeZone);
    console.info('generalSchedule ' + JSON.stringify(generalSchedule));
    let joinedSchedule = getJoinedSchedule(generalSchedule);
    console.info('joinedSchedule ' + JSON.stringify(joinedSchedule));
    let freeTimes = getFreeTimes(joinedSchedule);
    console.info('freeTimes ' + JSON.stringify(freeTimes));
    let intervals = getRobberyIntervals(bankSchedule, freeTimes, duration);
    console.info('intervals ' + JSON.stringify(intervals));
    let robberyTime = intervals[0];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intervals.length !== 0;
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
                return '';
            }
            let robberyTimeStart = robberyTime.from;
            let [dd, hh, mm] = minutesToTime(robberyTimeStart);

            return template
                .replace('%DD', dd)
                .replace('%HH', hh)
                .replace('%MM', mm);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            intervals = intervals.filter(interval => interval.to - interval.from >= duration);
            if (intervals.length === 1 &&
                (intervals[0].to - intervals[0].from - HALF_AN_HOUR < duration)) {
                return false;
            }

            for (let i = 0; i < intervals.length; i++) {
                intervals[i].from += HALF_AN_HOUR;
                if (intervals[i].to - intervals[i].from >= duration) {
                    robberyTime = intervals[i];

                    return true;
                } else if (intervals[i + 1]) {
                    robberyTime = intervals[i + 1];

                    return true;
                }
            }

            return false;
        }
    };
};
