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
    let currentRobbery = 0;
    let availableTimes = [];
    let bankTimezone = getTimezoneFromString(workingHours.from);
    let timesegments = convertScheduleToSegments(schedule, bankTimezone);
    let banksegments = convertBankTimeToSegments(workingHours, bankTimezone);
    timesegments = timesegments.concat(banksegments);
    let timePoints = convertSegmentsToTimes(timesegments);
    availableTimes = searchFreeDates(timePoints, duration);
    console.info(availableTimes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return availableTimes.length > currentRobbery;
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

            return formatTime(availableTimes[currentRobbery], template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            currentRobbery++;
            if (this.exists()) {
                return true;
            }
            currentRobbery--;

            return false;
        }
    };
};

function getRobberyTimesFromFreeSegment(segment, robberyDuration) {
    let times = [];
    let currentTime = segment.from;
    while (currentTime + robberyDuration <= segment.to) {
        times.push(currentTime);
        currentTime += 30;
    }

    return times;
}

function searchFreeSegments(timepoints) {
    let currentNesting = 1;
    let freeSegments = [];
    let currentStartTime = 0;
    for (let i = 0; i < timepoints.length; i++) {
        if (timepoints[i].isStart) {
            currentNesting++;
        } else {
            currentNesting--;
        }
        if (currentNesting === 1 && timepoints[i].isStart) {
            freeSegments.push({ from: currentStartTime, to: timepoints[i].minutes });
        }
        currentStartTime = timepoints[i].minutes;
    }

    return freeSegments;
}

function searchFreeDates(timePoints, duration) {
    timePoints.sort(function (a, b) {
        if (a.minutes < b.minutes) {
            return -1;
        }
        if (a.minutes > b.minutes) {
            return 1;
        }

        return 0;
    });
    let freeSegments = searchFreeSegments(timePoints);
    let robberyTimes = [];
    for (let segment of freeSegments) {
        robberyTimes = robberyTimes.concat(getRobberyTimesFromFreeSegment(segment, duration));
    }
    let freeDates = [];
    for (let time of robberyTimes) {
        freeDates.push(convertMinutesToDate(time));
    }

    return freeDates;
}

function formatTime(time, template) {
    return template
        .replace(/%HH/, zfill(time.hours, 2))
        .replace(/%MM/, zfill(time.minutes, 2))
        .replace(/%DD/, time.day);
}

function zfill(number, maxLen) {
    let currentNumber = String(number);
    while (maxLen - currentNumber.length > 0) {
        currentNumber = '0' + currentNumber;
    }

    return currentNumber;
}

function parseDate(date) {
    let splited = date.split(' ');
    let time = parseTime(splited[splited.length - 1]);
    if (splited.length === 2) {
        time.day = splited[0];
    }

    return time;
}

function getTimezoneFromString(time) {
    return Number(/\+(\d*?)$/.exec(time)[1]);
}

function parseTime(time) {
    let parsed = /^(\d\d):(\d\d)\+(.*?)$/.exec(time);

    return {
        hours: Number(parsed[1]),
        minutes: Number(parsed[2]),
        timezone: Number(parsed[3])
    };
}

function normalizeTime(time, defaultTimezone) {
    let timezoneOffset = defaultTimezone - time.timezone;
    time.hours += timezoneOffset;

    return time;
}

function convertToMinutes(time) {
    let daysOrder = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    let hours = time.hours;
    if (daysOrder.indexOf(time.day) !== -1) {
        hours += daysOrder.indexOf(time.day) * 24;
    }

    return hours * 60 + time.minutes;
}

function convertToTimeSegment(time, bankTimezone) {
    return {
        from: convertStringTimeToMinutes(time.from, bankTimezone),
        to: convertStringTimeToMinutes(time.to, bankTimezone)
    };
}

function convertScheduleToSegments(schedule, bankTimezone) {
    let timesegments = [];
    let robbers = Object.keys(schedule);
    for (let i = 0; i < robbers.length; i++) {
        for (let j = 0; j < schedule[robbers[i]].length; j++) {
            timesegments.push(convertToTimeSegment(schedule[robbers[i]][j], bankTimezone));
        }
    }

    return timesegments;
}

function convertBankTimeToSegments(bankTime, bankTimezone) {
    let segments = [];
    let days = ['ПН', 'ВТ', 'СР'];
    for (let i = 0; i < days.length; i++) {
        let segment = convertToTimeSegment({
            from: days[i] + ' ' + bankTime.from,
            to: days[i] + ' ' + bankTime.to
        },
        bankTimezone);
        segments.push({ from: segment.to, to: segment.from });
    }

    return segments;
}

function convertSegmentsToTimes(segments) {
    let times = [];
    for (let segment of segments) {
        times = times.concat(convertSegmentToTimes(segment));
    }

    return times;
}

function convertSegmentToTimes(segment) {
    return [{ minutes: segment.from, isStart: true }, { minutes: segment.to, isStart: false }];
}

function convertStringTimeToMinutes(stringTime, bankTimezone) {
    let parsedTime = parseDate(stringTime);
    let normalizedTime = normalizeTime(parsedTime, bankTimezone);

    return convertToMinutes(normalizedTime);
}

function convertMinutesToDate(minutes) {
    let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    let hours = Math.floor(minutes / 60);
    minutes %= 60;
    let day = days[Math.floor(hours / 24)];
    hours %= 24;

    return { day, hours, minutes };
}
