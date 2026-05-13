using System.Collections.Generic;
using System.Text;

namespace TheVault.Core.Utilities
{
    // Unity's JsonUtility cannot deserialise Dictionary<string, T>. Our
    // bridge config has a free-form "settings" object, but it is constrained
    // (in TS) to flat string/number/boolean values. This helper extracts
    // exactly that flat shape into a Dictionary<string,string>; values are
    // stored as their raw JSON textual form (numbers/booleans included).
    //
    // Not a general JSON parser. Tolerates whitespace, escaped quotes, and
    // string values containing braces, which is all the bridge contract
    // promises.
    public static class JsonHelper
    {
        public static Dictionary<string, string> ExtractFlatStringMap(string json, string objectKey)
        {
            var result = new Dictionary<string, string>();
            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(objectKey)) return result;

            // Find `"<objectKey>"` then the opening brace of its value.
            var keyToken = "\"" + objectKey + "\"";
            var keyIdx = json.IndexOf(keyToken, System.StringComparison.Ordinal);
            if (keyIdx < 0) return result;

            var braceIdx = json.IndexOf('{', keyIdx + keyToken.Length);
            if (braceIdx < 0) return result;

            // Walk the object, respecting nested braces and quoted strings.
            var depth = 0;
            var end = -1;
            var inString = false;
            for (var i = braceIdx; i < json.Length; i++)
            {
                var c = json[i];
                if (inString)
                {
                    if (c == '\\') { i++; continue; }
                    if (c == '"') inString = false;
                    continue;
                }
                if (c == '"') { inString = true; continue; }
                if (c == '{') depth++;
                else if (c == '}') { depth--; if (depth == 0) { end = i; break; } }
            }
            if (end < 0) return result;

            var body = json.Substring(braceIdx + 1, end - braceIdx - 1);
            ParseFlatObject(body, result);
            return result;
        }

        private static void ParseFlatObject(string body, Dictionary<string, string> dest)
        {
            var i = 0;
            while (i < body.Length)
            {
                SkipWs(body, ref i);
                if (i >= body.Length) return;
                if (body[i] != '"') { i++; continue; }
                i++;
                var key = ReadString(body, ref i);
                SkipWs(body, ref i);
                if (i >= body.Length || body[i] != ':') return;
                i++;
                SkipWs(body, ref i);
                if (i >= body.Length) return;

                string value;
                if (body[i] == '"')
                {
                    i++;
                    value = ReadString(body, ref i);
                }
                else
                {
                    // Number, true, false, or null — read until comma / end.
                    var sb = new StringBuilder();
                    while (i < body.Length && body[i] != ',' && body[i] != '}')
                    {
                        if (!char.IsWhiteSpace(body[i])) sb.Append(body[i]);
                        i++;
                    }
                    value = sb.ToString();
                }
                if (value == null || value == "null")
                {
                    // Skip null values.
                }
                else
                {
                    dest[key] = value;
                }
                SkipWs(body, ref i);
                if (i < body.Length && body[i] == ',') i++;
            }
        }

        private static string ReadString(string body, ref int i)
        {
            var sb = new StringBuilder();
            while (i < body.Length)
            {
                var c = body[i];
                if (c == '\\' && i + 1 < body.Length)
                {
                    var next = body[i + 1];
                    sb.Append(next switch
                    {
                        'n' => '\n', 't' => '\t', 'r' => '\r',
                        '"' => '"',  '\\' => '\\', '/' => '/',
                        _   => next,
                    });
                    i += 2;
                    continue;
                }
                if (c == '"') { i++; return sb.ToString(); }
                sb.Append(c);
                i++;
            }
            return sb.ToString();
        }

        private static void SkipWs(string body, ref int i)
        {
            while (i < body.Length && char.IsWhiteSpace(body[i])) i++;
        }
    }
}
