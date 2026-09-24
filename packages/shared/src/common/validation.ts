type ValidationErrorDetail = {
  property?: string
  constraints?: Record<string, string>
};

export function getValidationFieldErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) return {};

  return Object.fromEntries(
    details.flatMap((detail: ValidationErrorDetail) => {
      const property = detail.property;
      const message = detail.constraints && Object.values(detail.constraints)[0];
      return property && message ? [[property, message]] : [];
    }),
  );
}
