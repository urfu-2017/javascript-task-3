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
const ACTION_DAYS = ['ПН', 'ВТ', 'СР'];
const MS_IN_MINUTE = 60000;
const DELAY = 30;

function createDateInMS(day, hour, minute) {

    return Date.parse(new Date(YEAR, MONTH, day, hour, minute, 0));
}

function parseInterval(time) {
    let elements = TIME_REGEX.exec(time);

    return {
        numberDay: DAYS[elements[1]] || 0,
        hours: parseInt(elements[2]),
        minutes: parseInt(elements[3]),
        timeZone: parseInt(elements[4])
    };
}

function get2DigitNumber(number) {
    return number < 10 ? '0' + number : number;
}

function getDate(time, bankUTC) {
    let parsedTime = parseInterval(time);
    let numberDay = parsedTime.numberDay;
    let hours = parsedTime.hours - parsedTime.timeZone + bankUTC;
    let minutes = parsedTime.minutes;

    return createDateInMS(numberDay, hours, minutes);
}

function getInterval(interval, bankUTC) {
    return {
        from: getDate(interval.from, bankUTC),
        to: getDate(interval.to, bankUTC)
    };
}

function getBusyIntervals(schedule, bankUTC) {
    return schedule.map(interval => {
        return getInterval(interval, bankUTC);
    });
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
                from: createDateInMS(day, 0, 0),
                to: createDateInMS(day, startBankInterval.hours, startBankInterval.minutes)
            },
            {
                from: createDateInMS(day, endBankInterval.hours, endBankInterval.minutes),
                to: createDateInMS(day, 24, 0)
            });

        return acc;
    }, []);

}

function getAttackIntervals(busyIntervals, duration) {
    let attackIntervals = [];

    for (let i = 0; i < busyIntervals.length - 1; i++) {
        if (busyIntervals[i].to + (duration * MS_IN_MINUTE) <= busyIntervals[i + 1].from) {
            attackIntervals.push({ from: busyIntervals[i].to, to: busyIntervals[i + 1].from });
        }
    }

    return attackIntervals;
}

function mergeSchedules(acc, schedule) {
    for (let i = 0; i < schedule.length; i++) {
        let fromMin = findMin(acc, schedule[i].from);
        let toMax = findMax(acc, schedule[i].to);

        if (fromMin[1] === schedule.length) {
            acc.push({ from: fromMin[0], to: toMax[0] });
        } else if (toMax[1] === -1) {
            acc.unshift({ from: fromMin[0], to: toMax[0] });
        } else {
            acc.splice(fromMin[1], toMax[1] - fromMin[1] + 1,
                { from: fromMin[0], to: toMax[0] });
        }
    }

    return acc;
}

function findMin(intervals, timeStart) {
    for (var i = 0; i < intervals.length; i++) {
        if (timeStart <= intervals[i].from) {
            return [timeStart, i];
        } else if (timeStart <= intervals[i].to) {
            return [intervals[i].from, i];
        }
    }

    return [timeStart, intervals.length];
}

function findMax(intervals, timeEnd) {
    for (var i = intervals.length - 1; i >= 0; i--) {
        if (timeEnd >= intervals[i].to) {
            return [timeEnd, i];
        } else if (timeEnd >= intervals[i].from) {
            return [intervals[i].to, i];
        }
    }

    return [timeEnd, -1];
}

function checkOtherIntervals(schedule, duration) {
    let startTime = schedule[0].from + DELAY * MS_IN_MINUTE;

    for (let i = 1; i < schedule.length; i++) {
        if (schedule[i].to > startTime &&
            schedule[i].to - duration * MS_IN_MINUTE >= schedule[i].from &&
            schedule[i].to - schedule[0].from >= (DELAY + duration) * MS_IN_MINUTE) {
            schedule.splice(0, i);

            return true;
        }
    }

    return false;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const bankUTC = parseBankInterval(workingHours.from).timeZone;
    let busySchedules = [];

    NAMES_BUDDY.forEach(name => {
        busySchedules.push((getBusyIntervals(schedule[name], bankUTC)));
    });
    busySchedules.push(getClosedIntervals(workingHours));
    busySchedules.forEach(function (obj) {
        obj.sort(function (firstInterval, secondInterval) {
            return firstInterval.from - secondInterval.from;
        });
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
            let robbery = new Date(robberySchedule[0].from);

            return template
                .replace(/%DD/g, ACTION_DAYS[robbery.getDay() - 1])
                .replace(/%HH/g, get2DigitNumber(robbery.getHours()))
                .replace(/%MM/g, get2DigitNumber(robbery.getMinutes()));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberySchedule.length !== 0 && this.exists()) {
                if (robberySchedule[0].from + (duration + DELAY) * MS_IN_MINUTE <=
                robberySchedule[0].to) {
                    robberySchedule[0].from += DELAY * MS_IN_MINUTE;

                    return true;
                } else if (robberySchedule.length > 1 &&
                    checkOtherIntervals(robberySchedule, duration)) {
                    return true;
                }
            }

            return false;
        }
    };
};
