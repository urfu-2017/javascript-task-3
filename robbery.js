'use strict';

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const ROBBERS = ['Danny', 'Rusty', 'Linus'];
const TIME_FORMAT = /(\d{2}):(\d{2})\+(\d+)/;

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
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    let datePointes = findDatePointes(schedule, workingHours);
    let appropriateMoments = findAppropriateMoments(datePointes, duration);
    let start = appropriateMoments.splice(0, 1)[0];


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return start !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (start === undefined) {
                return '';
            }

            return template
                .replace('%DD', start.day)
                .replace('%HH', ('0' + start.hours).slice(-2))
                .replace('%MM', ('0' + start.minutes).slice(-2));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let startLater = appropriateMoments.splice(0, 1)[0];
            if (startLater) {
                start = startLater;

                return true;
            }

            return false;
        }
    };
};

function findDatePointes(shedule, workingHours) {
    const timeZoneforBank = parseInt(workingHours.from.split('+').slice(-1)[0]);
    let datePointes = [];

    ROBBERS.forEach(robber => {
        shedule[robber].forEach(date => {
            let [dayFrom, hoursFrom, minutesFrom] = parseTime(date.from, timeZoneforBank);
            let datePointEnd = getDatePoint(dayFrom, hoursFrom, minutesFrom, 'end');
            datePointes.push(datePointEnd);
            let [dayTo, hoursTo, minutesTo] = parseTime(date.to, timeZoneforBank);
            let datePointStart = getDatePoint(dayTo, hoursTo, minutesTo, 'start');
            datePointes.push(datePointStart);
        });
    });

    let dateFrom = workingHours.from.match(TIME_FORMAT);
    let hoursFrom = Number(dateFrom[1]);
    let minutesFrom = Number(dateFrom[2]);
    let dateTo = workingHours.to.match(TIME_FORMAT);
    let hoursTo = Number(dateTo[1]);
    let minutesTo = Number(dateTo[2]);
    for (let i = 0; i < 3; i++) {
        let datePointStart = getDatePoint(DAYS[i], hoursFrom, minutesFrom, 'start');
        datePointes.push(datePointStart);
        let datePointEnd = getDatePoint(DAYS[i], hoursTo, minutesTo, 'end');
        datePointes.push(datePointEnd);
    }

    return datePointes;
}

function parseTime(time, timeZoneforBank) {
    let day = time.slice(0, 2);
    let regTime = time.match(TIME_FORMAT);
    let hours = Number(regTime[1]);
    let minutes = Number(regTime[2]);
    let timeZone = Number(regTime[3]);
    hours = hours - timeZone + timeZoneforBank;
    if (hours < 0) {
        hours = 24 + hours;
        day = DAYS[(DAYS.indexOf(day) - 1 + 7) % 7];
    }
    if (hours >= 24) {
        hours -= 24;
        day = DAYS[(DAYS.indexOf(day) - 1 + 7) % 7];
    }

    return [day, hours, minutes];

}

function getDatePoint(day, hours, minutes, type) {
    return {
        day: day,
        hours: hours,
        minutes: minutes,
        type: type
    };
}

function findAppropriateMoments(datePointes, duration) {
    let appropriateMoments = [];
    let busy = 1;
    datePointes.sort((a, b) => compareDate(a, b));
    for (var i = 0; i < datePointes.length - 1; i++) {
        if (datePointes[i].type === 'end') {
            busy++;
        } else {
            busy--;
        }
        if (busy === 0 && moreThanDuration(datePointes[i], datePointes[i + 1], duration)) {
            appropriateMoments.push(datePointes[i]);
            findMomentLater(datePointes[i], datePointes[i + 1], duration, appropriateMoments);
        }
    }

    return appropriateMoments;
}

function findMomentLater(start, end, duration, appropriateMoments) {
    let momentLater = addMinutesToTime(start, 30);
    while (compareDate(momentLater, end) !== 1 &&
    moreThanDuration(momentLater, end, duration)) {
        appropriateMoments.push(momentLater);
        momentLater = addMinutesToTime(momentLater, 30);
    }
}

function addMinutesToTime(time, addMinutes) {
    let minutes = time.minutes + addMinutes;
    let hours = time.hours;
    let day = time.day;
    if (minutes >= 60) {
        minutes -= 60;
        hours++;
    }
    if (hours >= 24) {
        hours -= 24;
        day = DAYS[DAYS.indexOf(day) + 1];
    }

    return getDatePoint(day, hours, minutes, 'start');
}

function moreThanDuration(start, end, duration) {
    let minutesInInterval = (end.hours - start.hours) * 60 + (end.minutes - start.minutes);

    return minutesInInterval >= duration;
}


function compareDate(a, b) {
    if (DAYS.indexOf(a.day) === DAYS.indexOf(b.day)) {
        return compareHours(a, b);
    }
    if (DAYS.indexOf(a.day) > DAYS.indexOf(b.day)) {
        return 1;
    }

    return -1;
}

function compareHours(a, b) {
    if (a.hours === b.hours) {
        return compareMinutes(a, b);
    }
    if (a.hours > b.hours) {
        return 1;
    }

    return -1;
}

function compareMinutes(a, b) {
    if (a.minutes === b.minutes) {
        return 0;
    }
    if (a.minutes > b.minutes) {
        return 1;
    }

    return -1;
}
