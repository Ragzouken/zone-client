import * as blitsy from 'blitsy';
import { num2hex, YoutubeVideo, hex2rgb, rgb2num, recolor, hslToRgb, clamp, randomInt, secondsToTime, fakedownToTag } from './utility';
import { Page, scriptToPages, PageRenderer, getPageHeight } from './text';
import { loadYoutube } from './youtube';
import { WebSocketMessaging } from './messaging';

let player: any;
async function start() {
    player = await loadYoutube('youtube', 448, 252);
    await load();
}
start();

type UserId = string;

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
    if ("Notification" in window && Notification.permission === "granted" && !document.hasFocus()) {
        new Notification(title, { body, tag, renotify: true, icon: './avatar.png' });
    }
}

const font = blitsy.decodeFont(blitsy.fonts['ascii-small']);
const layout = { font, lineWidth: 240, lineCount: 9999 };
const avatarTiles = new Map();

recolor(floorTile);
recolor(brickTile);

function parseFakedown(text: string) {
    text = fakedownToTag(text, '##', 'shk');
    text = fakedownToTag(text, '~~', 'wvy');
    text = fakedownToTag(text, '==', 'rbw');
    return text;
}

let messaging: WebSocketMessaging | undefined;

function setVolume(volume: number) {
    player.setVolume(volume);
    localStorage.setItem('volume', volume.toString());
}

async function load() {
    setVolume(parseInt(localStorage.getItem('volume') || "100", 10));

    //setInterval(() => fetch('http://zone-server.glitch.me', {mode: 'no-cors'}), 4 * 60 * 1000);
    const youtube = document.querySelector('#youtube') as HTMLElement;
    const joinName = document.querySelector('#join-name') as HTMLInputElement;
    const chatName = document.querySelector('#chat-name') as HTMLInputElement;
    const chatInput = document.querySelector('#chat-input') as HTMLInputElement;
    let chatPages: Page[] = [];

    chatName.value = localStorage.getItem('name') || "";
    joinName.value = chatName.value;

    let queue: YoutubeVideo[] = [];
    let currentVideo: YoutubeVideo | undefined;

    const avatars = new Map<UserId, any>();

    let userId: UserId;
    const usernames = new Map<UserId, string>();

    function getUsername(userId: UserId) {
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
            messaging!.send('name', { name: chatName.value });
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
        queue.push(...message.videos);
    });
    messaging.setHandler('youtube', message => {
        if (!message.videoId) {
            player.stopVideo();
            return;
        }
        const { videoId, title, duration, time } = message;
        retries = 0;
        player.loadVideoById(videoId, time / 1000);
        player.playVideo();
        logChat(`{clr=#00FFFF}> ${title} (${secondsToTime(duration)}){-clr}`);

        currentVideo = message;
        queue = queue.filter(video => video.videoId !== videoId);
    });

    function removeUser(userId: UserId) {
        avatars.delete(userId);
        usernames.delete(userId);
    }

    messaging.setHandler('users', message => {
        message.names.forEach(([user, name]: [UserId, string]) => {
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
        const texture: blitsy.TextureData = {
            _type: "texture", format: "M1", width: 8, height: 8, data: message.data
        };
        try {
            const context = blitsy.decodeTexture(texture);
            avatarTiles.set(message.userId, context);

            if (message.userId === userId)
                localStorage.setItem('avatar', message.data);
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
        if (message.userId !== userId) {
            notify(name, message.text, 'chat');
        }
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

    let lastSearchResults: YoutubeVideo[] = [];

    messaging.setHandler('search', message => {
        const { results }: { results: YoutubeVideo[] } = message;

        lastSearchResults = results;
        const lines = results.slice(0, 5).map(({ title, duration }, i) => `${i + 1}. ${title} (${secondsToTime(duration)})`);
        logChat('{clr=#FFFF00}? queue Search result with /result n\n{clr=#00FFFF}' + lines.join('\n'));
    });

    setInterval(() => messaging!.send('heartbeat', {}), 30 * 1000);

    window.onbeforeunload = () => messaging!.disconnect();

    let retries = 0;
    player.addEventListener('onError', () => {
        if (!currentVideo) return;

        if (retries >= 3) {
            messaging!.send('error', { videoId: currentVideo.videoId });
            console.log('youtube error after retries :(');
        } else {
            player.loadVideoById(currentVideo.videoId, currentVideo.time! / 1000);
            player.playVideo();
            retries += 1;
            console.log('youtube retry', retries);
        }
    });

    chatName.addEventListener('change', () => {
        localStorage.setItem('name', chatName.value);
        if (userId)
            messaging!.send('name', { name: chatName.value });
    });

    function logChat(text: string) {
        chatPages.push(scriptToPages(text, layout)[0]);
        chatPages = chatPages.slice(-32);
    }

    function move(dx: number, dy: number) {
        let avatar = avatars.get(userId);
        const spawning = !avatar;
        
        if (avatar) {
            avatar.position[0] = clamp(0, 15, avatar.position[0] + dx);
            avatar.position[1] = clamp(0, 15, avatar.position[1] + dy);
        } else {
            avatar = { userId, position: [randomInt(0, 15), 15], emotes: [] };
        }

        messaging!.send('move', { position: avatar.position });

        const data = localStorage.getItem('avatar');
        if (spawning && data)
            messaging!.send('avatar', { data });
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
        "/skip",
        "/avatar binary as base64",
        "/users",
        "/notify",
        "/volume 100",
        "/resync",
    ].join('\n');

    function listHelp() {
        logChat('{clr=#FFFF00}? /help\n' + help);
    }

    function playFromSearchResult(args: string) {
        const index = parseInt(args) - 1;

        if (isNaN(index))
            logChat(`{clr=#FF00FF}! did not understand '${args}' as a number`);
        else if (!lastSearchResults || index < 0 || index >= lastSearchResults.length)
            logChat(`{clr=#FF00FF}! there is no #${index + 1} search result`);
        else
            messaging!.send('youtube', { videoId: lastSearchResults[index].videoId });
    }

    const chatCommands = new Map<string, (args: string) => void>();
    chatCommands.set('search',  args => messaging!.send('search',  { query: args    }));
    chatCommands.set('youtube', args => messaging!.send('youtube', { videoId: args  }));
    chatCommands.set('skip',    args => {
        if (currentVideo)
            messaging!.send('skip',    { password: args, videoId: currentVideo.videoId })
    });
    chatCommands.set('users',   args => listUsers());
    chatCommands.set('help',    args => listHelp());
    chatCommands.set('result',  playFromSearchResult);
    chatCommands.set('lucky',   args => messaging!.send('search',  { query: args, lucky: true }));
    chatCommands.set('reboot',  args => messaging!.send('reboot',  { master_key: args }));
    chatCommands.set('avatar',  args => messaging!.send('avatar',  { data: args }));
    chatCommands.set('avatar2', args => {
        const ascii = args.replace(/\s+/g, '\n');
        const avatar = blitsy.decodeAsciiTexture(ascii, '1');
        const data = blitsy.encodeTexture(avatar, 'M1').data;
        messaging!.send('avatar', { data });
    });
    chatCommands.set('volume',  args => setVolume(parseInt(args.trim(), 10)));
    chatCommands.set('resync', () => messaging!.send('resync', {}));
    chatCommands.set('notify', async () => {
        const permission = await Notification.requestPermission();
        logChat(`{clr=#FF00FF}! notifications ${permission}`);
    });

    function toggleEmote(emote: string) {
        const avatar = avatars.get(userId);
        if (!avatar) return;
        if (avatar.emotes.includes(emote))
            messaging!.send('emotes', { emotes: avatar.emotes.filter((e: string) => e !== emote) });
        else
            messaging!.send('emotes', { emotes: avatar.emotes.concat([emote]) });
    }

    const gameKeys = new Map<string, () => void>();
    gameKeys.set('Tab', () => chatInput.focus());
    gameKeys.set('1', () => toggleEmote('wvy'));
    gameKeys.set('2', () => toggleEmote('sky'));
    gameKeys.set('3', () => toggleEmote('rbw'));
    gameKeys.set('q', () => showQueue = !showQueue);
    gameKeys.set('ArrowLeft',  () => move(-1,  0));
    gameKeys.set('ArrowRight', () => move( 1,  0));
    gameKeys.set('ArrowDown',  () => move( 0,  1));
    gameKeys.set('ArrowUp',    () => move( 0, -1));

    function sendChat() {
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
            messaging!.send('chat', {text: parseFakedown(line)});
        }

        chatInput.value = "";
    }

    document.addEventListener('keydown', event => {
        const typing = document.activeElement!.tagName === "INPUT";

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

    const room = blitsy.createContext2D(512, 512);
    room.imageSmoothingEnabled = false;
    drawRoom(room);

    const dialog = blitsy.createContext2D(256, 256);
    const pageRenderer = new PageRenderer(256, 256);

    function animatePage(page: Page) {
        page.forEach((glyph, i) => {
            glyph.hidden = false;
            if (glyph.styles.has("r")) glyph.hidden = false;
            if (glyph.styles.has("clr")) {
                const hex = glyph.styles.get("clr") as string;
                const rgb = hex2rgb(hex);
                glyph.color = rgb2num(...rgb);
            }
            if (glyph.styles.has("shk")) 
                glyph.offset = blitsy.makeVector2(randomInt(-1, 1), randomInt(-1, 1));
            if (glyph.styles.has("wvy"))
                glyph.offset.y = (Math.sin(i + performance.now() * 5 / 1000) * 3) | 0;
            if (glyph.styles.has("rbw")) {
                const h = Math.abs( Math.sin( (performance.now() / 600) - (i / 8) ) );
                const [r, g, b] = hslToRgb( h, 1, 0.5 );
                glyph.color = rgb2num(r, g, b);
            }
        });
    }

    const zoneLogo = document.querySelector('#zone-logo') as HTMLElement;
    function redraw() {
        youtube.hidden = player.getPlayerState() !== 1;
        zoneLogo.hidden = player.getPlayerState() === 1;

        dialog.clearRect(0, 0, 256, 256);

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

        sceneContext.clearRect(0, 0, 512, 512);
        sceneContext.drawImage(room.canvas, 0, 0);

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
                image = recolored(image, rgb2num(r, g, b));
            }
            
            sceneContext.drawImage(image.canvas, x, y, 32, 32);
        });

        const lines: string[] = [];
        const cols = 40;
        function line(title: string, seconds: number) {
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

        const queuePage = scriptToPages(lines.join('\n'), layout)[0];
        animatePage(queuePage);
        pageRenderer.renderPage(queuePage, 0, 0);

        const height = getPageHeight(queuePage, font);
        chatContext.fillStyle = 'rgb(0, 0, 0)';
        chatContext.fillRect(0, 0, 512, height * 2 + 16);
        chatContext.drawImage(pageRenderer.pageImage, 16, 16, 512, 512);

        window.requestAnimationFrame(redraw);
    }

    redraw();

    setupEntrySplash();
}

function drawRoom(room: CanvasRenderingContext2D) {
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
    const zone = urlparams.get('zone') || 'zone-server.glitch.me/zone';
    messaging!.connect('ws://' + zone);
}
