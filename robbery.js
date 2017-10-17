'use strict';

const YEAR = 1970;
const MONTH = 0;
const MINUTES_TO_MILLISECONDS = 60000;
const HOURS_IN_MILLISECONDS = 60 * 60000;
const WEEK_DAYS = ['ПН', 'ВТ', 'СР'];


const getBanksTimeZone = banksTime => banksTime.split('+')[1];

const getHours = time => Number(time.split(':')[0]);

function getMinutes(time) {
    const minsAndZone = time.split(':')[1];
    const minutes = minsAndZone.split('+')[0];

    return Number(minutes);
}

const createDateForBank = (day, hours, minutes) => Date.UTC(YEAR, MONTH, day, hours, minutes);

const getDatesForBank = (workingHours, timeZone) =>
    WEEK_DAYS.map((day, idx) => {
        const from = createDateForBank(
            idx + 1,
            getHours(workingHours.from),
            getMinutes(workingHours.from),
            timeZone
        );
        const to = createDateForBank(
            idx + 1,
            getHours(workingHours.to),
            getMinutes(workingHours.to),
            timeZone
        );

        return { from, to };
    });


function getWeekDay(currentDay) {
    let weekDay;
    for (weekDay of WEEK_DAYS) {
        if (currentDay === weekDay) {
            return WEEK_DAYS.indexOf(currentDay) + 1;
        }
    }
}

function makeDateObj(time, banksTimeZone) {
    const day = getWeekDay(time.split(' ')[0]);
    const hrsAndMins = time.split(' ')[1];
    const currentTimeZone = time.split('+')[1];
    const hours = getHours(hrsAndMins);
    const minutes = getMinutes(hrsAndMins);
    let timeDifference = currentTimeZone * HOURS_IN_MILLISECONDS -
    banksTimeZone * HOURS_IN_MILLISECONDS;

    return Date.UTC(YEAR, MONTH, day, hours, minutes) - timeDifference;
}

function getRobbersTime(schedule, banksTimeZone) {
    let allSchedule = [];
    Object.keys(schedule).forEach(robber => {
        schedule[robber].forEach(occupiedTime => {
            allSchedule.push({
                from: makeDateObj(occupiedTime.from, banksTimeZone),
                to: makeDateObj(occupiedTime.to, banksTimeZone)
            });
        });
    });

    return allSchedule;
}

const areIntersected = (firstRange, secondRange) => firstRange.to >= secondRange.from;

function mergeRanges(ranges) {
    let result = [];
    let top;

    ranges.sort((firstDate, secondDate) => {
        return firstDate.from - secondDate.from;
    });
    result.push({
        from: ranges[0].from,
        to: ranges[0].to
    });
    ranges.slice(1).forEach(range => {
        top = result[result.length - 1];
        if (!areIntersected(top, range)) {
            result.push(range);
        } else if (top.to < range.to) {
            top.to = range.to;
        }
    });

    return result;
}

function reverseRanges(ranges, from, to) {
    let reversed = [];
    let start = from;
    let reversedRange;

    ranges.forEach(range => {
        reversedRange = { from: start, to: range.from };
        start = range.to;
        reversed.push(reversedRange);
    });
    reversed.push({ from: start, to: to });

    return reversed;
}

function intersectWithBanksTime(available, banksWorkingHours) {
    const combinedRanges = available.concat(banksWorkingHours)
        .sort((firstDate, secondDate) => {
            return firstDate.from - secondDate.from;
        });
    let intersected = [];
    let top = combinedRanges[0];

    // for (let i = 1; i < combinedRanges.length; i++) {
    combinedRanges.slice(1).forEach((range, i) => {
        if (!areIntersected(top, combinedRanges[i + 1])) {
            top = combinedRanges[i + 1];
        } else if (top.to < combinedRanges[i + 1].to) {
            intersected.push({
                from: combinedRanges[i + 1].from,
                to: top.to
            });
            top = combinedRanges[i + 1];
        } else {
            intersected.push({
                from: combinedRanges[i + 1].from,
                to: combinedRanges[i + 1].to
            });
        }
    });

    return intersected;
}

function findRangesForRobbery(available, duration) {
    let difference;
    let rangesForRobbery = available.filter(range => {
        difference = range.to - range.from;

        return difference >= (duration * MINUTES_TO_MILLISECONDS);
    });

    return rangesForRobbery;
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
    console.info(schedule, duration, workingHours);
    const banksTimeZone = getBanksTimeZone(workingHours.from);
    const banksWorkingHous = getDatesForBank(workingHours, banksTimeZone);
    let notAvailable = getRobbersTime(schedule, banksTimeZone);
    notAvailable = mergeRanges(notAvailable);
    let available = reverseRanges(
        notAvailable,
        banksWorkingHous[0].from,
        banksWorkingHous[2].to
    );
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
                .replace('%DD', WEEK_DAYS[day - 1]);
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

exports.isStar = true;
