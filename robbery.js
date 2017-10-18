'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var invalidDays = 'ЧТПТСБВС';

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {

    let timeOfRobbery = '';
    let time = {};
    let timeZone = workingHours.from.slice(5);
    let invalideTime = {};

    invalideTime['ПН'] = [];
    invalideTime['ВТ'] = [];
    invalideTime['СР'] = [];

    for (let name of Object.keys(schedule)) {
        workWithShedule(schedule, name, timeZone, invalideTime);
    }

    time['ПН'] = [{ from: 'ПН ' + workingHours.from.slice(0, 5),
        to: 'ПН ' + workingHours.to.slice(0, 5) }];
    time['ВТ'] = [{ from: 'ВТ ' + workingHours.from.slice(0, 5),
        to: 'ВТ ' + workingHours.to.slice(0, 5) }];
    time['СР'] = [{ from: 'СР ' + workingHours.from.slice(0, 5),
        to: 'СР ' + workingHours.to.slice(0, 5) }];

    findingFreeTime(invalideTime, time);

    timeOfRobbery = findTime(time, duration, timeOfRobbery);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return timeOfRobbery.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (timeOfRobbery === '') {
                return '';
            }

            return template.replace('%HH', timeOfRobbery.split(' ')[1].split(':')[0])
                .replace('%MM', timeOfRobbery.split(' ')[1].split(':')[1])
                .replace('%DD', timeOfRobbery.split(' ')[0]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let day = timeOfRobbery.split(' ')[0];
            let flag = true;
            for (let interval of time[day]) {
                if (interval.from === timeOfRobbery) {
                    interval.from = addingHalfHour(interval.from);
                    flag = interval.from;
                }
            }
            if (flag === false) {
                return false;
            }
            let result = findTime(time, duration, '');
            if (result.length > 0) {
                timeOfRobbery = result;
            }

            return result.length > 0;
        }
    };
};

function addingHalfHour(time) {
    let day = time.split(' ')[0];
    let hours = parseInt(time.split(' ')[1].split(':')[0]);
    let minutes = parseInt(time.split(' ')[1].split(':')[1]);
    minutes += 30;
    if (minutes > 59) {
        minutes = minutes - 60;
        hours += 1;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (hours > 23) {
        hours = '0' + (hours - 24);
        day = days[days.indexOf(day) + 1];
        if (invalidDays.indexOf(day) !== -1) {
            return false;
        }
    }

    return day + ' ' + hours + ':' + minutes;
}

function workWithShedule(schedule, name, timeZone, invalideTime) {
    for (let times of schedule[name]) {
        if (invalidDays.indexOf(times.from.split(' ')[0]) !== -1) {
            times.from = 'ПН 00:00';
        }
        if (invalidDays.indexOf(times.to.split(' ')[0]) !== -1) {
            times.to = 'СР 23:59';
        }
        let begin = normalizeTime(times.from, timeZone);
        let beginDay = begin.split(' ')[0];
        let end = normalizeTime(times.to, timeZone);
        let endDay = end.split(' ')[0];
        let intervals = [];
        if (beginDay !== endDay) {
            intervals = sepationToInterval(begin, end);
        } else {
            intervals = [{ from: begin, to: end }];
        }
        createScheduleOfEmployment(intervals, invalideTime);
    }
}

function createScheduleOfEmployment(intervals, invalideTime) {
    for (let interval of intervals) {
        let day = interval.from.split(' ')[0];
        if (invalideTime[day].length === 0) {
            invalideTime[day].push(interval);
            continue;
        }
        createInvalideTime(interval, invalideTime, day);
    }
}

function createInvalideTime(interval, invalideTime, day) {
    let flag = false;
    for (let element of invalideTime[day]) {
        let result = unionOfTimes(element, interval);
        if (result !== false) {
            invalideTime[day]
                .splice(invalideTime[day]
                    .indexOf(element), 1, result);
            flag = true;
            break;
        }
    }
    if (!flag) {
        invalideTime[day].push(interval);
    }
}

function findingFreeTime(invalideTime, time) {
    for (let day of Object.keys(invalideTime)) {
        for (let i = 0; i < time[day].length; i++) {
            i = correctingOfTime(invalideTime, day, time, i);
        }
    }
}

function correctingOfTime(invalideTime, day, time, i) {
    for (let wrongTime of invalideTime[day]) {
        let result = differenceTimes(time[day][i], wrongTime);
        if (result === true) {
            time[day].splice(i, 1);
            i--;
            break;
        } else if (result === false) {
            continue;
        } else {
            time[day].splice(i, 1);
            time[day] = time[day].concat(result);
            i--;
            break;
        }
    }

    return i;
}

function findTime(time, duration, timeOfRobbery) {
    let find = false;
    for (let day of Object.keys(time)) {
        for (let validTime of time[day]) {
            let result = comprasionMinutes(validTime, duration, timeOfRobbery, find);
            timeOfRobbery = result[0];
            find = result[1];
        }
        if (find) {
            break;
        }
    }

    return timeOfRobbery;
}

function comprasionMinutes(validTime, duration, timeOfRobbery, flag) {
    let minutes = translateToMinutes(validTime.from, validTime.to);
    if (minutes >= duration) {
        if (timeOfRobbery === '' || compareTime(timeOfRobbery, validTime.from) === 1) {
            timeOfRobbery = validTime.from;

            return [timeOfRobbery, true];
        }
    }

    return [timeOfRobbery, flag];
}

function sepationToInterval(firstTime, secondTime) {
    let index = days.indexOf(firstTime.split(' ')[0]) + 1;
    let array = [];
    while (index !== days.indexOf(secondTime.split(' ')[0])) {
        array.push({ from: days[index] + ' 00:00', to: days[index] + ' 23:59' });
        index ++;
        if (index === 7) {
            index = 0;
        }
    }
    array.push({ from: firstTime, to: firstTime.split(' ')[0] + ' 23:59' });
    array.push({ from: secondTime.split(' ')[0] + ' 00:00', to: secondTime });

    return array;
}

function unionOfTimes(firstTime, secondTime) {
    if (checkIncluding(secondTime.from, firstTime) &&
    checkIncluding(secondTime.to, firstTime)) {
        return firstTime;
    } else if (checkIncluding(secondTime.from, firstTime) &&
    !checkIncluding(secondTime.to, firstTime)) {
        firstTime.to = secondTime.to;

        return firstTime;
    } else if (!checkIncluding(secondTime.from, firstTime) &&
    checkIncluding(secondTime.to, firstTime)) {
        firstTime.from = secondTime.from;

        return firstTime;
    }

    return unionOfTimesPt2(firstTime, secondTime);
}

function unionOfTimesPt2(firstTime, secondTime) {
    if (checkIncluding(firstTime.from, secondTime) &&
    checkIncluding(firstTime.to, secondTime)) {
        return secondTime;
    } else if (checkIncluding(firstTime.from, secondTime) &&
    !checkIncluding(firstTime.to, secondTime)) {
        secondTime.to = firstTime.to;

        return secondTime;
    } else if (!checkIncluding(firstTime.from, secondTime) &&
    checkIncluding(firstTime.to, secondTime)) {
        secondTime.from = firstTime.from;

        return secondTime;
    }

    return false;
}

function differenceTimes(firstTime, secondTime) {
    if (checkIncluding(secondTime.from, firstTime) &&
    !checkIncluding(secondTime.to, firstTime)) {
        firstTime.to = secondTime.from;

        return [firstTime];
    } else if (!checkIncluding(secondTime.from, firstTime) &&
    checkIncluding(secondTime.to, firstTime)) {
        firstTime.from = secondTime.to;

        return [firstTime];
    } else if (checkIncluding(firstTime.from, secondTime) &&
    checkIncluding(firstTime.to, secondTime)) {
        return true;
    } else if (!checkIncluding(firstTime.to, secondTime) &&
    !checkIncluding(firstTime.from, secondTime) &&
    !checkIncluding(secondTime.to, firstTime) &&
    !checkIncluding(secondTime.from, firstTime)) {
        return false;
    } else if (checkIncluding(secondTime.from, firstTime) &&
    checkIncluding(secondTime.to, firstTime)) {
        return [
            { from: firstTime.from, to: secondTime.from },
            { from: secondTime.to, to: firstTime.to }
        ];
    }
}

function checkIncluding(time, timeInterval) {
    return compareTime(timeInterval.from, time) < 0 && compareTime(timeInterval.to, time) > 0;
}

function normalizeTime(time, timeZone) {
    let day = time.split(' ')[0];
    let pastDay = 0;
    let nextDay = 0;
    let Hours = parseInt(time.slice(3, 5)) + (parseInt(timeZone) - parseInt(time.slice(8)));
    if (Hours > 23) {
        nextDay = Math.round(Hours / 24);
        Hours = Hours - nextDay * 24;
    } else if (Hours < 0) {
        pastDay = Math.abc(Math.round(Hours / 24));
        Hours = 24 + (Hours + pastDay * 24);
    }
    time = Hours + time.slice(5, 8);

    return refactoringTime(time, pastDay, nextDay, day);
}

function refactoringTime(time, pastDay, nextDay, day) {
    if (time.split(':')[0].length < 2) {
        time = '0' + time;
    }
    if (pastDay === nextDay === 0) {
        time = day + ' ' + time;
    } else if (pastDay !== 0) {
        let index = days.indexOf(day);
        index -= pastDay;
        while (index < 0) {
            index += 7;
        }
        time = days[index] + ' ' + time;
    } else {
        let index = days.indexOf(day);
        index += nextDay;
        while (index > 6) {
            index -= 7;
        }
        time = days[index] + ' ' + time;
    }

    return time;
}

function compareTime(firstTime, secondTime) {
    let firstDay = firstTime.split(' ')[0];
    let secondDay = secondTime.split(' ')[0];
    let firstHours = firstTime.split(' ')[1].split(':')[0];
    let secondHours = secondTime.split(' ')[1].split(':')[0];
    let firstMinutes = firstTime.split(' ')[1].split(':')[1].slice(0, 2);
    let secondMinutes = secondTime.split(' ')[1].split(':')[1].slice(0, 2);
    if (firstTime === secondTime) {
        return 0;
    } else if (days.indexOf(firstDay) < days.indexOf(secondDay)) {
        return 1;
    } else if (firstDay === secondDay && (firstHours > secondHours)) {
        return 1;
    } else if ((firstDay === secondDay) && (firstHours === secondHours) &&
    (firstMinutes > secondMinutes)) {
        return 1;
    }

    return -1;
}

function translateToMinutes(from, to) {
    let hours = parseInt(to.split(' ')[1].split(':')[0]) -
    parseInt(from.split(' ')[1].split(':')[0]);
    let minutes = parseInt(to.split(' ')[1].split(':')[1]) -
    parseInt(from.split(' ')[1].split(':')[1]);

    return 60 * hours + minutes;
}
