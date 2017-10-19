'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var days = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };

var parserTime = function parserTime(timeString, timeZone) {
    var time = timeString.split(/\s|:|\+/);
    var hours = days[time[0]] * 24 + parseInt(time[1]) + (timeZone - parseInt(time[3]));

    return hours * 60 + parseInt(time[2]);
};

var parserSchedule = function parserSchedule(schedule, timeZone) {
    var intervals = [];
    Object.keys(schedule).forEach(function (name) {
        schedule[name].forEach(function (interval) {
            var beginWork = parserTime(interval.from, timeZone);
            var endWork = parserTime(interval.to, timeZone);
            intervals.push([beginWork, endWork]);
        });
    });

    return intervals.sort(function (a, b) {

        return a[0] - b[0];
    });
};

var getIntervalsScheduleFree = function (intervals) {
    var begin = 0;
    var intervalsFree = [];
    intervals.forEach(function (interval) {
        if (interval[0] > begin) {
            intervalsFree.push([begin, interval[0]]);
        }
        if (interval[1] > begin) {
            begin = interval[1];
        }
    });
    intervalsFree.push([begin, 7 * 24 * 60]);

    return intervalsFree;
};

var getIntervalsWorks = function (beginWork, endWork) {
    var intervalsWorks = [];
    for (var i = 0; i < 3; i++) {
        intervalsWorks.push([(beginWork + i * 24 * 60), (endWork + i * 24 * 60)]);
    }

    return intervalsWorks;
};

var getStartRobberyOnIntervals = function (intervalFree, intervalWork, duration) {
    var startRobbery = ((intervalFree[0] > intervalWork[0]) ? intervalFree[0] : intervalWork[0]);
    var endRobbery = startRobbery + duration;
    if ((endRobbery <= intervalFree[1]) && (endRobbery <= intervalWork[1])) {

        return startRobbery;
    }
};

var getStartRobbery = function (intervals, intervalsWorks, duration) {
    var i = 0;
    var j = 0;
    while ((i < intervals.length) && (j < intervalsWorks.length)) {
        if (intervals[i][0] >= intervalsWorks[j][1]) {
            j++;
            continue;
        }
        if (intervals[i][1] < intervalsWorks[j][0]) {
            i++;
            continue;
        }
        var startRobbery = getStartRobberyOnIntervals(intervals[i], intervalsWorks[j], duration);
        if (startRobbery !== undefined) {

            return startRobbery;
        }
        if (intervals[i][1] > intervalsWorks[j][1]) {
            j++;
        } else {
            i++;
        }
    }
};

var getCutIntervalsFree = function (intervalsFree, start) {
    var i = 0;
    for (var j in intervalsFree) {
        if (intervalsFree[j][1] <= start) {
            i += 1;
        }
    }
    intervalsFree = intervalsFree.slice(i);
    if (intervalsFree.length === 0) {

        return [];
    }
    intervalsFree[0][0] = start;

    return intervalsFree;
};

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
    var timeZone = parseInt(workingHours.from.split('+')[1]);
    var beginWork = parserTime('ПН ' + workingHours.from, timeZone);
    var endWork = parserTime('ПН ' + workingHours.to, timeZone);
    var intervals = parserSchedule(schedule, timeZone);
    var intervalsFree = getIntervalsScheduleFree(intervals);
    var intervalsWorks = getIntervalsWorks(beginWork, endWork);
    var startRobbery = getStartRobbery(intervalsFree, intervalsWorks, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return (startRobbery !== undefined);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (startRobbery === undefined) {

                return '';
            }
            var daysArray = ['ПН', 'ВТ', 'СР'];
            var day = parseInt(startRobbery / (24 * 60));
            var hours = parseInt(startRobbery / 60) - day * 24;
            var minutes = startRobbery - day * 24 * 60 - hours * 60;
            hours = (hours < 10) ? '0' + hours : hours.toString();
            minutes = (minutes < 10) ? '0' + minutes : minutes.toString();

            var time = template.replace(/(%DD)|(%HH)|(%MM)/g, function (pattern) {
                switch (pattern) {
                    case '%DD':
                        return daysArray[day];
                    case '%HH':
                        return hours;
                    default:
                        return minutes;
                }
            });

            return time;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (startRobbery === undefined) {

                return false;
            }
            var startNewRobbery = startRobbery + 30;
            intervalsFree = getCutIntervalsFree(intervalsFree, startNewRobbery);
            startNewRobbery = getStartRobbery(intervalsFree, intervalsWorks, duration);
            if (startNewRobbery === undefined) {

                return false;
            }
            startRobbery = startNewRobbery;

            return true;
        }
    };
};
