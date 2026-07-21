import os
import io
import json
import time
import uuid
import asyncio
import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from supabase import create_client, Client
from dotenv import load_dotenv

MODEL_NAME = "gemini-2.0-flash-lite"
MAX_RETRIES = 3

async def call_with_retry(client, model, contents, config=None):
    """Call Gemini with exponential backoff on rate-limit (429) errors."""
    for attempt in range(MAX_RETRIES):
        try:
            kwargs = {"model": model, "contents": contents}
            if config:
                kwargs["config"] = config
            return client.models.generate_content(**kwargs)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = 40 * (attempt + 1)  # 40s, 80s, 120s
                print(f"[Backend] Rate limited. Waiting {wait_time}s before retry {attempt+2}/{MAX_RETRIES}...")
                await asyncio.sleep(wait_time)
            else:
                raise
    # Final attempt without catching
    kwargs = {"model": model, "contents": contents}
    if config:
        kwargs["config"] = config
    return client.models.generate_content(**kwargs)

# Load local environment file
load_dotenv()

app = FastAPI(title="Auto-Mod-AR Ingestion Pipeline")

# Enable CORS for your React Admin Panel connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase and Google Gen AI clients
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://piknvoejjwgbrgewifeq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_l_Ue_-YjL5kd9MgHeRRD9w_WEVkILIX")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

client_ai_1 = genai.Client(api_key=os.getenv("GEMINI_KEY_1"))
client_ai_2 = genai.Client(api_key=os.getenv("GEMINI_KEY_2"))

def clean_and_parse_json(raw_text: str) -> dict:
    """Strip markdown fences and parse raw JSON text."""
    clean_str = raw_text.strip()
    if clean_str.startswith("```json"):
        clean_str = clean_str[7:]
        if clean_str.endswith("```"):
            clean_str = clean_str[:-3]
    elif clean_str.startswith("```"):
        clean_str = clean_str[3:]
        if clean_str.endswith("```"):
            clean_str = clean_str[:-3]
    clean_str = clean_str.strip()
    return json.loads(clean_str)


async def invoke_edge_function(books, chapters, subtopics, questions):
    """Send mapped data to Supabase Edge Function for database insertion."""
    payload = {
        "books": books,
        "chapters": chapters,
        "subtopics": subtopics,
        "questions": questions
    }
    url = f"{SUPABASE_URL}/functions/v1/ingest-book"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()


@app.post("/api/ingest-pdf")
async def ingest_pdf(
    title: str = Form(...),
    file: UploadFile = File(...)
):
    if not (file.filename.endswith('.pdf') or file.filename.endswith('.txt')):
        raise HTTPException(status_code=400, detail="Please upload a valid PDF or TXT file.")

    try:
        file_bytes = await file.read()
        is_txt = file.filename.endswith('.txt')
        book_id = f"book_{uuid.uuid4().hex[:7]}"

        print(f"[Backend] Received '{file.filename}' ({len(file_bytes)} bytes). Starting pipeline...")

        # =====================================================================
        # STEP 1 - GEMINI API #1: Document & Visual Understanding → Markdown
        # =====================================================================
        if is_txt:
            # TXT files are already text — no visual analysis needed
            markdown_content = file_bytes.decode("utf-8", errors="ignore")
            print("[Backend] TXT file detected. Skipping visual analysis pass.")
        else:
            print("[Backend] PDF received. Uploading to Gemini Multimodal File API...")

            # Upload the raw PDF so Gemini can "see" images, signs, diagrams
            uploaded_file = client_ai_1.files.upload(
                file=io.BytesIO(file_bytes),
                config=types.UploadFileConfig(mime_type="application/pdf")
            )

            prompt_1 = (
                "Extract all information from this document. "
                "Describe all images, diagrams, road signs (especially Japanese traffic signs like 止まれ), "
                "tables, and illustrations in detail. "
                "Return the final output as clean, comprehensive Markdown text."
            )

            response_1 = await call_with_retry(
                client_ai_1,
                model=MODEL_NAME,
                contents=[uploaded_file, prompt_1]
            )

            markdown_content = response_1.text
            print("[Backend] Pass 1 complete. Visual elements converted to Markdown text.")

            # Clean up the file from Google's staging storage
            try:
                client_ai_1.files.delete(name=uploaded_file.name)
            except Exception:
                pass  # Non-critical cleanup

        # Optional: Save raw markdown to database for debugging
        try:
            supabase.table("raw_handbooks").insert({
                "markdown_payload": markdown_content
            }).execute()
        except Exception as db_err:
            print(f"[Backend Warning] Skipping raw_handbooks insert: {db_err}")

        # Cool down to avoid rate limits between separate API accounts
        await asyncio.sleep(5)

        # =====================================================================
        # STEP 2 - GEMINI API #2: Structured Content Generation → JSON
        # =====================================================================
        print("[Backend] Starting Pass 2: Generating localized curriculum, flashcards, and quizzes...")

        prompt_2 = f"""
        Using only the provided Markdown text, output a single structured JSON object containing localized text translations, flashcards, and quizzes.
        You must translate the primary handbook chapters into 4 language keys: 'en', 'ja', 'zh', and 'pt'.
        Generate exactly 8 multilingual multiple choice questions (MCQs) and 5 flashcards from the text block.
        
        Your response must be structured strictly as a JSON object matching this schema:
        {{
            "chapters": [
                {{
                    "title": {{"en": "", "ja": "", "zh": "", "pt": ""}},
                    "description": {{"en": "", "ja": "", "zh": "", "pt": ""}}
                }}
            ],
            "flashcards": [
                {{
                    "front": {{"en": "", "ja": "", "zh": "", "pt": ""}},
                    "back": {{"en": "", "ja": "", "zh": "", "pt": ""}}
                }}
            ],
            "questions": [
                {{
                    "question": {{"en": "", "ja": "", "zh": "", "pt": ""}},
                    "options": [{{"en": "", "ja": "", "zh": "", "pt": ""}}],
                    "correctOptionIndex": 0,
                    "explanation": {{"en": "", "ja": "", "zh": "", "pt": ""}}
                }}
            ]
        }}
        
        Do not include any markdown fences, text headers, or conversational text.
        Source Material:
        {markdown_content}
        """

        response_2 = await call_with_retry(
            client_ai_2,
            model=MODEL_NAME,
            contents=prompt_2,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        structured_data = response_2.text
        print("[Backend] Pass 2 complete. Parsing and mapping finalized JSON...")

        # Optional: Save structured JSON to database for debugging
        try:
            supabase.table("finalized_curriculums").insert({
                "data": structured_data
            }).execute()
        except Exception as db_err:
            print(f"[Backend Warning] Skipping finalized_curriculums insert: {db_err}")

        # =====================================================================
        # STEP 3 - Map JSON to Supabase Schema & Dispatch via Edge Function
        # =====================================================================
        curriculum = clean_and_parse_json(structured_data)

        # 1. Map Book
        books_payload = [{
            "id": book_id,
            "title": {"en": title, "ja": title, "zh": title, "pt": title},
            "description": {
                "en": f"Study guide for {title}",
                "ja": f"{title}の学習ガイド",
                "zh": f"{title}的学习指南",
                "pt": f"Guia de estudo para {title}"
            },
            "icon": "car-sport-outline"
        }]

        # 2. Map Chapters & Subtopics
        chapters_payload = []
        subtopics_payload = []
        for ch_idx, ch in enumerate(curriculum.get("chapters", [])):
            chapter_id = f"ch_{int(time.time())}_{ch_idx}"
            chapters_payload.append({
                "id": chapter_id,
                "book_id": book_id,
                "title": ch.get("title", {"en": f"Chapter {ch_idx+1}", "ja": "", "zh": "", "pt": ""}),
                "order_num": ch_idx + 1
            })
            subtopics_payload.append({
                "id": f"sub_{int(time.time())}_{ch_idx}",
                "chapter_id": chapter_id,
                "title": ch.get("title", {"en": f"Chapter {ch_idx+1}", "ja": "", "zh": "", "pt": ""}),
                "content": ch.get("description", {"en": "", "ja": "", "zh": "", "pt": ""}),
                "order_num": 1
            })

        # 3. Map Questions
        questions_payload = []
        for q_idx, q in enumerate(curriculum.get("questions", [])):
            question_id = f"q_{int(time.time())}_{q_idx}"
            options_raw = q.get("options", [])
            correct_idx = q.get("correctOptionIndex", 0)
            options_mapped = []
            for o_idx, opt in enumerate(options_raw):
                options_mapped.append({
                    "text": opt,
                    "isCorrect": o_idx == correct_idx
                })

            questions_payload.append({
                "id": question_id,
                "book_id": book_id,
                "category": "Rules of the Road",
                "difficulty": "medium",
                "text": q.get("question", {"en": "", "ja": "", "zh": "", "pt": ""}),
                "options": options_mapped,
                "explanation": q.get("explanation", {"en": "", "ja": "", "zh": "", "pt": ""})
            })

        # Dispatch to Supabase Edge Function
        print(f"[Backend] Dispatching mapped data to Supabase edge function...")
        await invoke_edge_function(books_payload, chapters_payload, subtopics_payload, questions_payload)
        print(f"[Backend] ✅ Successfully processed and inserted all data!")

        return {
            "status": "success",
            "message": "Handbook fully compiled and loaded into user systems.",
            "bookId": book_id,
            "title": title,
            "chaptersCount": len(chapters_payload),
            "questionsCount": len(questions_payload)
        }

    except Exception as e:
        print(f"[Backend Error] Ingestion halted: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
