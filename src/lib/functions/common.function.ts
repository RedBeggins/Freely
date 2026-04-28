import { Message } from "@/types";
import {
  API_HISTORY_MAX_MESSAGES,
  API_HISTORY_MAX_TOTAL_CHARS,
  API_HISTORY_SINGLE_MESSAGE_MAX_CHARS,
} from "../chat-constants";

function messageCharLength(m: Message): number {
  if (typeof m.content === "string") return m.content.length;
  try {
    return JSON.stringify(m.content).length;
  } catch {
    return 0;
  }
}

function truncateSingleMessageContent(m: Message): Message {
  if (typeof m.content !== "string") return m;
  if (m.content.length <= API_HISTORY_SINGLE_MESSAGE_MAX_CHARS) return m;
  return {
    ...m,
    content:
      m.content.slice(0, API_HISTORY_SINGLE_MESSAGE_MAX_CHARS) +
      "\n\n[…truncated]",
  };
}

/**
 * Shrinks conversation history so providers with strict TPM/context limits (e.g. Groq free tier)
 * are less likely to reject the request.
 */
export function trimMessagesForApiContext(history: Message[]): Message[] {
  if (!history?.length) return [];

  let msgs = history.slice(-API_HISTORY_MAX_MESSAGES);

  const sumChars = (arr: Message[]) =>
    arr.reduce((s, m) => s + messageCharLength(m), 0);

  while (msgs.length > 2 && sumChars(msgs) > API_HISTORY_MAX_TOTAL_CHARS) {
    msgs = msgs.slice(2);
  }
  while (msgs.length > 1 && sumChars(msgs) > API_HISTORY_MAX_TOTAL_CHARS) {
    msgs = msgs.slice(1);
  }

  msgs = msgs.map(truncateSingleMessageContent);

  while (msgs.length > 1 && sumChars(msgs) > API_HISTORY_MAX_TOTAL_CHARS) {
    msgs = msgs.slice(1);
  }

  return msgs;
}

/** Groq only accepts `reasoning_effort` on specific reasoning models (see console.groq.com/docs/reasoning). */
export function groqModelSupportsReasoningEffort(modelId: string): boolean {
  const m = modelId.trim().toLowerCase();
  if (!m) return false;
  if (m.includes("gpt-oss")) return true;
  if (m.includes("qwen3-32b")) return true;
  return false;
}

function groqReasoningEffortAllowedForModel(
  modelId: string,
  effort: unknown
): boolean {
  const m = modelId.trim().toLowerCase();
  const e =
    typeof effort === "string" ? effort.toLowerCase().trim() : "";
  if (!e) return false;
  if (m.includes("qwen3-32b")) {
    return e === "none" || e === "default";
  }
  if (m.includes("gpt-oss")) {
    return e === "low" || e === "medium" || e === "high";
  }
  return false;
}

/**
 * Drops `reasoning_effort` when the request targets Groq but the model (or value)
 * does not support it, avoiding 400 invalid_request_error.
 */
export function pruneUnsupportedReasoningEffort(
  bodyObj: Record<string, unknown>,
  context: { providerId?: string; url: string }
): void {
  if (
    !bodyObj ||
    typeof bodyObj !== "object" ||
    !Object.prototype.hasOwnProperty.call(bodyObj, "reasoning_effort")
  ) {
    return;
  }

  const url = context.url.toLowerCase();
  const isGroq =
    context.providerId === "groq" || url.includes("api.groq.com");
  if (!isGroq) return;

  const modelRaw = bodyObj.model;
  const modelId = typeof modelRaw === "string" ? modelRaw : "";

  if (!groqModelSupportsReasoningEffort(modelId)) {
    delete bodyObj.reasoning_effort;
    return;
  }

  if (!groqReasoningEffortAllowedForModel(modelId, bodyObj.reasoning_effort)) {
    delete bodyObj.reasoning_effort;
  }
}

/** Flatten OpenAI-style message content to a plain string (no array/object). */
export function messageContentToApiString(content: unknown): string {
  if (typeof content === "string") return content;
  if (content == null) return "";
  if (Array.isArray(content)) {
    const texts = content
      .filter(
        (p: unknown) =>
          p &&
          typeof p === "object" &&
          (p as { type?: string }).type === "text" &&
          typeof (p as { text?: string }).text === "string"
      )
      .map((p: unknown) => (p as { text: string }).text);
    return texts.join("\n");
  }
  if (typeof content === "object") {
    try {
      return JSON.stringify(content);
    } catch {
      return "";
    }
  }
  return String(content);
}

/**
 * Groq and some OpenAI-compatible APIs require `content` to be a string on every
 * message unless the final user turn is true multimodal (text + image).
 * Templates often emit `[{type:"text",text}]` even for text-only chats.
 */
export function coerceChatCompletionMessagesToTextContent(
  messages: unknown[],
  hasImagesInCurrentTurn: boolean
): unknown[] {
  if (!Array.isArray(messages)) return messages as unknown[];

  return messages.map((raw, index) => {
    if (!raw || typeof raw !== "object") return raw;
    const m = raw as Record<string, unknown>;
    const content = m.content;
    const isLast = index === messages.length - 1;

    if (typeof content === "string") {
      return m;
    }

    if (!Array.isArray(content)) {
      return { ...m, content: messageContentToApiString(content) };
    }

    const hasVisionPart = content.some(
      (p: unknown) =>
        p &&
        typeof p === "object" &&
        ((p as { type?: string }).type === "image_url" ||
          (p as { type?: string }).type === "image")
    );

    if (isLast && hasVisionPart && hasImagesInCurrentTurn) {
      return m;
    }

    return { ...m, content: messageContentToApiString(content) };
  });
}

export function getByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path
    .replace(/\[/g, ".")
    .replace(/\]/g, "")
    .split(".")
    .reduce((o, k) => (o || {})[k], obj);
}

export function setByPath(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i].replace(/\[(\d+)\]/g, ".$1");
    if (!current[key]) current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    current = current[key];
  }
  current[keys[keys.length - 1].replace(/\[(\d+)\]/g, ".$1")] = value;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = (reader.result as string)?.split(",")[1] ?? "";
      resolve(base64data);
    };
    reader.onerror = reject;
  });
}

export function extractVariables(
  curl: string,
  includeAll = false
): { key: string; value: string }[] {
  if (typeof curl !== "string") {
    return [];
  }

  const regex = /\{\{([A-Z_]+)\}\}/g;
  const matches = curl?.match(regex) || [];
  const variables = matches
    .map((match) => {
      if (typeof match === "string") {
        return match.slice(2, -2);
      }
      return "";
    })
    .filter((v) => v !== "");

  const uniqueVariables = [...new Set(variables)];

  const doNotInclude = includeAll
    ? []
    : ["SYSTEM_PROMPT", "TEXT", "IMAGE", "AUDIO"];

  const filteredVariables = uniqueVariables?.filter(
    (variable) => !doNotInclude?.includes(variable)
  );

  return filteredVariables.map((variable) => ({
    key: variable?.toLowerCase()?.replace(/_/g, "_") || "",
    value: variable,
  }));
}

/**
 * Recursively processes a user message template to replace placeholders for text and images.
 * @param template The user message template object.
 * @param userMessage The user's text message.
 * @param imagesBase64 An array of base64 encoded images.
 * @returns The processed user message object.
 */
export function processUserMessageTemplate(
  template: any,
  userMessage: string,
  imagesBase64: string[] = []
): any {
  const escapeForJson = (value: string) =>
    JSON.stringify(value ?? "").slice(1, -1);

  const templateStr = JSON.stringify(template).replace(
    /\{\{TEXT\}\}/g,
    escapeForJson(userMessage)
  );
  const result = JSON.parse(templateStr);

  const imageReplacer = (node: any): any => {
    if (Array.isArray(node)) {
      const imageTemplateIndex = node.findIndex((item) =>
        JSON.stringify(item).includes("{{IMAGE}}")
      );

      if (imageTemplateIndex > -1) {
        const imageTemplate = node[imageTemplateIndex];
        const imageParts =
          imagesBase64.length > 0
            ? imagesBase64.map((img) => {
                const partStr = JSON.stringify(imageTemplate).replace(
                  /\{\{IMAGE\}\}/g,
                  img
                );
                return JSON.parse(partStr);
              })
            : [];

        const finalArray = [
          ...node.slice(0, imageTemplateIndex),
          ...imageParts,
          ...node.slice(imageTemplateIndex + 1),
        ];
        return finalArray.map(imageReplacer);
      }
      return node.map(imageReplacer);
    } else if (node && typeof node === "object") {
      const newNode: { [key: string]: any } = {};
      for (const key in node) {
        newNode[key] = imageReplacer(node[key]);
      }
      return newNode;
    }
    return node;
  };

  return imageReplacer(result);
}

/**
 * Builds a dynamic messages array from a template, incorporating history and the current user message.
 * @param messagesTemplate The message template array from the cURL configuration.
 * @param history An array of previous messages in the conversation.
 * @param userMessage The user's current text message.
 * @param imagesBase64 An array of base64 encoded images for the current message.
 * @returns The fully constructed messages array.
 */
export function buildDynamicMessages(
  messagesTemplate: any[],
  history: Message[],
  userMessage: string,
  imagesBase64: string[] = []
): any[] {
  const userMessageTemplateIndex = messagesTemplate.findIndex((m) =>
    JSON.stringify(m).includes("{{TEXT}}")
  );

  if (userMessageTemplateIndex === -1) {
    return [...history, { role: "user", content: userMessage }]; // Fallback
  }

  const prefixMessages = messagesTemplate.slice(0, userMessageTemplateIndex);
  const suffixMessages = messagesTemplate.slice(userMessageTemplateIndex + 1);
  const userMessageTemplate = messagesTemplate[userMessageTemplateIndex];

  const newUserMessage = processUserMessageTemplate(
    userMessageTemplate,
    userMessage,
    imagesBase64
  );

  return [...prefixMessages, ...history, newUserMessage, ...suffixMessages];
}

/**
 * Recursively walks through an object and replaces variable placeholders.
 * @param node The object or value to process.
 * @param variables A key-value map of variables to replace.
 * @returns The processed object.
 */
export function deepVariableReplacer(
  node: any,
  variables: Record<string, string>
): any {
  if (typeof node === "string") {
    let result = node;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  }
  if (Array.isArray(node)) {
    return node.map((item) => deepVariableReplacer(item, variables));
  }
  if (node && typeof node === "object") {
    const newNode: { [key: string]: any } = {};
    for (const key in node) {
      newNode[key] = deepVariableReplacer(node[key], variables);
    }
    return newNode;
  }
  return node;
}

/**
 * Extracts content from a streaming API response chunk by trying a series of common JSON paths.
 * This makes the system more resilient to variations in streaming formats.
 * @param chunk The parsed JSON object from a stream line.
 * @param defaultPath The default, non-streaming content path for the provider.
 * @returns The extracted text content, or null if not found.
 */
function deltaContentToString(deltaContent: unknown): string | null {
  if (typeof deltaContent === "string" && deltaContent.length > 0) {
    return deltaContent;
  }
  if (Array.isArray(deltaContent)) {
    const texts = deltaContent
      .filter(
        (p: unknown) =>
          p &&
          typeof p === "object" &&
          (p as { type?: string }).type === "text" &&
          typeof (p as { text?: string }).text === "string"
      )
      .map((p: unknown) => (p as { text: string }).text);
    if (texts.length > 0) {
      return texts.join("");
    }
  }
  return null;
}

export function getStreamingContent(
  chunk: any,
  defaultPath: string
): string | null {
  // OpenAI-compatible SSE (Groq, OpenAI, Mistral, etc.): only show assistant
  // `delta.content`. Never use `reasoning_content` / `reasoning` / `thinking`.
  const delta = chunk?.choices?.[0]?.delta;
  if (delta != null && typeof delta === "object") {
    const visible = deltaContentToString(delta.content);
    if (visible) {
      return visible;
    }
    return null;
  }

  // A set of possible paths to check for streaming content.
  // Using a Set automatically handles duplicates.
  const possiblePaths = new Set([
    // 1. First, try a common modification for OpenAI-like providers.
    defaultPath.replace(".message.", ".delta."),
    // 2. Then, add other common patterns.
    "choices[0].delta.content", // OpenAI, Groq, Mistral, Perplexity
    "candidates[0].content.parts[0].text", // Gemini
    "delta.text", // Claude
    "text", // Cohere
    // 3. Finally, use the original path as a fallback (for Gemini and others).
    defaultPath,
  ]);

  for (const path of possiblePaths) {
    // Skip empty or null paths
    if (!path) continue;

    const content = getByPath(chunk, path);

    // We only care about non-empty string content.
    // Some paths might resolve to objects (e.g., `choices[0].delta`), so we check the type.
    if (typeof content === "string" && content) {
      return content;
    }
  }

  // Return null if no content is found after trying all paths.
  return null;
}
