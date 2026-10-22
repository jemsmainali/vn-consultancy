def validation_errors_without_input(errors: list[dict]) -> list[dict]:
    """Return FastAPI validation errors without echoing submitted request values."""
    safe_errors = []
    for error in errors:
        safe_error = dict(error)
        safe_error.pop("input", None)
        safe_errors.append(safe_error)
    return safe_errors
