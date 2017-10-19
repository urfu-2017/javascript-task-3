'use strict';

const TIME_FORMAT = /^(ПН|ВТ|СР)\s(\d\d):(\d\d)\+(\d+)$/;
const DAYS = ['ПН', 'ВТ', 'СР'];

/**
 * Преобразует строковое представление времени в unixtime
 * @param {String} date
 * @returns {Number}
 */
function parseDateString(date) {
    const [, day, hours, minutes, timezone] = TIME_FORMAT.exec(date);

    return Date.UTC(2017, 1, DAYS.indexOf(day) + 1, hours - timezone, minutes);
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
        const from = Math.min(this.from, timeline.from);
        const to = Math.max(this.to, timeline.to);

        return new Timeline(from, to);
    }

    /**
     * Пересекаются ли временные отрезки
     * @param {Timeline} timeline
     * @returns {Boolean}
     */
    isIntersected(timeline) {
        return this.from < timeline.to && this.to > timeline.from;
    }
}

Timeline.DAYS = DAYS;
exports.default = Timeline;
