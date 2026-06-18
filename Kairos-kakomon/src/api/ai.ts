export interface AiAnswer {
  sections: { title: string; body: string }[];
  chips: string[];
}

export interface AiAskRequest {
  questionId?: string;
  userText: string;
  mode?: 'hint' | 'explain' | 'plan';
}

export interface AiAskResponse {
  sessionId: string;
  costType: 'free' | 'token' | 'pro';
  tokensConsumed: number;
  freeRemainingAfter: number;
  tokenBalanceAfter: number;
  answer: AiAnswer;
}

function buildMockAnswer(prompt: string): AiAnswer {
  return {
    sections: [
      { title: '思路', body: '这是一份基于本地 mock 的占位回答。后端服务已下线，AI 接口暂不可用。' },
      { title: '关键点', body: `你输入的问题：${prompt || '(空)'}\n后续可在前端替换为真实推理。` },
    ],
    chips: ['再讲一次', '换个角度', '我会了'],
  };
}

export async function askAi(payload: AiAskRequest): Promise<AiAskResponse> {
  return {
    sessionId: `mock-session-${Date.now()}`,
    costType: 'free',
    tokensConsumed: 0,
    freeRemainingAfter: 1,
    tokenBalanceAfter: 0,
    answer: buildMockAnswer(payload.userText),
  };
}

export async function chatAi(sessionId: string, userText: string): Promise<AiAskResponse> {
  return {
    sessionId,
    costType: 'free',
    tokensConsumed: 0,
    freeRemainingAfter: 1,
    tokenBalanceAfter: 0,
    answer: buildMockAnswer(userText),
  };
}
