// Response shape from docs/07 section 1.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export const fail = (code: string, message: string) =>
  ({ ok: false, error: { code, message } }) as const;

export const VALIDATION_MESSAGE = "Revisa los datos ingresados.";

/** Password rule messages are ours and safe to show; everything else stays generic. */
export function validationFail(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const issue = error.issues.find(
    (i) => i.path[0] === "password" || i.path[0] === "confirm",
  );
  return fail("VALIDATION_ERROR", issue?.message ?? VALIDATION_MESSAGE);
}

/** State shape shared by every useActionState form. */
export type FormState = ActionResult<{ message?: string } | undefined> | null;
