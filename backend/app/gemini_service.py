import json
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()


class ArtworkAnalysisResult(BaseModel):
    summary: str = Field(description="Concise human-readable summary of the artwork's visual content.")
    visual_description: str = Field(description="Description of subject matter, colors, and artistic style.")
    distinctive_elements: list[str] = Field(description="List of key distinctive visual features, patterns, or details.")


class ArtworkComparisonResult(BaseModel):
    summary: str = Field(description="Concise summary of the visual comparison between original and candidate.")
    similarities: list[str] = Field(description="Observable visual similarities between the two images.")
    differences: list[str] = Field(description="Observable visual differences between the two images.")
    possible_modifications: list[str] = Field(
        description="Visible alterations such as cropping, recoloring, filters, added text, or composition changes."
    )


def get_genai_client() -> genai.Client:
    """Initialize and return Gemini Client using GEMINI_API_KEY environment variable."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() in ("", "your_gemini_api_key_here"):
        raise ValueError(
            "GEMINI_API_KEY is not configured. Please set a valid GEMINI_API_KEY in environment or .env file."
        )
    return genai.Client(api_key=api_key.strip())


def analyze_artwork_image(image_bytes: bytes, mime_type: str = "image/png") -> dict:
    """
    Use Gemini API to describe visual content and distinctive elements of an artwork.
    Does NOT make legal conclusions regarding copyright or ownership.
    """
    client = get_genai_client()

    prompt = (
        "Analyze the visual content of this artwork. Describe its subject matter, artistic style, "
        "and distinctive visual elements (colors, patterns, composition, key details). "
        "Do NOT make any legal claims or conclusions regarding copyright or ownership. "
        "Focus purely on observable visual characteristics."
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type or "image/png")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ArtworkAnalysisResult,
                temperature=0.2,
            ),
        )

        if response.text:
            return json.loads(response.text)
        else:
            raise RuntimeError("Gemini API returned an empty response.")
    except json.JSONDecodeError:
        return {
            "summary": "Visual analysis completed.",
            "visual_description": response.text or "No text provided.",
            "distinctive_elements": []
        }
    except Exception as e:
        err_msg = str(e)
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key and api_key in err_msg:
            err_msg = err_msg.replace(api_key, "[REDACTED]")
        raise RuntimeError(f"Gemini API request failed: {err_msg}")


def compare_artwork_images(
    original_bytes: bytes,
    original_mime: str,
    candidate_bytes: bytes,
    candidate_mime: str
) -> dict:
    """
    Use Gemini API to compare an original artwork with a candidate artwork.
    Identifies visual similarities, differences, and visible modifications (cropping, recoloring, filters, etc.).
    Does NOT make legal conclusions regarding copyright infringement.
    """
    client = get_genai_client()

    prompt = (
        "You are comparing two images: Image 1 is the Original Artwork, and Image 2 is a Candidate/Suspected Artwork. "
        "Analyze and compare their visual characteristics. Identify: "
        "1. Observable visual similarities. "
        "2. Observable visual differences. "
        "3. Any visible modifications (such as cropping, recoloring, filters, added text, resolution changes, or composition shifts). "
        "4. A concise summary of the visual comparison. "
        "Do NOT make legal conclusions such as 'this artwork is stolen' or 'this proves copyright infringement'. "
        "Focus strictly on objective visual analysis."
    )

    orig_part = types.Part.from_bytes(data=original_bytes, mime_type=original_mime or "image/png")
    cand_part = types.Part.from_bytes(data=candidate_bytes, mime_type=candidate_mime or "image/png")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=["Image 1 (Original Artwork):", orig_part, "Image 2 (Candidate Artwork):", cand_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ArtworkComparisonResult,
                temperature=0.2,
            ),
        )

        if response.text:
            return json.loads(response.text)
        else:
            raise RuntimeError("Gemini API returned an empty response.")
    except json.JSONDecodeError:
        return {
            "summary": response.text or "Comparison completed.",
            "similarities": [],
            "differences": [],
            "possible_modifications": []
        }
    except Exception as e:
        err_msg = str(e)
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key and api_key in err_msg:
            err_msg = err_msg.replace(api_key, "[REDACTED]")
        raise RuntimeError(f"Gemini API comparison failed: {err_msg}")
