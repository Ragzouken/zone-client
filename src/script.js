const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

var tag = document.createElement('script');
tag.onerror = () => console.log("youtube error :(");
tag.src = "https://www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let autoplayed = false;

// Replace the 'ytplayer' element with an <iframe> and
// YouTube player after the API code downloads.
var player;
function onYouTubePlayerAPIReady() {
    player = new YT.Player('youtube', {
        width: '448',
        height: '252',
        playerVars: {
            controls: '0',
            iv_load_policy: '3',
        },
        events: {
            onReady: () => { load(); },
            onError: () => console.log("YT ERROR"),
            onStateChange: event => console.log(`YT STATE: ${event.data}`),
        }
    });
}

document.addEventListener('click', () => {
    if (!autoplayed) {
        autoplayed = true;
        if (player) player.playVideo();
    }
});

class WebSocketMessaging {
    constructor() {
        this.websocket = undefined;
        this.handlers = new Map();
    }

    connect(address) {
        this.disconnect();
        this.websocket = new WebSocket(address);
        this.websocket.onopen = event => this.onOpen(event);
        this.websocket.onclose = event => this.onClose(event);
        this.websocket.onmessage = event => this.onMessage(event);
    }

    reconnect() {
        console.log("reconnecting");
        this.connect(this.websocket.url);
    }

    disconnect() {
        if (!this.websocket) return;
        this.websocket.onclose = undefined;
        this.websocket.close(1000);
        this.websocket = undefined;
    }

    async wait() {
        while (this.websocket.readyState === WebSocket.CONNECTING)
            await sleep(10);
    }

    send(type, message) {
        message.type = type;
        this.websocket.send(JSON.stringify(message));
    }

    setHandler(type, handler) {
        this.handlers.set(type, handler);
    }

    onMessage(event) {
        const message = JSON.parse(event.data);
        const handler = this.handlers.get(message.type);
        
        if (handler) handler(message);
        else console.log(`NO HANDLER FOR MESSAGE TYPE ${message.type}`);
    }

    onOpen(event) {
        console.log('open:', event);
        console.log(this.websocket.readyState);
    }

    async onClose(event) {
        console.log(`closed: ${event.code}, ${event.reason}`, event);

        if (event.code !== 1000) {
            await sleep(500);
            this.reconnect();
        }
    }
}

function secondsToTime(seconds) {
    const s = seconds % 60;
    const m = Math.floor(seconds / 60) % 60;
    const h = Math.floor(seconds / 360);

    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

async function load() {
    setInterval(() => fetch('http://zone-server.glitch.me', {mode: 'no-cors'}), 4 * 60 * 1000);

    const urlparams = new URLSearchParams(window.location.search);

    const serverInput = document.querySelector('#server-input');
    const chatName = document.querySelector('#chat-name');
    const chatInput = document.querySelector('#chat-input');
    const chatLog = document.querySelector('#chat-log');
    const chatLines = [];

    chatName.value = localStorage.getItem('name') || "";

    const queueLog = document.querySelector('#queue-log');
    let queue = [];
    let currentVideo;

    const avatars = new Map();

    let userId;
    const usernames = new Map();

    function getUsername(userId) {
        return usernames.get(userId) || userId;
    }

    const messaging = new WebSocketMessaging();
    messaging.setHandler('heartbeat', () => {});
    messaging.setHandler('assign', message => {
        logChat('<b>⚡⚡⚡ connected ⚡⚡⚡</b>');
        userId = message.userId;
        if (chatName.value.length > 0)
            messaging.send('name', { name: chatName.value });
        queue.length = 0;
        avatars.clear();
        usernames.clear();
    });
    messaging.setHandler('queue', message => {
        if (message.videos.length === 1)
            logChat(`<b>➕ ${message.videos[0].title} (${message.videos[0].duration}s)</b>`);
        logQueue(message.videos);
    });
    messaging.setHandler('youtube', message => {
        if (!message.videoId) {
            player.stopVideo();
            return;
        }
        const { videoId, title, duration, time } = message;
        player.loadVideoById(videoId, time / 1000);
        logChat(`<b>📼 ${title} (${duration}s)</b>`);

        currentVideo = message;
        queue = queue.filter(video => video.videoId !== videoId);
        logQueue([]);
    });

    messaging.setHandler('leave', message => avatars.delete(message.userId));
    messaging.setHandler('move', message => {
        if (message.userId !== userId || !avatars.has(userId)) {
            const avatar = avatars.get(message.userId) || { position: [0, 0], emotes: [] };
            avatar.position = message.position;
            avatars.set(message.userId, avatar);
        }
    });
    messaging.setHandler('emotes', message => {
        const avatar = avatars.get(message.userId) || { position: [0, 0], emotes: [] };
        avatar.emotes = message.emotes;
        avatars.set(message.userId, avatar);
    });
    messaging.setHandler('chat', message => logChat(`[${getUsername(message.userId)}] ${message.text}`));
    messaging.setHandler('status', message => logChat(`<b>❗ ${message.text}</b>`));
    messaging.setHandler('name', message => {
        if (!usernames.has(message.userId)) {
            logChat(`<b>👋 ${message.name} joined</b>`);
        } else {
            logChat(`<b>👉 ${usernames.get(message.userId)} is now ${message.name}</b>`);
        }

        usernames.set(message.userId, message.name);
    });

    messaging.setHandler('search', message => {
        const { query, results } = message;
        messaging.send('youtube', {videoId: results[0].videoId});
    });

    setInterval(() => messaging.send('heartbeat', {}), 30 * 1000);

    window.onbeforeunload = () => messaging.disconnect();

    player.addEventListener('onError', () => messaging.send('error', { videoId: currentVideo.videoId }));

    if (urlparams.has('zone')) {
        const zone = urlparams.get('zone');
        serverInput.value = `ws://${zone}`;
    }

    messaging.connect(serverInput.value);

    chatName.addEventListener('change', () => {
        localStorage.setItem('name', chatName.value);
        if (userId)
            messaging.send('name', { name: chatName.value });
    });

    // pretend to be server to the echo service
    //await messaging.wait();
    //messaging.send('youtube', {videoId: '4OtsoZrGZTc'});
    //messaging.send('chat', {text:'hello', user:'max'});
    
    // connection status for websocket input
    function update() {
        if (!messaging.websocket || messaging.websocket.readyState === WebSocket.CLOSED) {
            serverInput.style = "background: red";
        } else if (messaging.websocket.readyState === WebSocket.OPEN) {
            serverInput.style = "background: green";
        } else if (messaging.websocket.readyState === WebSocket.CONNECTING) {
            serverInput.style = "background: yellow";
        } else {
            serverInput.style = "background: magenta";
        }

        window.requestAnimationFrame(() => update());
    }

    update();

    serverInput.onchange = () => messaging.connect(`ws://${serverInput.value}`);

    function logQueue(videos) {
        queue.push(...videos);
        queueLog.innerHTML = queue.map(video => `${video.title} (${secondsToTime(video.duration)})`).join('<br>');
    }

    function logChat(text) {
        chatLines.push(text);
        chatLog.innerHTML = chatLines.join('<br>');
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function move(dx, dy) {
        const avatar = avatars.get(userId);
        if (!avatar) return;
        avatar.position[0] += dx;
        avatar.position[1] += dy;
        messaging.send('move', { position: avatar.position });
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            const command = chatInput.value;
            if (command.startsWith('/search'))
                messaging.send('search', {query: command.slice(7).trim()});
            else if (command.startsWith('/youtube '))
                messaging.send('youtube', {videoId: command.slice(9).trim()});
            else if (command.startsWith('/skip'))
                messaging.send('skip', {password: command.slice(5).trim()})
            else if (command.startsWith('/emotes'))
                messaging.send('emotes', { emotes: command.slice(7).trim().split(' ')});
            else if (command.startsWith('/emote'))
                messaging.send('emotes', { emotes: command.slice(6).trim().split(' ')});
            else
                messaging.send('chat', {text: command});
            chatInput.value = "";
        } 
        
        if (event.key === 'ArrowLeft') {
            move(-1,  0);
        } else if (event.key === 'ArrowRight') {
            move( 1,  0);
        } else if (event.key === 'ArrowDown') {
            move( 0,  1);
        } else if (event.key === 'ArrowUp') {
            move( 0, -1);
        }
    });

    function context2d(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        return context;
    }

    // test canvas over youtube video
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');

    const room = context2d(512, 512);
    room.clearRect(0, 0, 512, 512);
    room.drawImage(document.querySelector('img'), 0, 0, 512, 512);

    function redraw() {
        context.clearRect(0, 0, 512, 512);
        context.drawImage(room.canvas, 0, 0);

        avatars.forEach(avatar => {
            const { position } = avatar;
            avatar.emotes = avatar.emotes || [];

            let dx = 0;
            let dy = 0;

            if (avatar.emotes.includes('shk')) {
                dx += randomInt(-8,  8);
                dy += randomInt(-8,  8);
            }

            if (avatar.emotes.includes('wvy')) {
                dy += Math.sin((performance.now() / 250) - (position[0] / 2)) * 4;
            }

            let [r, g, b] = [255, 255, 255];

            if (avatar.emotes.includes('rbw')) {
                const h = Math.abs( Math.sin( (performance.now() / 600) - (position[0] / 8) ) );
                [r, g, b] = hslToRgb( h, 1, 0.5 );
            }

            const x = position[0] * 32 + dx;
            const y = position[1] * 32 + dy;

            context.fillStyle = `rgb(${r}, ${g}, ${b})`;
            context.fillRect(x, y, 32, 32);
        });

        window.requestAnimationFrame(redraw);
    }

    redraw();
}

// source : https://gist.github.com/mjackson/5311256
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;
  
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
  
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
  
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
  
    return [ r * 255, g * 255, b * 255 ];
  }
  