import { Request, Response } from "express";
import { WebhookClient } from "dialogflow-fulfillment";
import { Client } from "./client";
import { chatWithOwnData, showLoadingAnimation } from "./gemini";
import dotenv from "dotenv";
import { Content } from "@google/generative-ai";
import { memoryCache } from "..";
import { listBooks } from "./book";
import { TemplateColumn } from "@line/bot-sdk";
dotenv.config();

export const handleDialogflowFulfillmentWebhook = async (
  req: Request,
  res: Response
) => {
  let client: Client;
  if (req.method === "POST") {
    const userID =
      req.body.originalDetectIntentRequest.payload.data.source.userId;
    const replyToken =
      req.body.originalDetectIntentRequest.payload.data.replyToken;
    
    const agent = new WebhookClient({ request: req, response: res });
    client = new Client(replyToken);
    console.log("Query Text: " + agent.query);
      
    if (
      agent.query === "รายชื่อหนังสือ" ||
      agent.query === "หนังสือ" ||
      agent.query === "หนังสือทั้งหมด" ||
      agent.query === "List of book"
    ) {
      const books = await listBooks();
      let template: TemplateColumn[] = [];
      for (const book of books) {
        template.push({
          thumbnailImageUrl: book.cover,
          title: book.title,
          text: book.description.substring(0, 55) + "...",
          actions: [
            {
              type: "message",
              label: "รายละเอียด",
              text: book.title,
            },
          ],
        });
      }
      client.carousel({ type: "carousel", columns: template });
    } else {
      showLoadingAnimation(userID);
      const history: Content[] | undefined = await memoryCache.get(userID);
      let result;
      let newHistory: Content[] = [];
      if (history) {
        newHistory = history;
        result = await chatWithOwnData(agent.query, history);
        client.text(result);
      } else {
        result = await chatWithOwnData(agent.query);
        client.text(result);
      }
      newHistory.push({ role: "user", parts: [{ text: agent.query }] });
      newHistory.push({ role: "model", parts: [{ text: result }] });
      await memoryCache.set(userID, newHistory);
    }
  }
  res.status(200).end();
};
