-- Session revocation: increment to invalidate all JWTs for a user.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
