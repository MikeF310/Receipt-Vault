import os
import cv2
import pytesseract
import subprocess
import numpy as np
import paddle
from paddleocr import PaddleOCR
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
import re
load_dotenv()


# --- OPTIMIZATION STEP 1: Optimize PaddlePaddle CPU allocation flags ---
paddle.set_flags({
    "FLAGS_fraction_of_cpu_memory_to_use": 0.2,  # Limit CPU memory footprints
    "FLAGS_eager_delete_scope": True,             # Synchronously purge unused computational data
    "FLAGS_fast_eager_deletion_mode": True
})

def deskew(image):
    co_ords = np.column_stack(np.where(image > 0))
    angle = cv2.minAreaRect(co_ords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )
    return rotated

class LineItem(BaseModel):
    item_name: str
    price: float

class ReceiptData(BaseModel):
    merchant_name: str = Field(description="Name of the store")
    date: str = Field(description="YYYY-MM-DD format")
    total_amount: float
    items: List[LineItem]


def extract_json(text: str) -> str:
    # Strip code fences if present
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        return match.group(1).strip()
    
    # Fallback: find the outermost { } block
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end+1].strip()
    
    return text.strip()


def preprocess_image(image_path: str) -> str:
    """Upscale and enhance small/low-quality receipt images."""
    img = cv2.imread(image_path)
    h, w = img.shape[:2]

    # Upscale if either dimension is too small
    min_width = 1000
    if w < min_width:
        scale = min_width / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        print(f"Upscaled from {w}x{h} to {img.shape[1]}x{img.shape[0]}")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Sharpen
    kernel = np.array([[0, -1,  0],
                       [-1,  5, -1],
                       [0, -1,  0]])
    sharpened = cv2.filter2D(denoised, -1, kernel)


    # Save to temp file and return path
    base, ext = os.path.splitext(image_path)   # "./images/tjmaxx", ".jpg"
    temp_path = f"{base}_processed{ext}"        # "./images/tjmaxx_processed.jpg"

    cv2.imwrite(temp_path, sharpened)
    return temp_path



client = genai.Client()

def parse_receipt_text(ocr_raw_text: str, image: str) -> ReceiptData:
    prompt = (
    "You are a receipt parser. Extract ONLY data that actually appears in the receipt text below. "
    "For 'items', include EVERY individual line item with its price — "
    "do not merge or summarize them. Do not invent values. "
    "Return ONLY raw JSON, no markdown.\n\n"
    "RECEIPT TEXT:\n"
    f"{ocr_raw_text}"
)
    

    response = client.models.generate_content(
        model="gemma-4-31b-it",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ReceiptData,
            temperature=0.1
        ),
    )
    
    result = ReceiptData.model_validate_json(extract_json(response.text))
    result_text = result.model_dump_json(indent=2)
    print("\n--- Gemini Parsed JSON ---")
    print(result_text)
    with open("./jsons/" + image + ".json","w") as f:
        f.write(result_text)
       
    return result

# --- OPTIMIZATION STEP 2: Initialize model globally once ---
# This prevents reloading the model from scratch on subsequent runs.
print("Loading PaddleOCR models into memory... (This takes a few seconds on startup)")
ocr_engine = PaddleOCR(
    lang='en'
                      # Force CPU mode
)

def process_single_receipt(image_path: str, verbose = False):
    # --- OPTIMIZATION STEP 3: Switch to ocr_engine.ocr for standard parsing pipelines ---
    # .predict() triggers layout structure parsers which add heavy processing overhead.
    # .ocr() parses straight text bounding sequences.
    print("Parsing..")
    processed_path = None
    try:
        processed_path = preprocess_image(image_path)
        result = ocr_engine.predict(processed_path)

        text_lines = []
        
        # Standard ocr() format returns a list containing bounding box, text string, and accuracy confidence
        for page in result:
            for text in page.get("rec_texts",[]):
                text_lines.append(text)
                
        full_ocr_text = "\n".join(text_lines)
        
        if verbose:
            print("\n--- Extracted Raw Text ---")
            print(full_ocr_text)

        # Save raw text backup
        with open("paddleTest.txt", "w") as f:
            f.write(full_ocr_text)


        # Pass text directly to Gemini
        if full_ocr_text.strip():
            parse_receipt_text(full_ocr_text,os.path.basename(image_path))
            print("end")
        else:
            print("Error: No text was extracted by the OCR engine.")

    finally:
        if processed_path and os.path.exists(processed_path):
            os.remove(processed_path)
            print(f"Cleaned up {processed_path}")


def main():
    # Example target image
    target_image = "./images/receipt.jpg"
    print("Which image?")

    if os.path.exists(target_image):
        process_single_receipt(target_image)
    else:
        print(f"Could not find image at {target_image}")




if __name__ == "__main__":
    main()