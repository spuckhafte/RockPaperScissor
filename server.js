const http = require('http').createServer();

const { v4: uuidv4 } = require('uuid');

const io = require('socket.io')(http, {
    cors: { origin: '*' }
});

// 1-> engaged, 0-> alone

let rooms = {};
let afterResponse = [];


//eg: room = {1: [user1, user2], 2: [user3, user4]}

io.on('connection', socket => {
    console.log('a user connected');
    if (Object.keys(rooms).length == 0) {
        rooms[1] = [socket.id]
        const roomStatus = createStatus(0, socket.id, null);
        io.emit('status', JSON.stringify(roomStatus));
    } else {
        joinAloneUsers(socket.id);
    }

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        let userRoom = findRoomWithId(rooms, socket.id);
        if (userRoom !== undefined) {
            // remove socket.id from userRoom
            if (rooms[userRoom].length == 1) {
                delete rooms[userRoom];
            } else {
                rooms[userRoom] = rooms[userRoom].filter(id => id !== socket.id);
                let newSingleUser = rooms[userRoom][0];
                delete rooms[userRoom];
                joinAloneUsers(newSingleUser);
                io.emit('reset', newSingleUser)
            }
        } else {
            let msg = 'err'
            console.log(rooms, userRoom, msg)
        }
    })

    socket.on('activateRPS', roomStatus => {
        // emit rock, paper, scissors within a delay of 1 second
        sleep(50).then(() => {
            socket.emit('reset', socket.id, true);
            sleep(1000).then(() => {
                socket.emit('rps', [roomStatus, 'rock'])
                sleep(600).then(() => {
                    socket.emit('rps', [roomStatus, 'paper'])
                    sleep(600).then(() => {
                        socket.emit('rps', [roomStatus, 'scissors'])
                        sleep(600).then(() => {
                            socket.emit('rps', [roomStatus, 'SHOOT!!!'])
                            sleep(800).then(() => {
                                socket.emit('rps', [roomStatus, 'done'])
                            })
                        })
                    })
                })
            })
        })
    })

    socket.on('rps-action', (userRes, userId) => {
        let roomNo = findRoomWithId(rooms, userId);
        let partnerId = rooms[roomNo].filter(id => id !== userId)[0];
        if (partnerId === undefined) {
            delete rooms[roomNo];
            joinAloneUsers(userId);
            io.emit('reset', userId);
        } else {
            if (afterResponse.some(res => Object.keys(res).includes(partnerId))) {
                afterResponse.forEach((res, index) => {
                    if (Object.keys(res).includes(partnerId)) {
                        let partnerRes = res[partnerId];
                        afterResponse.splice(index, 1);
                        if (userRes !== null && partnerRes !== null && userRes !== undefined && partnerRes !== undefined) {
                            if (userRes == partnerRes) {
                                io.emit('rps-result', ['draw', userRes, userId, partnerId]);
                            } else if (userRes == 'rock' && partnerRes == 'scissors' || userRes == 'scissors' && partnerRes == 'paper' || userRes == 'paper' && partnerRes == 'rock') {
                                io.emit('rps-result', [['win', userId, userRes], ['lose', partnerId, partnerId]])
                            } else {
                                io.emit('rps-result', [['win', partnerId, partnerRes], ['lose', userId, userRes]])
                            }
                            io.emit('reset', userId, false);
                            io.emit('reset', partnerId, false);
                        } else {
                            io.emit('rps-result', ['No Response', userId, partnerId]);
                            io.emit('reset', userId, false);
                            io.emit('reset', partnerId, false);
                            sleep(2000).then(() => {
                                let status = createStatus(1, userId, partnerId);
                                io.emit('reset', userId, true, 'restart', status);
                                io.emit('reset', partnerId, true, 'restart', status);
                            });
                        }
                    }
                })
            } else {
                let res = {};
                res[userId] = userRes;
                afterResponse.push(res);
            }
        }
    });

});

http.listen(3089, () => { console.log('listening on *:3089') });


function createStatus(query, userId, partnerId) {
    // if query is 0 then status is zero
    if (query == 0) {
        const roomStatus = {
            roomId: uuidv4(),
            userId: userId,
            status: query,
        }
        return roomStatus;
    } else {
        const roomStatus = {
            roomId: uuidv4(),
            userId: userId,
            status: query,
            partnerId: partnerId
        }
        return roomStatus;
    }
}

function findEmptyRoom(room) {
    let roomNo = Object.keys(room).find(key => room[key].length == 1);
    if (roomNo !== undefined) {
        return roomNo;
    } else {
        return null;
    }
}

function findRoomWithId(rooms, id) {
    let roomNo = Object.keys(rooms).find(key => rooms[key].includes(id));
    if (roomNo !== undefined) {
        return roomNo;
    }
}

function joinAloneUsers(userId) {
    let roomNo = findEmptyRoom(rooms);
    if (roomNo !== null) {
        rooms[roomNo].push(userId);
        const roomStatus = createStatus(1, rooms[roomNo][0], userId);
        io.emit('status', JSON.stringify(roomStatus));
    } else {
        let roomNo = Object.keys(rooms).length + 1;
        rooms[roomNo] = [userId]
        const roomStatus = createStatus(0, userId, null);
        io.emit('status', JSON.stringify(roomStatus));
    }
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}