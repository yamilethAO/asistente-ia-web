
// api/chat/index.js (modelo v3: CommonJS + function.json)
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;   // https://asistentewebia.cognitiveservices.azure.com/
const FOUNDRY_API_KEY  = process.env.FOUNDRY_API_KEY;     // tu clave válida
const FOUNDRY_MODEL    = process.env.FOUNDRY_MODEL || "gpt-4o-mini"; // nombre EXACTO del deployment

module.exports = async function (context, req) {
  try {
    const userMessage = req.body && req.body.message;
    if (!userMessage) {
      context.res = { status: 400, body: { error: "No message provided" } };
      return;
    }

    const url = `${FOUNDRY_ENDPOINT}openai/deployments/${FOUNDRY_MODEL}/chat/completions?api-version=2025-01-01-preview`;
    const payload = {
      messages: [
        { role: "system", content: "Eres un asistente experto en IA generativa y Azure." },
        { role: "user",   content: userMessage }
      ],
      max_tokens: 600,
      temperature: 0.7
    };

    // Log mínimo para diagnóstico
    context.log("Calling Foundry:", { url, model: FOUNDRY_MODEL });

    // Node 18+ ya trae fetch global; no necesitas node-fetch
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": FOUNDRY_API_KEY },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!response.ok) {
      context.log.error("Foundry ERROR", response.status, text);
      context.res = { status: 502, body: { error: "Error calling Foundry", detail: text } };
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      context.log.error("JSON parse error:", jsonErr, text);
      context.res = { status: 502, body: { error: "Invalid JSON from Foundry", detail: text } };
      return;
    }

    const reply = data?.choices?.[0]?.message?.content ?? "No se pudo generar respuesta.";
    context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: { reply } };
  } catch (e) {
    context.log.error("Function error:", e);
    context.res = { status: 500, body: { error: "Server error", detail: String(e) } };
  }
};
