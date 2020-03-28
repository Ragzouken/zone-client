async function load() {
    const serverInput = document.querySelector('#server-input');
    const chatInput = document.querySelector('#chat-input');
    const chatLog = document.querySelector('#chat-log');
    const chatLines = [];

    let websocket;
    function connect(address) {
        websocket = new WebSocket(address);
        websocket.onopen = event => addChat('... connected ...');
        websocket.onerror = event => addChat('... failed to connect ...');
        websocket.onmessage = event => addChat(event.data);
    }

    function update() {
        if (!websocket) {
            serverInput.style = "background: red";
        } else if (websocket.readyState === WebSocket.OPEN) {
            serverInput.style = "background: green";
        } else if (websocket.readyState === WebSocket.CONNECTING) {
            serverInput.style = "background: yellow";
        } else {
            serverInput.style = "background: red";
        }

        window.requestAnimationFrame(() => update());
    }

    update();

    function addChat(text) {
        chatLines.push(text);
        chatLog.innerText = chatLines.join('\n');
    }
    
    function sendChat(text) {
        websocket.send(text);
        addChat('(you) ' + text);
    }

    serverInput.addEventListener('change', event => {
        connect(serverInput.value);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            sendChat(chatInput.value);
            chatInput.value = "";
        }
    });
}
