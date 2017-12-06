'use strict';

exports.isStar = true;

const DAYS = ['ПН', 'ВТ', 'СР'];
const MIN_HOUR = 60;
const MIN_DAY = 1440;
const HALF_HOUR = 30;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {

    let freeTimeIntervals = getFreeTimeIntervals(schedule, duration, workingHours);
    let freeTime = freeTimeIntervals.length === 0 ? -1 : freeTimeIntervals[0][0];
    let goodTimeIntervals = getGoodTimeIntervals(freeTimeIntervals, duration);
    let tryLaterCount = 1;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return freeTime >= 0;
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
            let day = Math.floor(freeTime / MIN_DAY);
            let hours = Math.floor((freeTime - day * MIN_DAY) / MIN_HOUR);
            let minutes = freeTime - day * MIN_DAY - hours * MIN_HOUR;
            day = DAYS[day];

            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (hours < 10) {
                hours = '0' + hours;
            }

            return template.replace(/%DD/, day)
                .replace(/%HH/, hours)
                .replace(/%MM/, minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists() || goodTimeIntervals.length === tryLaterCount) {
                return false;
            }
            freeTime = goodTimeIntervals[tryLaterCount];
            tryLaterCount++;

            return true;
        }
    };
};

function mergeTimeRange(timeArray) {
    let sortedTimeArray = timeArray.sort(function (firstRange, secondRange) {
        return firstRange[0] - secondRange[0];
    });
    let resultTimeArray = [];
    let start = sortedTimeArray[0][0];
    let finish = sortedTimeArray[0][1];

    for (let i = 1; i < sortedTimeArray.length; i++) {
        if (sortedTimeArray[i][0] <= finish) {
            finish = Math.max(sortedTimeArray[i][1], finish);
        } else {
            resultTimeArray.push([start, finish]);
            start = sortedTimeArray[i][0];
            finish = sortedTimeArray[i][1];
        }
    }

    resultTimeArray.push([start, finish]);

    return resultTimeArray;
}

function getTimeZone(time) {
    return time.match(/\d+$/);
}

function getTimestamp(time, utc = null) {
    time = time.match(/^(ПН|ВТ|СР)?\s?(\d{2}):(\d{2})\+(\d+)$/);
    let day = time[1] ? MIN_DAY * DAYS.indexOf(time[1]) : 0;
    utc = utc ? utc : Number(time[4]);

    return Number(time[3]) + MIN_HOUR * (Number(time[2]) + (utc - Number(time[4]))) + day;
}

function getBusyTimeIntervals(schedule, workingHours) {
    let intervals = [];

    for (let name in schedule) {
        if (schedule.hasOwnProperty(name)) {
            intervals = intervals.concat(getBusyTimeInterval(schedule[name], workingHours));
        }
    }

    let bankStart = getTimestamp(workingHours.from);
    let bankFinish = getTimestamp(workingHours.to);

    intervals.push([0, bankStart], [bankFinish, bankStart + MIN_DAY],
        [bankFinish + MIN_DAY, bankStart + MIN_DAY * 2],
        [bankFinish + MIN_DAY * 2, MIN_DAY * 3 - 1]);

    return intervals;
}

function getBusyTimeInterval(schedule, workingHours) {
    let timeArray = schedule.map((item) => {
        return [getTimestamp (item.from, getTimeZone(workingHours.from)),
            getTimestamp (item.to, getTimeZone(workingHours.from))];
    });

    return timeArray;
}

function getFreeTimeIntervals(schedule, duration, workingHours) {
    let busyIntervals = mergeTimeRange(getBusyTimeIntervals(schedule, workingHours));
    let start = busyIntervals[0][1];
    let resultArray = [];

    busyIntervals.forEach((interval) => {
        let finish = interval[0];
        if (finish - start >= duration) {
            resultArray.push([start, finish]);
        }
        start = interval[1];
    });

    return resultArray;
}

function getGoodTimeIntervals(freeTimeIntervals, duration) {
    if (!freeTimeIntervals.length) {
        return [];
    }

    let resultArray = [];

    freeTimeIntervals.forEach((interval) => {
        let freeTime = interval[0];
        while (freeTime + duration <= interval[1]) {
            resultArray.push(freeTime);
            freeTime += HALF_HOUR;
        }
    });

    return resultArray;
}
