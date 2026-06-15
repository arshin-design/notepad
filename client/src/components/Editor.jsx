// 리치 텍스트 에디터 (contentEditable + execCommand 기반, 의존성 없음)
import { useEffect, useRef } from "react";

// 툴바 버튼 정의 (execCommand 명령)
const TOOLS = [
  { cmd: "bold", label: "B", title: "굵게", style: { fontWeight: "bold" } },
  { cmd: "italic", label: "I", title: "기울임", style: { fontStyle: "italic" } },
  {
    cmd: "underline",
    label: "U",
    title: "밑줄",
    style: { textDecoration: "underline" },
  },
  { cmd: "strikeThrough", label: "S", title: "취소선", style: { textDecoration: "line-through" } },
  { cmd: "insertUnorderedList", label: "• 목록", title: "글머리 목록" },
  { cmd: "insertOrderedList", label: "1. 목록", title: "번호 목록" },
  { cmd: "formatBlock:h2", label: "H", title: "제목" },
  { cmd: "formatBlock:blockquote", label: "❝", title: "인용" },
];

export default function Editor({ value, onChange }) {
  const ref = useRef(null);

  // 외부 value 가 바뀌면(다른 노트 선택 등) 에디터 내용 동기화
  // 단, 사용자가 타이핑 중인 동일 노트는 덮어쓰지 않도록 비교한다
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  // 툴바 명령 실행
  function exec(command) {
    if (command.startsWith("formatBlock:")) {
      const tag = command.split(":")[1];
      document.execCommand("formatBlock", false, tag);
    } else {
      document.execCommand(command, false, null);
    }
    // 명령 후 포커스 유지 및 변경 반영
    ref.current?.focus();
    emitChange();
  }

  function emitChange() {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  }

  return (
    <div className="editor">
      <div className="editor-toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.title}
            style={t.style}
            // mousedown 기본동작 방지로 선택영역 유지
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(t.cmd)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        data-placeholder="여기에 메모를 작성하세요..."
      />
    </div>
  );
}
