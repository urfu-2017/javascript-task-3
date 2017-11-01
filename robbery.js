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

const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР'];

function convertToHours(mins) {
    const hours = parseInt(mins / 60);
    const minutes = mins % 60;

    return convertTo24Format(hours) + ':' + convertTo24Format(minutes);
}

function convertTo24Format(time) {
    return time < 10 ? '0' + time : time;
}

function convertToMinutes(time) {
    const [hours, mins] = time
        .split(':')
        .map(x => parseInt(x));

    return (hours * 60) + mins;
}

function getMax(maxFrom, current) {
    const maxValue = Math.max(maxFrom, current);

    return convertToHours(maxValue);
}

function customSort(x, y) {
    const dayFromX = x.day;
    const dayFromY = y.day;

    if (dayFromX !== dayFromY) {
        return DAYS_OF_WEEK.indexOf(dayFromX) - DAYS_OF_WEEK.indexOf(dayFromY);
    }

    const getTime = X => X.match(/\d{1,2}/g).join('');
    const timeFromX = getTime(x.from);
    const timeFromY = getTime(y.from);
    const timeToX = getTime(x.to);
    const timeToY = getTime(y.to);

    if (timeFromX !== timeFromY) {
        return timeFromX - timeFromY;
    }

    return timeToX - timeToY;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {

    function convertToBankTimezone(str) {
        const bankTimezone = parseInt(workingHours.from.split('+')[1]);
        const day = str.split(' ')[0];
        const time = str.match(/\d{1,2}/g);
        let newHours = parseInt(time[0]) + bankTimezone - str.split('+')[1];

        if (isNaN(str.split('+')[1])) {
            return '';
        }
        if (newHours > 24) {
            newHours -= 24;
        } else if (newHours < 0) {
            newHours += 24;
        }

        return day + ' ' + convertTo24Format(newHours) + ':' + time[1] + '+' + bankTimezone;
    }

    function splitIntervalsOverDay(robber, record) {
        const dayOfWeek = schedule[robber][record].from.slice(0, 2);

        if (DAYS_OF_WEEK.indexOf(schedule[robber][record].to.slice(0, 2)) === -1) {
            schedule[robber][record].to = 'СР 23:59+5';
        }
        if (dayOfWeek === 'ПН' && schedule[robber][record].to.slice(0, 2) === 'СР') {
            schedule[robber].push({
                from: 'СР 00:00+5',
                to: 'CP' + schedule[robber][record].to.slice(2)
            });
            schedule[robber].push({
                from: 'ВТ 00:00+5',
                to: 'ВТ 23:59+5'
            });
            schedule[robber][record].to = 'ПН 23:59+5';
        } else if (dayOfWeek !== schedule[robber][record].to.slice(0, 2)) {
            schedule[robber].push({
                from: schedule[robber][record].to.slice(0, 2) + ' 00:00+5',
                to: schedule[robber][record].to
            });
            schedule[robber][record].to = dayOfWeek + ' 23:59+5';
        }
    }

    function cutForBankHours(robber) {
        schedule[robber].forEach(function (record) {
            let from = convertToMinutes(record.from.slice(3, 8));
            let to = convertToMinutes(record.to.slice(3, 8));
            let bankFrom = convertToMinutes(workingHours.from.split('+')[0]);
            let bankTo = convertToMinutes(workingHours.to.split('+')[0]);

            if (from <= bankFrom) {
                record.from = record.from.slice(0, 3) +
                    workingHours.from;
            }
            if (to >= bankTo) {
                record.to = record.from.slice(0, 3) +
                    workingHours.to;
            }
        });
    }

    function convertByBankRange() {
        for (let robber in schedule) {
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            cutForBankHours(robber);
        }
    }

    function addRecordWhenBusy(day, robber, intervals) {
        schedule[robber].reduce(function (acc, record) {
            if (record.from.slice(0, 2) === DAYS_OF_WEEK[day]) {
                acc.push({
                    day: DAYS_OF_WEEK[day],
                    from: record.from.match(/\d{1,2}:\d{1,2}/g).toString(),
                    to: record.to.match(/\d{1,2}:\d{1,2}/g).toString()
                });
            }

            return acc;
        }, intervals);
    }

    function addRecordInCorrectForm(robber) {
        schedule[robber] = schedule[robber].filter(function (record) {
            return convertToBankTimezone(record.from) !== '' &&
                convertToBankTimezone(record.to) !== '';
        });
        schedule[robber].forEach(function (record, index) {
            record.from = convertToBankTimezone(record.from);
            record.to = convertToBankTimezone(record.to);
            splitIntervalsOverDay(robber, index);
        });
    }

    function setScheduleCorrectForm() {
        for (let robber in schedule) {
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            addRecordInCorrectForm(robber);
            schedule[robber] = schedule[robber].filter(function (rec) {
                let from = convertToMinutes(rec.from.slice(3, 8));
                let to = convertToMinutes(rec.to.slice(3, 8));
                let bankFrom = convertToMinutes(workingHours.from.split('+')[0]);
                let bankTo = convertToMinutes(workingHours.to.split('+')[0]);

                return (from > bankFrom || to > bankFrom) && (from < bankTo || to < bankTo);
            });
        }
        convertByBankRange();
    }

    function createScheduleWhenBusy(day, intervals) {
        for (let robber in schedule) {
            if (!schedule.hasOwnProperty(robber)) {
                continue;
            }
            addRecordWhenBusy(day, robber, intervals);
        }
    }

    function createScheduleWhenFree(day, result, intervals) {
        let maxFrom = 0;

        intervals.reduce(function (prev, cur) {
            intervals.sort(customSort);
            let intervalFrom = prev.to;
            let intervalTo = cur.from;

            if (maxFrom <= convertToMinutes(prev.to)) {
                maxFrom = convertToMinutes(prev.to);
            }
            if (convertToMinutes(cur.from) - convertToMinutes(prev.to) >= duration) {
                intervalFrom = getMax(maxFrom, convertToMinutes(prev.to));
                if (convertToMinutes(intervalTo) - convertToMinutes(intervalFrom) >= duration) {
                    result.push({
                        day: DAYS_OF_WEEK[day],
                        from: intervalFrom,
                        to: intervalTo
                    });
                }
            }

            return cur;
        });
    }

    function checkRangeLimits(day, result, intervals) {
        intervals.sort(customSort);
        const minFrom = intervals[0].from;
        const getTime = x => x.to.match(/\d{2}/g).join('');
        const bankFrom = workingHours.from.split('+')[0];
        const bankTo = workingHours.to.split('+')[0];
        intervals.sort(function (x, y) {

            return getTime(x) - getTime(y);
        });
        let maxTo = intervals[intervals.length - 1].to;

        if (convertToMinutes(minFrom) - convertToMinutes(bankFrom) >= duration) {
            result.push({
                day: DAYS_OF_WEEK[day],
                from: bankFrom.slice(0, 2) + ':' + bankFrom.slice(3),
                to: minFrom.slice(0, 2) + ':' + minFrom.slice(3)
            });
        }
        if (convertToMinutes(bankTo) - convertToMinutes(maxTo) >= duration) {
            result.push({
                day: DAYS_OF_WEEK[day],
                from: maxTo.slice(0, 2) + ':' + maxTo.slice(3),
                to: bankTo.slice(0, 2) + ':' + bankTo.slice(3)
            });
        }
    }

    function getResultsForTryLater(cur, record, result) {
        const nextRange = convertToMinutes(record.to) - duration;

        while (cur + 30 <= nextRange) {
            cur += 30;
            result.push({
                day: record.day,
                from: convertToHours(cur),
                to: convertToHours(cur + duration)
            });
        }
    }

    function modifyResult(result) {
        result.sort(customSort)
            .forEach(function (record) {
                if (convertToMinutes(record.to) - convertToMinutes(record.from) >=
                    duration + 30) {
                    let cur = convertToMinutes(record.from);
                    getResultsForTryLater(cur, record, result);
                    record.to = convertToHours(convertToMinutes(record.from) + duration);
                }
            });
        result.sort(customSort);
    }

    function formResult(intervals, result) {
        const bankFrom = workingHours.from.split('+')[0];
        const bankTo = workingHours.to.split('+')[0];

        DAYS_OF_WEEK.forEach(function (day, index) {
            createScheduleWhenBusy(index, intervals);
            intervals.sort(customSort);
            if (workingHours.from !== workingHours.to && intervals.length === 0 &&
                convertToMinutes(bankTo) - convertToMinutes(bankFrom) >= duration) {
                result.push({
                    day: day,
                    from: bankFrom,
                    to: bankTo
                });
            } else if (intervals.length === 1) {
                checkRangeLimits(index, result, intervals);
            } else if (intervals.length > 1) {
                createScheduleWhenFree(index, result, intervals);
                checkRangeLimits(index, result, intervals);
            }
            intervals = [];
        });
    }

    function getRobberySchedule() {
        let intervals = [];
        let result = [];

        if (duration <= 0 || duration > 1439) {
            return [];
        }
        setScheduleCorrectForm();
        formResult(intervals, result);
        if (result.length !== 0) {
            modifyResult(result);
        }

        return result;
    }

    return {

        daysForRobbery: getRobberySchedule(),

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return this.daysForRobbery.length > 0;
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
                return ('');
            }
            const day = this.daysForRobbery[0].day;
            const from = this.daysForRobbery[0].from.split(':');

            return template.replace('%HH', from[0])
                .replace('%MM', from[1])
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const days = this.daysForRobbery.length;
            if (days === 0) {
                return false;
            }
            let willRob = days > 1;

            if (willRob) {
                this.daysForRobbery.splice(0, 1);
            }

            return willRob;
        }
    };
};
