const socket = io.connect('https://3821-223-233-69-150.ngrok.io');

let player = document.getElementById('you');
let rival = document.getElementById('partner');
let info = document.querySelector('.interact');
let displayRPS = document.getElementById('rps');
let resultDiv = document.getElementById('result-id');


// 1-> engaged, 0-> alone

socket.on('status', roomstatus => {
    let roomStatus = connectTwoUsers(roomstatus);
    if (roomStatus !== 0) {
        socket.emit('activateRPS', roomStatus)
    }
})

const dict = {
    'r': 'rock',
    'p': 'paper',
    's': 'scissors'
}

socket.on('rps', rps => {
    let roomStatus = rps[0]
    let rpsStatus = rps[1]
    if (rpsStatus === 'done') {
        if (info.className === 'interact') return;
        info.className = 'interact';
        if (roomStatus.userId == socket.id || roomStatus.partnerId == socket.id) socket.emit('rps-action', undefined, socket.id);
        return;
    }
    if (rpsStatus === 'SHOOT!!!') info.className += ' noblock';
    try {
        if (roomStatus.userId == socket.id || roomStatus.partnerId == socket.id) {
            displayRPS.innerHTML += rpsStatus + '<br>';
        }
    } catch (error) {
        displayRPS.innerHTML = 'Wait'
    }
})

socket.on('reset', (userId, all, query, query2) => {
    // socket.emit('test', comparison)
    if (socket.id === userId) {
        displayRPS.innerHTML = '';
        if (all) resultDiv.innerHTML = '';
        if (query === 'restart') socket.emit('activateRPS', query2);
    }
})

socket.on('rps-result', result => {
    if (result.length === 4) { // draw
        if (socket.id == result[2] || socket.id == result[3]) {
            resultDiv.className += ' tie';
            resultDiv.innerHTML = 'Draw ::' + ` (${dict[result[1]]} vs ${dict[result[1]]})`;
        }
    } else if (result.length === 3) {
        if (socket.id === result[1] || socket.id === result[2]) {
            resultDiv.innerHTML = result[0]
        }
    }
    else {
        if (socket.id === result[0][1]) {
            resultDiv.className += ' won';
            resultDiv.innerHTML = 'You Win ::' + ` (${dict[result[0][2]]} vs ${dict[result[1][2]]})`;
        }
        if (socket.id === result[1][1]) {
            resultDiv.className += ' lost';
            resultDiv.innerHTML = 'You Lose ::' + ` (${dict[result[1][2]]} vs ${dict[result[0][2]]})`;
        }
    }
})


function action(btn) {
    if (!info.className.includes('noblock')) return;
    btn.parentElement.className = 'interact';
    socket.emit('rps-action', btn.id, socket.id)
}

connectTwoUsers = roomstatus => {
    let roomStatus = JSON.parse(roomstatus);
    // if roomStatus status is zero then player is alone
    if (roomStatus.status == 0) {
        if (roomStatus.userId == socket.id) {
            player.innerHTML = roomStatus.userId;;
            rival.innerHTML = 'finding rival...';
            return 0;
        }
    } else {
        if (socket.id == roomStatus.userId) {
            player.innerHTML = roomStatus.userId;
            rival.innerHTML = roomStatus.partnerId;
        }
        if (socket.id == roomStatus.partnerId) {
            player.innerHTML = roomStatus.partnerId;
            rival.innerHTML = roomStatus.userId;
        }
        return roomStatus
    }
}
