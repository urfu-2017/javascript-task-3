'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;


let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];


/**
 * @param {String} str - В формате 'ПН 11:30+5'
 * @returns {Date}
 */
function parseDate(str) {
    let [day, hours, minutes, timeZone] = str.split(/[\s:+]/);
    // 2017-10-09 - понедельник
    let dateMonday = `2017-10-${9 + days.indexOf(day)}`;

    return new Date(`${dateMonday}  ${hours}:${minutes} GMT+${timeZone}00`);
}


/**
 * @param {Date} date 
 * @param {String} stage - 'from' or 'to
 * @param {Boolean} isFreeTime 
 */
function Event(date, stage, isFreeTime) {
    this.date = date;
    this.stage = stage;
    this.isFreeTime = isFreeTime;
}


/**
 * @param {Date} from 
 * @param {Date} to 
 */
function Interval(from, to) {
    this.from = from;
    this.to = to;
}


/**
 * @param {Array.<Event>} events 
 * @param {Number} robbersCount 
 * @returns {Array.<Interval>}
 */
function crossEvents(events, robbersCount) {
    events.sort(function (a, b) {
        return a.date - b.date;
    });
    let crossedEvents = [];
    let freeCount = robbersCount;
    let freeCountNeed = robbersCount + 1;
    events.forEach(function (event, index, array) {
        if (freeCount === freeCountNeed) {
            crossedEvents.push(new Interval(array[index - 1].date, event.date));
        }
        if (event.stage === 'from' && event.isFreeTime ||
            event.stage === 'to' && !event.isFreeTime) {
            freeCount++;
        } else {
            freeCount--;
        }
    });

    return crossedEvents;
}


/**
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Array.<Event>}
 */
function getBankEvents(workingHours) {
    let workingDays = ['ПН', 'ВТ', 'СР'];
    let events = [];
    workingDays.forEach(day => {
        let date = parseDate(`${day} ${workingHours.from}`);
        events.push(new Event(date, 'from', true));
        date = parseDate(`${day} ${workingHours.to}`);
        events.push(new Event(date, 'to', true));
    });

    return events;
}


/**
 * @param {Object} schedule – Расписание Банды
 * @returns {Array.<Event>}
 */
function getRobbersEvents(schedule) {
    let events = [];
    Object.keys(schedule).forEach(robber => {
        schedule[robber].forEach(interval => {
            let date = parseDate(interval.from);
            events.push(new Event(date, 'from', false));
            date = parseDate(interval.to);
            events.push(new Event(date, 'to', false));
        });
    });

    return events;
}


/**
 * @param {Object} schedule – Расписание Банды
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @returns {Array.<Event>}
 */
function getAllEvents(schedule, workingHours) {
    let robbersEvents = getRobbersEvents(schedule);
    let bankEvents = getBankEvents(workingHours);

    return robbersEvents.concat(bankEvents);
}


/**
 * @param {Number} milliseconds 
 * @returns {Number}
 */
function millisecondsToMinutes(milliseconds) {
    return milliseconds / 1000 / 60;
}


/**
 * @param {Array.<Interval>} intervals 
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Date} possibleStart 
 * @returns {Date}
 */
function findRobberyTime(intervals, duration, possibleStart = Number.NEGATIVE_INFINITY) {
    for (let interval of intervals) {
        if (possibleStart >= interval.to) {
            continue;
        } else if (possibleStart > interval.from) {
            interval.from = possibleStart;
        }
        if (millisecondsToMinutes(interval.to - interval.from) >= duration) {
            return interval.from;
        }
    }
}


/**
 * @param {Number|String} number 
 * @param {Number} needLength 
 * @returns {String}
 */
function addZerosToLength(number, needLength) {
    number = number.toString();
    if (number.length >= needLength) {
        return number;
    }

    return '0'.repeat(needLength - number.length) + number;
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
    let bankTimezone = Number(workingHours.from.slice(workingHours.from.indexOf('+') + 1));
    let events = getAllEvents(schedule, workingHours);
    let crossedEvents = crossEvents(events, Object.keys(schedule).length);
    let robberyTime = findRobberyTime(crossedEvents, duration);


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyTime);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robberyTime) {
                return '';
            }
            let date = new Date(robberyTime);
            date.setHours(date.getHours() + bankTimezone + date.getTimezoneOffset() / 60);
            // getDay() - возвращает индекс дня с воскресенья, а days[0] === 'ПН'
            let day = days[(date.getDay() + 6) % 7];

            return template.replace('%HH', addZerosToLength(date.getHours(), 2))
                .replace('%MM', addZerosToLength(date.getMinutes(), 2))
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!robberyTime) {
                return false;
            }
            let minutesLater = 30;
            let date = new Date(robberyTime);
            date.setMinutes(date.getMinutes() + minutesLater);
            let lateStart = findRobberyTime(crossedEvents, duration, date);
            if (lateStart) {
                robberyTime = lateStart;

                return true;
            }

            return false;
        }
    };
};
