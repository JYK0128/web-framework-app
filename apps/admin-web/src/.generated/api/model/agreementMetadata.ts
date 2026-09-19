export type AgreementOptionPrimitive = boolean | string | number | null;

export interface AgreementOptionDefinition {
  type?: 'checkbox' | 'radio';
  label?: string;
  value?: AgreementOptionPrimitive;
  choices?: Array<{ value: string | number; label: string }>;
}

export type AgreementOptionValue = AgreementOptionPrimitive | AgreementOptionDefinition;

export interface AgreementMetadataDto {
  options?: Record<string, AgreementOptionValue> | null;
}
