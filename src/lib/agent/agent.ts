import { Intent, GraphAnnotation } from "./state";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  END,
  START,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import {
  CLASSIFY_INTENT_PROMPT,
  GENERATE_ITINERARY_TEMPLATE,
  WEBSITE_INFO_PROMPT,
  SEARCH_SYSTEM_PROMPT,
  ADD_ITINERARY_PROMPT,
  GENERAL_PROMPT,
  UPDATE_ITINERARY_PROMPT,
  // UPDATE_ITINERARY_PROMPT,
} from "./prompt";
import { TOOLS } from "../agent/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import "dotenv/config";
import { formatMessages, getRecentMessages } from "./utils";
import { IconAd2, IconDice6 } from "@tabler/icons-react";

// MemorySaver instance for saving state
const memory = new MemorySaver();

const intentSchema = z.object({
  query: z.string().describe("The user query or input to classify the intent"),
  intentType: z
    .enum([
      Intent.General,
      Intent.Search,
      Intent.Greeting,
      Intent.Accommodation,
      Intent.Destination,
      Intent.Transportation,
      Intent.Activities,
      Intent.Itinerary,
      Intent.GenerateItinerary,
      Intent.FindItinerary,
      Intent.UpdateItinerary,
      Intent.Weather,
    ])
    .describe("The type of intent"),
});

async function classifyIntent(
  state: typeof GraphAnnotation.State
): Promise<typeof GraphAnnotation.Update> {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
  }).withStructuredOutput(intentSchema);

  const contextMessage = formatMessages(state.messages.slice(-3)); // 👈 sử dụng formatMessages

  console.log(">>> CONTEXT_MESSAGE:", contextMessage);

  if (!contextMessage.trim()) {
    console.warn("No valid conversation history. Defaulting to 'general'.");
    return { intent: Intent.General, userId: state.userId };
  }

  const lastIntent = state.intent || "general";

  const SystemPrompt = CLASSIFY_INTENT_PROMPT.replace(
    "{user_query}",
    contextMessage
  ).replace("{last_intent}", lastIntent);

  const response = await model.invoke([
    { role: "system", content: SystemPrompt },
    { role: "user", content: contextMessage },
  ]);

  const classifiedIntent = response.intentType;

  console.log(">>> CLASSIFIED_INTENT:", classifiedIntent);

  return {
    intent: classifiedIntent,
    userId: state.userId, // giữ lại userId để truyền tiếp
  };
}

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return END;
}

async function callModel(
  state: typeof GraphAnnotation.State
): Promise<typeof GraphAnnotation.Update> {
  console.log("UserID:", state.userId);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0.7,
  }).bindTools(TOOLS);

  let promptTemplate = "";
  const intent = state.intent;

  switch (intent) {
    case "generateItinerary":
      promptTemplate = GENERATE_ITINERARY_TEMPLATE.replace(
        "{userId}",
        state.userId
      );
      break;
    case "search":
      promptTemplate = SEARCH_SYSTEM_PROMPT;
      break;
    case "greeting":
      promptTemplate = WEBSITE_INFO_PROMPT;
      break;
    case "accommodation":
      promptTemplate = SEARCH_SYSTEM_PROMPT;
      break;
    case "destination":
      promptTemplate = SEARCH_SYSTEM_PROMPT;
      break;
    case "weather":
      promptTemplate = SEARCH_SYSTEM_PROMPT;
      break;
    case "transportation":
      promptTemplate = SEARCH_SYSTEM_PROMPT;
      break;
    case "activities":
      promptTemplate = SEARCH_SYSTEM_PROMPT;
      break;
    case "addItinerary":
      promptTemplate = ADD_ITINERARY_PROMPT.replace("{userId}", state.userId);
      break;
    case "general":
      promptTemplate = GENERAL_PROMPT;
      break;
    default:
      promptTemplate = GENERAL_PROMPT;
  }

  const response = await model.invoke([
    {
      role: "system",
      content: promptTemplate,
    },
    ...state.messages,
  ]);

  return {
    messages: [...state.messages, response],
    userId: state.userId,
  };
}

// Define the workflow with thread_id generation
const workflow = new StateGraph(GraphAnnotation)
  .addNode("classify_intent", classifyIntent)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(TOOLS))
  .addEdge(START, "classify_intent")
  .addEdge("classify_intent", "callModel")
  .addConditionalEdges("callModel", shouldContinue)
  .addEdge("tools", "callModel");

export const graph = workflow.compile({ checkpointer: memory });
