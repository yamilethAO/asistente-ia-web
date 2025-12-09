/* ======================================================
   chat-service.js
   Encapsula la llamada al backend (/api/chat)
   que se conectará a Azure OpenAI usando secrets.
====================================================== */

/**
 * Envía un mensaje al backend que conecta con Azure OpenAI.
 * @param {string} userMessage - Texto enviado por el usuario.
 * @returns {Promise<string>} - Respuesta generada por el modelo.
 */

function withTimeout(ms, promise) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}

async function sendMessageToAssistant(userMessage) {
  const body = JSON.stringify({ message: userMessage });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await withTimeout(15000, fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      }));

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${errText}`);
      }

      const data = await res.json();
      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("Respuesta inválida del backend");
      }
      return data.reply;

    } catch (err) {
      // Reintenta una vez en errores transitorios
      const transient = /Timeout|network|fetch|502|503|504/i.test(String(err));
      if (!transient || attempt === 2) {
        console.error("Error en chat-service:", err);
        throw err;
      }
      await new Promise(r => setTimeout(r, 800)); // pequeña espera
    }
  }
}
