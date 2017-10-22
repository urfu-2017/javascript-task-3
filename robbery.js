'use strict';

exports.isStar = false;
const DAYS_WEEK = {
    'ПН': 0,
    'ВТ': 1440,
    'СР': 2880
};
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let timeLine = returnInterval([], [{
        from: 0,
        to: 4320
    }], 0);
    let friends = getFriendsIntervals();
    let bankIntervals = mathIntervalsBank(workingHours);

    timeLine = returnInterval(timeLine, bankIntervals, 1);
    timeLine = returnInterval(timeLine, friends, 0);
    let lastStart = getProfitInterval(0);

    return {
        exists() {
            if (getProfitInterval(lastStart) > 0) {
                return true;
            }

            return false;
        },
        format(template) {
            let timeStart = getProfitInterval(lastStart);
            if (!timeStart) {
                return '';
            }
            let tmp = intervalToString(timeStart);

            return template
                .replace('%DD', tmp.DD)
                .replace('%HH', tmp.HH)
                .replace('%MM', tmp.MM);
        },

        tryLater() {
            let nextInterval = getProfitInterval(lastStart + 30);
            if (nextInterval > 0) {
                lastStart = nextInterval;

                return true;
            }

            return false;
        }
    };

    function getFriendsIntervals() {
        let arr = [];
        Object.keys(schedule).forEach(key => {
            schedule[key].forEach(el => {
                arr.push({
                    from: timeConverter(el.from),
                    to: timeConverter(el.to)
                });

            });

        });

        return arr;
    }

    function getProfitInterval(from) {
        let starts = [];
        let start = timeLine.indexOf(1, from);
        let stop = timeLine.indexOf(0, start);
        while ((start !== -1)) {
            if (stop - start >= duration) {
                starts.push(start);
            }
            start = timeLine.indexOf(1, stop);
            stop = timeLine.indexOf(0, start);

        }
        if (starts.length === 0) {
            return false;
        }

        return starts[0];
    }

};

function timeConverter(T) {
    let timeArr = T.replace(/[+:]/ig, ' ').split(' ');

    return Number(DAYS_WEEK[timeArr[0]]) + Number(timeArr[1]) * 60 -
Number(timeArr[3]) * 60 + Number(timeArr[2]);
}

function mathIntervalsBank(obj) {
    return [{
        from: timeConverter('ПН ' + obj.from),
        to: timeConverter('ПН ' + obj.to)
    }, {
        from: timeConverter('ВТ ' + obj.from),
        to: timeConverter('ВТ ' + obj.to)
    }, {
        from: timeConverter('СР ' + obj.from),
        to: timeConverter('СР ' + obj.to)
    }];

}

function intervalToString(go) {
    go = go + 300;
    let objTime = {};
    let mins;
    let time = String(go / 1440).split('.')[0];
    if (time === '0') {
        objTime.DD = 'ПН';
        mins = go;
    } else if (time === '1') {
        objTime.DD = 'ВТ';
        mins = go - 1440;
    } else if (time === '2') {
        objTime.DD = 'СР';
        mins = go - 2880;
    }

    let [hour, min] = (mins / 60).toFixed(1).split('.');
    objTime.HH = twoSign(hour);
    objTime.MM = twoSign(min * 6);

    return objTime;
}

function twoSign(num) {
    if (num > 9) {
        return num;
    }

    return '0' + num;
}

function returnInterval(arr, obj, val) {
    obj.forEach(el => {
        for (var i = el.from; i < el.to; i++) {
            arr[i] = val;
        }
    });

    return arr;
}
