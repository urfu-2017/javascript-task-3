'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const YEAR = 1970;
const MONTH = 0;
const MINUTES_TO_MILLISECONDS = 60000;
const HOURS_IN_MILLISECONDS = 60 * 60000;
const weekDays = ['ПН', 'ВТ', 'СР'];


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
    const banksTimeZone = getBanksTimeZone(workingHours.from);
    const banksWorkingHous = getDatesForBank(workingHours, banksTimeZone);
    let notAvailable = getRobbersTime(schedule, banksTimeZone);
    notAvailable = mergeRanges(notAvailable);
    let available = reverseRanges(
        notAvailable,
        banksWorkingHous[0].from,
        banksWorkingHous[2].to);
    const timeForRobbery = intersectWithBanksTime(available, banksWorkingHous);
    let robberyRanges = findRangesForRobbery(timeForRobbery, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyRanges.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyRanges.length === 0) {
                return '';
            }
            const date = new Date(robberyRanges[0].from);
            let minutes = date.getUTCMinutes();
            let hours = date.getUTCHours();
            const day = date.getUTCDate();
            hours = hours < 10 ? '0' + hours : hours;
            minutes = minutes < 10 ? '0' + minutes : minutes;

            return template.replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', weekDays[day - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyRanges.length === 0) {
                return false;
            }
            robberyRanges[0].from += 30 * MINUTES_TO_MILLISECONDS;
            let newRobbery = findRangesForRobbery(robberyRanges, duration);
            if (newRobbery.length > 0) {
                robberyRanges = newRobbery;

                return true;
            }
            robberyRanges[0].from -= 30 * MINUTES_TO_MILLISECONDS;

            return false;
        }
    };
};

function findRangesForRobbery(available, duration) {
    let rangesForRobbery = [];
    for (let range of available) {
        let difference = range.to - range.from;
        if (difference >= (duration * MINUTES_TO_MILLISECONDS)) {
            rangesForRobbery.push(range);
        }
    }

    return rangesForRobbery;
}

function intersectWithBanksTime(available, banksWorkingHours) {
    let intersected = [];
    const combinedRanges = available.concat(banksWorkingHours)
        .sort(function (firstDate, secondDate) {
            return firstDate.from - secondDate.from;
        });
    let top = combinedRanges[0];
    for (let i = 1; i < combinedRanges.length; i++) {
        if (!areIntersected(top, combinedRanges[i])) {
            top = combinedRanges[i];
        } else if (top.to < combinedRanges[i].to) {
            intersected.push({
                from: combinedRanges[i].from,
                to: top.to
            });
            top = combinedRanges[i];
        } else {
            intersected.push({
                from: combinedRanges[i].from,
                to: combinedRanges[i].to
            });
        }
    }

    return intersected;
}

function reverseRanges(ranges, from, to) {
    let reversed = [];
    let start = from;
    for (let range of ranges) {
        let reversedRange = { from: start, to: range.from };
        reversed.push(reversedRange);
        start = range.to;
    }
    reversed.push({ from: start, to: to });

    return reversed;
}

function mergeRanges(ranges) {
    let result = [];
    ranges.sort(function (firstDate, secondDate) {
        return firstDate.from - secondDate.from;
    });
    result.push({
        from: ranges[0].from,
        to: ranges[0].to
    });
    ranges.slice(1).forEach(function (range) {
        let top = result[result.length - 1];
        if (!areIntersected(top, range)) {
            result.push(range);
        } else if (top.to < range.to) {
            top.to = range.to;
        }
    });

    return result;
}


function areIntersected(firstRange, secondRange) {
    return firstRange.to >= secondRange.from;
}

function getRobbersTime(schedule, banksTimeZone) {
    let allSchedule = [];
    for (let robber of Object.keys(schedule)) {
        for (let occupiedTime of schedule[robber]) {
            allSchedule.push({
                from: makeDateObj(occupiedTime.from, banksTimeZone),
                to: makeDateObj(occupiedTime.to, banksTimeZone)
            });
        }
    }

    return allSchedule;
}

function makeDateObj(time, banksTimeZone) {
    const day = getWeekDay(time.split(' ')[0]);
    const hrsAndMins = time.split(' ')[1];
    const currentTimeZone = time.split('+')[1];

    return Date.UTC(YEAR, MONTH, day, getHours(hrsAndMins), getMinutes(hrsAndMins)) -
    currentTimeZone * HOURS_IN_MILLISECONDS + banksTimeZone * HOURS_IN_MILLISECONDS;
}


function getMinutes(time) {
    return Number(time.split(':')[1].split('+')[0]);
}

function getHours(time) {
    return Number(time.split(':')[0]);
}

function getWeekDay(currentDay) {
    for (let weekDay of weekDays) {
        if (currentDay === weekDay) {
            return weekDays.indexOf(currentDay) + 1;
        }
    }
}

function createDateForBank(day, hours, minutes) {
    return Date.UTC(YEAR, MONTH, day, hours, minutes);
}

function getDatesForBank(workingHours, timeZone) {
    let datesArray = [];
    for (let i = 0; i < 3; i++) {
        let dateFrom = createDateForBank(i + 1, getHours(workingHours.from),
            getMinutes(workingHours.from), timeZone);
        let dateTo = createDateForBank(i + 1, getHours(workingHours.to),
            getMinutes(workingHours.to), timeZone);
        const date = { from: dateFrom, to: dateTo };
        datesArray.push(date);
    }

    return datesArray;
}

function getBanksTimeZone(banksTime) {
    return banksTime.split('+')[1];
}

