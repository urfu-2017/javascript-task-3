'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

function stringToMinuts(str) {
    var parsed = str.match(/([А-Я][А-Я]) (\d\d):(\d\d)\+?(\d?\d?)/);
    if (!parsed || Number(parsed[2]) > 23 || Number(parsed[3]) > 59) {
        return null;
    }
    var hours = days.indexOf(parsed[1]) * 24;
    if (hours < 0) {
        return null;
    }
    hours += Number(parsed[2]) - (parsed[4] ? Number(parsed[4]) : 0);

    return hours * 60 + Number(parsed[3]);
}

function mergeSchedule(sched) {
    function uniteIntervals(i1, i2) {
        if (!i1) {
            return i2;
        }
        if (!i2) {
            return i1;
        }
        if (i1.end < i2.start || i1.start > i2.end) {
            return null;
        }

        return { start: Math.min(i1.start, i2.start), end: Math.max(i1.end, i2.end) };
    }
    function mergeFirst(sh) {
        var result = [];
        var wasIntersected = 0;
        sh.forEach(function (item) {
            var union = uniteIntervals(sh[0], item);
            if (union) {
                result.push(union);
                wasIntersected++;
            } else {
                result.push(item);
            }
        });
        if (wasIntersected === 1) {
            result.push(result[0]);
        }
        result.splice(0, 1);

        return result;
    }
    var st = sched.length;
    while (st >= 0) {
        sched = mergeFirst(sched);
        st--;
    }

    return sched;
}

function intersectSchedules(sh1, sh2) {
    function intersectIntervals(i1, i2) {
        if (!i1 || !i2 || i1.start >= i2.end || i1.end <= i2.start) {
            return null;
        }

        return { start: Math.max(i1.start, i2.start), end: Math.min(i1.end, i2.end) };
    }
    var result = [];
    sh1.forEach(function (item1) {
        sh2.forEach(function (item2) {
            var intersection = intersectIntervals(item1, item2);
            if (intersection) {
                result.push(intersection);
            }
        });
    });

    return mergeSchedule(result);
}

function minutesToDate(minutes, bankTimeZone) {
    minutes = minutes + 60 * bankTimeZone;
    var day = days[(minutes - minutes % (60 * 24)) / (60 * 24)];
    minutes %= 60 * 24;
    var hours = (minutes - minutes % 60) / 60;
    minutes %= 60;

    return { day, hours, minutes };
}

function findPropriateTime(schedule, workingHours, duration) {
    function scheduleToIntervals(sch) {
        var result = [{ start: 0, end: 3 * 24 * 60 }];
        sch.forEach(function (item) {
            var from = stringToMinuts(item.from);
            var to = stringToMinuts(item.to);
            if (from < 0 && to < 0) {
                return 0;
            }
            if (from < 0) {
                result = intersectSchedules(result, [{ start: to, end: 3 * 24 * 60 }]);

                return 0;
            }
            result = intersectSchedules(result,
                [{ start: 0, end: from }, { start: to, end: 3 * 24 * 60 }]);
        });

        return result;
    }
    function workingHoursToSchedule(wH) {
        var result = [];
        days.slice(0, 3).forEach(function (item) {
            result.push({ start: stringToMinuts(item + ' ' + wH.from),
                end: stringToMinuts(item + ' ' + wH.to) });
        });

        return result;
    }
    var intersection = scheduleToIntervals(schedule.Danny);
    intersection = intersectSchedules(intersection, scheduleToIntervals(schedule.Rusty));
    intersection = intersectSchedules(intersection, scheduleToIntervals(schedule.Linus));
    intersection = intersectSchedules(intersection, workingHoursToSchedule(workingHours));
    var result = [];
    intersection.forEach(function (item) {
        if (item.end - item.start >= duration) {
            result.push(item);
        }
    });

    return result;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var bankTimeZone = Number(workingHours.from.split('+')[1]);
    bankTimeZone = bankTimeZone ? bankTimeZone : 0;
    var propriateTime = findPropriateTime(schedule, workingHours, duration);
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
            return Boolean(propriateTime.length);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (propriateTime.length) {
                var time = minutesToDate(propriateTime[0].start, bankTimeZone);
                template = template.replace('%HH', (time.hours < 10 ? '0' : '') + time.hours);
                template = template.replace('%MM', (time.minutes < 10 ? '0' : '') + time.minutes);
                template = template.replace('%DD', time.day);

                return template;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var localPropriateTime = JSON.parse(JSON.stringify(propriateTime));
            var desiredMoment = localPropriateTime[0].start + 30;
            while (localPropriateTime.length > 0 && localPropriateTime[0].start < desiredMoment) {
                if (localPropriateTime[0].end >= desiredMoment + duration &&
                    localPropriateTime[0].start <= desiredMoment) {
                    localPropriateTime[0].start = desiredMoment;
                } else {
                    localPropriateTime.splice(0, 1);
                }
            }
            if (localPropriateTime.length === 0) {
                return false;
            }
            propriateTime = JSON.parse(JSON.stringify(localPropriateTime));

            return true;
        }
    };
};
