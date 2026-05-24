import os
import cv2
import subprocess
import numpy as np
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
import re
load_dotenv()





class LineItem(BaseModel):
    id: str
    item_name: str
    price: float

class ReceiptData(BaseModel):
    id: str
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



client = genai.Client()

def parse_receipt_text(image: str) -> ReceiptData:
    prompt = (
        "You are a receipt parser. Look at the receipt image and extract data exactly as printed.\n"
        "- merchant_name: full name including location suffix (e.g. 'Dumpling District - College Park')\n"
        "- date: receipt format is M/DD/YY → convert to YYYY-MM-DD (e.g. '5/22/26' → '2026-05-22')\n"
        "- total_amount: the 'Total' line only, not subtotal\n"
        "- items: every line item in exact printed word order\n"
        "Return ONLY raw JSON. No markdown."
    )
    

    response = client.models.generate_content(
        model="gemma-4-31b-it",
        contents=[
            prompt,
            types.Part.from_bytes(
                data=open(image, "rb").read(),
                mime_type="image/jpeg"
            )
        ],
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
    imgname = os.path.basename(image)
    with open("../jsons/" + imgname + ".json","w") as f:
        f.write(result_text)
       
    return result


def main():
    # Example target image
    target_image = "../images/tjmaxx.jpg"
    if os.path.exists(target_image):
        parse_receipt_text(target_image)
    else:
        print(f"Could not find image at {target_image}")




if __name__ == "__main__":
    main()