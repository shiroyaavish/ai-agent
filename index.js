import { tool } from "@langchain/core/tools";
import { z } from "zod";
import dotenv from "dotenv";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
dotenv.config();

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_KEY
})

const multiply = tool(async ({ a, b }) => a * b, {
  name: "multiply",
  describe: "Multiply two numbers together",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const add = tool(async ({ a, b }) => a + b, {
  name: "add",
  describe: "Add two numbers together",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const divide = tool(async ({ a, b }) => a / b, {
  name: "divide",
  describe: "Divide two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const subtraction = tool(async ({ a, b }) => a - b, {
  name: "subtraction",
  describe: "Subtract two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const tools = [add, multiply, divide, subtraction];
const llmWithTools = geminiModel.bindTools(tools);

// LLM Call
async function llmCall(state) {
  const result = await llmWithTools.invoke([
    { role: "system", content: "You are a helpful assistant that performs arithmetic." },
    ...state.messages,
  ]);
  return { messages: [result] };
}

// Tool Call Node
const toolNode = new ToolNode(tools)

// Conditional
function shouldContinue(state) {
  const lastMessage = state.messages.at(-1);
  return lastMessage?.tool_calls?.length ? "Action" : "__end__";
}

// Graph
const agentBuilder = new StateGraph(MessagesAnnotation)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge("__start__", "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, {
    Action: "tools",
    __end__: "__end__",
  })
  .addEdge("tools", "llmCall")
  .compile();

// Execute
(async () => {
  const result = await agentBuilder.invoke({
    messages: [{ role: "user", content: "add 4 and 5 , then devide that by 20 and multiply by 50." }]
  });
  console.log(result.messages);
})();
