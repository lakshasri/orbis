import { auditRepository, type AuditAction } from './audit.repository';

export const auditService = {
  async log(
    actorId: number | null,
    action: AuditAction,
    targetType: string,
    targetId: number | null = null
  ) {
    return auditRepository.create(actorId, action, targetType, targetId);
  },
  findAll() {
    return auditRepository.findAll();
  },
  findByDocumentId(documentId: number) {
    return auditRepository.findByTargetTypeAndId('document', documentId);
  }
};
