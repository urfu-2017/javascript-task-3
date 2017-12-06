'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
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

let busyTime = {
    Danny: [],
    Rusty: [],
    Linus: []
};

let arrayAllIntervals = [];

let arrayIntervals = [];

let arrForTry = [];

let interval = {
    timeNoForm: undefined,
    time: undefined,
    duration: undefined,
    dayWeek: undefined
};

let tryL = 0;
let metka;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    freeTime = {
        Bank: [],
        Danny: [],
        Rusty: [],
        Linus: []
    };
    busyTime = {
        Danny: [],
        Rusty: [],
        Linus: []
    };
    tryL = 0;
    parseData(schedule, workingHours);
    arrayAllIntervals.sort(function (a, b) {

        return a - b;
    });
    findInterval();
    let intervals = selection(duration);
    if (intervals.length !== 0) {
        ifCalltryLater(intervals, duration);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            tryL = 0;
            metka = false;

            return intervals.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (intervals.length > tryL && !metka) {
                template = template.replace(/%DD/, intervals[0].time.dayWeek);
                template = template.replace(/%HH/, intervals[0].time.hour);
                template = template.replace(/%MM/, intervals[0].time.min);

                return template;
            }
            if (metka && tryL < arrForTry.length) {
                template = template.replace(/%DD/, arrForTry[tryL].dayWeek);
                template = template.replace(/%HH/, arrForTry[tryL].hour);
                template = template.replace(/%MM/, arrForTry[tryL].min);
                metka = false;

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
            metka = true;
            if (arrForTry[tryL] !== undefined) {
                metka = true;

                return true;
            }
            tryL--;

            return false;
        }
    };
};

function ifCalltryLater(intervals, duration) {
    findTry(intervals, duration, -1);
    for (let i = 0; i < intervals.length - 1; i++) {
        let next = intervals[i + 1].timeNoForm.to - intervals[i].timeNoForm.from;
        if (next >= 30) {
            findTry(intervals, duration, i);
        }
    }
}

function findTry(intervals, duration, i) {
    arrForTry.push(intervals[i + 1].time);
    let dur = 30;
    while (intervals[i + 1].duration - dur >= duration) {
        let inter = {};
        inter.from = intervals[i + 1].timeNoForm.from + dur;
        arrForTry.push(answer(inter, intervals[i + 1].dayWeek));
        dur += 30;
    }
}

function parseData(schedule, workingHours) {
    arrayAllIntervals = [];
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
    switch (flag) {
        case 'bank':
            timeZone = Number(assMin[1]);
            break;
        case 'from':
            newTime += (timeZone - Number(assMin[1])) * 60;
            break;
        case 'to':
            newTime += (timeZone - Number(assMin[1])) * 60;
            break;
        default:
            break;
    }

    return newTime;
}

function parseSchedule(schedulePeople, namePeople) {
    if (schedulePeople.length === 0) {
        addNormInterval(0, 72 * 60 - 1, namePeople);

        return;
    }
    for (let i = 0; i < schedulePeople.length; i++) {
        let dayWeekFrom = schedulePeople[i].from.split(' ');
        let dayWeekTo = schedulePeople[i].to.split(' ');
        let timeFrom;
        let timeTo;
        timeFrom = parseTime(dayWeekFrom[1], 'from');
        timeTo = parseTime(dayWeekTo[1], 'to');
        timeFrom = timeWithWeek(timeFrom, dayWeekFrom[0]);
        timeTo = timeWithWeek(timeTo, dayWeekTo[0]);
        linkage(timeFrom, timeTo, namePeople);
    }
    interpretatorIntervals(namePeople);
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
    intervalTimePeople = check (timeFrom, timeTo, name, intervalTimePeople);
    busyTime[name].push(intervalTimePeople);
}

function check(timeFrom, timeTo, name, intervalCh) {
    let arr = busyTime[name];
    for (let i = 0; i < arr.length; i++) {
        if (timeFrom >= arr[i].from && timeTo <= arr[i].to ||
            timeFrom <= arr[i].from && timeTo >= arr[i].to) {
            arr[i].from = Math.min(timeFrom, arr[i].from);
            arr[i].to = Math.max(timeTo, arr[i].to);

            return intervalCh;
        }
        if (timeFrom >= arr[i].from && timeFrom <= arr[i].to) {
            arr[i].to = timeTo;

            return intervalCh;
        }
        if (timeTo <= arr[i].to && timeTo >= arr[i].from) {
            arr[i].from = timeFrom;

            return intervalCh;
        }
    }
    intervalCh.from = timeFrom;
    intervalCh.to = timeTo;

    return intervalCh;
}

function interpretatorIntervals(name) {
    let iPeople = busyTime[name].sort(function (a, b) {
        return a.from - b.from;
    });
    if (iPeople[0].from !== 0) {
        addNormInterval(0, iPeople[0].from - 1, name);
    }
    for (let i = 1; i < iPeople.length; i++) {
        addNormInterval(iPeople[i - 1].to, iPeople[i].from - 1, name);
    }
    if (iPeople[iPeople.length - 1].to < 168 * 60 - 1) {
        addNormInterval(iPeople[iPeople.length - 1].to, 168 * 60 - 1, name);
    }
}

function addNormInterval(from, to, name) {
    let parseInter = Object.create(intervalTime);
    parseInter.from = from;
    parseInter.to = to;
    freeTime[name].push(parseInter);
    if (arrayAllIntervals.indexOf(from) === -1) {
        arrayAllIntervals.push(from);
    }
    if (arrayAllIntervals.indexOf(to) === -1) {
        arrayAllIntervals.push(to);
    }
}

function findInterval() {
    arrForTry = [];
    arrayIntervals = [];
    for (let i = 0; i < freeTime.Bank.length; i++) {
        let maxFrom = freeTime.Bank[i].from;
        let minTo = freeTime.Bank[i].to;
        let length = freeTime.Danny.length + freeTime.Rusty.length + freeTime.Linus.length;
        let arg = {
            arrWasTo: [],
            allTo: [],
            maxFrom: maxFrom,
            minTo: minTo,
            i: i
        };
        for (let j = 0; j < length; j++) {
            maxFrom = findNormInterval(arg);
        }
    }
}

function findNormInterval(arg) {
    let inter = Object.create(intervalTime);
    arg.allTo.push(arg.maxFrom);
    inter = findOptInterval(arg.maxFrom, arg.minTo, freeTime.Danny, inter);
    arg.allTo.push(inter.to);
    inter = findOptInterval(inter.from, inter.to, freeTime.Rusty, inter);
    arg.allTo.push(inter.to);
    inter = findOptInterval(inter.from, inter.to, freeTime.Linus, inter);
    if (inter.from !== undefined && (inter.to - inter.from) !== 0) {
        if (arg.arrWasTo.indexOf(inter.to) === -1) {
            arg.inter = inter;
            addNInter(arg);
        }
    } else {
        let ind = arg.allTo.indexOf(undefined);
        arg.maxFrom = findStartNext(arg.allTo[ind - 1], arg.arrWasTo);
        arg.arrWasTo.push(arg.allTo[ind - 1]);
    }

    return arg.maxFrom;
}

function addNInter(arg) {
    if (arg.arrWasTo.indexOf(arg.inter.to) === -1) {
        let newInterval = Object.create(interval);
        newInterval.timeNoForm = arg.inter;
        newInterval.dayWeek = arg.i;
        newInterval.duration = arg.inter.to - arg.inter.from;
        newInterval.time = answer(arg.inter, arg.i);
        arrayIntervals.push(newInterval);
        arg.maxFrom = findStartNext(arg.inter.to, arg.arrWasTo);
        arg.arrWasTo.push(arg.inter.to);
        arg.arrWasTo.push(arg.maxFrom);
    }
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
    if (arg.left <= timePeople.from) {
        if (timePeople.from < arg.optFrom && timePeople.from < arg.right) {
            arg.optFrom = timePeople.from;
            arg.left = arg.optFrom;
        }
    }
    if (arg.left < timePeople.to && timePeople.to < arg.right) {
        arg.right = timePeople.to;
    }

    return arg;
}

function findStartNext(to, arrWasTo) {
    let i = 0;
    while (i < arrayAllIntervals.length) {
        if (arrayAllIntervals[i] > to && arrWasTo.indexOf(arrayAllIntervals[i]) === -1) {
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
