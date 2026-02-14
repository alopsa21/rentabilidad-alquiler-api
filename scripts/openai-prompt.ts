#!/usr/bin/env tsx
/**
 * Envía un mensaje a OpenAI con la misma configuración que llm.config.ts.
 * Útil para probar prompts, modelos, etc.
 *
 * Uso:
 *   npm run openai-prompt -- "Tu mensaje aquí"
 *   npm run openai-prompt -- --system "Eres un asistente." "Pregunta del usuario"
 *
 * Requiere OPENAI_API_KEY en .env
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { LLM_CONFIG, getOpenAiApiKey } from '../src/config/llm.config';

function parseArgs(): { systemPrompt: string | null; userPrompt: string } {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Uso: npm run openai-prompt -- "Tu mensaje"');
    console.error('      npm run openai-prompt -- --system "Instrucciones" "Tu mensaje"');
    process.exit(1);
  }
  let systemPrompt: string | null = null;
  let userStart = 0;
  if (args[0] === '--system' && args.length >= 3) {
    systemPrompt = args[1]!;
    userStart = 2;
  }
  const userPrompt = args.slice(userStart).join(' ').trim();
  if (!userPrompt) {
    console.error('El mensaje de usuario no puede estar vacío.');
    process.exit(1);
  }
  return { systemPrompt, userPrompt };
}

async function main() {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    console.error('OPENAI_API_KEY no configurada en .env');
    process.exit(1);
  }

  const { systemPrompt, userPrompt } = parseArgs();

  const client = new OpenAI({ apiKey });
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  try {
    const completion = await client.chat.completions.create(
      {
        model: LLM_CONFIG.model,
        max_completion_tokens: LLM_CONFIG.maxTokens,
        temperature: LLM_CONFIG.temperature,
        messages,
      },
      { timeout: LLM_CONFIG.timeoutMs }
    );

    const content = completion.choices[0]?.message?.content ?? '(vacío)';
    console.log(content);
    const usage = completion.usage;
    if (usage) {
      console.log('\nTokens: prompt=%d completion=%d total=%d', usage.prompt_tokens, usage.completion_tokens, usage.total_tokens);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
