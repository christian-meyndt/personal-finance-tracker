"""Create a user account.

Usage:
    uv run python scripts/create_user.py <email> <password> [name]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.models import User  # noqa: E402
from app.security import hash_password  # noqa: E402


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: uv run python scripts/create_user.py <email> <password> [name]")
        sys.exit(1)
    email = sys.argv[1].lower()
    password = sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else None

    with SessionLocal() as db:
        existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            print(f"User {email} already exists (id={existing.id})")
            sys.exit(1)
        user = User(email=email, password_hash=hash_password(password), name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created user id={user.id} email={user.email}")


if __name__ == "__main__":
    main()
