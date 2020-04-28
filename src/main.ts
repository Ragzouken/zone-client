import * as blitsy from 'blitsy';
import {
    num2hex,
    YoutubeVideo,
    rgb2num,
    recolor,
    hslToRgb,
    clamp,
    randomInt,
    secondsToTime,
    fakedownToTag,
    eventToElementPixel,
    withPixels,
    sleep,
} from './utility';
import { scriptToPages, PageRenderer, getPageHeight } from './text';
import { loadYoutube, YoutubePlayer } from './youtube';
import { ChatPanel, animatePage } from './chat';
import { UserId, ZoneClient, UserState } from './client';

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

function getTile(base64: string | undefined): CanvasRenderingContext2D | undefined {
    if (!base64) return;
    let tile = avatarTiles.get(base64);
    if (!tile) {
        try {
            tile = decodeBase64(base64);
            avatarTiles.set(base64, tile);
        } catch (e) {
            console.log('fucked up avatar', base64);
        }
    }
    return tile;
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

const chat = new ChatPanel();

function setVolume(volume: number) {
    player!.volume = volume;
    localStorage.setItem('volume', volume.toString());
}

let localName = localStorage.getItem('name') || '';

function rename(name: string) {
    localStorage.setItem('name', name);
    localName = name;
    client.messaging.send('name', { name });
}

async function load() {
    setVolume(parseInt(localStorage.getItem('volume') || '100', 10));

    const youtube = document.querySelector('#youtube') as HTMLElement;
    const joinName = document.querySelector('#join-name') as HTMLInputElement;
    const chatInput = document.querySelector('#chat-input') as HTMLInputElement;

    joinName.value = localName;

    let queue: YoutubeVideo[] = [];
    let currentVideoMessage: YoutubeVideo | undefined;

    function getUsername(userId: UserId) {
        return client.zone.getUser(userId).name || userId;
    }

    let showQueue = false;
    let remember: UserState | undefined;

    client.messaging.on('open', async () => {
        queue.length = 0;
        client.zone.reset();
        client.messaging.send('join', { name: localName, token: client.localToken, password: client.joinPassword });
    });
    client.messaging.on('close', async (code) => {
        remember = client.localUser;
        if (code <= 1001) return;
        await sleep(100);
        client.messaging.reconnect();
    });

    client.messaging.setHandler('reject', () => {
        chat.log('{clr=#FF00FF}! enter server password with /password)');
    });
    client.messaging.setHandler('heartbeat', () => {});
    client.messaging.setHandler('assign', (message) => {
        if (remember) {
            if (remember.position) client.messaging.send('move', { position: remember.position });
            if (remember.avatar) {
                client.messaging.send('avatar', { data: remember.avatar });
                client.messaging.send('emotes', { emotes: remember.emotes });
            }
        }

        client.localUserId = message.userId;
        client.localToken = message.token;
    });
    client.messaging.setHandler('queue', (message) => {
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
    client.messaging.setHandler('youtube', (message) => {
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

    client.messaging.setHandler('users', (message) => {
        chat.log('{clr=#00FF00}*** connected ***');
        if (!remember) listHelp();

        client.zone.users.clear();
        message.users.forEach((user: UserState) => {
            client.zone.users.set(user.userId, user);
        });
        listUsers();
    });
    client.messaging.setHandler('leave', (message) => {
        const username = getUsername(message.userId);
        chat.log(`{clr=#FF00FF}! {clr=#FF0000}${username}{clr=#FF00FF} left`);
        client.zone.users.delete(message.userId);
    });
    client.messaging.setHandler('move', (message) => {
        const user = client.zone.getUser(message.userId);

        if (user !== client.localUser || !user.position) user.position = message.position;
    });
    client.messaging.setHandler('avatar', (message) => {
        client.zone.getUser(message.userId).avatar = message.data;

        if (message.userId === client.localUserId) localStorage.setItem('avatar', message.data);

        if (!avatarTiles.has(message.data)) {
            try {
                avatarTiles.set(message.data, decodeBase64(message.data));
            } catch (e) {
                console.log('fucked up avatar', getUsername(message.userId));
            }
        }
    });
    client.messaging.setHandler('emotes', (message) => {
        client.zone.getUser(message.userId).emotes = message.emotes;
    });
    client.messaging.setHandler('chat', (message) => {
        const name = getUsername(message.userId);
        chat.log(`{clr=#FF0000}${name}:{-clr} ${message.text}`);
        if (message.userId !== client.localUserId) {
            notify(name, message.text, 'chat');
        }
    });
    client.messaging.setHandler('status', (message) => chat.log(`{clr=#FF00FF}! ${message.text}`));
    client.messaging.setHandler('name', (message) => {
        const next = message.name;
        if (message.userId === client.localUserId) {
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

    client.messaging.setHandler('search', (message) => {
        const { results }: { results: YoutubeVideo[] } = message;

        lastSearchResults = results;
        const lines = results
            .slice(0, 5)
            .map(({ title, duration }, i) => `${i + 1}. ${title} (${secondsToTime(duration)})`);
        chat.log('{clr=#FFFF00}? queue Search result with /result n\n{clr=#00FFFF}' + lines.join('\n'));
    });

    setInterval(() => client.messaging.send('heartbeat', {}), 30 * 1000);

    window.onbeforeunload = () => client.messaging.disconnect();

    player!.on('error', () => client.messaging.send('error', { videoId: player!.video }));

    function move(dx: number, dy: number) {
        const user = client.localUser;

        if (user.position) {
            user.position[0] = clamp(0, 15, user.position[0] + dx);
            user.position[1] = clamp(0, 15, user.position[1] + dy);
        } else {
            user.position = [randomInt(0, 15), 15];
        }

        client.messaging.send('move', { position: user.position });

        if (!user.avatar) {
            // send saved avatar
            const data = localStorage.getItem('avatar');
            if (data) client.messaging.send('avatar', { data });
        }
    }

    function listUsers() {
        const named = Array.from(client.zone.users.values()).filter((user) => !!user.name);

        if (named.length === 0) {
            chat.log('{clr=#FF00FF}! no other users');
        } else {
            const names = named.map((user) => user.name);
            const line = names.join('{clr=#FF00FF}, {clr=#FF0000}');
            chat.log(`{clr=#FF00FF}! ${names.length} users: {clr=#FF0000}${line}`);
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
        '/avatar',
        '/users',
        '/name',
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
        else client.messaging.send('youtube', { videoId: lastSearchResults[index].videoId });
    }

    const avatarPanel = document.querySelector('#avatar-panel') as HTMLElement;
    const avatarPaint = document.querySelector('#avatar-paint') as HTMLCanvasElement;
    const avatarUpdate = document.querySelector('#avatar-update') as HTMLButtonElement;
    const avatarCancel = document.querySelector('#avatar-cancel') as HTMLButtonElement;
    const avatarContext = avatarPaint.getContext('2d')!;

    function openAvatarEditor() {
        const avatar = getTile(client.localUser.avatar) || avatarImage;
        avatarContext.clearRect(0, 0, 8, 8);
        avatarContext.drawImage(avatar.canvas, 0, 0);
        avatarPanel.hidden = false;
    }

    avatarPaint.addEventListener('pointerdown', (event) => {
        const scaling = 8 / avatarPaint.clientWidth;
        const [cx, cy] = eventToElementPixel(event, avatarPaint);
        const [px, py] = [Math.floor(cx * scaling), Math.floor(cy * scaling)];
        withPixels(avatarContext, (pixels) => {
            pixels[py * 8 + px] = 0xffffffff - pixels[py * 8 + px];
        });
    });

    avatarUpdate.addEventListener('click', () => {
        const data = blitsy.encodeTexture(avatarContext, 'M1').data;
        client.messaging.send('avatar', { data });
    });
    avatarCancel.addEventListener('click', () => (avatarPanel.hidden = true));

    const chatCommands = new Map<string, (args: string) => void>();
    chatCommands.set('search', (args) => client.messaging.send('search', { query: args }));
    chatCommands.set('youtube', (args) => client.messaging.send('youtube', { videoId: args }));
    chatCommands.set('skip', (args) => {
        if (currentVideoMessage)
            client.messaging.send('skip', { password: args, videoId: currentVideoMessage.videoId });
    });
    chatCommands.set('password', (args) => (client.joinPassword = args));
    chatCommands.set('users', (args) => listUsers());
    chatCommands.set('help', (args) => listHelp());
    chatCommands.set('result', playFromSearchResult);
    chatCommands.set('lucky', (args) => client.messaging.send('search', { query: args, lucky: true }));
    chatCommands.set('reboot', (args) => client.messaging.send('reboot', { master_key: args }));
    chatCommands.set('avatar', (args) => {
        if (args.trim().length === 0) {
            openAvatarEditor();
        } else {
            client.messaging.send('avatar', { data: args });
        }
    });
    chatCommands.set('avatar2', (args) => {
        const ascii = args.replace(/\s+/g, '\n');
        const avatar = blitsy.decodeAsciiTexture(ascii, '1');
        const data = blitsy.encodeTexture(avatar, 'M1').data;
        client.messaging.send('avatar', { data });
    });
    chatCommands.set('volume', (args) => setVolume(parseInt(args.trim(), 10)));
    chatCommands.set('resync', () => client.messaging.send('resync', {}));
    chatCommands.set('notify', async () => {
        const permission = await Notification.requestPermission();
        chat.log(`{clr=#FF00FF}! notifications ${permission}`);
    });
    chatCommands.set('name', rename);

    function toggleEmote(emote: string) {
        const emotes = client.localUser.emotes;
        if (emotes.includes(emote))
            client.messaging.send('emotes', { emotes: emotes.filter((e: string) => e !== emote) });
        else client.messaging.send('emotes', { emotes: emotes.concat([emote]) });
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
            client.messaging.send('chat', { text: parseFakedown(line) });
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

        client.zone.users.forEach((user) => {
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

            let image = getTile(avatar) || avatarImage;

            if (emotes && emotes.includes('rbw')) {
                const h = Math.abs(Math.sin(performance.now() / 600 - position[0] / 8));
                [r, g, b] = hslToRgb(h, 1, 0.5);
                image = recolored(image, rgb2num(r, g, b));
            }

            sceneContext.drawImage(image.canvas, x, y, 32, 32);
        });

        const state = client.messaging.websocket?.readyState;

        if (state !== WebSocket.OPEN) {
            const status = scriptToPages('connecting...', layout)[0];
            animatePage(status);
            pageRenderer.renderPage(status, 0, 0);
            sceneContext.drawImage(pageRenderer.pageImage, 16, 16, 512, 512);
        }
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
    localName = (document.querySelector('#join-name') as HTMLInputElement).value;
    localStorage.setItem('name', localName);
    const urlparams = new URLSearchParams(window.location.search);
    const zoneURL = urlparams.get('zone') || 'zone-server.glitch.me/zone';
    client.messaging.connect('ws://' + zoneURL);
}
