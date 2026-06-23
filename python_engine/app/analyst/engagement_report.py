from __future__ import annotations


def build_engagement_report(payload: dict) -> dict:
    section = payload.get("section") or "cover"
    client = payload.get("client") or {}
    financials = payload.get("financials") or {}
    memo = payload.get("memo") or ""

    company = client.get("companyName") or "Client"
    sections = {
        "cover": {
            "title": "Financial Analysis Report",
            "subtitle": company,
            "consultant": client.get("consultantName") or "BMS Consultant",
            "date": payload.get("reportDate"),
        },
        "intro": {
            "headline": f"Engagement Overview — {company}",
            "body": f"This report summarizes the financial position and improvement opportunities for {company}.",
        },
        "business-impact": {
            "headline": "Business Impact Summary",
            "kpis": financials.get("kpis") or [],
            "insights": financials.get("insights") or [],
        },
        "mgmt-memo": {
            "headline": "Management Memo",
            "memo": memo or f"Preliminary findings for {company} are attached in the executive analysis dashboard.",
        },
        "line-graphs": {
            "headline": "P&L Trend",
            "series": financials.get("plTrend") or [],
        },
        "owner-return-line-graphs": {
            "headline": "Owner Return Projection",
            "series": financials.get("projectionYears") or [],
        },
        "roi-indirect-slide-1": {
            "headline": "Indirect ROI — Overview",
            "bullets": financials.get("indirectRoiBullets") or ["Indirect expense baseline from latest misc indirect run."],
        },
        "roi-indirect-slide-2": {
            "headline": "Indirect ROI — Labor & Operations",
            "bullets": financials.get("indirectRoiLabor") or [],
        },
        "roi-indirect-slide-3": {
            "headline": "Indirect ROI — G&A Impact",
            "bullets": financials.get("indirectRoiGa") or [],
        },
        "roi-indirect-slide-4": {
            "headline": "Indirect ROI — Recommendations",
            "bullets": financials.get("indirectRoiActions") or [],
        },
    }

    content = sections.get(section, {"headline": section, "body": "Section content pending."})
    return {"section": section, "companyName": company, "content": content}
