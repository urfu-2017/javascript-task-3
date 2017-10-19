'use strict';


const MILLISECS = 1000;
const ORDER = 60;
const TRY_LATER_OFFSET = 30 * MILLISECS * ORDER;
const DAYS_OF_WEEK = 'ПН ВТ СР ЧТ ПТ СБ ВС'.split(' ');
const DAYS_INDICES = new Map(DAYS_OF_WEEK.map((d, i) => [d, i]));


function getUnixTimestamp(str) {
    let [day, ...rest] = str.split(/[\s:+]/);
    let [hour, minute, zone] = rest.map(x => parseInt(x));

    return new Date(`${DAYS_INDICES.get(day) + 1} Jan 2042 ${hour}:${minute}:00 GMT+${zone}`)
        .getTime();
}


function replaceAll(str, from, to) {
    return str.replace(new RegExp(from, 'g'), to);
}


function formatUnixTimestamp(template, time) {
    const date = new Date(time);
    const getPaddedInt = n => ('0' + n).slice(-2);

    return [
        ['%DD', DAYS_OF_WEEK[date.getDate() - 1]],
        ['%HH', date.getHours()],
        ['%MM', date.getMinutes()]
    ].reduce((acc, curr) => replaceAll(acc, curr[0], getPaddedInt(curr[1])), template);
}


class TimeSpan {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    static fromStrings(from, to) {
        return new TimeSpan(
            getUnixTimestamp(from),
            getUnixTimestamp(to)
        );
    }

    isSubsetOf(other) {
        return this.from >= other.from && this.to <= other.to;
    }

    intersectsWith(other) {
        return this.isSubsetOf(other) || other.isSubsetOf(this) ||
            (this.from < other.from && this.to > other.from) ||
            (this.to > other.to && this.from < other.to);
    }

    union(other) {
        return new TimeSpan(
            this.from < other.from ? this.from : other.from,
            this.to > other.to ? this.to : other.to
        );
    }

    toString() {
        return `${this.from} - ${this.to}`;
    }
}


class Schedule {
    constructor(intervals, workingIntervals, duration) {
        this.intervals = Schedule.uniteIntersectingIntervals(intervals);
        this.workingIntervals = workingIntervals;
        this.duration = duration;

        this.generator = this.generateResults();
        this.currentResult = this.generator.next().value;
    }

    static uniteIntersectingIntervals(intervals) {
        const result = [];
        if (intervals.length === 0) {
            return result;
        }
        intervals.sort();
        result.push(intervals[0]);
        for (let i = 1; i < intervals.length; i++) {
            const lastAdded = result.pop();
            if (lastAdded.intersectsWith(intervals[i])) {
                result.push(lastAdded.union(intervals[i]));
            } else {
                result.push(lastAdded);
                result.push(intervals[i]);
            }
        }

        return result;
    }

    * findWithinInterval(interval) {
        let offset = Math.max((this.currentResult + TRY_LATER_OFFSET) || 0,
            interval.from);
        let end = offset + this.duration;
        while (end <= interval.to) {
            const opportunity = new TimeSpan(offset, end);
            const intersection = this.intervals
                .find(i => opportunity.intersectsWith(i));
            if (intersection !== undefined) {
                offset = intersection.to;
            } else {
                yield opportunity.from;
                offset += TRY_LATER_OFFSET;
            }
            end = offset + this.duration;
        }
    }

    * generateResults() {
        for (let day of this.workingIntervals) {
            yield* this.findWithinInterval(day);
        }
    }

    /**
     * Найдено ли время
     * @returns {Boolean}
     */
    exists() {
        return this.currentResult !== undefined;
    }


    /**
     * Возвращает отформатированную строку с часами для ограбления
     * Например,
     *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
     * @param {String} template
     * @returns {String}
     */
    format(template) {
        if (!this.exists()) {
            return '';
        }

        return formatUnixTimestamp(template, this.currentResult, this.bankZone);
    }


    /**
     * Попробовать найти часы для ограбления позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        const next = this.generator.next();
        if (!next.done) {
            this.currentResult = next.value;

            return true;
        }

        return false;
    }
}

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
    const intervals = Object.values(schedule)
        .reduce((all, curr) => all.concat(curr), [])
        .map(int => TimeSpan.fromStrings(int.from, int.to));

    const workingIntervals = DAYS_OF_WEEK.slice(0, 3)
        .map(
            day => TimeSpan.fromStrings(
                `${day} ${workingHours.from}`,
                `${day} ${workingHours.to}`
            )
        );

    return new Schedule(intervals, workingIntervals, duration * MILLISECS * ORDER);
};
