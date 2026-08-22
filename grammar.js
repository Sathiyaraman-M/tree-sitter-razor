/**
 * @file Razor Grammar, particularly tuned towards Blazor flavour of Razor
 * @author Sathiyaraman-M <Sathiyaraman2003@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

import CSHARP from "tree-sitter-c-sharp/grammar.js";

export default grammar(CSHARP, {
  name: "razor",

  extras: $ => [$.razor_comment, $.comment, /\s+/],

  conflicts: ($, inherited) => [
    [$.expression, $.parenthesized_expression],
    [$.expression, $._parenthesized_lvalue_expression],
    [$.initializer_expression, $.razor_code_block],
    [$.destructor_declaration, $._simple_name],
    [$.field_declaration, $.local_declaration_statement],
    [$.method_declaration, $._local_function_declaration],
    [$.preproc_if, $.preproc_if_in_top_level, $.preproc_if_in_attribute_list],
    [$.preproc_if, $.preproc_if_in_top_level],
    [$.preproc_if, $.preproc_if_in_top_level, $.preproc_if_in_expression, $.preproc_if_in_attribute_list],
    [$.preproc_if, $.preproc_if_in_top_level, $.preproc_if_in_expression],
    [$.preproc_else, $.preproc_else_in_top_level, $.preproc_else_in_expression, $.preproc_else_in_attribute_list],
    [$.declaration, $.preproc_if_in_top_level],
    [$.type_declaration, $.declaration],
    [$.declaration, $.preproc_else_in_top_level],
    [$.preproc_elif, $.preproc_elif_in_top_level, $.preproc_elif_in_expression, $.preproc_elif_in_attribute_list],
    [$.scoped_type, $._reserved_identifier],
    [$.implicit_type, $._reserved_identifier],
    ...inherited,
  ],

  rules: {
    compilation_unit: $ => repeat(choice(
      $.newline,
      $.razor_comment,
      $.html_comment,
      $.page_directive,
      alias($.razor_using_directive, $.using_directive),
      $.inject_directive,
      $.layout_directive,
      $.inherits_directive,
      $.implements_directive,
      $.attribute_directive,
      $.directive_fallback,
      $.code_block,
      $.razor_code_block,
      $.control_block,
      $.html_element,
      $.component_element,
      $.razor_implicit_expression,
      $.razor_explicit_expression,
      $.text,
    )),

    newline: _ => /\n/,

    razor_comment: _ => token(seq(
      "@*",
      repeat(choice(
        /[^*]/,
        seq("*", /[^@]/),
      )),
      "*@",
    )),

    html_comment: _ => token(seq(
      "<!--",
      repeat(choice(
        /[^-]/,
        seq("-", /[^-]/),
      )),
      "-->",
    )),

    page_directive: $ => prec(1, seq(
      field("keyword", alias("@page", $.directive_keyword)),
      field("path", $.quoted_value),
    )),

    razor_using_directive: $ => prec(1, seq(
      field("keyword", alias("@using", $.directive_keyword)),
      optional(choice(
        alias("static", $.directive_modifier),
        seq(field("alias", $.identifier), "="),
      )),
      field("namespace", $.qualified_name),
    )),

    inject_directive: $ => prec(1, seq(
      field("keyword", alias("@inject", $.directive_keyword)),
      field("type", $.type),
      field("identifier", $.identifier),
    )),

    layout_directive: $ => prec(1, seq(
      field("keyword", alias("@layout", $.directive_keyword)),
      field("type", $.type),
    )),

    inherits_directive: $ => prec(1, seq(
      field("keyword", alias("@inherits", $.directive_keyword)),
      field("type", $.type),
    )),

    implements_directive: $ => prec(1, seq(
      field("keyword", alias("@implements", $.directive_keyword)),
      field("type", $.type),
    )),

    attribute_directive: $ => prec(1, seq(
      field("keyword", alias("@attribute", $.directive_keyword)),
      field("attribute", $.attribute_value),
    )),

    directive_fallback: $ => seq(
      field("keyword", $.directive_keyword),
      field("value", $.directive_value),
    ),

    directive_keyword: _ => token(/@(page|using|inject|layout|inherits|implements|attribute)/),

    directive_modifier: _ => token(/static/),

    directive_value: _ => token(prec(1, /[^\n]+/)),

    attribute_value: _ => token(prec(1, /[^\n]+/)),

    quoted_value: $ => seq(
      '"',
      repeat(choice(
        field("content", $.quoted_value_content),
        $.razor_explicit_expression,
        $.razor_implicit_expression,
      )),
      '"',
    ),

    // Keep this token low precedence so expression continuations such as
    // `(App).Assembly` are preferred after an implicit Razor transition.
    quoted_value_content: _ => token(prec(-1, /[^@"\n]+/)),

    code_block: $ => seq(
      "@code",
      "{",
      optional(field("body", $.csharp_code)),
      "}",
    ),

    razor_code_block: $ => seq(
      "@",
      "{",
      optional(field("body", $.csharp_code)),
      "}",
    ),

    // The outer braces are Razor delimiters. The contents use the native C#
    // declaration and statement rules, including their nested blocks.
    csharp_code: $ => repeat1(choice(
      $.declaration,
      $.statement,
    )),

    // Razor control-flow blocks contain a native C# header followed by markup.
    control_block: $ => choice(
      prec(10, seq(
        field("keyword", $.if_keyword),
        field("condition", $.control_condition),
        repeat($.newline),
        "{", repeat($._blazor_child), "}",
        optional(seq(
          field("else_keyword", $.else_keyword),
          repeat($.newline),
          "{", repeat($._blazor_child), "}",
        )),
      )),
      prec(10, seq(
        field("keyword", $.foreach_keyword),
        field("condition", $.foreach_condition),
        repeat($.newline), "{", repeat($._blazor_child), "}",
      )),
      prec(10, seq(
        field("keyword", $.for_keyword),
        field("condition", $.for_condition),
        repeat($.newline), "{", repeat($._blazor_child), "}",
      )),
      prec(10, seq(
        field("keyword", $.while_keyword),
        field("condition", $.control_condition),
        repeat($.newline), "{", repeat($._blazor_child), "}",
      )),
      prec(10, seq(
        field("keyword", $.switch_keyword),
        field("condition", $.control_condition),
        repeat($.newline), "{", repeat($._blazor_child), "}",
      )),
    ),

    control_condition: $ => seq("(", $.expression, ")"),

    foreach_condition: $ => seq(
      "(",
      choice(
        seq(
          field("type", $.type),
          field("left", choice($.identifier, $.tuple_pattern)),
        ),
        field("left", $.expression),
      ),
      "in",
      field("right", $.expression),
      ")",
    ),

    for_condition: $ => $._for_statement_conditions,

    if_keyword: _ => token(prec(20, "@if")),
    else_keyword: _ => token(prec(20, "else")),
    foreach_keyword: _ => token(prec(20, "@foreach")),
    for_keyword: _ => token(prec(20, "@for")),
    while_keyword: _ => token(prec(20, "@while")),
    switch_keyword: _ => token(prec(20, "@switch")),

    _blazor_child: $ => choice(
      $.newline,
      $.razor_comment,
      $.html_comment,
      $.control_block,
      $.razor_code_block,
      $.html_element,
      $.component_element,
      $.razor_implicit_expression,
      $.razor_explicit_expression,
      $.statement,
      $.declaration,
      $.control_text,
    ),

    control_text: _ => token(prec(-1, /[^@<{}\n]+/)),

    html_element: $ => choice(
      seq(
        field("open", $.html_tag_open),
        repeat($._markup_child),
        field("close", $.html_tag_close),
      ),
      field("open", $.html_self_closing_tag_open),
    ),

    component_element: $ => choice(
      seq(
        field("open", $.component_tag_open),
        repeat($._markup_child),
        field("close", $.component_tag_close),
      ),
      field("open", $.component_self_closing_tag_open),
    ),

    _markup_child: $ => choice(
      $.newline,
      $.razor_comment,
      $.html_comment,
      $.control_block,
      $.razor_code_block,
      $.html_element,
      $.component_element,
      $.razor_implicit_expression,
      $.razor_explicit_expression,
      $.text,
    ),

    html_tag_open: $ => seq(
      "<",
      field("name", $.html_tag_name),
      repeat(choice($.html_attribute, $.razor_attribute, $.newline)),
      ">",
    ),

    component_tag_open: $ => seq(
      "<",
      field("name", $.component_tag_name),
      repeat(choice($.component_parameter, $.razor_attribute, $.newline)),
      ">",
    ),

    html_self_closing_tag_open: $ => seq(
      "<",
      field("name", $.html_tag_name),
      repeat(choice($.html_attribute, $.razor_attribute, $.newline)),
      "/>",
    ),

    component_self_closing_tag_open: $ => seq(
      "<",
      field("name", $.component_tag_name),
      repeat(choice($.component_parameter, $.razor_attribute, $.newline)),
      "/>",
    ),

    html_tag_close: $ => seq(
      "</",
      field("name", $.html_tag_name),
      ">",
    ),

    component_tag_close: $ => seq(
      "</",
      field("name", $.component_tag_name),
      ">",
    ),

    html_tag_name: _ => /[a-z][A-Za-z0-9_.:-]*/,

    component_tag_name: _ => /[A-Z][A-Za-z0-9_.:-]*/,

    html_attribute: $ => seq(
      field("name", $.html_attribute_name),
      optional(seq(
        "=",
        field("value", choice($.quoted_value, $.unquoted_value)),
      )),
    ),

    component_parameter: $ => seq(
      field("name", $.component_parameter_name),
      optional(seq(
        "=",
        field("value", choice($.quoted_value, $.unquoted_value)),
      )),
    ),

    razor_attribute: $ => seq(
      field("name", $.razor_attribute_name),
      optional(seq(
        "=",
        field("value", choice($.quoted_value, $.unquoted_value)),
      )),
    ),

    html_attribute_name: _ => /[A-Za-z_:][A-Za-z0-9_.:-]*/,

    component_parameter_name: _ => /[A-Za-z_:][A-Za-z0-9_.:-]*/,

    razor_attribute_name: _ => /@[A-Za-z_:][A-Za-z0-9_.:@-]*/,

    unquoted_value: _ => token(prec(1, /[^\s>"']+/)),

    razor_implicit_expression: $ => seq(
      "@",
      field("body", prec.left(1, $.expression)),
    ),

    razor_explicit_expression: $ => seq(
      "@",
      "(",
      optional(field("body", $.expression)),
      ")",
    ),

    text: _ => token(prec(-1, /[^@<\n]+/)),
  }
});
