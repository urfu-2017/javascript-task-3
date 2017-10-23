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
function toFreeTimeInNumbers(oneArray, time) {
    var weekFree = [];
    var openTime = [0];
    for (var i = 0; i < oneArray.length; i++) {
        var sergmentFreeTime = openTime.concat(toMinuetsFromDate(oneArray[i].from, time));
        weekFree.push(sergmentFreeTime);
        openTime = [toMinuetsFromDate(oneArray[i].to, time)];
        if (i === oneArray.length - 1) {
            var lastSegmentTime = [toMinuetsFromDate(oneArray[i].to, time)].concat(4319);
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

function toOneFreeTime(P1, P2) {
    var answ = [];
    for (var i = 0; i < P1.length; i++) {
        var n1 = P1[i][0];
        var k1 = P1[i][1];
        for (var j = 0; j < P2.length; j++) {
            var n2 = P2[j][0];
            var k2 = P2[j][1];
            answ.push(intersectionOfTime(n1, k1, n2, k2));
        }
    }
    var answWithoutEmpty = [];
    for (var k = 0; k < answ.length; k++) {
        if (answ[k].length !== 0) {
            answWithoutEmpty.push(answ[k]);
        }
    }

    return answWithoutEmpty;
}

function searchTimeResult(schedule, duration, workingHours) {
    var newSchedule = addWorkersToSchedule(schedule);
    var answer = [];
    var data = scheduleToData(newSchedule, workingHours);
    var timeDenny = data.Denny;
    var timeRusty = data.Rusty;
    var freeTimePeople = toOneFreeTime(toOneFreeTime(timeDenny, data.Linus),
        timeRusty);
    var freeTimeWithBank = toOneFreeTime(freeTimePeople,
        toOneTimeZone(timeToData(workingHours), workingHours));
    var lootTimeInOneLine = findTime(duration, freeTimeWithBank);
    if (lootTimeInOneLine.length === 0) {

        return '';
    }

    for (var i = 0; i < lootTimeInOneLine.length; i++) {
        var date = workTimeToDays(lootTimeInOneLine[i]);
        answer.push(date);
    }

    return answer[0];
}

function intersectionOfTime(a, b, c, d) {
    var a1 = a;
    var b1 = b;
    var c1 = c;
    var d1 = d;
    var intersection = [];
    if (c > b || d < a) {
        return intersection;
    }
    intersection = [Math.max(a1, c1), Math.min(b1, d1)];

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
    newSchedule.Denny = [];
    newSchedule.Linus = [];
    newSchedule.Rusty = [];
    newSchedule.Linus = addTaskHelp(schedule.Linus);
    newSchedule.Rusty = addTaskHelp(schedule.Rusty);
    newSchedule.Denny = addTaskHelp(schedule.Danny);

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
