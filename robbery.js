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
    
    for(var i = 0; i < daysOfWeek.length; i++)
    {
        freeByDays[daysOfWeek[i]] = commonScheduleByDays(commonSchedule, daysOfWeek[i], workingHours);
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
            if(this.exists()) {
                var neededTime = this.dayToRubbig.day;
                this.template = template.replace(/%HH/g, neededTime.from.slice(0,2))
                    .replace(/%MM/g, neededTime.from.slice(2,4))
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
            if(dayToRub.isCanRub)
                this.dayToRubbig = dayToRub;

            return dayToRub.isCanRub;
        }
    };
};

function canRobbing(robbersFree, duration, lastFrom) {
    var timeToRob = [];
    for(var day in robbersFree) {
        if(!robbersFree.hasOwnProperty(day)) {
            continue;
        }
        robbersFree[day].forEach(function (time) {
            if(lastFrom && time.from <= lastFrom) {
                if(time.from === lastFrom) {
                    var curDate = new Date();
                    curDate.setHours(parseInt(time.from.slice(0,2)),
                        parseInt(time.from.slice(2,4)), 0);
                    curDate.setMinutes(curDate.getMinutes() + 30);
                    var hours = curDate.getHours();
                    var minutes = curDate.getMinutes();
                    var hour = hours > 9 ? hours.toString() : '0' + hours;
                    var min = minutes > 9 ? minutes.toString() : '0' + minutes;
                    time.from = hour + min;
                }
            }
            var minFrom = parseInt(time.from.slice(0, 2)) * 60 + parseInt(time.from.slice(2, 4));
            var minTo = parseInt(time.to.slice(0, 2)) * 60 + parseInt(time.to.slice(2, 4));
            var durationFree = minTo - minFrom;
            if(durationFree >= duration) {
                timeToRob.push(time);
            }
        })
    }
    var dayToRob = {day:{}, isCanRub: timeToRob.length > 0};
    if(dayToRob.isCanRub) {
        dayToRob.day = {day: timeToRob[0].day,
                        from: timeToRob[0].from,
                        to: timeToRob[0].to};
    }

    return dayToRob;
}

function formatingSchedule(schedule, workingHours) {
    var commonSchedule = [];
    for(var rubber in schedule)
    {
        if(!schedule.hasOwnProperty(rubber)) {
            continue;
        }
        schedule[rubber].forEach(function (hours) {
            var date = toBankOffset(workingHours, hours);
            if(date.length === 2) {
                commonSchedule.push(date[0]);
                commonSchedule.push(date[1]);
            } else {
                commonSchedule.push(date);
            }
        })
    }

    return commonSchedule;
}

function commonScheduleByDays(commonSchedule, dayOfWeek, workingHours) {
    var robbersFree = [];
    var localDayOfWeek = dayOfWeek;
    var bankFrom = workingHours.from.replace(/:|(\+\d)/g, '');
    var bankTo = workingHours.to.replace(/:|(\+\d)/g, '');
    var result = commonSchedule.filter(function (day) {
        return day.dayFrom === dayOfWeek; })
        .sort(function (a, b) {
            return Number(a.from) - Number(b.from) })
        .reduce(function (acc, item) {
            if(acc.from < item.from) {
                if(item.from > bankTo) {
                    acc.to = bankTo;
                    robbersFree.push({day: localDayOfWeek, from: acc.from, to:acc.to});
                } else {
                    robbersFree.push({day: localDayOfWeek, from: acc.from, to:item.from});
                    acc.from = item.to;
                    acc.to = item.to;
                }
            }
            if(acc.from > item.from) {
                acc.from = item.to;
            }
            if(acc.to <= item.from) {
                acc.to = item.from;
                return acc;
            }
            if(acc.to === item.to) {
                acc.to = bankTo;
            }
            return acc; }, {from:bankFrom, to:bankTo});
    
    if(result.to <= bankTo)
    {
        robbersFree.push({day: localDayOfWeek, from: result.from, to: result.to});
    }

    return robbersFree;
}

function toBankOffset(bankHours, hours) {
    var bankOffset = Number(bankHours.from.split('+')[1]);
    var timeFrom = hours.from.split(/[: +]/);
    var timeTo = hours.to.split(/[: +]/);

    var offset = Number(timeFrom[3]);
    var rightFrom;
    var rightTo;
    
    if (bankOffset > offset) {
        rightFrom = (Number(timeFrom[1]) + (bankOffset - offset)).toString();
        rightTo = (Number(timeTo[1]) + (bankOffset - offset)).toString();
    } else {
        rightFrom = (Number(timeFrom[1]) - (bankOffset - offset)).toString();
        rightTo = (Number(timeTo[1]) - (bankOffset - offset)).toString();
    }
    timeFrom[1] = rightFrom.length === 1 ? '0' + rightFrom : rightFrom;
    timeTo[1] = rightTo.length === 1 ? '0' + rightTo : rightTo;

    if(timeFrom[0] !== timeTo[0])
    {
        return chushToTwoDays(timeFrom, timeTo);
    }

    return {dayFrom: timeFrom[0], from: timeFrom[1] + timeFrom[2],
        dayTo: timeTo[0], to: timeTo[1] + timeTo[2]}
}

function chushToTwoDays(timeFrom, timeTo) {
    var timeFromCopy = timeFrom.slice();
    var timeToCopy = timeTo.slice();
    
    timeFromCopy[1] = '00';
    timeFromCopy[2] = '00';
    
    timeToCopy[1] = '23';
    timeToCopy[2] = '59';

    return [{dayFrom: timeFrom[0], from: timeFrom[1]+ timeFrom[2],
            dayTo: timeFrom[0], to: timeToCopy[1] + timeToCopy[2]},
            {dayFrom: timeTo[0], from: timeFromCopy[1] + timeFromCopy[2],
            dayTo: timeTo[0], to: timeTo[1] + timeTo[2]}];
}
