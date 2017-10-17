'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
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
    // console.info(schedule, duration, workingHours);

    let bankTimezone = getTimezone(workingHours);
    let notWorkingHours = getNotWorkingHours(workingHours, bankTimezone);
    schedule.bank = notWorkingHours;
    let parsedSchedule = getParsedSchedule(schedule, bankTimezone);
    let freeTime = findFreeTime(parsedSchedule, bankTimezone)[0];
    let delta = findFreeTime(parsedSchedule)[1];
    let timeForRobbery;
    for (let i = 0; i < delta.length; i += 1) {
        if (delta[i] >= duration) {
            timeForRobbery = freeTime[i];
            break;
        }
    }

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
            if (timeForRobbery === undefined) {
                return '';
            }
            let date = translateFromMinutes(timeForRobbery);
            let day = date.day;
            let hours = date.hours;
            let minutes = date.residueMinutes;

            return template.replace('%HH', modify(hours)).replace('%MM', modify(minutes))
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            for (let i = 0; i < freeTime.length; i += 1) {
                if (freeTime[i] + delta[i] < timeForRobbery + 30) {
                    continue;
                }
                let possibleRobberyTime = Math.max(timeForRobbery + 30, freeTime[i]);
                if (possibleRobberyTime + duration <= freeTime[i] + delta[i]) {
                    timeForRobbery = possibleRobberyTime;

                    return true;
                }
            }

            return false;
        }
    };
};

function getParsedSchedule(schedule, bankTimezone) {
    let parsedSchedule = [];
    Object.values(schedule).forEach(function (item) {
        item.forEach(function (elem) {
            let timeFromInMinutes = getMinutes(elem.from);
            let timeToInMinutes = getMinutes(elem.to);
            let timeFromInBankTimezone = translateTimezone(timeFromInMinutes, bankTimezone);
            let timeToInBankTimezone = translateTimezone(timeToInMinutes, bankTimezone);
            parsedSchedule.push({ minutes: timeFromInBankTimezone, step: 'from' });
            parsedSchedule.push({ minutes: timeToInBankTimezone, step: 'to' });
        });
    });

    return parsedSchedule;
}

function modify(number) {
    if (number < 10) {
        number = '0' + number;
    }

    return number;
}

function getTimezone(hours) {
    return Object.values(hours)[0].match(/\+[0-9]+/g)[0].substring(1);
}

function translateFromMinutes(minutes) {
    let days = ['ПН', 'ВТ', 'СР'];
    let hours = Math.floor(minutes / 60) % 24;
    let day = days[Math.floor(Math.floor(minutes / 60) / 24)];
    let residueMinutes = minutes % 60;
    if (day === undefined) {
        return '';
    }

    return { day, hours, residueMinutes };
}

function translateTimezone(time, bankTimezone) {
    let translatedTime = [];
    let robberTimezone = time.match(/\+[0-9]+/g)[0];
    if (robberTimezone !== bankTimezone) {
        let delta = bankTimezone - robberTimezone;
        translatedTime = Number(time.match(/^[0-9]+/g)[0]) + 60 * delta;
    }

    return translatedTime;
}

function getNotWorkingHours(workingHours, bankTimezone) {
    let whFrom = workingHours.from;
    let whTo = workingHours.to;
    let notWH = [];
    notWH.push({ from: 'ПН 00:00+' + bankTimezone, to: 'ПН ' + whFrom });
    notWH.push({ from: 'ПН ' + whTo, to: 'ПН 23:59+' + bankTimezone });
    notWH.push({ from: 'ВТ 00:00+' + bankTimezone, to: 'ВТ ' + whFrom });
    notWH.push({ from: 'ВТ ' + whTo, to: 'ВТ 23:59+' + bankTimezone });
    notWH.push({ from: 'СР 00:00+' + bankTimezone, to: 'СР ' + whFrom });
    notWH.push({ from: 'СР ' + whTo, to: 'СР 23:59+' + bankTimezone });

    return notWH;
}

function getMinutes(time) {
    let timezone = time.match(/\+[0-9]+/g)[0];
    let hoursInMinutes = Number(time.substring(3, 5) * 60);
    let minutes = Number(time.substring(6, 8));
    switch (time.substring(0, 2)) {
        case ('ПН'):
            minutes = hoursInMinutes + minutes + timezone;
            break;
        case ('ВТ'):
            minutes = hoursInMinutes + 24 * 60 + minutes + timezone;
            break;
        case ('СР'):
            minutes = hoursInMinutes + 48 * 60 + minutes + timezone;
            break;
        default:
            console.info('банк не работает');
    }

    return minutes;
}

function findFreeTime(parsedSchedule) {
    let freeTime = [];
    let delta = [];
    let sortedSchedule = parsedSchedule.sort((a, b) => Number(a.minutes) - Number(b.minutes));
    // delta.push(sortedSchedule[0].minutes);
    let currentFrom = 0;
    let currentTo = 0;
    let startMinutes = 0;
    let oldEnd = 0;
    sortedSchedule.forEach(function (item) {
        if (currentFrom === 0) {
            startMinutes = item.minutes;
        }
        if (item.step === 'from') {
            currentFrom += 1;
        } else {
            currentTo += 1;
        }
        if (currentFrom === currentTo) {
            currentFrom = 0;
            currentTo = 0;
            freeTime.push(oldEnd);
            delta.push(startMinutes - oldEnd);
            oldEnd = item.minutes;
        }
    });

    return [freeTime, delta];
}
