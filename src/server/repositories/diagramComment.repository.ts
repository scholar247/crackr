export { MongoDiagramCommentRepository as DiagramCommentRepository } from './mongo/diagramComment.repository';
import { MongoDiagramCommentRepository } from './mongo/diagramComment.repository';
export const diagramCommentRepository = new MongoDiagramCommentRepository();
