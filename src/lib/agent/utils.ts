import { IItinerary } from "@/models/itinerary";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";

export function formatMessages(messages: BaseMessage[]): string {
  return messages
    .map((msg, idx) => {
      const msgType =
        "_getType" in msg
          ? msg._getType()
          : "type" in msg
          ? (msg as Record<string, any>)?.type
          : "unknown";
      const messageContent =
        typeof msg.content === "string"
          ? msg.content
          : msg.content
              .flatMap((c) => ("text" in c ? (c.text as string) : []))
              .join("\n");
      return `<${msgType} index="${idx}">\n${messageContent}\n</${msgType}>`;
    })
    .join("\n");
}

export function getRecentMessages(
  messages: BaseMessage[],
  maxCount = 3
): BaseMessage[] {
  const recent: BaseMessage[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg instanceof HumanMessage || msg instanceof AIMessage) {
      recent.unshift(msg);
    }
    if (recent.length === maxCount) break;
  }

  return recent;
}

export function getItineraryChangesSummaryDetailed(
  oldData: IItinerary,
  newData: IItinerary
): string[] {
  const changes: string[] = [];

  if (oldData.duration !== newData.duration) {
    changes.push(`⏱️ Thời gian: "${oldData.duration}" → "${newData.duration}"`);
  }

  const oldItinerary = oldData.itinerary || [];
  const newItinerary = newData.itinerary || [];

  const maxLength = Math.max(oldItinerary.length, newItinerary.length);

  for (let i = 0; i < maxLength; i++) {
    const oldDay = oldItinerary[i];
    const newDay = newItinerary[i];
    const dayNum = i + 1;

    if (!oldDay && newDay) {
      changes.push(`🆕 Thêm ngày ${dayNum} với các hoạt động sau:`);
      changes.push(...formatActivities(newDay, dayNum));
      continue;
    }

    if (oldDay && !newDay) {
      changes.push(`🗑️ Xoá ngày ${dayNum} khỏi lịch trình.`);
      continue;
    }

    const parts: ("morning" | "afternoon" | "evening")[] = [
      "morning",
      "afternoon",
      "evening",
    ];
    for (const part of parts) {
      const oldActivities = oldDay[part]?.activities || [];
      const newActivities = newDay[part]?.activities || [];

      if (JSON.stringify(oldActivities) !== JSON.stringify(newActivities)) {
        changes.push(`🔄 Ngày ${dayNum} - ${translatePart(part)}:`);

        const maxAct = Math.max(oldActivities.length, newActivities.length);
        for (let j = 0; j < maxAct; j++) {
          const oldAct = oldActivities[j];
          const newAct = newActivities[j];

          if (!oldAct && newAct) {
            changes.push(
              `➕ Thêm: "${newAct.description}" (Chi phí: ${newAct.cost}đ)`
            );
          } else if (oldAct && !newAct) {
            changes.push(`➖ Xoá: "${oldAct.description}"`);
          } else if (
            oldAct.description !== newAct.description ||
            oldAct.cost !== newAct.cost
          ) {
            changes.push(
              `✏️ Thay đổi: "${oldAct.description}" → "${newAct.description}" (Chi phí: ${oldAct.cost}đ → ${newAct.cost}đ)`
            );
          }
        }
      }
    }
  }

  return changes;
}

function translatePart(part: string): string {
  switch (part) {
    case "morning":
      return "buổi sáng";
    case "afternoon":
      return "buổi chiều";
    case "evening":
      return "buổi tối";
    default:
      return part;
  }
}

function formatActivities(day: any, dayNum: number): string[] {
  const parts: ("morning" | "afternoon" | "evening")[] = [
    "morning",
    "afternoon",
    "evening",
  ];
  const list: string[] = [];
  for (const part of parts) {
    const activities = day[part]?.activities || [];
    if (activities.length > 0) {
      list.push(`🕒 Ngày ${dayNum} - ${translatePart(part)}:`);
      for (const act of activities) {
        list.push(`• ${act.description} (Chi phí: ${act.cost}đ)`);
      }
    }
  }
  return list;
}
