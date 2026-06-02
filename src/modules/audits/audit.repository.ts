import { prisma } from '../../config/db';

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'user_created'
  | 'role_assigned'
  | 'document_created'
  | 'document_submitted'
  | 'document_approved'
  | 'document_rejected';

export const auditRepository = {
  create(
    actorId: number | null,
    action: AuditAction,
    targetType: string,
    targetId: number | null = null
  ) {
    return prisma.auditEvent.create({
      data: {
        actorId,
        action,
        targetType,
        targetId
      }
    });
  },
  findAll() {
    return prisma.auditEvent.findMany({
      orderBy: { createdAt: 'asc' }
    });
  },
  findByTargetTypeAndId(targetType: string, targetId: number) {
    return prisma.auditEvent.findMany({
      where: {
        targetType,
        targetId
      },
      orderBy: { createdAt: 'asc' }
    });
  }
};
