'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var wh1;
var wh2;
var basetimezone;
const day = 1440;
var t1 = [0];
var t2 = [day * 3];
var gTime;
var counter = 0;

function transform(time, template) {
    var days = ['ПН', 'ВТ', 'СР'];
    var numday = 0;
    while (time >= day) {
        time -= day;
        numday++;
    }
    var mm = time % 60;
    if (mm === 0) {
        mm = '00';
    }
    var hh = (time - mm) / 60;
    template = template.replace('%HH', hh)
        .replace('%MM', mm)
        .replace('%DD', days[numday]);

    return template;
}

function excluder(duration) {
    var q = 0;
    while (q < t1.length) {
        if (t2[q] - t1[q] < duration) {
            delete t1.splice(q, 1);
            delete t2.splice(q, 1);
        } else {
            q++;
        }
    }
}

// function minuteToHours(t_, t__) {
//     for (var l = 0; l < t_.length; l++) {
//         var time = t_[l];
//         var mm = time % 60;
//         var hh = (time - mm) / 60;
//         time = t__[l];
//         var mm2 = time % 60;
//         var hh2 = (time - mm2) / 60;
//         console.info(hh, ':', mm, '--', hh2, ':', mm2);
//     }
// }

function cutout(typeConf, k, busy1, busy2) {
    if (typeConf !== 0) {
        switch (typeConf) {
            case 1:
                t1[k] = busy2;
                break;
            case 2:
                t2[k] = busy1;
                break;
            case 3:
                t2.push(t2[k]);
                t2[k] = busy1;
                t1.push(busy2);
                break;
            default:
        }
    }
}

function typeOfConfluence(k, busy1, busy2) {
    var typeConf = 0;
    if ((busy1 >= t2[k]) || (busy2 <= t1[k])) {
        typeConf = 0;
    } else if ((busy1 >= t1[k]) && (busy2 <= t2[k])) {
        typeConf = 3;
    } else if (busy1 >= t1[k]) {
        typeConf = 2;
    } else if (busy2 <= t2[k]) {
        typeConf = 1;
    } else {
        t1.splice(k, 1);
        t2.splice(k, 1);
    }
    cutout(typeConf, k, busy1, busy2);
}

function cutter(busy1, busy2) {
    for (var k = 0; k < t1.length; k++) {
        typeOfConfluence(k, busy1, busy2);
    }
}

function parseBusyTime(time) {
    var arr = time.split(/ |:|\+/);
    var x;
    switch (arr[0]) {
        case 'ПН':
            x = 0;
            break;
        case 'ВТ':
            x = 1;
            break;
        case 'СР':
            x = 2;
            break;
        default:
    }
    var busy = arr[1] * 60 + Number(arr[2]) + x * day + 60 * (basetimezone - arr[3]);

    return busy;
}

function firstExpulsion(a, b) {
    t1 = [];
    t2 = [];
    t1[0] = a;
    t1.push(a + day);
    t1.push(a + day * 2);
    t2[0] = b;
    t2.push(b + day);
    t2.push(b + day * 2);
    // console.info(t1, t2);
}

function whCoercion(workingHours) {
    var arrwh = workingHours.from.split('+');
    basetimezone = arrwh[1];
    arrwh = arrwh[0].split(':');
    wh1 = Number(arrwh[0]) * 60 + Number(arrwh[1]);
    arrwh = workingHours.to.split('+');
    arrwh = arrwh[0].split(':');
    wh2 = Number(arrwh[0]) * 60 + Number(arrwh[1]);
    // console.info (basetimezone, wh1, wh2);
}

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
    whCoercion(workingHours);
    firstExpulsion(wh1, wh2);
    let value = Object.values(schedule);
    // console.info (value[0].length, value[1].length, value[2].length);
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < value[i].length; j++) {
            var busy1 = parseBusyTime(value[i][j].from);
            var busy2 = parseBusyTime(value[i][j].to);
            cutter(busy1, busy2);
        }
    }
    t1.sort();
    t2.sort();
    excluder(duration);
    counter = 0;
    // minuteToHours(t1, t2);
    // console.info('NUTICHE', t1, t2);


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return t1.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            gTime = t1[counter];
            // console.info('vivod', t1, t2, gTime);
            var time = gTime;
            if (!this.exists()) {
                return '';
            }
            template = transform(time, template);
            // counter++;
            // console.info(template);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var b1 = false;
            gTime = t1[counter];
            // console.info('ROVAAA', t1, t2, gTime);
            if (!this.exists()) {
                // console.info(!this.exists());
            } else if (t2[counter] - t1[counter] - 30 >= duration) {
                // console.info('qq', t1[counter] + 30);
                // counter--;
                t1[counter] = t1[counter] + 30;
                b1 = true;
            } else if (t1[counter + 1]) {
                // console.info(t1[counter]);
                // console.info('GTIMEE', gTime);
                counter++;
                b1 = true;
            }
            // console.info(b1, counter);

            return b1;
        }
    };
};
