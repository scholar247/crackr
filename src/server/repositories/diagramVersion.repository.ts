export { MongoDiagramVersionRepository as DiagramVersionRepository } from './mongo/diagramVersion.repository';
import { MongoDiagramVersionRepository } from './mongo/diagramVersion.repository';
export const diagramVersionRepository = new MongoDiagramVersionRepository();
