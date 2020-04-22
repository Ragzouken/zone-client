import * as blitsy from 'blitsy';
import {
    num2hex,
    YoutubeVideo,
    hex2rgb,
    rgb2num,
    recolor,
    hslToRgb,
    clamp,
    randomInt,
    secondsToTime,
    fakedownToTag,
} from './utility';
import { scriptToPages, PageRenderer, getPageHeight } from './text';
import { loadYoutube, YoutubePlayer } from './youtube';
import { WebSocketMessaging } from './messaging';
import { ChatPanel, animatePage } from './chat';
import { UserId, ZoneClient } from './client';

export const client = new ZoneClient();

let player: YoutubePlayer | undefined;
async function start() {
    player = await loadYoutube('youtube', 448, 252);
    await load();
}
start();

const avatarImage = blitsy.decodeAsciiTexture(
    `
___XX___
___XX___
___XX___
__XXXX__
_XXXXXX_
X_XXXX_X
__X__X__
__X__X__
`,
    'X',
);

const floorTile = blitsy.decodeAsciiTexture(
    `
________
_X_X_X_X
________
__X_____
________
X_X_X_X_
________
_____X__
`,
    'X',
);

const brickTile = blitsy.decodeAsciiTexture(
    `
###_####
###_####
###_####
________
#######_
#######_
#######_
________
`,
    '#',
);


recolor(floorTile);
recolor(brickTile);

const roomBackground = blitsy.createContext2D(128, 128);
drawRoomBackground(roomBackground);

function drawRoomBackground(room: CanvasRenderingContext2D) {
    room.fillStyle = 'rgb(0, 82, 204)';
    room.fillRect(0, 0, 128, 128);

    for (let x = 0; x < 16; ++x) {
        for (let y = 0; y < 10; ++y) {
            room.drawImage(brickTile.canvas, x * 8, y * 8);
        }
        for (let y = 10; y < 16; ++y) {
            room.drawImage(floorTile.canvas, x * 8, y * 8);
        }
    }

    room.fillStyle = 'rgb(0, 0, 0)';
    room.globalAlpha = 0.75;
    room.fillRect(0, 0, 128, 128);
}

const avatarTiles = new Map<string | undefined, CanvasRenderingContext2D>();
avatarTiles.set(undefined, avatarImage);

function decodeBase64(data: string) {
    const texture: blitsy.TextureData = {
        _type: 'texture',
        format: 'M1',
        width: 8,
        height: 8,
        data,
    };
    return blitsy.decodeTexture(texture);
}

const recolorBuffer = blitsy.createContext2D(8, 8);

function recolored(tile: CanvasRenderingContext2D, color: number) {
    recolorBuffer.clearRect(0, 0, 8, 8);
    recolorBuffer.fillStyle = num2hex(color);
    recolorBuffer.fillRect(0, 0, 8, 8);
    recolorBuffer.globalCompositeOperation = 'destination-in';
    recolorBuffer.drawImage(tile.canvas, 0, 0);
    recolorBuffer.globalCompositeOperation = 'source-over';
    return recolorBuffer;
}

function notify(title: string, body: string, tag: string) {
    if ('Notification' in window && Notification.permission === 'granted' && !document.hasFocus()) {
        const notification = new Notification(title, { body, tag, renotify: true, icon: './avatar.png' });
    }
}

const font = blitsy.decodeFont(blitsy.fonts['ascii-small']);
const layout = { font, lineWidth: 240, lineCount: 9999 };

function parseFakedown(text: string) {
    text = fakedownToTag(text, '##', 'shk');
    text = fakedownToTag(text, '~~', 'wvy');
    text = fakedownToTag(text, '==', 'rbw');
    return text;
}

let messaging: WebSocketMessaging | undefined;
let chat = new ChatPanel();

function setVolume(volume: number) {
    player!.volume = volume;
    localStorage.setItem('volume', volume.toString());
}

async function load() {
    setVolume(parseInt(localStorage.getItem('volume') || '100', 10));

    const youtube = document.querySelector('#youtube') as HTMLElement;
    const joinName = document.querySelector('#join-name') as HTMLInputElement;
    const chatName = document.querySelector('#chat-name') as HTMLInputElement;
    const chatInput = document.querySelector('#chat-input') as HTMLInputElement;

    chatName.value = localStorage.getItem('name') || '';
    joinName.value = chatName.value;

    let queue: YoutubeVideo[] = [];
    let currentVideoMessage: YoutubeVideo | undefined;

    let localUserId: UserId;

    function getUsername(userId: UserId) {
        return client.zone.getUser(userId).name || userId;
    }

    let showQueue = false;

    messaging = new WebSocketMessaging();
    messaging.setHandler('heartbeat', () => {});
    messaging.setHandler('assign', (message) => {
        chat.log('{clr=#00FF00}*** connected ***');
        listHelp();
        localUserId = message.userId;
        // send name
        if (chatName.value.length > 0) messaging!.send('name', { name: chatName.value });

        queue.length = 0;
        client.zone.reset();
    });
    messaging.setHandler('queue', (message) => {
        if (message.videos.length === 1) {
            const video = message.videos[0];
            chat.log(
                `{clr=#00FFFF}+ ${video.title} (${secondsToTime(video.duration)}) added by {clr=#FF0000}${getUsername(
                    video.meta.userId,
                )}`,
            );
        }
        queue.push(...message.videos);
    });
    messaging.setHandler('youtube', (message) => {
        if (!message.videoId) {
            player!.stop();
            return;
        }
        const { videoId, title, duration, time } = message;
        player!.playVideoById(videoId, time / 1000);
        chat.log(`{clr=#00FFFF}> ${title} (${secondsToTime(duration)})`);

        currentVideoMessage = message;
        queue = queue.filter((video) => video.videoId !== videoId);
    });

    messaging.setHandler('users', (message) => {
        message.names.forEach(([user, name]: [UserId, string]) => {
            client.zone.getUser(user).name = name;
        });
        listUsers();
    });

    messaging.setHandler('leave', (message) => client.zone.users.delete(message.userId));
    messaging.setHandler('move', (message) => {
        client.zone.getUser(message.userId).position = message.position;
    });
    messaging.setHandler('avatar', (message) => {
        client.zone.getUser(message.userId).avatar = message.data;

        if (message.userId === localUserId) localStorage.setItem('avatar', message.data);

        if (!avatarTiles.has(message.data)) {
            try {
                avatarTiles.set(message.data, decodeBase64(message.data));
            } catch (e) {
                console.log('fucked up avatar', getUsername(message.userId));
            }
        }
    });
    messaging.setHandler('emotes', (message) => {
        client.zone.getUser(message.userId).emotes = message.emotes;
    });
    messaging.setHandler('chat', (message) => {
        const name = getUsername(message.userId);
        chat.log(`{clr=#FF0000}${name}:{-clr} ${message.text}`);
        if (message.userId !== localUserId) {
            notify(name, message.text, 'chat');
        }
    });
    messaging.setHandler('status', (message) => chat.log(`{clr=#FF00FF}! ${message.text}`));
    messaging.setHandler('name', (message) => {
        const next = message.name;
        if (message.userId === localUserId) {
            chat.log(`{clr=#FF00FF}! you are {clr=#FF0000}${next}`);
        } else if (!client.zone.users.has(message.userId)) {
            chat.log(`{clr=#FF00FF}! {clr=#FF0000}${next} {clr=#FF00FF}joined`);
        } else {
            const prev = getUsername(message.userId);
            chat.log(`{clr=#FF00FF}! {clr=#FF0000}${prev}{clr=#FF00FF} is now {clr=#FF0000}${next}`);
        }

        client.zone.getUser(message.userId).name = message.name;
    });

    let lastSearchResults: YoutubeVideo[] = [];

    messaging.setHandler('search', (message) => {
        const { results }: { results: YoutubeVideo[] } = message;

        lastSearchResults = results;
        const lines = results
            .slice(0, 5)
            .map(({ title, duration }, i) => `${i + 1}. ${title} (${secondsToTime(duration)})`);
        chat.log('{clr=#FFFF00}? queue Search result with /result n\n{clr=#00FFFF}' + lines.join('\n'));
    });

    setInterval(() => messaging!.send('heartbeat', {}), 30 * 1000);

    window.onbeforeunload = () => messaging!.disconnect();

    player!.on('error', () => messaging!.send('error', { videoId: player!.video }));

    chatName.addEventListener('change', () => {
        localStorage.setItem('name', chatName.value);
        if (localUserId) messaging!.send('name', { name: chatName.value });
    });

    function move(dx: number, dy: number) {
        const user = client.zone.getUser(localUserId);

        if (user.position) {
            user.position[0] = clamp(0, 15, user.position[0] + dx);
            user.position[1] = clamp(0, 15, user.position[1] + dy);
        } else {
            user.position = [randomInt(0, 15), 15];
        }

        messaging!.send('move', { position: user.position });

        if (!user.avatar) {
            // send saved avatar
            const data = localStorage.getItem('avatar');
            if (data) messaging!.send('avatar', { data });
        }
    }

    function listUsers() {
        if (client.zone.users.size === 0) {
            chat.log('{clr=#FF00FF}! no other users');
        } else {
            const names = Array.from(client.zone.users.values()).map((user) => getUsername(user.userId));
            chat.log(
                `{clr=#FF00FF}! ${client.zone.users.size} users: {clr=#FF0000}${names.join('{clr=#FF00FF}, {clr=#FF0000}')}`,
            );
        }
    }

    const help = [
        'press tab: toggle typing/controls',
        'press q: toggle queue',
        'press 1/2/3: toggle emotes',
        '/youtube videoId',
        '/search query terms',
        '/lucky search terms',
        '/skip',
        '/avatar binary as base64',
        '/users',
        '/notify',
        '/volume 100',
        '/resync',
    ].join('\n');

    function listHelp() {
        chat.log('{clr=#FFFF00}? /help\n' + help);
    }

    function playFromSearchResult(args: string) {
        const index = parseInt(args, 10) - 1;

        if (isNaN(index)) chat.log(`{clr=#FF00FF}! did not understand '${args}' as a number`);
        else if (!lastSearchResults || index < 0 || index >= lastSearchResults.length)
            chat.log(`{clr=#FF00FF}! there is no #${index + 1} search result`);
        else messaging!.send('youtube', { videoId: lastSearchResults[index].videoId });
    }

    const chatCommands = new Map<string, (args: string) => void>();
    chatCommands.set('search', (args) => messaging!.send('search', { query: args }));
    chatCommands.set('youtube', (args) => messaging!.send('youtube', { videoId: args }));
    chatCommands.set('skip', (args) => {
        if (currentVideoMessage) messaging!.send('skip', { password: args, videoId: currentVideoMessage.videoId });
    });
    chatCommands.set('users', (args) => listUsers());
    chatCommands.set('help', (args) => listHelp());
    chatCommands.set('result', playFromSearchResult);
    chatCommands.set('lucky', (args) => messaging!.send('search', { query: args, lucky: true }));
    chatCommands.set('reboot', (args) => messaging!.send('reboot', { master_key: args }));
    chatCommands.set('avatar', (args) => messaging!.send('avatar', { data: args }));
    chatCommands.set('avatar2', (args) => {
        const ascii = args.replace(/\s+/g, '\n');
        const avatar = blitsy.decodeAsciiTexture(ascii, '1');
        const data = blitsy.encodeTexture(avatar, 'M1').data;
        messaging!.send('avatar', { data });
    });
    chatCommands.set('volume', (args) => setVolume(parseInt(args.trim(), 10)));
    chatCommands.set('resync', () => messaging!.send('resync', {}));
    chatCommands.set('notify', async () => {
        const permission = await Notification.requestPermission();
        chat.log(`{clr=#FF00FF}! notifications ${permission}`);
    });

    function toggleEmote(emote: string) {
        const user = client.zone.getUser(localUserId);
        if (user.emotes.includes(emote))
            messaging!.send('emotes', { emotes: user.emotes.filter((e: string) => e !== emote) });
        else messaging!.send('emotes', { emotes: user.emotes.concat([emote]) });
    }

    const gameKeys = new Map<string, () => void>();
    gameKeys.set('Tab', () => chatInput.focus());
    gameKeys.set('1', () => toggleEmote('wvy'));
    gameKeys.set('2', () => toggleEmote('shk'));
    gameKeys.set('3', () => toggleEmote('rbw'));
    gameKeys.set('q', () => (showQueue = !showQueue));
    gameKeys.set('ArrowLeft', () => move(-1, 0));
    gameKeys.set('ArrowRight', () => move(1, 0));
    gameKeys.set('ArrowDown', () => move(0, 1));
    gameKeys.set('ArrowUp', () => move(0, -1));

    function sendChat() {
        const line = chatInput.value;
        const slash = line.match(/^\/(\w+)(.*)/);

        if (slash) {
            const command = chatCommands.get(slash[1]);
            if (command) {
                command(slash[2].trim());
            } else {
                chat.log(`{clr=#FF00FF}! no command /${slash[1]}`);
                listHelp();
            }
        } else if (line.length > 0) {
            messaging!.send('chat', { text: parseFakedown(line) });
        }

        chatInput.value = '';
    }

    document.addEventListener('keydown', (event) => {
        const typing = document.activeElement!.tagName === 'INPUT';

        if (typing) {
            if (event.key === 'Tab' || event.key === 'Escape') {
                chatInput.blur();
                event.preventDefault();
            } else if (event.key === 'Enter') {
                sendChat();
            }
        } else if (!typing) {
            const func = gameKeys.get(event.key);
            if (func) {
                func();
                event.stopPropagation();
                event.preventDefault();
            }
        }
    });

    const chatContext = document.querySelector<HTMLCanvasElement>('#chat-canvas')!.getContext('2d')!;
    chatContext.imageSmoothingEnabled = false;

    const sceneContext = document.querySelector<HTMLCanvasElement>('#scene-canvas')!.getContext('2d')!;
    sceneContext.imageSmoothingEnabled = false;

    const pageRenderer = new PageRenderer(256, 256);
    const zoneLogo = document.querySelector('#zone-logo') as HTMLElement;

    function drawZone() {
        sceneContext.clearRect(0, 0, 512, 512);
        sceneContext.drawImage(roomBackground.canvas, 0, 0, 512, 512);
    
        client.zone.users.forEach((user, userId) => {
            const { position, emotes, avatar } = user;
            if (!position) return;
    
            let dx = 0;
            let dy = 0;
    
            if (emotes && emotes.includes('shk')) {
                dx += randomInt(-8, 8);
                dy += randomInt(-8, 8);
            }
    
            if (emotes && emotes.includes('wvy')) {
                dy += Math.sin(performance.now() / 250 - position[0] / 2) * 4;
            }
    
            let [r, g, b] = [255, 255, 255];
    
            const x = position[0] * 32 + dx;
            const y = position[1] * 32 + dy;
    
            let image = avatarTiles.get(avatar) || avatarImage;
    
            if (emotes && emotes.includes('rbw')) {
                const h = Math.abs(Math.sin(performance.now() / 600 - position[0] / 8));
                [r, g, b] = hslToRgb(h, 1, 0.5);
                image = recolored(image, rgb2num(r, g, b));
            }
    
            sceneContext.drawImage(image.canvas, x, y, 32, 32);
        });
    }

    function drawQueue() {
        const lines: string[] = [];
        const cols = 40;
        function line(title: string, seconds: number) {
            const time = secondsToTime(seconds);
            const limit = cols - time.length;
            const cut = title.length < limit ? title.padEnd(limit, ' ') : title.slice(0, limit - 4) + '... ';
            lines.push(cut + time);
        }

        const remaining = Math.round(player!.duration - player!.time);
        if (currentVideoMessage && remaining > 0) line(currentVideoMessage.title, remaining);

        let total = remaining;

        if (showQueue) {
            queue.forEach((video, i) => {
                line(video.title, video.duration);
                total += video.duration;
            });
            line('*** END ***', total);
            lines[lines.length - 1] = '{clr=#FF00FF}' + lines[lines.length - 1];
        }

        const queuePage = scriptToPages(lines.join('\n'), layout)[0];
        animatePage(queuePage);
        pageRenderer.renderPage(queuePage, 0, 0);

        const queueHeight = getPageHeight(queuePage, font);
        chatContext.fillRect(0, 0, 512, queueHeight * 2 + 16);
        chatContext.drawImage(pageRenderer.pageImage, 16, 16, 512, 512);
    }

    function redraw() {
        youtube.hidden = !player!.playing;
        zoneLogo.hidden = player!.playing;

        drawZone();
        
        chatContext.fillStyle = 'rgb(0, 0, 0)';
        chatContext.fillRect(0, 0, 512, 512);

        chat.render();
        chatContext.drawImage(chat.context.canvas, 0, 0, 512, 512);
        drawQueue();

        window.requestAnimationFrame(redraw);
    }

    redraw();

    setupEntrySplash();
}

function setupEntrySplash() {
    const entrySplash = document.querySelector('#entry-splash') as HTMLElement;
    const entryButton = document.querySelector('#entry-button') as HTMLButtonElement;
    entryButton.disabled = false;
    entryButton.addEventListener('click', () => {
        entrySplash.hidden = true;
        enter();
    });
}

function enter() {
    const joinName = (document.querySelector('#join-name') as HTMLInputElement).value;
    (document.querySelector('#chat-name') as HTMLInputElement).value = joinName;
    localStorage.setItem('name', joinName);
    const urlparams = new URLSearchParams(window.location.search);
    const zoneURL = urlparams.get('zone') || 'zone-server.glitch.me/zone';
    messaging!.connect('ws://' + zoneURL);
}
