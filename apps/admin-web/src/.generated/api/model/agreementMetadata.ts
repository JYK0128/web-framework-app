export type AgreementOptionPrimitive = boolean | string | number | null;

export interface AgreementMetadataDto {
  options?: Record<string, AgreementOptionPrimitive> | null;
}
