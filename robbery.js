'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const TIME_REGEX = /^(\d{2}):(\d{2})\+(\d+)$/;
const BANK_ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration – Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    let robbersSchedule = Object.values(schedule)
        .reduce((summarySchedules, rubberSchedule) => summarySchedules.concat(rubberSchedule), [])
        .map((scheduleInterval) => {
            return {
                'from': extractDayTime(scheduleInterval.from).daytime,
                'to': extractDayTime(scheduleInterval.to).daytime
            };
        });

    let bankTimezone;
    let bankSchedule = BANK_ROBBERY_DAYS.map((day) => {
        let fromExtractedTime = extractDayTime(`${day} ${workingHours.from}`);
        let toExtractedTime = extractDayTime(`${day} ${workingHours.to}`);
        bankTimezone = fromExtractedTime.timezone;

        return {
            'from': fromExtractedTime.daytime,
            'to': toExtractedTime.daytime
        };
    });

    let robberyMoment = findRobberyMoment(0, duration, robbersSchedule, bankSchedule);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyMoment.found;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robberyMoment.found) {
                return '';
            }

            let timePieces = extractTimeComponents(robberyMoment.startTime, bankTimezone);

            return template.replace('%HH', timePieces.HH)
                .replace('%MM', timePieces.MM)
                .replace('%DD', timePieces.DD);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!robberyMoment.found) {
                return false;
            }

            const nextMoment = findRobberyMoment(
                robberyMoment.startTime + 30, duration,
                robbersSchedule, bankSchedule
            );

            if (nextMoment.found) {
                robberyMoment = nextMoment;
            }

            return nextMoment.found;
        }
    };
};

/**
 * Получение количества минут от начала недели без учёта часового пояса и временной зоны.
 * @param {String} strDayTime
 * @returns {{daytime: Number, timezone: Number}}
 */
function extractDayTime(strDayTime) {
    let [day, time] = strDayTime.split(' ');
    let dayMinutes = DAYS_OF_WEEK.indexOf(day) * 1440;
    let extractedTime = extractTime(time);

    return { 'daytime': dayMinutes + extractedTime.time, 'timezone': extractedTime.timezone };
}

/**
 * Извлечение количества минут прошедших от начала дня и временной зоны.
 * @param {String} strTime
 * @returns {{time: Number, timezone: Number}}
 */
function extractTime(strTime) {
    let parsedTime = TIME_REGEX.exec(strTime);
    let timezone = Number(parsedTime[3]);

    let hoursMinutes = (Number(parsedTime[1]) - timezone) * 60;
    let minutes = Number(parsedTime[2]);

    return { 'time': hoursMinutes + minutes, 'timezone': timezone };
}

/**
 * Получение компонентов времени по количеству минут и временной зоне.
 * @param {Number} totalMinutes
 * @param {Number} timezone
 * @returns {Object}
 */
function extractTimeComponents(totalMinutes, timezone) {
    let timezoneAwareTime = totalMinutes + timezone * 60;
    let days = Math.floor(timezoneAwareTime / 1440);
    let hours = Math.floor((timezoneAwareTime - days * 1440) / 60);
    let minutes = timezoneAwareTime - days * 1440 - hours * 60;

    return {
        'DD': DAYS_OF_WEEK[days],
        'HH': hours.toString().padStart(2, '0'),
        'MM': minutes.toString().padStart(2, '0'),
        'ZZ': timezone
    };
}


/**
 * Поиск подходящего для ограбления промежутка времени начиная с указанной стартовой точки.
 * @param {Number} startTime – Время в минутах с начала промежутка в котором производится поиск.
 * @param {Number} duration – Время необходимое для ограбления
 * @param {Object[]} robbersSchedule – Расписание Банды
 * @param {Number} robbersSchedule.from – Время в которое член команды может начать ограбление.
 * @param {Number} robbersSchedule.to – Время в которое член команды может закончить ограбление.
 * @param {Object[]} bankSchedule – Время работы банка
 * @param {Number} bankSchedule.from – Время в которое банк начинает работу в очередной день.
 * @param {Number} bankSchedule.to – Время в которое банк заканчивает работу в очередной день.
 * @returns {Object}
 */
function findRobberyMoment(startTime, duration, robbersSchedule, bankSchedule) {
    const endTime = BANK_ROBBERY_DAYS.length * 24 * 60;

    let checkRobbersTime = (current, { from, to }) =>
        (current < from && current + duration <= from) ||
        (current >= to && current + duration >= to);
    let checkBankTime = (current, { from, to }) => current >= from && current + duration <= to;

    for (; startTime < endTime; startTime++) {
        let canAllRobbersParticipate = robbersSchedule.filter(
            checkRobbersTime.bind(null, startTime)
        ).length === robbersSchedule.length;
        let isBankWorks = bankSchedule.filter(checkBankTime.bind(null, startTime)).length >= 1;

        if (canAllRobbersParticipate && isBankWorks) {
            return {
                found: true,
                startTime: startTime
            };
        }
    }

    return {
        found: false,
        startTime: 0
    };
}
