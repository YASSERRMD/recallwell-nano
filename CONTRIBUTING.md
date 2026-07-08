# Contributing to Recallwell Nano

## Git Identity

```bash
git config user.name "YASSERRMD"
git config user.email "arafath.yasser@gmail.com"
```

## Branching Strategy

- One branch per phase: `phase-XX-short-slug`
- Work on phase branch, then merge to main

## Merge Policy

**STRICT: No squash merges. Ever.**

Every merge into `main` must be a real merge (`git merge --no-ff`) or a fast-forward that preserves every individual commit. The full atomic commit history must be reflected in `main`.

```bash
# Correct merge
git checkout main
git merge --no-ff phase-XX-slug -m "merge(phase-XX): Phase Title"

# NEVER do this
git merge --squash phase-XX-slug
```

## Commit Policy

**Maximize atomicity.** Each commit equals one logical change:

- One file
- One function
- One config change
- One test
- One fix

### Commit Format

```
type(scope): summary
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `chore` - Maintenance
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code restructuring
- `style` - Formatting
- `build` - Build system
- `ci` - CI/CD

### Examples

```
feat(db): add Document table type
fix(chunk): handle empty heading path
test(parse): add PDF fixture
chore(lint): update eslint config
```

## Code Style

- TypeScript strict mode
- No em dash character anywhere
- Use "explore" or "investigate" instead of "experience"
- No `any` unless justified with comment

## Development Workflow

```bash
# Start development
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## Phase Workflow

```bash
# Create phase branch
git checkout main
git checkout -b phase-XX-slug

# Make atomic commits
git commit -m "feat(scope): description"
git commit -m "feat(scope): another change"

# Merge to main
git checkout main
git merge --no-ff phase-XX-slug -m "merge(phase-XX): Phase Title"

# Delete phase branch
git branch -d phase-XX-slug
```
