'use strict';
/* eslint-disable complexity, max-statements, max-depth */
/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */

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
    let personObject = [];
    let gmtPerson = Number(person[1].from.split('+')[1]);
    let deltaGMT = gmtBank - gmtPerson;
    for (var i = 0; i < person.length; i++) {
        let timeBad = person[i];
        personObject.push(calcTime(timeBad, deltaGMT));
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
        timeline[i] = {
            from: timeBankFrom + 1440 * i,
            to: timeBankTo + 1440 * i
        };
    }

    return timeline;

}

function changeTimeline(moment, badTime) {
    if ((moment.from >= badTime.from) && (moment.to <= badTime.to)) {
        return {};
    } else if ((moment.from >= badTime.to) || (moment.to <= badTime.from)) {
        return moment;
    } else if ((moment.from >= badTime.from) && (moment.to > badTime.to)) {
        return {
            from: badTime.to,
            to: moment.to
        };
    } else if ((moment.from > badTime.from) && (moment.to <= badTime.to)) {
        return {
            from: moment.from,
            to: badTime.from
        };
    }

    return [{
        from: moment.from,
        to: badTime.from
    }, {
        from: badTime.to,
        to: moment.to
    }];
}

function filterDublication(array) {
    let newArray = [];
    for (let i = 0; i < array.length; i++) {
        let flag = 0;
        for (let j = i + 1; j < array.length; j++) {
            if ((array[i].from === array[j].from) && (array[i].from === array[j].from)) {
                flag = 1;
                break;
            }
        }
        if (flag === 0) {
            newArray.push(array[i]);
        }
    }

    return newArray;
}

function calculating(timeline, badTime) {
    for (let i = 0; i < badTime.length; i++) {
        let newTimeline = [];
        for (let j = 0; j < timeline.length; j++) {
            newTimeline = newTimeline.concat(changeTimeline(timeline[j], badTime[i]));
        }
        // timeline = newTimeline.filter(function (obj) {
        //     return (Object.keys(obj).length !== 0);
        // });
        timeline = newTimeline.filter((obj) => Object.keys(obj) !== 0);

    }

    return timeline.sort(function (a, b) {
        return (a.from - b.from);
    });
}

function findTime(timeline, duration) {
    for (var i = 0; i < timeline.length; i++) {
        if ((timeline[i].to - timeline[i].from) >= duration) {
            let day;
            if (timeline[i].from % 1440 > 0) {
                day = Math.ceil(timeline[i].from / 1440) - 1;
            } else {
                day = Math.ceil(timeline[i].from / 1400);
            }
            let minute = timeline[i].from - 1440 * day;

            return [day, minute];
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
    let from = time[0] * 1440 + time[1];
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].from === from) {
            if ((timeline.to - timeline.from) <= 30) {
                timeline.splice(i, 1);
                break;
            }
            timeline[i].from = timeline[i].from + 30;
            break;
        }
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

function filterSchedule(arrayBadTime) {
    let result = arrayBadTime;
    result.slice(1);

    for (let i = 0; i < arrayBadTime.length; i++) {
        result = concatSchedule(arrayBadTime[i], result);
    }

    return filterDublication(result);
}

function concatSchedule(time, badTime) {
    let result = [];
    for (var i = 0; i < badTime.length; i++) {
        if ((time.from <= badTime[i].from) && (time.to >= badTime[i].to)) {
            result.push(time);
            continue;
        } else if ((badTime[i].to < time.from) || (time.to < badTime[i].from)) {
            result.push(badTime[i]);
            continue;
        } else {
            result.push({
                from: Math.min(time.from, badTime[i].from),
                to: Math.max(time.to, badTime[i].to)
            });
            continue;
        }
    }

    return result;
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

    badTime = badTime.concat(parsString(schedule.Rusty, gmt));
    badTime = badTime.concat(parsString(schedule.Linus, gmt));

    let timeline = timelineBank(workingHours);
    badTime = filterSchedule(badTime);
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

            return moment.existsMoment;
        }
    };
};

