'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const DAY_NAMES = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;

const AVAILABLE_DAYS = ['ПН', 'ВТ', 'СР'];
const NEXT_TIME_OFFSET = 30;

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

    function createPeriod(from, to) {
        return {
            from,
            to
        };
    }

    function parsePeriods(strPeriods) {
        return strPeriods.map(
            period => createPeriod(
                parseTimeParts(period.from).getAbsoluteValue(),
                parseTimeParts(period.to).getAbsoluteValue()
            )
        );
    }

    function appendDay(day, strPeriod) {
        return createPeriod(`${day} ${strPeriod.from}`, `${day} ${strPeriod.to}`);
    }

    let baseTimezone = parseTimeParts(workingHours.from).timezone;
    let periodsToFind = parsePeriods(
        AVAILABLE_DAYS.map(day => appendDay(day, workingHours)));
    let excludePeriods = parsePeriods(Object.values(schedule).reduce((a, b) => a.concat(b)));
    let firstPossibleTime = findPeriod(
        periodsToFind[0].from, periodsToFind, excludePeriods, duration);
    let currentTime = firstPossibleTime;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return firstPossibleTime !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (currentTime === null) {
                return '';
            }

            const timeParts = fromAbsoluteTime(currentTime, baseTimezone);

            return template
                .replace('%DD', DAY_NAMES[timeParts.day])
                .replace('%HH', padTime(timeParts.hours))
                .replace('%MM', padTime(timeParts.minutes));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!currentTime) {
                return false;
            }
            let result = findPeriod(
                currentTime + NEXT_TIME_OFFSET, periodsToFind, excludePeriods, duration);
            if (result) {
                currentTime = result;
            }

            return Boolean(result);
        }
    };
};

function createTimeParts(day, hours, minutes, timezone) {
    return {
        day,
        hours,
        minutes,
        timezone,
        getAbsoluteValue: function () {
            return (day * HOURS_PER_DAY + hours - timezone) * MINUTES_PER_HOUR + minutes;
        }
    };
}

function parseTimeParts(timeStr) {
    let [, dayStr, hours, minutes, timezone] = /(?:(\S{2}) )?(\d\d):(\d\d)\+(\d+)/.exec(timeStr);
    let day = DAY_NAMES.indexOf(dayStr);
    if (day === -1) {
        day = null;
    }

    return createTimeParts(day, Number(hours), Number(minutes), Number(timezone));
}

function fromAbsoluteTime(absoluteTime, timezone) {
    absoluteTime += timezone * MINUTES_PER_HOUR;
    const days = Math.floor(absoluteTime / MINUTES_PER_DAY);
    const dayPart = absoluteTime % MINUTES_PER_DAY;
    const hours = Math.floor(dayPart / MINUTES_PER_HOUR);
    const minutes = dayPart % MINUTES_PER_HOUR;

    return createTimeParts(days, hours, minutes, timezone);
}

function findPeriod(startTime, periodsToFind, excludePeriods, duration) {
    const timeline = generateTimeline(startTime, periodsToFind, excludePeriods);
    let resultTime = null;
    let intersections = excludePeriods.length;
    for (const { time, event } of timeline) {
        intersections += event;

        if (resultTime === null && intersections >= excludePeriods.length + 1 &&
            time >= startTime) {
            resultTime = time;
            continue;
        }

        if (resultTime !== null && time - resultTime >= duration) {
            return resultTime;
        }
        if (intersections < excludePeriods.length + 1) {
            resultTime = null;
        }
    }

    return null;
}

function generateTimeline(startTime, periodsToFind, excludePeriods) {
    const OPEN_EVENT = 1;
    const CLOSE_EVENT = -1;
    let timeline = [];
    function pushEvent(time, event) {
        timeline.push({
            time,
            event
        });
    }
    function pushPeriods(periods, exclude) {
        periods.forEach((period) => {
            pushEvent(period.from, exclude ? CLOSE_EVENT : OPEN_EVENT);
            pushEvent(period.to, exclude ? OPEN_EVENT : CLOSE_EVENT);
        });
    }

    pushPeriods(periodsToFind, false);
    pushPeriods(excludePeriods, true);
    pushEvent(startTime, 0, false);

    timeline.sort((a, b) => {
        let result = a.time - b.time;
        if (result === 0) {
            result = a.event - b.event;
        }

        return result;
    });

    return timeline;
}

function padTime(time) {
    return ('00' + time).slice(-2);
}
