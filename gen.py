import os
from dotenv import load_dotenv
from google import genai
from google import genai


load_dotenv()
# Initialize the client with your API key
client = genai.Client() 



# Generate text response
response = client.models.generate_content(
    model="gemini-2.5-flash", 
    contents="Explain how quantum entanglement works to a five-year-old."
)

print(response.text)