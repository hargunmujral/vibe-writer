import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

try:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

def request_llm(user_prompt: str, model: str = "llama-3.3-70b-versatile", max_tokens: int = 100, temperature: float = 0.7, system_prompt: str=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.choices[0].message.content.strip()