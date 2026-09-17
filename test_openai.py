import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ API key not found")
    exit()

client = OpenAI(api_key=api_key)

response = client.responses.create(
    model="gpt-5.6-luna",
    input="Reply with exactly: Hire Genius AI connected successfully."
)

print(response.output_text)