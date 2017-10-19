'use strict';

exports.isStar = true;

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let profit = [];
    let frends = {};
    let lastInterval = {};
    let isTryLater = false;
    Object.keys(schedule).forEach(key => {

        let startFree = 0;
        frends[key] = [];
        schedule[key].forEach(el => {
            frends[key].push({
                from: startFree,
                to: timeConverter(el.from),
                name: key
            });
            startFree = timeConverter(el.to);
        });

        frends[key].push({
            from: startFree,
            to: 4320,
            name: key
        });

        return frends;
    });

    let bankIntervals = mathIntervalsBank(workingHours);

    for (let i = 0; i < bankIntervals.length; i++) { // Перебираем банковские дни
        let frendsInterval = {
            Danny: [],
            Rusty: [],
            Linus: []
        };

        Object.keys(frends).forEach(frend => {
            frends[frend].forEach(interval => {
                let bankFrom = bankIntervals[i].from;
                let bankTo = bankIntervals[i].to;
                if ((Math.min(bankFrom, bankTo) < Math.max(interval.from, interval.to)) &&
                ((Math.min(interval.from, interval.to) <
            Math.max(bankFrom, bankTo)))) {
                    frendsInterval[interval.name].push({
                        from: Math.max(bankFrom, interval.from),
                        to: Math.min(bankTo, interval.to),
                        name: interval.name
                    });
                }

            });

        });

        let maxFrom;
        let minTo;
        frendsInterval.Danny.forEach(iD => {

            maxFrom = Math.max(maxFrom, iD.from);
            minTo = Math.min(minTo, iD.to);

            frendsInterval.Rusty.forEach(iR => {

                maxFrom = Math.max(iD.from, iR.from);
                minTo = Math.min(iD.to, iR.to);

                frendsInterval.Linus.forEach(iL => {
                    maxFrom = Math.max(maxFrom, iL.from);
                    minTo = Math.min(minTo, iL.to);

                    if ((maxFrom < minTo) && (minTo - maxFrom) >= duration) {

                        profit.push({
                            from: maxFrom + 300,
                            to: minTo + 300,
                            day: i + 1
                        });
                    }

                });

            });
        });
    }

    return {
        exists() {
            if (profit.length > 0) {

                return true;
            }

            return false;
        },
        format(template) {
            let resObj;
            if (profit.length === 0 && !isTryLater) {
                return '';
            } else if (profit.length > 0) {
                resObj = intervalToString(profit[0].from);
            } else {
                resObj = intervalToString(lastInterval.from);
            }

            return template.replace('%DD', resObj.DD).replace('%HH', resObj.HH)
                .replace('%MM', resObj.MM);

        },

        tryLater: function () {
            isTryLater = true;
            if (profit.length > 0) {
                return calcNextMoment(profit[0]);

            }

            return false;
        }
    };

    function calcNextMoment() {
        lastInterval = JSON.parse(JSON.stringify(profit[0]));
        profit[0].from = profit[0].from + 30;
        if (profit[0].to - profit[0].from < duration) {
            profit.splice(0, 1);
        }
        if (profit.length > 0) {

            return true;
        }

        return false;
    }
};

function timeConverter(T) {
    const DAYS = {
        'ПН': 0,
        'ВТ': 1440,
        'СР': 2880
    };
    let timeArr = T.replace(/[+:]/ig, ' ').split(' ');

    return Number(DAYS[timeArr[0]]) + Number(timeArr[1]) * 60 -
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
    }
    ];
}

function intervalToString(go) {
    let resObj = {};
    let mins;
    let time = String(go / 1440).split('.')[0];

    if (time === '0') {
        resObj.DD = 'ПН';
        mins = go;
    } else if (time === '1') {
        resObj.DD = 'ВТ';
        mins = go - 1440;
    } else if (time === '2') {
        resObj.DD = 'СР';
        mins = go - 2880;
    }

    let hoursArr = (mins / 60).toFixed(1).split('.');
    resObj.HH = twoSign(hoursArr[0]);
    resObj.MM = twoSign(hoursArr[1] * 6);

    return resObj;
}

function twoSign(num) {
    if (num > 9) {
        return num;
    }

    return '0' + num;

}
