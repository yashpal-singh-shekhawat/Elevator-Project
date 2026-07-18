-- AlterTable
ALTER TABLE "amc_contracts" ADD COLUMN     "tier" TEXT;

-- CreateTable
CREATE TABLE "platform_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_refresh_tokens" (
    "id" SERIAL NOT NULL,
    "platform_user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- CreateIndex
CREATE INDEX "platform_refresh_tokens_platform_user_id_idx" ON "platform_refresh_tokens"("platform_user_id");

-- CreateIndex
CREATE INDEX "platform_refresh_tokens_token_hash_idx" ON "platform_refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "platform_refresh_tokens" ADD CONSTRAINT "platform_refresh_tokens_platform_user_id_fkey" FOREIGN KEY ("platform_user_id") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
