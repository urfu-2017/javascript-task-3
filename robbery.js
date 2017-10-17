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
    let banksWorkingHours = parseTimeInterval(workingHours);
    let momentsWhenBankIsClosed = getMomentsWhenBankIsClosed(banksWorkingHours);
    let busyMoments = getTimeIntervalsWithBankTimezone(schedule, banksWorkingHours.from.timeZone)
        .concat(momentsWhenBankIsClosed)
        .sort((x, y) => dateTime.compareDatetimes(x.from, y.from));

    let appropriateMoments = getAppropriateMoments(unionTimeIntervals(busyMoments), duration);

    return {
        robberyDuration: duration,
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

            return template.replace(/%(?:(?:HH)|(?:DD)|(?:MM))/g,
                match => replaceMatched(match, robberyBeginning));
        },

        /**
         * @returns {Boolean}
         */
        tryLater: function () {
            let startTime = appropriateMoments[this.currentMomentIndex].from;
            let waitingTime = this.robberyTimeout;
            for (let i = this.currentMomentIndex; i < appropriateMoments.length; i++) {
                let moment = appropriateMoments[i];
                waitingTime -= dateTime.getElapsedMinutes(startTime, moment.from);
                let momentDuration = getMomentDurationInMinutes(moment);
                if (momentDuration < this.robberyDuration + waitingTime) {
                    continue;
                }
                this.currentMomentIndex = i;
                dateTime.addMinutes(moment.from, waitingTime > 0 ? waitingTime : 0);

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
    return { from: dateTime.parse(timeInterval.from), to: dateTime.parse(timeInterval.to) };
}

function getTimeIntervalsWithBankTimezone(schedule, bankTimeZone) {
    return Object.values(schedule).reduce((a, b) => a.concat(b))
        .map(function (x) {
            let timeInterval = parseTimeInterval(x);
            Object.values(timeInterval).map(t => dateTime.changeTimeZone(t, bankTimeZone));

            return timeInterval;
        });
}

function getMomentsWhenBankIsClosed(workingHours) {
    let moments = [];
    for (let currentDay of ['ПН', 'ВТ', 'СР']) {
        let timeBeforeOpening = { from: { day: currentDay, hours: 0, minutes: 0 },
            to: { day: currentDay, hours: workingHours.from.hours,
                minutes: workingHours.from.minutes } };
        let timeAfterClosing = { to: { day: currentDay, hours: 23, minutes: 59 },
            from: { day: currentDay, hours: workingHours.to.hours,
                minutes: workingHours.to.minutes } };
        moments.push(timeBeforeOpening, timeAfterClosing);
    }

    return moments;
}

function unionTimeIntervals(timeIntervals) {
    let resultIntervals = [];
    resultIntervals.push(timeIntervals[0]);

    for (let i = 1; i < timeIntervals.length; i++) {
        let currentInterval = timeIntervals[i];
        let lastAdded = resultIntervals[resultIntervals.length - 1];
        if (dateTime.equals(lastAdded.from, currentInterval.from) &&
        dateTime.equals(lastAdded.to, currentInterval.to)) {
            continue;
        }

        if (dateTime.compareDatetimes(lastAdded.to, currentInterval.from) > 0) {
            lastAdded.to = dateTime.compareDatetimes(currentInterval.to, lastAdded.to) > 0
                ? currentInterval.to
                : lastAdded.to;
        } else {
            resultIntervals.push(currentInterval);
        }
    }

    return resultIntervals;
}

function getAppropriateMoments(busyMoments, robberyDuration) {
    let appropriateMoments = [];
    for (let i = 0; i < busyMoments.length - 1; i++) {
        let freeInterval = { from: busyMoments[i].to, to: busyMoments[i + 1].from };
        if (getMomentDurationInMinutes(freeInterval) >= robberyDuration) {
            appropriateMoments.push(freeInterval);
        }
    }

    return appropriateMoments;
}

function getMomentDurationInMinutes(timeInterval) {
    return dateTime.getElapsedMinutes(timeInterval.from, timeInterval.to);
}
