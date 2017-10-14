'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const step = 30 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

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
    let start = getNewDate(0, 0, 16);
    let end = getNewDate(23, 59, 18);
    duration = duration * 60 * 1000;
    const bankZone = Number(workingHours.from.slice(5));
    let badIntervals = getBadIntervals(schedule, bankZone);
    badIntervals = badIntervals.concat(getNotWorkingHours(workingHours));
    badIntervals.sort(sortMethod);

    let freeIntervals = getAvailableIntervals(badIntervals, start, end);
    freeIntervals = freeIntervals.filter((interval) => {
        return (interval.end - interval.start) >= duration;
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return freeIntervals.length > 0;
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
            const { day, hours, minutes } = dateToValues(freeIntervals[0].start);

            return template.replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (freeIntervals.length === 0) {
                return false;
            }
            if (freeIntervals[0].end - freeIntervals[0].start - 30 * 60 * 1000 >= duration) {
                freeIntervals[0].start -= -step;
                freeIntervals[0].start = new Date(freeIntervals[0].start);

                return true;
            }
            if (freeIntervals.length > 1) {
                freeIntervals.splice(0, 1);

                return true;
            }

            return false;
        }
    };
};

function getNotWorkingHours(workingHours) {
    let result = [];
    let [startHours, startMinutes] = workingHours.from.split(':');
    startHours = Number(startHours);
    startMinutes = parseInt(startMinutes);
    let [endHours, endMinutes] = workingHours.to.split(':');
    endHours = Number(endHours);
    endMinutes = parseInt(endMinutes);
    for (let day = 15; day < 19; day++) {
        result.push({
            start: getNewDate(endHours, endMinutes, day),
            end: getNewDate(startHours, startMinutes, day + 1)
        });
    }

    return result;
}

function dateToValues(date) {
    let day = date.getUTCDay();
    day = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'][day];
    let hours = date.getUTCHours();
    if (hours < 10) {
        hours = '0' + hours;
    }
    let minutes = date.getUTCMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    return { day, hours, minutes };
}

function getAvailableIntervals(badIntervals, globalStart, globalEnd) {
    let result = [];
    for (const { start, end } of badIntervals) {
        if (start > globalStart) {
            result.push({ start: globalStart, end: start });
            globalStart = end;
            continue;
        }
        if (end > globalStart) {
            globalStart = end;
            continue;
        }
        if (globalStart > globalEnd) {
            break;
        }
    }
    if (result.length) {
        lastChecks(result, globalStart, globalEnd);
    }

    return result;
}

function lastChecks(result, start, end) {
    if (start < end) {
        result.push({ start, end });
    }
    if (result[result.length - 1].end > end) {
        result[result.length - 1].end = end;
    }
}

function getNewDate(hours, minutes, day) {
    // Возьмём за UTC временную зону банка и спарсим всё время к ней
    let date = new Date();
    date.setUTCFullYear(2017);
    date.setUTCMonth(9);
    date.setUTCDate(day);
    date.setUTCHours(hours);
    date.setUTCMinutes(minutes);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);

    return date;
}

function getBadIntervals(schedule, bankZone) {
    let intervals = [];
    for (const man in schedule) {
        if (schedule.hasOwnProperty(man)) {
            timeToInterval(intervals, schedule[man], bankZone);
        }
    }

    return intervals;
}

function timeToInterval(intervals, time, bankZone) {
    for (const t of time) {
        let start = getDateByTime(t.from, bankZone);
        let end = getDateByTime(t.to, bankZone);
        intervals.push({ start, end });
    }
}

function getDateByTime(time, bankZone) {
    let { day, hours, minutes, zone } = getParsedTime(time);
    let date = getNewDate(hours, minutes, day, 10, 2017);
    date = new Date(date - oneHour * (zone - bankZone));

    return date;
}

function getParsedTime(time) {
    let [day, zoneTime] = time.split(' ');
    day = dayToNumber(day);
    let [hours, minutesAndZone] = zoneTime.split(':');
    hours = Number(hours);
    const minutes = parseInt(minutesAndZone);
    const zone = Number(minutesAndZone.slice(2));

    return { day, minutes, hours, zone };
}

function dayToNumber(day) {
    // Отталкиваемся от чисел выбранной недели
    return {
        'ПН': 16,
        'ВТ': 17,
        'СР': 18,
        'ЧТ': 19,
        'ПТ': 20,
        'СБ': 21,
        'ВС': 15
    }[day];
}

function sortMethod(a, b) {
    return a.start - b.start;
}
