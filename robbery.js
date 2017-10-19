'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
const dayMinute = 1440;
var y = 0;
function splitTime(time) {
    var t = String(time).split(/ |:|\+/);
    var info = {
        day: t[0],
        hour: Number(t[1]),
        minute: Number(t[2]),
        timeZone: Number(t[3])
    };

    return info;
}

function getBankTimeZone(workingHours) {
    var i = String(workingHours.from).split('+');
    y = i[1];

    return y;
}

function bankSplitTime(time) {
    var t = String(time).split(/ |:|\+/);
    var info = {
        hour: Number(t[0]),
        minute: Number(t[1])
    };

    return info;
}

function bankIntervals(workingHour) {
    var interval = [];
    var bank = bankSplitTime(workingHour);
    var weekDay = ['ПН', 'ВТ', 'СР'];
    for (let i = 0; i < weekDay.length; i++) {
        interval.push(bank.hour * 60 + bank.minute + i * dayMinute);
    }

    return interval;
}

function gangIntervals(schedule) {
    var a = Object.values(schedule);
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < a[i].length; j++) {
            ingoing(a[i][j].from, a[i][j].to);
        }
    }
}

function checkInterval(q, p, duration) {
    var apprepriateTime = [];
    for (let i = 0; i < q.length; i++) {
        if (p[i] - q[i] >= duration) {
            apprepriateTime.push(q[i]);
        }
    }

    return (apprepriateTime);
}
var q = [];
var p = [];
function ingoing(from, to) {

    from = busyMinutes(from);
    to = busyMinutes(to);
    for (let m = 0; m < q.length; m++) {
        if (to > q[m] && from < q[m] && to < p[m]) {
            q[m] = to;
        }
        if (to > p[m] && from > q[m] && from < p[m]) {
            p[m] = from;
        }
        if (to < p[m] && from > q[m]) {
            p.push(p[m]);
            q.push(to);
            p[m] = from;
        }
    }
}

function busyMinutes(time) {
    var busy = splitTime(time);
    var day = busy.day;
    var m = busy.hour * 60 + busy.minute + 60 * (y - busy.timeZone);
    if (day === 'ПН') {
        m += 0;
    }
    if (day === 'ВТ') {
        m += dayMinute;
    }
    if (day === 'СР') {
        m += 2 * dayMinute;
    }

    return m;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    q = bankIntervals(workingHours.from);
    p = bankIntervals(workingHours.to);
    getBankTimeZone(workingHours);
    bankIntervals(workingHours);
    gangIntervals(schedule);
    console.info(schedule, duration, workingHours);
    var check = checkInterval(q, p, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return (check.length !== 0);
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
            var day = Math.floor(check[0] / dayMinute);
            var days = ['ПН', 'ВТ', 'СР'];
            var weekDay = days[day];
            var hour = Math.floor((check[0] % dayMinute) / 60);
            var minute = (check[0] % dayMinute) % 60;

            return template
                .replace('%DD', weekDay)
                .replace('%HH', hour)
                .replace('%MM', minute);
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
