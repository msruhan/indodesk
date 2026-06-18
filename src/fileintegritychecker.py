import hashlib
import json
import sys
from pathlib import Path


def file_hash(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def create_baseline(baseline_path: Path, files: list[Path]) -> None:
    baseline = {}
    for file_path in files:
        resolved = file_path.resolve()
        if not resolved.is_file():
            print(f"Error: file not found: {file_path}")
            sys.exit(1)
        baseline[str(resolved)] = file_hash(resolved)

    baseline_path.write_text(json.dumps(baseline, indent=2), encoding="utf-8")
    print(f"Baseline saved: {baseline_path.resolve()}")
    print(f"Tracked files: {len(baseline)}")


def check_baseline(baseline_path: Path) -> None:
    if not baseline_path.is_file():
        print(f"Error: baseline not found: {baseline_path}")
        sys.exit(1)

    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    print("File Integrity Check")
    print("-" * 40)

    for file_name, expected_hash in baseline.items():
        file_path = Path(file_name)

        if not file_path.is_file():
            status = "MISSING"
            current_hash = "N/A"
        else:
            current_hash = file_hash(file_path)
            status = "OK" if current_hash == expected_hash else "MODIFIED"

        print(f"File   : {file_name}")
        print(f"Status : {status}")
        print(f"Expect : {expected_hash}")
        print(f"Actual : {current_hash}")
        print("-" * 40)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 fileintegritychecker.py init <baseline.json> <file1> [file2 ...]")
        print("  python3 fileintegritychecker.py check <baseline.json>")
        sys.exit(1)

    command = sys.argv[1]

    if command == "init":
        if len(sys.argv) < 4:
            print("Usage: python3 fileintegritychecker.py init <baseline.json> <file1> [file2 ...]")
            sys.exit(1)
        create_baseline(Path(sys.argv[2]), [Path(f) for f in sys.argv[3:]])
    elif command == "check":
        if len(sys.argv) < 3:
            print("Usage: python3 fileintegritychecker.py check <baseline.json>")
            sys.exit(1)
        check_baseline(Path(sys.argv[2]))
    else:
        print(f"Unknown command: {command}")
        print("Use 'init' or 'check'.")
        sys.exit(1)
