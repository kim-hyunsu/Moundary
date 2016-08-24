const timedff = require('timediff');

// 현재시간으로부터 몇 분/시간/일/달/년 전인지 계산
var calculTime = function(time,format){
    const now = new Date();
    timediff(time, now, (diff)=>{
        var prefix, postfix;
        switch(format){
            case 'due':
            prefix = '이 글은 앞으로 약 ';
            postfix = '동안 유효합니다.';
            break;

            default:
            prefix = '약';
            postfix = ' 전';
            break;
        }
        if (diff.years){
            if (prefix == '약'){
                return (time.getFullYear()+'년 '+(time.getMonth()+1)+'월 '+time.getDate()+'일');
            } else {
                return (prefix+diff.year+'년 '+diff.months+'개월'+postfix);
            }
        } else if (diff.months){
            if (prefix == '약'){
                return (time.getFullYear()+'년 '+(time.getMonth()+1)+'월 '+time.getDate()+'일');
            } else {
                return (prefix+diff.months+'개월'+postfix);
            }
        } else if (diff.weeks){
            return (prefix+diff.weeks+'주'+postfix);
        } else if (diff.days){
            return (prefix+diff.days+'일'+postfix);
        } else if (diff.hours){
            return (prefix+diff.hours+'시간'+postfix);
        } else if (diff.minutes){
            return (prefix+diff.hours+'분'+postfix);
        } else if (diff.seconds){
            return (prefix+diff.hours+'초'+postfix);
        } else {
            return (prefix+'1초'+postfix);
        }
    });
}

module.exports = calculTime;