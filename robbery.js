'use strict';

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const TIME_FORMAT = /(\d{2}):(\d{2})\+(\d+)/;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const OFFSET_FOR_MOMENT_LATER = 30;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * HOURS_IN_DAY;

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

    const datePointes = findDatePointes(schedule, workingHours);
    const appropriateMomentsInMinutes = findAppropriateMoments(datePointes, duration);
    let appropriateMoments = getRecordsDate(appropriateMomentsInMinutes);
    let start = appropriateMoments.splice(0, 1)[0];


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(start);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!start) {
                return '';
            }

            return template
                .replace('%DD', start.day)
                .replace('%HH', (`0${start.hours}`).slice(-2))
                .replace('%MM', (`0${start.minutes}`).slice(-2));
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
    const timeZoneforBank = parseInt(workingHours.from.split('+').slice(-1)[0]) * MINUTES_IN_HOUR;
    let datePointes = [];

    Object.keys(shedule).forEach(robber => {
        shedule[robber].forEach(date => {
            let minutesFrom = parseTime(date.from) + timeZoneforBank;
            let minutesTo = parseTime(date.to) + timeZoneforBank;
            datePointes.push(getDatePoint(minutesFrom, 'end'), getDatePoint(minutesTo, 'start'));
        });
    });

    return DAYS.slice(0, 3).reduce((updateDatePointes, day) => {
        let workingFrom = parseTime(workingHours.from, day);
        let workingTo = parseTime(workingHours.to, day);
        updateDatePointes.push(getDatePoint(workingFrom, 'start'), getDatePoint(workingTo, 'end'));

        return updateDatePointes;
    }, datePointes);
}

function parseTime(time, day) {
    const regTime = time.match(TIME_FORMAT);
    const hours = Number(regTime[1]);
    const minutes = Number(regTime[2]);
    let timeZone = 0;
    if (!day) {
        day = time.slice(0, 2);
        timeZone = Number(regTime[3]);
    }

    return (DAYS.indexOf(day) * HOURS_IN_DAY + hours - timeZone) * MINUTES_IN_HOUR + minutes;
}

function getDatePoint(minutes, type) {
    return { minutes, type };
}

function findAppropriateMoments(datePointes, duration) {
    let appropriateMoments = [];
    let busy = 1;
    datePointes.sort((a, b) => a.minutes - b.minutes);
    for (var i = 0; i < datePointes.length - 1; i++) {
        let countBusy = datePointes[i].type === 'end' ? 1 : -1;
        busy += countBusy;
        if (!busy && (datePointes[i + 1].minutes - datePointes[i].minutes) >= duration) {
            appropriateMoments.push(datePointes[i].minutes);
            findMomentLater(datePointes[i], datePointes[i + 1], duration, appropriateMoments);
        }
    }

    return appropriateMoments;
}

function findMomentLater(start, end, duration, appropriateMoments) {
    let momentLater = start.minutes + OFFSET_FOR_MOMENT_LATER;
    while (momentLater <= end.minutes && (end.minutes - momentLater) >= duration) {
        appropriateMoments.push(momentLater);
        momentLater += OFFSET_FOR_MOMENT_LATER;
    }
}

function getRecordsDate(appropriateMomentsInMinutes) {
    return appropriateMomentsInMinutes.reduce((dates, momentInMinutes) => {
        let day = DAYS[Math.floor(momentInMinutes / MINUTES_IN_DAY)];
        let hours = Math.floor(momentInMinutes % MINUTES_IN_DAY / MINUTES_IN_HOUR);
        let minutes = momentInMinutes % MINUTES_IN_HOUR;
        dates.push({ day, hours, minutes });

        return dates;
    }, []);
}
