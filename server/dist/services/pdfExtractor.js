import pdf from 'pdf-parse';
export class PdfExtractorService {
    /**
     * Extracts raw text from a PDF file buffer.
     * @param buffer PDF file buffer from multer or local disk
     * @returns Promise resolving to extracted text
     */
    static async extractText(buffer) {
        try {
            const data = await pdf(buffer);
            if (!data.text || data.text.trim().length === 0) {
                throw new Error('No readable text found in PDF. Make sure it is not a scanned image.');
            }
            return data.text;
        }
        catch (error) {
            console.error('PDF Parsing Error:', error);
            throw new Error(`Failed to extract text from PDF: ${error.message || error}`);
        }
    }
}
