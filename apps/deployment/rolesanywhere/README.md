# IAM Roles Anywhere for API S3 access

Production API containers use `@aws-sdk/credential-provider-ini` to read the `app` profile from `/run/aws/rolesanywhere/config`. That profile runs the AWS IAM Roles Anywhere signing helper to obtain temporary credentials. No long-lived AWS access key is stored in the API environment.

## AWS setup

1. Register the certificate authority that issues the host certificate as an IAM Roles Anywhere trust anchor.
2. Create an IAM role trusted by that trust anchor and attach a least-privilege S3 policy. Use separate roles for `admin-api` and `service-api` where their bucket or prefix permissions differ.
3. Create a Roles Anywhere profile for each role and issue a client certificate and private key for the production host.
4. Install the AWS signing helper at `/usr/local/bin/aws_signing_helper` on the Docker host.
5. Create one directory per API with a `config`, certificate, and private key:

```text
/etc/aws/rolesanywhere/admin-api/config
/etc/aws/rolesanywhere/admin-api/certificate.pem
/etc/aws/rolesanywhere/admin-api/private-key.pem
/etc/aws/rolesanywhere/service-api/config
/etc/aws/rolesanywhere/service-api/certificate.pem
/etc/aws/rolesanywhere/service-api/private-key.pem
```

Each `config` file defines the profile and a `credential_process`, substituting the API's trust anchor, Roles Anywhere profile, and IAM role ARNs:

```ini
[profile app]
region = us-east-1
credential_process = /usr/local/bin/aws_signing_helper credential-process --certificate /run/aws/rolesanywhere/certificate.pem --private-key /run/aws/rolesanywhere/private-key.pem --trust-anchor-arn arn:aws:rolesanywhere:us-east-1:123456789012:trust-anchor/EXAMPLE --profile-arn arn:aws:rolesanywhere:us-east-1:123456789012:profile/EXAMPLE --role-arn arn:aws:iam::123456789012:role/service-api-s3
```

The production Compose file mounts these paths read-only and sets `AWS_CONFIG_FILE`, `AWS_PROFILE`, and `AWS_SDK_LOAD_CONFIG`. Set `AWS_S3_BUCKET` and `AWS_S3_REGION` in each API's encrypted runtime environment when that API uses S3. `AWS_S3_ENDPOINT` is only needed for an S3-compatible service.
