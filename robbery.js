'use strict';

exports.isStar = true;
var dateTime = require('./dateTime');

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let momentsWhenBankIsClosed = getMomentsWhenBankIsClosed(workingHours);
    let bankTimeZone = momentsWhenBankIsClosed[0].timeZone;
    let busyMoments = getTimeIntervalsWithBankTimezone(schedule, bankTimeZone)
        .concat(momentsWhenBankIsClosed)
        .sort((x, y) => x.from - y.from);

    let appropriateMoments = getAppropriateMoments(unionTimeIntervals(busyMoments), duration);

    return {
        duration: duration,
        currentMomentIndex: 0,
        moments: appropriateMoments,
        robberyTimeout: 30,

        /**
         * @returns {Boolean}
         */
        exists: function () {
            return this.moments.length !== 0;
        },

        /**
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (appropriateMoments.length === 0) {
                return '';
            }

            let robberyBeginning = this.moments[this.currentMomentIndex].from;
            let time = dateTime.toDateTime(robberyBeginning);

            return template.replace(/%(?:(?:HH)|(?:DD)|(?:MM))/g,
                match => replaceMatched(match, time));
        },

        /**
         * @returns {Boolean}
         */
        tryLater: function () {
            if (appropriateMoments.length === 0) {
                return false;
            }

            let startTime = appropriateMoments[this.currentMomentIndex].from;
            let waitingTime = this.robberyTimeout;

            for (let i = this.currentMomentIndex; i < appropriateMoments.length; i++) {
                let moment = appropriateMoments[i];
                waitingTime -= moment.from - startTime;

                if (moment.to - moment.from < this.duration + waitingTime) {
                    continue;
                }

                this.currentMomentIndex = i;
                moment.from += waitingTime > 0 ? waitingTime : 0;
                moment.from = moment.from > dateTime.DEADLINE
                    ? dateTime.DEADLINE
                    : moment.from;

                return true;
            }

            return false;
        }
    };
};

function replaceMatched(match, momentTime) {
    switch (match) {
        case '%DD':
            return momentTime.day;
        case '%HH':
            return momentTime.hours < 10 ? `0${momentTime.hours}` : momentTime.hours;
        case '%MM':
            return momentTime.minutes < 10 ? `0${momentTime.minutes}` : momentTime.minutes;
        default:
            return '';
    }
}

function parseTimeInterval(timeInterval) {
    let parsedStartTime = dateTime.parse(timeInterval.from);
    let parsedFinishTime = dateTime.parse(timeInterval.to);

    return {
        from: dateTime.getElapsedMinutesSinceBeginOfWeek(parsedStartTime),
        to: dateTime.getElapsedMinutesSinceBeginOfWeek(parsedFinishTime),
        timeZone: parsedStartTime.timeZone
    };
}

function getTimeIntervalsWithBankTimezone(schedule, bankTimeZone) {
    let copiedSchedule = JSON.parse(JSON.stringify(schedule));

    return Object.values(copiedSchedule).reduce((a, b) => a.concat(b))
        .map(function (x) {
            let timeInterval = parseTimeInterval(x);
            dateTime.changeTimeZone(timeInterval, bankTimeZone);

            return timeInterval;
        });
}

function getMomentsWhenBankIsClosed(workingHours) {
    let moments = [];
    for (let indexOfDay = 0; indexOfDay < dateTime.DAYS.length; indexOfDay++) {
        let timeBeforeOpening = {
            from: dateTime.DAYS[indexOfDay] + ' 00:00' + workingHours.from.slice(-2),
            to: dateTime.DAYS[indexOfDay] + ' ' + workingHours.from
        };

        let timeAfterClosing = {
            from: dateTime.DAYS[indexOfDay] + ' ' + workingHours.to,
            to: dateTime.DAYS[indexOfDay] + ' 23:59' + workingHours.to.slice(-2)
        };

        moments.push(
            parseTimeInterval(timeBeforeOpening),
            parseTimeInterval(timeAfterClosing)
        );
    }

    return moments;
}

function unionTimeIntervals(timeIntervals) {
    let resultIntervals = [];
    resultIntervals.push(timeIntervals[0]);

    for (let i = 1; i < timeIntervals.length; i++) {
        let currentInterval = timeIntervals[i];
        let lastAdded = resultIntervals[resultIntervals.length - 1];
        if (lastAdded.from === currentInterval.from && lastAdded.to === currentInterval.to) {
            continue;
        }

        if (lastAdded.to > currentInterval.from) {
            lastAdded.to = currentInterval.to > lastAdded.to ? currentInterval.to : lastAdded.to;
        } else {
            resultIntervals.push(currentInterval);
        }
    }

    return resultIntervals;
}

function getAppropriateMoments(busyMoments, duration) {
    let appropriateMoments = [];

    for (let i = 0; i < busyMoments.length - 1; i++) {
        let freeInterval = { from: busyMoments[i].to, to: busyMoments[i + 1].from };
        if (freeInterval.to - freeInterval.from >= duration) {
            appropriateMoments.push(freeInterval);
        }
    }

    return appropriateMoments;
}
