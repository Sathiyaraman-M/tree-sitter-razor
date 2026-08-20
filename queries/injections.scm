((code_block
  body: (csharp_code) @injection.content)
 (#set! injection.language "c_sharp"))

((razor_explicit_expression
  body: (csharp_expression) @injection.content)
 (#set! injection.language "c_sharp"))
