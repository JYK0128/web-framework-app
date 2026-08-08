import { expandTypesMap, register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';

void register(StyleDictionary);
StyleDictionary.registerFormat({
  name: 'css/tailwind-v4-theme',
  format: function ({ dictionary }) {
    const variables = dictionary.allTokens.map((token) => {
      return `  --${token.name}: ${token.$value};`;
    }).join('\n');

    return `@theme {\n${variables}\n}\n`;
  },
});

const sd = new StyleDictionary({
  source: ['./src/tokens/**/*.json'],
  preprocessors: ['tokens-studio'],
  expand: { typesMap: expandTypesMap },
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      transforms: ['name/kebab'],
      buildPath: './src',
      files: [
        {
          destination: 'variables.css',
          format: 'css/tailwind-v4-theme',
        },
      ],
    },
  },
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
