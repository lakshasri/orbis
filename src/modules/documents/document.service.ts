import { DocumentState, type Document } from '@prisma/client';
import { documentRepository } from './document.repository';

const transitionMap: Record<DocumentState, DocumentState[]> = {
  DRAFT: [DocumentState.SUBMITTED],
  SUBMITTED: [DocumentState.APPROVED, DocumentState.REJECTED],
  APPROVED: [],
  REJECTED: []
};

export const documentService = {
  create(authorId: number, title: string, content: string) {
    return documentRepository.create(authorId, title, content);
  },
  findById(id: number) {
    return documentRepository.findById(id);
  },
  canReadDocument(document: Document, userId: number, roles: string[]): boolean {
    if (roles.includes('ADMIN') || roles.includes('APPROVER')) {
      return true;
    }

    return document.authorId === userId;
  },
  canSubmit(document: Document, userId: number, roles: string[]): boolean {
    return (
      roles.includes('AUTHOR') &&
      document.authorId === userId &&
      document.state === DocumentState.DRAFT
    );
  },
  canApproveOrReject(document: Document, roles: string[]): boolean {
    return roles.includes('APPROVER') && document.state === DocumentState.SUBMITTED;
  },
  isValidTransition(currentState: DocumentState, nextState: DocumentState): boolean {
    return transitionMap[currentState].includes(nextState);
  },
  async transition(document: Document, nextState: DocumentState) {
    if (!this.isValidTransition(document.state, nextState)) {
      return null;
    }

    return documentRepository.updateState(document.id, nextState);
  }
};
