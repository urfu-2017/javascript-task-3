'use strict';

const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const BANK_WORKING_DAYS = ['ПН', 'ВТ', 'СР'];

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
    console.info(schedule, duration, workingHours);

    const addDay = ({ from, to }, day) => ({ from: `${day} ${from}`, to: `${day} ${to}` });
    const parseToDateObj = ({ from, to }) => ({ from: parseDateStr(from), to: parseDateStr(to) });
    const applyTimeZoneToDateObj = (timeZone, { from, to }) => ({
        from: convertToTimeZone(from, timeZone),
        to: convertToTimeZone(to, timeZone)
    });

    const bankWorkTime = BANK_WORKING_DAYS
        .map(addDay.bind(null, workingHours))
        .map(parseToDateObj);

    const parsedSchedule = Object.keys(schedule)
        .reduce((flatSchedule, name) => flatSchedule.concat(schedule[name]), [])
        .map(parseToDateObj)
        .map(applyTimeZoneToDateObj.bind(null, bankWorkTime[0].from.timeZone));

    let result = findFrom(0, parsedSchedule, duration, bankWorkTime);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return result.success;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!result.success) {
                return '';
            }

            const timeInMinutes = result.time % (24 * 60);
            const minutes = timeInMinutes % 60;
            const day = parseInt((result.time - timeInMinutes) / (24 * 60));
            const hours = parseInt((timeInMinutes - minutes) / 60);

            const minutesStr = minutes < 10 ? '0' + minutes.toString() : minutes;
            const hoursStr = hours < 10 ? '0' + hours.toString() : hours;

            return template
                .replace('%HH', hoursStr)
                .replace('%MM', minutesStr)
                .replace('%DD', WEEK_DAYS[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!result.success) {
                return false;
            }

            const newResult = findFrom(result.time + 30, parsedSchedule, duration, bankWorkTime);
            if (newResult.success) {
                result = newResult;
            }

            return newResult.success;
        }
    };
};

/**
 * Находим возможный промежуток времени для ограбления, начиная с указанного времени
 * @param {Number} fromTime - время в минутах с которого начинаем поиск
 * @param {Array} schedule - промежутки занятности
 * @param {Number} duration - необходимое для ограбления время
 * @param {Array} workingHours - промежутки рабоы банка
 * @returns {{success: boolean, time: number}}
 */
function findFrom(fromTime, schedule, duration, workingHours) {
    const maxTime = 24 * 60 * BANK_WORKING_DAYS.length;

    for (let currentTime = fromTime; currentTime < maxTime; currentTime++) {
        const isFreeTime = schedule.filter(({ from, to }) =>
            (currentTime < from.time && currentTime + duration <= from.time) ||
            (currentTime >= to.time && currentTime + duration >= to.time)
        ).length === schedule.length;

        const isWorkTime = workingHours.filter(
            ({ from, to }) => currentTime >= from.time && currentTime + duration <= to.time
        ).length >= 1;

        if (isFreeTime && isWorkTime) {
            return {
                success: true,
                time: currentTime
            };
        }
    }

    return {
        success: false,
        time: 0
    };
}

/**
 * @param {Number} time - время в минутах
 * @param {Number} timeZone - необходимый часовой пояс
 * @returns {{time: *, timeZone: *}}
 */
function convertToTimeZone(time, timeZone) {
    const timeDiff = timeZone - time.timeZone;

    return {
        time: time.time + 60 * timeDiff,
        timeZone: timeZone
    };
}

/**
 * Получам объект содержащий информацию о дате
 * @param {String} dateStr - строка содержащая время в формате "XX YY:ZZ+N". Например "ПТ 13:30+4".
 * @returns {{time: *, timeZone: Number}}
 * time - время в минутах
 * timeZone - часовой пояс
 */
function parseDateStr(dateStr) {
    const dateArray = dateStr.split(' ');
    const fullTime = dateArray[1];
    const [timeStr, timeZone] = fullTime.split('+');
    const [hours, minutes] = timeStr.split(':').map(x => parseInt(x));
    const dayIndex = WEEK_DAYS.indexOf(dateArray[0]);

    return {
        time: hours * 60 + minutes + 24 * 60 * dayIndex,
        timeZone: parseInt(timeZone)
    };
}
