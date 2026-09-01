function isGeneratedSourcePath(sourcePath) {
  if (typeof sourcePath !== 'string') return false;
  return /(?:^|\/)\.?generated(?:$|\/)/i.test(sourcePath);
}

function isTypeReferenceToImportedModel(node, importedGeneratedNames) {
  return node.type === 'TSTypeReference'
    && node.typeName.type === 'Identifier'
    && importedGeneratedNames.has(node.typeName.name);
}

export default {
  rules: {
    'no-alias-for-generated-types': {
      meta: {
        type: 'problem',
        docs: {
          description: 'disallow direct type aliases for generated model imports',
        },
        schema: [],
        messages: {
          directAlias: 'Do not create a direct type alias for generated model type "{{target}}". Use the generated type name directly.',
        },
      },
      create(context) {
        return {
          Program(node) {
            const importedGeneratedNames = new Set();

            for (const statement of node.body) {
              if (statement.type !== 'ImportDeclaration' || !isGeneratedSourcePath(statement.source.value)) {
                continue;
              }

              for (const specifier of statement.specifiers) {
                if (specifier.type === 'ImportSpecifier') {
                  importedGeneratedNames.add(specifier.local.name);
                }
              }
            }

            for (const statement of node.body) {
              if (statement.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'TSTypeAliasDeclaration') {
                continue;
              }

              const { declaration } = statement;

              if (isTypeReferenceToImportedModel(declaration.typeAnnotation, importedGeneratedNames)) {
                context.report({
                  node: declaration,
                  messageId: 'directAlias',
                  data: {
                    target: declaration.typeAnnotation.typeName.name,
                  },
                });
              }
            }
          },
        };
      },
    },
  },
};
