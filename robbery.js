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

const YEAR = 1970;
const MONTH = 5;
const DAYS = {
    ПН: 1,
    ВТ: 2,
    СР: 3
};
const TIME_REGEX = /([А-Я]{2}) (\d\d):(\d\d)\+(\d+)/;
const BANK_REGEX = /(\d\d):(\d\d)\+(\d+)/;
const NAMES_BUDDY = ['Danny', 'Rusty', 'Linus'];
const MS_IN_MINUTE = 60000;
const DELAY = 30;

function createDateInMinutes(day, hour, minute) {
    return (new Date(YEAR, MONTH, day, hour, minute, 0)).getTime() / MS_IN_MINUTE;
}

function parseInterval(time) {
    let elements = TIME_REGEX.exec(time);

    return {
        day: DAYS[elements[1]] || 0,
        hours: parseInt(elements[2]),
        minutes: parseInt(elements[3]),
        timeZone: parseInt(elements[4])
    };
}

function get2DigitNumber(number) {
    return number < 10 ? '0' + number : number;
}

function getDate(time, bankTimeZone) {
    let parsedTime = parseInterval(time);
    let day = parsedTime.day;
    let hours = parsedTime.hours - parsedTime.timeZone + bankTimeZone;
    let minutes = parsedTime.minutes;

    return createDateInMinutes(day, hours, minutes);
}

function getInterval(interval, bankTimeZone) {
    return {
        from: getDate(interval.from, bankTimeZone),
        to: getDate(interval.to, bankTimeZone)
    };
}

function getBusyIntervals(schedule, bankTimeZone) {
    return schedule.map(interval => getInterval(interval, bankTimeZone));
}

function parseBankInterval(time) {
    let matches = BANK_REGEX.exec(time);

    return {
        hours: parseInt(matches[1]),
        minutes: parseInt(matches[2]),
        timeZone: parseInt(matches[3])
    };
}

function getClosedIntervals(workingHours) {
    let startBankInterval = parseBankInterval(workingHours.from);
    let endBankInterval = parseBankInterval(workingHours.to);

    return Object.keys(DAYS).reduce((acc, day) => {
        day = DAYS[day];
        acc.push(
            {
                from: createDateInMinutes(day, 0, 0),
                to: createDateInMinutes(day, startBankInterval.hours, startBankInterval.minutes)
            },
            {
                from: createDateInMinutes(day, endBankInterval.hours, endBankInterval.minutes),
                to: createDateInMinutes(day, 24, 0)
            });

        return acc;
    }, []);

}

function getAttackIntervals(busyIntervals, duration) {
    let attackIntervals = [];

    for (let i = 0; i < busyIntervals.length - 1; i++) {
        if (busyIntervals[i].to + duration <= busyIntervals[i + 1].from) {
            attackIntervals.push({ from: busyIntervals[i].to, to: busyIntervals[i + 1].from });
        }
    }

    return attackIntervals;
}

function mergeSchedules(acc, schedule) {
    for (let i = 0; i < schedule.length; i++) {
        let fromMin = findFromOfNewInterval(acc, schedule[i].from);
        let toMax = findToOfNewInterval(acc, schedule[i].to);
        let isNoMin = fromMin.index === acc.length;
        let isNoMax = toMax.index === -1;

        if (isNoMin) {
            acc.push({
                from: fromMin.time,
                to: toMax.time
            });
        } else if (isNoMax) {
            acc.unshift({
                from: fromMin.time,
                to: toMax.time
            });
        } else {
            let numberOfReplaceItems = toMax.index - fromMin.index + 1;

            acc.splice(
                fromMin.index,
                numberOfReplaceItems,
                {
                    from: fromMin.time,
                    to: toMax.time
                }
            );
        }
    }

    return acc;
}

function findFromOfNewInterval(intervals, timeStart) {
    let time = timeStart;
    let index = intervals.length;

    for (var i = 0; i < intervals.length; i++) {
        if (timeStart <= intervals[i].from) {
            index = i;
            break;
        } else if (timeStart <= intervals[i].to) {
            time = intervals[i].from;
            index = i;
            break;
        }
    }

    return { time, index };
}

function findToOfNewInterval(intervals, timeEnd) {
    let time = timeEnd;
    let index = -1;

    for (var i = intervals.length - 1; i >= 0; i--) {
        if (timeEnd >= intervals[i].to) {
            index = i;
            break;
        } else if (timeEnd >= intervals[i].from) {
            time = intervals[i].to;
            index = i;
            break;
        }
    }

    return { time, index };
}

function checkOtherIntervals(schedule, duration) {
    let startTime = schedule[0].from + DELAY;

    for (let i = 1; i < schedule.length; i++) {
        let isAfterDelay = schedule[i].to > startTime;
        let isLongEnough = checkIntervalLength(schedule[i], duration);
        let isLaterEnough = checkIntervalLength({ from: startTime, to: schedule[i].to }, duration);

        if (isAfterDelay && isLongEnough && isLaterEnough) {
            schedule.splice(0, i);

            return true;
        }
    }

    return false;
}

function checkIntervalLength({ from, to }, duration) {
    return to - from >= duration;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const bankTimeZone = parseBankInterval(workingHours.from).timeZone;

    let busySchedules = NAMES_BUDDY.map(name => getBusyIntervals(schedule[name], bankTimeZone));
    busySchedules.push(getClosedIntervals(workingHours));
    busySchedules.forEach(intervals => {
        intervals.sort((firstInterval, secondInterval) => firstInterval.from - secondInterval.from);
    });

    let mergedBusySchedule = busySchedules.reduce(mergeSchedules);
    let robberySchedule = getAttackIntervals(mergedBusySchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberySchedule[0]) && duration > 0;
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

            let robberyTime = new Date(robberySchedule[0].from * MS_IN_MINUTE);

            return template
                .replace(/%DD/g, Object.keys(DAYS)[robberyTime.getDay() - 1])
                .replace(/%HH/g, get2DigitNumber(robberyTime.getHours()))
                .replace(/%MM/g, get2DigitNumber(robberyTime.getMinutes()));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberySchedule.length !== 0 && this.exists()) {
                let isLongEnough = checkIntervalLength(robberySchedule[0], duration + DELAY);

                if (isLongEnough) {
                    robberySchedule[0].from += DELAY;

                    return true;
                }
                if (robberySchedule.length > 1 &&
                    checkOtherIntervals(robberySchedule, duration)) {
                    return true;
                }
            }

            return false;
        }
    };
};
