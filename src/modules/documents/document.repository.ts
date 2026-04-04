import { DocumentState } from '@prisma/client';
import { prisma } from '../../config/db';

export const documentRepository = {
  create(authorId: number, title: string, content: string) {
    return prisma.document.create({
      data: {
        authorId,
        title,
        content,
        state: DocumentState.DRAFT
      }
    });
  },
  findById(id: number) {
    return prisma.document.findUnique({
      where: { id }
    });
  },
  updateState(id: number, state: DocumentState) {
    return prisma.document.update({
      where: { id },
      data: { state }
    });
  }
};
