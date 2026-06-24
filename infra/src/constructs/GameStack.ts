import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import {
  CONTENT_SECURITY_POLICY,
  DEFAULT_ROOT_OBJECT,
  ERROR_RESPONSE_TTL,
  HSTS_MAX_AGE,
  HTTP_STATUS,
  SPA_FALLBACK_PATH,
} from '../constants/index';

/**
 * Configuration for {@link GameStack}.
 *
 * The hosted zone and the ACM certificate already exist and are NOT created by
 * this stack; they are referenced by id / ARN respectively.
 */
export interface GameStackProps extends StackProps {
  /** Subdomain prefix, e.g. "snake". */
  subdomain: string;
  /** Parent domain that owns the hosted zone, e.g. "arcade.example.com". */
  domainName: string;
  /** Id of the pre-existing Route 53 hosted zone for {@link domainName}. */
  hostedZoneId: string;
  /** ARN of the pre-existing wildcard ACM certificate (must be in us-east-1). */
  certificateArn: string;
}

/**
 * Hosts a static frontend game under its own subdomain.
 *
 * Creates:
 * - a private, versioned S3 bucket with all public access blocked;
 * - a CloudFront distribution (Origin Access Control, HTTPS-only, SPA fallback,
 *   security headers including a Content Security Policy);
 * - Route 53 A and AAAA alias records pointing the subdomain at the
 *   distribution.
 */
export class GameStack extends Stack {
  /** The private bucket that stores the built frontend assets. */
  public readonly bucket: s3.Bucket;
  /** The CloudFront distribution that serves the game over HTTPS. */
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: GameStackProps) {
    super(scope, id, props);

    const fullDomainName = `${props.subdomain}.${props.domainName}`;

    this.bucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      props.certificateArn,
    );

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeaders',
      {
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy: CONTENT_SECURITY_POLICY,
            override: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: HSTS_MAX_AGE,
            includeSubdomains: true,
            preload: true,
            override: true,
          },
        },
      },
    );

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: DEFAULT_ROOT_OBJECT,
      domainNames: [fullDomainName],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy,
      },
      errorResponses: [
        {
          httpStatus: HTTP_STATUS.FORBIDDEN,
          responseHttpStatus: HTTP_STATUS.OK,
          responsePagePath: SPA_FALLBACK_PATH,
          ttl: ERROR_RESPONSE_TTL,
        },
        {
          httpStatus: HTTP_STATUS.NOT_FOUND,
          responseHttpStatus: HTTP_STATUS.OK,
          responsePagePath: SPA_FALLBACK_PATH,
          ttl: ERROR_RESPONSE_TTL,
        },
      ],
    });

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      },
    );

    const aliasTarget = route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(this.distribution),
    );

    new route53.ARecord(this, 'AliasRecordIPv4', {
      zone: hostedZone,
      recordName: props.subdomain,
      target: aliasTarget,
    });

    new route53.AaaaRecord(this, 'AliasRecordIPv6', {
      zone: hostedZone,
      recordName: props.subdomain,
      target: aliasTarget,
    });

    new CfnOutput(this, 'BucketName', { value: this.bucket.bucketName });
    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
    });
    new CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
    });
    new CfnOutput(this, 'SiteUrl', { value: `https://${fullDomainName}` });
  }
}
