import pdfplumber
from typing import List, Dict


def extract_text_with_pages(pdf_path: str) -> List[Dict]:
    """
    Extract text from a PDF file, preserving page numbers.

    Returns
    -------
    List of dicts with keys:
        page        : 1-indexed page number
        text        : extracted text for that page
        total_pages : total number of pages in the PDF
    """
    pages: List[Dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for page_num, page in enumerate(pdf.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                pages.append(
                    {
                        "page": page_num,
                        "text": text,
                        "total_pages": total,
                    }
                )
    return pages
