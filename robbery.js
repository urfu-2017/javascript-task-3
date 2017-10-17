'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 60 * 24;
const DELAY = 30;
const TIME_REGEX = /(ПН|ВТ|СР)? ?(\d\d):(\d\d)\+(\d+)/;
const DAYS = ['ПН', 'ВТ', 'СР'];

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
    const timezone = parseInt(TIME_REGEX.exec(workingHours.from)[4]);
    const bankSchedule = parseBankSchedule(workingHours);
    const gangSchedule = parseGangSchedule(schedule, timezone);
    const mergedSchedule = mergeGangSchedule(gangSchedule);
    const freeSchedule = getFreeSchedule(mergedSchedule);
    console.info(freeSchedule);
    console.info(bankSchedule);
    const robberyTimes = getRobberyTimes(freeSchedule, bankSchedule, duration);
    console.info(robberyTimes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (robberyTimes[0]) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robberyTimes[0]) {
                return '';
            }
            let time = getTime(robberyTimes[0].from[1]);

            return template
                .replace(/%HH/g, time[0])
                .replace(/%MM/g, time[1])
                .replace(/%DD/g, DAYS[robberyTimes[0].from[0]]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!robberyTimes[0]) {
                return false;
            } else if (robberyTimes[0].to[1] - robberyTimes[0].from[1] - DELAY >= duration) {
                robberyTimes[0].from[1] += DELAY;

                return true;
            } else if (robberyTimes.length > 1) {
                robberyTimes.shift();

                return true;
            }

            return false;
        }
    };
};

function getTime(time) {
    let hours = Math.floor(time / MINUTES_IN_HOUR);
    let minutes = time % MINUTES_IN_HOUR;
    hours = hours >= 10 ? String(hours) : '0' + String(hours);
    minutes = minutes >= 10 ? String(minutes) : '0' + String(minutes);

    return [hours, minutes];
}

function getRobberyTimes(free, bank, duration) {
    for (var i = 0; i < free.length; i++) {
        let timeFrom = free[i].from[1];
        let timeTo = free[i].to[1];
        if ((timeFrom <= bank.from && timeTo <= bank.from) ||
        (timeFrom >= bank.to && timeTo >= bank.to)) {
            free.splice(i, 1);
            i--;
            continue;
        } else if (timeFrom < bank.from) {
            free[i] = { from: [free[i].from[0], bank.from], to: free[i].to };
        } else if (timeTo > bank.to) {
            free[i] = { from: free[i].from, to: [free[i].to[0], bank.to] };
        }
    }
    console.info(free);
    free = checkDuration(free, duration);

    return free;
}

function checkDuration(schedule, duration) {
    for (var i = 0; i < schedule.length; i++) {
        if (schedule[i].to[1] - schedule[i].from[1] < duration) {
            schedule.splice(i, 1);
            i--;
        }
    }

    return schedule;
}

function getFreeSchedule(gangSchedule) {
    let freeSchedule = [];
    for (var j = 0; j < gangSchedule.length - 1; j++) {
        freeSchedule.push({ from: gangSchedule[j].to, to: gangSchedule[j + 1].from });
    }
    freeSchedule.unshift({ from: [0, 0], to: gangSchedule[0].from });
    freeSchedule.push({ from: gangSchedule[gangSchedule.length - 1].to,
        to: [DAYS.length - 1, MINUTES_IN_DAY - 1] });
    for (var i = 0; i < freeSchedule.length; i++) {
        if (freeSchedule[i].from[0] - freeSchedule[i].to[0] === -1) {
            freeSchedule.splice(i, 1, { from: freeSchedule[i].from,
                to: [freeSchedule[i].from[0], MINUTES_IN_DAY - 1] },
            { from: [freeSchedule[i].to[0], 0], to: freeSchedule[i].to });
            i++;
        } else if (freeSchedule[i].from[0] - freeSchedule[i].to[0] === -1) {
            freeSchedule.splice(i, 1, { from: freeSchedule[i].from,
                to: [freeSchedule[i].from[0], MINUTES_IN_DAY - 1] },
            { from: [1, 0], to: [1, MINUTES_IN_DAY - 1] },
            { from: [freeSchedule[i].to[0], 0], to: freeSchedule[i].to });
            i += 2;
        }
    }

    return freeSchedule;
}

function parseBankSchedule(schedule) {
    let timeFrom = TIME_REGEX.exec(schedule.from);
    let timeTo = TIME_REGEX.exec(schedule.to);

    return { from: toMinutes(timeFrom[2], timeFrom[3]), to: toMinutes(timeTo[2], timeTo[3]) };
}

function parseGangSchedule(schedule, timezone) {
    let newSchedule = [];
    for (var prop of Object.values(schedule)) {
        let timezoneDifferene = (timezone - parseInt(TIME_REGEX.exec(prop[0].from)[4])) *
        MINUTES_IN_HOUR;
        prop = prop.map(function (interval) {
            return changeDay(interval, timezoneDifferene);
        });
        prop.sort(function (a, b) {
            if (a.to[0] < b.from[0]) {
                return -1;
            } else if (a.to[0] > b.from[0]) {
                return 1;
            } else if (a.to[1] < b.from[1]) {
                return -1;
            } else if (a.to[1] > b.from[1]) {
                return 1;
            }

            return 0;
        });
        newSchedule.push(prop);
    }

    return newSchedule;
}

function changeDay(interval, dif) {
    let from = TIME_REGEX.exec(interval.from);
    let to = TIME_REGEX.exec(interval.to);

    return { from: checkOutdating(from, dif),
        to: checkOutdating(to, dif) };
}

function checkOutdating([, day, hours, minutes], dif) {
    let time = toMinutes(hours, minutes);
    if (time + dif > MINUTES_IN_DAY - 1) {
        time = time + dif - MINUTES_IN_DAY;
        day = DAYS.indexOf(day) + 1;
        if (day >= DAYS.length) {
            time = MINUTES_IN_DAY - 1;
            day = DAYS.length - 1;
        }
    } else if (time + dif < 0) {
        time = MINUTES_IN_DAY + time + dif;
        day = DAYS.indexOf(day) - 1;
        if (day < 0) {
            time = 0;
            day = 0;
        }
    } else {
        time = time + dif;
        day = DAYS.indexOf(day);
    }

    return [day, time];
}

function toMinutes(hours, minutes) {
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    return hours * MINUTES_IN_HOUR + minutes;
}

function mergeGangSchedule(schedule) {
    return schedule.reduce((prev, cur) => {
        return mergePersons(prev, cur);
    });
}

function mergePersons(prev, cur) {
    if (!cur) {
        return prev;
    }
    let tempSchedule = prev;
    for (var i = 0; i < cur.length; i++) {
        let fromMin = findMin(prev, cur[i]);
        let toMax = findMax(prev, cur[i].to);
        if (toMax[1] === -1) {
            tempSchedule.unshift({ from: fromMin[0], to: toMax[0] });
        } else {
            tempSchedule.splice(fromMin[1], toMax[1] - fromMin[1] + 1,
                { from: fromMin[0], to: toMax[0] });
        }
    }

    return tempSchedule;
}

function findMin(arr, { from }) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].from[0] > from[0] ||
            (arr[i].from[0] === from[0] && arr[i].from[1] >= from[1])) {

            return [from, i];
        } else if (arr[i].to[0] > from[0] ||
            (arr[i].to[0] === from[0] && arr[i].to[1] >= from[1])) {

            return [arr[i].from, i];
        }
    }

    return [from, arr.length];
}

function findMax(arr, to) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i].to[0] < to[0] ||
            (arr[i].to[0] === to[0] && arr[i].to[1] <= to[1])) {

            return [to, i];
        } else if (arr[i].from[0] < to[0] ||
            (arr[i].from[0] === to[0] && arr[i].from[1] <= to[1])) {

            return [arr[i].to, i];
        }
    }

    return [to, -1];
}
