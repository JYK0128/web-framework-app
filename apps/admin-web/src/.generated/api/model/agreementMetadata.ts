export interface AgreementMetadataDto {
  channels?: AgreementChannelsDto | null;
}

export interface AgreementChannelsDto {
  email?: boolean;
  sms?: boolean;
  messenger?: boolean;
}
