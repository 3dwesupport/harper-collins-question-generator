import { GlobalWorkerOptions } from 'pdfjs-dist';
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';


/**
 * Extracts text content from a PDF file.
 * 
 * @param {File} file - The PDF file to extract text from.
 * @returns {Promise<string>} A promise that resolves with the extracted text content.
  
 */
export const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // // Convert the loaded file content into a Uint8Array
        const typedArray = new Uint8Array(reader.result);

        // Load the PDF document using pdfjsLib
        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        let textContent = '';
        let rawTextContent = '';

        // Iterate through each page of the PDF
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);

          // Extract text content from the page
          const textContentItems = await page.getTextContent();
          textContent = textContentItems.items.map(item => item.str).join(' ');

          // Append page text to the raw text content
          rawTextContent += `${textContent}\n\n`;
        }
        // Resolve with the accumulated raw text content
        resolve(rawTextContent);
      } catch (error) {
        // Reject with any errors encountered during PDF processing
        reject(error);
      }
    };

    // Handle FileReader errors
    reader.onerror = (error) => {
      reject(error);
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  });


};


