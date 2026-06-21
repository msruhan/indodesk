#!/usr/bin/env python3
"""Merge a backup manifest into backups/index.json on R2."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def aws_base() -> list[str]:
    return [
        "aws",
        "--endpoint-url",
        os.environ["BACKUP_R2_ENDPOINT"],
        "s3",
    ]


def aws_env() -> dict[str, str]:
    env = os.environ.copy()
    env.setdefault("AWS_DEFAULT_REGION", "auto")
    if "AWS_ACCESS_KEY_ID" not in env and os.environ.get("BACKUP_R2_ACCESS_KEY_ID"):
        env["AWS_ACCESS_KEY_ID"] = os.environ["BACKUP_R2_ACCESS_KEY_ID"]
    if "AWS_SECRET_ACCESS_KEY" not in env and os.environ.get("BACKUP_R2_SECRET_ACCESS_KEY"):
        env["AWS_SECRET_ACCESS_KEY"] = os.environ["BACKUP_R2_SECRET_ACCESS_KEY"]
    return env


def download_index(bucket: str, dest: Path) -> list[dict]:
    result = subprocess.run(
        [*aws_base(), "cp", f"s3://{bucket}/backups/index.json", str(dest)],
        env=aws_env(),
        capture_output=True,
    )
    if result.returncode != 0:
        return []
    try:
        data = json.loads(dest.read_text())
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    return []


def upload_index(bucket: str, items: list[dict]) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tmp:
        json.dump(items, tmp, indent=2)
        tmp_path = tmp.name
    try:
        subprocess.check_call(
            [*aws_base(), "cp", tmp_path, f"s3://{bucket}/backups/index.json"],
            env=aws_env(),
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: backup-update-index.py /path/to/manifest.json", file=sys.stderr)
        return 1

    manifest_path = Path(sys.argv[1])
    manifest = json.loads(manifest_path.read_text())
    bucket = os.environ["BACKUP_R2_BUCKET"]

    summary = {
        "id": manifest["id"],
        "type": manifest.get("type", "manual"),
        "tag": manifest.get("tag"),
        "createdAt": manifest.get("createdAt") or datetime.now(timezone.utc).isoformat(),
        "databaseSizeBytes": manifest.get("database", {}).get("sizeBytes", 0),
        "uploadsSizeBytes": manifest.get("uploads", {}).get("sizeBytes", 0),
        "status": manifest.get("status", "success"),
    }

    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.json"
        items = download_index(bucket, index_path)
        items = [i for i in items if i.get("id") != summary["id"]]
        items.insert(0, summary)
        items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        upload_index(bucket, items)

    print(f"index updated: {summary['id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
