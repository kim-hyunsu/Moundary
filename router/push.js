const  FCM = require('fcm-push');

const serverKey = 'AIzaSyD4Wksjbo4pIIe3a06pLSwJrSGwATgjzXc';
const fcm = new FCM(serverKey);

var fcmPush = function(registration_ids, data, callback){
    const now = new Date();
    const msg = {
        registration_ids : registration_ids,
        collapse_key : (Math.random()*now).toString(),
        data : data
    };
    fcm.send(msg, callback);
}

module.exports = fcmPush;