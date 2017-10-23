'use strict';

const MINUTES_IN_DAY = 1440;
const MINUETS_IN_HOUR = 60;

exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */

        exists: function () {
            var stringDayToRob = searchTimeResult(schedule, duration, workingHours);

            return Boolean(stringDayToRob);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            var stringDayToRob = searchTimeResult(schedule, duration, workingHours);
            if (this.exists()) {
                var timeDay = stringDayToRob.substring(0, 2);
                var timeHours = stringDayToRob.substring(3, 5);
                var timeMin = stringDayToRob.substring(6, 8);

                return template
                    .replace(/%DD/, timeDay)
                    .replace(/%HH/, timeHours)
                    .replace(/%MM/, timeMin);
            }

            return '';
        },


        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};
function scheduleToData(schedule, time) {
    var newSchedule = addTask(schedule);
    var res = {};
    var keys = Object.keys(newSchedule);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = newSchedule[key];
        res[key] = toFreeTimeInNumbers(value, time);
    }

    return res;
}
function toFreeTimeInNumbers(oneWorkerShedule, time) {
    var weekFree = [];
    var openTime = [0];
    for (var i = 0; i < oneWorkerShedule.length; i++) {
        var sergmentFreeTime = openTime.concat(toMinuetsFromDate(oneWorkerShedule[i].from, time));
        weekFree.push(sergmentFreeTime);
        openTime = [toMinuetsFromDate(oneWorkerShedule[i].to, time)];
        if (i === oneWorkerShedule.length - 1) {
            var lastSegmentTime = [toMinuetsFromDate(oneWorkerShedule[i].to, time)].concat(4319);
            weekFree.push(lastSegmentTime);
        }
    }

    return weekFree;
}

function toMinuets(str) {
    if (str.length === 7) {
        var timeWithDay = MINUETS_IN_HOUR * Number(str.substring(0, 2)) +
        Number(str.substring(3, 5)) -
        MINUETS_IN_HOUR * Number(str.substring(6, 7));

        return timeWithDay;
    }
    var time = MINUETS_IN_HOUR * Number(str.substring(0, 1)) + Number(str.substring(2, 4)) -
    MINUETS_IN_HOUR * Number(str.substring(5, 6));

    return time;
}

function addZero(h) {
    if (h < 10) {
        var hr = '0' + h;

        return hr;
    }

    return h;
}

function workTimeToDays(numb) {
    var str = '';
    if (numb < MINUTES_IN_DAY * 3 && numb >= MINUTES_IN_DAY * 2) { // ноль! 09 
        str = 'СР ' + addZero(Math.floor((numb - MINUTES_IN_DAY * 2) / MINUETS_IN_HOUR)) + ':' +
         addZero((numb - MINUTES_IN_DAY * 2) % MINUETS_IN_HOUR);
    }
    if (numb < MINUTES_IN_DAY * 2 && numb >= MINUTES_IN_DAY) {
        str = 'ВТ ' + addZero(Math.floor((numb - MINUTES_IN_DAY) / MINUETS_IN_HOUR)) + ':' +
        addZero((numb - MINUTES_IN_DAY) % MINUETS_IN_HOUR);
    }
    if (numb < MINUTES_IN_DAY) {
        str = 'ПН ' + addZero(Math.floor(numb / MINUETS_IN_HOUR)) + ':' +
        addZero(numb % MINUETS_IN_HOUR);
    }

    return str;
}

function toMinuetsFromDate(day, timeBank) {
    var days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    var i = days.indexOf(day.substring(0, 2));
    var timeInMinutes = MINUETS_IN_HOUR * Number(day.substring(3, 5)) +
    Number(day.substring(6, 8)) - MINUETS_IN_HOUR * Number(day.substring(9, 10)) +
    MINUETS_IN_HOUR * 24 * i + MINUETS_IN_HOUR * Number(timeBank.from.substring(6));

    return timeInMinutes;
}

function toOneFreeTime(worker1, worker2) {
    var answers = [];
    for (var i = 0; i < worker1.length; i++) {
        var start1 = worker1[i][0];
        var end1 = worker1[i][1];
        for (var j = 0; j < worker2.length; j++) {
            var start2 = worker2[j][0];
            var end2 = worker2[j][1];
            answers.push(intersectionOfTime(start1, end1, start2, end2));
        }
    }
    var answersWithoutEmpty = [];
    for (var k = 0; k < answers.length; k++) {
        if (answers[k].length !== 0) {
            answersWithoutEmpty.push(answers[k]);
        }
    }

    return answersWithoutEmpty;
}

function searchTimeResult(schedule, duration, workingHours) {
    var newSchedule = addWorkersToSchedule(schedule);
    var answers = [];
    var data = scheduleToData(newSchedule, workingHours);
    var timeDanny = data.Danny;
    var timeRusty = data.Rusty;
    var freeTimePeople = toOneFreeTime(toOneFreeTime(timeDanny, data.Linus),
        timeRusty);
    var freeTimeWithBank = toOneFreeTime(freeTimePeople,
        toOneTimeZone(timeToData(workingHours), workingHours));
    var lootTimeInOneLine = findTime(duration, freeTimeWithBank);
    if (lootTimeInOneLine.length === 0) {
        return '';
    }
    for (var i = 0; i < lootTimeInOneLine.length; i++) {
        var date = workTimeToDays(lootTimeInOneLine[i]);
        answers.push(date);
    }

    return answers[0];
}

function intersectionOfTime(a, b, c, d) {
    var intersection = [];
    if (c > b || d < a) {
        return intersection;
    }
    intersection = [Math.max(a, c), Math.min(b, d)];

    return intersection;
}
function timeToData(time) {
    var workHours = [];
    var plusDay = 0;
    for (var i = 0; i < 3; i++) {
        plusDay = i * MINUTES_IN_DAY;
        if (toMinuets(time.to) + plusDay >= MINUTES_IN_DAY * (i + 1)) {
            workHours.push([toMinuets(time.from) + plusDay, (MINUTES_IN_DAY * (i + 1) - 1)]);
        } else {
            workHours.push([toMinuets(time.from) + plusDay,
                toMinuets(time.to) + plusDay]);
        }
    }

    return workHours;
}
function findTime(number, freeAr) {
    var answers = [];
    for (var i = 0; i < freeAr.length; i++) {
        var start = freeAr[i][0];
        var end = freeAr[i][1];
        if ((end - start) >= number) {
            answers.push(start);
        }
    }

    return answers;
}


function addTaskHelp(worker) {
    if (worker.length === 0) {
        worker.push({ from: 'ПН 00:00+0', to: 'ПН 00:00+0' });
    }

    return worker;
}

function addTask(schedule) {
    var newSchedule = {};
    var keys = Object.keys(schedule);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        newSchedule[key] = addTaskHelp(schedule[key]) || [];
    }

    return newSchedule;
}

function addWorkersToSchedule(schedule) {
    if (schedule.Danny === undefined) {
        schedule.Danny = [];
    }
    if (schedule.Rusty === undefined) {
        schedule.Rusty = [];
    }
    if (schedule.Linus === undefined) {
        schedule.Linus = [];
    }

    return schedule;
}

function toOneTimeZone(timeAr, workTime) {
    var result = [];
    for (var i = 0; i < timeAr.length; i++) {
        var p = [timeAr[i][0] + Number((workTime.from).substring(6)) * MINUETS_IN_HOUR,
            timeAr[i][1] + Number((workTime.to).substring(6)) * MINUETS_IN_HOUR];
        result.push(p);
    }

    return result;
}
