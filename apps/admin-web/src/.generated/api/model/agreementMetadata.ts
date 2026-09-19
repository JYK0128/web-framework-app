export interface AgreementMetadataDto {
  options?: AgreementOptionsDto | null;
}

export interface AgreementOptionsDto {
  email?: boolean;
  sms?: boolean;
  messenger?: boolean;
}
