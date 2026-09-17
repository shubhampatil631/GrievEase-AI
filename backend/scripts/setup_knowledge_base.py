#!/usr/bin/env python3
"""
Uploads regulatory corpus documents to the S3 KB Corpus bucket.
"""
import os
import sys
import boto3
from pathlib import Path

def upload_corpus(bucket_name: str, corpus_dir: str = "../corpus"):
    region_name = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
    s3 = boto3.client("s3", region_name=region_name)
    base_path = Path(corpus_dir).resolve()
    
    if not base_path.exists():
        print(f"[Error] Corpus directory {base_path} does not exist.")
        return

    print(f"[KB-Setup] Uploading documents from {base_path} to s3://{bucket_name}/kb-corpus/ ...")
    count = 0
    for file_path in base_path.glob("**/*"):
        if file_path.is_file() and not file_path.name.startswith("."):
            rel_path = file_path.relative_to(base_path).as_posix()
            s3_key = f"kb-corpus/{rel_path}"
            
            content_type = "text/plain"
            if file_path.suffix == ".pdf":
                content_type = "application/pdf"
            elif file_path.suffix == ".md":
                content_type = "text/markdown"
                
            s3.upload_file(
                Filename=str(file_path),
                Bucket=bucket_name,
                Key=s3_key,
                ExtraArgs={"ContentType": content_type}
            )
            print(f"  + Uploaded: {s3_key}")
            count += 1

    print(f"[KB-Setup] Finished uploading {count} files to S3 bucket {bucket_name}.")
    print("\nNext step in AWS Console:")
    print("1. Go to Amazon Bedrock -> Knowledge Bases -> Create Knowledge Base.")
    print(f"2. Point data source to: s3://{bucket_name}/kb-corpus/")
    print("3. Select Default Chunking (~300 tokens) and OpenSearch Serverless vector store.")
    print("4. Click 'Sync' and copy the Knowledge Base ID into your SAM template or environment.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python setup_knowledge_base.py <KB_CORPUS_BUCKET_NAME> [CORPUS_DIR]")
        sys.exit(1)
    target_bucket = sys.argv[1]
    target_dir = sys.argv[2] if len(sys.argv) > 2 else "corpus"
    upload_corpus(target_bucket, target_dir)
