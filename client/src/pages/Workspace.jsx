// 메인 작업 화면 - 사이드바(노트북/태그) + 노트목록 + 에디터 3분할
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Editor from "../components/Editor.jsx";

export default function Workspace() {
  const { user, logout } = useAuth();

  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null); // 현재 편집 중인 노트 객체

  // 필터 상태
  const [filter, setFilter] = useState({ type: "all", id: null, label: "모든 노트" });
  const [search, setSearch] = useState("");

  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const saveTimer = useRef(null);

  // 사이드바 데이터 로드
  const loadSidebar = useCallback(async () => {
    const [nb, tg] = await Promise.all([
      api.get("/notebooks"),
      api.get("/tags"),
    ]);
    setNotebooks(nb);
    setTags(tg);
  }, []);

  // 노트 목록 로드 (필터/검색 반영)
  const loadNotes = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.type === "notebook") {
      params.set("notebookId", filter.id);
    }
    if (filter.type === "tag") {
      params.set("tagId", filter.id);
    }
    if (search.trim()) {
      params.set("q", search.trim());
    }
    const query = params.toString();
    const data = await api.get(`/notes${query ? `?${query}` : ""}`);
    setNotes(data);
  }, [filter, search]);

  useEffect(() => {
    loadSidebar();
  }, [loadSidebar]);

  // 필터/검색 변경 시 노트 목록 갱신 (검색은 디바운스)
  useEffect(() => {
    const t = setTimeout(() => {
      loadNotes();
    }, 250);
    return () => clearTimeout(t);
  }, [loadNotes]);

  // 노트 선택
  async function selectNote(id) {
    const note = await api.get(`/notes/${id}`);
    setSelected(note);
    setSaveState("idle");
  }

  // 새 노트 생성
  async function createNote() {
    const notebookId = filter.type === "notebook" ? filter.id : null;
    const note = await api.post("/notes", {
      title: "제목 없음",
      content: "",
      notebookId,
      tags: [],
    });
    await loadNotes();
    await loadSidebar();
    setSelected(note);
  }

  // 선택 노트의 필드 변경 → 로컬 반영 + 디바운스 저장
  function updateField(patch) {
    setSelected((prev) => {
      const next = { ...prev, ...patch };
      scheduleSave(next);
      return next;
    });
  }

  // 디바운스 자동 저장
  function scheduleSave(note) {
    setSaveState("saving");
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      saveNote(note);
    }, 700);
  }

  async function saveNote(note) {
    try {
      const tagNames = (note.tags || []).map((t) =>
        typeof t === "string" ? t : t.name
      );
      const saved = await api.put(`/notes/${note.id}`, {
        title: note.title,
        content: note.content,
        notebookId: note.notebookId || null,
        tags: tagNames,
      });
      setSaveState("saved");
      // 목록/사이드바 갱신 (제목·태그 변경 반영)
      await loadNotes();
      await loadSidebar();
      // 선택 노트의 태그 객체를 서버 기준으로 동기화
      setSelected((prev) => (prev && prev.id === saved.id ? { ...prev, tags: saved.tags } : prev));
    } catch (err) {
      setSaveState("idle");
      alert("저장 실패: " + err.message);
    }
  }

  // 노트 삭제
  async function deleteNote(id) {
    if (!confirm("이 노트를 삭제할까요?")) {
      return;
    }
    await api.del(`/notes/${id}`);
    setSelected(null);
    await loadNotes();
    await loadSidebar();
  }

  // 노트북 생성
  async function addNotebook() {
    const name = prompt("새 노트북 이름");
    if (!name || !name.trim()) {
      return;
    }
    await api.post("/notebooks", { name: name.trim() });
    await loadSidebar();
  }

  // 노트북 삭제
  async function removeNotebook(e, id) {
    e.stopPropagation();
    if (!confirm("노트북을 삭제할까요? (안의 노트는 유지됩니다)")) {
      return;
    }
    await api.del(`/notebooks/${id}`);
    if (filter.type === "notebook" && filter.id === id) {
      setFilter({ type: "all", id: null, label: "모든 노트" });
    }
    await loadSidebar();
    await loadNotes();
  }

  // 태그 입력 처리 (쉼표 또는 엔터로 구분된 문자열 → 배열)
  function handleTagsInput(text) {
    const names = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField({ tags: names.map((name) => ({ name })) });
  }

  return (
    <div className="workspace">
      {/* 좌측 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-header">📓 내 메모장</div>

        <button className="new-note-btn" onClick={createNote}>
          ＋ 새 노트
        </button>

        <nav className="nav-section">
          <div
            className={`nav-item ${filter.type === "all" ? "active" : ""}`}
            onClick={() => setFilter({ type: "all", id: null, label: "모든 노트" })}
          >
            🗒️ 모든 노트
          </div>
        </nav>

        <div className="nav-section">
          <div className="nav-title">
            <span>노트북</span>
            <button className="icon-btn" onClick={addNotebook} title="노트북 추가">
              ＋
            </button>
          </div>
          {notebooks.map((nb) => (
            <div
              key={nb.id}
              className={`nav-item ${
                filter.type === "notebook" && filter.id === nb.id ? "active" : ""
              }`}
              onClick={() =>
                setFilter({ type: "notebook", id: nb.id, label: nb.name })
              }
            >
              <span>📁 {nb.name}</span>
              <span className="nav-meta">
                <span className="count">{nb._count?.notes ?? 0}</span>
                <button
                  className="icon-btn danger"
                  onClick={(e) => removeNotebook(e, nb.id)}
                  title="삭제"
                >
                  ×
                </button>
              </span>
            </div>
          ))}
          {notebooks.length === 0 && (
            <div className="nav-empty">노트북이 없습니다</div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-title">
            <span>태그</span>
          </div>
          {tags.map((tg) => (
            <div
              key={tg.id}
              className={`nav-item ${
                filter.type === "tag" && filter.id === tg.id ? "active" : ""
              }`}
              onClick={() => setFilter({ type: "tag", id: tg.id, label: `#${tg.name}` })}
            >
              <span># {tg.name}</span>
              <span className="count">{tg._count?.notes ?? 0}</span>
            </div>
          ))}
          {tags.length === 0 && <div className="nav-empty">태그가 없습니다</div>}
        </div>

        <div className="sidebar-footer">
          <span className="user-name">{user?.name || user?.email}</span>
          <button className="logout-btn" onClick={logout}>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 가운데 노트 목록 */}
      <section className="note-list">
        <div className="list-header">
          <input
            className="search-box"
            type="search"
            placeholder="🔍 제목·본문 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="list-title">{filter.label}</div>
        <div className="list-items">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`list-item ${selected?.id === note.id ? "active" : ""}`}
              onClick={() => selectNote(note.id)}
            >
              <div className="item-title">{note.title || "제목 없음"}</div>
              <div className="item-preview">{stripHtml(note.content)}</div>
              <div className="item-meta">
                {note.notebook && <span className="badge">📁 {note.notebook.name}</span>}
                {note.tags?.map((t) => (
                  <span key={t.id} className="badge tag">#{t.name}</span>
                ))}
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="list-empty">노트가 없습니다. 새 노트를 만들어보세요.</div>
          )}
        </div>
      </section>

      {/* 우측 에디터 */}
      <section className="note-editor">
        {selected ? (
          <>
            <div className="editor-header">
              <input
                className="title-input"
                value={selected.title}
                placeholder="제목 없음"
                onChange={(e) => updateField({ title: e.target.value })}
              />
              <div className="editor-actions">
                <span className="save-state">
                  {saveState === "saving" && "저장 중..."}
                  {saveState === "saved" && "✓ 저장됨"}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => deleteNote(selected.id)}
                >
                  🗑 삭제
                </button>
              </div>
            </div>

            <div className="editor-fields">
              <label>
                노트북
                <select
                  value={selected.notebookId || ""}
                  onChange={(e) => updateField({ notebookId: e.target.value || null })}
                >
                  <option value="">(없음)</option>
                  {notebooks.map((nb) => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tags-field">
                태그
                <input
                  type="text"
                  placeholder="쉼표로 구분 (예: 업무, 아이디어)"
                  value={(selected.tags || [])
                    .map((t) => (typeof t === "string" ? t : t.name))
                    .join(", ")}
                  onChange={(e) => handleTagsInput(e.target.value)}
                />
              </label>
            </div>

            <Editor
              value={selected.content}
              onChange={(html) => updateField({ content: html })}
            />
          </>
        ) : (
          <div className="editor-empty">
            <p>왼쪽에서 노트를 선택하거나</p>
            <button onClick={createNote}>새 노트 만들기</button>
          </div>
        )}
      </section>
    </div>
  );
}

// HTML 태그를 제거해 미리보기 텍스트를 만든다
function stripHtml(html) {
  if (!html) {
    return "";
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").slice(0, 100);
}
