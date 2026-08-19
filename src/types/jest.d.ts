// Pulls the jest globals (describe/it/expect) into the project's type space
// without setting compilerOptions.types, which would switch off automatic
// inclusion of every other @types package.
/// <reference types="jest" />
