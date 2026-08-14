import { GoogleGenerativeAI } from '@google/generative-ai';

// --- MVP Vector Store en Memoria ---
// En producción, esto sería Pinecone, Qdrant, o pgvector
interface VectorDocument {
    workspaceId: string;
    text: string;
    embedding: number[];
}

const memoryVectorStore: VectorDocument[] = [];

// Helper matemático: Similitud del Coseno
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class RagService {
    private genAI: GoogleGenerativeAI;
    
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Genera un embedding vectorial a partir de un texto
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }

    /**
     * Ingesta: Corta un documento en fragmentos y los guarda en la base vectorial
     */
    async ingestDocument(workspaceId: string, fullText: string): Promise<number> {
        // Chunking super básico (por párrafos o saltos de línea dobles)
        const chunks = fullText.split('\n\n').filter(chunk => chunk.trim().length > 10);
        let chunksProcessed = 0;

        for (const chunk of chunks) {
            try {
                const embedding = await this.generateEmbedding(chunk);
                memoryVectorStore.push({
                    workspaceId,
                    text: chunk.trim(),
                    embedding
                });
                chunksProcessed++;
            } catch (err) {
                console.error('[RAG] Error generando embedding para chunk:', err);
            }
        }

        console.log(`[RAG] Ingestados ${chunksProcessed} chunks para workspace ${workspaceId}`);
        return chunksProcessed;
    }

    /**
     * Retrieval: Busca los fragmentos más relevantes para una consulta
     */
    async searchContext(workspaceId: string, query: string, limit: number = 3): Promise<string[]> {
        // Filtrar documentos solo de este tenant (Aislamiento Crítico)
        const tenantDocs = memoryVectorStore.filter(doc => doc.workspaceId === workspaceId);
        
        if (tenantDocs.length === 0) return [];

        try {
            // Generar vector para la pregunta del usuario
            const queryEmbedding = await this.generateEmbedding(query);

            // Calcular similitud contra todos los chunks del tenant
            const scoredDocs = tenantDocs.map(doc => ({
                text: doc.text,
                score: cosineSimilarity(queryEmbedding, doc.embedding)
            }));

            // Ordenar de mayor a menor similitud y tomar el Top K
            scoredDocs.sort((a, b) => b.score - a.score);
            const topMatches = scoredDocs.slice(0, limit);

            // Devolvemos solo los textos que tengan un score mínimamente decente (ej. > 0.5)
            // Para el MVP los devolvemos todos los del top K
            return topMatches.map(match => match.text);
            
        } catch (err) {
            console.error('[RAG] Error en searchContext:', err);
            return [];
        }
    }
}
