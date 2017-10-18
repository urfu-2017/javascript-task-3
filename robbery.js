'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;


const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const millisecondsInSecond = 1000;
const secondsInMinute = 60;

/**
 * @param {String} rawDate - В формате 'ПН 11:30+5'
 * @returns {Date}
 */
function parseDate(rawDate) {
    let [day, hours, minutes, timeZone] = rawDate.split(/[\s:+]/);
    // 2017-10-09 - понедельник
    let dateMonday = `2017-10-${9 + days.indexOf(day)}`;

    return new Date(`${dateMonday} ${hours}:${minutes} GMT+${timeZone}00`);
}


/**
 * @param {Date} date 
 * @param {String} stage - 'from' or 'to
 * @param {Boolean} isFreeTime 
 * @returns {Object}
 */
function createEvent(date, stage, isFreeTime) {
    return {
        date, stage, isFreeTime
    };
}


/**
 * @param {Date} from 
 * @param {Date} to 
 * @returns {Object}
 */
function createInterval(from, to) {
    return {
        from, to
    };
}


/**
 * @param {{date, stage, isFreeTime}} a 
 * @param {{date, stage, isFreeTime}} b 
 * @returns {{from, to}}
 */
function eventsToInterval(a, b) {
    return createInterval(a.date, b.date);
}


/**
 * @param {Array.<{date, stage, isFreeTime}>} events 
 * @param {Number} freeSchedulesCount - Кол-во расписаний дел (банк)
 * @param {Number} busySchedulesCount - Кол-во расписаний свободного времени (бандиты)
 * @returns {Array.<{from, to}>}
 */
function crossEvents(events, freeSchedulesCount, busySchedulesCount) {
    events.sort((a, b) => a.date - b.date);
    let crossedEvents = [];
    let freeCount = busySchedulesCount;
    let freeCountNeed = busySchedulesCount + freeSchedulesCount;
    events.forEach(function (event, index, array) {
        if (freeCount === freeCountNeed) {
            crossedEvents.push(eventsToInterval(array[index - 1], event));
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
 * @param {String} day 
 * @returns {{from, to}}
 */
function addDayToWorkingHours(workingHours, day) {
    return createInterval(
        parseDate(`${day} ${workingHours.from}`),
        parseDate(`${day} ${workingHours.to}`));
}


/**
 * @param {{from, to}} interval
 * @param {Boolean} isFreeSchedule
 * @returns {Array.<{from, to}>}
 */
function intervalToEvents(interval, isFreeSchedule) {
    return [
        createEvent(interval.from, 'from', isFreeSchedule),
        createEvent(interval.to, 'to', isFreeSchedule)];
}


/**
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Array.<{date, stage, isFreeTime}>}
 */
function getBankEvents(workingHours) {
    let workingDays = ['ПН', 'ВТ', 'СР'];
    let events = [];
    workingDays.forEach(day => {
        let interval = addDayToWorkingHours(workingHours, day);
        events = events.concat(intervalToEvents(interval, true));
    });

    return events;
}


/**
 * @param {Object} schedule – Расписание Банды
 * @returns {Array.<{date, stage, isFreeTime}>}
 */
function getRobbersEvents(schedule) {
    let events = [];
    Object.values(schedule).forEach(arrayOfEvents => {
        arrayOfEvents.forEach(rawInterval => {
            let interval = createInterval(parseDate(rawInterval.from), parseDate(rawInterval.to));
            events = events.concat(intervalToEvents(interval, false));
        });
    });

    return events;
}


/**
 * @param {Object} schedule – Расписание Банды
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @returns {Array.<{date, stage, isFreeTime}>}
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
    return milliseconds / millisecondsInSecond / secondsInMinute;
}


/**
 * @param {Array.<{from, to}>} intervals 
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Date} possibleStart 
 * @returns {Date}
 */
function findRobberyTime(intervals, duration, possibleStart = -Infinity) {
    for (let interval of intervals) {
        if (possibleStart >= interval.to) {
            continue;
        }
        let startOfFreeInterval = Math.max(possibleStart, interval.from);
        if (millisecondsToMinutes(interval.to - startOfFreeInterval) >= duration) {
            return startOfFreeInterval;
        }
    }
}


/**
 * @param {Number|String} number 
 * @param {Number} needLength 
 * @returns {String}
 */
function addZerosToLeft(number, needLength) {
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
    let bankTimezone = Number(workingHours.from.split('+')[1]);
    let events = getAllEvents(schedule, workingHours);
    let crossedEvents = crossEvents(events, 1, Object.keys(schedule).length);
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

            return template.replace('%HH', addZerosToLeft(date.getHours(), 2))
                .replace('%MM', addZerosToLeft(date.getMinutes(), 2))
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
