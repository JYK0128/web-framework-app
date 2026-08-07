/** @type {import('eslint').Rule.RuleModule} */
const importSingleLineRule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce import declarations to be written on a single line',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      singleLineImport: 'Import declarations must be on a single line.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ImportDeclaration(node) {
        if (node.loc.start.line === node.loc.end.line) return;

        // Skip if there are line comments (//) inside the import declaration
        const comments = sourceCode.getCommentsInside ? sourceCode.getCommentsInside(node) : [];
        if (comments.some((comment) => comment.type === 'Line')) return;

        context.report({
          node,
          messageId: 'singleLineImport',
          fix(fixer) {
            const rawText = sourceCode.getText(node);
            const singleLineText = rawText.trim().replace(/\s+/g, ' ');
            return fixer.replaceText(node, singleLineText);
          },
        });
      },
    };
  },
};

export default {
  rules: {
    'import-single-line': importSingleLineRule,
  },
};
