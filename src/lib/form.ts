import type { z } from "zod";

export type FormState = { errors?: Record<string, string[] | undefined>; message?: string; values?: Record<string, string> } | undefined;

const formValues = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].filter(([k, v]) => !k.startsWith("$ACTION") && typeof v === "string")) as Record<string, string>;

export function parseForm<S extends z.ZodType>(schema: S, formData: FormData) {
  return schema.safeParse(formValues(formData));
}

// React 19 resets uncontrolled forms after an action; echo the submitted values back so they survive.
export function fieldErrors(error: z.ZodError, formData: FormData): FormState {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (errors[key] ??= []).push(issue.message);
  }
  return { errors, values: formValues(formData) };
}
