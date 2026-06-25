# gato — infrastructure

AWS CDK app that provisions the hosting infrastructure for the **gato** game. It consumes `GameStack` from [`@arcade/infra`](../../infra) and is deployed manually from local (see the monorepo [`spec.md`](../../spec.md) → "Infra deployed from local").

## What it creates

Via `GameStack`:

- a private, versioned S3 bucket (all public access blocked, SSL enforced);
- a CloudFront distribution (Origin Access Control, HTTPS-only, SPA fallback for 403/404, security headers incl. a Content Security Policy);
- Route 53 A + AAAA alias records pointing `<SUBDOMAIN>.<DOMAIN_NAME>` at the distribution.

It does **not** create the Route 53 hosted zone or the ACM certificate — both must already exist; they are referenced by id / ARN.

Stack id: `GatoStack` (set in [`bin/app.ts`](bin/app.ts)).

## Prerequisites

- Node 24 and the repo installed from the root (`npm install`).
- AWS CLI v2 with credentials for the target account (or set `AWS_PROFILE`).
- An existing Route 53 hosted zone for your domain.
- An existing wildcard ACM certificate in `us-east-1`.

## Configure

Create `.env` in this folder from the example and fill in every value:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `SUBDOMAIN` | Subdomain prefix for the game (e.g. `gato`) |
| `DOMAIN_NAME` | Parent domain that owns the hosted zone |
| `HOSTED_ZONE_ID` | Id of the existing Route 53 hosted zone |
| `CERTIFICATE_ARN` | ARN of the existing wildcard ACM certificate (us-east-1) |
| `AWS_ACCOUNT_ID` | Target AWS account id |
| `AWS_REGION` | Must be `us-east-1` (ACM + CloudFront) |
| `AWS_PROFILE` | Optional named credentials profile |

`.env` is git-ignored; never commit real values.

## Validate

```bash
npm run typecheck --workspace gato/infra
```

## Deploy

From this folder:

```bash
cd gato/infra
npm run diff      # review the planned changes (cdk diff)
npm run deploy    # cdk deploy
```

If the account has not been bootstrapped for CDK yet, run `npx cdk bootstrap` once for the account/region.

> Windows PowerShell: run the `cd` and `npm` steps as separate commands (`&&` is not valid in PowerShell 5.1).

## After deploy

Note the stack outputs:

| Output | Use |
|---|---|
| `SiteUrl` | The deployed game URL; set it as `PUBLIC_SITE_URL` in `gato/frontend/.env` |
| `BucketName` | GitHub secret `GATO_BUCKET_NAME` (frontend deploy) |
| `DistributionId` | GitHub secret `GATO_DISTRIBUTION_ID` (frontend deploy) |
| `DistributionDomainName` | The CloudFront domain backing the alias records |

Confirm the subdomain resolves over HTTPS before enabling the frontend deploy workflow.

## Teardown

```bash
npm run destroy --workspace gato/infra
```

The S3 bucket uses `RemovalPolicy.RETAIN`, so it (and its versioned contents) survives stack deletion and must be removed manually if you truly want it gone.
