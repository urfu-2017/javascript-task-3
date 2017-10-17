'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var daysOfWeeksToHours = {
    'ПН': 0,
    'ВТ': 24,
    'СР': 24*2
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let [bankHoursFrom, bankMinutesFrom, bankTimezone] = workingHours.from.split(/:|\+/).map(x=> Number(x));
    let [bankHoursTo, bankMinutesTo] = workingHours.from.split(/:|\+/).map(x=> Number(x));
    
    let danny = schedule.Danny;
    let rusty = schedule.Rusty;
    let linus = schedule.Linus;

    let s3 = linus
    .map(parseScheduleEntry)
    .map(x => getTimeInBankTimezone(x, bankTimezone));;

    let s1 = danny
        .map(parseScheduleEntry)
        .map(x => getTimeInBankTimezone(x, bankTimezone));
    let s2 = rusty
        .map(parseScheduleEntry)
        .map(x => getTimeInBankTimezone(x, bankTimezone));


    let rez = s1.concat(s2).concat(s3);

    let rs = rez.sort((a,b) => a.totalMinutesFrom > b.totalMinutesFrom);
    
    let newRs = [];
    var currentTimePeriod = rs[0];
    var currentStart = currentTimePeriod.totalMinutesFrom;
    var currentFinish = currentTimePeriod.totalMinutesTo;
    for (var i = 1; i < rs.length; i++) {
        var element = rs[i];
        if (currentFinish > element.totalMinutesTo) {
            continue;
        }
        if (currentFinish >= element.totalMinutesFrom) {
            currentFinish = element.totalMinutesTo;
        }
        else {
            newRs.push({
                start: currentStart,
                finish: currentFinish
            })

            var currentStart = element.totalMinutesFrom;
            var currentFinish = element.totalMinutesTo;
        }
    }
    newRs.push({
        start: currentStart,
        finish: currentFinish
    })

    let ff = newRs.sort((a,b) => a.totalMinutesFrom > b.totalMinutesFrom);
    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
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
            return template;
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


function parseScheduleEntry(x) {
    let startDay = x.from.substring(0, 2);
    let [hoursFrom, minutesFrom, robberTimezone] = x.from.substring(2).split(/:|\+/)
        .map(y => Number(y));

    let endDay = x.to.substring(0, 2);
    let [hoursTo, minutesTo] = x.to.substring(2).split(/:|\+/)
        .map(y => Number(y));

    return {
        startDay,
        hoursFrom,
        minutesFrom,
        endDay,
        hoursTo,
        minutesTo,
        robberTimezone
    };
};

function getTimeInBankTimezone(x, bankTimezone) {
    let timezoneDiff = bankTimezone - x.robberTimezone;

    let totalHoursFrom = x.hoursFrom - timezoneDiff + daysOfWeeksToHours[x.startDay];
    let totalHoursTo = x.hoursTo - timezoneDiff + daysOfWeeksToHours[x.endDay];

    let totalMinutesFrom = totalHoursFrom * 60 + x.minutesFrom;
    let totalMinutesTo = totalHoursTo * 60 + x.minutesTo;

    return {
        totalMinutesFrom,
        totalMinutesTo
    }
}