import hashlib
import sys


def file_hash(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 fileintegritychecker_simple.py <file>")
        print("  python3 fileintegritychecker_simple.py <file> <expected_hash>")
        sys.exit(1)

    path = sys.argv[1]
    current = file_hash(path)

    if len(sys.argv) == 2:
        print(f"File: {path}")
        print(f"Hash: {current}")
    else:
        expected = sys.argv[2]
        status = "OK" if current == expected else "MODIFIED"
        print(f"File: {path}")
        print(f"Status: {status}")
        print(f"Expected: {expected}")
        print(f"Actual:   {current}")
