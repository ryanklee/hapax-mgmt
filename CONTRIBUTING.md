# Contributing

## Development Setup

```bash
# Install dependencies
uv sync

# Run the test suite
uv run pytest tests/ -q

# Run a specific test file
uv run pytest tests/test_management_prep.py -q
```

All tests are fully mocked -- no LLM calls, no network access, no running infrastructure required.

## Running Tests

```bash
# Full suite
uv run pytest tests/ -q

# With verbose output
uv run pytest tests/ -v

# Single test
uv run pytest tests/test_management_prep.py::test_person_prep -v
```

Tests use `unittest.mock` -- no pytest fixtures in conftest. Each test file is self-contained. `asyncio_mode = "auto"` is set in pytest config, so async tests work without the `@pytest.mark.asyncio` decorator.

## Code Style

### Python

- **Python 3.12+**, managed with `uv`. Never pip.
- **Type hints are mandatory.** All function signatures and return types must be annotated.
- **Pydantic models** for structured data. Use `output_type` (not `result_type`) and `result.output` (not `result.data`) with pydantic-ai.
- **Formatting and linting:** `ruff` for both formatting and linting. Configuration is in `ruff.toml`.
- **Type checking:** `pyright` in strict mode. Configuration is in `pyrightconfig.json`.

```bash
# Format
uv run ruff format .

# Lint
uv run ruff check .

# Type check
uv run pyright
```

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add coaching staleness collector
fix: correct nudge attention cap calculation
refactor: extract frontmatter parsing to shared module
test: add management_activity edge case coverage
docs: update operations manual with new agent flags
```

### Branch Workflow

1. Create a feature branch from `main`
2. Make changes, ensure tests pass
3. Open a pull request against `main`

## Safety Principle

**LLMs prepare, humans deliver.** The system aggregates signals and surfaces patterns for the operator. It must never:

- Generate feedback language or coaching recommendations about individual team members
- Draft language for people conversations
- Produce performance evaluations or ratings
- Suggest what the operator should say to someone

This is enforced by the `management_safety` constitutional axiom. Agents that process management data must include explicit boundary instructions in their system prompts.
