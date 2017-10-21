'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

let DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let ROBBERY_INTERVAL = 30;
let MINUTES_IN_DAY = 24 * 60;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let currentRobberyIndex = 0;
    let availableRobberyDates = [];
    let bankTimezone = getTimezoneFromString(workingHours.from);
    let timesegments = convertScheduleToSegments(schedule, bankTimezone);
    let banksegments = convertBankTimeToSegments(workingHours, bankTimezone);
    timesegments = timesegments.concat(banksegments);
    let timePoints = convertSegmentsToTimes(timesegments);
    availableRobberyDates = searchFreeDates(timePoints, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return currentRobberyIndex < availableRobberyDates.length;
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

            return formatTime(availableRobberyDates[currentRobberyIndex], template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            currentRobberyIndex++;
            if (this.exists()) {
                return true;
            }
            currentRobberyIndex--;

            return false;
        }
    };
};

function getRobberyTimesFromFreeSegment(segment, robberyDuration) {
    let times = [];
    let currentTime = segment.from;
    while (currentTime + robberyDuration <= segment.to) {
        times.push(currentTime);
        currentTime += ROBBERY_INTERVAL;
    }

    return times;
}

function searchFreeSegments(timePoints) {
    let currentNesting = 0;
    let freeSegments = [];
    let currentStartTime = 0;
    for (let timePoint of timePoints) {
        if (currentNesting === 0) {
            freeSegments.push({ from: currentStartTime, to: timePoint.minutes });
        }
        if (timePoint.isStart) {
            currentNesting++;
        } else {
            currentNesting--;
        }
        currentStartTime = timePoint.minutes;
    }

    return freeSegments;
}

function compareTimePoints(time1, time2) {
    return time1.minutes - time2.minutes;
}

function searchFreeDates(timePoints, duration) {
    timePoints.sort(compareTimePoints);
    let freeSegments = searchFreeSegments(timePoints);
    let robberyTimes = freeSegments.reduce(
        (prev, segment) => prev.concat(getRobberyTimesFromFreeSegment(segment, duration)),
        []
    );
    let freeDates = robberyTimes.map(convertMinutesToDate);

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
    time.day = splited[0];

    return time;
}

function getTimezoneFromString(time) {
    return Number(/\+(\d+)$/.exec(time)[1]);
}

function parseTime(time) {
    let parsed = /^(\d\d):(\d\d)\+(\d+)$/.exec(time);

    return {
        hours: Number(parsed[1]),
        minutes: Number(parsed[2]),
        timezone: Number(parsed[3])
    };
}

function normalizeMinutes(minutes, currentTimeZone, defaultTimezone) {
    let timezoneOffset = defaultTimezone - currentTimeZone;
    minutes += timezoneOffset * 60;

    return minutes;
}

function convertToMinutes(time) {
    let hours = time.hours;
    let indexOfDayInWeek = DAYS_OF_WEEK.indexOf(time.day);
    if (indexOfDayInWeek !== -1) {
        hours += indexOfDayInWeek * 24;
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
    for (let robber of Object.keys(schedule)) {
        for (let robberyTime of schedule[robber]) {
            timesegments.push(convertToTimeSegment(robberyTime, bankTimezone));
        }
    }

    return timesegments;
}

function convertBankTimeToSegments(bankTime, bankTimezone) {
    let days = DAYS_OF_WEEK.slice(0, 3);
    let segments = [];
    for (let day of days) {
        let segment = convertToTimeSegment({
            from: `${day} ${bankTime.from}`,
            to: `${day} ${bankTime.to}`
        },
        bankTimezone);

        // временные отрезки, когда банк "занят" (его нельзя ограбить)
        segments.push({ from: getMinutesOfDayOfWeekStart(day), to: segment.from });
        segments.push({ from: segment.to, to: getMinutesOfDayOfWeekEnd(day) });
    }

    return segments;
}

function getMinutesOfDayOfWeekStart(dayOfWeek) {
    return DAYS_OF_WEEK.indexOf(dayOfWeek) * MINUTES_IN_DAY;
}

function getMinutesOfDayOfWeekEnd(daysOfWeek) {
    return getMinutesOfDayOfWeekStart(daysOfWeek) + MINUTES_IN_DAY - 1;
}

function convertSegmentsToTimes(segments) {
    return segments.reduce((times, segment) => times.concat(convertSegmentToTimes(segment)), []);
}

function convertSegmentToTimes(segment) {
    return [{ minutes: segment.from, isStart: true }, { minutes: segment.to, isStart: false }];
}

function convertStringTimeToMinutes(stringTime, bankTimezone) {
    let parsedTime = parseDate(stringTime);
    let minutes = convertToMinutes(parsedTime);

    return normalizeMinutes(minutes, parsedTime.timezone, bankTimezone);
}

function convertMinutesToDate(minutes) {
    let hours = Math.floor(minutes / 60);
    minutes %= 60;
    let day = DAYS_OF_WEEK[Math.floor(hours / 24)];
    hours %= 24;

    return { day, hours, minutes };
}
