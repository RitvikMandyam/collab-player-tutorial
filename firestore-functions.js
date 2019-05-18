function setUpPresenceHooks() {
    // Fetch the current user's ID from Firebase Authentication.
    var uid = firebase.auth().currentUser.uid;

    // Create a reference to this user's specific status node.
    // This is where we will store data about being online/offline.
    var userStatusDatabaseRef = firebase.database().ref('/status/' + uid);
    // Create a reference to this user's firestore status document.
    var userStatusFirestoreRef = firebase.firestore().doc('/status/' + uid);

    // We'll create two constants which we will write to
    // the Realtime database when this device is offline
    // or online.
    var isOfflineForDatabase = {
        state: 'offline',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    var isOnlineForDatabase = {
        state: 'online',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    // Firestore uses a different server timestamp value, so we'll
    // create two more constants for Firestore state.
    var isOfflineForFirestore = {
        state: 'offline',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    };

    var isOnlineForFirestore = {
        state: 'online',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Create a reference to the special '.info/connected' path in
    // Realtime Database. This path returns `true` when connected
    // and `false` when disconnected.
    firebase.database().ref('.info/connected').on('value', function (snapshot) {
        // If we're not currently connected
        if (snapshot.val() == false) {
            // We set Firestore's state
            // to 'offline'. This ensures that our Firestore cache is aware
            // of the switch to 'offline.'
            userStatusFirestoreRef.set(isOfflineForFirestore);
            return;
        }

        // If we are currently connected, then use the 'onDisconnect()'
        // method to add a set which will only trigger once this
        // client has disconnected by closing the app,
        // losing internet, or any other means.
        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
            // The promise returned from .onDisconnect().set() will
            // resolve as soon as the server acknowledges the onDisconnect()
            // request, NOT once we've actually disconnected:
            // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

            // We can now safely set ourselves as 'online' knowing that the
            // server will mark us as offline once we lose connection.
            userStatusDatabaseRef.set(isOnlineForDatabase);
            // We'll also add Firestore set here for when we come online.
            userStatusFirestoreRef.set(isOnlineForFirestore);
        });
    });

    return userStatusFirestoreRef;

    /* To check if user is online:
        userStatusFirestoreRef.onSnapshot(function(doc) {
            var isOnline = doc.data().state == 'online';
            // ... use isOnline
        });
     */
}

function createSession() {
    if (!sessionStorage.getItem('sessionID')) {
        var uid = firebase.auth().currentUser.uid;
        var userSessionRef = firebase.firestore().collection('sessions').doc();
        var sessionObject = {
            users: [firebase.firestore().doc('/status/' + uid)],
            createdOn: new Date()
        };
        userSessionRef.set(sessionObject);
        sessionStorage.setItem('sessionID', userSessionRef.id);
    }
}

function getAudio(id) {
    var xmlhttp = new XMLHttpRequest();
    var obj = null;
    xmlhttp.open('GET', 'https://maple3142-ytdl.glitch.me/api?id=' + id, false);
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                obj = JSON.parse(xmlhttp.responseText)['adaptive'];
                obj = obj.filter(function(e) {
                    return e.type.includes('audio');
                });
            }
        }
    };
    xmlhttp.send(null);
    return obj;
}

function joinSession(sessionID) {
    var uid = firebase.auth().currentUser.uid;
    var userSessionRef = firebase.firestore().collection('sessions').doc(sessionID);
    userSessionRef.update({users: firebase.firestore.FieldValue.arrayUnion(firebase.firestore().doc('/status/' + uid))})
}

function addSong(url) {
    if (sessionStorage.getItem('sessionID')) {
        var sessionID = sessionStorage.getItem('sessionID');
        var userSessionRef = firebase.firestore().collection('sessions').doc(sessionID);
        var uid = firebase.auth().currentUser.uid;
        userSessionRef.collection('songs').doc().set({'url': url, 'user': firebase.firestore().doc('/status/' + uid)});
    }
}

function createAudioSources(url, audioElement) {
    var YouTubeRegex = /(.*?)(^|\/|v=)([a-z0-9_-]{11})(.*)?/gim;
    var id = YouTubeRegex.exec(url)[3];
    var source_objs = getAudio(id);
    var sources_string = '';

    for (var source_obj of source_objs) {
        sources_string += `<source src="${source_obj['url']}" type="${source_obj['type']}">\n`;
    }
    audioElement.innerHTML = sources_string;
}

