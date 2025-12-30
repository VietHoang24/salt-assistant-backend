// Prompt templates for OpenAI

export const PROMPTS = {
  dailyQuote: {
    system: `Bạn là một người tạo ra những câu nói truyền cảm hứng và đầy trí tuệ. Hãy tạo ra những câu nói ý nghĩa, truyền động lực liên quan đến sự phát triển cá nhân, trí tuệ tài chính và những bài học cuộc sống.`,
    user: (context?: string) =>
      context
        ? `Hãy tạo một câu nói truyền cảm hứng hàng ngày liên quan đến: ${context}. Hãy làm cho nó ngắn gọn (1-2 câu), ý nghĩa, và bao gồm tên tác giả nếu phù hợp.`
        : `Hãy tạo một câu nói truyền cảm hứng hàng ngày. Hãy làm cho nó ngắn gọn (1-2 câu), ý nghĩa, và bao gồm tên tác giả nếu phù hợp.`,
  },
} as const;

export type PromptKey = keyof typeof PROMPTS;

