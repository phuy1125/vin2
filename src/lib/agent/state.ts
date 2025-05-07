import { BaseMessage } from "@langchain/core/messages";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export enum Intent {
  General = "general",
  Search = "search",
  Greeting = "greeting",
  Accommodation = "accommodation",
  Destination = "destination",
  Transportation = "transportation",
  Activities = "activities",
  Weather = "weather",
  Itinerary = "addItinerary",
  GenerateItinerary = "generateItinerary",
  FindItinerary = "findItinerary",
  UpdateItinerary = "updateItinerary",
}

export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  //Detect intent of the user query
  intent: Annotation<Intent>,

  last_intent: Annotation<Intent>,

  userId: Annotation<string>(),

  iTineraryId: Annotation<string>(),
});

export type GraphAnnotationType = typeof GraphAnnotation.State;
