import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Get the base configurations from next/core-web-vitals
const baseConfigs = compat.extends("next/core-web-vitals");

// Transform the configurations to ensure parser is correctly placed
const eslintConfig = baseConfigs.map((config) => {
  // If FlatCompat places a resolved parser object directly under the 'parser' key,
  // it needs to be moved to 'languageOptions.parser' for ESLint flat config.
  if (
    config.parser &&
    typeof config.parser === "object" &&
    typeof config.parser.parse === "function"
  ) {
    const { parser: resolvedParser, languageOptions, ...restConfig } = config;
    return {
      ...restConfig,
      languageOptions: {
        ...languageOptions, // Preserve existing languageOptions
        parser: resolvedParser, // Assign the resolved parser here
      },
    };
  }
  return config;
});

export default eslintConfig;
