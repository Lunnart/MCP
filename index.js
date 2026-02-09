import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Configuração da IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const server = new Server({
  name: "commit-generator",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});

// Definindo a ferramenta
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "gerar_commit",
    description: "Gera uma sugestão de commit no padrão Conventional Commits",
    inputSchema: {
      type: "object",
      properties: {
        descricao: { type: "string", description: "O que você mudou no código?" },
      },
      required: ["descricao"],
    },
  }],
}));

// Lógica de execução
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "gerar_commit") {
    const { descricao } = request.params.arguments;

    const prompt = `Você é um especialista em Git. Gere uma mensagem de commit curta no padrão Conventional Commits para a seguinte alteração: "${descricao}". Responda apenas com a mensagem final, sem explicações.`;

    const result = await model.generateContent(prompt);
    const textoIA = result.response.text();

    return {
      content: [{ type: "text", text: textoIA }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);