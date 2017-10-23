'use strict';

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

class Timestamp {
    constructor(day, hour, min, offset) {
        this.day = day;
        this.hour = hour;
        this.min = min;
        this.offset = offset;
        this.week = 1;
    }

    totalMinutes() {
        let hour = this.hour + 24 - this.offset;
        let day = this.day + this.week * 7;

        return day * 24 * 60 + hour * 60 + this.min;
    }

    addMinutes(mins) {
        mins += this.min;
        mins += this.hour * 60;
        mins += (this.day + this.week * 7) * 24 * 60;
        let min = mins % 60;
        mins = (mins - min) / 60;
        let hour = mins % 24;
        mins = (mins - hour) / 24;
        let day = mins % 7;
        mins = (mins - day) / 7;
        let result = new Timestamp(day, hour, min, this.offset);
        result.week = mins;

        return result;
    }

    format(template) {
        return template
            .replace(/%HH/g, (this.hour > 9 ? '' : '0') + this.hour)
            .replace(/%MM/g, (this.min > 9 ? '' : '0') + this.min)
            .replace(/%DD/g, days[this.day]);
    }

    static fromString(timeStr) {
        let [, day, hour, minute, offset] = /([А-Я]{2}) (\d{2}):(\d{2})\+(\d\d?)/.exec(timeStr);
        day = days.indexOf(day);

        return new Timestamp(day, Number(hour), Number(minute), Number(offset));
    }

    static min() {
        let result = new Timestamp(0, 0, 0, 0);
        result.week = 0;

        return result;
    }

    static max() {
        let ts = new Timestamp(6, 23, 59, 0);
        ts.week = 2;

        return ts;
    }
}

class Timedelta {
    constructor(fromTs, toTs) {
        this.fromTs = fromTs;
        this.toTs = toTs;
    }

    static fromObj(obj) {
        let fromTs = Timestamp.fromString(obj.from);
        let toTs = Timestamp.fromString(obj.to);

        return new Timedelta(fromTs, toTs);
    }

    totalMinutes() {
        return this.toTs.totalMinutes() - this.fromTs.totalMinutes();
    }

    intersect(td) {
        let fromTs = td.fromTs.totalMinutes() > this.fromTs.totalMinutes()
            ? td.fromTs : this.fromTs;
        let toTs = td.toTs.totalMinutes() > this.toTs.totalMinutes() ? this.toTs : td.toTs;

        return new Timedelta(fromTs, toTs);
    }

    static max() {
        return new Timedelta(Timestamp.min(), Timestamp.max());
    }
}

module.exports = {
    Timedelta: Timedelta,
    Timestamp: Timestamp,
    days: days
};
