# S3 storage configuration

For each API that uses S3, store `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in that API's encrypted `env/<app>/.env.prd` file. `AWS_SESSION_TOKEN` is optional for temporary credentials. The application reads the decrypted values at runtime and the AWS SDK signs S3 requests.

The API reports a configuration error on the first S3 operation if the bucket, region, or either access key is missing. Credentials are not required to start the API.

`AWS_S3_ENDPOINT` is only needed for an S3-compatible service. The API returns direct S3 URLs; configure `CDN_URL` separately when reading through the CDN adapter.
