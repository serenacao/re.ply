---
timestamp: 'Thu Oct 30 2025 11:36:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_113630.b878360e.md]]'
content_id: e046475044a89763795e86042b4264a22662e857e70af41b6c19fd4581db2977
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@std/dotenv": "jsr:@std/dotenv@^0.225.5",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```
