from __future__ import annotations

LIKERT_WEIGHTS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5}


def score_matrix_responses(payload: dict) -> dict:
    matrix_key = payload.get("matrixKey") or "generic"
    questions = payload.get("questions") or []
    responses = payload.get("responses") or {}

    scored_rows = []
    total_score = 0
    max_score = 0

    for question in questions:
        qid = question.get("id")
        weight = float(question.get("weight") or 1)
        raw = responses.get(qid)
        try:
            rating = int(raw)
        except (TypeError, ValueError):
            rating = 0
        points = LIKERT_WEIGHTS.get(rating, 0) * weight
        max_points = 5 * weight
        total_score += points
        max_score += max_points
        scored_rows.append(
            {
                "id": qid,
                "label": question.get("label"),
                "category": question.get("category"),
                "rating": rating if rating else None,
                "points": round(points, 2),
                "maxPoints": round(max_points, 2),
            }
        )

    pct = round((total_score / max_score) * 100, 1) if max_score else 0
    categories: dict[str, dict] = {}
    for row in scored_rows:
        cat = row.get("category") or "General"
        bucket = categories.setdefault(cat, {"points": 0.0, "maxPoints": 0.0, "count": 0})
        bucket["points"] += row["points"]
        bucket["maxPoints"] += row["maxPoints"]
        bucket["count"] += 1

    category_scores = [
        {
            "category": cat,
            "scorePct": round((data["points"] / data["maxPoints"]) * 100, 1) if data["maxPoints"] else 0,
            "count": data["count"],
        }
        for cat, data in categories.items()
    ]

    tally_source = payload.get("sourceResponses") or []
    graph_bars = []
    if matrix_key == "emp-questionnaire-graph" and tally_source:
        for item in tally_source:
            graph_bars.append({"label": item.get("category"), "scorePct": item.get("scorePct", 0)})

    return {
        "matrixKey": matrix_key,
        "rows": scored_rows,
        "totalScore": round(total_score, 2),
        "maxScore": round(max_score, 2),
        "scorePct": pct,
        "categoryScores": category_scores,
        "graphBars": graph_bars,
        "warnings": [] if scored_rows else ["No responses scored."],
    }
