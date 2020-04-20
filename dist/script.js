(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.zone = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function base64ToUint8(base64) {
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8ClampedArray(new ArrayBuffer(rawLength));
    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}
exports.base64ToUint8 = base64ToUint8;
function uint8ToBase64(u8Arr) {
    var CHUNK_SIZE = 0x8000; // arbitrary number
    var index = 0;
    var length = u8Arr.length;
    var result = '';
    while (index < length) {
        var slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
        result += String.fromCharCode.apply(null, slice);
        index += CHUNK_SIZE;
    }
    return btoa(result);
}
exports.uint8ToBase64 = uint8ToBase64;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAGENTA_CANVAS_4X4 = createCanvas(4, 4);
var context = exports.MAGENTA_CANVAS_4X4.getContext('2d');
context.fillStyle = '#FF00FF';
context.fillRect(0, 0, 4, 4);
/**
 * Create a new html canvas.
 * @param width canvas width in pixels.
 * @param height canvas height in pixels.
 */
function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
exports.createCanvas = createCanvas;
/**
 * Create a new canvas and get a 2d rendering context from it.
 * @param width canvas width in pixels.
 * @param height canvas height in pixels.
 */
function createContext2D(width, height) {
    var canvas = createCanvas(width, height);
    return canvas.getContext('2d');
}
exports.createContext2D = createContext2D;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function colorToHex(color) {
    color = (color | 0xff000000) >>> 0;
    var abgrHex = color.toString(16);
    return abgrHex.substr(6, 2) + abgrHex.substr(4, 2) + abgrHex.substr(2, 2);
}
exports.colorToHex = colorToHex;
function colorToRgba(color) {
    return { r: (color >> 0) & 0xff, g: (color >> 8) & 0xff, b: (color >> 16) & 0xff, a: (color >> 24) & 0xff };
}
exports.colorToRgba = colorToRgba;
function rgbaToColor(rgba) {
    var r = rgba.r, g = rgba.g, b = rgba.b, a = rgba.a;
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}
exports.rgbaToColor = rgbaToColor;
function rgbToHex(rgba) {
    return colorToHex(rgbaToColor(rgba));
}
exports.rgbToHex = rgbToHex;
function hexToRgb(hex) {
    var bgrHex = hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2);
    return colorToRgba(parseInt(bgrHex, 16) | 0xff000000);
}
exports.hexToRgb = hexToRgb;
function hexToColor(hex) {
    return rgbaToColor(hexToRgb(hex));
}
exports.hexToColor = hexToColor;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sprite_1 = require("./sprite");
var texture_1 = require("./texture");
exports.EMPTY_FONT = {
    name: 'empty',
    lineHeight: 0,
    characters: new Map(),
};
function decodeFontUniform(fontData) {
    var characters = new Map();
    var atlas = texture_1.decodeTexture(fontData.atlas);
    var width = fontData.charWidth;
    var height = fontData.charHeight;
    var offset = sprite_1.makeVector2(0, 0);
    var spacing = fontData.charWidth;
    var cols = fontData.atlas.width / width;
    fontData.index.forEach(function (codepoint, i) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        var rect = sprite_1.makeRect(col * width, row * height, width, height);
        var sprite = sprite_1.makeSprite(atlas.canvas, rect);
        characters.set(codepoint, { codepoint: codepoint, sprite: sprite, offset: offset, spacing: spacing });
    });
    return { name: fontData.name, lineHeight: height, characters: characters };
}
exports.decodeFontUniform = decodeFontUniform;
function decodeFont(fontData) {
    return decodeFontUniform(fontData);
}
exports.decodeFont = decodeFont;

},{"./sprite":8,"./texture":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = { "_type": "font", "format": "U", "name": "ascii_small", "charWidth": 6, "charHeight": 8, "index": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255], "atlas": { "_type": "texture", "format": "M1", "width": 6, "height": 2048, "data": "AAAAAAAAnGiLqsgBnK/6os8BAOX7PocAAEBxHAIACMchvo8AAML5PsIBAAAwDAAA///P8///AOBJkgcA/x+2bfj/AA6zksQAnChyCIcACIYijGMAMEuztG0AgMrZnAoABMPxHEMAEMZ5HAYBCOcjPocAFEVRFEABvKqyKIoCnMhQmMgBAAAAgOcBCOcjPodwCOcjCIIACIIgPocAAIL5GAIAAML4DAIAAAAIguADAEX5FAUACMJxvg8Avs9xCAIAAAAAAAAACMchCIAAti0BAAAAAOVTlE8BBCcwkIMApgkhhCwDhKIQqsQCDEMAAAAACEEQBIEABIIgCEIAAMX5HAUAAIL4CAIAAAAAAMMQAAD4AAAAAAAAAMMAAAghhAAAnCirpsgBCIMgCMIBnAhihOADnAhyoMgBEEZJPgQBviB4oMgBGCF4osgBPgghBEEAnChyosgBnCjyIMQAAMAwAMMAAMAwAMMQEEIIBAIBAOADgA8ABAKBEEIAnAhiCIAAnKirusABnCiKvigCnih6ougBnCgIgsgBniiKougBviB4guADviB4giAAnCjoosgDoij6oigCHIIgCMIBIAiCosgBoqQYiiQCgiAIguADoq2KoigCoqnKoigCnCiKosgBnih6giAAnCiKqsQCnih6kigCnChwoMgBPoIgCIIAoiiKosgBoiiKIoUAoqiqqkoBokghlCgCoihSCIIAHoQQguABHEEQBMEBgEAgEAgAHARBEMQBCCUCAAAAAAAAAAD8DIMAAAAAAMCBvMgDguCJougBAMCJgsgBIMiLosgDAMCJnsABGEF4BEEAAMCLIg9yguBIkiQBCIAgCIIBEIBBECQxgiAphiIBCIIgCIIBAGCpqigCAOBIkiQBAMCJosgBAOCJougJAMCLosiDAKCRBOEAAMAJHMgBAOERBIUAACBJkkYBACCKIoUAACCKqk8BACBJjCQBACBJEocYAOBBjOABGEEYBIEBCIIgCIIgDATBEMQAlAIAAAAACGeLog8AnCgIIocwEiBJkkYBMMCJnsABHMCBvMgDFMCBvMgDDMCBvMgDHMWBvMgDACcKIocwHMCJnsABFMCJnsABDMCJnsABFIAgCIIBCAUgCIIBBIAgCIIBFIBQoi8CHMXZoi8CMOALnuADAOChvsIDvKL4iqIDHMBIksQAFMBIksQABsBIksQAHCBJkkYBBiBJkkYBFCBJEocYEiNJksQAFCBJksQAAMIJAocAGEl4BKkDIoX4iI8AhqJYuiQBEIpwCKIQGMCBvMgDGIAgCIIBGMBIksQAGCBJkkYBlAI4kiQBlAJIliYBHMiLPMADjCRJDOABCIAwgsgBAOALggAAAPCDIAAAgqRwIoQDgqTQKg4CCIAgHIcAAEBKJAAAACCREgAAKlABKlABaqVWaqVW1a/+1a/+CIIgCIIgCII8CIIgACBJkiMIiqIsiqIoAAA8iqIowIM8CIIgyoIsiqIoiqIoiqIowIMsiqIoyoI8AAAAiqI8AAAAyIM8AAAAAAA8CIIgCILgAAAACIL8AAAAAAD8CIIgCILgCIIgAAD8AAAACIL8CIIgCI7gCIIgiqLoiqIoii74AAAAgC/oiqIoyg78AAAAwA/siqIoii7oiqIowA/8AAAAyg7siqIoyA/8AAAAiqL8AAAAwA/8CIIgAAD8iqIoiqL4AAAAAAAAAAD8AAAAAPD/AAAAwP//AAAA////AAD8////APD/////wP//////////////QRAEQRAEwzAMwzAMx3Ecx3Ecz/M8z/M83/d93/d9gCM5kuQIniQIgiAAgE9RFEUBFMCBvMgDAMBLEgMAACBJkiMIAEApCIIAHMKJHMIBjCR5ksQAACeKFGUDjEAgnMQAAECpKgUAAMKpKocAACd4AgcAACNJkgQAgAd4gAcAAMIhAAcAAgMxAuABAPAfWRj8APDjZgj+CIIgiEIAFMCJosgB3/d93/d9z/M8z/M8x3Ecx3EcwzAMwzAMQRAEQRAEFCBJkkYBBkI4AAAAAAB40/zx0i9JvwQA" } };

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var canvas_1 = require("./canvas");
function imageToContext(image) {
    var context = canvas_1.createContext2D(image.width, image.height);
    context.drawImage(image, 0, 0);
    return context;
}
exports.imageToContext = imageToContext;

},{"./canvas":2}],7:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./canvas"));
__export(require("./sprite"));
__export(require("./image"));
__export(require("./texture"));
__export(require("./font"));
__export(require("./color"));
var ascii_small_font_1 = require("./fonts/ascii-small-font");
exports.fonts = {
    'ascii-small': ascii_small_font_1.default,
};

},{"./canvas":2,"./color":3,"./font":4,"./fonts/ascii-small-font":5,"./image":6,"./sprite":8,"./texture":9}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var canvas_1 = require("./canvas");
exports.MAGENTA_SPRITE_4X4 = imageToSprite(canvas_1.MAGENTA_CANVAS_4X4);
function makeVector2(x, y) {
    return { x: x, y: y };
}
exports.makeVector2 = makeVector2;
function makeRect(x, y, w, h) {
    return { x: x, y: y, w: w, h: h };
}
exports.makeRect = makeRect;
function makeSprite(image, rect) {
    return { image: image, rect: rect };
}
exports.makeSprite = makeSprite;
function imageToSprite(image) {
    return { image: image, rect: makeRect(0, 0, image.width, image.height) };
}
exports.imageToSprite = imageToSprite;
function spriteToCanvas(sprite) {
    var context = canvas_1.createContext2D(sprite.rect.w, sprite.rect.h);
    drawSprite(context, sprite, 0, 0);
    return context.canvas;
}
exports.spriteToCanvas = spriteToCanvas;
function drawSprite(context, sprite, x, y) {
    var _a = [sprite.rect.x, sprite.rect.y], sx = _a[0], sy = _a[1];
    var _b = [sprite.rect.w, sprite.rect.h], sw = _b[0], sh = _b[1];
    context.drawImage(sprite.image, sx, sy, sw, sh, x, y, sw, sh);
}
exports.drawSprite = drawSprite;

},{"./canvas":2}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var base64_1 = require("./base64");
var canvas_1 = require("./canvas");
exports.decodeRGBA8 = function (data, pixels) { return pixels.set(data); };
exports.encodeRGBA8 = function (pixels) { return pixels; };
exports.decodeR8 = function (data, pixels) {
    for (var i = 0; i < data.length; ++i) {
        pixels[i * 4] = data[i];
    }
};
exports.encodeR8 = function (pixels) {
    var data = new Uint8ClampedArray(pixels.length / 4);
    for (var i = 0; i < data.length; ++i) {
        data[i] = pixels[i * 4];
    }
    return data;
};
exports.decodeR4 = function (data, pixels) {
    for (var i = 0; i < data.length; ++i) {
        // tslint:disable-next-line:no-bitwise
        pixels[i * 8 + 0] = (data[i] >>> 4) * 16;
        // tslint:disable-next-line:no-bitwise
        pixels[i * 8 + 4] = (data[i] & 15) * 16;
    }
};
exports.encodeR4 = function (pixels) {
    var data = new Uint8ClampedArray(pixels.length / 8);
    for (var i = 0; i < data.length; ++i) {
        data[i] =
            // tslint:disable-next-line:no-bitwise
            ((pixels[i * 8 + 0] / 16) << 4) |
                // tslint:disable-next-line:no-bitwise
                ((pixels[i * 8 + 4] / 16) & 15);
    }
    return data;
};
var white = 0xffffffff;
var clear = 0x00000000;
exports.decodeM1 = function (data, pixels) {
    var pixels32 = new Uint32Array(pixels.buffer);
    for (var i = 0; i < data.length; ++i) {
        for (var bit = 0; bit < 8; ++bit) {
            if (i * 8 + bit < pixels32.length) {
                // tslint:disable-next-line:no-bitwise
                var on = (data[i] >> bit) & 1;
                pixels32[i * 8 + bit] = on ? white : clear;
            }
        }
    }
};
exports.encodeM1 = function (pixels) {
    var pixels32 = new Uint32Array(pixels.buffer);
    var data = new Uint8ClampedArray(Math.ceil(pixels32.length / 8));
    for (var i = 0; i < data.length; ++i) {
        var byte = 0;
        for (var bit = 0; bit < 8; ++bit) {
            // tslint:disable-next-line:no-bitwise
            byte <<= 1;
            // tslint:disable-next-line:no-bitwise
            byte |= pixels32[i * 8 + (7 - bit)] > 0 ? 1 : 0;
        }
        data[i] = byte;
    }
    return data;
};
exports.formats = {
    RGBA8: { decode: exports.decodeRGBA8, encode: exports.encodeRGBA8 },
    R8: { decode: exports.decodeR8, encode: exports.encodeR8 },
    R4: { decode: exports.decodeR4, encode: exports.encodeR4 },
    M1: { decode: exports.decodeM1, encode: exports.encodeM1 },
};
function encodeTexture(context, format) {
    var encoder = exports.formats[format].encode;
    var _a = [context.canvas.width, context.canvas.height], width = _a[0], height = _a[1];
    var pixels = context.getImageData(0, 0, width, height).data;
    var data = base64_1.uint8ToBase64(encoder(pixels));
    return { _type: 'texture', format: format, width: width, height: height, data: data };
}
exports.encodeTexture = encodeTexture;
function decodeTexture(texture) {
    var decoder = exports.formats[texture.format].decode;
    var context = canvas_1.createContext2D(texture.width, texture.height);
    context.clearRect(0, 0, texture.width, texture.height);
    var image = context.getImageData(0, 0, texture.width, texture.height);
    decoder(base64_1.base64ToUint8(texture.data), image.data);
    context.putImageData(image, 0, 0);
    return context;
}
exports.decodeTexture = decodeTexture;
function decodeAsciiTexture(ascii, solid) {
    if (solid === void 0) { solid = '1'; }
    ascii = ascii.trim();
    var rows = ascii.split('\n');
    ascii = ascii.replace(/\n/g, '');
    var _a = [rows[0].length, rows.length], width = _a[0], height = _a[1];
    var context = canvas_1.createContext2D(width, height);
    var image = context.createImageData(width, height);
    var colors = new Uint32Array(image.data.buffer);
    colors.set(Array.from(ascii).map(function (c) { return (c === solid ? white : clear); }));
    context.putImageData(image, 0, 0);
    return context;
}
exports.decodeAsciiTexture = decodeAsciiTexture;

},{"./base64":1,"./canvas":2}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blitsy = require("blitsy");
const utility_1 = require("./utility");
const text_1 = require("./text");
const youtube_1 = require("./youtube");
let player;
async function start() {
    player = await youtube_1.loadYoutube('youtube', 448, 252);
    await load();
}
start();
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
    recolorBuffer.fillStyle = utility_1.num2hex(color);
    recolorBuffer.fillRect(0, 0, 8, 8);
    recolorBuffer.globalCompositeOperation = 'destination-in';
    recolorBuffer.drawImage(tile.canvas, 0, 0);
    recolorBuffer.globalCompositeOperation = 'source-over';
    return recolorBuffer;
}
const font = blitsy.decodeFont(blitsy.fonts['ascii-small']);
const layout = { font, lineWidth: 240, lineCount: 9999 };
const avatarTiles = new Map();
utility_1.recolor(floorTile);
utility_1.recolor(brickTile);
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
        if (!this.websocket)
            return;
        console.log("reconnecting");
        this.connect(this.websocket.url);
    }
    disconnect() {
        if (!this.websocket)
            return;
        //this.websocket.onclose = undefined;
        this.websocket.close(1000);
        this.websocket = undefined;
    }
    async wait() {
        while (this.websocket && this.websocket.readyState === WebSocket.CONNECTING)
            await sleep(10);
    }
    send(type, message) {
        message.type = type;
        try {
            this.websocket.send(JSON.stringify(message));
        }
        catch (e) {
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
            }
            catch (e) {
                console.log('EXCEPTION HANDLING MESSAGE', message, e);
            }
        }
        else {
            console.log(`NO HANDLER FOR MESSAGE TYPE ${message.type}`);
        }
    }
    onOpen(event) {
        if (!this.websocket)
            return;
        console.log('open:', event);
        console.log(this.websocket.readyState);
    }
    async onClose(event) {
        console.log(`closed: ${event.code}, ${event.reason}`, event);
        if (event.code > 1001) {
            await sleep(100);
            this.reconnect();
        }
    }
}
const pad = (number) => number.toString().length >= 2 ? number.toString() : "0" + number.toString();
function secondsToTime(seconds) {
    const s = seconds % 60;
    const m = Math.floor(seconds / 60) % 60;
    const h = Math.floor(seconds / 3600);
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
let messaging;
function setVolume(volume) {
    player.setVolume(volume);
    localStorage.setItem('volume', volume.toString());
}
async function load() {
    setVolume(parseInt(localStorage.getItem('volume') || "100", 10));
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
    messaging.setHandler('heartbeat', () => { });
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
    function removeUser(userId) {
        avatars.delete(userId);
        usernames.delete(userId);
    }
    messaging.setHandler('users', message => {
        message.names.forEach(([user, name]) => {
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
        const texture = {
            _type: "texture", format: "M1", width: 8, height: 8, data: message.data
        };
        try {
            const context = blitsy.decodeTexture(texture);
            avatarTiles.set(message.userId, context);
            if (message.userId === userId)
                localStorage.setItem('avatar', message.data);
        }
        catch (e) {
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
        }
        else if (!usernames.has(message.userId)) {
            logChat(`{clr=#FF00FF}! {clr=#FF0000}${message.name} {clr=#FF00FF}joined{-clr}`);
        }
        else {
            logChat(`{clr=#FF00FF}! {clr=#FF0000}${getUsername(message.userId)}{clr=#FF00FF} is now {clr=#FF0000}${message.name}`);
        }
        usernames.set(message.userId, message.name);
    });
    let lastSearchResults = [];
    messaging.setHandler('search', message => {
        const { results } = message;
        lastSearchResults = results;
        const lines = results.slice(0, 5).map(({ title, duration }, i) => `${i + 1}. ${title} (${secondsToTime(duration)})`);
        logChat('{clr=#FFFF00}? queue Search result with /result n\n{clr=#00FFFF}' + lines.join('\n'));
    });
    setInterval(() => messaging.send('heartbeat', {}), 30 * 1000);
    window.onbeforeunload = () => messaging.disconnect();
    let retries = 0;
    player.addEventListener('onError', () => {
        if (!currentVideo)
            return;
        if (retries >= 3) {
            messaging.send('error', { videoId: currentVideo.videoId });
            console.log('youtube error after retries :(');
        }
        else {
            player.loadVideoById(currentVideo.videoId, currentVideo.time / 1000);
            player.playVideo();
            retries += 1;
            console.log('youtube retry', retries);
        }
    });
    chatName.addEventListener('change', () => {
        localStorage.setItem('name', chatName.value);
        if (userId)
            messaging.send('name', { name: chatName.value });
    });
    function logChat(text) {
        chatPages.push(text_1.scriptToPages(text, layout)[0]);
        chatPages = chatPages.slice(-32);
    }
    function move(dx, dy) {
        let avatar = avatars.get(userId);
        const spawning = !avatar;
        if (avatar) {
            avatar.position[0] = clamp(0, 15, avatar.position[0] + dx);
            avatar.position[1] = clamp(0, 15, avatar.position[1] + dy);
        }
        else {
            avatar = { userId, position: [randomInt(0, 15), 15], emotes: [] };
        }
        messaging.send('move', { position: avatar.position });
        const data = localStorage.getItem('avatar');
        if (spawning && data)
            messaging.send('avatar', { data });
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
    chatCommands.set('search', args => messaging.send('search', { query: args }));
    chatCommands.set('youtube', args => messaging.send('youtube', { videoId: args }));
    chatCommands.set('skip', args => {
        if (currentVideo)
            messaging.send('skip', { password: args, videoId: currentVideo.videoId });
    });
    chatCommands.set('users', args => listUsers());
    chatCommands.set('help', args => listHelp());
    chatCommands.set('result', playFromSearchResult);
    chatCommands.set('lucky', args => messaging.send('search', { query: args, lucky: true }));
    chatCommands.set('reboot', args => messaging.send('reboot', { master_key: args }));
    chatCommands.set('avatar', args => messaging.send('avatar', { data: args }));
    chatCommands.set('avatar2', args => {
        const ascii = args.replace(/\s+/g, '\n');
        const avatar = blitsy.decodeAsciiTexture(ascii, '1');
        const data = blitsy.encodeTexture(avatar, 'M1').data;
        messaging.send('avatar', { data });
    });
    chatCommands.set('volume', args => setVolume(parseInt(args.trim(), 10)));
    chatCommands.set('resync', () => messaging.send('resync', {}));
    chatCommands.set('notify', async () => {
        const permission = await Notification.requestPermission();
        logChat(`{clr=#FF00FF}! notifications ${permission}`);
    });
    document.addEventListener('keydown', event => {
        const typing = document.activeElement.tagName === "INPUT";
        if (!typing && event.key === 'Tab') {
            chatInput.focus();
            event.preventDefault();
        }
        else if (typing && (event.key === 'Tab' || event.key === 'Escape')) {
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
                }
                else {
                    logChat(`{clr=#FF00FF}! no command /${slash[1]}`);
                    listHelp();
                }
            }
            else if (line.length > 0) {
                messaging.send('chat', { text: parseFakedown(line) });
            }
            chatInput.value = "";
        }
        if (typing)
            return;
        function toggleEmote(emote) {
            const avatar = avatars.get(userId);
            if (!avatar)
                return;
            if (avatar.emotes.includes(emote))
                messaging.send('emotes', { emotes: avatar.emotes.filter((e) => e !== emote) });
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
            move(-1, 0);
            event.preventDefault();
        }
        else if (event.key === 'ArrowRight') {
            move(1, 0);
            event.preventDefault();
        }
        else if (event.key === 'ArrowDown') {
            move(0, 1);
            event.preventDefault();
        }
        else if (event.key === 'ArrowUp') {
            move(0, -1);
            event.preventDefault();
        }
    });
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
    const pageRenderer = new text_1.PageRenderer(256, 256);
    function animatePage(page) {
        page.forEach((glyph, i) => {
            glyph.hidden = false;
            if (glyph.styles.has("r"))
                glyph.hidden = false;
            if (glyph.styles.has("clr")) {
                const hex = glyph.styles.get("clr");
                const rgb = utility_1.hex2rgb(hex);
                glyph.color = utility_1.rgb2num(...rgb);
            }
            if (glyph.styles.has("shk"))
                glyph.offset = blitsy.makeVector2(randomInt(-1, 1), randomInt(-1, 1));
            if (glyph.styles.has("wvy"))
                glyph.offset.y = (Math.sin(i + performance.now() * 5 / 1000) * 3) | 0;
            if (glyph.styles.has("rbw")) {
                const h = Math.abs(Math.sin((performance.now() / 600) - (i / 8)));
                const [r, g, b] = utility_1.hslToRgb(h, 1, 0.5);
                glyph.color = utility_1.rgb2num(r, g, b);
            }
        });
    }
    const zoneLogo = document.querySelector('#zone-logo');
    function redraw() {
        youtube.hidden = player.getPlayerState() !== 1;
        zoneLogo.hidden = player.getPlayerState() === 1;
        dialog.clearRect(0, 0, 256, 256);
        chatContext.fillStyle = 'rgb(0, 0, 0)';
        chatContext.fillRect(0, 0, 512, 512);
        let bottom = 256 - 4;
        for (let i = chatPages.length - 1; i >= 0 && bottom >= 0; --i) {
            const page = chatPages[i];
            const height = text_1.getPageHeight(page, font);
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
                dx += randomInt(-8, 8);
                dy += randomInt(-8, 8);
            }
            if (avatar.emotes.includes('wvy')) {
                dy += Math.sin((performance.now() / 250) - (position[0] / 2)) * 4;
            }
            let [r, g, b] = [255, 255, 255];
            const x = position[0] * 32 + dx;
            const y = position[1] * 32 + dy;
            let image = avatarTiles.get(userId) || avatarImage;
            if (avatar.emotes.includes('rbw')) {
                const h = Math.abs(Math.sin((performance.now() / 600) - (position[0] / 8)));
                [r, g, b] = utility_1.hslToRgb(h, 1, 0.5);
                image = recolored(image, utility_1.rgb2num(r, g, b));
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
        const queuePage = text_1.scriptToPages(lines.join('\n'), layout)[0];
        animatePage(queuePage);
        pageRenderer.renderPage(queuePage, 0, 0);
        const height = text_1.getPageHeight(queuePage, font);
        chatContext.fillStyle = 'rgb(0, 0, 0)';
        chatContext.fillRect(0, 0, 512, height * 2 + 16);
        chatContext.drawImage(pageRenderer.pageImage, 16, 16, 512, 512);
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
function notify(title, body, tag) {
    if ("Notification" in window && Notification.permission === "granted" && !document.hasFocus()) {
        new Notification(title, { body, tag, renotify: true, icon: './avatar.png' });
    }
}

},{"./text":11,"./utility":12,"./youtube":13,"blitsy":7}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blitsy_1 = require("blitsy");
const utility_1 = require("./utility");
const FALLBACK_CODEPOINT = '?'.codePointAt(0);
;
function computeLineWidth(font, line) {
    let width = 0;
    for (const char of line) {
        const code = char.codePointAt(0);
        const fontchar = font.characters.get(code);
        if (fontchar) {
            width += fontchar.spacing;
        }
    }
    return width;
}
exports.computeLineWidth = computeLineWidth;
function makeGlyph(position, sprite, color = 0xFFFFFF, offset = blitsy_1.makeVector2(0, 0), hidden = true, styles = new Map()) {
    return { position, sprite, color, offset, hidden, styles };
}
exports.makeGlyph = makeGlyph;
// TODO: the only reason this is a class rn is it needs those two canvases for
// blending properly...
class PageRenderer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.pageContext = blitsy_1.createContext2D(width, height);
        this.bufferContext = blitsy_1.createContext2D(width, height);
        this.pageImage = this.pageContext.canvas;
    }
    /**
     * Render a page of glyphs to the pageImage, offset by (px, py).
     * @param page glyphs to be rendered.
     * @param px horizontal offset in pixels.
     * @param py verticle offest in pixels.
     */
    renderPage(page, px, py) {
        this.pageContext.clearRect(0, 0, this.width, this.height);
        this.bufferContext.clearRect(0, 0, this.width, this.height);
        for (const glyph of page) {
            if (glyph.hidden)
                continue;
            // padding + position + offset
            const dx = px + glyph.position.x + glyph.offset.x;
            const dy = py + glyph.position.y + glyph.offset.y;
            // draw tint layer
            this.pageContext.fillStyle = utility_1.num2hex(glyph.color);
            this.pageContext.fillRect(dx, dy, glyph.sprite.rect.w, glyph.sprite.rect.h);
            // draw text layer
            blitsy_1.drawSprite(this.bufferContext, glyph.sprite, dx, dy);
        }
        // draw text layer in tint color
        this.pageContext.globalCompositeOperation = 'destination-in';
        this.pageContext.drawImage(this.bufferContext.canvas, 0, 0);
        this.pageContext.globalCompositeOperation = 'source-over';
    }
}
exports.PageRenderer = PageRenderer;
function scriptToPages(script, context, styleHandler = exports.defaultStyleHandler) {
    const tokens = tokeniseScript(script);
    const commands = tokensToCommands(tokens);
    return commandsToPages(commands, context, styleHandler);
}
exports.scriptToPages = scriptToPages;
function find(array, start, step, predicate) {
    for (let i = start; 0 <= i && i < array.length; i += step) {
        if (predicate(array[i], i)) {
            return [array[i], i];
        }
    }
}
/**
 * Segment the given array into contiguous runs of elements that are not
 * considered breakable.
 */
function filterToSpans(array, breakable) {
    const spans = [];
    let buffer = [];
    array.forEach((element, index) => {
        if (!breakable(element, index)) {
            buffer.push(element);
        }
        else if (buffer.length > 0) {
            spans.push(buffer);
            buffer = [];
        }
    });
    if (buffer.length > 0) {
        spans.push(buffer);
    }
    return spans;
}
exports.filterToSpans = filterToSpans;
exports.defaultStyleHandler = (styles, style) => {
    if (style.substr(0, 1) === "+") {
        styles.set(style.substring(1), true);
    }
    else if (style.substr(0, 1) === "-") {
        styles.delete(style.substring(1));
    }
    else if (style.includes("=")) {
        const [key, val] = style.split(/\s*=\s*/);
        styles.set(key, val);
    }
};
function commandsToPages(commands, layout, styleHandler = exports.defaultStyleHandler) {
    commandsBreakLongSpans(commands, layout);
    const styles = new Map();
    const pages = [];
    let page = [];
    let currLine = 0;
    function newPage() {
        pages.push(page);
        page = [];
        currLine = 0;
    }
    function endPage() {
        do {
            endLine();
        } while (currLine % layout.lineCount !== 0);
    }
    function endLine() {
        currLine += 1;
        if (currLine === layout.lineCount)
            newPage();
    }
    function doBreak(target) {
        if (target === "line")
            endLine();
        else if (target === "page")
            endPage();
    }
    function findNextBreakIndex() {
        let width = 0;
        for (let i = 0; i < commands.length; ++i) {
            const command = commands[i];
            if (command.type === "break")
                return i;
            if (command.type === "style")
                continue;
            width += computeLineWidth(layout.font, command.char);
            // if we overshot, look backward for last possible breakable glyph
            if (width > layout.lineWidth) {
                const result = find(commands, i, -1, command => command.type === "glyph"
                    && command.breakable);
                if (result)
                    return result[1];
            }
        }
        ;
    }
    function addGlyph(command, offset) {
        const codepoint = command.char.codePointAt(0);
        const char = layout.font.characters.get(codepoint)
            || layout.font.characters.get(FALLBACK_CODEPOINT);
        const pos = blitsy_1.makeVector2(offset, currLine * (layout.font.lineHeight + 4));
        const glyph = makeGlyph(pos, char.sprite);
        glyph.styles = new Map(styles.entries());
        page.push(glyph);
        return char.spacing;
    }
    function generateGlyphLine(commands) {
        let offset = 0;
        for (const command of commands) {
            if (command.type === "glyph") {
                offset += addGlyph(command, offset);
            }
            else if (command.type === "style") {
                styleHandler(styles, command.style);
            }
        }
    }
    let index;
    while ((index = findNextBreakIndex()) !== undefined) {
        generateGlyphLine(commands.slice(0, index));
        commands = commands.slice(index);
        const command = commands[0];
        if (command.type === "break") {
            doBreak(command.target);
            commands.shift();
        }
        else {
            if (command.type === "glyph" && command.char === " ") {
                commands.shift();
            }
            endLine();
        }
    }
    generateGlyphLine(commands);
    endPage();
    return pages;
}
exports.commandsToPages = commandsToPages;
/**
 * Find spans of unbreakable commands that are too long to fit within a page
 * width and amend those spans so that breaking permitted in all positions.
 */
function commandsBreakLongSpans(commands, context) {
    const canBreak = (command) => command.type === "break"
        || (command.type === "glyph" && command.breakable);
    const spans = filterToSpans(commands, canBreak);
    for (const span of spans) {
        const glyphs = span.filter(command => command.type === "glyph");
        const charWidths = glyphs.map(command => computeLineWidth(context.font, command.char));
        const spanWidth = charWidths.reduce((x, y) => x + y, 0);
        if (spanWidth > context.lineWidth) {
            for (const command of glyphs)
                command.breakable = true;
        }
    }
}
exports.commandsBreakLongSpans = commandsBreakLongSpans;
function tokensToCommands(tokens) {
    const commands = [];
    function handleToken([type, buffer]) {
        if (type === "text")
            handleText(buffer);
        else if (type === "markup")
            handleMarkup(buffer);
    }
    function handleText(buffer) {
        for (const char of buffer) {
            const breakable = char === " ";
            commands.push({ type: "glyph", char, breakable });
        }
    }
    function handleMarkup(buffer) {
        if (buffer === "ep")
            commands.push({ type: "break", target: "page" });
        else if (buffer === "el")
            commands.push({ type: "break", target: "line" });
        else
            commands.push({ type: "style", style: buffer });
    }
    tokens.forEach(handleToken);
    return commands;
}
exports.tokensToCommands = tokensToCommands;
function tokeniseScript(script) {
    const tokens = [];
    let buffer = "";
    let braceDepth = 0;
    function openBrace() {
        if (braceDepth === 0)
            flushBuffer();
        braceDepth += 1;
    }
    function closeBrace() {
        if (braceDepth === 1)
            flushBuffer();
        braceDepth -= 1;
    }
    function newLine() {
        flushBuffer();
        tokens.push(["markup", "el"]);
    }
    function flushBuffer() {
        if (buffer.length === 0)
            return;
        const type = braceDepth > 0 ? "markup" : "text";
        tokens.push([type, buffer]);
        buffer = "";
    }
    const actions = {
        "{": openBrace,
        "}": closeBrace,
        "\n": newLine,
    };
    for (const char of script) {
        if (char in actions)
            actions[char]();
        else
            buffer += char;
    }
    flushBuffer();
    return tokens;
}
exports.tokeniseScript = tokeniseScript;
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
exports.getPageHeight = getPageHeight;

},{"./utility":12,"blitsy":7}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blitsy_1 = require("blitsy");
function recolor(context) {
    withPixels(context, pixels => {
        for (let i = 0; i < pixels.length; ++i)
            if (pixels[i] === 0xFFFFFFFF)
                pixels[i] = blitsy_1.rgbaToColor({ r: 128, g: 159, b: 255, a: 255 });
    });
}
exports.recolor = recolor;
// source : https://gist.github.com/mjackson/5311256
function hue2rgb(p, q, t) {
    if (t < 0)
        t += 1;
    if (t > 1)
        t -= 1;
    if (t < 1 / 6)
        return p + (q - p) * 6 * t;
    if (t < 1 / 2)
        return q;
    if (t < 2 / 3)
        return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}
exports.hue2rgb = hue2rgb;
function hslToRgb(h, s, l) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
}
exports.hslToRgb = hslToRgb;
function withPixels(context, action) {
    const image = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    action(new Uint32Array(image.data.buffer));
    context.putImageData(image, 0, 0);
}
exports.withPixels = withPixels;
;
function num2hex(value) {
    return rgb2hex(num2rgb(value));
}
exports.num2hex = num2hex;
function rgb2num(r, g, b, a = 255) {
    return ((a << 24) | (b << 16) | (g << 8) | (r)) >>> 0;
}
exports.rgb2num = rgb2num;
function num2rgb(value) {
    const r = (value >> 0) & 0xFF;
    const g = (value >> 8) & 0xFF;
    const b = (value >> 16) & 0xFF;
    return [r, g, b];
}
exports.num2rgb = num2rgb;
function rgb2hex(color) {
    const [r, g, b] = color;
    let rs = r.toString(16);
    let gs = g.toString(16);
    let bs = b.toString(16);
    if (rs.length < 2) {
        rs = "0" + rs;
    }
    if (gs.length < 2) {
        gs = "0" + gs;
    }
    if (bs.length < 2) {
        bs = "0" + bs;
    }
    return `#${rs}${gs}${bs}`;
}
exports.rgb2hex = rgb2hex;
function hex2rgb(color) {
    const matches = color.match(/^#([0-9a-f]{6})$/i);
    if (matches) {
        const match = matches[1];
        return [
            parseInt(match.substr(0, 2), 16),
            parseInt(match.substr(2, 2), 16),
            parseInt(match.substr(4, 2), 16)
        ];
    }
    return [0, 0, 0];
}
exports.hex2rgb = hex2rgb;

},{"blitsy":7}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
function loadYoutube(id, width, height) {
    return new Promise((resolve, reject) => {
        window.onYouTubePlayerAPIReady = () => {
            const player = new YT.Player(id, {
                width: width.toString(),
                height: height.toString(),
                playerVars: {
                    controls: '0',
                    iv_load_policy: '3',
                    disablekb: '1',
                },
                events: {
                    onReady: () => resolve(player),
                    onError: () => reject("youtube error :("),
                    onStateChange: (event) => console.log(`YT STATE: ${event.data}`),
                },
            });
        };
        var tag = document.createElement('script');
        tag.onerror = () => console.log("youtube error :(");
        tag.src = "https://www.youtube.com/player_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
}
exports.loadYoutube = loadYoutube;

},{}]},{},[10])(10)
});
