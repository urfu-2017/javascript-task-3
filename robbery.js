'use strict';

const DATE_FORMAT = /(ПН|ВТ|СР)\s(\d\d):(\d\d)\+(\d)/;
const DAYS = { 'ПН': 1, 'ВТ': 2, 'СР': 3 };
const MILLIS_OF_MIN = 60000;
const TRY_COOLDOWN = 30 * MILLIS_OF_MIN;

/**
 * Преобразует строковое значение даты к unixtime
 * @param {String} date
 * @returns {Number} 
 */
function parseDate(date) {
    const [, day, hours, minutes, timezone] = date.match(DATE_FORMAT);

    return Date.UTC(2017, 4, DAYS[day], hours - timezone, minutes);
}

class AppropriateMoment {

    /**
     * @param {Object} schedule – Расписание Банды
     * @param {Number} duration - Время на ограбление в минутах
     * @param {Object} workingHours – Время работы банка
     * @param {String} workingHours.from – Время открытия, например, "10:00+5"
     * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
     */
    constructor(schedule, duration, workingHours) {
        this._duration = duration * MILLIS_OF_MIN;
        this._bankTimezone = Number(workingHours.to.split('+')[1]);
        this._bankSchedule = Object.keys(DAYS).map(day => this._normalizeTimeline({
            from: `${day} ${workingHours.from}`,
            to: `${day} ${workingHours.to}`
        }));

        const gangSchedule = this._getFreeTimelines(
            this._bankSchedule[0].from,
            this._bankSchedule[this._bankSchedule.length - 1].to,
            this._mergeTimelines(Object.values(schedule).reduce((result, current) =>
                result.concat(current.map(this._normalizeTimeline)), []))
        );

        this._moments = this._getRobberyMoments(gangSchedule).reverse();
        this._moment = this._moments.pop();
    }

    /**
     * Найдено ли время
     * @returns {Boolean}
     */
    exists() {
        return Boolean(this._moment);
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

        const moment = new Date(this._moment.from);

        return template.replace('%HH', moment.getUTCHours() + this._bankTimezone)
            .replace('%MM', String(moment.getUTCMinutes()).padStart(2, '0'))
            .replace('%DD', Object.keys(DAYS)[moment.getUTCDate() - 1]);
    }

    /**
     * Попробовать найти часы для ограбления позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        if (this.exists()) {
            const newMoment = { from: this._moment.from + TRY_COOLDOWN, to: this._moment.to };
            if (newMoment.to - newMoment.from >= this._duration) {
                this._moment = newMoment;

                return true;
            } else if (this._moments.length !== 0) {
                this._moment = this._moments.pop();

                return true;
            }
        }

        return false;
    }

    /**
     * Объединяет пересекающиеся временные отрезки
     * @param {Array} timelines
     * @returns {Array}
     */
    _mergeTimelines(timelines) {
        return timelines.slice()
            .sort((a, b) => a.from - b.from)
            .reduce((result, timeline) => {
                const lastMerged = result[result.length - 1];

                if (lastMerged && this._areIntersected(timeline, lastMerged)) {
                    lastMerged.to = Math.max(timeline.to, lastMerged.to);
                } else {
                    result.push(timeline);
                }

                return result;
            }, []);
    }

    /**
     * Расчитывает свободное время в диапазоне [from, to] на основе списка занятости
     * @param {Number} from - начало диапазона
     * @param {Number} to - конец диапазона
     * @param {Array} timelines - список занятости
     * @returns {Array}
     */
    _getFreeTimelines(from, to, timelines) {
        return timelines
            .map(timeline => {
                const free = { from, to: timeline.from };
                from = timeline.to;

                return free;
            })
            .concat({ from, to });
    }

    /**
     * Подбирает время ограбления
     * @param {Array} gangSchedule - расписание свободного времени банды
     * @returns {Array}
     */
    _getRobberyMoments(gangSchedule) {
        return this._bankSchedule.reduce((result, day) => {
            gangSchedule.forEach(t => {
                if (this._areIntersected(t, day)) {
                    result.push({
                        from: Math.max(day.from, t.from),
                        to: Math.min(day.to, t.to)
                    });
                }
            });

            return result;
        }, []).filter(t => t.to - t.from >= this._duration);
    }

    /**
     * Пересекаются ли временные отрезки
     * @param {Object} timeline1 
     * @param {Object} timeline2
     * @returns {Boolean} 
     */
    _areIntersected(timeline1, timeline2) {
        return timeline1.from <= timeline2.to && timeline1.to >= timeline2.from;
    }

    /**
     * Конвертирует строковое преставление границ временного отрезка в unixtime
     * @param {Object} timeline
     * @param {String} timeline.from
     * @param {String} timeline.to
     * @returns {Object}
     */
    _normalizeTimeline(timeline) {
        return { from: parseDate(timeline.from), to: parseDate(timeline.to) };
    }
}

exports.isStar = true;
exports.getAppropriateMoment = (schedule, duration, workingHours) =>
    new AppropriateMoment(schedule, duration, workingHours);
