import { sleep } from "./utility";

export class WebSocketMessaging {
    public websocket: WebSocket | undefined = undefined;
    private handlers = new Map<string, (message: any) => void>();

    connect(address: string) {
        this.disconnect();
        this.websocket = new WebSocket(address);
        this.websocket.onopen = event => this.onOpen(event);
        this.websocket.onclose = event => this.onClose(event);
        this.websocket.onmessage = event => this.onMessage(event);
    }

    reconnect() {
        if (!this.websocket) return;
        console.log("reconnecting");
        this.connect(this.websocket.url);
    }

    disconnect() {
        if (!this.websocket) return;
        //this.websocket.onclose = undefined;
        this.websocket.close(1000);
        this.websocket = undefined;
    }

    async wait() {
        while (this.websocket && this.websocket.readyState === WebSocket.CONNECTING)
            await sleep(10);
    }

    send(type: string, message: any) {
        message.type = type;
        try {
            this.websocket!.send(JSON.stringify(message));
        } catch (e) {
            console.log("couldn't send", message, e);
        }
    }

    setHandler(type: string, handler: (message: any) => void) {
        this.handlers.set(type, handler);
    }

    onMessage(event: MessageEvent) {
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

    onOpen(event: Event) {
        if (!this.websocket) return;
        console.log('open:', event);
        console.log(this.websocket.readyState);
    }

    async onClose(event: CloseEvent) {
        console.log(`closed: ${event.code}, ${event.reason}`, event);

        if (event.code > 1001) {
            await sleep(100);
            this.reconnect();
        }
    }
}
