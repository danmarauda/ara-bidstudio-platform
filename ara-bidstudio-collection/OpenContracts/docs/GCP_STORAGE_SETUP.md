# Google Cloud Storage Setup for OpenContracts

This document provides instructions for configuring Google Cloud Storage (GCS) as the storage backend for OpenContracts.

## Overview

OpenContracts supports three storage backends, configurable via the `STORAGE_BACKEND` environment variable:
1. **LOCAL** (default) - Files stored on local disk
2. **AWS** - Amazon S3 cloud storage
3. **GCP** - Google Cloud Storage

## Prerequisites

- Google Cloud Platform account
- GCS bucket created
- Service account with appropriate permissions (for production)

## Setup Instructions

### 1. Create GCS Bucket

```bash
# Using gcloud CLI
gcloud storage buckets create gs://YOUR-BUCKET-NAME \
    --location=US \
    --default-storage-class=STANDARD \
    --uniform-bucket-level-access
```

### 2. Configure Service Account

#### For Production (Recommended):

1. Create a service account:
```bash
gcloud iam service-accounts create opencontracts-storage \
    --display-name="OpenContracts Storage Service Account"
```

2. Grant necessary permissions:
```bash
# Grant Storage Admin role to the service account
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
    --member="serviceAccount:opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Or for more granular permissions:
gcloud storage buckets add-iam-policy-binding gs://YOUR-BUCKET-NAME \
    --member="serviceAccount:opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

3. If using GKE/Cloud Run, attach the service account to your workload:
```bash
# For GKE
kubectl annotate serviceaccount YOUR-KSA \
    iam.gke.io/gcp-service-account=opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com

# For Cloud Run
gcloud run services update YOUR-SERVICE \
    --service-account=opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com
```

#### For Local Development:

1. Create and download a service account key:
```bash
gcloud iam service-accounts keys create ~/opencontracts-gcs-key.json \
    --iam-account=opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com
```

2. Set the environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/opencontracts-gcs-key.json
```

### 3. Configure Environment Variables

Update your `.env` file with the following settings:

```bash
# Set storage backend to GCP
STORAGE_BACKEND=GCP

# Required GCS Settings
GS_BUCKET_NAME=your-bucket-name
GS_PROJECT_ID=your-project-id

# Authentication (choose one method):
# Method 1: Use default credentials (production with Workload Identity)
# Leave GS_CREDENTIALS empty

# Method 2: Specify path to service account key file
GS_CREDENTIALS=/path/to/service-account-key.json

# Method 3: Use environment variable (set outside of Django)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Security Settings
GS_QUERYSTRING_AUTH=true  # Generate signed URLs for private files
GS_EXPIRATION_SECONDS=86400  # URL expiration (1 day)
GS_FILE_OVERWRITE=false  # Prevent file overwrites
GS_DEFAULT_ACL=  # Leave empty for private files

# Performance Settings
GS_BLOB_CHUNK_SIZE=2621440  # 2.5MB chunks for large files
GS_MAX_MEMORY_SIZE=0  # No memory limit
GS_IS_GZIPPED=false  # Enable for static file compression

# Optional: Use IAM Sign Blob API (when not using key file)
GS_IAM_SIGN_BLOB=true
GS_SA_EMAIL=opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com
```

## Security Best Practices

### 1. Service Account Permissions

Follow the principle of least privilege. The service account needs:

**Minimum Required Permissions:**
- `storage.objects.create` - Upload files
- `storage.objects.delete` - Delete files
- `storage.objects.get` - Read files
- `storage.objects.list` - List files
- `storage.buckets.get` - Get bucket metadata

**For Signed URLs (if using IAM Sign Blob):**
- `iam.serviceAccounts.signBlob` - Sign URLs

### 2. Bucket Configuration

```bash
# Enable uniform bucket-level access (recommended)
gcloud storage buckets update gs://YOUR-BUCKET-NAME --uniform-bucket-level-access

# Enable versioning for data protection
gcloud storage buckets update gs://YOUR-BUCKET-NAME --versioning

# Set lifecycle rules to delete old versions
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "isLive": false
        }
      }
    ]
  }
}
EOF
gcloud storage buckets update gs://YOUR-BUCKET-NAME --lifecycle-file=lifecycle.json
```

### 3. Access Control

The application implements different ACLs for different file types:

- **Static Files**: `publicRead` ACL for CSS, JS, images
- **Media Files**: Private by default, served via signed URLs

### 4. Security Headers

The custom storage backends automatically add security headers:

- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `Content-Disposition: attachment` - Force download for media files

### 5. Monitoring

Set up logging and monitoring:

```bash
# Enable access logs
gcloud storage buckets update gs://YOUR-BUCKET-NAME \
    --log-bucket=gs://YOUR-LOG-BUCKET \
    --log-object-prefix=access-logs/

# Set up alerts for unusual activity
gcloud monitoring alert create \
    --display-name="High GCS Egress" \
    --condition="..." \
    --notification-channels=...
```

## IAM Policy Example

Create a custom IAM role with minimal permissions:

```json
{
  "title": "OpenContracts Storage Role",
  "description": "Minimal permissions for OpenContracts GCS storage",
  "stage": "GA",
  "includedPermissions": [
    "storage.buckets.get",
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.get",
    "storage.objects.list",
    "storage.objects.update"
  ]
}
```

Apply the role:
```bash
gcloud iam roles create opencontractsStorage \
    --project=YOUR-PROJECT-ID \
    --file=role-definition.json

gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
    --member="serviceAccount:opencontracts-storage@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
    --role="projects/YOUR-PROJECT-ID/roles/opencontractsStorage"
```

## CORS Configuration (if needed)

If serving files directly from GCS to browsers:

```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:
```bash
gsutil cors set cors.json gs://YOUR-BUCKET-NAME
```

## Migration from AWS S3

To migrate existing files from S3 to GCS:

```bash
# Using gsutil
gsutil -m rsync -r s3://YOUR-S3-BUCKET gs://YOUR-GCS-BUCKET

# Or using Storage Transfer Service
gcloud transfer jobs create \
    --source-bucket=YOUR-S3-BUCKET \
    --destination-bucket=YOUR-GCS-BUCKET
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**
   - Check service account permissions
   - Verify bucket IAM policies
   - Ensure CORS is configured if accessing from browser

2. **Signed URL Issues**
   - Enable IAM Sign Blob API: `GS_IAM_SIGN_BLOB=true`
   - Verify service account has `iam.serviceAccounts.signBlob` permission
   - Check URL expiration time

3. **Authentication Errors**
   - Verify `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
   - Check service account key file permissions
   - For production, ensure Workload Identity is configured

4. **Performance Issues**
   - Adjust `GS_BLOB_CHUNK_SIZE` for large files
   - Enable `GS_IS_GZIPPED` for static files
   - Use Cloud CDN for frequently accessed content

## Additional Resources

- [Django Storages GCS Documentation](https://django-storages.readthedocs.io/en/latest/backends/gcloud.html)
- [Google Cloud Storage Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [GCS IAM Permissions Reference](https://cloud.google.com/storage/docs/access-control/iam-permissions)
- [Signed URLs Documentation](https://cloud.google.com/storage/docs/access-control/signed-urls)
