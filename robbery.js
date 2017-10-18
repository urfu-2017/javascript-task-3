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
    var bankWorkingHours = getWorkingHours(workingHours);
    var bankNotWorkingHours = getBusyBankTime(bankWorkingHours);
    var gangShe = getGangShedule(schedule, timeZone);
    var timeNotToRob = getBusyTime(gangShe);
    var noRob = getBusyTime(noRobbery(timeNotToRob, bankNotWorkingHours));
    var timeToRob = itsTime(noRob, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (timeToRob[0] !== undefined) {
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
            var hour = '0' + timeToRob[0].from.getHours();
            var minutes = '0' + timeToRob[0].from.getMinutes();
            var day = WEEK_DAYS[timeToRob[0].from.getDay() - 1];


            return template
                .replace('%HH', hour.slice(-2))
                .replace('%MM', minutes.slice(-2))
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
            if (timeToRob[0].to - timeToRob[0].from >= (duration + 30) * 60 * 1000) {
                timeToRob[0].from = timeToRob[0].from + 30 * 60 * 1000;

                return true;
            }


            return false;
        }
    };
};

function getWorkingHours(workingHours) {
    var bankShedule = [];
    for (var i = 0; i < 3; i++) {
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

    return resultSchedule.sort(function (a, b) {
        if (a.from > b.from) {
            return 1;
        }
        if (a.from < b.from) {
            return -1;
        }

        return 0;
    });
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
            break;
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
function getBusyTime(gangSchedule) {
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

function noRobbery(timeNotToRob, bankNotWorkingHours) {
    for (var i = 0; i < bankNotWorkingHours.length; i++) {
        timeNotToRob.push(bankNotWorkingHours[i]);
    }

    return timeNotToRob.sort(function (a, b) {
        if (a.from > b.from) {
            return 1;
        }
        if (a.from < b.from) {
            return -1;
        }

        return 0;
    });
}

function itsTime(time, duration) {
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
