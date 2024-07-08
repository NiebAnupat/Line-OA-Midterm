import express, {
  Express,
  Request,
  Response,
  Application,
  NextFunction,
} from "express";
import * as line from "@line/bot-sdk";
import dotenv from "dotenv";
import { handleWebhook } from "./src/handleWebhook";

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

const lineConfig: line.MiddlewareConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

const MessagingApiClient = line.messagingApi.MessagingApiClient;
export const lineClient = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

app.get("/", (req: Request, res: Response) => {
  res.status(405).send("Method Not Allowed");
  res.end();
});

// app.use(line.middleware(lineConfig));

app.post("/webhook", line.middleware(lineConfig), handleWebhook);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof line.SignatureValidationFailed) {
    res.status(401).send(err.signature);
    return;
  } else if (err instanceof line.JSONParseError) {
    res.status(400).send(err.raw);
    return;
  }
  next(err); // will throw default 500
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port} ⚡`);
});
