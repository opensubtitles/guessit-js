# Contributing to GuessIt JS

Thank you for your interest in contributing to GuessIt JS! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Check existing issues** first to avoid duplicates
2. **Use the issue template** when creating new issues
3. **Provide detailed information**:
   - GuessIt JS version
   - Node.js/browser version
   - Operating system
   - Example filename that fails
   - Expected vs actual results

### Suggesting Features

1. **Search existing feature requests** first
2. **Describe the use case** clearly
3. **Explain why it would be useful** for other users
4. **Consider implementation complexity**

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Ensure tests pass**: `npm test`
6. **Update documentation** if needed
7. **Commit with clear messages**
8. **Push to your fork**
9. **Create a Pull Request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 14+ (tested on 14.x, 16.x, 18.x, 20.x, 21.x; latest LTS recommended)
- Git
- Text editor (VS Code recommended)

### Local Development

```bash
# Clone your fork
git clone https://github.com/opensubtitles/guessit-js.git
cd guessit-js

# Install dependencies
npm install

# Run tests
npm test

# Run demos
npm run demo
npm run demo:wasm

# Run benchmarks
npm run benchmark

# Start development server (for browser demos)
npm run dev
```

### WebAssembly Development

For WASM-related contributions, you'll need Emscripten:

```bash
# Install Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Build WASM module
npm run build:wasm
```

## 📋 Coding Standards

### JavaScript Style

- Use ES6+ modules
- Use `const` and `let` instead of `var`
- Use arrow functions where appropriate
- Use template literals for string interpolation
- Add JSDoc comments for public functions
- Follow existing code style

### Example:

```javascript
/**
 * Extracts metadata from video filename
 * @param {string} filename - The video filename to parse
 * @param {Object} options - Parsing options
 * @returns {Object} Extracted metadata
 */
export function guessit(filename, options = {}) {
    // Implementation here
}
```

### Testing

- Write tests for all new functionality
- Ensure tests cover edge cases
- Use descriptive test names
- Follow existing test patterns

### Example Test:

```javascript
test('should detect H.264 codec from x264 pattern', () => {
    const result = guessit('movie.x264.mkv');
    expect(result.video_codec).toBe('H.264');
});
```

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run simple tests
npm run test:simple

# Run benchmarks
npm run benchmark
```

### Test Categories

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: End-to-end parsing tests
3. **Performance Tests**: Benchmarking and memory tests
4. **Browser Tests**: Cross-browser compatibility

### Adding Tests

When adding new features:

1. Add unit tests for the specific functionality
2. Add integration tests with real filenames
3. Update test cases in `tests/test-runner.js`
4. Ensure Python GuessIt compatibility

## 📖 Documentation

### Updating README

- Keep examples up to date
- Update performance benchmarks
- Add new features to feature list
- Update installation instructions

### Code Documentation

- Add JSDoc comments for all public functions
- Include parameter types and descriptions
- Add usage examples where helpful
- Document any breaking changes

### Examples

When adding features, consider adding:

- Basic usage example in README
- Detailed example in `examples/` directory
- Browser demo if applicable
- CLI usage example

## 🚀 Release Process

### Version Numbers

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Update documentation
5. Create release commit
6. Tag the release
7. Publish to npm

## 🔍 Code Review Process

### Pull Request Guidelines

1. **Clear title** describing the change
2. **Detailed description** with context
3. **Link related issues**
4. **Include tests** for new functionality
5. **Update documentation** if needed

### Review Criteria

- Code quality and style
- Test coverage
- Performance impact
- Documentation quality
- Backward compatibility

## 🏆 Recognition

Contributors will be:

- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Credited in the README for major features

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: For security issues or private matters

### Development Questions

If you need help with development:

1. Check existing documentation
2. Search closed issues and PRs
3. Ask in GitHub Discussions
4. Create a new issue with the "question" label

## 🔒 Security

### Reporting Security Issues

For security vulnerabilities:

1. **Do not** create public issues
2. **Email** the maintainers directly
3. **Include** detailed reproduction steps
4. **Wait** for response before public disclosure

### Security Guidelines

- Never commit secrets or API keys
- Validate all user inputs
- Use secure coding practices
- Keep dependencies updated

## 📜 Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Be patient** with newcomers
- **Be collaborative** and helpful

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information

## 🎯 Contribution Ideas

### Good First Issues

- Adding new codec detection patterns
- Improving error messages
- Adding more test cases
- Updating documentation
- Fixing browser compatibility issues

### Advanced Contributions

- Performance optimizations
- New parsing algorithms
- WebAssembly improvements
- Advanced pattern matching
- Multi-language support

### Areas Needing Help

- Browser testing across different versions
- Performance optimization
- Documentation improvements
- Example applications
- Integration with other tools

## 🙏 Thank You

Your contributions make GuessIt JS better for everyone. Whether you're reporting bugs, suggesting features, writing code, or improving documentation, every contribution is valuable and appreciated!

---

**Happy Contributing!** 🎉