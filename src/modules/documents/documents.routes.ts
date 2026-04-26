import { DocumentState } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { requireRoles } from '../auth/authorization.middleware';
import { documentService } from './document.service';
import { auditService } from '../audits/audit.service';

const createDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1)
});

export const documentsRouter = Router();

documentsRouter.post(
  '/',
  requireAuth,
  requireRoles('AUTHOR'),
  async (req, res) => {
    const parsed = createDocumentSchema.safeParse(req.body);
    if (!parsed.success || !req.auth) {
      res.status(400).json({ error: 'invalid payload' });
      return;
    }

    const document = await documentService.create(
      req.auth.userId,
      parsed.data.title,
      parsed.data.content
    );

    await auditService.log(req.auth.userId, 'document_created', 'document', document.id);

    res.status(201).json(document);
  }
);

documentsRouter.get('/:id', requireAuth, async (req, res) => {
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

  res.status(200).json(document);
});

documentsRouter.post(
  '/:id/submit',
  requireAuth,
  requireRoles('AUTHOR'),
  async (req, res) => {
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
    if (!documentService.canSubmit(document, req.auth.userId, roles)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const updated = await documentService.transition(document, DocumentState.SUBMITTED);
    if (!updated) {
      res.status(409).json({ error: 'invalid transition' });
      return;
    }

    await auditService.log(req.auth.userId, 'document_submitted', 'document', document.id);

    res.status(200).json(updated);
  }
);

documentsRouter.post(
  '/:id/approve',
  requireAuth,
  requireRoles('APPROVER'),
  async (req, res) => {
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
    if (!documentService.canApproveOrReject(document, roles)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const updated = await documentService.transition(document, DocumentState.APPROVED);
    if (!updated) {
      res.status(409).json({ error: 'invalid transition' });
      return;
    }

    await auditService.log(req.auth.userId, 'document_approved', 'document', document.id);

    res.status(200).json(updated);
  }
);

documentsRouter.post(
  '/:id/reject',
  requireAuth,
  requireRoles('APPROVER'),
  async (req, res) => {
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
    if (!documentService.canApproveOrReject(document, roles)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const updated = await documentService.transition(document, DocumentState.REJECTED);
    if (!updated) {
      res.status(409).json({ error: 'invalid transition' });
      return;
    }

    await auditService.log(req.auth.userId, 'document_rejected', 'document', document.id);

    res.status(200).json(updated);
  }
);
