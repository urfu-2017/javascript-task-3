'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var validDays = days.slice(0, 3);
var invalidDays = days.slice(3);

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
    let freeTime = {};
    let bankTimeZone = workingHours.from.slice(5);
    let invalideTime = {};

    for (var _day of validDays) {
        invalideTime[_day] = [];
        scheduling(freeTime, _day, workingHours);
    }

    for (let name of Object.keys(schedule)) {
        invalideTime = fillInvalidTime(schedule, name, bankTimeZone, invalideTime);
    }

    freeTime = findingFreeTime(invalideTime, freeTime);

    timeOfRobbery = findTime(freeTime, duration, timeOfRobbery);

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
            if (timeOfRobbery === '') {
                return false;
            }
            let day = timeOfRobbery.split(' ')[0];
            let flag = true;
            for (let interval of freeTime[day]) {
                if (interval.from === timeOfRobbery) {
                    interval.from = addingHalfHour(interval.from);
                    flag = interval.from;
                }
            }
            if (flag === false) {
                return false;
            }
            let result = findTime(freeTime, duration, '');
            if (result.length > 0) {
                timeOfRobbery = result;
            }

            return result.length > 0;
        }
    };
};

function scheduling(freeTime, day, workingHours) {
    freeTime[day] = [{ from: day + ' ' + workingHours.from.slice(0, 5),
        to: day + ' ' + workingHours.to.slice(0, 5) }];
}

/**
 *прибавляет пол часа к времени
 */

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

/**
 * работа с исходным расписанием занятости 
 * приводим все времена к часовому поясу банка
 */

function fillInvalidTime(schedule, name, bankTimeZone, invalideTime) {
    let obj = Object.assign(invalideTime);
    for (let times of schedule[name]) {
        let begin = normalizeTime(times.from, bankTimeZone);
        if (invalidDays.includes(begin.split(' ')[0])) {
            begin = 'ПН 00:00';
        }
        let end = normalizeTime(times.to, bankTimeZone);
        if (invalidDays.includes(end.split(' ')[0])) {
            end = 'СР 23:59';
        }
        let intervals = [];
        if (begin.split(' ')[0] !== end.split(' ')[0]) {
            intervals = sepationToInterval(begin, end);
        } else {
            intervals = [{ from: begin, to: end }];
        }
        obj = createScheduleOfBusyness(intervals, obj);
    }

    return obj;
}

/**
 * создаем расписание занятости
 */

function createScheduleOfBusyness(intervals, invalideTime) {
    let obj = Object.assign(invalideTime);
    for (let interval of intervals) {
        let day = interval.from.split(' ')[0];
        if (obj[day].length === 0) {
            obj[day].push(interval);
            continue;
        }
        obj = createInvalideTime(interval, obj, day);
    }

    return obj;
}

/**
 * объединяем все времена , в которые грабители заняты
 */

function createInvalideTime(interval, invalideTime, day) {
    let obj = Object.assign(invalideTime);
    let flag = false;
    for (let element of obj[day]) {
        let result = unionOfTimes(element, interval);
        if (result !== false) {
            obj[day]
                .splice(obj[day]
                    .indexOf(element), 1, result);
            flag = true;
            break;
        }
    }
    if (!flag) {
        obj[day].push(interval);
    }

    return obj;
}

/**
 * находим время , в которое возможно ограбление
 */

function findingFreeTime(invalideTime, freeTime) {
    let obj = Object.assign({}, freeTime);
    for (let day of Object.keys(invalideTime)) {
        for (let i = 0; i < obj[day].length; i++) {
            i = correctingFreeTime(invalideTime, day, obj, i);
        }
    }

    return obj;
}

/**
 * по сути , продолжение findingFreeTime
 */

function correctingFreeTime(invalideTime, day, freeTime, i) {
    for (let wrongTime of invalideTime[day]) {
        let result = calculatingTimeDifference(freeTime[day][i], wrongTime);
        if (result === false) {
            continue;
        }
        freeTime[day].splice(i, 1);
        if (result !== true) {
            freeTime[day] = freeTime[day].concat(result);
        }

        i--;
        break;
    }

    return i;
}

/**
 * поиск времени ограбления
 */

function findTime(freeTime, duration, timeOfRobbery) {
    let find = false;
    for (let day of Object.keys(freeTime)) {
        for (let validTime of freeTime[day]) {
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

/**
 * сравнивание найденного промежутка и доступного времени на ограбление.
 */

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

/**
 * разделение времени на интервалы в рамках дней 
 */

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

/**
 * вычиление объеденения двух времен
 */

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

/**
 * продолжение unionOfTimes
 */

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

/**
 * вычисление разности двух времен
 */

function calculatingTimeDifference(firstTime, secondTime) {
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

/**
 * проверяет содержится ли время во временном интервале
 */

function checkIncluding(freeTime, timeInterval) {
    return compareTime(timeInterval.from, freeTime) < 0 &&
    compareTime(timeInterval.to, freeTime) > 0;
}

/**
 * рефакторинг времени после его изменения
 */

function normalizeTime(time, bankTimeZone) {
    let day = time.split(' ')[0];
    let pastDay = 0;
    let nextDay = 0;
    let hours = parseInt(time.slice(3, 5)) + (parseInt(bankTimeZone) - parseInt(time.slice(8)));
    if (hours > 23) {
        nextDay = Math.round(hours / 24);
        hours = hours - nextDay * 24;
    } else if (hours < 0) {
        pastDay = Math.abc(Math.round(hours / 24));
        hours = 24 + (hours + pastDay * 24);
    }
    time = hours + time.slice(5, 8);

    return refactoringTime(time, pastDay, nextDay, day);
}

/**
 * преобразование времени в правильный формат
 * по сути , продолжение normalizeTime
 */

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

/**
 * сравнивание дат
 */

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

/**
 * перевод часов и минут в минуты
 */

function translateToMinutes(from, to) {
    let hours = parseInt(to.split(' ')[1].split(':')[0]) -
    parseInt(from.split(' ')[1].split(':')[0]);
    let minutes = parseInt(to.split(' ')[1].split(':')[1]) -
    parseInt(from.split(' ')[1].split(':')[1]);

    return 60 * hours + minutes;
}
