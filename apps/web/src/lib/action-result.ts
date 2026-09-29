export type ActionError = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
export type ActionResult = { ok: true } | ActionError;
