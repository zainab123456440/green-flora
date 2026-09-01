"""
crop_doctor_service.py

Business logic for the Crop Doctor feature.

Responsibilities:
  1. Send the uploaded image to Gemini for structured crop diagnosis.
  2. Query `agricultural_products` in Supabase for matching products.
  3. Apply the farmer's budget to filter/rank recommendations.
  4. Provide low-cost fallback actions when no paid option fits.

The Gemini API key is read from `settings.gemini_api_key` — never
exposed to the frontend.
"""

import base64
import json
import logging
import re
from typing import Optional

import google.generativeai as genai

from config.settings import settings
from config.supabase_client import supabase
from schemas.crop_doctor import (
    Diagnosis,
    ProblemType,
    Severity,
    ProductRecommendation,
    BudgetContext,
    LowCostAction,
    CropDoctorResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini prompt — asks for a strict JSON response so we can parse reliably
# ---------------------------------------------------------------------------

_GEMINI_SYSTEM_PROMPT = """\
You are an agricultural crop-health analyst specialising in crops grown
in Pakistan. When given a photograph of a crop or plant, analyse it and
return a single JSON object (no markdown fences) with exactly these keys:

{
  "crop": "<detected crop name, e.g. Wheat, Rice, Tomato>",
  "problem": "<short name of the problem, e.g. Leaf Blight, Aphid Infestation>",
  "problem_type": "<one of: Disease, Pest/Insect, Nutrient Deficiency, Weed, Environmental/Physical Stress, Unknown>",
  "confidence": <number 0-100>,
  "severity": "<one of: Low, Moderate, High, Unknown>",
  "symptoms": "<2-3 sentence farmer-friendly description of what is visible>",
  "explanation": "<1-2 sentence explanation of the likely cause>"
}

Rules:
- If the image is unclear or not a crop/plant, set "confidence" below 30
  and explain the issue in "symptoms".
- Do NOT invent product names or prices.
- Keep "symptoms" and "explanation" simple enough for a farmer with
  basic education to understand.
- problem_type must be exactly one of the listed values.
"""


# ---------------------------------------------------------------------------
# Category mapping: problem_type → preferred product categories
# ---------------------------------------------------------------------------

_PROBLEM_TYPE_CATEGORY_MAP: dict[str, list[str]] = {
    ProblemType.DISEASE.value: ["Fungicide"],
    ProblemType.PEST_INSECT.value: ["Insecticide"],
    ProblemType.NUTRIENT_DEFICIENCY.value: ["Fertilizer", "Tonics"],
    ProblemType.WEED.value: ["Weedicide"],
    ProblemType.ENVIRONMENTAL_STRESS.value: ["Tonics", "Fertilizer"],
    ProblemType.UNKNOWN.value: [],
}


# ---------------------------------------------------------------------------
# Low-cost fallback actions by problem type (safe, generic guidance)
# ---------------------------------------------------------------------------

_LOW_COST_ACTIONS: dict[str, list[str]] = {
    ProblemType.DISEASE.value: [
        "Remove and destroy affected leaves or plants to prevent spread.",
        "Improve air circulation by spacing plants further apart.",
        "Avoid overhead watering — water at the base of plants.",
    ],
    ProblemType.PEST_INSECT.value: [
        "Hand-pick visible insects early in the morning when they are slow.",
        "Spray affected areas with a strong jet of water to dislodge small pests.",
        "Use yellow sticky traps near the crop to monitor insect activity.",
    ],
    ProblemType.NUTRIENT_DEFICIENCY.value: [
        "Add well-decomposed farmyard manure or compost to the soil.",
        "Apply a balanced NPK fertiliser in small quantities if available.",
        "Rotate crops next season to restore soil nutrients naturally.",
    ],
    ProblemType.WEED.value: [
        "Hand-weed the affected area regularly, especially before weeds flower.",
        "Apply a thick layer of organic mulch to suppress weed growth.",
        "Use a hoe or hand tool to uproot weeds at the root level.",
    ],
    ProblemType.ENVIRONMENTAL_STRESS.value: [
        "Provide temporary shade during peak afternoon heat if possible.",
        "Increase irrigation frequency during hot, dry periods.",
        "Apply organic mulch to retain soil moisture and moderate soil temperature.",
    ],
    ProblemType.UNKNOWN.value: [
        "Upload a clearer, well-lit photo of the affected plant for better analysis.",
        "Consult your local agricultural extension office for an in-person inspection.",
    ],
}


class CropDoctorService:
    """Orchestrates image analysis and product recommendation."""

    def __init__(self) -> None:
        # Initialise Gemini client once at service level.
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel("gemini-3.6-flash")

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def analyse(
        self,
        image_bytes: bytes,
        mime_type: str,
        farmer_budget: Optional[float],
    ) -> CropDoctorResponse:
        """
        Analyse an image and return a full CropDoctorResponse.

        * `image_bytes`: raw image data (JPEG/PNG/WebP).
        * `mime_type`: official MIME type from the upload.
        * `farmer_budget`: budget_pkr from the farmer profile (may be None).
        """
        # 1. Gemini diagnosis
        diagnosis = self._call_gemini(image_bytes, mime_type)

        # 2. Product matching
        budget_pkr = farmer_budget if farmer_budget is not None else 0.0
        products = self._find_matching_products(diagnosis, budget_pkr)

        # 3. Budget context
        within_budget = any(p.fits_budget for p in products)
        budget_ctx = BudgetContext(budget_pkr=budget_pkr, within_budget=within_budget)

        # 4. Low-cost fallback
        low_cost: list[LowCostAction] = []
        if not products or not within_budget:
            low_cost = self._get_low_cost_actions(diagnosis.problem_type)

        return CropDoctorResponse(
            diagnosis=diagnosis,
            products=products,
            budget=budget_ctx,
            low_cost_actions=low_cost,
        )

    # ------------------------------------------------------------------
    # Gemini
    # ------------------------------------------------------------------

    def _call_gemini(self, image_bytes: bytes, mime_type: str) -> Diagnosis:
        """Send image to Gemini and parse the structured JSON response."""
        if not settings.gemini_api_key:
            raise RuntimeError(
                "Crop Doctor is not configured. "
                "Set GEMINI_API_KEY in the backend environment."
            )

        image_part = {
            "mime_type": mime_type,
            "data": base64.b64encode(image_bytes).decode("utf-8"),
        }

        try:
            response = self._model.generate_content(
                [
                    {"role": "user", "parts": [
                        {"text": _GEMINI_SYSTEM_PROMPT},
                        {"inline_data": image_part},
                    ]}
                ],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    response_mime_type="application/json",
                ),
            )

            raw_text = response.text.strip()
            return self._parse_gemini_response(raw_text)

        except Exception as exc:
            logger.exception("Gemini API call failed")
            raise RuntimeError(
                "Image analysis failed. Please try again with a clearer photo."
            ) from exc

    @staticmethod
    def _parse_gemini_response(raw: str) -> Diagnosis:
        """
        Parse Gemini's JSON output into a Diagnosis object.

        Falls back to a low-confidence "Unknown" diagnosis if parsing fails,
        rather than raising — so the farmer always gets a response.
        """
        # Strip markdown code fences if present
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning("Gemini returned non-JSON response: %s", raw[:200])
            return Diagnosis(
                crop="Unknown",
                problem="Unable to analyse",
                problem_type=ProblemType.UNKNOWN,
                confidence=0,
                severity=Severity.UNKNOWN,
                symptoms=(
                    "The image could not be analysed clearly. "
                    "Please upload a well-lit, close-up photo of the affected plant."
                ),
                explanation="The AI could not identify a clear problem from this image.",
            )

        # Validate problem_type
        raw_type = data.get("problem_type", "Unknown")
        try:
            problem_type = ProblemType(raw_type)
        except ValueError:
            problem_type = ProblemType.UNKNOWN

        # Validate severity
        raw_sev = data.get("severity", "Unknown")
        try:
            severity = Severity(raw_sev)
        except ValueError:
            severity = Severity.UNKNOWN

        return Diagnosis(
            crop=str(data.get("crop", "Unknown")),
            problem=str(data.get("problem", "Unknown")),
            problem_type=problem_type,
            confidence=float(data.get("confidence", 0)),
            severity=severity,
            symptoms=str(data.get("symptoms", "")),
            explanation=str(data.get("explanation", "")),
        )

    # ------------------------------------------------------------------
    # Product matching
    # ------------------------------------------------------------------

    def _find_matching_products(
        self,
        diagnosis: Diagnosis,
        budget_pkr: float,
    ) -> list[ProductRecommendation]:
        """
        Query `agricultural_products` and return the best 1–3 matches.

        Matching strategy:
          1. Filter by category (mapped from problem_type).
          2. Text-match on `local_problem_target` and `scientific_target_action`
             using keywords extracted from the diagnosis.
          3. Score and sort by relevance.
          4. Mark whether each product fits the farmer's budget.
          5. Return top results (up to 3).
        """
        if supabase is None:
            logger.warning("Supabase not configured — skipping product lookup.")
            return []

        categories = _PROBLEM_TYPE_CATEGORY_MAP.get(
            diagnosis.problem_type.value, []
        )
        if not categories:
            return []

        # Fetch all products in the relevant categories
        products_data = self._fetch_products_by_categories(categories)
        if not products_data:
            return []

        # Extract keywords for scoring
        keywords = self._extract_keywords(diagnosis)

        # Score each product
        scored: list[tuple[float, dict]] = []
        for p in products_data:
            score = self._score_product(p, keywords, diagnosis)
            if score > 0:
                scored.append((score, p))

        # Sort by score descending, take top 3
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:3]

        # Build recommendations
        results: list[ProductRecommendation] = []
        for _score, p in top:
            price_mid = self._safe_float(p.get("price_midpoint_pkr"))
            approx = self._safe_float(p.get("approx_price_pkr"))
            effective_price = price_mid or approx or 0.0

            fits = (
                budget_pkr == 0 and effective_price == 0
            ) or (budget_pkr > 0 and effective_price <= budget_pkr)

            # When budget is zero, don't include paid products
            if budget_pkr <= 0 and effective_price > 0:
                continue

            results.append(ProductRecommendation(
                id=str(p.get("id", "")),
                category=str(p.get("category", "")),
                local_problem_target=p.get("local_problem_target"),
                scientific_target_action=p.get("scientific_target_action"),
                best_local_brand=str(p.get("best_local_brand", "")),
                company=p.get("company"),
                formulation_active_ingredient=p.get("formulation_active_ingredient"),
                dosage_per_acre=p.get("dosage_per_acre"),
                approx_price_pkr=approx,
                min_price_pkr=self._safe_float(p.get("min_price_pkr")),
                max_price_pkr=self._safe_float(p.get("max_price_pkr")),
                fits_budget=fits,
            ))

        return results

    def _fetch_products_by_categories(
        self, categories: list[str]
    ) -> list[dict]:
        """Load all products matching the given categories from Supabase."""
        try:
            result = (
                supabase.table("agricultural_products")
                .select("*")
                .in_("category", categories)
                .execute()
            )
            return result.data or []
        except Exception as exc:
            logger.warning("Failed to query agricultural_products: %s", exc)
            return []

    @staticmethod
    def _extract_keywords(diagnosis: Diagnosis) -> list[str]:
        """
        Extract normalised keywords from the diagnosis for text matching.

        Pulls words from the problem name and problem_type, filtering out
        very short or generic words.
        """
        raw = f"{diagnosis.problem} {diagnosis.problem_type.value}"
        tokens = re.findall(r"[a-zA-Z]+", raw.lower())
        stopwords = {"the", "and", "of", "in", "a", "an", "is", "to", "or"}
        return [t for t in tokens if len(t) > 2 and t not in stopwords]

    @staticmethod
    def _score_product(
        product: dict, keywords: list[str], diagnosis: Diagnosis
    ) -> float:
        """
        Score a product against the diagnosis keywords.

        Returns a float >= 0. Higher is better. Products with score 0
        are excluded from the final results.
        """
        text_fields = " ".join(
            filter(None, [
                str(product.get("local_problem_target", "")),
                str(product.get("scientific_target_action", "")),
                str(product.get("category", "")),
            ])
        ).lower()

        score = 0.0
        for kw in keywords:
            if kw in text_fields:
                score += 1.0

        # Boost products whose target matches the problem name more directly
        problem_lower = diagnosis.problem.lower()
        target_lower = str(product.get("local_problem_target", "")).lower()
        if problem_lower and target_lower:
            # Check for substring overlap
            problem_words = set(re.findall(r"[a-zA-Z]+", problem_lower))
            target_words = set(re.findall(r"[a-zA-Z]+", target_lower))
            overlap = problem_words & target_words - {"the", "and", "of", "in"}
            score += len(overlap) * 0.5

        return score

    # ------------------------------------------------------------------
    # Low-cost actions
    # ------------------------------------------------------------------

    @staticmethod
    def _get_low_cost_actions(problem_type: ProblemType) -> list[LowCostAction]:
        """Return safe, generic low-cost actions for the given problem type."""
        actions = _LOW_COST_ACTIONS.get(
            problem_type.value,
            _LOW_COST_ACTIONS[ProblemType.UNKNOWN.value],
        )
        return [LowCostAction(action=a) for a in actions]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _safe_float(val) -> Optional[float]:
        """Convert a value to float or return None."""
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None


# Single shared instance.
crop_doctor_service = CropDoctorService()
