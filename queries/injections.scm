((code_block
  body: (csharp_code) @injection.content)
 (#set! injection.language "c_sharp"))

((razor_explicit_expression
  body: (csharp_expression) @injection.content)
 (#set! injection.language "c_sharp"))

((razor_implicit_expression
  body: (csharp_implicit_expression) @injection.content)
 (#set! injection.language "c_sharp"))

((control_block
  condition: (control_condition) @injection.content)
 (#set! injection.language "c_sharp"))
