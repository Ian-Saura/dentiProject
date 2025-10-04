from typing import Dict, Any, List

from fastapi import Response


def validate_pagination_params(limit: int = 50, offset: int = 0) -> Dict[str, int]:
    """Validate and normalize pagination parameters"""
    limit = min(max(1, limit), 10000)  # 1-10000 (increased for reports)
    offset = max(0, offset)
    return {"limit": limit, "offset": offset}


def create_paginated_response(data: List[Any], total: int) -> Dict[str, Any]:
    """Create paginated response with X-Total-Count in headers"""
    return {
        "data": data,
        "total": total,
        "headers": {"X-Total-Count": str(total)}
    }


def add_total_count_header(response: Response, total: int) -> Response:
    """Add X-Total-Count header to response"""
    response.headers["X-Total-Count"] = str(total)
    return response
