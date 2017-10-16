const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

class Timestamp {
    constructor(day, hour, min, offset) {
        this.day = day;
        this.hour = hour;
        this.min = min;
        this.offset = offset;
        this.week = 0;
    }
    
    totalMinutes() {
        var hour = this.hour - this.offset;
        var day = this.day + this.week * 7;
        return day * 24 * 60 + hour * 60 + this.min;
    }
    
    addMinutes(mins) {
        if (mins <= 0)
            return this;
        var min = mins % 60;
        mins -= min;
        mins /= 60;
        mins += this.hour;
        var hour = mins % 24;
        mins -= hour;
        mins /= 24;
        mins += this.day;
        var day = mins % 7;
        mins -= day;
        mins /= 7;
        mins += this.day;
        var result = new Timestamp(day, hour, min, this.offset);
        result.week = this.week + mins;
        return result;
    }
    
    format(template) {
        return template
            .replace('%HH', this.hour)
            .replace('%MM', this.min)
            .replace('%DD', days[this.day]);
    }
    
    static fromString(timeStr){
        var [, day, hour, minute, offset] = /(..) (\d\d):(\d\d)\+(\d\d?)/.exec(timeStr);
        day = days.indexOf(day);
        return new Timestamp(+day, +hour, +minute, +offset);
    }
    
    static min() {
        return new Timestamp(0, 0, 0, 0);
    }
    
    static max() {
        var ts = new Timestamp(6, 23, 59, 23);
        ts.week = 3;
        return ts;
    }
}

class Timedelta {
    constructor(fromTs, toTs) {
        this.fromTs = fromTs;
        this.toTs = toTs;
    }
    
    static fromObj(obj){
        var fromTs = Timestamp.fromString(obj['from']);
        var toTs = Timestamp.fromString(obj['to']);
        if (toTs.totalMinutes() < fromTs.totalMinutes())
            toTs.week = 1;
        return new Timedelta(fromTs, toTs);
    }
    
    totalMinutes() {
        return this.toTs.totalMinutes() - this.fromTs.totalMinutes();
    }
    
    intersect(td) {
        var fromTs = td.fromTs.totalMinutes() > this.fromTs.totalMinutes() ? td.fromTs : this.fromTs;
        var toTs = td.toTs.totalMinutes() > this.toTs.totalMinutes() ? this.toTs : td.toTs;
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