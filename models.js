import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    apiKey: process.env.GEMINI_KEY
})

export {geminiModel}