-- Add Facebook Marketplace as inspection product source
ALTER TYPE "InspectionProductSource" ADD VALUE IF NOT EXISTS 'FACEBOOK_MARKETPLACE' BEFORE 'PRIVATE';
