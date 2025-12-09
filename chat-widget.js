/* ======================================================
   CHAT WIDGET (UI + Interacción)
   Renderiza el chat flotante y gestiona los mensajes
====================================================== */

let chatOpen = false;
let messages = [];

/**
 * Inicializa el chat cuando la página carga
 */
window.addEventListener("DOMContentLoaded", () => {
    initChatWidget();
});

/**
 * Crea y agrega al DOM el botón flotante y la ventana del chat
 */
function initChatWidget() {
    const container = document.getElementById("chat-widget");

    container.innerHTML = `
        <button class="chat-button" id="chatToggleBtn">💬</button>

        <div class="chat-window" id="chatWindow" style="display:none;">
            <div class="chat-header">Asistente IA – Azure</div>

            <div class="chat-messages" id="chatMessages"></div>

            <div class="chat-input">
                <textarea id="chatInput" placeholder="Escribe tu pregunta..."></textarea>
                <button id="sendMsgBtn">Enviar</button>
            </div>
        </div>
    `;

    // Botón que abre/cierra el chat
    document.getElementById("chatToggleBtn").addEventListener("click", toggleChat);

    // Botón enviar mensaje
    document.getElementById("sendMsgBtn").addEventListener("click", handleSend);

    // Enter para enviar
    document.getElementById("chatInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

/**
 * Abre o cierra la ventana del chat
 */
function toggleChat() {
    chatOpen = !chatOpen;
    const win = document.getElementById("chatWindow");
    win.style.display = chatOpen ? "flex" : "none";
}

/**
 * Envía un mensaje del usuario, lo renderiza
 * y llama al servicio que consulta Azure OpenAI
 */
async function handleSend() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (text === "") return;

    // Agregar mensaje del usuario
    addMessage("user", text);
    renderMessages();

    input.value = "";

    // Llamar al backend (Azure Function → Azure OpenAI)
    addMessage("bot", "⏳ Pensando...");
    renderMessages();

    try {
        const response = await sendMessageToAssistant(text);

        // Reemplazar el mensaje "pensando..."
        messages.pop();
        addMessage("bot", response);

    } catch (error) {
        messages.pop(); // remover mensaje "pensando..."
        addMessage("bot", "⚠️ Error al procesar la solicitud.");
        console.error("Error en la función:", error);
    }

    renderMessages();
}

/**
 * Agrega un mensaje al array interno
 */
function addMessage(sender, text) {
    messages.push({
        sender,
        text
    });
}

/**
 * Renderiza todos los mensajes dentro de la ventana del chat
 */
function renderMessages() {
    const msgContainer = document.getElementById("chatMessages");
    msgContainer.innerHTML = "";

    messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = msg.sender === "user" ? "msg-user" : "msg-bot";

        div.innerHTML = `<span>${sanitize(msg.text)}</span>`;
        msgContainer.appendChild(div);
    });

    msgContainer.scrollTop = msgContainer.scrollHeight;
}

/**
 * Sanitiza texto para evitar inyección HTML
 */
function sanitize(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
