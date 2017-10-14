'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
let week = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let index = [0, 24, 48, 72, 96, 120, 144];

let timeZone;

let intervalTime = {
    from: undefined,
    to: undefined
};

let freeTime = {
    Bank: [],
    Danny: [],
    Rusty: [],
    Linus: []
};

let arrayAllIntervals = [];

let arrayIntervals = [];

let interval = {
    timeNoForm: undefined,
    time: undefined,
    duration: undefined,
    dayWeek: undefined
};

let tryL = 0;

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
    freeTime.Bank = [];
    freeTime.Danny = [];
    freeTime.Rusty = [];
    freeTime.Linus = [];
    arrayIntervals = [];
    arrayAllIntervals = [];
    parseData(schedule, workingHours);
    arrayAllIntervals.sort(function (a, b) {

        return a - b;
    });
    findInterval();
    let intervals = selection(duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            for (let i = 0; i < arrayIntervals.length; i++) {
                if (duration <= arrayIntervals[i].duration) {

                    return true;
                }
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (intervals.length > tryL) {
                template = template.replace(/%DD/, intervals[tryL].time.dayWeek);
                template = template.replace(/%HH/, intervals[tryL].time.hour);
                template = template.replace(/%MM/, intervals[tryL].time.min);

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
            tryL++;
            for (let i = tryL - 1; i < intervals.length - 1; i++) {
                let next = intervals[i].timeNoForm.to - intervals[i + 1].timeNoForm.from;
                if (next >= 30) {

                    return true;
                }
            }

            return false;
        }
    };
};

function parseData(schedule, workingHours) {
    let fromBank = parseTime(workingHours.from, 'bank');
    let toBank = parseTime(workingHours.to, 'bank');
    for (let i = 0; i < 3; i++) {
        let workTime = Object.create(intervalTime);
        workTime.from = fromBank + index[i] * 60;
        workTime.to = toBank + index[i] * 60;
        freeTime.Bank.push(workTime);
    }
    parseSchedule(schedule.Danny, 'Danny');
    parseSchedule(schedule.Rusty, 'Rusty');
    parseSchedule(schedule.Linus, 'Linus');
}

function parseTime(time, flag) {
    let assHour = time.split(':');
    let assMin = assHour[1].split('+');
    let newTime = Number(assHour[0]) * 60 + Number(assMin[0]);
    if (flag === 'bank') {
        timeZone = Number(assMin[1]);
    } else {
        newTime += (timeZone - Number(assMin[1])) * 60;
    }

    return newTime;
}

function parseSchedule(schedulePeople, namePeople) {
    for (let i = 0; i < schedulePeople.length; i++) {
        let dayWeekFrom = schedulePeople[i].from.split(' ');
        let dayWeekTo = schedulePeople[i].to.split(' ');
        let timeFrom;
        let timeTo;
        timeFrom = parseTime(dayWeekFrom[1], '');
        timeTo = parseTime(dayWeekTo[1], '');
        timeFrom = timeWithWeek(timeFrom, dayWeekFrom[0]);
        timeTo = timeWithWeek(timeTo, dayWeekTo[0]);
        linkage(timeFrom, timeTo, namePeople);
    }
}

function timeWithWeek(time, dayWeek) {
    for (let i = 0; i < 7; i++) {
        if (dayWeek === week[i]) {
            time += index[i] * 60;
        }
    }
    if (time >= 168 * 60) {
        time = time - 168 * 60;
    }
    if (time < 0) {
        time = (168 * 60) + time;
    }

    return time;
}

function linkage(timeFrom, timeTo, name) {
    let intervalTimePeople = Object.create(intervalTime);
    intervalTimePeople.from = timeFrom;
    intervalTimePeople.to = timeTo;
    freeTime[name].push(intervalTimePeople);
    arrayAllIntervals.push(timeFrom);
    arrayAllIntervals.push(timeTo);
}

function findInterval() {
    for (let i = 0; i < freeTime.Bank.length; i++) {
        let maxFrom = freeTime.Bank[i].from;
        let minTo = freeTime.Bank[i].to;
        let length = freeTime.Danny.length + freeTime.Rusty.length + freeTime.Linus.length;
        for (let j = 0; j < length; j++) {
            maxFrom = findAndaddInterval(maxFrom, minTo, i);
        }
    }
}

function findAndaddInterval(maxFrom, minTo, i) {
    let inter = Object.create(intervalTime);
    inter = findOptInterval(maxFrom, minTo, freeTime.Danny, inter);
    inter = findOptInterval(inter.from, inter.to, freeTime.Rusty, inter);
    inter = findOptInterval(inter.from, inter.to, freeTime.Linus, inter);
    if (inter.from !== undefined && (inter.to - inter.from) !== 0) {
        let newInterval = Object.create(interval);
        newInterval.timeNoForm = inter;
        newInterval.dayWeek = i;
        newInterval.duration = inter.to - inter.from;
        newInterval.time = answer(inter, i);
        arrayIntervals.push(newInterval);
        maxFrom = findStartNext(inter.to);
    }

    return maxFrom;
}

function findOptInterval(left, right, freeTimePeople, intervalFind) {
    if (left === undefined) {
        return intervalFind;
    }
    let arg = {
        freeTimePeople: undefined,
        left: left,
        right: right,
        k: 0,
        optFrom: right
    };
    for (let i = 0; i < freeTimePeople.length; i++) {
        arg.freeTimePeople = freeTimePeople[i];
        arg = conditionFind(arg);
    }
    if (arg.k === freeTimePeople.length) {
        intervalFind.from = undefined;
        intervalFind.to = undefined;
    } else {
        intervalFind.from = arg.left;
        intervalFind.to = arg.right;
    }

    return intervalFind;
}

function conditionFind(arg) {
    let timePeople = arg.freeTimePeople;
    if (timePeople.to <= arg.left || timePeople.from >= arg.right) {
        arg.k++;
    }
    if (arg.left <= timePeople.from 
        && timePeople.from < arg.optFrom 
        && timePeople.from < arg.right) {
        arg.optFrom = timePeople.from;
        arg.left = arg.optFrom;
    }
    if (arg.left < timePeople.to && timePeople.to < arg.right) {
        arg.right = timePeople.to;
    }

    return arg;
}

function findStartNext(to) {
    let i = 0;
    while (i < arrayAllIntervals.length) {
        if (arrayAllIntervals[i] > to) {
            return arrayAllIntervals[i];
        }
        i++;
    }

    return Number.to;
}

function answer(inter, dayWeek) {
    let parseInterval = {};
    let min = inter.from % 60;
    if (min < 10) {
        min = '0' + min;
    }
    parseInterval.min = min;
    parseInterval.hour = (inter.from - parseInterval.min - (index[dayWeek] * 60)) / 60;
    parseInterval.dayWeek = week[dayWeek];

    return parseInterval;
}

function selection(duration) {
    let arr = [];
    for (let i = 0; i < arrayIntervals.length; i++) {
        if (duration <= arrayIntervals[i].duration) {
            arr.push(arrayIntervals[i]);
        }
    }

    return arr;
}
