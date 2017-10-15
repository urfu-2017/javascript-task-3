'use strict';

exports.Timespan = Timespan;
exports.Time = Time;
let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

exports.days = days;

/**
 * @typedef TimeTotal
 * @prop {Number} total
 * @prop {Number} offset
 * @prop {Number} day
 */
/**
 * @class Time
 * @param {Object} time String or Number (if total)
 * @param {Number} offset
 * @property {Number} minutes  
 * @property {Number} hours
 * @property {Number} offset
 * @property {Number} day
 */
function Time(time, offset) {
    if (typeof(time) === 'string' || time instanceof String) {
        if (time.length < 10) {
            this.hours = Number(time.substring(0, 2));
            this.minutes = Number(time.substring(3, 5));
            this.offset = Number(time.substring(6, 7));
        } else {
            this.day = days.indexOf(time.substring(0, 2));
            this.hours = Number(time.substring(3, 5));
            this.minutes = Number(time.substring(6, 8));
            this.offset = Number(time.substring(9, 10));
        }
        this.calcTotal();
    } else {
        this.fromTotal(time, offset);
    }

    return this;
}

let minuteInDay = 24 * 60;

Time.prototype.getTotal = function () {
    return (this.day * 24 + this.hours - this.offset) * 60 + this.minutes;
};

Time.prototype.fromTotal = function (total, offset) {
    this.total = total;
    this.offset = offset;
    total += minuteInDay;
    this.minutes = total % 60;
    this.day = Math.floor(total / minuteInDay) - 1;
    total = total % minuteInDay;
    this.hours = Math.floor(total / 60) + offset;
    this.day += Math.floor(this.hours / 24);
    this.hours %= 24;
};

/**
 * @param {String} template
 * @param {Number} offset
 * @returns {String}
 */
Time.prototype.format = function (template, offset) {
    this.fromTotal(this.total, offset);
    let result = template.replace('%DD', days[this.day]);
    let minutes = this.minutes.toLocaleString('arab', { minimumIntegerDigits: 2 });
    let hoursOffset = this.hours + offset - this.offset;
    let hours = hoursOffset.toLocaleString('arab', { minimumIntegerDigits: 2 });
    result = result.replace('%MM', minutes);
    result = result.replace('%HH', hours);

    return result;
};

/**
 * считает поле total
 */
Time.prototype.calcTotal = function () {
    this.total = this.getTotal();
};

/**
 * @typedef TimespanObject
 * @property {Object} from string or number (if total)
 * @property {Object} to string or number (if total)
 */

/**
 * @class Timespan
 * @param {TimespanObject} timeObject
 * @param {Number} offset
 * @property {Time} from
 * @property {Time} to
 */
function Timespan(timeObject, offset) {
    if (offset !== undefined) {
        this.from = new Time(timeObject.from, offset);
        this.to = new Time(timeObject.to, offset);

        return this;
    }
    this.from = new Time(timeObject.from);
    this.to = new Time(timeObject.to);

    return this;
}

Timespan.prototype.getTotal = function () {
    return this.to.total - this.from.total;
};
