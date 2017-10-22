'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const TIME_FORMAT = /^([А-Я]{2})\s([01]?\d|2[0-3]):([0-5]\d|\d)\+(\d{1,2})$/;
const DAYS = { 'ПН': '01', 'ВТ': '02', 'СР': '03', 'ЧТ': '04', 'ПТ': '05', 'СБ': '06', 'ВС': '07' };
const MILLIS_IN_MIN = 60 * 1000;
const MILLIS_IN_HOUR = 60 * MILLIS_IN_MIN;
const LATER_OFFSET = 30 * MILLIS_IN_MIN;

/**
 * Модель для представления временного интервала
 */
class TimeInterval {
    constructor(start, end) {
        if (start !== undefined && end !== undefined) {
            this._parse(start, end);
        }
    }

    _convertToDate(dayStart, hours, minutes, timezone) {
        return Date.parse(`${DAYS[dayStart]} Jan 2017 ${hours}:${minutes}:00 GMT+${timezone}`);
    }

    /**
     * Преобразует в Date строковое представление времени
     * @param {String} start
     * @param {String} end
     */
    _parse(start, end) {
        const [, dayStart, hoursStart, minutesStart] = TIME_FORMAT.exec(start);
        const [, dayEnd, hoursEnd, minutesEnd, timezone] = TIME_FORMAT.exec(end);

        this.unparsedStart = start;
        this.unparsedEnd = end;

        this.timezone = parseInt(timezone, 10);
        this.dayStart = dayStart;
        this.dayEnd = dayEnd;

        this._setRange(
            this._convertToDate(this.dayStart, hoursStart, minutesStart, this.timezone),
            this._convertToDate(this.dayEnd, hoursEnd, minutesEnd, this.timezone)
        );
    }

    cloneWithRange(start, end) {
        return Object.assign(new TimeInterval(), this)._setRange(start, end);
    }

    _setRange(start, end) {
        this.start = start;
        this.end = end;

        return this;
    }

    /**
     * Проверяет вхождение переданного временного интервала в текущий
     * @param {TimeInterval} interval - переданный интервал
     * @returns {Boolean}
     */
    includes(interval) {
        return this.start <= interval.start && this.end >= interval.end;
    }

    /**
     * Объединяет текущий и переданный временные интервалы в один
     * @param {TimeInterval} interval - объединяемый интервал
     * @returns {TimeInterval} - интервал, включающий в себя оба интервала
     */
    combine(interval) {
        return new TimeInterval(interval.unparsedStart, interval.unparsedEnd)
            ._setRange(Math.min(this.start, interval.start), Math.max(this.end, interval.end));
    }

    /**
     * Проверяет текущий и переданный временные интервалы на пересечение
     * @param {TimeInterval} interval – проверяемый интервал
     * @returns {Boolean}
     */
    intersects(interval) {
        return this.includes(interval) || interval.includes(this) ||
            this.leftIntersects(interval) || interval.leftIntersects(this);
    }

    leftIntersects(interval) {
        return (this.start < interval.start && this.end > interval.start);
    }
}

/**
 * Модель для представления результата работы программы
 */
class Response {
    constructor(intervals) {
        this.intervals = intervals;
        this.currentInterval = intervals[0];
    }

    /**
     * Возвращает true, если временной интервал существует
     * @returns {Boolean}
     */
    exists() {
        return this.currentInterval !== undefined;
    }

    /**
     * Возвращает отформатированную строку с часами для ограбления
     * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
     * @param {String} template
     * @returns {String}
     */
    format(template) {
        if (!this.exists()) {
            return '';
        }

        let date = new Date(this.currentInterval.start);
        let timezone = this.currentInterval.timezone + date.getTimezoneOffset() / 60;
        date.setTime(this.currentInterval.start + timezone * MILLIS_IN_HOUR);

        return template.replace('%HH', this.toTimePattern(date.getHours()))
            .replace('%MM', this.toTimePattern(date.getMinutes()))
            .replace('%DD', this.currentInterval.dayStart);
    }

    toTimePattern(value) {
        return ('0' + value).slice(-2);
    }

    /**
     * Попробовать найти часы для ограбления на LATER_MILLISEC позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        let result = this.intervals.find(interval => {
            return interval.start >= LATER_OFFSET + this.currentInterval.start;
        });

        if (result !== undefined) {
            this.currentInterval = result;
        }

        return result !== undefined;
    }
}

/**
 * Рекурсивная апроксимация пересекающихся временных интервалов
 * @param {Array} array – массив временных интервалов
 * @returns {Array}
 */
const optimizeIntervals = array => {
    let data = array.reduce((result, current) => {
        let index = result.findIndex(interval => interval.intersects(current));
        if (index !== -1) {
            result[index] = result[index].combine(current);

            return result;
        }

        return result.concat(current);
    }, []);

    return (data.length === array.length) ? data : optimizeIntervals(data);
};

const workIntervals = (employment, works, duration) => works.reduce((result, interval) => {
    const durationOffset = (duration * MILLIS_IN_MIN);
    for (let i = interval.start; i <= interval.end - durationOffset; i += MILLIS_IN_MIN) {
        let robberyInterval = interval.cloneWithRange(i, i + durationOffset);

        if (employment.every((segment) => !segment.intersects(robberyInterval))) {
            result.push(robberyInterval);
        }
    }

    return result;
}, []);

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = (schedule, duration, workingHours) => {
    const worksIntervals = ['ПН ', 'ВТ ', 'СР ']
        .map(day => new TimeInterval(day + workingHours.from, day + workingHours.to));

    let employmentIntervals = Object.values(schedule)
        .reduce((result, current) => result.concat(current), [])
        .map(interval => new TimeInterval(interval.from, interval.to));

    let optimizedIntervals = optimizeIntervals(employmentIntervals);

    return new Response(workIntervals(optimizedIntervals, worksIntervals, duration));
};
