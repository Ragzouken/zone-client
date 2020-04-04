(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.blitsy = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    
    },{"./base64":1,"./canvas":2}]},{},[7])(7)
    });
    