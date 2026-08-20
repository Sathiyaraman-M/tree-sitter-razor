/**
 * @file Razor Grammar, particularly tuned towards Blazor flavour of Razor
 * @author Sathiyaraman-M <Sathiyaraman2003@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "razor",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
