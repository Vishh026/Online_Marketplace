const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

// tools.js
// tools.js -> searchProduct tool
const searchProduct = tool(
  async ({ query, token }) => {
    const response = await axios.get("http://localhost:3001/api/products", {
      params: { q: query },
      headers: { Authorization: `Bearer ${token}` },
    });

    // Handle different response structures
    const rawData = response.data.data || response.data;
    const products = Array.isArray(rawData) ? rawData : [rawData];

    // CRITICAL: Clean the data so the LLM ONLY sees "productId"
    const cleaned = products.map(p => ({
      productId: p._id.toString(), // Explicitly call it productId for the AI
      name: p.title,
      price: p.price?.amount
    }));

    return JSON.stringify(cleaned);
  },
  {
    name: "searchProduct",
    description: "Search for products. Returns a list with productId.",
    schema: z.object({ query: z.string() }),
  }
);;

// 🛒 ADD PRODUCT TO CART
// tools.js -> addProductToCart tool
const addProductToCart = tool(
  async ({ productId, qty = 1, token }) => {
    // 1. Double-check if the AI is sending a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      return `Error: '${productId}' is not a valid ID. You must use the 24-character hex ID from the search results.`;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/api/cart",
        { productId, quantity: Number(qty) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return "Successfully added to cart!";
    } catch (err) {
      // Catch that 400 error and return the message to the AI
      return `Backend Error: ${err.response?.data?.errors?.[0]?.msg || "Invalid request"}`;
    }
  },
  {
    name: "addProductToCart",
    description: "Add a product to cart using the productId from searchProduct results.",
    schema: z.object({
      productId: z.string().describe("The 24-character hex productId"),
      qty: z.number().default(1),
    }),
  }
);

module.exports = { searchProduct, addProductToCart };