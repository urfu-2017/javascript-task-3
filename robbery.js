'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const maxMinute = 4320;

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

    let bankTimeZone = getTimeZone(workingHours);
    let parsedSchedule = getParsedSchedule(schedule, bankTimeZone);
    let workingHoursInMinute = getTimeBank(workingHours);
    let freeTimeBand = getFreeTimeBand(parsedSchedule);

    console.info('before findTime: ', freeTimeBand, workingHoursInMinute, duration);
    let timeForRobbery = findTime(freeTimeBand, workingHoursInMinute, duration);
    console.info('after findTime', timeForRobbery);
    let date = getRobbery(timeForRobbery, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return date !== [];
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (date[0] === []) {
                return '';
            }
            timeForRobbery = date[1];
            date = getDate(date[0]);
            let day = date.day;
            let minute = date.minute;
            let hours = date.hours;

            return template
                .replace('%MM', minute)
                .replace('%DD', day)
                .replace('%HH', hours);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (timeForRobbery === []) {
                return false;
            }
            let oldDate = date;
            date = getRobbery(timeForRobbery, duration);
            if (date[0] === []) {
                timeForRobbery = date[1];
                date = oldDate;

                return false;
            }

            return true;
        }
    };
};

function getDate(date) {
    let days = ['ПН', 'ВТ', 'СР'];
    let hours = Math.floor(date.from / 60);
    let minute = Math.floor(date.from % 60);
    let day = days[Math.floor(hours / 24)];
    hours = Math.floor(hours % 24);

    return { day, minute, hours };
}

function findTime(freeTimeBand, workTime) {
    // freeTimeBank = [[{}]];
    let result = workTime.slice();

    for (let freeTime of freeTimeBand) {
        result = findTimeMen(freeTime, result);
    }

    return result;
}

function findTimeMen(timeMen, resultTime) {
    // timeMen = [{}];
    let result = [];

    for (let time of timeMen) {
        let findTimeInter = findIntersect(time, resultTime);
        result = result.concat(findTimeInter);
    }

    return result;
}

function findIntersect(time, work) {
    // time = {};
    let result = [];
    for (let item of work) {
        let intersectionTime = interTime(time, item);
        result = result.concat(intersectionTime);
    }

    return result;
}

function interTime(time, item) {
    // time = {}, item = {};
    let result = [];
    let newFrom = time.from;
    let newTo = time.to;

    if (time.from < item.from &&
        time.to < item.to) {
        newFrom = item.from;
    }
    if (time.from > item.from &&
        time.to > item.to) {
        newTo = item.to;
    }
    if (time.from < item.from &&
        time.to > item.to) {
        newFrom = item.from;
        newTo = item.to;
    }

    result.push({ from: newFrom, to: newTo });

    return result;
}

function getRobbery(timeForRobbery, duration) {
    if (timeForRobbery === []) {
        return [];
    }
    while (timeForRobbery.length !== 0) {
        let first = timeForRobbery[0];
        if ((first.to - first.from) >= duration) {
            let result = { from: first.from, to: first.from + duration };
            timeForRobbery[0] = { from: first.from + duration + 30, to: first.to };

            return [result, timeForRobbery];
        }
        timeForRobbery.splice(0, 1);
    }

    return [[], timeForRobbery];
}

function getTimeZone(time) {
    return time.from.split('+')[1];
}

function getParsedSchedule(schedule, bankTimeZone) {
    let result = [[], [], []];
    let keys = Object.keys(schedule);
    for (let i = 0; i < keys.length; i++) {
        for (let item of schedule[keys[i]]) {
            let newFrom = getTimeInBankTimeZone(item.from, bankTimeZone);
            let newTo = getTimeInBankTimeZone(item.to, bankTimeZone);
            result[i].push({ from: newFrom, to: newTo });
        }
    }

    return result;
}

function getTimeInBankTimeZone(time, bankTimeZone) {
    let timeZone = time.split('+');
    let timeAndDay = timeZone[0];
    timeZone = timeZone[1];

    let hoursAndMinute = timeAndDay.split(' ');
    let day = hoursAndMinute[0];
    hoursAndMinute = hoursAndMinute[1];

    return translateTimeToBankZone(hoursAndMinute, day, timeZone, bankTimeZone);
}

function translateTimeToBankZone(time, day, zone, bankZone) {
    let hours = time.split(':');
    let minute = Number(hours[1]);
    hours = (Number(hours[0]) + (Number(bankZone) - Number(zone))) * 60;
    minute += hours;
    switch (day) {
        case 'ВТ':
            minute += 24 * 60;
            break;
        case 'СР':
            minute += 48 * 60;
            break;
        default:
            break;
    }
    if (minute > maxMinute) {
        minute = maxMinute;
    }

    return minute;
}

function getFreeTimeBand(band) {
    let result = [[], [], []];
    for (let i = 0; i < band.length; i++) {
        for (let j = 0; j < band[i].length; j++) {
            let newFrom = (j === 0) ? 0 : band[i][j - 1].to;
            let newTo = band[i][j].from;
            result[i].push({ from: newFrom, to: newTo });
        }
        let newFrom = band[i][band[i].length - 1].to;
        result[i].push({ from: newFrom, to: maxMinute });
    }

    return result;
}


function getTimeBank(workingHours) {
    let timeFrom = getHoursAndMinute(workingHours.from);
    let timeTo = getHoursAndMinute(workingHours.to);
    let result = [];
    result.push({ from: timeFrom, to: timeTo });
    result.push({ from: timeFrom + 24 * 60, to: timeTo + 24 * 60 });
    result.push({ from: timeFrom + 48 * 60, to: timeTo + 48 * 60 });

    return result;
}

function getHoursAndMinute(time) {
    let hoursAndMinute = time.split('+')[0].split(':');
    let hours = Number(hoursAndMinute[0]) * 60;
    let minute = Number(hoursAndMinute[1]);

    return minute + hours;
}
