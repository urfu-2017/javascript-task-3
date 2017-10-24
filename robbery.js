'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const YEAR = 2017;
const MONTH = 9;
const DAY = 2;
const AMOUNT_OF_HOURS_IN_DAY = 24;
const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const TIME_TO_ROB_LATER = 30;
const SECONDS_IN_MINUTE = 60;
const MS_IN_SECOND = 1000;
const DAYS_TO_ROB = 3;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var timeZone = workingHours.from.slice(-1);
    // Время когда банк работает в формате date
    var bankWorkingHours = getWorkingHours(workingHours);
    // Время когда банк не работает в формате date
    var bankNotWorkingHours = getBusyBankTime(bankWorkingHours);
    // Время когда банда занята в формате date
    var gangSchedule = getGangShedule(schedule, timeZone);
    // Время когда банда занята, но промежутки занятости объединены
    var timeNotToRob = unitedTime(gangSchedule);
    // Время когда и банда не может и банк; и мы это время объединяем
    var noRobbery = unitedTime(noRobberyAtAll(timeNotToRob, bankNotWorkingHours));
    // Массив времени от и до когда можно грабить
    var timeToRob = robberyTime(noRobbery, duration);

    return {

        /**
         * Найдено ли времяR
         * @returns {Boolean}
         */
        exists: function () {
            if (timeToRob.length !== 0) {
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
            if (!this.exists()) {
                return '';
            }
            var hour = beautify(timeToRob[0].from.getHours());
            var minutes = beautify(timeToRob[0].from.getMinutes());
            var day = WEEK_DAYS[timeToRob[0].from.getDay() - 1];


            return template
                .replace('%HH', hour)
                .replace('%MM', minutes)
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            if (timeToRob[0].to - timeToRob[0].from >=
                (duration + TIME_TO_ROB_LATER) * SECONDS_IN_MINUTE * MS_IN_SECOND) {
                timeToRob[0].from =
                new Date (timeToRob[0].from.setMinutes(timeToRob[0].from.getMinutes() +
                TIME_TO_ROB_LATER));

                return true;
            } else if (timeToRob.length !== 1) {
                timeToRob.shift();

                return true;
            }

            return false;
        }
    };
};

function getWorkingHours(workingHours) {
    var bankShedule = [];
    for (var i = 0; i < DAYS_TO_ROB; i++) {
        bankShedule.push(
            {
                from: toDateBank(workingHours.from, i),
                to: toDateBank(workingHours.to, i)
            }
        );
    }

    return bankShedule;

}

function toDateBank(date, i) {
    var hour = date.slice(0, 2);
    var minutes = date.slice(3, 5);

    return new Date(YEAR, MONTH, DAY + i, hour, minutes);

}

function getGangShedule(sh, timeZone) {

    var resultSchedule = [];
    var clone = {};
    Object.keys(sh).forEach(function (keys) {
        clone[keys] = sh[keys];
    });

    Object.keys(clone).forEach(function (key) {
        if (clone[key][0] !== undefined) {
            var robberTimezone = clone[key][0].from.slice(-1);
            if (robberTimezone !== timeZone) {
                clone[key] = normalizeTimezone(clone[key], robberTimezone - timeZone);
            }
            for (var i = 0; i < clone[key].length; i++) {
                resultSchedule.push(
                    {
                        from: toDate(clone[key][i].from),
                        to: toDate(clone[key][i].to)
                    });
            }
        }
    });

    return resultSchedule.sort(sorting);
}


function sorting(a, b) {
    if (a.from > b.from) {
        return 1;
    }
    if (a.from < b.from) {
        return -1;
    }

    return 0;
}

function normalizeTimezone(time, delta) {
    var normalizedTime = [];
    for (var i = 0; i < time.length; i++) {
        var rightHourFrom = Number(time[i].from.slice(3, 5)) + delta * (-1);
        var rightHourTo = Number(time[i].to.slice(3, 5)) + delta * (-1);
        var dayFrom = time[i].from.slice(0, 2);
        var dayTo = time[i].to.slice(0, 2);

        if (rightHourFrom >= AMOUNT_OF_HOURS_IN_DAY) {
            dayFrom = dayShift(dayFrom);
            rightHourFrom = timeShift(rightHourFrom);
        }
        if (rightHourTo >= AMOUNT_OF_HOURS_IN_DAY) {
            dayTo = dayShift(dayTo);
            rightHourTo = timeShift(rightHourTo);
        }

        normalizedTime.push({
            from: dayFrom + ' ' + beautify(rightHourFrom) + time[i].from.slice(5),
            to: dayTo + ' ' + beautify(rightHourTo) + time[i].to.slice(5) });
    }

    return normalizedTime;
}

function dayShift(day) {
    for (var i = 0; i < WEEK_DAYS.length; i++) {
        if (day === WEEK_DAYS[i]) {
            day = WEEK_DAYS[i + 1];
        }

    }

    return day;
}

function timeShift(hour) {
    hour -= AMOUNT_OF_HOURS_IN_DAY;

    return hour;

}

function beautify(hour) {
    if (hour === 0) {
        return '00';
    } else if (hour < 10) {
        return '0' + hour;
    }

    return hour;
}

function toDate(date) {
    var hour = date.slice(3, 5);
    var minutes = date.slice(6, 8);
    var deltaDay = WEEK_DAYS.indexOf(date.slice(0, 2));

    return new Date(YEAR, MONTH, DAY + deltaDay, hour, minutes);

}
function unitedTime(gangSchedule) {
    if (gangSchedule[0] === undefined) {
        return [];
    }
    var resultSchedule = [gangSchedule[0]];

    for (var i = 1; i < gangSchedule.length; i++) {
        if (gangSchedule[i].from > resultSchedule[resultSchedule.length - 1].to) {
            resultSchedule.push({
                from: gangSchedule[i].from,
                to: gangSchedule[i].to
            });
        }
        if (gangSchedule[i].to > resultSchedule[resultSchedule.length - 1].to) {
            resultSchedule[resultSchedule.length - 1].to = gangSchedule[i].to;
        }
    }

    return resultSchedule;
}


function getBusyBankTime(schedule) {
    var resultSchedule = [];
    resultSchedule.push({
        from: new Date(YEAR, MONTH, DAY, 0, 0),
        to: schedule[0].from
    });
    for (var i = 0; i < schedule.length - 1; i++) {
        resultSchedule.push({
            from: schedule[i].to,
            to: schedule[i + 1].from
        });
    }
    resultSchedule.push({
        from: schedule[schedule.length - 1].to,
        to: new Date(YEAR, MONTH, DAY + 2, 23, 59)
    });

    return resultSchedule;
}

function noRobberyAtAll(timeNotToRob, bankNotWorkingHours) {
    for (var i = 0; i < bankNotWorkingHours.length; i++) {
        timeNotToRob.push(bankNotWorkingHours[i]);
    }

    return timeNotToRob.sort(sorting);
}

function robberyTime(time, duration) {
    var result = [];
    for (var i = 0; i < time.length - 1; i++) {
        if ((time[i + 1].from - time[i].to) >= duration * 60 * 1000) {
            result.push({
                from: time[i].to,
                to: time[i + 1].from
            });
        }
    }

    return result;
}
