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
exports.getAppropriateMoment = function (schedule, duration, workingHours) {


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            var check = result(schedule, duration, workingHours);
            if (check !== '') {
                return true;
            }

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
            var check = result(schedule, duration, workingHours);
            if (this.exists()) {
                var timeDay = check[0].substring(0, 2);
                var timeHours = check[0].substring(3, 5);
                var timeMin = check[0].substring(6, 8);

                return template
                    .replace(/%DD/, timeDay)
                    .replace(/%HH/, timeHours)
                    .replace(/%MM/, timeMin);
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
function toOneArray(schedule) {
    var res = [];
    res.Denny = [];
    var keys = Object.keys(schedule);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = schedule[key];
        if (i === 0) {
            res.Denny = toEachDay(value);
        }
        if (i === 1) {
            res.Rusty = toEachDay(value);
        }
        if (i === 2) {
            res.Linus = toEachDay(value);
        }
    }

    return res;
}
function toEachDay(oneArray) {
    var weekFree = [];
    var openTime = [0];
    for (var i = 0; i < oneArray.length; i++) {
        var oT = openTime.concat(toMinuetsWhDay(oneArray[i].from));
        weekFree.push(oT);
        openTime = [toMinuetsWhDay(oneArray[i].to)];
        if (i === oneArray.length - 1) {
            var cT = [toMinuetsWhDay(oneArray[i].to)].concat(4320);
            weekFree.push(cT);
        }
    }

    return weekFree;

}

function toMinuets(str) {
    if (str.length === 7) {
        var timeWithDay = 60 * Number(str.substring(0, 2)) + Number(str.substring(3, 5)) -
        60 * Number(str.substring(6, 7));

        return timeWithDay;
    }
    var time = 60 * Number(str.substring(0, 1)) + Number(str.substring(2, 4)) -
    60 * Number(str.substring(5, 6));

    return time;
}

function hours(h) {
    if (h < 10) {
        var hr = '0' + h;

        return hr;
    }

    return h;
}

function toHours(numb) {
    var str = '';
    if (numb < 4320 && numb >= 2880) { // ноль! 09 
        str = 'СР ' + hours(Math.floor((numb - 2880) / 60)) + ':' + hours((numb - 2880) % 60);
    }
    if (numb < 2880 && numb >= 1440) {
        str = 'ВТ ' + hours(Math.floor((numb - 1440) / 60)) + ':' + hours((numb - 1440) % 60);
    }
    if (numb < 1440) {
        str = 'ПН ' + hours(Math.floor(numb / 60)) + ':' + hours(numb % 60);
    }

    return str;
}

function toMinuetsWhDay(day) {
    var Ar = ['ПН', 'ВТ', 'СР'];
    var i = Ar.indexOf(day.substring(0, 2));
    var timeM = 60 * Number(day.substring(3, 5)) + Number(day.substring(6, 8)) -
    60 * Number(day.substring(9, 10)) + 60 * 24 * i;

    return timeM;
}

function toOneFreeTime(P1, P2) {
    var answ = [];
    for (var i = 0; i < P1.length; i++) {
        let n1 = P1[i][0];
        let k1 = P1[i][1];
        for (var j = 0; j < P2.length; j++) {
            let n2 = P2[j][0];
            let k2 = P2[j][1];
            answ.push(peresech(n1, k1, n2, k2));
        }
    }
    var answWithoutEmpty = [];
    for (var k = 0; k < answ.length; k++) {
        if (answ[k].length !== 0) {
            answWithoutEmpty.push(answ[k]);
        }
    }

    return answWithoutEmpty;
}

function result(raspisan, timeToLo, workTime) {
    var answer = [];
    var oneAr = toOneArray(raspisan);
    var timeBank = timeToArray(workTime);
    var freeTimePeople = toOneFreeTime((toOneFreeTime(oneAr.Denny, oneAr.Linus)), oneAr.Rusty);
    var freeTimeWithBank = toOneFreeTime(freeTimePeople, timeBank);
    var lootTimeInOneLine = findTime(timeToLo, freeTimeWithBank);
    if (lootTimeInOneLine.length === 0) {

        return '';
    }
    var answerInNumbers = lootTimeInOneLine.map(function (num) {
        return num + Number((workTime.from).substring(6)) * 60;

    });

    for (var i = 0; i < answerInNumbers.length; i++) {
        var date = toHours(answerInNumbers[i]);
        answer.push(date);
    }

    return answer;
}

function peresech(a, b, c, d) {
    var peresec = [];
    if (c > b || d < a) {
        return peresec;
    }
    peresec = [Math.max(a, c), Math.min(b, d)];

    return peresec;

}
function timeToArray(time) {
    var workHours = [];
    var plusDay = 0;
    for (var i = 0; i < 3; i++) {
        plusDay = i * 1440;
        workHours.push([toMinuets(time.from) + plusDay,
            toMinuets(time.to) + plusDay]);
    }

    return workHours;
}
function findTime(number, freeAr) {
    var answer = [];
    for (var i = 0; i < freeAr.length; i++) {
        var nach = freeAr[i][0];
        var conc = freeAr[i][1];
        if ((conc - nach) >= number) {
            answer.push(nach);
        }
    }

    return answer;
}
