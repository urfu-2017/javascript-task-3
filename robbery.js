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

const MIN_IN_A_DAY = 1440;
function findIntersection(inter1, inter2) { // eslint-disable-line max-statements
    if (inter1 === [] || inter2 === []) {
        return [];
    }
    var t1 = inter1[0];
    var t2 = inter1[1];
    var t3 = inter2[0];
    var t4 = inter2[1];
    if (t1 >= t3 && t2 <= t4) {
        return [t1, t2];
    }
    if (t2 <= t3 || t1 >= t4) {
        return [];
    }

    if (t2 >= t4 && t1 <= t4 && t1 >= t3) {
        return [t1, t4];
    }
    if (t1 <= t3 && t2 <= t4 && t2 >= t3) {
        return [t3, t2];
    }
    if (t1 <= t3 && t2 >= t4) {
        return [t3, t4];
    }

    return [];
}
function searchIntersectionAndPush(period, arr) {
    if (period === []) {
        return;
    }
    var out = [];
    for (var i = 0; i < arr.length; i++) {
        var intersection = findIntersection(arr[i], period);
        if (intersection !== 'undefined') {
            out.push(intersection);
        }
    }

    return out;
}
function toMinsFromMonday(date) {
    var res = 0;
    var day = date.split(' ')[0];
    var time = date.split(' ')[1].substring(0, 5);
    var zone = date.split(' ')[1].substring(6);
    var hours = time.split(':')[0];
    var mins = time.split(':')[1];
    switch (day) {
        case 'ПН':
            res += 0;
            break;
        case 'ВТ':
            res += MIN_IN_A_DAY;
            break;
        case 'СР':
            res += MIN_IN_A_DAY * 2;
            break;
        default:
            break;
    }
    res += (parseInt(hours, 10) - parseInt(zone, 10)) * 60 + parseInt(mins, 10);

    return res;
}
function minsFromMonToDay(mins, bankZone) {
    mins += bankZone * 60;
    var d = Math.floor(mins / MIN_IN_A_DAY);
    var h = Math.floor((mins - (d * MIN_IN_A_DAY)) / 60);
    var m = mins - (d * MIN_IN_A_DAY) - (h * 60);
    h = h.toString();
    m = m.toString();
    if (m.length < 2) {
        m = '0' + m;
    }
    if (h.length < 2) {
        h = '0' + h;
    }
    switch (d) {
        case 0:
            return ['ПН', h, m];
        case 1:
            return ['ВТ', h, m];
        case 2:
            return ['СР', h, m];
        default:
            return;
    }
}
function getBank(bank) {
    var out = [];
    var zone = parseInt(bank.from.substring(6));
    var open = bank.from.substring(0, 5);
    var close = bank.to.substring(0, 5);
    var hOpens = open.split(':')[0];
    var mOpens = open.split(':')[1];
    var hClosed = close.split(':')[0];
    var mClosed = close.split(':')[1];
    var Op = (parseInt(hOpens, 10) - zone) * 60 + parseInt(mOpens, 10);
    var Clo = (parseInt(hClosed, 10) - zone) * 60 + parseInt(mClosed, 10);
    out.push([Op, Clo], [Op + MIN_IN_A_DAY, Clo + MIN_IN_A_DAY],
        [Op + MIN_IN_A_DAY * 2, Clo + MIN_IN_A_DAY * 2]);

    return out;
}
function getFreeTimeIntervals(name) {
    var day = [];
    for (var i = 0; i < name.length; i++) {
        var t1 = toMinsFromMonday(name[i].from);
        var t2 = toMinsFromMonday(name[i].to);
        day.push([t1, t2]);
    }
    var start = Number.NEGATIVE_INFINITY;
    var out = [];
    for (var i = 0; i < day.length; i++) {
        out.push([start, day[i][0]]);
        start = day[i][1];
    }
    if (parseInt(start, 10) < 4320) {
        out.push([start, 4320]);
    }

    return out;
}
function cleanUp(match) {
    var temp = [];
    var out = [];
    var t = match[0].length;
    for (var i = 0; i < match.length; i++) {
        for (var j = 0; j < t; j++) {
            temp.push(match[i][j]);
        }
    }
    for (var q = 0; q < temp.length; q++) {
        if (temp[q].length > 0) {
            out.push(temp[q]);
        }
    }

    return out;
}
function bankMatches(robb, bank) {
    var out = [];
    for (var i = 0; i < robb.length; i++) {
        for (var j = 0; j < bank.length; j++) {
            out.push(findIntersection(robb[i], bank[j]));
        }
    }

    return out;
}
function timesForRobbery(results) {
    var out = [];
    for (var i = 0; i < results.length; i++) {
        out.push(results[i][1] - results[i][0]);
    }

    return out;
}
function helper2(out, bank, duration) {

    var result = bankMatches(out, bank);
    var cleanRes = [];
    for (var x = 0; x < result.length; x++) {
        if (result[x].length > 0) {
            cleanRes.push(result[x]);
        }
    }
    var times = timesForRobbery(cleanRes);
    var time = -1;
    for (var a = 0; a < times.length; a++) {
        if (times[a] >= duration) {
            time = cleanRes[a];

            return time;
        }
    }

    return time;
}
function helper3(guys, bank, duration) {
    var danny = guys[0];
    var rusty = guys[1];
    var linus = guys[2];
    var out = [];
    for (var z = 0; z < danny.length; z++) {
        for (var j = 0; j < rusty.length; j++) {
            var res = findIntersection(danny[z], rusty[j]);
            out.push(searchIntersectionAndPush(res, linus));
        }
    }
    out = cleanUp(out);
    var time = helper2(out, bank, duration);

    return time;
}
function getRightTime(schedule, duration, workingHours) {
    var danny = [];
    var rusty = [];
    var linus = [];
    var bank = [];
    bank = getBank(workingHours);
    danny = getFreeTimeIntervals(schedule.Danny);
    rusty = getFreeTimeIntervals(schedule.Rusty);
    linus = getFreeTimeIntervals(schedule.Linus);
    var guys = [danny, rusty, linus];
    var time = helper3(guys, bank, duration);

    return time;
}
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            var rTime = getRightTime(schedule, duration, workingHours);

            return rTime !== -1;
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
            var time = getRightTime(schedule, duration, workingHours);
            var zone = parseInt(workingHours.from.substring(6), 10);
            var parsedStart = minsFromMonToDay(time[0], zone);
            var d = parsedStart[0];
            var h = parsedStart[1];
            var m = parsedStart[2];
            template = template.replace('%DD', d);
            template = template.replace('%HH', h);
            template = template.replace('%MM', m);

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
