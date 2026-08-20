/**
 * @file Razor Grammar, particularly tuned towards Blazor flavour of Razor
 * @author Sathiyaraman-M <Sathiyaraman2003@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "razor",

  extras: $ => [/[ \t\r]/],

  rules: {
    source_file: $ => repeat(choice(
      $.newline,
      $.directive,
      $.code_block,
      $.markup_element,
      $.razor_expression,
      $.text,
    )),

    newline: _ => /\n/,

    directive: $ => choice(
      seq("@page", field("value", $.quoted_value)),
      seq("@using", field("value", $.directive_value)),
      seq("@inject", field("value", $.directive_value)),
      seq("@layout", field("value", $.directive_value)),
      seq("@inherits", field("value", $.directive_value)),
      seq("@attribute", field("value", $.directive_value)),
    ),

    directive_value: _ => token(prec(1, /[^\n]+/)),

    quoted_value: $ => seq(
      '"',
      optional(field("content", $.quoted_value_content)),
      '"',
    ),

    quoted_value_content: _ => token(prec(1, /[^"\n]+/)),

    code_block: $ => seq(
      "@code",
      "{",
      optional(field("body", $.csharp_code)),
      "}",
    ),

    // Balanced braces keep method bodies and other nested C# blocks together.
    // The outer braces are Razor delimiters and are excluded from the
    // injected range.
    csharp_code: $ => repeat1(choice($.csharp_block, $.csharp_text)),

    csharp_block: $ => seq(
      "{",
      repeat(choice($.csharp_block, $.csharp_text)),
      "}",
    ),

    csharp_text: _ => token(prec(-1, /[^{}]+/)),

    markup_element: $ => seq(
      field("open", $.tag_open),
      repeat(choice(
        $.newline,
        $.markup_element,
        $.razor_expression,
        $.text,
      )),
      field("close", $.tag_close),
    ),

    tag_open: $ => seq(
      "<",
      field("name", $.tag_name),
      repeat($.attribute),
      optional("/"),
      ">",
    ),

    tag_close: $ => seq(
      "</",
      field("name", $.tag_name),
      ">",
    ),

    tag_name: _ => /[A-Za-z][A-Za-z0-9_.:-]*/,

    attribute: $ => seq(
      field("name", $.attribute_name),
      optional(seq(
        "=",
        field("value", choice($.quoted_value, $.unquoted_value)),
      )),
    ),

    attribute_name: _ => /@?[A-Za-z_:][A-Za-z0-9_.:@-]*/,

    unquoted_value: _ => token(prec(1, /[^\s>"']+/)),

    razor_expression: $ => seq(
      "@",
      field("name", $.identifier),
    ),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    text: _ => token(prec(-1, /[^@<\n]+/)),
  }
});
