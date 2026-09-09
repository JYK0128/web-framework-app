export const CSP_WHITELIST = {
  scripts: ['https://static.cloudflareinsights.com', 'https://www.googletagmanager.com', 'https://cdn.portone.io', 'https://checkout.portone.io', 'https://testcert.kcp.co.kr', 'https://cert.kcp.co.kr'],
  connect: ['https://static.cloudflareinsights.com', 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://api.portone.io', 'https://checkout-service.prod.iamport.co', 'https://testcert.kcp.co.kr', 'https://cert.kcp.co.kr'],
  frames: ['https://checkout.portone.io', 'https://testcert.kcp.co.kr', 'https://cert.kcp.co.kr'],
  images: ['https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://testcert.kcp.co.kr', 'https://cert.kcp.co.kr'],
  fonts: ['https://testcert.kcp.co.kr', 'https://cert.kcp.co.kr'],
} as const;
