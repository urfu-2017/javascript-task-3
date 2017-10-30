'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var HALF_HOUR = 30 * 60 * 1000;
var ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
var DAYS_OF_WEEK = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 7
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

    var durationMs = duration * 60 * 1000;

    var dailyBankWork = parseTask(workingHours, getTimezone(workingHours.from));
    var weeklyBankWork = getWorkTimeWeek(dailyBankWork);

    var sortedTasks = getSortedSchedule(schedule, workingHours);
    var robberyTimes = getRobberyTimes(sortedTasks, weeklyBankWork);
    var availableTimes = splitContinuousTimeOnDays(robberyTimes, weeklyBankWork)
        .map(time => combineBankSheduleAndRobberyTimes(time, weeklyBankWork))
        .filter(time => time[1] - time[0] >= durationMs);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return availableTimes.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            var startRobberyTime = availableTimes[0][0];
            var hours = startRobberyTime.getHours();
            var minutes = startRobberyTime.getMinutes();
            var day = ROBBERY_DAYS[startRobberyTime.getDate() - 1];

            hours = (hours < 10 ? '0' : '') + hours;
            minutes = (minutes < 10 ? '0' : '') + minutes;

            return template
                .replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }

            if (availableTimes[0][1] - availableTimes[0][0] - HALF_HOUR >= durationMs) {
                availableTimes[0][0] = new Date(availableTimes[0][0].getTime() + HALF_HOUR);

                return true;
            } else if (availableTimes.length > 1) {
                availableTimes.shift();

                return true;
            }

            return false;
        }
    };
};

function combineBankSheduleAndRobberyTimes(time, weeklyBankWork) {
    var earlyWorkingHours = weeklyBankWork[time[0].getDate()].from;
    var laterWorkingHours = weeklyBankWork[time[1].getDate()].to;

    if (time[0] < earlyWorkingHours) {
        time[0] = earlyWorkingHours;
    } else if (time[1] > laterWorkingHours) {
        time[1] = laterWorkingHours;
    }

    return time;
}

function getWorkTimeWeek(dailyBankWork) {
    return Object.keys(DAYS_OF_WEEK).reduce((acc, day) => {
        var dayNumber = DAYS_OF_WEEK[day];
        var copyWorkTime = Object.assign({}, dailyBankWork);
        acc[dayNumber] = {
            from: new Date(copyWorkTime.from.setDate(dayNumber)),
            to: new Date(copyWorkTime.to.setDate(dayNumber))
        };

        return acc;
    }, {});
}

function getRobberyTimes(sortedTasks, weeklyBankWork) {
    var endOfCurRobbery = weeklyBankWork[DAYS_OF_WEEK['ПН']].from;

    var robberyTimes = [];
    sortedTasks.forEach(function (task) {
        if (isTaskAfterDeadline(task)) {
            return;
        }

        if (task.from > endOfCurRobbery) {
            robberyTimes.push([endOfCurRobbery, task.from]);
            endOfCurRobbery = task.to;
        } else if (task.to > endOfCurRobbery) {
            endOfCurRobbery = task.to;
        }
    });
    var lastMomentToRobbery = weeklyBankWork[DAYS_OF_WEEK['СР']].to;
    if (endOfCurRobbery < lastMomentToRobbery) {
        robberyTimes.push([endOfCurRobbery, lastMomentToRobbery]);
    }

    return robberyTimes;
}

function isTaskAfterDeadline(task) {
    return task.from.getDate() > DAYS_OF_WEEK['СР'] && task.to.getDate() > DAYS_OF_WEEK['СР'];
}

function splitContinuousTimeOnDays(robberyTime, weeklyBankWork) {
    for (var i = 0; i < robberyTime.length; i++) {
        var isSplit = false;

        var time = robberyTime[i];
        if (time[0].getDate() !== time[1].getDate()) {
            isSplit = true;

            var endCurDay = weeklyBankWork[time[0].getDate()].to;
            var startNextDay = weeklyBankWork[time[0].getDate() + 1].from;
            robberyTime.splice(i, 1, [time[0], endCurDay], [startNextDay, time[1]]);
        }
        // на тот случай, если startNextDay будет меньше, чем time[1].getDate()
        i = isSplit ? 0 : i;
    }

    return robberyTime;
}

function getSortedSchedule(schedule, workingHours) {
    var result = [];
    var timezone = getTimezone(workingHours.from);
    Object.keys(schedule).forEach(name =>
        schedule[name].forEach(task => result.push(parseTask(task, timezone)))
    );

    return result.sort((a, b) => a.from - b.from);
}

function getTimezone(time) {
    return parseInt(time.split('+')[1], 10);
}

function parseTask(task, requierdTimezone) {
    var timezone = getTimezone(task.from);
    var parsedTask = {
        from: parseTime(task.from),
        to: parseTime(task.to)
    };
    if (parsedTask.from > parsedTask.to) {
        parsedTask.from.setDate(parsedTask.from.getDate() - DAYS_OF_WEEK['ВС']);
    }

    return convertToTimezone(parsedTask, timezone, requierdTimezone);
}

function parseTime(time) {
    var parts = time.split(' ');
    var onlyTime = parts[parts.length - 1];
    var match = onlyTime.match(/([\d]{2}):([\d]{2})\+([\d]{1,2})$/);

    var day = parts.length === 2 ? DAYS_OF_WEEK[parts[0].toUpperCase()] : 1;
    var hours = parseInt(match[1], 10);
    var minutes = parseInt(match[2], 10);

    // Для удобства сопоставим 1ое января 2007 года (понедельник) с ПН из задачи
    return new Date(2007, 0, day, hours, minutes, 0);
}

function convertToTimezone(task, curTimezone, requierdTimezone) {
    if (curTimezone === requierdTimezone) {
        return task;
    }

    return {
        from: changeTimezone(task.from, curTimezone, requierdTimezone),
        to: changeTimezone(task.to, curTimezone, requierdTimezone)
    };
}

function changeTimezone(time, curTimezone, requierdTimezone) {
    var diffTimezone = curTimezone - requierdTimezone;
    var translatedHours = time.getHours() - diffTimezone;
    time.setHours(translatedHours);

    return time;
}
