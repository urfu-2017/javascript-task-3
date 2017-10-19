'use strict';

/**
 * неСделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

let DAYS_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let START_DAYS = [0, 24, 48, 72, 96, 120, 144];
let TIMEZONE = 0;
let PARSE_TIME = /(\D{2})\s*(\d{2}):(\d{2})\+(\d+)/i;
let PARSE_BANK = /(\d{2}):(\d{2})\+(\d+)/i;
let timeWorkBank = [];
let formInterval = {
    from: undefined,
    to: undefined
};

function parseHour(time, min, day) {

    return (time - min - START_DAYS[DAYS_WEEK.indexOf(day)] * 60) / 60;
}

function parseMin(time) {
    let minute = time % 60;

    return minute <= 9 ? '0' + minute : minute;
}

function parseDay(time) {
    let ost = time % (24 * 60);
    let inDay = (time - ost) / (24 * 60);

    return DAYS_WEEK[inDay];
}

let busyTime = [];
let timeForRobbery = {};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    busyTime = [];
    timeForRobbery = undefined;
    workBank(workingHours);
    formattingTimeGang(schedule.Danny);
    formattingTimeGang(schedule.Rusty);
    formattingTimeGang(schedule.Linus);
    busyTime.concat(timeWorkBank);
    busyTime.sort(function (a, b) {
        return a.from - b.from;
    });
    busyTime.forEach(function (item, index) {
        check(item, index);
    });
    findIntevals(duration, busyTime[0], 0);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return timeForRobbery !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (timeForRobbery !== undefined) {
                let day = parseDay(timeForRobbery.to);
                let min = parseMin(timeForRobbery.to);
                let hour = parseHour(timeForRobbery.to, min, day);

                return template
                    .replace(/%DD/, day)
                    .replace(/%HH/, hour)
                    .replace(/%MM/, min);
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

function workBank(workingHours) {
    let from = parseTimeBank(PARSE_BANK.exec(workingHours.from));
    let to = parseTimeBank(PARSE_BANK.exec(workingHours.to));
    let startDay = {
        from: from,
        to: from
    };
    busyTime.push(startDay);
    for (let i = 0; i < 3; i++) {
        let interval = Object.create(formInterval);
        interval.from = from + START_DAYS[i] * 60;
        interval.to = to + START_DAYS[i] * 60;
        timeWorkBank.push(interval);
        let finishDay = {
            from: to,
            to: from + START_DAYS[i + 1] * 60
        };
        busyTime.push(finishDay);
    }
}

function parseTimeBank(dataTime) {
    TIMEZONE = Number(dataTime[3]);

    return Number(dataTime[1]) * 60 + Number(dataTime[2]);
}

function formattingTimeGang(schedulePerson) {
    schedulePerson.forEach(function (item) {
        let interval = Object.create(formInterval);
        interval.from = parseTime(item.from);
        interval.to = parseTime(item.to);
        busyTime.push(interval);
    });
}

function parseTime(item) {
    let time = PARSE_TIME.exec(item);
    let hour = Number(time[2]) + TIMEZONE - Number(time[4]);
    let parseStr = hour * 60 + Number(time[3]);

    return createData(time, hour, parseStr);
}

function createData(time, hour, parseStr) {
    let indexDay = DAYS_WEEK.indexOf(time[1]);
    let timeDay = START_DAYS[indexDay] * 60;

    return parseStr + timeDay;
}

function findIntevals(duration, item) {
    for (let i = 1; i < busyTime.length; i++) {
        // есть достаточно времени что бы закончить ограбление до след. занятого интервала
        if (item.to + duration <= busyTime[i].from) {
            timeForRobbery = item;

            return;
        }
        item = item.to >= busyTime[i].to ? item : busyTime[i];
        if (item.to >= busyTime[busyTime.length - 1].from) {

            return undefined;
        }
    }
}


function check(item, index) {
    let i = index + 1;
    while (i < busyTime) {
    // сливаются ли занятые интервалы
        if (item.from >= busyTime[i].from && item.to <= busyTime[i].to ||
            item.from <= busyTime[i].from && item.to >= busyTime[i].to) {
            item.from = Math.min(item.from, busyTime[i].from);
            item.to = Math.max(item.to, busyTime[i].to);
            busyTime.splice(i, 1);
            continue;
        }
        // Если второй пересекает первого слева
        if (item.from >= busyTime[i].from && item.from <= item.to) {
            item.from = busyTime[i].from;
            busyTime.splice(i, 1);
            continue;
        }
        // Если второй пересекает первого справа
        if (item.to <= busyTime[i].to && item.to >= busyTime[i].from) {
            item.to = busyTime[i].to;
            busyTime.splice(i, 1);
            continue;
        }
        i++;
    }
}
