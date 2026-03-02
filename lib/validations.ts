import { z } from "zod";

export const appSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  url: z.string().url("URL inválida"),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.enum(["eximia", "dev", "design", "business", "infra", "general"]),
  icon_emoji: z.string().max(4).optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .optional()
    .or(z.literal("")),
  credentials_enc: z.string().optional().or(z.literal("")),
  credentials_iv: z.string().optional().or(z.literal("")),
});

export type AppInput = z.infer<typeof appSchema>;
