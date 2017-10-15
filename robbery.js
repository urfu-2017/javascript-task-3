'use strict';

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_DAY = 24 * 60 - 1;

function parseTime(time, withDay = false) {
    if (withDay) {
        return {
            day: time.slice(0, 2),
            hours: Number(time.slice(3, 5)),
            minutes: Number(time.slice(6, 8)),
            timeZone: Number(time.slice(-1))
        };
    }

    return {
        hours: Number(time.slice(0, 2)),
        minutes: Number(time.slice(3, 5)),
        timeZone: Number(time.slice(-1))
    };
}

function toMinutes(time) {
    return time.hours * 60 + time.minutes;
}

function timeFrom(minutes) {
    if (minutes < 0 || minutes > MINUTES_IN_DAY) {
        throw new RangeError(`value out of [0..${MINUTES_IN_DAY}]`);
    }

    let hours = Math.floor(minutes / 60);
    minutes = minutes - 60 * hours;

    return { hours, minutes };
}

function normalize(minutes) {
    if (minutes < 0) {
        let days = Math.floor((-minutes) / MINUTES_IN_DAY);
        let result = minutes + days * MINUTES_IN_DAY;

        return [result + MINUTES_IN_DAY, -1 * (days + 1)];
    }

    let days = Math.floor(minutes / MINUTES_IN_DAY);
    let result = minutes - days * MINUTES_IN_DAY;

    return [result, days];
}

function addMinutes(time, minutes) {
    let [resultMinutes, dayDiff] = normalize(toMinutes(time) + minutes);
    let resultTime = timeFrom(resultMinutes, time.timeZone);

    if (time.day) {
        let dayIndex = DAYS.indexOf(time.day) + dayDiff;
        dayIndex = dayIndex < 0 ? DAYS.length + dayIndex : dayIndex % DAYS.length;
        resultTime.day = DAYS[dayIndex];
    }

    return resultTime;
}

function leadToTimeZone(time, timeZone) {
    let timeDiff = (timeZone - time.timeZone) * 60;
    time.timeZone = timeZone;

    return addMinutes(time, timeDiff);
}

function update(notRobberyTime, timeSpan) {
    let fromDayIndex = DAYS.indexOf(timeSpan.from.day);
    let toDayIndex = DAYS.indexOf(timeSpan.to.day);

    if (fromDayIndex !== toDayIndex) {
        let firstDaySpan = { from: toMinutes(timeSpan.from), to: MINUTES_IN_DAY };
        let lastDaySpan = { from: 0, to: toMinutes(timeSpan.to) };

        notRobberyTime[timeSpan.from.day].push(firstDaySpan);
        notRobberyTime[timeSpan.to.day].push(lastDaySpan);

        for (let i = fromDayIndex + 1; i < toDayIndex; i++) {
            let daySpan = { from: 0, to: MINUTES_IN_DAY };
            notRobberyTime[DAYS[i]].push(daySpan);
        }
    } else {
        let span = { from: toMinutes(timeSpan.from), to: toMinutes(timeSpan.to) };
        notRobberyTime[timeSpan.to.day].push(span);
    }
}

function getNotRobberyTime(schedule, bankWorkingHours) {
    let notRobberyTime = {};
    let bankTimeZone = bankWorkingHours.to.timeZone;

    for (let day of DAYS) {
        notRobberyTime[day] = [];
    }

    for (let timeSpanList of Object.values(schedule)) {
        for (let timeSpan of timeSpanList) {
            timeSpan = {
                from: leadToTimeZone(parseTime(timeSpan.from, true), bankTimeZone),
                to: leadToTimeZone(parseTime(timeSpan.to, true), bankTimeZone)
            };

            update(notRobberyTime, timeSpan);
        }
    }

    return notRobberyTime;
}

function isIntersect(span1, span2) {
    return span1.to > span2.from && span1.from < span2.to;
}

function getRobberyTimeByDay(day, notRobberyTime, duration, bankWorkingSpan) {
    let robberyTimeByDay = [];
    let notRobberySpans = notRobberyTime[day];

    for (let i = bankWorkingSpan.from; i + duration <= bankWorkingSpan.to;) {
        let robberySpan = { from: i, to: i + duration };
        let intersectingSpans = notRobberySpans.filter(s => isIntersect(robberySpan, s));

        if (intersectingSpans.length === 0) {
            let robberyTime = timeFrom(robberySpan.from);
            robberyTime.day = day;
            robberyTimeByDay.push(robberyTime);
            i += 30;
        } else {
            i = Math.max.apply(null, intersectingSpans.map(s => s.to));
        }
    }

    return robberyTimeByDay;
}

function getRobberyTime(notRobberyTime, duration, bankWorkingHours) {
    let robberyTime = [];
    let bankWorkingSpan = {
        from: toMinutes(bankWorkingHours.from),
        to: toMinutes(bankWorkingHours.to)
    };

    for (let day of DAYS.slice(0, 3)) {
        robberyTime = robberyTime.concat(
            getRobberyTimeByDay(day, notRobberyTime, duration, bankWorkingSpan)
        );
    }

    return robberyTime;
}

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
    let bankWorkingHours = {
        from: parseTime(workingHours.from),
        to: parseTime(workingHours.to)
    };
    let notRobberyTime = getNotRobberyTime(schedule, bankWorkingHours);
    let robberyTime = getRobberyTime(notRobberyTime, duration, bankWorkingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyTime.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTime.length === 0) {
                return '';
            }

            let { hours, minutes, day } = robberyTime[0];
            let format = (v) => v < 10 ? `0${v}` : v;

            return template
                .replace('%HH', format(hours))
                .replace('%MM', format(minutes))
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyTime.length < 2) {
                return false;
            }

            robberyTime.shift();

            return true;
        }
    };
};
