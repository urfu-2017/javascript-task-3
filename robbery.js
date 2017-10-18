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
const FIRST_MINUTE = 0;
const LAST_MINUTE = MINUTES_IN_DAY * DAYS_FOR_ROBBERY;

let isIntersected = (first, second) => first.to >= second.from && second.to >= first.from;

function parseTime(stringTime) {
    const [, hoursFrom, minutesFrom, timeZone] = stringTime.match(TIME_FORMAT);

    return [parseInt(hoursFrom), parseInt(minutesFrom), parseInt(timeZone)];
}

let timeToMinutes = (dayNumber, hh, mm, diff) =>
    ((dayNumber * HOURS_IN_DAY + hh + diff) * MINUTES_IN_HOUR) + mm;

let padZero = str => ('0' + str).slice(-2);

function minutesToTime(startMinute) {
    const mm = padZero(startMinute % MINUTES_IN_HOUR);
    const hh = padZero(((startMinute - mm) / MINUTES_IN_HOUR) % HOURS_IN_DAY);
    const dayNumber = Math.floor(((startMinute - mm) / MINUTES_IN_HOUR) / HOURS_IN_DAY);
    const dd = Object.keys(DAYS_OF_THE_WEEK)[dayNumber];

    return [dd, hh, mm];
}

function getBankScheduleAndTimeZone(workingHours) {
    const [hoursFrom, minutesFrom, timeZone] = parseTime(workingHours.from);
    const [hoursTo, minutesTo] = parseTime(workingHours.to);
    let bankSchedule = [];
    for (let i = 0; i < DAYS_FOR_ROBBERY; i++) {
        const fromInMinutes = timeToMinutes(i, hoursFrom, minutesFrom, 0);
        const toInMinutes = timeToMinutes(i, hoursTo, minutesTo, 0);
        bankSchedule.push({ from: fromInMinutes, to: toInMinutes });
    }

    return [bankSchedule, timeZone];
}

function robberTimeInMinutes(time, bankTimeZone) {
    const dayNumber = DAYS_OF_THE_WEEK[time.substring(0, 2)];
    const [hh, mm, timeZone] = parseTime(time.substring(3));
    const diff = bankTimeZone - timeZone;

    return timeToMinutes(dayNumber, hh, mm, diff);
}

function getGeneralSchedule(schedule, bankTimeZone) {
    return Object.keys(schedule).reduce((acc, curr) => [...acc, ...schedule[curr]], [])
        .map(current => {
            return {
                from: robberTimeInMinutes(current.from, bankTimeZone),
                to: robberTimeInMinutes(current.to, bankTimeZone)
            };
        })
        .sort((a, b) => a.from - b.from);
}

function getJoinedSchedule(generalSchedule) {
    return generalSchedule.reduce((stack, current) => {
        let stackTop = stack[stack.length - 1];
        if (isIntersected(stackTop, current)) {
            stackTop.to = Math.max(current.to, stackTop.to);
        } else {
            stack.push(current);
        }

        return stack;
    }, [generalSchedule[0]]);
}

function getFreeTimes(joinedSchedule) {
    return [{ from: FIRST_MINUTE, to: joinedSchedule[0].from }]
        .concat(joinedSchedule.map((current, i) => {
            return {
                from: current.to,
                to: (joinedSchedule[i + 1]) ? joinedSchedule[i + 1].from : LAST_MINUTE
            };
        }));
}

function getRobberyIntervals(bankSchedule, freeTimes, duration) {
    return bankSchedule.reduce((accBank, workingHours) => {
        return accBank.concat(freeTimes.reduce((accFree, freeTime) => {
            if (isIntersected(workingHours, freeTime)) {
                accFree.push({
                    from: Math.max(workingHours.from, freeTime.from),
                    to: Math.min(workingHours.to, freeTime.to)
                });
            }

            return accFree;
        }, []));
    }, []).filter(interval => interval.to - interval.from >= duration);
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
    let generalSchedule = getGeneralSchedule(schedule, timeZone);
    let joinedSchedule = getJoinedSchedule(generalSchedule);
    let freeTimes = getFreeTimes(joinedSchedule);
    let intervals = getRobberyIntervals(bankSchedule, freeTimes, duration);
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
            const robberyTimeStart = robberyTime.from;
            const [dd, hh, mm] = minutesToTime(robberyTimeStart);

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
