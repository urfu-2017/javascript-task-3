'use strict';
const DAYS = ['ПН', 'ВТ', 'СР'];

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

    let bankTimezone = parseDate(workingHours.from).timezone;
    let notWorkingHoursOfBank = getNotWorkingHours(workingHours, bankTimezone);
    let sheduleWithBank = Object.assign({}, schedule);
    sheduleWithBank.bank = notWorkingHoursOfBank;
    let parsedSchedule = getParsedSchedule(sheduleWithBank, bankTimezone);
    let interval = getIntervalOfFreeTime(parsedSchedule);
    let timeForRobbery;

    for (let i = 0; i < interval.size.length; i += 1) {
        if (interval.size[i] >= duration) {
            timeForRobbery = interval.leftBorder[i];
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
            if (!this.exists()) {
                return '';
            }
            let date = translateFromMinutes(timeForRobbery);

            return template.replace('%HH', addLeadingZero(date.hours))
                .replace('%MM', addLeadingZero(date.remainingMinutes))
                .replace('%DD', date.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            for (let i = 0; i < interval.leftBorder.length; i += 1) {
                if (interval.leftBorder[i] + interval.size[i] < timeForRobbery + 30) {
                    continue;
                }
                let possibleRobberyTime = Math.max(timeForRobbery + 30, interval.leftBorder[i]);
                if (possibleRobberyTime + duration <= interval.leftBorder[i] + interval.size[i]) {
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
    Object.values(schedule).forEach(item => {
        item.forEach(elem => {
            let parsedFromDate = parseDate(elem.from);
            let parsedToDate = parseDate(elem.to);
            let timeFromInMinutes = timeToMinutes(parsedFromDate, bankTimezone);
            let timeToInMinutes = timeToMinutes(parsedToDate, bankTimezone);
            parsedSchedule.push({ minutes: timeFromInMinutes, step: 'from' });
            parsedSchedule.push({ minutes: timeToInMinutes, step: 'to' });
        });
    });

    return parsedSchedule;
}

function addLeadingZero(number) {
    if (number < 10) {
        number = '0' + number;
    }

    return String(number);
}

function translateFromMinutes(minutes) {
    let hours = Math.floor(minutes / 60) % 24;
    let day = DAYS[Math.floor(Math.floor(minutes / 60) / 24)];
    let remainingMinutes = minutes % 60;
    if (day === undefined) {
        return null;
    }

    return { day, hours, remainingMinutes };
}

function getNotWorkingHours(workingHours, bankTimezone) {
    let workingHoursFrom = workingHours.from;
    let workingHoursTo = workingHours.to;
    let notWorkingHours = [];
    DAYS.forEach(day => {
        notWorkingHours.push({ from: day + ' 00:00+' + bankTimezone,
            to: day + ' ' + workingHoursFrom });
        notWorkingHours.push({ from: day + ' ' + workingHoursTo,
            to: day + ' 23:59+' + bankTimezone });
    });

    return notWorkingHours;
}

function parseDate(date) {
    let [time, day] = date.split(' ').reverse();
    let [hoursAndMinutes, timezone] = time.split('+');
    let [hours, minutes] = hoursAndMinutes.split(':');

    return { day, hours, minutes, timezone };
}

function timeToMinutes(time, bankTimezone) {
    let day = time.day;
    let hours = Number(time.hours);
    let minutes = Number(time.minutes);
    let robberTimezone = Number(time.timezone);
    let translatedTime;
    translatedTime = hours * 60 + minutes + DAYS.indexOf(day) * 24 * 60;
    if (bankTimezone !== robberTimezone) {
        let deltaTimezone = bankTimezone - robberTimezone;
        translatedTime += deltaTimezone * 60;
    }

    return translatedTime;
}

function getIntervalOfFreeTime(parsedSchedule) {
    let LeftBorderOfInterval = [];
    let lengthOfInterval = [];
    let sortedSchedule = parsedSchedule.sort((a, b) => Number(a.minutes) - Number(b.minutes));
    let countFrom = 0;
    let countTo = 0;
    let currentStartMinutes;
    let previousEndMinutes;
    sortedSchedule.forEach(item => {
        if (countFrom === 0) {
            currentStartMinutes = item.minutes;
        }
        if (item.step === 'from') {
            countFrom += 1;
        } else {
            countTo += 1;
        }
        if (countFrom === countTo) {
            countFrom = 0;
            countTo = 0;
            LeftBorderOfInterval.push(previousEndMinutes);
            lengthOfInterval.push(currentStartMinutes - previousEndMinutes);
            previousEndMinutes = item.minutes;
        }
    });

    return { leftBorder: LeftBorderOfInterval, size: lengthOfInterval };
}
