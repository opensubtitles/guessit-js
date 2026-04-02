// WASM entry point for Javy v3
// Reads JSON from stdin, writes JSON result to stdout

// Read stdin into buffer
var chunks = [];
var buf = new Uint8Array(4096);
var n;
while ((n = Javy.IO.readSync(0, buf)) > 0) {
  chunks.push(buf.slice(0, n));
}
var totalLen = 0;
for (var c = 0; c < chunks.length; c++) totalLen += chunks[c].length;
var inputBytes = new Uint8Array(totalLen);
var offset = 0;
for (var c = 0; c < chunks.length; c++) {
  inputBytes.set(chunks[c], offset);
  offset += chunks[c].length;
}

var inputStr = new TextDecoder().decode(inputBytes);

var input;
try {
  input = JSON.parse(inputStr);
} catch(e) {
  input = { filename: inputStr.trim() };
}

var filename = typeof input === 'string' ? input : (input.filename || "");
var options = (typeof input === 'object' && input !== null && input.options) ? input.options : {};
var output;

if (!filename) {
  output = JSON.stringify({ error: "filename is required" });
} else {
  try {
    var result = guessit(filename, options);
    // Fix Date serialization: QuickJS outputs lowercase 't'/'z' in ISO strings
    output = JSON.stringify(result, function(key, val) {
      if (val && typeof val === 'object' && typeof val.toISOString === 'function') {
        var iso = val.toISOString();
        // Normalize to uppercase T and Z (V8 convention)
        return iso.replace(/t/, 'T').replace(/z$/, 'Z');
      }
      return val;
    });
  } catch(e) {
    output = JSON.stringify({ error: String(e) });
  }
}

var outBytes = new TextEncoder().encode(output + "\n");
Javy.IO.writeSync(1, outBytes);
