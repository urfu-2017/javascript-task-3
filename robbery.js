'use strict';
/* eslint-disable complexity */
/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */

function isTimeWork(time, timeBankFrom, timeBankTo) {
    if (time < timeBankTo && time >= timeBankFrom) {
        return true;
    }

    return false;
}
function switchDay(day) {
    switch (day) {
        case 'ВТ':
            return 1440;
        case 'СР':
            return 2880;
        default:
            return 0;

    }

}
function calcTime(timeBad, deltaGMT) {
    var dayWeek = {
        from: '',
        to: ''
    };
    var personObject = {
        from: 0,
        to: 0
    };
    dayWeek.from = timeBad.from.split(' ')[0];
    timeBad.from = (timeBad.from.split(' ')[1]).split('+')[0].split(':');
    dayWeek.to = timeBad.to.split(' ')[0];
    timeBad.to = (timeBad.to.split(' ')[1]).split('+')[0].split(':');
    personObject.from = Number(timeBad.from[0]) * 60 + Number(timeBad.from[1]) + 60 * deltaGMT;
    personObject.to = Number(timeBad.to[0]) * 60 + Number(timeBad.to[1]) + 60 * deltaGMT;

    personObject.from = personObject.from + switchDay(dayWeek.from);
    personObject.to = personObject.to + switchDay(dayWeek.to);

    return personObject;

}

function parsString(person, gmtBank) {
    var s = 0;
    var personObject = {
        from: [],
        to: []
    };
    var gmtPerson = Number(person[1].from.split('+')[1]);
    var deltaGMT = gmtBank - gmtPerson;
    for (var i = 0; i < person.length; i++) {
        var timeBad = person[i];
        timeBad = calcTime(timeBad, deltaGMT);
        personObject.from[s] = timeBad.from;
        personObject.to[s] = timeBad.to;
        s = s + 1;
    }

    return personObject;
}

function timelineBank(workingHours) {
    let timeBankFrom = (workingHours.from.split('+')[0]);
    timeBankFrom = Number(timeBankFrom.split(':')[0]) * 60 + Number(timeBankFrom.split(':')[1]);
    let timeBankTo = (workingHours.to.split('+')[0]);
    timeBankTo = Number(timeBankTo.split(':')[0]) * 60 + Number(timeBankTo.split(':')[1]);
    let timeline = [];

    for (var i = 0; i < 3; i++) {
        timeline[i] = [];
        for (var j = 0; j < 1440; j++) {
            timeline[i][j] = isTimeWork(j, timeBankFrom, timeBankTo);
        }
    }

    return timeline;

}

function changeTimeline(start, end, timeline) {
    for (var j = start; j < end; j++) {
        timeline[Math.ceil(j / 1440) - 1][j % 1440] = false;
    }

    return timeline;
}


function calculating(timeline, badTime) {
    for (var i = 0; i < badTime.from.length; i++) {
        if (badTime.from[i] < 0 && badTime.to[i] < 0) {
            continue;
        } else if (badTime.to[i] > 4320 && badTime.from[i] > 4320) {
            continue;
        } else if (badTime.to[i] > 4320 && badTime.from[i] < 0) {
            timeline = changeTimeline(0, 4320);
        } else if (badTime.from[i] < 0) {
            timeline = changeTimeline(0, badTime.to[i], timeline);
        } else if (badTime.to[i] > 4320) {
            timeline = changeTimeline(badTime.from[i], 4320);
        } else {
            timeline = changeTimeline(badTime.from[i], badTime.to[i], timeline);
        }
    }

    return timeline;
}

function findTimeInDay(day, duration) {
    let flag = 0;
    let score = -1;
    for (var j = 0; j < 1440; j++) {
        if (flag === 0 && day[j] === true) {
            flag = 1;
            score = duration - 1;
        } else if (flag === 1 && day[j] === true && score !== 0) {
            score = score - 1;
        } else if (flag === 1 && score === 0) {

            return (j - duration);
        } else if (flag === 1 && day[j] === false && score === 0) {

            return (j - duration);
        } else if (flag === 1 && day[j] === false) {
            flag = 0;
            score = -1;
        }
    }
    if (score !== 0) {
        return false;
    }

    return (1440 - duration);
}

function findTime(timeline, duration) {
    let result;
    for (var i = 0; i < 3; i++) {
        result = findTimeInDay(timeline[i], duration);
        if (result !== false) {

            return [i, result];
        }
    }

    return false;
}

function createString(str, day, hour, minute) {
    if (hour.length < 2) {
        hour = '0' + hour;
    }
    if (minute.length < 2) {
        minute = '0' + minute;
    }
    switch (str[1].substr(0, 2)) {
        case ('DD'):
            str[1] = day + str[1].substr(2);
            break;
        case ('HH'):
            str[1] = hour + str[1].substr(2);
            break;
        default:
            str[1] = minute + str[1].substr(2);
            break;
    }
    switch (str[2].substr(0, 2)) {
        case ('DD'):
            str[2] = day + str[2].substr(2);
            break;
        case ('HH'):
            str[2] = hour + str[2].substr(2);
            break;
        default:
            str[2] = minute + str[2].substr(2);
            break;
    }
    switch (str[3].substr(0, 2)) {
        case ('DD'):
            str[3] = day + str[3].substr(2);
            break;
        case ('HH'):
            str[3] = hour + str[3].substr(2);
            break;
        default:
            str[3] = minute + str[3].substr(2);
            break;
    }

    return (str[0] + str[1] + str[2] + str[3]);
}

function laterTimeline(timeline, time) {
    for (var i = 0; i < 30 && (time[1] + i) < 1440; i++) {
        timeline[time[0]][time[1] + i] = false;
    }

    return timeline;
}

function createMoment(timeline, duration, timeOld) {
    let moment = findTime(timeline, duration);
    if (moment === false) {
        moment = {
            existsMoment: false,
            timeline: timeline,
            time: timeOld
        };
    } else {
        moment = {
            existsMoment: true,
            timeline: timeline,
            time: moment
        };
    }

    return moment;
}

exports.isStar = true;

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
    let gmt = Number(workingHours.from.split('+')[1]);
    let badTime = parsString(schedule.Danny, gmt);

    let rustyBadTime = parsString(schedule.Rusty, gmt);
    badTime.to = badTime.to.concat(rustyBadTime.to);
    badTime.from = badTime.from.concat(rustyBadTime.from);
    let linusBadTime = parsString(schedule.Linus, gmt);
    badTime.from = badTime.from.concat(linusBadTime.from);
    badTime.to = badTime.to.concat(linusBadTime.to);

    let timeline = timelineBank(workingHours);
    timeline = calculating(timeline, badTime);
    let moment = { time: [] };
    moment = createMoment(timeline, duration, moment.time);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return moment.existsMoment;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let str = template.split('%');
            let date = moment.time;
            if (moment.existsMoment === false && moment.time.length === 0) {

                return '';
            }
            let day = '';
            let hour = 0;
            let minute;
            switch (date[0]) {
                case 0:
                    day = 'ПН';
                    break;
                case 1:
                    day = 'ВТ';
                    break;
                default:
                    day = 'СР';
            }
            if (date[1] % 60 > 0) {
                hour = String(Math.ceil(date[1] / 60) - 1);
            } else {
                hour = String(Math.ceil(date[1] / 60));
            }
            minute = String(date[1] % 60);
            str = createString(str, day, hour, minute);
            console.info(str);

            return str;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            moment.timeline = laterTimeline(moment.timeline, moment.time);
            moment = createMoment(moment.timeline, duration, moment.time);
            console.info(moment.existsMoment);

            return moment.existsMoment;
        }
    };
};

