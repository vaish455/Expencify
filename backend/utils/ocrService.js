import Tesseract from 'tesseract.js';

class OcrService {
  async processReceipt(imageBuffer) {
    try {
      const result = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: m => console.log(m)
      });

      const text = result.data.text;
      const extractedData = this.parseReceiptText(text);

      return {
        rawText: text,
        confidence: result.data.confidence,
        ...extractedData
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to process receipt');
    }
  }

  parseReceiptText(text) {
    const data = {
      merchantName: null,
      extractedAmount: null,
      extractedDate: null
    };

    // Extract merchant name (usually first line)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      data.merchantName = lines[0].trim();
    }

    // Extract amount (look for currency symbols and numbers)
    const amountRegex = /(?:[$€£¥]|USD|EUR|GBP|INR)\s*(\d+[.,]\d{2})/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      data.extractedAmount = parseFloat(amountMatch[1].replace(',', '.'));
    }

    // Extract date (various formats)
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      try {
        data.extractedDate = new Date(dateMatch[1]);
      } catch (e) {
        console.error('Date parsing error:', e);
      }
    }

    return data;
  }
}

export default new OcrService();
