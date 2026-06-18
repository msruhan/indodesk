-- AlterTable — Tambah field screenshot 3uTools untuk bukti kualitas hardware iPhone/iPad
ALTER TABLE "Product" ADD COLUMN "threeUtoolsImages" JSONB NOT NULL DEFAULT '[]';
