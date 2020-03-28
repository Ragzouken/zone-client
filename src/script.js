async function load() {
    const serverInput = document.querySelector('#server-input');
    const chatInput = document.querySelector('#chat-input');
    const chatLog = document.querySelector('#chat-log');
    const chatLines = [];

    let websocket;
    function connect(address) {
        websocket = new WebSocket(address);
        websocket.onopen = event => sendChat('... connected ...');
        websocket.onerror = event => sendChat('... failed to connect ...');
        websocket.onmessage = event => addChat(event.data);
    }

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
