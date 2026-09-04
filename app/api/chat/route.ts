/** 채팅 응답을 실제 OpenAI로 생성하는 서버 라우트.
 * API 키가 클라이언트 번들에 노출되지 않도록 반드시 서버(여기)에서만 호출한다. */

import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: ".env.local의 OPENAI_API_KEY가 비어 있습니다." },
      { status: 500 },
    );
  }

  const { prompt } = (await req.json()) as { prompt?: string };
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt가 필요합니다." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      // 저렴하고 빠른 모델 — $5 예산으로 오래 테스트하기 좋다
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI 요청에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
