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

function formDict(name) {
    var day = [];
    for (var i = 0; i < name.length; i++) {
        var t1 = toMinsFromMonday(name[i].from);
        var t2 = toMinsFromMonday(name[i].to);
        day.push([t1, t2]);
    }

    return day;

}
function helper1(t1, t2, t3, t4) {
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
function findIntersection(inter1, inter2) {
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
    if ((t2 <= t3) || (t1 >= t4)) {
        return [];
    }

    return helper1(t1, t2, t3, t4);
}
function trickSystem(period, arr) {
    if (period === []) {
        return;
    }
    var out = [];
    for (var i = 0; i < arr.length; i++) {
        out.push(findIntersection(arr[i], period));
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
            res += 1440;
            break;
        case 'СР':
            res += 2880;
            break;
        default:
            break;
    }
    res += (parseInt(hours) - parseInt(zone)) * 60 + parseInt(mins);

    return res;
}
function minsFromMonToDay(mins, bankZone) {
    mins += bankZone * 60;
    var d = Math.floor(mins / 1440);
    var h = Math.floor((mins - (d * 1440)) / 60);
    var m = mins - (d * 1440) - (h * 60);
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
            return ['ПН', h + ':' + m];
        case 1:
            return ['ВТ', h + ':' + m];
        case 2:
            return ['СР', h + ':' + m];
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
    var Op = (parseInt(hOpens) - zone) * 60 + parseInt(mOpens);
    var Clo = (parseInt(hClosed) - zone) * 60 + parseInt(mClosed);
    out.push([Op, Clo], [Op + 1440, Clo + 1440], [Op + 2880, Clo + 2880]);

    return out;
}
function getFreeTimeIntervals(intervals) {
    var start = Number.NEGATIVE_INFINITY;
    var out = [];
    for (var i = 0; i < intervals.length; i++) {
        out.push([start, intervals[i][0]]);
        start = intervals[i][1];
    }
    if (parseInt(start) < 4320) {
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
            out.push(trickSystem(res, linus));
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
    danny = formDict(schedule.Danny);
    rusty = formDict(schedule.Rusty);
    linus = formDict(schedule.Linus);
    danny = getFreeTimeIntervals(danny);
    rusty = getFreeTimeIntervals(rusty);
    linus = getFreeTimeIntervals(linus);
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
            var exists = false;
            if (rTime !== -1) {
                exists = true;
            }

            return exists;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (getRightTime(schedule, duration, workingHours) === -1) {
                return '';
            }
            var time = getRightTime(schedule, duration, workingHours);
            var zone = parseInt(workingHours.from.substring(6));
            var parsedStart = minsFromMonToDay(time[0], zone);
            var d = parsedStart[0];
            var h = parsedStart[1].split(':')[0];
            var m = parsedStart[1].split(':')[1];
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
