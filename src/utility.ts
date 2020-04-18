export type YoutubeVideo = {
    videoId: string;
    duration: number;
    title: string;
    thumbnail?: string;
    meta?: any;
    time?: number;
};

export function withPixels(
    context: CanvasRenderingContext2D, 
    action: (pixels: Uint32Array) => void,
) {
    const image = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    action(new Uint32Array(image.data.buffer));
    context.putImageData(image, 0, 0);
};

export function num2hex(value: number): string
{
    return rgb2hex(num2rgb(value));
}

export function rgb2num(r: number, g: number, b: number, a: number = 255)
{
  return ((a << 24) | (b << 16) | (g << 8) | (r)) >>> 0;
}

export function num2rgb(value: number): [number, number, number]
{
    const r = (value >>  0) & 0xFF;
    const g = (value >>  8) & 0xFF;
    const b = (value >> 16) & 0xFF;
    
    return [r, g, b];
}

export function rgb2hex(color: [number, number, number]): string
{
    const [r, g, b] = color;
    let rs = r.toString(16);
    let gs = g.toString(16);
    let bs = b.toString(16);

    if (rs.length < 2) { rs = "0" + rs; }
    if (gs.length < 2) { gs = "0" + gs; }
    if (bs.length < 2) { bs = "0" + bs; }

    return `#${rs}${gs}${bs}`;
}

export function hex2rgb(color: string): [number, number, number]
{
    const matches = color.match(/^#([0-9a-f]{6})$/i);

    if (matches) 
    {
        const match = matches[1];

        return [
            parseInt(match.substr(0,2),16),
            parseInt(match.substr(2,2),16),
            parseInt(match.substr(4,2),16)
        ];
    }
    
    return [0, 0, 0];
}
