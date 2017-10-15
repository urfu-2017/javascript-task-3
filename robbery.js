'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;


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
    let available = reverseRanges(notAvailable, banksWorkingHous[0].from,
        banksWorkingHous[2].to);
    const timeForRobbery = intersectWithBanksTime(available, banksWorkingHous);
    const robberyRanges = findRangesForRobbery(timeForRobbery, duration);

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
            let minutes = robberyRanges[0].from.getMinutes();
            let hours = robberyRanges[0].from.getHours() - banksTimeZone;
            const day = robberyRanges[0].from.getDate();
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
            return false;
        }
    };
};

function findRangesForRobbery(available, duration) {
    let rangesForRobbery = [];
    for (let range of available) {
        let difference = range.to - range.from;
        if (difference >= (duration * 60000)) {
            rangesForRobbery.push(range);
        }
    }

    return rangesForRobbery;
}

function intersectWithBanksTime(available, banksWorkingHours) {
    let intersected = [];
    const combinedRanges = available.concat(banksWorkingHours).sort(function
        (firstDate, secondDate) {
        return firstDate.from - secondDate.from;
    });
    let top = combinedRanges[0];
    for (let i = 1; i < combinedRanges.length; i++) {
        if (!areIntersected(top, combinedRanges[i])) {
            top = combinedRanges[i];
        } else if (top.to < combinedRanges[i].to) {
            intersected.push({ from: combinedRanges[i].from, to: top.to });
            top = combinedRanges[i];
        } else {
            intersected.push({ from: combinedRanges[i].from,
                to: combinedRanges[i].to });
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
    result.push({ from: ranges[0].from,
        to: ranges[0].to });
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
            allSchedule.push(
                { from: makeDateObj(occupiedTime.from, banksTimeZone),
                    to: makeDateObj(occupiedTime.to, banksTimeZone) });
        }
    }

    return allSchedule;
}

function makeDateObj(time, banksTimeZone) {
    let timeDate = new Date();
    const day = time.split(' ')[0];
    const hrsAndMins = time.split(' ')[1];
    const currentTimeZone = time.split('+')[1];
    timeDate.setDate(getWeekDay(day));
    timeDate.setHours(getHours(hrsAndMins));
    timeDate.setMinutes(getMinutes(hrsAndMins));
    timeDate.setHours(toBanksTimeZone(timeDate, currentTimeZone, banksTimeZone));

    return timeDate;
}

function toBanksTimeZone(date, current, bank) {
    const oldHours = date.getHours() + 5;
    if (current === bank) {
        return oldHours;
    }

    return oldHours + Number(bank) - Number(current);

}

function getMinutes(time) {
    const toNumber = Number(time.split(':')[1].split('+')[0]);
    if (toNumber < 10) {
        return '0' + toNumber;
    }

    return toNumber;
}

function getHours(time) {
    const toNumber = Number(time.split(':')[0]);
    if (toNumber < 10) {
        return '0' + toNumber;
    }

    return toNumber;
}

function getWeekDay(currentDay) {
    for (let weekDay of weekDays) {
        if (currentDay === weekDay) {
            return weekDays.indexOf(currentDay) + 1;
        }
    }
}

function createDateForBank(day, hours, minutes, timeZone) {
    let date = new Date();
    date.setDate(day);
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setHours(toBanksTimeZone(date, timeZone, timeZone));

    return date;
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

