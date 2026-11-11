import * as cdk from 'aws-cdk-lib';
import { Hosting } from '@aws-blocks/blocks/cdk';
import { getStackName } from '@aws-blocks/blocks/scripts';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new cdk.App();
cdk.Tags.of(app).add('aws-mcp:deploy:sop', 'migrate-static-site-to-blocks');
cdk.Tags.of(app).add('aws-mcp:deploy:launch-id', 'cxj3ujn4r73t4md6yj8dcoi9');

const sandboxMode = app.node.tryGetContext('sandboxMode') === 'true';
const projectRoot = app.node.tryGetContext('projectRoot') || process.cwd();

// getStackName reads .blocks/config.json and suffixes -sandbox/-prod, so the
// scaffold's scripts target the same stack and sandbox never overwrites prod.
const stack = new cdk.Stack(app, getStackName({ sandbox: sandboxMode, projectRoot }));

// Hosting serves the pre-built static site from S3 + CloudFront. Prod only —
// in sandbox you open the site locally.
// No buildCommand: this is a hand-written HTML/CSS/JS site (pre-built).
if (!sandboxMode) {
  new Hosting(stack, 'Hosting', {
    root: join(__dirname, '..'),
    framework: 'static',
    buildOutputDir: 'site',
    contentSecurityPolicy:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; media-src 'self'; object-src 'none'; frame-ancestors 'self'",
  });
}
