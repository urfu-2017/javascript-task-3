'use strict';

/**
 * @typedef {Object} Timeline
 * @property {Number} from
 * @property {Number} to
 */

const DATE_STRING_FORMAT = /([А-Я]{2})\s(\d\d):(\d\d)\+(\d)/;
const DAYS = { 'ПН': 1, 'ВТ': 2, 'СР': 3 };
const MIN_AS_MILLIS = 60000;
const HOUR_AS_MILLIS = 60 * MIN_AS_MILLIS;

class AppropriateMoment {

    /**
    * @param {Object} schedule – Расписание Банды
    * @param {Number} duration - Время на ограбление в минутах
    * @param {Object} workingHours – Время работы банка
    * @param {String} workingHours.from – Время открытия, например, "10:00+5"
    * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
    */
    constructor(schedule, duration, workingHours) {
        this._parseDate = this._parseDate.bind(this);
        this._parseTimeline = this._parseTimeline.bind(this);
        this._areIntersected = this._areIntersected.bind(this);
        this._mergeTimelines = this._mergeTimelines.bind(this);

        const bankSchedule = Object.keys(DAYS).map(day => this._parseTimeline({
            from: `${day} ${workingHours.from}`,
            to: `${day} ${workingHours.to}`
        }));

        const gangSchedule = this._mergeTimelines(
            Object.values(schedule).map(robber => robber.map(this._parseTimeline))
        );

        duration = duration * MIN_AS_MILLIS;

        this._moments = [];

        bankSchedule.forEach(day => {
            for (let time = day.from; time < day.to - duration; time += MIN_AS_MILLIS) {
                const timeline = { from: time, to: time + duration };
                if (!gangSchedule.some(t => this._areIntersected(t, timeline))) {
                    this._moments.push(time);
                }
            }
        });

        this._moment = this._moments[0];
        this._timezone = Number(workingHours.to.split('+')[1]);
    }

    /**
     * Возвращает true, если временной интервал существует
     * @returns {Boolean}
     */
    exists() {
        return this._moment !== undefined;
    }

    /**
     * Возвращает отформатированную строку с часами для ограбления
     * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
     * @param {String} template
     * @returns {String}
     */
    format(template) {
        if (this.exists()) {
            const date = new Date(this._moment + this._timezone * HOUR_AS_MILLIS);

            return template.replace('%HH', ('0' + date.getUTCHours()).slice(-2))
                .replace('%MM', ('0' + date.getUTCMinutes()).slice(-2))
                .replace('%DD', Object.keys(DAYS)[date.getUTCDate() - 1]);
        }

        return '';
    }

    /**
     * Попробовать найти часы для ограбления на LATER_MILLISEC позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        return false;
    }

    /**
     * Конвертирует строковое представление даты в миллисекунды
     * @param {String} date
     * @returns {Number}
     */
    _parseDate(date) {
        const [, day, hours, minutes, timezone] = date.match(DATE_STRING_FORMAT);

        return Date.UTC(2017, 5, DAYS[day], hours - timezone, minutes);
    }

    /**
     * Конвертирует строковое представление концов временных отрезков в миллисекунды
     * @param {Object} timeline – Временной отрезок
     * @param {String} timeline.from – Время начала, например, "10:00+5"
     * @param {String} timeline.to – Время окончания, например, "18:00+5" 
     * @returns {Object}
     */
    _parseTimeline(timeline) {
        return { from: this._parseDate(timeline.from), to: this._parseDate(timeline.to) };
    }

    /**
     * Пересекаются ли временные отрезки
     * @param {Timeline} timeline1 
     * @param {Timeline} timeline2 
     * @returns {Boolean}
     */
    _areIntersected(timeline1, timeline2) {
        return timeline1.from < timeline2.to && timeline1.to > timeline2.from;
    }

    /**
     * Объединяет временные отрезки, которые пересекаются
     * @param {Timeline[]} timelines
     * @returns {Timeline[]}
     */
    _mergeTimelines(timelines) {
        return timelines.slice()
            .sort((a, b) => a.from - b.from)
            .reduce((result, timeline) => {
                const last = result[result.lenght - 1];
                if (!last || !this._areIntersected(last, timeline)) {
                    return result.concat(timeline);
                }

                last.from = Math.min(last.from, timeline.from);
                last.to = Math.max(last.to, timeline.to);

                return result;
            }, []);
    }
}

exports.isStar = false;
exports.getAppropriateMoment = (schedule, duration, workingHours) =>
    new AppropriateMoment(schedule, duration, workingHours);
