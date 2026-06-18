import sys

COMMON_PASSWORDS = {"123456", "password", "password123", "qwerty", "admin"}


def check_password(password: str) -> tuple[str, int]:
    password = password.strip()
    if not password:
        return "Very Weak", 0
    if password.lower() in COMMON_PASSWORDS:
        return "Very Weak", 0

    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if any(c.islower() for c in password):
        score += 1
    if any(c.isupper() for c in password):
        score += 1
    if any(c.isdigit() for c in password):
        score += 1
    if any(not c.isalnum() for c in password):
        score += 1

    if score <= 2:
        rating = "Weak"
    elif score <= 4:
        rating = "Fair"
    elif score <= 5:
        rating = "Strong"
    else:
        rating = "Very Strong"

    return rating, score


if __name__ == "__main__":
    pwd = sys.argv[1] if len(sys.argv) > 1 else input("Enter password: ")
    rating, score = check_password(pwd)
    print(f"Rating: {rating} (score: {score}/6)")



#asdasda