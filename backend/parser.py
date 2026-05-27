import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
import re
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from scan import *
import tempfile


load_dotenv()



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Your frontend mapped port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_receipt(file: UploadFile = File(...)):

    
    #print(file)
    contents = await file.read()
    suffix = os.path.splitext(file.filename)[1]  
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        response = parse_receipt_text(tmp_path)
        #print(response)
        #insertReceipt(response,"")
        return response
    finally:
        os.unlink(tmp_path) 
    


#

@app.post("/api/save")
async def save_receipt(receipt: ReceiptData):

    #print(receipt)

    insertReceipt(receipt,"")
    return {"success":"ok"}
   