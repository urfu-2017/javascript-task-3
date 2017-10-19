'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function forming(day, hours, minutes) {
    if (hours < 0) {
        day = WEEK[WEEK.indexOf(day) - 1];
        hours += 24;
    }
    if (hours > 23) {
        day = WEEK[WEEK.indexOf(day) + 1];
        hours -= 24;
    }
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + parseInt(minutes);
    }

    return day + ' ' + hours + ':' + minutes;
}

function timeSort(a, b) {
    a = a.from;
    b = b.from;

    return timeCompare(a, b);
}

function timeCompare(a, b) {
    var [dayA, timeA] = a.split(' ');
    var [dayB, timeB] = b.split(' ');
    if (WEEK.indexOf(dayA) < WEEK.indexOf(dayB)) {

        return -1;
    } else if (timeA < timeB && dayA === dayB) {

        return -1;
    }
    if (dayA === dayB && timeA === timeB) {

        return 0;
    }
    if (WEEK.indexOf(dayA) > WEEK.indexOf(dayB)) {

        return 1;
    } else if (timeA > timeB && dayA === dayB) {

        return 1;
    }

    return 1;
}

function toOneTimeZone(schedule, workingHours) {
    var oneTimeSchedule = [];
    var bankTimeZone = parseInt(workingHours.from.split('+')[1]);
    oneTimeSchedule = oneTimeSchedule.concat(schedule.Danny, schedule.Rusty, schedule.Linus);
    oneTimeSchedule = oneTimeSchedule.map(day => {
        var differenceTime = bankTimeZone - parseInt(day.from.split('+')[1]);
        var [busyFrom, timeFrom] = day.from.split(' ');
        var [busyTo, timeTo] = day.to.split(' ');
        timeFrom = timeFrom.split(':');
        timeTo = timeTo.split(':');
        timeTo[0] = parseInt(timeTo[0]) + differenceTime;
        timeFrom[0] = parseInt(timeFrom[0]) + differenceTime;
        busyFrom = forming(busyFrom, timeFrom[0], timeFrom[1].slice(0, 2));
        busyTo = forming(busyTo, timeTo[0], timeTo[1].slice(0, 2));

        return { from: busyFrom, to: busyTo };
    });

    return oneTimeSchedule.sort(timeSort);
}

function combineTime(schedule) {
    var busyTime = [];
    var currentFrom = schedule[0].from;
    var currentTo = schedule[0].to;
    for (var i = 1; i < schedule.length; i++) {
        if (timeCompare(currentTo, schedule[i].from) === -1 ||
            timeCompare(currentTo, schedule[i].to) === 1) {
            busyTime.push({ from: currentFrom, to: currentTo });
            currentFrom = schedule[i].from;
        }
        currentTo = schedule[i].to;
    }
    busyTime.push({ from: currentFrom, to: currentTo });

    return busyTime;
}

function splitDays(schedule) {
    var newSchedule = [];
    for (var i = 0; i < schedule.length; i++) {
        if (schedule[i].from.split(' ')[0] !== schedule[i].to.split(' ')[0]) {
            newSchedule.push({ from: schedule[i].from, 
                to: schedule[i].from.split(' ')[0] + ' 23:59' });
            schedule[i] = { from: schedule[i].to.split(' ')[0] + ' 00:00', to: schedule[i].to };
            i--;
        } else {
            newSchedule.push(schedule[i]);
        }
    }

    return newSchedule;
}

function timecount(from, to) {
    var [startHours, startMinutes] = from.split(' ')[1].split(':');
    var [finishHours, finishMinutes] = to.split(' ')[1].split(':');
    from = parseInt(startHours) * 60 + parseInt(startMinutes);
    to = parseInt(finishHours) * 60 + parseInt(finishMinutes);

    return to - from;
}

function add30Seconds(time) {
    var [hours, minutes] = time.split(' ')[1].split(':');
    var day = time.split(' ')[0];
    minutes = parseInt(minutes) + 30;
    if (minutes >= 60) {
        hours = parseInt(hours) + 1;
        minutes -= 60;
    }

    return forming(day, hours, minutes);
}

function bankCompare(bank, time) {
    bank = time.split(' ')[0] + ' ' + bank;

    return timeCompare(bank, time);
}

function findMoment(schedule, workingHours) {
    var avalibleTime = []
    var start = workingHours.from.split('+')[0];
    var finish = workingHours.to.split('+')[0];
    for (var i = 0; i < schedule.length; i++) {
        var day = schedule[i].from.split(' ')[0] + ' ';
        if (bankCompare(start, schedule[i].to) === 1 ||
            bankCompare(finish, schedule[i].from) === -1) {
                avalibleTime.push({ from: day + start, to: day + finish });
            }
        if (bankCompare(start, schedule[i].from) === -1 &&
            bankCompare(finish, schedule[i].to) === 1) {
                avalibleTime.push({ from: day + start , to: schedule[i].from });
                avalibleTime.push({ from: schedule[i].to , to: day + finish });
            }
        if (bankCompare(start, schedule[i].from) === -1 &&
            bankCompare(finish, schedule[i].to) === -1 &&
            bankCompare(finish, schedule[i].from) === 1) {
                avalibleTime.push({ from: schedule[i].from, to: day + finish });
            }
        if (bankCompare(start, schedule[i].from) === 1 &&
            bankCompare(finish, schedule[i].to) === 1) {
                avalibleTime.push({ from: schedule[i].to , to: day + finish });
            }
    }

    return concatTime(avalibleTime);
}

function concatTime(avalibleTime) {
    var timeToGo = [];
    var day = avalibleTime[0].from.split(' ')[0];
    for(var i = 1; i < avalibleTime.length; i++) {
        var currentDay = avalibleTime[i].from.split(' ')[0];
        if ()
    }
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
    var oneTimeSchedule = toOneTimeZone(schedule, workingHours);
    var appropriateTime = splitDays(combineTime(oneTimeSchedule), workingHours);
    console.info('--------------');
    console.info(appropriateTime);
    console.info('--------------');
    console.info(findMoment(appropriateTime, workingHours));
    var startTime = appropriateTime.find(moment => moment.time >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (startTime) {
                startTime = startTime.from;

                return true;
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
            if (startTime) {
                template = 'Метим на ' + startTime.split(' ')[0] + ', старт в ' +
                    startTime.split(' ')[1] + '!';
            }

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (startTime) {
                var newStartTime = add30Seconds(startTime);
                var index = appropriateTime.findIndex(moment =>
                    timeCompare(startTime, moment.to) === -1);
                var newAppropriateTime = appropriateTime.slice(index);
                newAppropriateTime[0] = { from: newStartTime, to: newAppropriateTime[0].to,
                    time: timecount(newStartTime, newAppropriateTime[0].to) };
                newStartTime = newAppropriateTime.find(moment => moment.time >= duration);
                if (newStartTime) {
                    startTime = newStartTime.from;

                    return true;
                }

                return false;
            }

            return false;
        }
    };
};
