---
name: notebooklm-expert
description: Expert in using the NotebookLM MCP for creating notebooks, managing sources, retrieving context, executing deep research, and generating Studio artifacts (Audio Podcasts, Documents, etc.).
allowed-tools: mcp_notebooklm-mcp_*, Bash
---

# NotebookLM Expert Pattern

> Guidelines for interacting with the NotebookLM MCP server to manage notebooks, upload sources, and leverage Google's NotebookLM AI for research and content generation.

---

## 1. Authentication & Setup

Before using the NotebookLM tools, ensure the MCP is authenticated.
- **Preferred Method:** If you get an authentication error, use the `run_command` (Bash) tool to run \`nlm login\` in the terminal. This provides an automated login flow using the user's Chrome profile.
- **Fallback:** Use `mcp_notebooklm-mcp_save_auth_tokens` ONLY if the CLI method fails.

---

## 2. Core Entities & Concepts

1. **Notebook (`notebook_id`)**: A workspace that holds a collection of sources and notes.
2. **Source (`source_id`)**: The grounding material (URLs, PDFs, Text, Drive files) uploaded to a notebook. NotebookLM's AI strictly answers based on these sources.
3. **Note (`note_id`)**: Text snippets saved within a notebook.
4. **Studio Artifact**: Generated content based on sources (e.g., Audio Podcasts/Deep Dives, Video overviews, Reports, Flashcards, Quizzes).
5. **Research Task (`task_id`)**: A background operation that searches the web or drive for NEW sources to import into a notebook.

---

## 3. Common Workflows

### A. Creating a Notebook & Adding Sources

When asked to analyze websites, documents, or create a knowledge base:
1. `mcp_notebooklm-mcp_notebook_create(title="My Project")` -> returns `notebook_id`.
2. `mcp_notebooklm-mcp_source_add(notebook_id, source_type="url", url="https://...", wait=True)`
   - **CRITICAL:** Always use `wait=True` when adding sources so they are fully indexed before you query them.
   - Supported `source_type`: `url`, `text`, `file` (local path), `drive`.
3. `mcp_notebooklm-mcp_notebook_query(notebook_id, query="Summarize the key points")` 
   - Use this to ask questions strictly against the uploaded sources.

### B. Deep Research (Finding New Sources)

Use this when the user asks to "research a topic" or "find sources about X":
1. `mcp_notebooklm-mcp_research_start(query="Quantum computing", source="web", mode="deep", notebook_id="...")` -> returns `task_id`.
2. _Optional:_ Poll for completion using `mcp_notebooklm-mcp_research_status(notebook_id, task_id)`.
3. `mcp_notebooklm-mcp_research_import(notebook_id, task_id)` -> Imports the newly discovered sources into your notebook.

### C. Generating Studio Content (Audio Podcasts / Reports)

NotebookLM excels at turning sources into engaging content.
1. Add relevant sources to a notebook first.
2. `mcp_notebooklm-mcp_studio_create(notebook_id, artifact_type="audio", confirm=True)`
   - *Supported `artifact_type`:* `audio` (Podcast Deep Dive), `video`, `infographic`, `slide_deck`, `report`, `flashcards`, `quiz`, `data_table`, `mind_map`.
   - *Requires:* User confirmation usually means setting `confirm=True`.
3. Wait for generation to finish by polling `mcp_notebooklm-mcp_studio_status(notebook_id)`.
4. Once completed, use `mcp_notebooklm-mcp_download_artifact(notebook_id, artifact_type, output_path)` to save the final file locally.

---

## 4. Best Practices & Rules

1. **Wait for Sources:** Never query a notebook immediately after adding a source unless `wait=True` was used.
2. **Read Content Fast:** If you just need the raw text (no AI processing) of a URL or file after adding it, use `mcp_notebooklm-mcp_source_get_content`—it is much faster and cheaper than `notebook_query`.
3. **Permanent Deletions:** Tools like `notebook_delete`, `source_delete`, and `note_delete` are IRREVERSIBLE and require `confirm=True`. Verify with the user before deleting anything unless instructed otherwise.
4. **Notebook Descriptions:** If you enter a new workspace, use `mcp_notebooklm-mcp_notebook_describe` or `mcp_notebooklm-mcp_source_describe` for a quick AI-generated overview of what the notebook/source contains.

---

## 5. Typical Tool Signatures (Quick Reference)

- **notebook_query**: `(notebook_id: str, query: str)`
- **source_add**: `(notebook_id: str, source_type: str, url/text/file_path: str, wait=True)`
- **studio_create**: `(notebook_id: str, artifact_type: str, title/audio_format/etc: str, confirm=True)`
- **download_artifact**: `(notebook_id: str, artifact_type: str, output_path: str)`
