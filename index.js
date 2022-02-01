const socket = io.connect('http://localhost:3089');

let player = document.getElementById('you');
let rival = document.getElementById('partner');
let displayRPS = document.getElementById('rps');

// 1-> engaged, 0-> alone

socket.on('status', roomstatus => {
    let roomStatus = connectTwoUsers(roomstatus);
    if (roomStatus !== 0) {
        socket.emit('activateRPS', roomStatus)
    }
})

socket.on('rps', rps => {
    let roomStatus = rps[0]
    let rpsStatus = rps[1]
    // socket.emit('test', rpsStatus)
    if (roomStatus.userId == socket.id || roomStatus.partnerId == socket.id) {
        displayRPS.innerHTML += rpsStatus + '<br>';
    }
})

socket.on('reset', userId => {
    let comparison = socket.id == userId ? 'true' : 'false';
    socket.emit('test', comparison)
    if (socket.id == userId) {
        displayRPS.innerHTML = '';
    }
})

connectTwoUsers = roomstatus => {
    let roomStatus = JSON.parse(roomstatus);
    // if roomStatus status is zero then player is alone
    if (roomStatus.status == 0) {
        if (roomStatus.userId == socket.id) {
            player.innerHTML = 'You connected: ' + roomStatus.userId;;
            rival.innerHTML = 'finding rival...';
            return 0;
        }
    } else {
        if (socket.id == roomStatus.userId) {
            player.innerHTML = 'You connected: ' + roomStatus.userId;
            rival.innerHTML = 'Rival connected: ' + roomStatus.partnerId;
        }
        if (socket.id == roomStatus.partnerId) {
            player.innerHTML = 'You connected: ' + roomStatus.partnerId;
            rival.innerHTML = 'Rival connected: ' + roomStatus.userId;
        }
        return roomStatus
    }
}
