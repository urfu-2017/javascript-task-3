'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const TIME_FORMAT = /^([А-Я][А-Я])[\s]([01]?[0-9]|2[0-3]):([0-5][0-9]|[0-9])[+]([0-9])$/;
const DAYS = { 'ПН': '01', 'ВТ': '02', 'СР': '03', 'ЧТ': '04', 'ПТ': '05', 'СБ': '06', 'ВС': '07' };
const MIN_IN_MILLIS = 60 * 1000;
const LATER_IN_MILLIS = 30 * MIN_IN_MILLIS;

/**
 * Модель для представления временного интервала
 */
class TimeInterval {
    constructor(start, end) {
        if (typeof start === 'string' && typeof end === 'string') {
            this.parse(start, end);
        } else {
            this.init(start, end);
        }
    }

    /**
     * Инициализирует значения концов интервала
     * @param {Date} start - начало
     * @param {Date} end - конец
     */
    init(start, end) {
        this.start = start;
        this.end = end;
    }

    /**
     * Преобразует в Date строковое представление времени
     * @param {TimeInterval} start - переданный интервал
     * @param {TimeInterval} end - переданный интервал
     */
    parse(start, end) {
        const [, df, hf, mf, zf] = TIME_FORMAT.exec(start);
        const [, dt, ht, mt, zt] = TIME_FORMAT.exec(end);

        this.dayStart = df;
        this.dayEnd = dt;

        this.init(
            Date.parse(`${DAYS[this.dayStart]} Jan 2017 ${hf}:${mf}:00 GMT+0${zf}00`),
            Date.parse(`${DAYS[this.dayEnd]} Jan 2017 ${ht}:${mt}:00 GMT+0${zt}00`)
        );
    }

    /**
     * Проверяет вхождение переданного временного интервала в текущий
     * @param {TimeInterval} interval - переданный интервал
     * @returns {Boolean}
     */
    include(interval) {
        return this.start <= interval.start && this.end >= interval.end;
    }

    /**
     * Объединяет текущий и переданный временные интервалы в один
     * @param {TimeInterval} interval - объединяемый интервал
     * @returns {TimeInterval} - интервал, включающий в себя оба интервала
     */
    combine(interval) {
        return new TimeInterval(
            (this.start <= interval.start) ? this.start : interval.start,
            (this.end >= interval.end) ? this.end : interval.end
        );
    }

    /**
     * Проверяет текущий и переданный временные интервалы на пересечение
     * @param {TimeInterval} interval – проверяемый интервал
     * @returns {Boolean}
     */
    intersect(interval) {
        return this.include(interval) ||
            (this.start < interval.start && this.end > interval.start) ||
            (this.end > interval.end && this.start < interval.end);
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
     * @param {String} field - start или end
     * @returns {Date}
     */
    getDate(field) {
        return new Date(this.currentInterval[field]);
    }

    /**
     * Возвращает отформатированную строку с часами для ограбления
     * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
     * @param {String} template
     * @returns {String}
     */
    format(template) {
        if (this.exists()) {
            return template.replace('%HH', ('0' + this.getDate('start').getHours()).slice(-2))
                .replace('%MM', ('0' + this.getDate('start').getMinutes()).slice(-2))
                .replace('%DD', this.currentInterval.dayStart);
        }

        return '';
    }

    /**
     * Попробовать найти часы для ограбления на LATER_MILLISEC позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        return this.intervals.some((interval) => {
            return (interval.start >= LATER_IN_MILLIS + this.currentInterval.start)
                ? (this.currentInterval = interval) === interval : false;
        });
    }
}

/**
 * Рекурсивная апроксимация пересекающихся временных интервалов
 * @param {Array} array – массив временных интервалов
 * @returns {Array}
 */
const approximate = (array) => {
    let result = array.reduce((previous, current) => {
        for (let i = 0; i < previous.length; i++) {
            if (previous[i].intersect(current)) {
                previous[i] = previous[i].combine(current);

                return previous;
            }
        }

        return previous.concat(current);
    }, []);

    return (result.length === array.length) ? result : approximate(result);
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = (schedule, duration, workingHours) => {
    const worksIntervals = [
        new TimeInterval('ПН ' + workingHours.from, 'ПН ' + workingHours.to),
        new TimeInterval('ВТ ' + workingHours.from, 'ВТ ' + workingHours.to),
        new TimeInterval('СР ' + workingHours.from, 'СР ' + workingHours.to)
    ];

    const array = approximate(schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus)
        .map(interval => new TimeInterval(interval.from, interval.to)));

    return new Response(worksIntervals.reduce((previous, time) => {
        for (let i = time.start; i <= time.end - (duration * MIN_IN_MILLIS); i += MIN_IN_MILLIS) {
            let interval = new TimeInterval(i, i + (duration * 60000));
            interval.dayStart = time.dayStart;
            if (array.every((value) => !value.intersect(interval))) {
                previous.push(interval);
            }
        }

        return previous;
    }, []));
};
