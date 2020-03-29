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
            onReady: () => { if (autoplayed) player.playVideo(); },
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

async function load() {
    setInterval(() => fetch('http://zone-server.glitch.me', {mode: 'no-cors'}), 4 * 60 * 1000);

    const urlparams = new URLSearchParams(window.location.search);

    const serverInput = document.querySelector('#server-input');
    const chatName = document.querySelector('#chat-name');
    const chatInput = document.querySelector('#chat-input');
    const chatLog = document.querySelector('#chat-log');
    const chatLines = [];

    const messaging = new WebSocketMessaging();
    messaging.setHandler('youtube', message => player.loadVideoById(message.videoId));
    messaging.setHandler('chat', message => logChat(`[${message.user}] ${message.text}`));

    window.onbeforeunload = () => messaging.disconnect();

    if (urlparams.has('zone')) {
        const zone = urlparams.get('zone');
        serverInput.value = `ws://${zone}`;
    }

    messaging.connect(serverInput.value);

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

    function logChat(text) {
        chatLines.push(text);
        chatLog.innerText = chatLines.join('\n');
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            const command = chatInput.value;
            if (command.startsWith('/youtube '))
                messaging.send('youtube', {videoId: command.slice(9).trim()});
            else
                messaging.send('chat', {text: command, user: chatName.value});
            chatInput.value = "";
        }
    });

    // test canvas over youtube video
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgb(255, 255, 255)';
    context.fillRect(0, 0, 512, 512);
    context.clearRect(32, 32, 448, 252);

    for (let i = 0; i < 512; ++i) {
        const [r, g, b] = [randomInt(0, 255), randomInt(0, 255), randomInt(0, 255)];
        const [x, y] = [randomInt(-64, 512), randomInt(-64, 512)];

        if (x+24 > 32 && x+24 < 512-32 && y+24 > 32 && y+24 < 284)
            continue;

        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 48, 48);
    }
}
