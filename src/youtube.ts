declare const YT: any;
declare global {
    interface Window {
        onYouTubePlayerAPIReady: () => void;
    }
}

export function loadYoutube(id: string, width: number, height: number): Promise<any> {
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
                    onError: () => reject('youtube error :('),
                    onStateChange: (event: any) => console.log(`YT STATE: ${event.data}`),
                },
            });
        };

        const tag = document.createElement('script');
        tag.onerror = () => console.log('youtube error :(');
        tag.src = 'https://www.youtube.com/player_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    });
}
