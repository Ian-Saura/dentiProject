# Backend Tests

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app tests/

# Run in verbose mode
pytest -v
```

## Test Structure

- `test_auth.py` - Authentication tests (login, register, Google OAuth)
- More test files to be added...

## Adding New Tests

1. Create a new test file: `test_<feature>.py`
2. Import necessary fixtures and utilities
3. Write test classes and methods following the pattern in `test_auth.py`
4. Run tests to ensure they pass

## CI/CD Integration

These tests should be run before every deployment to catch issues early.

## Current Coverage

- [x] User Registration
- [x] User Login
- [x] Google OAuth endpoint validation
- [x] Health check
- [ ] Password reset flow
- [ ] Admin endpoints
- [ ] CRUD operations (Patients, Appointments, etc.)



