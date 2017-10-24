'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var daysOfWeeksToNumberDay = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};

var numberDayToDayWeek = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР',
    3: 'ЧТ',
    4: 'ПТ',
    5: 'СБ',
    6: 'ВС'
};

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const INTERVALS_END = HOURS_IN_DAY * 3 * 60 - 1;

function getRobbersSchedule(schedule) {
    let allEntries = [].concat(schedule.Danny, schedule.Rusty, schedule.Linus);

    return allEntries.map(parseEntry);
}

function parseEntry(entry) {
    let [dayFrom, timeFrom] = entry.from.split(' ');
    let [dayTo, timeTo] = entry.to.split(' ');

    return {
        dayFrom,
        dayTo,
        from: getTime(timeFrom),
        to: getTime(timeTo)
    };
}

function getTime(time) {
    let [hoursAndMinutes, timeZone] = time.split('+');
    let [hours, minutes] = hoursAndMinutes.split(':');

    return {
        timeZone: Number(timeZone),
        hours: Number(hours),
        minutes: Number(minutes)
    };
}

function getBankInfo(workingHours) {
    let from = getTime(workingHours.from);
    let to = getTime(workingHours.to);

    let bankWorkIntervals = [];
    const bankTimeZoneDiff = 0;

    ['ПН', 'ВТ', 'СР'].forEach(function (day) {
        bankWorkIntervals.push({
            start: getTimeInMinutes(day, bankTimeZoneDiff, from.hours, from.minutes),
            end: getTimeInMinutes(day, bankTimeZoneDiff, to.hours, to.minutes)
        });
    });

    return {
        bankWorkIntervals,
        bankTimezone: from.timeZone
    };
}

function getTimeInMinutes(day, timeZoneDifferent, hours, minutes) {
    return (hours + timeZoneDifferent + daysOfWeeksToNumberDay[day] * HOURS_IN_DAY) *
        MINUTES_IN_HOUR + minutes;
}

function getEmploymentIntervals(robbersSchedule, bankTimezone) {
    return robbersSchedule.map(entry => {
        let timeZoneDifferent = bankTimezone - entry.from.timeZone;

        let from = entry.from;
        let to = entry.to;

        return {
            start: getTimeInMinutes(entry.dayFrom, timeZoneDifferent, from.hours, from.minutes),
            end: getTimeInMinutes(entry.dayTo, timeZoneDifferent, to.hours, to.minutes)
        };
    });
}

function mergeEmploymentIntervals(sortedIntervals) {
    let uniounIntervals = [];
    let interval = sortedIntervals[0];
    let start = interval.start;
    let end = interval.end;

    for (var i = 0; i < sortedIntervals.length; i++) {
        interval = sortedIntervals[i];
        if (end >= interval.end) {
            continue;
        }
        if (end >= interval.start) {
            end = interval.end;
        } else {
            uniounIntervals.push({ start, end });

            start = interval.start;
            end = interval.end;
        }
    }
    uniounIntervals.push({ start, end });

    return uniounIntervals;
}

function getFreeIntervals(unionEmploymentIntervals) {
    let start = 0;
    let end = 0;

    let freeIntervals = [];
    let intervals = unionEmploymentIntervals.filter(x => x.start < INTERVALS_END)
        .map(x => {
            if (x.end > INTERVALS_END) {
                x.end = INTERVALS_END;
            }

            return x;
        });

    for (let interval of intervals) {
        end = interval.start;

        freeIntervals.push({ start, end });

        start = interval.end;
    }
    if (start !== INTERVALS_END) {
        freeIntervals.push({ start, end: INTERVALS_END });
    }

    return freeIntervals;
}

function getIntervalsWhenBankIsWorking(freeIntervals, bankStart, bankEnd) {
    let copyIntervals = freeIntervals.slice();

    return copyIntervals.filter(x => {
        return ((bankStart < x.end && bankStart >= x.start) ||
            (bankEnd > x.start && bankEnd <= x.end) ||
            (bankStart <= x.start && bankEnd >= x.end));
    });
}

function getNeededIntervals(intervalsForDay, bankStart, bankEnd) {
    let result = [];

    for (let interval of intervalsForDay) {
        let start = interval.start;
        let end = interval.end;
        if (start < bankStart) {
            start = bankStart;
        }
        if (end > bankEnd) {
            end = bankEnd;
        }
        let different = end - start;

        result.push({ start, end, different });
    }

    return result;
}

function getAppropriateIntervals(freeIntervals, bankWorkIntervals) {
    let appropriateIntervals = [];

    for (let bankWorkInterval of bankWorkIntervals) {
        let bankStart = bankWorkInterval.start;
        let bankEnd = bankWorkInterval.end;

        let intervalsForDay = getIntervalsWhenBankIsWorking(freeIntervals, bankStart, bankEnd);
        let result = getNeededIntervals(intervalsForDay, bankStart, bankEnd);

        appropriateIntervals = appropriateIntervals.concat(result);
    }

    return appropriateIntervals;
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
    let robbersSchedule = getRobbersSchedule(schedule);
    let bankInfo = getBankInfo(workingHours);

    let employmentIntervals = getEmploymentIntervals(robbersSchedule, bankInfo.bankTimezone);
    let sortedEmploymentIntervals = employmentIntervals.sort((a, b) => a.start - b.start);
    let unionEmploymentIntervals = mergeEmploymentIntervals(sortedEmploymentIntervals);
    let freeIntervals = getFreeIntervals(unionEmploymentIntervals);

    let appropriateIntervals = getAppropriateIntervals(freeIntervals, bankInfo.bankWorkIntervals);

    let appropriateMoments = appropriateIntervals
        .filter(x => x.different >= duration)
        .map((x, i) => {
            x.next = i + 1;

            return x;
        });
    let currentAnswer = appropriateMoments[0];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateMoments.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (appropriateMoments.length === 0) {
                return '';
            }

            let startTimeInMinutes = currentAnswer.start;
            let minutes = startTimeInMinutes % 60;
            let totalHours = Math.floor(startTimeInMinutes / 60);
            let day = Math.floor(totalHours / 24);
            let hours = totalHours % 24;

            return template
                .replace('%HH', hours > 9 ? hours : `0${hours}`)
                .replace('%MM', minutes > 9 ? minutes : `0${minutes}`)
                .replace('%DD', numberDayToDayWeek[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (appropriateMoments.length === 0 || appropriateMoments.length === 1) {
                return false;
            }

            let nextAnswer = getNextAnswer(currentAnswer, appropriateMoments, duration);
            if (typeof nextAnswer === 'undefined') {
                return false;
            }

            currentAnswer = nextAnswer;

            return true;
        }
    };
};

function getNextAnswer(currentAnswer, answer, duration) {
    let newStartMoment = currentAnswer.start + 30;
    let newDuration = currentAnswer.end - newStartMoment;
    if (newDuration >= duration) {
        return {
            start: newStartMoment,
            end: currentAnswer.end,
            different: newDuration,
            next: currentAnswer.next
        };
    }

    return answer[currentAnswer.next];
}
