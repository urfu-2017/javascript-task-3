'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

const WEEK = ['ПН', 'ВТ', 'СР'];

const DAY = 1440;
const HOUR = 60;
let bankInUTC;

/**
* Создает временную отметку
* @param {String} busyTime – время
* @param {String} type - тип отметки: либо 'from' - начало дела, либо 'to' - конец дела
* @param {String} label - имя занятого ганстера или 'bank'
* @returns {Object}
*/

function getTimePoint(busyTime, type, label) {
    return {
        type,
        label,
        value: getTimeValue(busyTime)
    };
}

/**
 * Конверирует время в чиловое значение минут, прошедших с начала недели
 * @param {String} time – Время в формате 'ПН 10:00+5'
 * @returns {Number}
 */
function getTimeValue(time) {
    let day = time.match(/^[В-Т]{2}/)[0];
    let hour = time.match(/\d{2}/g)[0];
    let minute = time.match(/\d{2}/g)[1];

    return [
        DAY * WEEK.indexOf(day),
        HOUR * Number(hour),
        Number(minute),
        HOUR * (bankInUTC - getUTC(time))
    ].reduce(function (a, b) {
        return a + b;
    });
}

/**
 * Возвращает время в часовом поясе банка
 * @param {Number} value – кол-во минут прошедших с начала недели
 * @returns {Object}
 */
function getTime(value) {
    let day = Math.floor(value / DAY);
    value = value % DAY;
    let hour = Math.floor(value / HOUR);
    let minute = value % HOUR;

    return {
        day: WEEK[day],
        hour: hour > 9 ? hour.toString() : '0' + hour,
        minute: minute > 9 ? minute.toString() : '0' + minute
    };

}

/**
 * Возвращает часовой пояс полученного времени
 * @param {String} time – Время события, например 'ПН 10:00+5'
 * @returns {Number}
 */
function getUTC(time) {
    let UTC = time.split('+')[1];

    return parseInt(UTC, 10);
}

/**
 * Создает массив временных отметок Банды
 * @param {Object} schedule – Расписание Банды
 * @param {String} workingHours – Время работы банка
 * @returns {Object[]}
 */
function getTimePoints(schedule, workingHours) {
    let timePoints = [];
    let dayStart = ['ПН 00:00', bankInUTC].join('+');
    let dayEnd = ['СР 23:59', bankInUTC].join('+');

    timePoints.push(
        getTimePoint(dayStart, 'from', 'Bank'),
        getTimePoint(dayEnd, 'to', 'Bank')
    );

    WEEK.forEach(function (day) {
        let open = [day, workingHours.from].join(' ');
        let close = [day, workingHours.to].join(' ');

        timePoints.push(
            getTimePoint(close, 'from', 'Bank'),
            getTimePoint(open, 'to', 'Bank')
        );
    });

    Object.keys(schedule).forEach(function (robber) {
        schedule[robber].forEach(function (busyTime) {
            timePoints.push(
                getTimePoint(busyTime.from, 'from', robber),
                getTimePoint(busyTime.to, 'to', robber)
            );
        });
    });

    return timePoints;
}

/**
 * Возвращает массив отметок времени в которые можно начать ограбление
 * @param {Object[]} timePoints - массив временных отметок
 * @param {Number} duration - время ограбления
 * @returns {Object[]}
 */
function getRobberyTimePoints(timePoints, duration) {
    let stack = [];
    let freeTimePoints = [];
    let robberyTimePoints = [];

    timePoints.sort(function (a, b) {
        return a.value - b.value;
    });

    timePoints.forEach(function (point) {
        switch (point.type) {
            case 'from':
                if (freeTimePoints.length % 2 !== 0) {
                    freeTimePoints.push(point);
                }
                stack.push(point);
                break;

            case 'to':
                stack = stack.filter(function (item) {
                    return point.label !== item.label;
                });

                if (stack.length === 0) {
                    freeTimePoints.push(point);
                }
                break;

            default:
                break;
        }
    });

    for (let i = 0; i < freeTimePoints.length - 1; i += 2) {
        if (freeTimePoints[i + 1].value - freeTimePoints[i].value >= duration) {
            robberyTimePoints.push(freeTimePoints[i], freeTimePoints[i + 1]);
        }
    }

    return robberyTimePoints;
}


exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let timePoints = []; // TimePoint.Keys: type, time, value, label
    let robberyTimePoints = [];
    bankInUTC = getUTC(workingHours.from);

    timePoints = getTimePoints(schedule, workingHours);
    robberyTimePoints = getRobberyTimePoints(timePoints, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyTimePoints.length);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTimePoints.length) {
                var time = getTime(robberyTimePoints[0].value);

                return template
                    .replace(/(%[D][D])/, time.day)
                    .replace(/(%[H][H])/, time.hour)
                    .replace(/(%[M][M])/, time.minute);
            }

            return '';
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
