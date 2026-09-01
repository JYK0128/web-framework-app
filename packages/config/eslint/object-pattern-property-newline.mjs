/** @type {import('eslint').Rule.RuleModule} */
const objectPatternPropertyNewlineRule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Require one property per line in multiline object patterns',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      propertyNewline: 'Object pattern properties must go on separate lines.',
    },
  },
  create(context) {
    return {
      ObjectPattern(node) {
        if (node.loc.start.line === node.loc.end.line || node.properties.length < 2) return;

        const hasPropertyLineBreak = node.properties.some(
          (property, index) => index > 0 && node.properties[index - 1].loc.end.line !== property.loc.start.line,
        );

        if (!hasPropertyLineBreak) return;

        for (let index = 1; index < node.properties.length; index += 1) {
          const previous = node.properties[index - 1];
          const property = node.properties[index];

          if (previous.loc.end.line !== property.loc.start.line) continue;

          context.report({
            node: property,
            messageId: 'propertyNewline',
            fix(fixer) {
              const indent = ' '.repeat(node.properties[0].loc.start.column);
              return fixer.insertTextBefore(property, `\n${indent}`);
            },
          });
        }
      },
    };
  },
};

export default {
  rules: {
    'object-pattern-property-newline': objectPatternPropertyNewlineRule,
  },
};
