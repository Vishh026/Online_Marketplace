const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ToolMessage, SystemMessage } = require("@langchain/core/messages");
const { ChatGroq } = require("@langchain/groq");
const tools = require("./tools"); // Ensure tools.js is in this same folder

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.3,
});

// Use the exported tools from tools.js
const modelWithTools = model.bindTools([
  tools.searchProduct,
  tools.addProductToCart,
]);

const systemMessage = new SystemMessage({
  content: `
You are a shopping assistant. 
CRITICAL RULE: You do not know any product IDs by heart. 
If a user asks to add something to their cart:
1. Use 'searchProduct' to find the item.
2. From the search results, pick the '_id' of the item.
3. Use that '_id' to call 'addProductToCart'.
4. If 'searchProduct' returns no results, tell the user you couldn't find that item.
`,
});

const graph = new StateGraph(MessagesAnnotation)
  .addNode("chat", async (state) => {
    const response = await modelWithTools.invoke([
      systemMessage,
      ...state.messages,
    ]);
    return { messages: [response] };
  })
  .addNode("tools", async (state, config) => {
    const lastMessage = state.messages.at(-1);
    const toolMessages = await Promise.all(
      (lastMessage.tool_calls || []).map(async (call) => {
        const tool = tools[call.name];
        const content = await tool.invoke({ ...call.args, token: config.metadata.token });
        return new ToolMessage({ content, tool_call_id: call.id });
      })
    );
    return { messages: toolMessages };
  })
  .addEdge("__start__", "chat")
  .addConditionalEdges("chat", (state) => {
    return state.messages.at(-1).tool_calls?.length ? "tools" : "__end__";
  })
  .addEdge("tools", "chat");

module.exports = graph.compile();