'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
var dateRegex = /([А-Я]{2})\s(\d{2}):(\d{2})\+(\d{1,2})/;
var days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var daysForRob = days.slice(0, 3);

function getBankTimeTable(workingHours) {
    let timeTable = [];
    daysForRob.forEach(function (day) {
        let dateTimeFrom = parseDateString(day + ' ' + workingHours.from);
        let dateTimeTo = parseDateString(day + ' ' + workingHours.to);
        timeTable.push({
            from: dateTimeFrom,
            to: dateTimeTo
        });
    });

    return timeTable;
}

function parseDateString(dateString) {
    let parcedDateString = dateString.match(dateRegex);
    let day = days.indexOf(parcedDateString[1]) + 1;
    let timezone = Number(parcedDateString[4]);
    let hours = Number(parcedDateString[2]) - timezone;
    let minutes = Number(parcedDateString[3]);
    let dateTime = new Date(2017, 10, day, hours, minutes);

    return dateTime;
}

function performIntersectIntervals(schedule) {
    schedule.sort(function (first, second) {

        return first.from.getTime() - second.from.getTime();
    });
    let performedSchedule = [schedule[0]];
    schedule = schedule.slice(1);
    while (schedule.length !== 0) {
        let curInter = schedule[0];
        let isIntersect = false;
        performedSchedule.forEach(function (perfomInter) {
            if (curInter.from <= perfomInter.to && curInter.to >= perfomInter.from) {
                perfomInter.to = perfomInter.to >= curInter.to ? perfomInter.to : curInter.to;
                isIntersect = true;
            }
        });
        if (!isIntersect) {
            performedSchedule.push(curInter);
        }
        schedule = schedule.slice(1);
    }

    return performedSchedule;
}

function getRobTime(bankTimetable, schedule) {
    let robTimes = [];
    bankTimetable.forEach(function (workday) {
        schedule.forEach(function (interval) {
            if (workday.from <= interval.to && workday.to >= interval.from) {
                let robTime = {
                    from: workday.from >= interval.from ? workday.from : interval.from,
                    to: workday.to >= interval.to ? interval.to : workday.to
                };
                robTimes.push(robTime);
            }
        });
    });

    return robTimes;
}

function inverseIntervals(schedule, bankTimezone) {
    let from = parseDateString('ПН 00:00+' + bankTimezone);
    let to = parseDateString('СР 23:59+' + bankTimezone);
    let inversed = [{ from, to: schedule[0].from }];
    for (let i = 0; i <= schedule.length - 2; i++) {
        inversed.push({ from: schedule[i].to, to: schedule[i + 1].from });
    }
    inversed.push({ from: schedule[schedule.length - 1].to, to });

    return inversed;
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
    // console.info(schedule, duration, workingHours);
    let robTimes;
    let bankTimezone = ('ПН ' + workingHours.from).match(dateRegex)[4];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            let names = Object.keys(schedule);
            let parsedSchedule = [];
            names.forEach(function (name) {
                schedule[name].forEach(function (namedSchedule) {
                    parsedSchedule.push({
                        from: parseDateString(namedSchedule.from),
                        to: parseDateString(namedSchedule.to)
                    });

                });
            }
            );


            let out = performIntersectIntervals(parsedSchedule);

            let timeTable = getBankTimeTable(workingHours);

            let inversed = inverseIntervals(out, bankTimezone);

            robTimes = getRobTime(timeTable, inversed);
            robTimes = robTimes.filter(function (time) {
                let timeToRob = (time.to - time.from) / 60000;

                return duration <= timeToRob;
            });

            return robTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robTimes.length === 0) {

                return '';
            }
            let time = robTimes[0].from;
            time.setTime(time.getTime() + bankTimezone * 60 * 60 * 1000);
            let day = days[time.getDate() - 1];
            let hours = time.getHours();
            let minutes = time.getMinutes();

            if (String(hours).length === 1) {
                hours = '0'.concat(String(hours));
            }
            if (String(minutes).length === 1) {
                hours = '0'.concat(String(minutes));
            }

            return template.replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);
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
