/**
 * Servicio LLM (OpenAI) para extraer datos estructurados del inmueble y rango de alquiler.
 * Contrato según ticket unified-llm-property-extract-v1.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { LLM_CONFIG, getOpenAiApiKey } from '../config/llm.config';
import { canCallLlm, recordLlmCall } from './llmRateLimiter';

// --- Schema Zod (respuesta del LLM, sin source) ---
const llmResponseSchema = z.object({
  sqm: z.number().nullable(),
  rooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  maxRent: z.number().min(0),
});

export type LlmPropertyExtract = z.infer<typeof llmResponseSchema> & {
  source: 'openai:v2';
};

export interface LlmPropertyExtractInput {
  city: string;
  purchasePrice: number;
  featuresText: string;
}

export const SYSTEM_PROMPT = `You extract structured property data and provide an approximate long-term rental estimate in Spain.

Rules:
- Only consider long-term residential rentals (minimum 6–12 months).
- Ignore vacation, tourist, or short-term rentals.
- Be conservative.
- Return a single conservative maximum monthly rent (maxRent) in EUR.`;

export function buildUserPrompt(input: LlmPropertyExtractInput): string {
  return `Extract structured property data and estimate monthly rent.

City: ${input.city}
Purchase price: ${input.purchasePrice} EUR

Property features:

${input.featuresText}

Return JSON:

{
  "sqm": number,
  "rooms": number,
  "bathrooms": number,
  "maxRent": number
}`;
}

/** Normaliza content: puede ser string o array de partes (modelos nuevos como gpt-5-nano). */
function getMessageText(
  content: string | Array<{ type?: string; text?: string; content?: string }> | null | undefined
): string | null {
  if (content == null) return null;
  if (typeof content === 'string') return content.trim() || null;
  if (!Array.isArray(content)) return null;
  const parts = content
    .map((p) => {
      if (p == null || typeof p !== 'object') return '';
      const t = (p as { text?: string; content?: string }).text ?? (p as { content?: string }).content;
      return typeof t === 'string' ? t : '';
    })
    .filter(Boolean);
  const joined = parts.join('').trim();
  return joined || null;
}

/** Intenta extraer JSON del contenido (puede venir envuelto en \`\`\`json ... \`\`\`) */
function extractJsonFromContent(content: string): string {
  const trimmed = content.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    return codeBlock[1].trim();
  }
  return trimmed;
}

/**
 * Llama a OpenAI con city, purchasePrice y featuresText; valida la respuesta y devuelve
 * LlmPropertyExtract o null si falla (sin API key, timeout, parse o validación).
 */
export async function fetchLlmPropertyExtract(
  input: LlmPropertyExtractInput
): Promise<LlmPropertyExtract | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    console.warn('[llm-property] OPENAI_API_KEY no configurada, omitiendo LLM');
    return null;
  }

  if (!input.featuresText?.trim()) {
    console.warn('[llm-property] featuresText vacío, omitiendo LLM');
    return null;
  }

  if (!canCallLlm()) {
    console.warn('[llm-property] Límite de llamadas alcanzado (por minuto o por hora), omitiendo LLM');
    return null;
  }

  const client = new OpenAI({ apiKey });

  try {
    recordLlmCall();
    const userPrompt = buildUserPrompt(input);
    console.log('[llm-property] Prompt enviado:\n' + '---\n[System]\n' + SYSTEM_PROMPT + '\n\n[User]\n' + userPrompt + '\n---');
    const completion = await client.chat.completions.create(
      {
        model: LLM_CONFIG.model,
        max_completion_tokens: LLM_CONFIG.maxTokens,
        temperature: LLM_CONFIG.temperature,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_object',
        },
      },
      { timeout: LLM_CONFIG.timeoutMs }
    );

    const choice = completion.choices[0];
    const rawContent = getMessageText(choice?.message?.content);
    
    if (!rawContent) {
      console.warn('[llm-property] Respuesta vacía de OpenAI', {
        finish_reason: choice?.finish_reason,
        refusal: choice?.message?.refusal,
      });
      return null;
    }

    const jsonStr = extractJsonFromContent(rawContent);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.warn('[llm-property] No se pudo parsear JSON:', rawContent.slice(0, 200));
      return null;
    }

    const result = llmResponseSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[llm-property] Validación Zod fallida:', result.error.message);
      return null;
    }

    const out: LlmPropertyExtract = {
      ...result.data,
      source: 'openai:v2',
    };

    const usage = completion.usage;
    console.log('llm-property', {
      city: input.city,
      sqm: out.sqm,
      rooms: out.rooms,
      bathrooms: out.bathrooms,
      maxRent: out.maxRent,
      ...(usage && {
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
      }),
    });

    return out;
  } catch (error) {
    console.warn(
      '[llm-property] Error llamada OpenAI:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
