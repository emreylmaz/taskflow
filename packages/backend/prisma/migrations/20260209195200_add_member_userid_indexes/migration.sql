-- CreateIndex
-- OrganizationMember.userId için index (membership lookup by user)
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
-- TeamMember.userId için index (membership lookup by user)
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");
