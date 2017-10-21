'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
const MINUTES_IN_DAY = 24 * 60;
const MINUTES_IN_HOUR = 60;
const HOUR_IN_DAY = 24;
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const DAYSFORTHIEF = 3; // сколько дней можно грабить

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let busyTime = [];
    for (let name in schedule) {
        if (name) {
            busyTime = busyTime.concat(timeWheSomeoneIsBusy(schedule[name]));
        }
    }
    let workTimelines = workingHoursToTimelines(workingHours);
    let start = -1;
    if (typeof duration === 'number' && duration > 0 && duration < MINUTES_IN_DAY) {
        start = getStartTimeForThief(workTimelines, busyTime, duration);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return start !== -1;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (start === -1) {
                return '';
            }
            let [day, hours, minutes] = minutesToData(start, workingHours);
            if (Number(minutes) < 10) {
                minutes = '0' + minutes;
            }
            if (Number(hours) < 10) {
                hours = '0' + hours;
            }

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
            return false;
        }
    };
};

/**
 * @param {Number} minutes – Количество минут
 * @param {Object} workingHours – Время работы банка
 * @returns {Array}
 */
function minutesToData(minutes, workingHours) {
    let numberOfDay = Math.floor((minutes / MINUTES_IN_HOUR +
        Number(workingHours.to.slice(6, 8))) / HOUR_IN_DAY);
    let day = DAYS[numberOfDay];
    let hour = String(Math.floor((minutes - HOUR_IN_DAY * numberOfDay *
        MINUTES_IN_HOUR) / MINUTES_IN_HOUR) + Number(workingHours.to.slice(6, 8)));
    let minute = String(minutes - HOUR_IN_DAY * numberOfDay * MINUTES_IN_HOUR -
        Math.floor((minutes - HOUR_IN_DAY * numberOfDay * MINUTES_IN_HOUR) /
            MINUTES_IN_HOUR) * MINUTES_IN_HOUR);

    return [day, hour, minute];
}

/**
 * @param {Array} workTimelines – Расписание работы банка
 * @param {Array} busyTime – Время когда члены банды заняты
 * @param {Number} duration - Время на ограбление в минутах
 * @returns {Number}
 */
function getStartTimeForThief(workTimelines, busyTime, duration) {
    for (let workTimeline of workTimelines) {
        let start = findStartTimeForThief(workTimeline, busyTime, duration);
        if (start !== -1) {
            return start;
        }
    }

    return -1;
}


/**
 * @param {Array} workTimeline – Отрезок времени когда банк работает
 * @param {Array} busyTime – Время когда члены банды заняты
 * @param {Number} duration - Время на ограбление в минутах
 * @returns {Number}
 */
function findStartTimeForThief(workTimeline, busyTime, duration) {
    let timeline = [workTimeline[0], workTimeline[0] + duration];
    while (timeline[1] <= workTimeline[1]) {
        if (!workTimelineIntersectBusyTime(timeline, busyTime)) {
            return timeline[0];
        }
        timeline[0] += 1;
        timeline[1] += 1;
    }

    return -1;
}


/**
 * @param {Array} workTimeline – Отрезок времени когда банк работает
 * @param {Array} busyTime – Время когда члены банды заняты
 * @returns {Boolean}
 */
function workTimelineIntersectBusyTime(workTimeline, busyTime) {
    return busyTime.some(function intersect(timeline2) {
        return workTimeline[0] > timeline2[0] && workTimeline[0] < timeline2[1] ||
            workTimeline[1] < timeline2[1] && workTimeline[1] > timeline2[0] ||
            workTimeline[0] < timeline2[0] && workTimeline[1] > timeline2[0] ||
            workTimeline[1] > timeline2[1] && workTimeline[0] < timeline2[1] ||
            workTimeline[1] === timeline2[1] && workTimeline[0] === timeline2[0];
    });
}

/**
 * @param {Object} workingHours – Время работы банка
 * @returns {Array}
 */
function workingHoursToTimelines(workingHours) {
    let from = partWorkingHoursToTimelines(workingHours.from);
    let to = partWorkingHoursToTimelines(workingHours.to);
    let workTime = [];
    for (let i = 0; i < DAYSFORTHIEF; i++) {
        workTime.push([from + HOUR_IN_DAY * i * MINUTES_IN_HOUR,
            to + HOUR_IN_DAY * i * MINUTES_IN_HOUR]);
    }

    return workTime;
}

/**
 * @param {String} part – Начало или конец отрезка времени в который работает банк
 * @returns {Number}
 */

function partWorkingHoursToTimelines(part) {
    let hours = Number(part.slice(0, 2));
    let minutes = Number(part.slice(3, 5));
    let timezone = Number(part.slice(6, 8));

    return hours * MINUTES_IN_HOUR + minutes - timezone * MINUTES_IN_HOUR;
}

/**
 * @param {Array} manSchedule – Расписание занятости одного из грабителей
 * @returns {Array}
 */
function timeWheSomeoneIsBusy(manSchedule) {
    let timelines = manSchedule.map(function noteToMinutes(note) {
        return [partOfNoteToMinutes(note.from), partOfNoteToMinutes(note.to)];
    });

    return timelines;
}

/**
 * @param {Object} part – Начало или конец отрезка времени, в который грабитель занят
 * @returns {Number}
 */
function partOfNoteToMinutes(part) {
    let day = part.slice(0, 2);
    let mas = part.match(/\d{1,2}/g);
    let hours = Number(mas[0]);
    let minutes = Number(mas[1]);
    let timezone = Number(mas[2]);
    for (let i = 0; i < DAYS.length - 1; i++) {
        if (DAYS[i] === day) {
            hours += i * HOUR_IN_DAY;
            break;
        }
    }

    return hours * MINUTES_IN_HOUR + minutes - timezone * MINUTES_IN_HOUR;
}
