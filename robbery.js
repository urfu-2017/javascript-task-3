
'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var deadline = 3 * 60 * 24;

function stringToMinutes(str, bankTimeZone) {
    var [, day, hour, minute, timeZone] = str.match(/([А-Я]{2}) (\d{2}):(\d{2})\+(\d+)/);
    var result = (days.indexOf(day) * 24 + Number(hour) - Number(timeZone)) * 60 + Number(minute);
    if (bankTimeZone) {
        result += bankTimeZone * 60;
    }

    return result;
}

function intersectSchedules(firstSchedule, secondSchedule) {

    function intersectIntervals(firstInterval, secondInterval) {
        if (!firstInterval || !secondInterval || firstInterval.start >= secondInterval.end ||
            firstInterval.end <= secondInterval.start) {
            return null;
        }

        return { start: Math.max(firstInterval.start, secondInterval.start),
            end: Math.min(firstInterval.end, secondInterval.end) };
    }

    function intersectIntervalWithSchedule(schedule, interval) {
        return schedule
            .map(arg => intersectIntervals(arg, interval))
            .filter(Boolean);
    }

    var result = firstSchedule
        .reduce((acc, interval) =>
            acc.concat(intersectIntervalWithSchedule(secondSchedule, interval)), []);

    return result;
}

function minutesToDate(arg) {
    var minutes = arg % 60;
    var hours = ((arg - minutes) / 60) % 24;
    var day = days[(arg - minutes - hours * 60) / 60 / 24];

    return { day, hours, minutes };
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Object} workingHours – Время работы банка
 * @param {Number} duration - Время на ограбление в минутах
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @param {Number} bankTimeZone - Часовой пояс банка
 * @returns {Array} - массив интервалов { start, end }, подходящих для всех и достаточно длинных.
 */
function findPropriateTime(schedule, workingHours, duration, bankTimeZone) {
    function scheduleToIntervals(sch) {
        var result = [{ start: 0, end: deadline }];
        sch.forEach(function (item) {
            var from = stringToMinutes(item.from, bankTimeZone);
            var to = stringToMinutes(item.to, bankTimeZone);
            result = intersectSchedules(result,
                [{ start: 0, end: from }, { start: to, end: deadline }]);
        });

        return result;
    }
    function workingHoursToSchedule(workingTime) {
        return days.slice(0, 3).map(function (day) {
            return { start: stringToMinutes(day + ' ' + workingTime.from, bankTimeZone),
                end: stringToMinutes(day + ' ' + workingTime.to, bankTimeZone) };
        });
    }
    var result = ['Danny', 'Rusty', 'Linus']
        .map(function (name) {
            return scheduleToIntervals(schedule[name]);
        })
        .reduce(intersectSchedules, workingHoursToSchedule(workingHours))
        .filter(function (interval) {
            return (interval.end - interval.start >= duration);
        });

    return result;
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
    var bankTimeZone = Number(workingHours.from.split('+')[1]);
    var propriateTime = findPropriateTime(schedule, workingHours, duration, bankTimeZone);
    propriateTime.sort(function (a, b) {
        return a.start - b.start;
    });

    return {
        propriateTime,
        duration,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return propriateTime.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            function padLeft(num) {
                return String(num).padStart(2, '0');
            }
            if (propriateTime.length) {
                var time = minutesToDate(propriateTime[0].start);

                return template
                    .replace('%HH', padLeft(time.hours))
                    .replace('%MM', padLeft(time.minutes))
                    .replace('%DD', time.day);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (propriateTime.length === 0) {
                return false;
            }
            var desiredMoment = propriateTime[0].start + 30;
            var newPropriateTime = propriateTime.map(function (interval) {
                if (interval.start >= desiredMoment) {
                    return interval;
                }
                if (interval.end >= desiredMoment + duration &&
                    interval.start < desiredMoment) {
                    return { start: desiredMoment, end: interval.end };
                }

                return null;
            }).filter(function (interval) {
                return Boolean(interval);
            });
            if (newPropriateTime.length === 0) {
                return false;
            }
            propriateTime = newPropriateTime;

            return true;
        }
    };
};
