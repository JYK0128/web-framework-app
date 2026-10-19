# S3 storage configuration

Set `AWS_S3_BUCKET` and `AWS_S3_REGION` in each API's encrypted `env/<app>/.env.prd` file when that API uses S3. Production Compose supplies the IAM Roles Anywhere profile path and name.

Each API container reads `/run/aws/rolesanywhere/config` with profile `app`. The profile uses `credential_process` with the AWS Roles Anywhere signing helper and a mounted host certificate/private key.

The API reports a configuration error on the first S3 operation if the bucket, region, profile path, or profile name is missing, or if the config file does not exist. The helper obtains temporary credentials; no long-lived access key is stored in the API environment file.

`AWS_S3_ENDPOINT` is only needed for an S3-compatible service. The API returns direct S3 URLs; configure `CDN_URL` separately when reading through the CDN adapter.
