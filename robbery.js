
'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var deadline = 3 * 60 * 24;

function stringToMinuts(str, bankTimeZone) {
    var [, day, hour, minute, timeZone] = str.match(/([А-Я]{2}) (\d{2}):(\d{2})\+(\d+)/);
    var result = (days.indexOf(day) * 24 + Number(hour) - Number(timeZone)) * 60 + Number(minute);
    if (bankTimeZone) {
        result += bankTimeZone * 60;
    }

    return result;
}

/**
 * @param {Array} scheduleToMerge – массив интервалов { start, end }, которые могут пересекаться
 * @returns {Array} - массив интервалов { start, end }, без повторений и пересечений
 */
function mergeSchedule(scheduleToMerge) {
    function uniteIntervals(firstInterval, secondInterval) {
        if (!firstInterval) {
            return secondInterval;
        }
        if (!secondInterval) {
            return firstInterval;
        }
        if (firstInterval.end < secondInterval.start || firstInterval.start > secondInterval.end) {
            return null;
        }

        return { start: Math.min(firstInterval.start, secondInterval.start),
            end: Math.max(firstInterval.end, secondInterval.end) };
    }

    /**
     * @param {Array} schedule
     * @returns {Array}
     * объединяет в исходном расписании каждый интервал с нулевым, если они пересекаются
     * хотя бы по границе. После чего удаляет из него нулевой интервал, если он был
     * объединен с каким то еще (теперь он входит туда), в противном же случае
     * кладет его в конец списка интервалов.
     */
    function mergeFirst(schedule) {
        var wasIntersected = 0;
        var result = schedule.reduce(function (unitedWithFirst, interval) {
            var union = uniteIntervals(schedule[0], interval);
            if (union) {
                wasIntersected++;
                unitedWithFirst.push(union);
            } else {
                unitedWithFirst.push(interval);
            }

            return unitedWithFirst;
        }, []);
        if (wasIntersected === 1) {
            result.push(result[0]);
        }
        result.splice(0, 1);

        return result;
    }
    var scheduleHadIntervals = scheduleToMerge.length;
    var i = 0;
    while (i < scheduleHadIntervals) {
        scheduleToMerge = mergeFirst(scheduleToMerge);
        i++;
    }

    return scheduleToMerge;
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
    var result = firstSchedule.reduce(function (intesectionScheduleSchedule,
        intervalFromFirstSchedule) {
        return secondSchedule.reduce(function (intersectionElementSchedule,
            intervalFromSecondSchedule) {
            var intersection = intersectIntervals(intervalFromFirstSchedule,
                intervalFromSecondSchedule);
            if (intersection) {
                intersectionElementSchedule.push(intersection);
            }

            return intersectionElementSchedule;
        }, []).concat(intesectionScheduleSchedule);
    }, []);

    return mergeSchedule(result);
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
            var from = stringToMinuts(item.from, bankTimeZone);
            var to = stringToMinuts(item.to, bankTimeZone);
            result = intersectSchedules(result,
                [{ start: 0, end: from }, { start: to, end: deadline }]);
        });

        return result;
    }
    function workingHoursToSchedule(workingTime) {
        return days.slice(0, 3).map(function (day) {
            return { start: stringToMinuts(day + ' ' + workingTime.from, bankTimeZone),
                end: stringToMinuts(day + ' ' + workingTime.to, bankTimeZone) };
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
    function getTimeZone(bankWorkingHours) {
        return Number(bankWorkingHours.from.split('+')[1]);
    }
    console.info(schedule, duration, workingHours);
    var bankTimeZone = getTimeZone(workingHours);
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
            function padLeft(num) {
                return String(num).padStart(2, '0');
            }
            if (propriateTime.length) {
                var time = minutesToDate(propriateTime[0].start);

                return template.replace('%HH', padLeft(time.hours))
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
