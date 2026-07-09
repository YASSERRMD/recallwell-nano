# Contributing to Recallwell Nano

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

```bash
git clone https://github.com/YASSERRMD/recallwell-nano.git
cd recallwell-nano
npm install
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format

# Type check
npx tsc --noEmit
```

## Branch Naming

Use descriptive branch names:

- `feat/add-new-feature`
- `fix/resolve-issue`
- `docs/update-readme`
- `refactor/improve-code`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting (no code change)
- `refactor` — Code restructuring
- `test` — Adding tests
- `chore` — Maintenance

Examples:
```
feat(chunk): add heading-aware splitting
fix(nano): handle session creation failure
docs: update browser requirements
test: add chunker unit tests
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- No `any` without documented justification
- Write tests for new features

## Pull Requests

1. Keep PRs focused on a single change
2. Write a clear description
3. Include screenshots for UI changes
4. Ensure all tests pass
5. Request a review

## Reporting Issues

Use GitHub Issues with:

- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
