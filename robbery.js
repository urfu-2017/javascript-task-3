'use strict';

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
    var daysOfWeek = ['ПН', 'ВТ', 'СР'];
    var freeByDays = {};
    var commonSchedule = formatingSchedule(schedule, workingHours);
    for (var i = 0; i < daysOfWeek.length; i++) {
        freeByDays[daysOfWeek[i]] =
            commonScheduleByDays(commonSchedule, daysOfWeek[i], workingHours);
    }

    return {
        dayToRubbig: canRobbing(freeByDays, duration, null),
        template: '',

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return this.dayToRubbig.isCanRub;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                var neededTime = this.dayToRubbig.day;
                this.template = template.replace(/%HH/g, neededTime.from.slice(0, 2))
                    .replace(/%MM/g, neededTime.from.slice(2, 4))
                    .replace(/%DD/g, neededTime.day);

                return this.template;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var dayToRub = canRobbing(freeByDays, duration, this.dayToRubbig.day.from);
            if (dayToRub.isCanRub) {
                this.dayToRubbig = dayToRub;
            }

            return dayToRub.isCanRub;
        }
    };
};

function canRobbing(robbersFree, duration, lastFrom) {
    var timeToRob = [];
    for (var day in robbersFree) {
        if (!robbersFree.hasOwnProperty(day)) {
            continue;
        }
        robbersFree[day].forEach(function (time) {
            if (lastFrom && time.from <= lastFrom) {
                if (time.from === lastFrom) {
                    var curDate = new Date();
                    curDate.setHours(parseInt(time.from.slice(0, 2)),
                        parseInt(time.from.slice(2, 4)), 0);
                    curDate.setMinutes(curDate.getMinutes() + 30);
                    var hours = curDate.getHours();
                    var minutes = curDate.getMinutes();
                    var hour = hours > 9 ? hours.toString() : '0' + hours.toString();
                    var min = minutes > 9 ? minutes.toString() : '0' + minutes.toString();
                    time.from = hour + min;
                }
            }
            var minFrom = parseInt(time.from.slice(0, 2)) * 60 + parseInt(time.from.slice(2, 4));
            var minTo = parseInt(time.to.slice(0, 2)) * 60 + parseInt(time.to.slice(2, 4));
            var durationFree = minTo - minFrom;
            if (durationFree >= duration) {
                timeToRob.push(time);
            }
        });
    }
    var dayToRob = { day: {}, isCanRub: timeToRob.length > 0 };
    if (dayToRob.isCanRub) {
        dayToRob.day = { day: timeToRob[0].day, from: timeToRob[0].from, to: timeToRob[0].to };
    }

    return dayToRob;
}

function formatingSchedule(schedule, workingHours) {
    var commonSchedule = [];
    for (var rubber in schedule) {
        if (!schedule.hasOwnProperty(rubber)) {
            continue;
        }
        schedule[rubber].forEach(function (hours) {
            var date = toBankOffset(workingHours, hours);
            if (date.length === 2) {
                if (toBankTimeRange(workingHours, date[0])) {
                    commonSchedule.push(date[0]);
                }
                if (toBankTimeRange(workingHours, date[1])) {
                    commonSchedule.push(date[1]);
                }
            } else if (toBankTimeRange(workingHours, date)) {
                commonSchedule.push(date);
            }
        });
    }

    return commonSchedule;
}

function toBankTimeRange(workingHours, hours) {
    var bankFrom = parseInt(workingHours.from.replace(/:|(\+\d)/g, ''));
    var bankTo = parseInt(workingHours.to.replace(/:|(\+\d)/g, ''));
    var hoursFrom = parseInt(hours.from);
    var hoursTo = parseInt(hours.to);

    if (hoursFrom <= bankFrom) {
        if (hoursTo <= bankFrom) {
            return false;
        }
        hours.from = bankFrom.toString();
    }
    if (hoursTo >= bankTo) {
        if (hoursFrom >= bankTo) {
            return false;
        }
        hours.to = bankTo.toString();
    }

    return true;
}

function commonScheduleByDays(commonSchedule, dayOfWeek, workingHours) {
    var robbersFree = [];
    var localDayOfWeek = dayOfWeek;
    var bankFrom = workingHours.from.replace(/:|(\+\d)/g, '');
    var bankTo = workingHours.to.replace(/:|(\+\d)/g, '');
    var sortedDay = commonSchedule.filter(function (day) {

        return day.day === dayOfWeek;
    })
        .sort(function (a, b) {
            return Number(a.to) - Number(b.to);
        });
    sortedDay.reduceRight(function (acc, item, index) {
        if (acc.from > item.to) {
            robbersFree.push({ day: localDayOfWeek, from: item.to, to: acc.from });
        }
        if (acc.from < item.from) {
            item.from = acc.from;
        }
        if (acc.from === item.from && acc.to === item.to) {
            return item;
        }
        if (index === 0 && item.from > bankFrom) {
            robbersFree.push({ day: localDayOfWeek, from: bankFrom, to: item.from });

            return item;
        }

        return item;
    }, { from: bankTo, to: bankTo });

    if (sortedDay.length === 0) {
        robbersFree.push({ day: localDayOfWeek, from: bankFrom, to: bankTo });
    }
    if (parseInt(bankFrom) > parseInt(bankTo)) {
        return [];
    }

    return robbersFree.sort(function (a, b) {
        return Number(a.from) - Number(b.from);
    });
}

function toBankOffset(bankHours, hours) {
    var bankOffset = Number(bankHours.from.split('+')[1]);
    var timeFrom = hours.from.split(/[: +]/);
    var timeTo = hours.to.split(/[: +]/);

    timeFrom[1] = checkOffset(bankOffset, timeFrom);
    timeTo[1] = checkOffset(bankOffset, timeTo);

    if (timeFrom[0] !== timeTo[0]) {
        return chushToTwoDays(timeFrom, timeTo);
    }

    return { day: timeFrom[0], from: timeFrom[1] + timeFrom[2], to: timeTo[1] + timeTo[2] };
}

function checkOffset(bankOffset, time) {
    var offset = Number(time[3]);
    var rightFrom = Number(time[1]) + (bankOffset - offset);
    rightFrom = rightFrom > 24 ? rightFrom - 24 : rightFrom;
    rightFrom = rightFrom < 0 ? rightFrom + 24 : rightFrom;

    return rightFrom < 10 ? '0' + rightFrom : rightFrom.toString();
}

function chushToTwoDays(timeFrom, timeTo) {
    var timeFromCopy = timeFrom.slice();
    var timeToCopy = timeTo.slice();

    timeFromCopy[1] = '00';
    timeFromCopy[2] = '00';

    timeToCopy[1] = '23';
    timeToCopy[2] = '59';

    return [{ day: timeFrom[0], from: timeFrom[1] + timeFrom[2],
        to: timeToCopy[1] + timeToCopy[2] },
    { day: timeTo[0], from: timeFromCopy[1] + timeFromCopy[2],
        to: timeTo[1] + timeTo[2] }];
}
