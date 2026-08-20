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
      $.control_block,
      $.self_closing_markup_element,
      $.markup_element,
      $.razor_implicit_expression,
      $.razor_explicit_expression,
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
      repeat(choice(
        field("content", $.quoted_value_content),
        $.razor_explicit_expression,
        $.razor_implicit_expression,
      )),
      '"',
    ),

    quoted_value_content: _ => token(prec(1, /[^@"\n]+/)),

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

    // Razor control-flow blocks contain a C# header followed by markup.
    // Keep the header and body delimiters out of the injected C# range; only
    // @code blocks are injected as complete C# documents for now.
    control_block: $ => seq(
      field("keyword", choice(
        "@if",
        "@foreach",
        "@for",
        "@while",
        "@switch",
      )),
      field("condition", $.control_condition),
      repeat($.newline),
      "{",
      repeat(choice(
        $.newline,
        $.control_block,
        $.self_closing_markup_element,
        $.markup_element,
        $.razor_implicit_expression,
        $.razor_explicit_expression,
        $.control_text,
      )),
      "}",
    ),

    control_condition: _ => token(prec(1, /[^{}\n]+/)),

    control_text: _ => token(prec(-1, /[^@<{}\n]+/)),

    markup_element: $ => seq(
      field("open", $.tag_open),
      repeat(choice(
        $.newline,
        $.control_block,
        $.self_closing_markup_element,
        $.markup_element,
        $.razor_implicit_expression,
        $.razor_explicit_expression,
        $.text,
      )),
      field("close", $.tag_close),
    ),

    self_closing_markup_element: $ => seq(
      field("open", $.self_closing_tag_open),
    ),

    tag_open: $ => seq(
      "<",
      field("name", $.tag_name),
      repeat(choice($.attribute, $.newline)),
      ">",
    ),

    self_closing_tag_open: $ => seq(
      "<",
      field("name", $.tag_name),
      repeat(choice($.attribute, $.newline)),
      "/>",
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

    // An implicit Razor expression starts with an identifier and may contain
    // a simple member-access chain. More complete C# syntax belongs to the
    // injected C# grammar or an explicit expression.
    razor_implicit_expression: $ => seq(
      "@",
      field("name", $.identifier),
      repeat(seq(".", $.identifier)),
    ),

    // Parenthesized expressions are kept as a distinct Razor node so editors
    // can style the Razor transition independently from ordinary text.
    razor_explicit_expression: $ => seq(
      "@",
      "(",
      optional(field("body", $.csharp_expression)),
      ")",
    ),

    csharp_expression: $ => repeat1(choice(
      $.csharp_parenthesized_expression,
      $.csharp_expression_text,
    )),

    csharp_parenthesized_expression: $ => seq(
      "(",
      optional($.csharp_expression),
      ")",
    ),

    csharp_expression_text: _ => token(prec(-1, /[^()"\n]+/)),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    text: _ => token(prec(-1, /[^@<\n]+/)),
  }
});
