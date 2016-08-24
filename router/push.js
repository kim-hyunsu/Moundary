const  FCM = require('fcm-push');

const serverKey = 'AIzaSyDzauHyX4EBLwKdaRs5UmLqfhMnGZvVqFM';
const fcm = new FCM(serverKey);

var fcmPush = function(registration_ids, data, callback){
    console.log('registration_ids >>>', registration_ids);
    const now = new Date();
    var notification = {};
    switch(data.pushType){
        case 0: //댓글,좋아요
        switch(data.category){
            case 0: //댓글
            notification.title = data.pusherNickname+'님이 회원님의 게시글에 댓글을 올렸습니다.';
            notification.body = data.content;
            notification.icon = data.img;
            break;
            case 1: //좋아요
            notification.title = data.pusherNickname+'님이 회원님의 게시물을 좋아합니다.';
            notification.icon = data.img;
            break;
        }
        break;
        case 1: //정보글 알림
        switch(data.pushType){
            case 1: // 할인
            notification.title = data.pusherNickname+'님이 할인 정보를 제공하였습니다.';
            break;
            case 2: // 나눔
            notification.title = data.pusherNickname+'님이 나눔 정보를 제공하였습니다.';
            break;
            case 3: // 이벤트
            notification.title = data.pusherNickname+'님이 이벤트 정보를 제공하였습니다.';
            break;
            case 4: // 상점
            notification.title = data.pusherNickname+'님이 상점 정보를 제공하였습니다.';
            break;
        }
        notification.body = data.content;
        notification.icon = data.img;
        break;
        case 2:
        notification.title = data.pusherNickname+'님이 회원님과 친구가 되고 싶어합니다.';
        notification.icon = data.img;
        break;
    }
    const msg = {
        registration_ids : registration_ids,
        collapse_key : (Math.random()*now).toString(),
        data : data,
        notification : notification
    };
    console.log('READY TO PUSH A DATA >>>', msg);
    fcm.send(msg, callback);
}

module.exports = fcmPush;