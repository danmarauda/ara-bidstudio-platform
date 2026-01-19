export async function composeAnswerFromContext(question: string, passages: string[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const system = `You are a helpful Bid & Tender assistant. Answer succinctly using the provided context. If the context does not contain the answer, say you don't have enough information.`;
  const context = passages.map((p, i) => `Passage ${i + 1}: ${p}`).join("\n\n");
  const messages = [
    { role: "system", content: system },
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
  ];
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MASTRA_MODEL || "gpt-4.1",
        messages,
        temperature: 0.2,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    return text || null;
  } catch {
    return null;
  }
}

