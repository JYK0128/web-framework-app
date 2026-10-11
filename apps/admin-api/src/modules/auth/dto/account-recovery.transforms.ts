export const trimLowercase = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;

export const compactPhoneNumber = ({ value }: { value: unknown }) => typeof value === 'string' ? value.replace(/[^0-9+]/g, '') : value;
