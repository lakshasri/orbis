import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { requireRoles } from '../auth/authorization.middleware';
import { auditService } from './audit.service';
import { documentService } from '../documents/document.service';

export const auditsRouter = Router();

auditsRouter.get('/documents/:id/history', requireAuth, async (req, res) => {
  const documentId = Number(req.params.id);
  if (Number.isNaN(documentId) || !req.auth) {
    res.status(400).json({ error: 'invalid document id' });
    return;
  }

  const document = await documentService.findById(documentId);
  if (!document) {
    res.status(404).json({ error: 'document not found' });
    return;
  }

  const roles = req.auth.roles ?? [];
  if (!documentService.canReadDocument(document, req.auth.userId, roles)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const events = await auditService.findByDocumentId(documentId);
  res.status(200).json(events);
});

auditsRouter.get('/', requireAuth, requireRoles('ADMIN', 'APPROVER'), async (_req, res) => {
  const events = await auditService.findAll();
  res.status(200).json(events);
});
