const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const clamp = (min, max, value) => Math.max(min, Math.min(max, value));

const avatarImage = blitsy.decodeAsciiTexture(`
___XX___
___XX___
___XX___
__XXXX__
_XXXXXX_
X_XXXX_X
__X__X__
__X__X__
`, "X");

const catImage = blitsy.decodeAsciiTexture(`
________
________
_X_X___X
_XXX___X
_XXX__X_
_XXXXX__
__XXXX__
__X__X__
`, "X");

catData = blitsy.encodeTexture(catImage, 'M1').data;

const floorTile = blitsy.decodeAsciiTexture(`
________
_X_X_X_X
________
__X_____
________
X_X_X_X_
________
_____X__
`, 'X');

const brickTile = blitsy.decodeAsciiTexture(`
###_####
###_####
###_####
________
#######_
#######_
#######_
________
`, '#');

const recolorBuffer = blitsy.createContext2D(8, 8);

function recolored(tile, color) {
    recolorBuffer.clearRect(0, 0, 8, 8);
    recolorBuffer.fillStyle = blitsy.num2hex(color);
    recolorBuffer.fillRect(0, 0, 8, 8);
    recolorBuffer.globalCompositeOperation = 'destination-in';
    recolorBuffer.drawImage(tile.canvas, 0, 0);
    recolorBuffer.globalCompositeOperation = 'source-over';
    return recolorBuffer;
}

const font = blitsy.decodeFont(blitsy.fonts['ascii-small']);
const layout = { font, lineWidth: 240, lineCount: 9999 };
const avatarTiles = new Map();

function recolor(context) {
    blitsy.withPixels(context, pixels => {
        for (let i = 0; i < pixels.length; ++i)
            if (pixels[i] === 0xFFFFFFFF)
                pixels[i] = blitsy.rgbaToColor({r: 128, g: 159, b: 255, a: 255});
    });
}

recolor(floorTile);
recolor(brickTile);

var tag = document.createElement('script');
tag.onerror = () => console.log("youtube error :(");
tag.src = "https://www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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

function fakedownToTag(text, fd, tag) {
    const pattern = new RegExp(`${fd}([^${fd}]+)${fd}`, 'g');
    return text.replace(pattern, `{+${tag}}$1{-${tag}}`);
}

function parseFakedown(text) {
    text = fakedownToTag(text, '##', 'shk');
    text = fakedownToTag(text, '~~', 'wvy');
    text = fakedownToTag(text, '==', 'rbw');
    return text;
}

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
        try {
            this.websocket.send(JSON.stringify(message));
        } catch (e) {
            console.log("couldn't send", message, e);
        }
    }

    setHandler(type, handler) {
        this.handlers.set(type, handler);
    }

    onMessage(event) {
        const message = JSON.parse(event.data);
        const handler = this.handlers.get(message.type);
        
        if (handler) {
            try {
                handler(message);
            } catch (e) {
                console.log('EXCEPTION HANDLING MESSAGE', message, e);
            }
        } else {
            console.log(`NO HANDLER FOR MESSAGE TYPE ${message.type}`);
        }
    }

    onOpen(event) {
        console.log('open:', event);
        console.log(this.websocket.readyState);
    }

    async onClose(event) {
        console.log(`closed: ${event.code}, ${event.reason}`, event);

        if (event.code !== 1000) {
            await sleep(100);
            this.reconnect();
        }
    }
}

const pad = number => number.toString().length >= 2 ? number.toString() : "0" + number.toString(); 

function secondsToTime(seconds) {
    const s = seconds % 60;
    const m = Math.floor(seconds / 60) % 60;
    const h = Math.floor(seconds / 3600);

    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function getPageHeight(page, font) {
    if (page.length === 0)
        return 0;

    let ymin = page[0].position.y;
    let ymax = ymin;

    page.forEach(char => {
        ymin = Math.min(ymin, char.position.y);
        ymax = Math.max(ymax, char.position.y);
    });

    ymax += font.lineHeight + 4;

    return ymax - ymin;
}

let messaging;

async function load() {
    //setInterval(() => fetch('http://zone-server.glitch.me', {mode: 'no-cors'}), 4 * 60 * 1000);
    const youtube = document.querySelector('#youtube');
    const joinName = document.querySelector('#join-name');
    const chatName = document.querySelector('#chat-name');
    const chatInput = document.querySelector('#chat-input');
    let chatPages = [];

    chatName.value = localStorage.getItem('name') || "";
    joinName.value = chatName.value;

    let queue = [];
    let currentVideo;

    const avatars = new Map();

    let userId;
    const usernames = new Map();

    function getUsername(userId) {
        return usernames.get(userId) || userId;
    }

    let showQueue = false;

    messaging = new WebSocketMessaging();
    messaging.setHandler('heartbeat', () => {});
    messaging.setHandler('assign', message => {
        logChat('{clr=#00FF00}*** connected ***{-clr}');
        listHelp();
        userId = message.userId;
        if (chatName.value.length > 0)
            messaging.send('name', { name: chatName.value });
        queue.length = 0;
        avatars.clear();
        usernames.clear();
    });
    messaging.setHandler('queue', message => {
        console.log(message);
        if (message.videos.length === 1) {
            const video = message.videos[0];
            logChat(`{clr=#00FFFF}+ ${video.title} (${secondsToTime(video.duration)}) added by {clr=#FF0000}${getUsername(video.meta.userId)}{-clr}`);
        }
        logQueue(message.videos);
    });
    messaging.setHandler('youtube', message => {
        if (!message.videoId) {
            player.stopVideo();
            return;
        }
        const { videoId, title, duration, time } = message;
        player.loadVideoById(videoId, time / 1000);
        player.playVideo();
        logChat(`{clr=#00FFFF}> ${title} (${secondsToTime(duration)}){-clr}`);

        currentVideo = message;
        queue = queue.filter(video => video.videoId !== videoId);
        logQueue([]);
    });

    function removeUser(userId) {
        avatars.delete(userId);
        usernames.delete(userId);
    }

    messaging.setHandler('users', message => {
        message.names.forEach(([user, name], index) => {
            usernames.set(user, name);
        });
        listUsers();
    });

    messaging.setHandler('leave', message => removeUser(message.userId));
    messaging.setHandler('move', message => {
        if (message.userId !== userId || !avatars.has(userId)) {
            const avatar = avatars.get(message.userId) || { position: [0, 0], emotes: [] };
            avatar.position = message.position;
            avatars.set(message.userId, avatar);
        }
    });
    messaging.setHandler('avatar', message => {
        const texture = {_type: "texture", format: "M1", width: 8, height: 8, data: message.data};
        try {
            const context = blitsy.decodeTexture(texture);
            avatarTiles.set(message.userId, context);
        } catch (e) {
            console.log('fucked up avatar', getUsername(message.userId));
        }
    });
    messaging.setHandler('emotes', message => {
        const avatar = avatars.get(message.userId) || { position: [0, 0], emotes: [] };
        avatar.emotes = message.emotes;
        avatars.set(message.userId, avatar);
    });
    messaging.setHandler('chat', message => {
        const name = getUsername(message.userId);
        logChat(`{clr=#FF0000}${name}:{-clr} ${message.text}`);
    });
    messaging.setHandler('status', message => logChat(`{clr=#FF00FF}! ${message.text}{-clr}`));
    messaging.setHandler('name', message => {
        if (message.userId === userId) {
            logChat(`{clr=#FF00FF}! you are {clr=#FF0000}${message.name}{-clr}`);
        } else if (!usernames.has(message.userId)) {
            logChat(`{clr=#FF00FF}! {clr=#FF0000}${message.name} {clr=#FF00FF}joined{-clr}`);
        } else {
            logChat(`{clr=#FF00FF}! {clr=#FF0000}${getUsername(message.userId)}{clr=#FF00FF} is now {clr=#FF0000}${message.name}`);
        }

        usernames.set(message.userId, message.name);
    });

    let lastSearchResults = undefined;

    messaging.setHandler('search', message => {
        const { query, results } = message;

        lastSearchResults = results;
        const lines = results.slice(0, 5).map(({ title, duration }, i) => `${i + 1}. ${title} (${secondsToTime(duration)})`);
        logChat('{clr=#FFFF00}? queue Search result with /result n\n{clr=#00FFFF}' + lines.join('\n'));
    });

    setInterval(() => messaging.send('heartbeat', {}), 30 * 1000);

    window.onbeforeunload = () => messaging.disconnect();

    player.addEventListener('onError', () => messaging.send('error', { videoId: currentVideo.videoId }));

    chatName.addEventListener('change', () => {
        localStorage.setItem('name', chatName.value);
        if (userId)
            messaging.send('name', { name: chatName.value });
    });

    // connection status for websocket input
    function update() {
        return;
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

    function logQueue(videos) {
        queue.push(...videos);
    }

    function logChat(text) {
        chatPages.push(blitsy.scriptToPages(text, layout)[0]);
        chatPages = chatPages.slice(-32);
    }

    function move(dx, dy) {
        let avatar = avatars.get(userId); 
        
        if (avatar) {
            avatar.position[0] = clamp(0, 15, avatar.position[0] + dx);
            avatar.position[1] = clamp(0, 15, avatar.position[1] + dy);
        } else {
            avatar = { userId, position: [randomInt(0, 15), 15], emotes: [] };
        }

        messaging.send('move', { position: avatar.position });
    }

    function listUsers() {
        if (usernames.size === 0)
            logChat('{clr=#FF00FF}! no other users');
        else
            logChat(`{clr=#FF00FF}! ${usernames.size} users: {clr=#FF0000}${Array.from(usernames.values()).join('{clr=#FF00FF}, {clr=#FF0000}')}`);
    }

    const help = [
        "press tab: toggle typing/controls",
        "press q: toggle queue",
        "press 1/2/3: toggle emotes",
        "/youtube videoId",
        "/search query terms",
        "/lucky search terms",
        "/avatar binary as base64",
        "/users",
    ].join('\n');

    function listHelp() {
        logChat('{clr=#FFFF00}? /help\n' + help);
    }

    function playFromSearchResult(args) {
        const index = parseInt(args) - 1;

        if (isNaN(index))
            logChat(`{clr=#FF00FF}! did not understand '${args}' as a number`);
        else if (!lastSearchResults || index < 0 || index >= lastSearchResults.length)
            logChat(`{clr=#FF00FF}! there is no #${index + 1} search result`);
        else
            messaging.send('youtube', { videoId: lastSearchResults[index].videoId });
    }

    const chatCommands = new Map();
    chatCommands.set('search',  args => messaging.send('search',  { query: args    }));
    chatCommands.set('youtube', args => messaging.send('youtube', { videoId: args  }));
    chatCommands.set('skip',    args => messaging.send('skip',    { password: args }));
    chatCommands.set('cat',     args => messaging.send('avatar',  { data: catData  }));
    chatCommands.set('users',   args => listUsers());
    chatCommands.set('help',    args => listHelp());
    chatCommands.set('result',  playFromSearchResult);
    chatCommands.set('lucky',   args => messaging.send('search',  { query: args, lucky: true }));
    chatCommands.set('reboot',  args => messaging.send('reboot',  { master_key: args }));
    chatCommands.set('avatar',  args => messaging.send('avatar',  { data: args }));

    document.addEventListener('keydown', event => {
        const typing = document.activeElement.tagName === "INPUT";

        if (!typing && event.key === 'Tab') {
            chatInput.focus();
            event.preventDefault();
        } else if (typing && (event.key === 'Tab' || event.key === 'Escape')) {
            chatInput.blur();
            event.preventDefault();
        }

        if (typing && event.key === 'Enter') {
            const line = chatInput.value;
            const slash = line.match(/^\/(\w+)(.*)/);

            if (slash) {
                const command = chatCommands.get(slash[1]);
                if (command) {
                    command(slash[2].trim());
                } else {
                    logChat(`{clr=#FF00FF}! no command /${slash[1]}`);
                    listHelp();
                }
            } else if (line.length > 0) {
                messaging.send('chat', {text: parseFakedown(line)});
            }

            chatInput.value = "";
        } 

        if (typing)
            return;

        function toggleEmote(emote) {
            const avatar = avatars.get(userId);
            if (!avatar) return;
            if (avatar.emotes.includes(emote))
                messaging.send('emotes', { emotes: avatar.emotes.filter(e => e !== emote) });
            else
                messaging.send('emotes', { emotes: avatar.emotes.concat([emote]) });
        }
        
        if (event.key === '1')
            toggleEmote('wvy');
        else if (event.key === '2')
            toggleEmote('shk');
        else if (event.key === '3')
            toggleEmote('rbw');

        if (event.key === "q") {
            showQueue = !showQueue;
        }

        if (event.key === 'ArrowLeft') {
            move(-1,  0);
            event.preventDefault();
        } else if (event.key === 'ArrowRight') {
            move( 1,  0);
            event.preventDefault();
        } else if (event.key === 'ArrowDown') {
            move( 0,  1);
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            move( 0, -1);
            event.preventDefault();
        }
    });

    // test canvas over youtube video

    const chatContext = document.querySelector('#chat-canvas').getContext('2d');
    chatContext.imageSmoothingEnabled = false;

    const canvas = document.querySelector('#scene-canvas');
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    const room = blitsy.createContext2D(512, 512);
    room.imageSmoothingEnabled = false;
    room.fillStyle = 'rgb(0, 82, 204)';
    room.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 16; ++x) {
        for (let y = 0; y < 10; ++y) {
            room.drawImage(brickTile.canvas, x * 32, y * 32, 32, 32);
        }
        for (let y = 10; y < 16; ++y) {
            room.drawImage(floorTile.canvas, x * 32, y * 32, 32, 32);
        }
    }

    room.fillStyle = 'rgb(0, 0, 0)';
    room.globalAlpha = .75;
    room.fillRect(0, 0, 512, 512);

    const dialog = blitsy.createContext2D(256, 256);
    const pageRenderer = new blitsy.PageRenderer(256, 256);

    function animatePage(page) {
        page.forEach((glyph, i) => {
            glyph.hidden = false;
            if (glyph.styles.has("r")) glyph.hidden = false;
            if (glyph.styles.has("clr")) {
                const hex = glyph.styles.get("clr");
                const rgb = blitsy.hex2rgb(hex);
                glyph.color = blitsy.rgb2num(...rgb);
            }
            if (glyph.styles.has("shk")) 
                glyph.offset = blitsy.makeVector2(randomInt(-1, 1), randomInt(-1, 1));
            if (glyph.styles.has("wvy"))
                glyph.offset.y = (Math.sin(i + performance.now() * 5 / 1000) * 3) | 0;
            if (glyph.styles.has("rbw")) {
                const h = Math.abs( Math.sin( (performance.now() / 600) - (i / 8) ) );
                [r, g, b] = hslToRgb( h, 1, 0.5 );
                glyph.color = blitsy.rgb2num(r, g, b);
            }
        });
    }

    const zoneLogo = document.querySelector('#zone-logo');
    function redraw() {
        youtube.hidden = player.getPlayerState() !== 1;
        zoneLogo.hidden = player.getPlayerState() === 1;

        dialog.clearRect(0, 0, 256, 256);
        pageRenderer.pageContext.clearRect(0, 0, 256, 256);

        chatContext.fillStyle = 'rgb(0, 0, 0)';
        chatContext.fillRect(0, 0, 512, 512);

        let bottom = 256 - 4;
        for (let i = chatPages.length - 1; i >= 0 && bottom >= 0; --i) {
            const page = chatPages[i];
            const height = getPageHeight(page, font);

            const y = bottom - height;

            animatePage(page);
            pageRenderer.renderPage(page, 8, y);
            chatContext.drawImage(pageRenderer.pageImage, 0, 0, 512, 512);
            bottom = y;
        }        

        context.clearRect(0, 0, 512, 512);
        context.drawImage(room.canvas, 0, 0);

        avatars.forEach((avatar, userId) => {
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


            const x = position[0] * 32 + dx;
            const y = position[1] * 32 + dy;

            let image = avatarTiles.get(userId) || avatarImage;

            if (avatar.emotes.includes('rbw')) {
                const h = Math.abs( Math.sin( (performance.now() / 600) - (position[0] / 8) ) );
                [r, g, b] = hslToRgb( h, 1, 0.5 );
                image = recolored(image, blitsy.rgb2num(r, g, b));
            }
            
            context.drawImage(image.canvas, x, y, 32, 32);
        });

        const lines = [];
        const cols = 40;
        function line(title, seconds) {
            const time = secondsToTime(seconds);
            const limit = cols - time.length;
            const cut = title.length < limit ? title.padEnd(limit, " ") : title.slice(0, limit - 4) + "... ";
            lines.push(cut + time);
        }

        const remaining = Math.round(player.getDuration() - player.getCurrentTime());
        if (currentVideo && remaining > 0)
            line(currentVideo.title, remaining);

        let total = remaining;

        if (showQueue) {
            queue.forEach((video, i) => {
                line(video.title, video.duration);
                total += video.duration;
            });
            line('*** END ***', total);
            lines[lines.length - 1] = '{clr=#FF00FF}' + lines[lines.length - 1];
        }

        const queuePage = blitsy.scriptToPages(lines.join('\n'), layout)[0];
        animatePage(queuePage);
        pageRenderer.renderPage(queuePage, 0, 0);
        context.drawImage(pageRenderer.pageImage, 16, 16, 512, 512);

        window.requestAnimationFrame(redraw);
    }

    redraw();

    const entrySplash = document.querySelector('#entry-splash');
    const entryButton = document.querySelector('#entry-button');
    entryButton.disabled = false;
    entryButton.addEventListener('click', () => {
        entrySplash.hidden = true;
        enter();
    });
}

function enter() {
    const joinName = document.querySelector('#join-name').value;
    document.querySelector('#chat-name').value = joinName;
    localStorage.setItem('name', joinName);
    const urlparams = new URLSearchParams(window.location.search);
    const zone = urlparams.get('zone') || 'zone-server.glitch.me/zone';
    messaging.connect('ws://' + zone);
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
