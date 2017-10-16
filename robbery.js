'use strict';

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

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
    const parseAll = ({ from, to }) => ({ from: parseDate(from), to: parseDate(to) });
    const convertAll = (timeZone, { from, to }) => ({
        from: convertTimeZone(from, timeZone),
        to: convertTimeZone(to, timeZone)
    });

    const bankWorkTime = ['ПН', 'ВТ', 'СР']
        .map(addDay.bind(null, workingHours))
        .map(parseAll);

    const parsedSchedule = Object.keys(schedule)
        .reduce((array, name) => array.concat(schedule[name]), [])
        .map(parseAll)
        .map(convertAll.bind(null, bankWorkTime[0].from.timeZone));

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

            const minsStr = minutes < 10 ? '0' + minutes.toString() : minutes;
            const hoursStr = hours < 10 ? '0' + hours.toString() : hours;

            let formatedStr = template.replace('%HH', hoursStr);
            formatedStr = formatedStr.replace('%MM', minsStr);
            formatedStr = formatedStr.replace('%DD', weekDays[day]);

            return formatedStr;
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

function findFrom(fromTime, schedule, duration, workingHours) {
    let result = false;
    let time = 0;

    for (let i = fromTime; i < 24 * 60 * 3; i++) {
        const isFreeTime = schedule.filter(({ from, to }) =>
            (i < from.time && i + duration <= from.time) ||
            (i >= to.time && i + duration >= to.time)
        ).length === schedule.length;

        const isWorkTime = workingHours.filter(({ from, to }) =>
            i >= from.time && i + duration <= to.time
        ).length >= 1;

        if (isFreeTime && isWorkTime) {
            time = i;
            result = true;
            break;
        }
    }

    return {
        success: result,
        time: time
    };
}

function convertTimeZone(time, timeZone) {
    const timeDiff = timeZone - time.timeZone;

    return {
        time: time.time + 60 * timeDiff,
        timeZone: timeZone
    };
}

function parseDate(dateStr) {
    const dateArray = dateStr.split(' ');
    const fullTime = dateArray[1];
    const [timeStr, timeZone] = fullTime.split('+');
    const [hours, minutes] = timeStr.split(':').map(x => parseInt(x));
    const dayIndex = weekDays.indexOf(dateArray[0]);

    return {
        time: hours * 60 + minutes + 24 * 60 * dayIndex,
        timeZone: parseInt(timeZone)
    };
}
