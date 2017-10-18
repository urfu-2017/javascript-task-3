'use strict';

const TIME_FORMAT = /^([А-Я]{2})\s([01]?[0-9]|2[0-3]):([0-5][0-9]|[0-9])\+(\d+)$/;
const DAYS = { 'ПН': '01', 'ВТ': '02', 'СР': '03', 'ЧТ': '04', 'ПТ': '05', 'СБ': '06', 'ВС': '07' };

/**
 * Преобразует строковое представление времени в unixtime
 * @param {String} date
 * @returns {Number}
 */
function parseDateString(date) {
    const [, day, hours, minutes, timezone] = TIME_FORMAT.exec(date);

    return Date.parse(`${DAYS[day]} Jan 2017 ${hours}:${minutes}:00 GMT+${timezone}`);
}

class Timeline {

    constructor(from, to) {
        this.from = typeof from === 'string' ? parseDateString(from) : from;
        this.to = typeof to === 'string' ? parseDateString(to) : to;
    }

    /**
     * Объединяет временные отрезки
     * @param {Timeline} timeline
     * @returns {Timeline}
     */
    union(timeline) {
        const from = this.from <= timeline.from ? this.from : timeline.from;
        const to = this.to >= timeline.to ? this.to : timeline.to;

        return new Timeline(from, to);
    }

    /**
     * Пересекаются ли временные отрезки
     * @param {Timeline} timeline
     * @returns {Boolean}
     */
    isIntersected(timeline) {
        return this._isInclude(timeline) || timeline._isInclude(this) ||
            (this.from < timeline.from && this.to > timeline.from) ||
            (this.to > timeline.to && this.from < timeline.to);
    }

    /**
     * Содержится ли временной отрезок в другом
     * @param {Timeline} timeline
     * @returns {Boolean}
     */
    _isInclude(timeline) {
        return this.from <= timeline.from && this.to >= timeline.to;
    }
}

exports.Timeline = Timeline;
exports.DAYS = DAYS;
