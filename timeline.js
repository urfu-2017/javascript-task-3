'use strict';

const TIME_FORMAT = /^([А-Я]{2})\s([01]?[0-9]|2[0-3]):([0-5][0-9]|[0-9])\+(\d+)$/;
const DAYS = { 'ПН': '01', 'ВТ': '02', 'СР': '03', 'ЧТ': '04', 'ПТ': '05', 'СБ': '06', 'ВС': '07' };

class Timeline {

    constructor(from, to) {
        if (typeof from === 'string' && typeof to === 'string') {
            this._parseDateString(from, to);
        } else {
            this.from = from;
            this.to = to;
        }
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

    /**
     * Преобразует строковое представление времени в unixtime
     * @param {Timeline} from
     * @param {Timeline} to
     */
    _parseDateString(from, to) {
        const [, df, hf, mf] = TIME_FORMAT.exec(from);
        const [, dt, ht, mt, zone] = TIME_FORMAT.exec(to);

        this.timezone = Number(zone);
        this.dayFrom = df;
        this.dayTo = dt;

        this.from = Date.parse(`${DAYS[df]} Jan 2017 ${hf}:${mf}:00 GMT+${this.timezone}`);
        this.to = Date.parse(`${DAYS[dt]} Jan 2017 ${ht}:${mt}:00 GMT+${this.timezone}`);
    }
}

exports.Timeline = Timeline;
